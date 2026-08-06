# Exact port of src/data/catalog.js. Types/tier-pairing must not change —
# ml/generate_dataset.py's CATEGORIES keys match these types 1:1.
CATALOG = [
    {"id": "CAT-EXC-H", "type": "Excavator", "tier": "Heavy", "daily_cost": 420, "min_usage_hrs": 5, "max_usage_hrs": 10},
    {"id": "CAT-EXC-C", "type": "Excavator", "tier": "Compact", "daily_cost": 220, "min_usage_hrs": 1, "max_usage_hrs": 4},

    {"id": "CAT-BLD-H", "type": "Bulldozer", "tier": "Heavy", "daily_cost": 480, "min_usage_hrs": 5, "max_usage_hrs": 10},
    {"id": "CAT-BLD-C", "type": "Bulldozer", "tier": "Compact", "daily_cost": 260, "min_usage_hrs": 1, "max_usage_hrs": 4},

    {"id": "CAT-CRN-S", "type": "Crane", "tier": "Mobile Standard", "daily_cost": 600, "min_usage_hrs": 4, "max_usage_hrs": 8},
    {"id": "CAT-CRN-M", "type": "Crane", "tier": "Mini", "daily_cost": 310, "min_usage_hrs": 1, "max_usage_hrs": 3},

    {"id": "CAT-GRD-S", "type": "Grader", "tier": "Standard", "daily_cost": 390, "min_usage_hrs": 4, "max_usage_hrs": 8},
    {"id": "CAT-GRD-C", "type": "Grader", "tier": "Compact", "daily_cost": 210, "min_usage_hrs": 1, "max_usage_hrs": 3},

    {"id": "CAT-FRK-H", "type": "Forklift", "tier": "Heavy Duty", "daily_cost": 280, "min_usage_hrs": 4, "max_usage_hrs": 9},
    {"id": "CAT-FRK-S", "type": "Forklift", "tier": "Standard", "daily_cost": 150, "min_usage_hrs": 1, "max_usage_hrs": 3},

    {"id": "CAT-LDR-W", "type": "Loader", "tier": "Wheel", "daily_cost": 350, "min_usage_hrs": 4, "max_usage_hrs": 9},
    {"id": "CAT-LDR-C", "type": "Loader", "tier": "Compact", "daily_cost": 190, "min_usage_hrs": 1, "max_usage_hrs": 3},

    {"id": "CAT-RLR-T", "type": "Roller", "tier": "Tandem", "daily_cost": 300, "min_usage_hrs": 4, "max_usage_hrs": 8},
    {"id": "CAT-RLR-S", "type": "Roller", "tier": "Single Drum", "daily_cost": 170, "min_usage_hrs": 1, "max_usage_hrs": 3},
]

CATALOG_BY_ID = {c["id"]: c for c in CATALOG}


def catalog_for(equipment_type: str) -> list[dict]:
    return [c for c in CATALOG if c["type"] == equipment_type]


CATALOG_BY_TYPE: dict[str, list[dict]] = {}
for _c in CATALOG:
    CATALOG_BY_TYPE.setdefault(_c["type"], []).append(_c)
