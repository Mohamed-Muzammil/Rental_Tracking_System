from typing import Literal, Optional

from . import CamelModel


class EquipmentOut(CamelModel):
    id: str
    type: str
    tier: str
    catalog_id: Optional[str] = None
    status: Literal["completed", "active", "maintenance", "hold"]
    site_id: Optional[str] = None
    client_id: Optional[str] = None
    operator_id: Optional[str] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    rental_days: Optional[int] = None
    expected_return: Optional[str] = None
    avg_engine_hours_per_day: float = 0
    avg_idle_hours_per_day: float = 0
    maintenance_note: Optional[str] = None
    expected_back_on: Optional[str] = None
    return_requested: bool = False
    qr_code: Optional[str] = None


class RegisterEquipmentRequest(CamelModel):
    id: Optional[str] = None
    type: str
    tier: str
    daily_cost: Optional[float] = None
    qr_code: Optional[str] = None


class HoldRequest(CamelModel):
    equipment_ids: list[str]
    client_id: str
    site_id: str


class CheckOutRequest(CamelModel):
    equipment_id: str
    site_id: str
    client_id: str
    operator_id: Optional[str] = None
    expected_return: str


class BatchCheckOutRequest(CamelModel):
    equipment_ids: list[str]
    site_id: str
    client_id: str
    expected_return: str


class ReturnRequest(CamelModel):
    condition: Literal["good", "damaged"] = "good"
    notes: Optional[str] = None


class ExtendRequest(CamelModel):
    extra_days: int
