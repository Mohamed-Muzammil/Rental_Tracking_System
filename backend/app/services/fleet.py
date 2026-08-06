"""Python port of src/lib/fleet.js — dashboard rollups."""

from .rules import utilization_of

EQUIPMENT_TYPES = ["Excavator", "Bulldozer", "Crane", "Grader", "Forklift", "Loader", "Roller"]


def category_summary(equipment: list[dict]) -> list[dict]:
    rows = []
    for etype in EQUIPMENT_TYPES:
        units = [e for e in equipment if e["type"] == etype]
        total = len(units)
        if total == 0:
            continue
        available = sum(1 for e in units if e["status"] == "completed")
        rows.append(
            {
                "type": etype,
                "total": total,
                "available": available,
                "rented": sum(1 for e in units if e["status"] == "active"),
                "reserved": sum(1 for e in units if e["status"] == "hold"),
                "maintenance": sum(1 for e in units if e["status"] == "maintenance"),
                "availPct": round((available / total) * 100) if total else 0,
            }
        )
    return rows


def fleet_utilization(active_units: list[dict]) -> int:
    engine = sum(e["avg_engine_hours_per_day"] for e in active_units)
    idle = sum(e["avg_idle_hours_per_day"] for e in active_units)
    if engine + idle == 0:
        return 0
    return round((engine / (engine + idle)) * 100)


def time_utilization(equipment: list[dict]) -> int:
    rentable = [e for e in equipment if e["status"] != "maintenance"]
    if not rentable:
        return 0
    on_rent = sum(1 for e in equipment if e["status"] == "active")
    return round((on_rent / len(rentable)) * 100)


def utilization_ranking(active_units: list[dict], n: int = 5) -> dict:
    ranked = sorted(
        ({"eq": e, "util": round(utilization_of(e) * 100)} for e in active_units),
        key=lambda r: r["util"],
        reverse=True,
    )
    return {"top": ranked[:n], "bottom": list(reversed(ranked[-n:])) if ranked else []}
