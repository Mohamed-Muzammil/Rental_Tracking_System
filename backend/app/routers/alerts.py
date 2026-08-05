from datetime import date

from fastapi import APIRouter, Depends

from ..deps import get_catalog_repo, get_equipment_repo, get_sites_repo, get_usage_logs_repo
from ..repositories.base import Repo
from ..schemas.alerts import AlertOut
from ..services.rules import build_alerts

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertOut])
def list_alerts(
    today: date | None = None,
    equipment_repo: Repo = Depends(get_equipment_repo),
    usage_repo: Repo = Depends(get_usage_logs_repo),
    site_repo: Repo = Depends(get_sites_repo),
    catalog_repo: Repo = Depends(get_catalog_repo),
):
    site_by_id = {s["id"]: s for s in site_repo.list()}
    catalog = catalog_repo.list()
    catalog_by_id = {c["id"]: c for c in catalog}
    catalog_by_type: dict[str, list[dict]] = {}
    for c in catalog:
        catalog_by_type.setdefault(c["type"], []).append(c)

    return build_alerts(
        equipment_repo.list(),
        today or date.today(),
        usage_repo.list(),
        site_by_id,
        catalog_by_id,
        catalog_by_type,
    )
