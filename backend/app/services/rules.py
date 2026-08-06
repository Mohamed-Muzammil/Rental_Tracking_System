"""Python port of src/lib/rules.js — the alert engine and rightsizing
recommendation logic. Operates on plain dicts with snake_case keys (the
shape repositories return), not Pydantic models, so it's reusable from
both routers and tests without an import cycle.
"""

from datetime import date, datetime
from typing import Optional

from .geo import geofence_check

UNDERUTILIZED_THRESHOLD = 0.3
CRITICAL_UTILIZATION = 0.1
DUE_SOON_DAYS = 5

FUEL_L_PER_ENGINE_HOUR = 4.2
FUEL_DEVIATION_THRESHOLD = 0.35
FUEL_MIN_ENGINE_HOURS = 1.0


def _as_date(value) -> date:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    return datetime.strptime(str(value), "%Y-%m-%d").date()


def utilization_of(eq: dict) -> float:
    total = eq["avg_engine_hours_per_day"] + eq["avg_idle_hours_per_day"]
    if total == 0:
        return 0.0
    return eq["avg_engine_hours_per_day"] / total


def return_status(eq: dict, today) -> Optional[dict]:
    if eq["status"] != "active":
        return None
    days = (_as_date(eq["expected_return"]) - _as_date(today)).days
    if days < 0:
        return {"state": "overdue", "days": abs(days)}
    if days <= DUE_SOON_DAYS:
        return {"state": "due-soon", "days": days}
    return {"state": "on-track", "days": days}


def recommendation_for(eq: dict, catalog_by_id: dict, catalog_by_type: dict) -> Optional[dict]:
    current = catalog_by_id.get(eq["catalog_id"])
    if not current:
        return None
    cheaper = [
        c
        for c in catalog_by_type.get(eq["type"], [])
        if c["id"] != eq["catalog_id"]
        and c["daily_cost"] < current["daily_cost"]
        and eq["avg_engine_hours_per_day"] <= c["max_usage_hrs"] + 0.5
    ]
    if not cheaper:
        return None
    best = min(cheaper, key=lambda c: c["daily_cost"])
    return {
        "catalog": best,
        "currentCost": current["daily_cost"],
        "dailySavings": current["daily_cost"] - best["daily_cost"],
    }


def fuel_check(log: Optional[dict]) -> Optional[dict]:
    if not log or log["engine_hours"] < FUEL_MIN_ENGINE_HOURS or log.get("fuel_usage_l") is None:
        return None
    actual_rate = log["fuel_usage_l"] / log["engine_hours"]
    deviation = (actual_rate - FUEL_L_PER_ENGINE_HOUR) / FUEL_L_PER_ENGINE_HOUR
    return {
        "actualRate": actual_rate,
        "expectedRate": FUEL_L_PER_ENGINE_HOUR,
        "deviation": deviation,
        "anomalous": abs(deviation) > FUEL_DEVIATION_THRESHOLD,
    }


def health_of(eq: dict, today) -> str:
    rs = return_status(eq, today)
    util = utilization_of(eq)
    if rs and rs["state"] == "overdue":
        return "critical"
    if not eq.get("operator_id") and eq["status"] == "active":
        return "serious"
    if util < CRITICAL_UTILIZATION:
        return "serious"
    if (rs and rs["state"] == "due-soon") or util < UNDERUTILIZED_THRESHOLD:
        return "warning"
    return "good"


def latest_log_by_equipment(usage_logs: list[dict]) -> dict:
    latest: dict[str, dict] = {}
    for log in usage_logs:
        cur = latest.get(log["equipment_id"])
        if cur is None or log["date"] > cur["date"]:
            latest[log["equipment_id"]] = log
    return latest


def build_alerts(
    equipment_list: list[dict],
    today,
    usage_logs: list[dict],
    site_by_id: dict,
    catalog_by_id: dict,
    catalog_by_type: dict,
) -> list[dict]:
    alerts: list[dict] = []
    latest_log = latest_log_by_equipment(usage_logs)

    for eq in equipment_list:
        if eq["status"] != "active":
            continue
        rs = return_status(eq, today)

        if eq.get("return_requested"):
            alerts.append(
                {
                    "id": f"returnreq-{eq['id']}",
                    "equipmentId": eq["id"],
                    "type": "return-request",
                    "severity": "info",
                    "message": f"{eq['id']} — customer has requested collection",
                }
            )

        if rs["state"] == "overdue":
            plural = "" if rs["days"] == 1 else "s"
            alerts.append(
                {
                    "id": f"overdue-{eq['id']}",
                    "equipmentId": eq["id"],
                    "type": "overdue",
                    "severity": "serious" if eq.get("operator_id") else "critical",
                    "message": f"{eq['id']} — {eq['tier']} {eq['type']} is {rs['days']} day{plural} overdue",
                }
            )
        elif rs["state"] == "due-soon":
            plural = "" if rs["days"] == 1 else "s"
            alerts.append(
                {
                    "id": f"duesoon-{eq['id']}",
                    "equipmentId": eq["id"],
                    "type": "due-soon",
                    "severity": "warning",
                    "message": f"{eq['id']} — return due in {rs['days']} day{plural}",
                }
            )

        if not eq.get("operator_id"):
            alerts.append(
                {
                    "id": f"unassigned-{eq['id']}",
                    "equipmentId": eq["id"],
                    "type": "anomaly",
                    "severity": "serious",
                    "message": f"{eq['id']} — checked out with no operator assigned",
                }
            )

        log = latest_log.get(eq["id"])

        fence = geofence_check(log["location"] if log else None, eq.get("site_id"), site_by_id)
        if fence and fence["breach"]:
            alerts.append(
                {
                    "id": f"geofence-{eq['id']}",
                    "equipmentId": eq["id"],
                    "type": "anomaly",
                    "severity": "critical" if fence["overshootKm"] > 2 else "serious",
                    "message": f"{eq['id']} — {fence['overshootKm']:.1f} km outside {fence['site']['name']} boundary",
                }
            )

        fuel = fuel_check(log)
        if fuel and fuel["anomalous"]:
            pct = round(abs(fuel["deviation"]) * 100)
            direction = "above" if fuel["deviation"] > 0 else "below"
            alerts.append(
                {
                    "id": f"fuel-{eq['id']}",
                    "equipmentId": eq["id"],
                    "type": "anomaly",
                    "severity": "warning",
                    "message": f"{eq['id']} — fuel burn {pct}% {direction} expected ({fuel['actualRate']:.1f} L/hr)",
                }
            )

        util = utilization_of(eq)
        if util < UNDERUTILIZED_THRESHOLD:
            alerts.append(
                {
                    "id": f"underutilized-{eq['id']}",
                    "equipmentId": eq["id"],
                    "type": "anomaly",
                    "severity": "critical" if util < CRITICAL_UTILIZATION else "warning",
                    "message": f"{eq['id']} — utilization at {round(util * 100)}% (idle {eq['avg_idle_hours_per_day']}h/day)",
                }
            )

            rec = recommendation_for(eq, catalog_by_id, catalog_by_type)
            if rec:
                alerts.append(
                    {
                        "id": f"recommend-{eq['id']}",
                        "equipmentId": eq["id"],
                        "type": "recommendation",
                        "severity": "info",
                        "message": f"{eq['id']} — switch to {rec['catalog']['tier']} {eq['type']} to save ${rec['dailySavings']}/day",
                        "recommendation": rec,
                    }
                )

    return alerts
