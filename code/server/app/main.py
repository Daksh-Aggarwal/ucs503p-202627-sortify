"""Sortify's small, mobile-facing YOLO detection and RAG API.

Supports switching between models (e.g. YOLOv11 8-class streamlined, YOLOv11 10-class, COCO fallback)
and mapping raw model classes to Sortify's 5 major disposal categories.
"""

from __future__ import annotations

import io
import os
import pickle
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, Query, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from ultralytics import YOLO

# Standard 10-class dataset classes
SORTIFY_10_CLASS_NAMES = {
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

# Streamlined 8-class dataset classes (Sortify-ML YOLOv11 best.pt)
SORTIFY_8_CLASS_NAMES = {
    0: "paper_cardboard",
    1: "plastic_bottle",
    2: "metal",
    3: "flexible_plastic",
    4: "sanitary_ppe_waste",
    5: "organic",
    6: "battery_ewaste",
    7: "hazardous_medical",
}

# The 5 Sortify Major App Categories
# 'Recyclable' | 'Organic' | 'General waste' | 'E-waste' | 'Hazardous'
# Mapping from 8-class model classes to (category, default item id)
MAP_8_CLASS_TO_SORTIFY: dict[str, dict[str, str]] = {
    "paper_cardboard": {"category": "Recyclable", "item_id": "box", "display_name": "Paper & Cardboard"},
    "plastic_bottle": {"category": "Recyclable", "item_id": "bottle", "display_name": "Plastic Bottle"},
    "metal": {"category": "Recyclable", "item_id": "can", "display_name": "Metal"},
    "flexible_plastic": {"category": "General waste", "item_id": "plastic-bag", "display_name": "Flexible Plastic"},
    "sanitary_ppe_waste": {"category": "General waste", "item_id": "tissue", "display_name": "Sanitary / PPE Waste"},
    "organic": {"category": "Organic", "item_id": "scraps", "display_name": "Organic Waste"},
    "battery_ewaste": {"category": "E-waste", "item_id": "battery", "display_name": "Battery / E-waste"},
    "hazardous_medical": {"category": "Hazardous", "item_id": "medical-waste", "display_name": "Hazardous Medical Waste"},
}

MAP_10_CLASS_TO_SORTIFY: dict[str, dict[str, str]] = {
    "paper": {"category": "Recyclable", "item_id": "paper", "display_name": "Paper"},
    "cardboard": {"category": "Recyclable", "item_id": "box", "display_name": "Cardboard"},
    "glass": {"category": "Recyclable", "item_id": "jar", "display_name": "Glass"},
    "metal": {"category": "Recyclable", "item_id": "can", "display_name": "Metal"},
    "plastic_bottle": {"category": "Recyclable", "item_id": "bottle", "display_name": "Plastic Bottle"},
    "plastic_bag": {"category": "General waste", "item_id": "plastic-bag", "display_name": "Plastic Bag"},
    "sanitary_ppe_waste": {"category": "General waste", "item_id": "tissue", "display_name": "Sanitary / PPE Waste"},
    "organic": {"category": "Organic", "item_id": "scraps", "display_name": "Organic"},
    "battery_ewaste": {"category": "E-waste", "item_id": "battery", "display_name": "Battery / E-waste"},
    "hazardous_medical": {"category": "Hazardous", "item_id": "medical-waste", "display_name": "Hazardous Medical"},
}

# COCO 80-class fallback aliases
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

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_CONFIDENCE = float(os.getenv("MODEL_CONFIDENCE", "0.25"))
MODEL_IOU = float(os.getenv("MODEL_IOU", "0.45"))
MAX_IMAGE_BYTES = 10 * 1024 * 1024

app = FastAPI(title="Sortify Detector API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@dataclass(frozen=True)
class LoadedModel:
    key: str
    name: str
    model: Any
    profile: str
    names: dict[int, str]


# In-memory cache for loaded model instances
_LOADED_MODELS: dict[str, LoadedModel] = {}


def as_class_names(names: Any) -> dict[int, str]:
    if isinstance(names, dict):
        return {int(class_id): str(name) for class_id, name in names.items()}
    if isinstance(names, list):
        return dict(enumerate(str(name) for name in names))
    raise RuntimeError("The model does not expose class names.")


def detect_profile(names: dict[int, str]) -> str:
    if names == SORTIFY_8_CLASS_NAMES or any("paper_cardboard" in v for v in names.values()):
        return "sortify-8class"
    if names == SORTIFY_10_CLASS_NAMES or len(names) == 10:
        return "sortify-10class"
    if names.get(39) == "bottle":
        return "coco-compatibility"
    return "custom"


def get_available_models() -> list[dict[str, Any]]:
    """Scan the models directory and return available model metadata with clear dataset lineage."""
    models = []
    # Primary default model
    default_path = MODELS_DIR / "best.pt"
    if default_path.is_file():
        models.append({
            "id": "best.pt",
            "name": "YOLOv11s v3 Generalization (8 Classes - Production Default)",
            "is_default": True,
        })

    # Other discovered models in models directory
    if MODELS_DIR.is_dir():
        for p in sorted(MODELS_DIR.glob("*.pt")):
            if p.name == "best.pt":
                continue
            arch = "YOLOv11m" if "11m" in p.name.lower() else "YOLOv11s"
            display_name = p.stem.replace("_", " ").title()
            if "v3" in p.name.lower() or "generalization" in p.name.lower():
                display_name = f"{arch} (8 Classes - v3 Generalization Dataset)"
            elif "v2" in p.name.lower():
                display_name = f"{arch} (8 Classes - v2 Curated Dataset)"
            elif "real_organic" in p.name.lower():
                display_name = f"{arch} (8 Classes - Real Organic Augmentation)"
            elif "streamlined" in p.name.lower() or "v1" in p.name.lower() or "8class" in p.name.lower():
                display_name = f"{arch} (8 Classes - Old 8-Class Streamlined Dataset)"
            elif "10cls" in p.name.lower() or "10class" in p.name.lower():
                display_name = f"{arch} (10 Classes - Old 10-Class Legacy Dataset)"
            models.append({
                "id": p.name,
                "name": display_name,
                "is_default": False,
            })
    return models


def load_model_by_name(model_filename: str = "best.pt") -> LoadedModel:
    clean_name = os.path.basename(model_filename)
    if clean_name in _LOADED_MODELS:
        return _LOADED_MODELS[clean_name]

    model_path = MODELS_DIR / clean_name
    if not model_path.is_file():
        # Fallback to best.pt if requested file not found
        model_path = MODELS_DIR / "best.pt"
        clean_name = "best.pt"

    if not model_path.is_file():
        raise RuntimeError(f"Model file not found at {model_path}")

    if model_path.suffix.lower() == ".pkl":
        if os.getenv("ALLOW_PICKLE") != "true":
            raise RuntimeError("Refusing to load a pickle. Set ALLOW_PICKLE=true only for trusted artifacts.")
        with model_path.open("rb") as f:
            model = pickle.load(f)
    else:
        model = YOLO(str(model_path))

    names = as_class_names(getattr(model, "names", None))
    profile = detect_profile(names)
    loaded = LoadedModel(
        key=clean_name,
        name=clean_name,
        model=model,
        profile=profile,
        names=names,
    )
    _LOADED_MODELS[clean_name] = loaded
    return loaded


def run_model(model: Any, image: Image.Image, confidence: float = MODEL_CONFIDENCE) -> Any:
    if isinstance(model, YOLO):
        return model.predict(image, conf=confidence, iou=MODEL_IOU, verbose=False)[0]
    if hasattr(model, "predict"):
        try:
            return model.predict(image, conf=confidence)[0]
        except TypeError:
            results = model.predict(image)
            return results[0] if isinstance(results, (list, tuple)) else results
    raise RuntimeError("The model does not expose a YOLO-compatible predict() method.")


def normalize_detections(
    result: Any, image_width: int, image_height: int, loaded_model: LoadedModel
) -> list[dict[str, Any]]:
    boxes = getattr(result, "boxes", None)
    if boxes is None:
        raise RuntimeError("The model returned no bounding boxes.")

    xyxy = boxes.xyxy.cpu().tolist()
    confidences = boxes.conf.cpu().tolist()
    class_ids = boxes.cls.cpu().tolist()
    detections: list[dict[str, Any]] = []

    for coordinates, confidence, class_id_float in zip(xyxy, confidences, class_ids):
        raw_class_id = int(class_id_float)
        raw_class_name = loaded_model.names.get(raw_class_id, f"class_{raw_class_id}")

        # Map to Sortify's 5 Major Categories and standard item IDs
        if loaded_model.profile == "sortify-8class":
            mapping = MAP_8_CLASS_TO_SORTIFY.get(raw_class_name)
            if not mapping:
                # fallback by index if names differ
                class_key = SORTIFY_8_CLASS_NAMES.get(raw_class_id, "")
                mapping = MAP_8_CLASS_TO_SORTIFY.get(class_key, {
                    "category": "General waste",
                    "item_id": "tissue",
                    "display_name": raw_class_name,
                })
            category = mapping["category"]
            item_id = mapping["item_id"]
            display_name = mapping["display_name"]
            sortify_class_name = raw_class_name

        elif loaded_model.profile == "sortify-10class":
            mapping = MAP_10_CLASS_TO_SORTIFY.get(raw_class_name)
            if not mapping:
                class_key = SORTIFY_10_CLASS_NAMES.get(raw_class_id, "")
                mapping = MAP_10_CLASS_TO_SORTIFY.get(class_key, {
                    "category": "General waste",
                    "item_id": "tissue",
                    "display_name": raw_class_name,
                })
            category = mapping["category"]
            item_id = mapping["item_id"]
            display_name = mapping["display_name"]
            sortify_class_name = raw_class_name

        elif loaded_model.profile == "coco-compatibility":
            mapped_10_id = COCO_TO_SORTIFY_CLASS_IDS.get(raw_class_id)
            if mapped_10_id is None:
                continue
            raw_10_name = SORTIFY_10_CLASS_NAMES.get(mapped_10_id, "unknown")
            mapping = MAP_10_CLASS_TO_SORTIFY.get(raw_10_name, {
                "category": "General waste",
                "item_id": "tissue",
                "display_name": raw_class_name,
            })
            category = mapping["category"]
            item_id = mapping["item_id"]
            display_name = mapping["display_name"]
            sortify_class_name = raw_10_name
        else:
            # Custom profile
            category = "General waste"
            item_id = "tissue"
            display_name = raw_class_name
            sortify_class_name = raw_class_name

        left, top, right, bottom = coordinates
        x = max(0.0, min(1.0, left / image_width))
        y = max(0.0, min(1.0, top / image_height))
        width = max(0.0, min(1.0 - x, (right - left) / image_width))
        height = max(0.0, min(1.0 - y, (bottom - top) / image_height))

        if width and height:
            detections.append({
                "class_id": raw_class_id,
                # Preserved original model output
                "model_class_name": raw_class_name,
                "display_name": display_name,
                # Mapped application category (out of the 5 major classes)
                "category": category,
                "item_id": item_id,
                "class_name": sortify_class_name,
                "confidence": round(float(confidence), 5),
                "bbox": {
                    "x": round(x, 6),
                    "y": round(y, 6),
                    "width": round(width, 6),
                    "height": round(height, 6),
                },
            })

    return sorted(detections, key=lambda d: d["confidence"], reverse=True)


@app.get("/health")
def health(model: str = "best.pt") -> dict[str, Any]:
    try:
        loaded = load_model_by_name(model)
        ready = True
        err = None
    except Exception as error:
        ready = False
        err = str(error)
        loaded = None

    return {
        "ready": ready,
        "detail": err,
        "model": loaded.key if loaded else model,
        "profile": loaded.profile if loaded else None,
        "classes": loaded.names if loaded else {},
        "app_categories": ["Recyclable", "Organic", "General waste", "E-waste", "Hazardous"],
        "available_models": get_available_models(),
    }


@app.get("/v1/models")
def list_models() -> dict[str, Any]:
    """Return all available models for the frontend model switcher dropdown."""
    return {
        "models": get_available_models(),
        "active_default": "best.pt",
    }


@app.post("/v1/detections")
async def detect(
    image: UploadFile = File(...),
    model: str = Query("best.pt", description="Filename of model in models directory"),
    confidence: float = Query(MODEL_CONFIDENCE, ge=0.01, le=1.0, description="Confidence threshold"),
) -> dict[str, Any]:
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
        loaded_model = load_model_by_name(model)
        result = run_model(loaded_model.model, opened_image, confidence=confidence)
        detections = normalize_detections(result, *opened_image.size, loaded_model)
    except Exception as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    return {
        "image": {"width": opened_image.width, "height": opened_image.height},
        "model": loaded_model.key,
        "model_profile": loaded_model.profile,
        "model_classes_count": len(loaded_model.names),
        "confidence_threshold": confidence,
        "detections": detections,
    }


@app.post("/v1/assistant/chat")
async def assistant_chat(request: Request) -> dict[str, Any]:
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.") from None

    query = str(body.get("message", "")).strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    from app.rag import asdict, rag_engine

    reply, context, trace = rag_engine.answer_query(query)
    return {
        "reply": reply,
        "context": context,
        "traces": asdict(trace),
    }


@app.get("/v1/assistant/rag-info")
def rag_info() -> dict[str, Any]:
    from app.rag import rag_engine

    return {
        "rag_file": str(rag_engine.rag_file_path.name) if rag_engine.rag_file_path else None,
        "chunks_count": len(rag_engine.chunks),
        "model": "Qwen/Qwen2.5-0.5B-Instruct",
    }
