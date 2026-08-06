import random

from .equipment import EQUIPMENT, SIM_TODAY

# First 4 are an exact port of src/data/appStore.js's seedIncidents.
_ORIGINAL = [
    {"id": "INC-101", "equipment_id": "EQX-2003", "type": "geofence_breach",
     "title": "Outside Assigned Site (Geofence Violation)", "severity": "critical",
     "details": "EQX-2003 Heavy Excavator operating 4.2 km outside assigned Summit Mine bounds.",
     "anomaly_score": 92, "status": "active", "created_at": "2026-08-05 14:20"},
    {"id": "INC-102", "equipment_id": "EQX-2007", "type": "excessive_idle",
     "title": "Excessive Engine Idle Hours", "severity": "medium",
     "details": "EQX-2007 Standard Crane logged 6.5h idle time with 1.2h engine runtime.",
     "anomaly_score": 78, "status": "active", "created_at": "2026-08-05 11:45"},
    {"id": "INC-103", "equipment_id": "EQX-2012", "type": "unauthorized_operator",
     "title": "Unauthorized Operator Scan", "severity": "high",
     "details": "Operator ID OP-994 is not cleared for Heavy Duty Bulldozer EQX-2012.",
     "anomaly_score": 88, "status": "active", "created_at": "2026-08-04 16:10"},
    {"id": "INC-104", "equipment_id": "EQX-2019", "type": "service_limit_exceeded",
     "title": "500-Hour Service Maintenance Required",
     "details": "Total engine runtime reached 512.4 hrs. Hydraulic fluid service overdue.",
     "severity": "warning", "anomaly_score": 65, "status": "active", "created_at": "2026-08-04 09:30"},
]

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
    incidents = list(_ORIGINAL)

    for i in range(16):
        eq_id = rng.choice(active_ids)
        itype, title, severity, detail_tpl = rng.choice(_TEMPLATES)
        resolved = rng.random() < 0.3
        day_offset = rng.randint(0, 6)
        created = SIM_TODAY.replace(day=max(1, SIM_TODAY.day - day_offset)) if SIM_TODAY.day - day_offset >= 1 else SIM_TODAY
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
