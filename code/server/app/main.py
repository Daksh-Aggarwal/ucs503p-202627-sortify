"""Sortify's small, mobile-facing YOLO detection API.

The detector's class IDs are a versioned contract with the React Native client.
Do not change their order without updating src/services/recognition.ts too.
"""

from __future__ import annotations

import io
import os
import pickle
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from ultralytics import YOLO

SORTIFY_CLASS_NAMES = {
    0: "paper",
    1: "cardboard",
    2: "glass",
    3: "metal",
    4: "plastic_bottle",
    5: "plastic_bag",
    6: "sanitary_ppe_waste",
    7: "organic",
    8: "battery_ewaste",
    9: "hazardous_medical",
}
# The downloaded yolo11s.pt is an 80-class COCO checkpoint, not the report's trained
# ten-class checkpoint. These conservative aliases make it useful for a college-demo
# integration without pretending it is the final waste model.
COCO_TO_SORTIFY_CLASS_IDS = {
    39: 4,  # bottle -> plastic_bottle
    40: 2,  # wine glass -> glass
    42: 3,  # fork -> metal
    43: 3,  # knife -> metal
    44: 3,  # spoon -> metal
    46: 7,  # banana -> organic
    47: 7,  # apple -> organic
    49: 7,  # orange -> organic
    50: 7,  # broccoli -> organic
    51: 7,  # carrot -> organic
    52: 7,  # hot dog -> organic
    53: 7,  # pizza -> organic
    54: 7,  # donut -> organic
    55: 7,  # cake -> organic
    63: 8,  # laptop -> e-waste
    64: 8,  # mouse -> e-waste
    65: 8,  # remote -> e-waste
    66: 8,  # keyboard -> e-waste
    67: 8,  # cell phone -> e-waste
    73: 0,  # book -> paper
}
MODEL_PATH = Path(os.getenv("MODEL_PATH", "models/best.pt"))
MODEL_CONFIDENCE = float(os.getenv("MODEL_CONFIDENCE", "0.25"))
MODEL_IOU = float(os.getenv("MODEL_IOU", "0.45"))
MAX_IMAGE_BYTES = 10 * 1024 * 1024

app = FastAPI(title="Sortify Detector", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@dataclass(frozen=True)
class LoadedModel:
    model: Any
    profile: str
    names: dict[int, str]


def as_class_names(names: Any) -> dict[int, str]:
    if isinstance(names, dict):
        return {int(class_id): str(name) for class_id, name in names.items()}
    if isinstance(names, list):
        return dict(enumerate(str(name) for name in names))
    raise RuntimeError("The model does not expose class names.")


def select_profile(names: dict[int, str]) -> str:
    if names == SORTIFY_CLASS_NAMES:
        return "sortify-trained"
    if os.getenv("ALLOW_COCO_FALLBACK", "true").lower() == "true" and names.get(39) == "bottle":
        return "coco-compatibility"
    raise RuntimeError(
        "Model classes do not match the Sortify detector. Export the trained ten-class checkpoint "
        "or use a standard COCO yolo11s.pt with ALLOW_COCO_FALLBACK=true for a limited demo."
    )


@lru_cache(maxsize=1)
def load_model() -> LoadedModel:
    if not MODEL_PATH.is_file():
        raise RuntimeError(f"Model file not found at {MODEL_PATH}")
    if MODEL_PATH.suffix.lower() == ".pkl":
        if os.getenv("ALLOW_PICKLE") != "true":
            raise RuntimeError("Refusing to load a pickle. Set ALLOW_PICKLE=true only for a trusted model artifact.")
        # Pickle can execute code during deserialization. Never use an untrusted .pkl file.
        with MODEL_PATH.open("rb") as model_file:
            model = pickle.load(model_file)
    else:
        model = YOLO(str(MODEL_PATH))
    names = as_class_names(getattr(model, "names", None))
    return LoadedModel(model=model, profile=select_profile(names), names=names)


def run_model(model: Any, image: Image.Image) -> Any:
    """Accept an Ultralytics YOLO instance or a trusted pickle exposing predict()."""
    if isinstance(model, YOLO):
        return model.predict(image, conf=MODEL_CONFIDENCE, iou=MODEL_IOU, verbose=False)[0]
    if hasattr(model, "predict"):
        results = model.predict(image)
        return results[0] if isinstance(results, (list, tuple)) else results
    raise RuntimeError("The pickle does not expose a YOLO-compatible predict() method.")


def normalize_detections(
    result: Any, image_width: int, image_height: int, loaded_model: LoadedModel
) -> list[dict[str, Any]]:
    boxes = getattr(result, "boxes", None)
    if boxes is None:
        raise RuntimeError("The loaded model returned no YOLO bounding boxes.")
    xyxy = boxes.xyxy.cpu().tolist()
    confidences = boxes.conf.cpu().tolist()
    class_ids = boxes.cls.cpu().tolist()
    detections: list[dict[str, Any]] = []
    for coordinates, confidence, class_id_float in zip(xyxy, confidences, class_ids):
        source_class_id = int(class_id_float)
        sortify_class_id = (
            source_class_id
            if loaded_model.profile == "sortify-trained"
            else COCO_TO_SORTIFY_CLASS_IDS.get(source_class_id)
        )
        if sortify_class_id is None:
            continue
        left, top, right, bottom = coordinates
        x = max(0.0, min(1.0, left / image_width))
        y = max(0.0, min(1.0, top / image_height))
        width = max(0.0, min(1.0 - x, (right - left) / image_width))
        height = max(0.0, min(1.0 - y, (bottom - top) / image_height))
        if width and height:
            detections.append(
                {
                    "class_id": sortify_class_id,
                    "class_name": SORTIFY_CLASS_NAMES[sortify_class_id],
                    "source_class_name": loaded_model.names[source_class_id],
                    "confidence": round(float(confidence), 5),
                    "bbox": {"x": round(x, 6), "y": round(y, 6), "width": round(width, 6), "height": round(height, 6)},
                }
            )
    return sorted(detections, key=lambda detection: detection["confidence"], reverse=True)


@app.get("/health")
def health() -> dict[str, Any]:
    try:
        load_model()
    except RuntimeError as error:
        return {"ready": False, "detail": str(error)}
    loaded_model = load_model()
    return {
        "ready": True,
        "model": MODEL_PATH.name,
        "profile": loaded_model.profile,
        "confidence_threshold": MODEL_CONFIDENCE,
        "iou_threshold": MODEL_IOU,
        "classes": SORTIFY_CLASS_NAMES,
        "warning": "Limited COCO-to-Sortify aliases are active; use the trained 10-class checkpoint for final results."
        if loaded_model.profile == "coco-compatibility"
        else None,
    }


@app.post("/v1/detections")
async def detect(image: UploadFile = File(...)) -> dict[str, Any]:
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Use a JPEG, PNG, or WebP image.")
    data = await image.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 10 MB or smaller.")
    try:
        opened_image = Image.open(io.BytesIO(data)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=422, detail="The uploaded file is not a readable image.") from None
    try:
        loaded_model = load_model()
        result = run_model(loaded_model.model, opened_image)
        detections = normalize_detections(result, *opened_image.size, loaded_model)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return {
        "image": {"width": opened_image.width, "height": opened_image.height},
        "model_profile": loaded_model.profile,
        "detections": detections,
    }
