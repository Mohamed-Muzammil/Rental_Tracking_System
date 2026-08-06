"""Equipment seed fixture. EXC/BLD/CRN-1xxx/2xxx/3xxx below (40 units) are an exact
port of src/data/equipment.js, kept verbatim so the original demo dates line
up with the app's simulated "today" (2026-08-05, src/lib/clock.js's
SIM_TODAY). Everything after _ORIGINAL is generated deterministically (fixed
RNG seed) to reach a bigger seed scale for realistic testing, spread across
all four statuses including 'hold' — a status the business logic supports
(WarehouseQrDispatch/reserveEquipmentOnHold) but the original 40-unit seed
never actually used.
"""

import random
from datetime import date, timedelta

from .catalog import CATALOG_BY_TYPE
from .clients import CLIENTS
from .sites import SITES

SIM_TODAY = date(2026, 8, 5)
EQUIPMENT_TYPES = ["Excavator", "Bulldozer", "Crane", "Grader", "Forklift", "Loader", "Roller"]

_ORIGINAL: list[dict] = [
    # ── completed / available — original problem-statement records ──────────
    {"id": "EXC-1001", "type": "Excavator", "tier": "Heavy", "catalog_id": "CAT-EXC-H",
     "status": "completed", "site_id": "S003", "client_id": "C002", "operator_id": "OP101",
     "check_in": "2025-04-01", "check_out": "2025-04-16", "rental_days": 15,
     "avg_engine_hours_per_day": 1.5, "avg_idle_hours_per_day": 10},
    {"id": "CRN-1002", "type": "Crane", "tier": "Mobile Standard", "catalog_id": "CAT-CRN-S",
     "status": "completed", "site_id": "S005", "client_id": "C003", "operator_id": "OP102",
     "check_in": "2025-03-10", "check_out": "2025-03-30", "rental_days": 20,
     "avg_engine_hours_per_day": 0, "avg_idle_hours_per_day": 11},
    {"id": "BLD-1003", "type": "Bulldozer", "tier": "Heavy", "catalog_id": "CAT-BLD-H",
     "status": "completed", "site_id": "S002", "client_id": "C001", "operator_id": "OP203",
     "check_in": "2025-02-15", "check_out": "2025-03-11", "rental_days": 25,
     "avg_engine_hours_per_day": 7.5, "avg_idle_hours_per_day": 0.5},
    {"id": "EXC-1004", "type": "Excavator", "tier": "Compact", "catalog_id": "CAT-EXC-C",
     "status": "completed", "site_id": "S004", "client_id": "C002", "operator_id": "OP106",
     "check_in": "2025-05-05", "check_out": "2025-05-15", "rental_days": 10,
     "avg_engine_hours_per_day": 2, "avg_idle_hours_per_day": 9},
    {"id": "BLD-1005", "type": "Bulldozer", "tier": "Heavy", "catalog_id": "CAT-BLD-H",
     "status": "completed", "site_id": "S006", "client_id": "C003", "operator_id": "OP301",
     "check_in": "2025-01-01", "check_out": "2025-01-31", "rental_days": 30,
     "avg_engine_hours_per_day": 8, "avg_idle_hours_per_day": 0},
    {"id": "GRD-1006", "type": "Grader", "tier": "Standard", "catalog_id": "CAT-GRD-S",
     "status": "completed", "site_id": "S001", "client_id": "C001", "operator_id": "OP114",
     "check_in": "2025-04-05", "check_out": "2025-04-23", "rental_days": 18,
     "avg_engine_hours_per_day": 3, "avg_idle_hours_per_day": 6},
    {"id": "EXC-1007", "type": "Excavator", "tier": "Heavy", "catalog_id": "CAT-EXC-H",
     "status": "completed", "site_id": "S007", "client_id": "C002", "operator_id": "OP115",
     "check_in": "2025-03-20", "check_out": "2025-04-01", "rental_days": 12,
     "avg_engine_hours_per_day": 0, "avg_idle_hours_per_day": 12},
    {"id": "EXC-1008", "type": "Excavator", "tier": "Compact", "catalog_id": "CAT-EXC-C",
     "status": "completed", "site_id": "S005", "client_id": "C004", "operator_id": "OP118",
     "check_in": "2026-05-02", "check_out": "2026-05-28", "rental_days": 26,
     "avg_engine_hours_per_day": 3.4, "avg_idle_hours_per_day": 2.1},
    {"id": "GRD-1009", "type": "Grader", "tier": "Standard", "catalog_id": "CAT-GRD-S",
     "status": "completed", "site_id": "S011", "client_id": "C005", "operator_id": "OP122",
     "check_in": "2026-06-01", "check_out": "2026-06-24", "rental_days": 23,
     "avg_engine_hours_per_day": 5.8, "avg_idle_hours_per_day": 1.4},
    {"id": "FRK-1010", "type": "Forklift", "tier": "Standard", "catalog_id": "CAT-FRK-S",
     "status": "completed", "site_id": "S010", "client_id": "C006", "operator_id": "OP131",
     "check_in": "2026-06-10", "check_out": "2026-07-02", "rental_days": 22,
     "avg_engine_hours_per_day": 2.6, "avg_idle_hours_per_day": 1.8},
    {"id": "LDR-1011", "type": "Loader", "tier": "Compact", "catalog_id": "CAT-LDR-C",
     "status": "completed", "site_id": "S001", "client_id": "C001", "operator_id": "OP140",
     "check_in": "2026-06-15", "check_out": "2026-07-09", "rental_days": 24,
     "avg_engine_hours_per_day": 2.9, "avg_idle_hours_per_day": 1.5},
    {"id": "RLR-1012", "type": "Roller", "tier": "Single Drum", "catalog_id": "CAT-RLR-S",
     "status": "completed", "site_id": "S002", "client_id": "C003", "operator_id": "OP145",
     "check_in": "2026-06-20", "check_out": "2026-07-14", "rental_days": 24,
     "avg_engine_hours_per_day": 2.2, "avg_idle_hours_per_day": 2.4},

    # ── active ────────────────────────────────────────────────────────────────
    {"id": "EXC-2001", "type": "Excavator", "tier": "Heavy", "catalog_id": "CAT-EXC-H",
     "status": "active", "site_id": "S001", "client_id": "C001", "operator_id": "OP101",
     "check_in": "2026-07-18", "expected_return": "2026-08-20",
     "avg_engine_hours_per_day": 7.2, "avg_idle_hours_per_day": 0.8},
    {"id": "CRN-2002", "type": "Crane", "tier": "Mobile Standard", "catalog_id": "CAT-CRN-S",
     "status": "active", "site_id": "S002", "client_id": "C001", "operator_id": "OP202",
     "check_in": "2026-07-12", "expected_return": "2026-08-02",
     "avg_engine_hours_per_day": 0.0, "avg_idle_hours_per_day": 0.0},
    {"id": "BLD-2003", "type": "Bulldozer", "tier": "Heavy", "catalog_id": "CAT-BLD-H",
     "status": "active", "site_id": "S001", "client_id": "C002", "operator_id": "OP203",
     "check_in": "2026-07-28", "expected_return": "2026-08-25",
     "avg_engine_hours_per_day": 6.5, "avg_idle_hours_per_day": 1.0},
    {"id": "EXC-2004", "type": "Excavator", "tier": "Compact", "catalog_id": "CAT-EXC-C",
     "status": "active", "site_id": "S003", "client_id": "C002", "operator_id": "OP106",
     "check_in": "2026-08-01", "expected_return": "2026-08-09",
     "avg_engine_hours_per_day": 4.0, "avg_idle_hours_per_day": 3.5},
    {"id": "GRD-2005", "type": "Grader", "tier": "Standard", "catalog_id": "CAT-GRD-S",
     "status": "active", "site_id": "S002", "client_id": "C003", "operator_id": "OP301",
     "check_in": "2026-07-10", "expected_return": "2026-08-06",
     "avg_engine_hours_per_day": 7.8, "avg_idle_hours_per_day": 0.3},
    {"id": "BLD-2006", "type": "Bulldozer", "tier": "Heavy", "catalog_id": "CAT-BLD-H",
     "status": "active", "site_id": "S003", "client_id": "C003", "operator_id": "OP114",
     "check_in": "2026-07-20", "expected_return": "2026-08-22",
     "avg_engine_hours_per_day": 1.1, "avg_idle_hours_per_day": 6.2},
    {"id": "EXC-2007", "type": "Excavator", "tier": "Heavy", "catalog_id": "CAT-EXC-H",
     "status": "active", "site_id": "S007", "client_id": "C004", "operator_id": "OP210",
     "check_in": "2026-07-22", "expected_return": "2026-08-28",
     "avg_engine_hours_per_day": 8.1, "avg_idle_hours_per_day": 0.5},
    {"id": "EXC-2008", "type": "Excavator", "tier": "Heavy", "catalog_id": "CAT-EXC-H",
     "status": "active", "site_id": "S011", "client_id": "C005", "operator_id": "OP211",
     "check_in": "2026-07-15", "expected_return": "2026-08-18",
     "avg_engine_hours_per_day": 6.8, "avg_idle_hours_per_day": 1.4},
    {"id": "EXC-2009", "type": "Excavator", "tier": "Compact", "catalog_id": "CAT-EXC-C",
     "status": "active", "site_id": "S005", "client_id": "C004", "operator_id": "OP212",
     "check_in": "2026-07-30", "expected_return": "2026-08-08",
     "avg_engine_hours_per_day": 3.2, "avg_idle_hours_per_day": 4.1},
    {"id": "EXC-2010", "type": "Excavator", "tier": "Compact", "catalog_id": "CAT-EXC-C",
     "status": "active", "site_id": "S010", "client_id": "C006", "operator_id": "OP212",
     "check_in": "2026-07-08", "expected_return": "2026-08-03",
     "avg_engine_hours_per_day": 0.6, "avg_idle_hours_per_day": 8.4},
    {"id": "BLD-2011", "type": "Bulldozer", "tier": "Heavy", "catalog_id": "CAT-BLD-H",
     "status": "active", "site_id": "S012", "client_id": "C002", "operator_id": "OP213",
     "check_in": "2026-07-19", "expected_return": "2026-08-30",
     "avg_engine_hours_per_day": 7.9, "avg_idle_hours_per_day": 0.6},
    {"id": "BLD-2012", "type": "Bulldozer", "tier": "Compact", "catalog_id": "CAT-BLD-C",
     "status": "active", "site_id": "S006", "client_id": "C007", "operator_id": "OP214",
     "check_in": "2026-07-25", "expected_return": "2026-08-09",
     "avg_engine_hours_per_day": 2.2, "avg_idle_hours_per_day": 5.8},
    {"id": "CRN-2013", "type": "Crane", "tier": "Mobile Standard", "catalog_id": "CAT-CRN-S",
     "status": "active", "site_id": "S009", "client_id": "C008", "operator_id": "OP215",
     "check_in": "2026-07-11", "expected_return": "2026-08-24",
     "avg_engine_hours_per_day": 5.9, "avg_idle_hours_per_day": 1.1},
    {"id": "CRN-2014", "type": "Crane", "tier": "Mini", "catalog_id": "CAT-CRN-M",
     "status": "active", "site_id": "S008", "client_id": "C003", "operator_id": "OP216",
     "check_in": "2026-07-28", "expected_return": "2026-08-07",
     "avg_engine_hours_per_day": 2.6, "avg_idle_hours_per_day": 1.2},
    {"id": "GRD-2015", "type": "Grader", "tier": "Standard", "catalog_id": "CAT-GRD-S",
     "status": "active", "site_id": "S011", "client_id": "C005", "operator_id": "OP217",
     "check_in": "2026-07-16", "expected_return": "2026-08-21",
     "avg_engine_hours_per_day": 6.4, "avg_idle_hours_per_day": 1.0},
    {"id": "FRK-2016", "type": "Forklift", "tier": "Heavy Duty", "catalog_id": "CAT-FRK-H",
     "status": "active", "site_id": "S008", "client_id": "C006", "operator_id": "OP218",
     "check_in": "2026-07-20", "expected_return": "2026-08-26",
     "avg_engine_hours_per_day": 7.2, "avg_idle_hours_per_day": 0.9},
    {"id": "FRK-2017", "type": "Forklift", "tier": "Heavy Duty", "catalog_id": "CAT-FRK-H",
     "status": "active", "site_id": "S010", "client_id": "C006", "operator_id": "OP219",
     "check_in": "2026-07-24", "expected_return": "2026-08-19",
     "avg_engine_hours_per_day": 6.1, "avg_idle_hours_per_day": 1.6},
    {"id": "FRK-2018", "type": "Forklift", "tier": "Standard", "catalog_id": "CAT-FRK-S",
     "status": "active", "site_id": "S005", "client_id": "C004", "operator_id": "OP220",
     "check_in": "2026-07-31", "expected_return": "2026-08-12",
     "avg_engine_hours_per_day": 1.9, "avg_idle_hours_per_day": 2.3},
    {"id": "FRK-2019", "type": "Forklift", "tier": "Standard", "catalog_id": "CAT-FRK-S",
     "status": "active", "site_id": "S007", "client_id": "C004", "operator_id": "OP220",
     "check_in": "2026-07-14", "expected_return": "2026-08-16",
     "avg_engine_hours_per_day": 0.9, "avg_idle_hours_per_day": 7.1},
    {"id": "LDR-2020", "type": "Loader", "tier": "Wheel", "catalog_id": "CAT-LDR-W",
     "status": "active", "site_id": "S003", "client_id": "C007", "operator_id": "OP221",
     "check_in": "2026-07-21", "expected_return": "2026-08-27",
     "avg_engine_hours_per_day": 7.6, "avg_idle_hours_per_day": 0.7},
    {"id": "LDR-2021", "type": "Loader", "tier": "Wheel", "catalog_id": "CAT-LDR-W",
     "status": "active", "site_id": "S012", "client_id": "C002", "operator_id": "OP222",
     "check_in": "2026-07-17", "expected_return": "2026-08-23",
     "avg_engine_hours_per_day": 5.4, "avg_idle_hours_per_day": 2.1},
    {"id": "LDR-2022", "type": "Loader", "tier": "Compact", "catalog_id": "CAT-LDR-C",
     "status": "active", "site_id": "S001", "client_id": "C001", "operator_id": "OP223",
     "check_in": "2026-07-29", "expected_return": "2026-08-10",
     "avg_engine_hours_per_day": 2.8, "avg_idle_hours_per_day": 1.4},
    {"id": "RLR-2023", "type": "Roller", "tier": "Tandem", "catalog_id": "CAT-RLR-T",
     "status": "active", "site_id": "S011", "client_id": "C005", "operator_id": "OP224",
     "check_in": "2026-07-23", "expected_return": "2026-08-25",
     "avg_engine_hours_per_day": 6.7, "avg_idle_hours_per_day": 1.2},
    {"id": "RLR-2024", "type": "Roller", "tier": "Single Drum", "catalog_id": "CAT-RLR-S",
     "status": "active", "site_id": "S002", "client_id": "C003", "operator_id": "OP225",
     "check_in": "2026-07-27", "expected_return": "2026-08-04",
     "avg_engine_hours_per_day": 1.4, "avg_idle_hours_per_day": 4.9},

    # ── maintenance ───────────────────────────────────────────────────────────
    {"id": "BLD-3001", "type": "Bulldozer", "tier": "Heavy", "catalog_id": "CAT-BLD-H",
     "status": "maintenance", "site_id": None, "client_id": None, "operator_id": None,
     "maintenance_note": "Hydraulic seal replacement", "expected_back_on": "2026-08-11",
     "avg_engine_hours_per_day": 0, "avg_idle_hours_per_day": 0},
    {"id": "CRN-3002", "type": "Crane", "tier": "Mobile Standard", "catalog_id": "CAT-CRN-S",
     "status": "maintenance", "site_id": None, "client_id": None, "operator_id": None,
     "maintenance_note": "500-hour service + boom inspection", "expected_back_on": "2026-08-14",
     "avg_engine_hours_per_day": 0, "avg_idle_hours_per_day": 0},
    {"id": "FRK-3003", "type": "Forklift", "tier": "Heavy Duty", "catalog_id": "CAT-FRK-H",
     "status": "maintenance", "site_id": None, "client_id": None, "operator_id": None,
     "maintenance_note": "Mast chain wear — parts on order", "expected_back_on": "2026-08-18",
     "avg_engine_hours_per_day": 0, "avg_idle_hours_per_day": 0},
    {"id": "RLR-3004", "type": "Roller", "tier": "Tandem", "catalog_id": "CAT-RLR-T",
     "status": "maintenance", "site_id": None, "client_id": None, "operator_id": None,
     "maintenance_note": "Drum vibration bearing", "expected_back_on": "2026-08-09",
     "avg_engine_hours_per_day": 0, "avg_idle_hours_per_day": 0},
]

_MAINTENANCE_NOTES = [
    "Undercarriage track replacement",
    "Engine oil + filter service overdue",
    "Hydraulic hose leak repair",
    "Brake system inspection",
    "Electrical fault — starter motor",
    "Tyre/track wear replacement",
    "Coolant system flush",
    "Operator cab AC repair",
]


def _rand_site(rng: random.Random) -> str:
    return rng.choice(SITES)["id"]


def _rand_client(rng: random.Random) -> str:
    return rng.choice(CLIENTS)["id"]


def _rand_operator(rng: random.Random, prefix: int):
    if rng.random() < 0.15:
        return None
    return f"OP{prefix + rng.randint(0, 899)}"


def _get_prefix(etype: str) -> str:
    return {
        "Excavator": "EXC", "Bulldozer": "BLD", "Crane": "CRN",
        "Grader": "GRD", "Forklift": "FRK", "Loader": "LDR", "Roller": "RLR"
    }.get(etype, "EQX")

def _pick_type_tier(rng: random.Random):
    etype = rng.choice(EQUIPMENT_TYPES)
    cat = rng.choice(CATALOG_BY_TYPE[etype])
    return etype, cat


def _generate_completed(rng: random.Random, count: int, start_id: int) -> list[dict]:
    out = []
    for i in range(count):
        etype, cat = _pick_type_tier(rng)
        rental_days = rng.randint(7, 30)
        check_out = SIM_TODAY - timedelta(days=rng.randint(5, 400))
        check_in = check_out - timedelta(days=rental_days)
        out.append({
            "id": f"{_get_prefix(etype)}-1{start_id + i:03d}",
            "type": etype, "tier": cat["tier"], "catalog_id": cat["id"],
            "status": "completed",
            "site_id": _rand_site(rng), "client_id": _rand_client(rng),
            "operator_id": _rand_operator(rng, 100),
            "check_in": check_in.isoformat(), "check_out": check_out.isoformat(),
            "rental_days": rental_days,
            "avg_engine_hours_per_day": round(rng.uniform(0.5, 8.5), 1),
            "avg_idle_hours_per_day": round(rng.uniform(0.2, 11), 1),
        })
    return out


def _generate_active(rng: random.Random, count: int, start_id: int) -> list[dict]:
    out = []
    for i in range(count):
        etype, cat = _pick_type_tier(rng)
        check_in = SIM_TODAY - timedelta(days=rng.randint(3, 45))
        # Spread across overdue / due-soon / on-track so the alert engine
        # has real cases to catch, same intent as the hand-authored block above.
        expected_return = SIM_TODAY + timedelta(days=rng.randint(-15, 45))
        out.append({
            "id": f"{_get_prefix(etype)}-2{start_id + i:03d}",
            "type": etype, "tier": cat["tier"], "catalog_id": cat["id"],
            "status": "active",
            "site_id": _rand_site(rng), "client_id": _rand_client(rng),
            "operator_id": _rand_operator(rng, 400),
            "check_in": check_in.isoformat(), "expected_return": expected_return.isoformat(),
            "avg_engine_hours_per_day": round(rng.uniform(0.3, 8.5), 1),
            "avg_idle_hours_per_day": round(rng.uniform(0.2, 11), 1),
        })
    return out


def _generate_maintenance(rng: random.Random, count: int, start_id: int) -> list[dict]:
    out = []
    for i in range(count):
        etype, cat = _pick_type_tier(rng)
        out.append({
            "id": f"{_get_prefix(etype)}-3{start_id + i:03d}",
            "type": etype, "tier": cat["tier"], "catalog_id": cat["id"],
            "status": "maintenance",
            "site_id": None, "client_id": None, "operator_id": None,
            "maintenance_note": rng.choice(_MAINTENANCE_NOTES),
            "expected_back_on": (SIM_TODAY + timedelta(days=rng.randint(3, 21))).isoformat(),
            "avg_engine_hours_per_day": 0, "avg_idle_hours_per_day": 0,
        })
    return out


def _generate_hold(rng: random.Random, count: int, start_id: int) -> list[dict]:
    out = []
    for i in range(count):
        etype, cat = _pick_type_tier(rng)
        out.append({
            "id": f"{_get_prefix(etype)}-4{start_id + i:03d}",
            "type": etype, "tier": cat["tier"], "catalog_id": cat["id"],
            "status": "hold",
            "site_id": _rand_site(rng), "client_id": _rand_client(rng), "operator_id": None,
            "avg_engine_hours_per_day": 0, "avg_idle_hours_per_day": 0,
        })
    return out


def _point_near_site(site_id: str, offset_km: float = 0) -> dict:
    if not site_id:
        return {"lat": None, "lng": None}
    # find site
    site = next((s for s in SITES if s["id"] == site_id), None)
    if not site:
        return {"lat": None, "lng": None}
    return {
        "lat": round(site["lat"] + offset_km / 111, 5),
        "lng": site["lng"]
    }

def _build() -> list[dict]:
    rng = random.Random(20260805)  # fixed seed -> reproducible seed data across resets
    equipment = list(_ORIGINAL)
    equipment += _generate_completed(rng, 180, 13)
    equipment += _generate_active(rng, 250, 25)
    equipment += _generate_maintenance(rng, 30, 5)
    equipment += _generate_hold(rng, 40, 1)

    for idx, eq in enumerate(equipment):
        site_id = eq.get("site_id")
        if not site_id:
            # If not assigned to a site, put it at a warehouse or null
            eq["current_location"] = _point_near_site("S001", 0)
            continue
            
        # Add deliberate mismatches for testing
        if eq["status"] == "active" and idx in [25, 45, 80]:
            # Completely wrong site
            wrong_site = [s for s in SITES if s["id"] != site_id][0]["id"]
            eq["current_location"] = _point_near_site(wrong_site, 0)
        else:
            # Normal location: slightly offset (e.g. -1.5km to 1.5km)
            offset = rng.uniform(-1.5, 1.5)
            eq["current_location"] = _point_near_site(site_id, offset)

    return equipment


EQUIPMENT: list[dict] = _build()
