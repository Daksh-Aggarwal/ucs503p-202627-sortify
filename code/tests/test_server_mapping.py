import json
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import Any

sys.path.insert(0, "C:/Code/Sortify/code/server")
from app.main import (
    MAP_8_CLASS_TO_SORTIFY,
    MAP_10_CLASS_TO_SORTIFY,
    SORTIFY_8_CLASS_NAMES,
    SORTIFY_10_CLASS_NAMES,
    normalize_detections,
    LoadedModel,
)

print("=== TEST SUITE: SERVER CLASS MAPPING & NORMALIZATION ===\n")

# 1. Test 8-Class Mapping
assert len(MAP_8_CLASS_TO_SORTIFY) == 8, f"Expected 8 classes, got {len(MAP_8_CLASS_TO_SORTIFY)}"
valid_categories = {"Recyclable", "Organic", "General waste", "E-waste", "Hazardous"}

for cname, data in MAP_8_CLASS_TO_SORTIFY.items():
    assert data["category"] in valid_categories, f"Invalid category {data['category']} for {cname}"
    assert "item_id" in data and len(data["item_id"]) > 0, f"Missing item_id for {cname}"
    assert "display_name" in data and len(data["display_name"]) > 0, f"Missing display_name for {cname}"
    assert "sub_items" in data and isinstance(data["sub_items"], list), f"Missing sub_items for {cname}"
    assert len(data["sub_items"]) > 0, f"Empty sub_items for {cname}"

print("PASS: MAP_8_CLASS_TO_SORTIFY contains all 8 classes with valid categories and sub-items.")

# 2. Test 10-Class Mapping
assert len(MAP_10_CLASS_TO_SORTIFY) == 10, f"Expected 10 classes, got {len(MAP_10_CLASS_TO_SORTIFY)}"
for cname, data in MAP_10_CLASS_TO_SORTIFY.items():
    assert data["category"] in valid_categories, f"Invalid category {data['category']} for {cname}"
    assert "item_id" in data and len(data["item_id"]) > 0, f"Missing item_id for {cname}"
    assert "display_name" in data and len(data["display_name"]) > 0, f"Missing display_name for {cname}"
    assert "sub_items" in data and isinstance(data["sub_items"], list)

print("PASS: MAP_10_CLASS_TO_SORTIFY contains all 10 classes.")

# 3. Test sortify_class_mapping.json integration
mapping_path = Path("C:/Code/Sortify/code/server/models/sortify_class_mapping.json")
with open(mapping_path, "r", encoding="utf-8") as f:
    json_mapping = json.load(f)

for id_str, info in json_mapping.items():
    cname = info["name"]
    assert cname in MAP_8_CLASS_TO_SORTIFY, f"Class {cname} in JSON not found in MAP_8_CLASS_TO_SORTIFY"
    assert info["item_id"] == MAP_8_CLASS_TO_SORTIFY[cname]["item_id"], (
        f"item_id mismatch for {cname}: {info['item_id']} vs {MAP_8_CLASS_TO_SORTIFY[cname]['item_id']}"
    )
    assert info["category"] == MAP_8_CLASS_TO_SORTIFY[cname]["category"]
    assert info["sub_items"] == MAP_8_CLASS_TO_SORTIFY[cname]["sub_items"], (
        f"sub_items mismatch for {cname}: {info['sub_items']} vs {MAP_8_CLASS_TO_SORTIFY[cname]['sub_items']}"
    )

print("PASS: sortify_class_mapping.json perfectly matches MAP_8_CLASS_TO_SORTIFY including sub_items.")

# 4. Test normalize_detections with dummy mock boxes
@dataclass
class DummyTensor:
    values: list
    def cpu(self):
        return self
    def tolist(self):
        return self.values

@dataclass
class DummyBoxes:
    xyxy: Any
    conf: Any
    cls: Any

@dataclass
class DummyResult:
    boxes: Any

mock_boxes = DummyBoxes(
    xyxy=DummyTensor([[50.0, 60.0, 200.0, 300.0], [10.0, 10.0, 80.0, 90.0]]),
    conf=DummyTensor([0.88, 0.72]),
    cls=DummyTensor([3.0, 0.0]),  # flexible_plastic, paper_cardboard
)
mock_result = DummyResult(boxes=mock_boxes)

mock_model_8 = LoadedModel(
    key="best.pt",
    name="best.pt",
    model=None,
    profile="sortify-8class",
    names=SORTIFY_8_CLASS_NAMES,
)

detections = normalize_detections(mock_result, image_width=640, image_height=480, loaded_model=mock_model_8)
assert len(detections) == 2, f"Expected 2 detections, got {len(detections)}"

# Check flexible_plastic detection
flex_det = detections[0]
assert flex_det["model_class_name"] == "flexible_plastic"
assert flex_det["category"] == "General waste"
assert flex_det["item_id"] == "flexible-plastic"
assert "wrapper" in flex_det["sub_items"]
assert "plastic-bag" in flex_det["sub_items"]
assert flex_det["confidence"] == 0.88
assert 0 <= flex_det["bbox"]["x"] <= 1.0

# Check paper_cardboard detection
paper_det = detections[1]
assert paper_det["model_class_name"] == "paper_cardboard"
assert paper_det["category"] == "Recyclable"
assert paper_det["item_id"] == "paper-cardboard"
assert "box" in paper_det["sub_items"]
assert paper_det["confidence"] == 0.72

print("PASS: normalize_detections correctly produces normalized payload with sub-items and 5-category mapping.")
print("\nALL SERVER MAPPING TESTS PASSED!")
