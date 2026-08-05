"""Python port of src/lib/genLogs.js — deterministic (not random) daily
usage-log generator, so a reset always reproduces the exact same demo
telemetry rather than a fresh random draw each time.
"""

import math
from datetime import date, timedelta

from ..services.geo import point_near_site

FUEL_L_PER_ENGINE_HOUR = 4.2


def gen_daily_logs(
    equipment_id: str,
    operator_id,
    site_id,
    start_date: str,
    days: int,
    base_engine: float,
    base_idle: float,
    site_by_id: dict,
    drift_km: float = 0,
    fuel_factor: float = 1,
) -> list[dict]:
    start = date.fromisoformat(start_date)
    logs = []
    for i in range(days):
        d = start + timedelta(days=i)
        wobble = math.sin(i * 1.3) * min(0.6, base_engine * 0.15)
        engine_hours = round(max(0.0, base_engine + wobble), 1)
        idle_hours = round(max(0.0, base_idle - wobble * 0.5), 1)

        day_drift = 0 if drift_km == 0 else (drift_km * (i + 1)) / days
        jitter_km = math.sin(i * 2.1) * 0.15

        logs.append(
            {
                "equipment_id": equipment_id,
                "operator_id": operator_id,
                "date": d.isoformat(),
                "engine_hours": engine_hours,
                "idle_hours": idle_hours,
                "fuel_usage_l": round(engine_hours * FUEL_L_PER_ENGINE_HOUR * fuel_factor, 1),
                "location": point_near_site(site_id, site_by_id, day_drift + jitter_km),
            }
        )
    return logs
