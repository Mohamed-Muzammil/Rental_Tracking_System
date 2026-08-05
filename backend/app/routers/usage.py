from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from ..deps import get_equipment_repo, get_usage_logs_repo
from ..repositories.base import Repo
from ..schemas.usage import LogUsageRequest, UsageLogOut
from ..seed_data.sites import SITE_BY_ID
from ..services.geo import point_near_site

router = APIRouter(prefix="/usage-logs", tags=["usage"])


@router.get("", response_model=list[UsageLogOut])
def list_usage_logs(
    equipment_id: Optional[str] = Query(default=None, alias="equipmentId"),
    repo: Repo = Depends(get_usage_logs_repo),
):
    return repo.list(equipment_id=equipment_id)


@router.post("", response_model=UsageLogOut)
def log_usage(
    body: LogUsageRequest,
    usage_repo: Repo = Depends(get_usage_logs_repo),
    equipment_repo: Repo = Depends(get_equipment_repo),
):
    eq = equipment_repo.get(body.equipment_id)
    if not eq:
        raise HTTPException(404, f"Unknown equipment {body.equipment_id}")

    location = body.location.model_dump() if body.location else point_near_site(eq.get("site_id"), SITE_BY_ID, 0)

    row = {
        "equipment_id": body.equipment_id,
        "operator_id": body.operator_id,
        "date": date.today().isoformat(),
        "engine_hours": body.engine_hours,
        "idle_hours": body.idle_hours,
        "fuel_usage_l": body.fuel_usage_l,
        "location": location,
    }
    created = usage_repo.insert(row)

    equipment_repo.update(
        body.equipment_id,
        {"avg_engine_hours_per_day": body.engine_hours, "avg_idle_hours_per_day": body.idle_hours},
    )

    return created
