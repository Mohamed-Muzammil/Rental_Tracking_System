from typing import Optional

from . import CamelModel


class LocationIn(CamelModel):
    lat: float
    lng: float


class UsageLogOut(CamelModel):
    id: Optional[int] = None
    equipment_id: str
    operator_id: Optional[str] = None
    date: str
    engine_hours: float
    idle_hours: float
    fuel_usage_l: Optional[float] = None
    location: Optional[dict] = None


class LogUsageRequest(CamelModel):
    equipment_id: str
    engine_hours: float
    idle_hours: float
    fuel_usage_l: Optional[float] = None
    operator_id: Optional[str] = None
    location: Optional[LocationIn] = None
