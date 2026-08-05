from typing import Optional

from . import CamelModel


class AlertOut(CamelModel):
    id: str
    equipment_id: str
    type: str
    severity: str
    message: str
    recommendation: Optional[dict] = None
