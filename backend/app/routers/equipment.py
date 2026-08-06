import random
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from ..deps import get_catalog_repo, get_equipment_repo
from ..repositories.base import Repo
from ..schemas.equipment import (
    BatchCheckOutRequest,
    CheckOutRequest,
    EquipmentOut,
    ExtendRequest,
    HoldRequest,
    RegisterEquipmentRequest,
    ReturnRequest,
)
from ..seed_data.catalog import CATALOG_BY_TYPE
from ..services.rules import recommendation_for

router = APIRouter(prefix="/equipment", tags=["equipment"])


def _catalog_by_id(catalog_repo: Repo) -> dict:
    return {c["id"]: c for c in catalog_repo.list()}


def _catalog_by_type(catalog_repo: Repo) -> dict:
    by_type: dict[str, list[dict]] = {}
    for c in catalog_repo.list():
        by_type.setdefault(c["type"], []).append(c)
    return by_type


@router.get("", response_model=list[EquipmentOut])
def list_equipment(
    status: Optional[str] = None,
    site_id: Optional[str] = Query(default=None, alias="siteId"),
    client_id: Optional[str] = Query(default=None, alias="clientId"),
    type: Optional[str] = None,
    repo: Repo = Depends(get_equipment_repo),
):
    return repo.list(status=status, site_id=site_id, client_id=client_id, type=type)


@router.get("/{equipment_id}", response_model=EquipmentOut)
def get_equipment(equipment_id: str, repo: Repo = Depends(get_equipment_repo)):
    eq = repo.get(equipment_id)
    if not eq:
        raise HTTPException(404, f"Unknown equipment {equipment_id}")
    return eq


@router.post("/register", response_model=EquipmentOut)
def register_equipment(
    body: RegisterEquipmentRequest,
    equipment_repo: Repo = Depends(get_equipment_repo),
    catalog_repo: Repo = Depends(get_catalog_repo),
):
    if body.id:
        if equipment_repo.get(body.id):
            raise HTTPException(409, f"Equipment {body.id} already exists")
        new_id = body.id
    else:
        new_id = f"EQX-2{random.randint(0, 999):03d}"
        while equipment_repo.get(new_id):
            new_id = f"EQX-2{random.randint(0, 999):03d}"

    # Resolve the catalog entry from type+tier so daily_cost lives where it
    # belongs (on the catalog item), rather than being silently dropped.
    catalog_id = None
    for c in CATALOG_BY_TYPE.get(body.type, []):
        if c["tier"] == body.tier:
            catalog_id = c["id"]
            break
    if catalog_id is None:
        candidates = catalog_repo.list(type=body.type)
        catalog_id = candidates[0]["id"] if candidates else None

    row = {
        "id": new_id,
        "type": body.type,
        "tier": body.tier,
        "catalog_id": catalog_id,
        "status": "completed",
        "site_id": None,
        "client_id": None,
        "operator_id": None,
        "avg_engine_hours_per_day": 0,
        "avg_idle_hours_per_day": 0,
        "return_requested": False,
        "qr_code": body.qr_code or f"QR-{new_id}",
    }
    return equipment_repo.insert(row)


@router.post("/hold", response_model=list[EquipmentOut])
def hold(body: HoldRequest, repo: Repo = Depends(get_equipment_repo)):
    updated = []
    for eq_id in body.equipment_ids:
        row = repo.update(eq_id, {"status": "hold", "client_id": body.client_id, "site_id": body.site_id})
        if row:
            updated.append(row)
    return updated


def _checkout_fields(site_id: str, client_id: str, operator_id, expected_return: str, today: date) -> dict:
    return {
        "status": "active",
        "site_id": site_id,
        "client_id": client_id,
        "operator_id": operator_id,
        "check_in": today.isoformat(),
        "expected_return": expected_return,
        "avg_engine_hours_per_day": 0,
        "avg_idle_hours_per_day": 0,
        "return_requested": False,
    }


@router.post("/checkout", response_model=EquipmentOut)
def checkout(body: CheckOutRequest, repo: Repo = Depends(get_equipment_repo)):
    if not repo.get(body.equipment_id):
        raise HTTPException(404, f"Unknown equipment {body.equipment_id}")
    updated = repo.update(
        body.equipment_id,
        _checkout_fields(body.site_id, body.client_id, body.operator_id, body.expected_return, date.today()),
    )
    return updated


@router.post("/checkout/batch", response_model=list[EquipmentOut])
def checkout_batch(body: BatchCheckOutRequest, repo: Repo = Depends(get_equipment_repo)):
    today = date.today()
    updated = []
    for eq_id in body.equipment_ids:
        row = repo.update(
            eq_id, _checkout_fields(body.site_id, body.client_id, None, body.expected_return, today)
        )
        if row:
            updated.append(row)
    return updated


@router.post("/{equipment_id}/return", response_model=EquipmentOut)
def return_equipment(equipment_id: str, body: ReturnRequest, repo: Repo = Depends(get_equipment_repo)):
    if not repo.get(equipment_id):
        raise HTTPException(404, f"Unknown equipment {equipment_id}")
    is_damaged = body.condition == "damaged"
    patch = {
        "status": "maintenance" if is_damaged else "completed",
        "check_out": date.today().isoformat(),
        "operator_id": None,
        "return_requested": False,
        "maintenance_note": (body.notes or "Damaged upon return inspection") if is_damaged else None,
    }
    return repo.update(equipment_id, patch)


@router.post("/{equipment_id}/extend", response_model=EquipmentOut)
def extend(equipment_id: str, body: ExtendRequest, repo: Repo = Depends(get_equipment_repo)):
    eq = repo.get(equipment_id)
    if not eq:
        raise HTTPException(404, f"Unknown equipment {equipment_id}")
    current_return = date.fromisoformat(eq["expected_return"])
    new_return = current_return + timedelta(days=body.extra_days)
    return repo.update(equipment_id, {"expected_return": new_return.isoformat()})


@router.post("/{equipment_id}/request-return", response_model=EquipmentOut)
def request_return(equipment_id: str, repo: Repo = Depends(get_equipment_repo)):
    if not repo.get(equipment_id):
        raise HTTPException(404, f"Unknown equipment {equipment_id}")
    return repo.update(equipment_id, {"return_requested": True})


@router.post("/{equipment_id}/accept-recommendation", response_model=EquipmentOut)
def accept_recommendation(
    equipment_id: str,
    equipment_repo: Repo = Depends(get_equipment_repo),
    catalog_repo: Repo = Depends(get_catalog_repo),
):
    eq = equipment_repo.get(equipment_id)
    if not eq:
        raise HTTPException(404, f"Unknown equipment {equipment_id}")

    rec = recommendation_for(eq, _catalog_by_id(catalog_repo), _catalog_by_type(catalog_repo))
    if not rec:
        raise HTTPException(409, f"No rightsizing recommendation currently applies to {equipment_id}")

    return equipment_repo.update(
        equipment_id, {"catalog_id": rec["catalog"]["id"], "tier": rec["catalog"]["tier"]}
    )
