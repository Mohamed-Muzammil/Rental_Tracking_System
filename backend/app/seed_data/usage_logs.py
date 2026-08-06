"""Port of src/data/usageLogs.js — daily usage logs for every active rental,
from check-in through the simulated "today". Two units are seeded to
misbehave (matching the original JS fixture exactly) so the geofence/fuel
alert rules have something real to catch on first load.
"""

from datetime import date

from .equipment import SIM_TODAY
from .generate_logs import gen_daily_logs
from .sites import SITE_BY_ID

SEEDED_ANOMALIES = {
    "EQX-2003": {"drift_km": 6.5},   # wanders outside Hillside Quarry's radius
    "EQX-2016": {"fuel_factor": 1.8},  # burns ~80% more fuel per engine hour than expected
}


def build_usage_logs(equipment: list[dict]) -> list[dict]:
    logs: list[dict] = []
    for eq in equipment:
        if eq["status"] != "active":
            continue
        check_in = date.fromisoformat(eq["check_in"])
        days = max(1, (SIM_TODAY - check_in).days + 1)
        anomaly = SEEDED_ANOMALIES.get(eq["id"], {})
        logs.extend(
            gen_daily_logs(
                equipment_id=eq["id"],
                operator_id=eq.get("operator_id"),
                site_id=eq.get("site_id"),
                start_date=eq["check_in"],
                days=days,
                base_engine=eq["avg_engine_hours_per_day"],
                base_idle=eq["avg_idle_hours_per_day"],
                site_by_id=SITE_BY_ID,
                **anomaly,
            )
        )
    return logs
