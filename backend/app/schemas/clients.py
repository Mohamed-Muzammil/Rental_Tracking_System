from typing import List, Optional
from . import CamelModel

class BillingHistoryItem(CamelModel):
    id: str
    date: str
    amount: float
    status: str

class ClientOut(CamelModel):
    id: str
    name: str
    contact: str
    sites: List[str]
    description: Optional[str] = None
    overdue_amount: float = 0
    fine_amount: float = 0
    paid_fines: float = 0
    billing_history: List[BillingHistoryItem] = []

class IssueFineRequest(CamelModel):
    equipment_id: str
    amount: float
