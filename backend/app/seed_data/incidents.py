import random

from .equipment import EQUIPMENT, SIM_TODAY

from datetime import timedelta

_TEMPLATES = [
    ("geofence_breach", "Outside Assigned Site (Geofence Violation)", "critical",
     "{id} reported operating outside its assigned site boundary."),
    ("excessive_idle", "Excessive Engine Idle Hours", "medium",
     "{id} logged unusually high idle time relative to engine runtime."),
    ("unauthorized_operator", "Unauthorized Operator Scan", "high",
     "An unrecognized operator badge was scanned against {id}."),
    ("service_limit_exceeded", "Service Maintenance Threshold Reached", "warning",
     "{id} has crossed its scheduled maintenance service interval."),
]

_RESOLUTIONS = ["false_alarm", "warn_operator", "penalty", "inspection", "recall"]


def _build() -> list[dict]:
    rng = random.Random(20260805)
    active_ids = [e["id"] for e in EQUIPMENT if e["status"] == "active"]
    incidents = []

    for i in range(20):
        eq_id = rng.choice(active_ids)
        itype, title, severity, detail_tpl = rng.choice(_TEMPLATES)
        resolved = rng.random() < 0.3
        day_offset = rng.randint(0, 6)
        created = SIM_TODAY - timedelta(days=day_offset)
        incident = {
            "id": f"INC-{105 + i}",
            "equipment_id": eq_id,
            "type": itype,
            "title": title,
            "severity": severity,
            "details": detail_tpl.format(id=eq_id),
            "anomaly_score": rng.randint(55, 95),
            "status": "resolved" if resolved else "active",
            "created_at": f"{created.isoformat()} {rng.randint(7,18):02d}:{rng.randint(0,59):02d}",
        }
        if resolved:
            incident["resolution"] = rng.choice(_RESOLUTIONS)
            incident["resolution_notes"] = "Resolved during routine fleet review."
        incidents.append(incident)

    return incidents


INCIDENTS: list[dict] = _build()
