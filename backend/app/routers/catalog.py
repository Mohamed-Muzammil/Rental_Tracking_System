from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from ..deps import get_catalog_repo, get_equipment_repo
from ..repositories.base import Repo
from ..schemas.equipment import EquipmentOut
from ..schemas.reference import CatalogOut, RentRequest
from ..services.allocation import rent_from_catalog

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("", response_model=list[CatalogOut])
def list_catalog(repo: Repo = Depends(get_catalog_repo)):
    return repo.list()


@router.post("/{catalog_id}/rent")
def rent(
    catalog_id: str,
    body: RentRequest,
    catalog_repo: Repo = Depends(get_catalog_repo),
    equipment_repo: Repo = Depends(get_equipment_repo),
):
    item = catalog_repo.get(catalog_id)
    if not item:
        raise HTTPException(404, f"Unknown catalog item {catalog_id}")

    equipment, allocated = rent_from_catalog(
        item, body.site_id, body.client_id, equipment_repo, date.today()
    )
    return {"equipment": EquipmentOut.model_validate(equipment), "allocated": allocated}
