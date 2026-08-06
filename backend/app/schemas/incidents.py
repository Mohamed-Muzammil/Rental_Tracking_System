from typing import Literal, Optional

from . import CamelModel

ActionType = Literal["false_alarm", "warn_operator", "penalty", "inspection", "recall"]


class IncidentOut(CamelModel):
    id: str
    equipment_id: Optional[str] = None
    type: Literal["geofence_breach", "excessive_idle", "unauthorized_operator", "service_limit_exceeded"]
    title: str
    severity: Literal["critical", "medium", "high", "warning"]
    details: Optional[str] = None
    anomaly_score: Optional[float] = None
    status: Literal["active", "resolved"] = "active"
    created_at: str
    resolution: Optional[str] = None
    resolution_notes: Optional[str] = None


class ResolveIncidentRequest(CamelModel):
    action_type: ActionType
    notes: Optional[str] = None
