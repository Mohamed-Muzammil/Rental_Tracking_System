from typing import Optional

from . import CamelModel


class SiteOut(CamelModel):
    id: str
    name: str
    region: str
    lat: float
    lng: float
    radius_km: float


class ClientOut(CamelModel):
    id: str
    name: str
    contact: str
    sites: list[str] = []


class CatalogOut(CamelModel):
    id: str
    type: str
    tier: str
    daily_cost: float
    min_usage_hrs: float
    max_usage_hrs: float


class RentRequest(CamelModel):
    site_id: Optional[str] = None
    client_id: str = "C001"
