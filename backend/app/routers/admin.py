from fastapi import APIRouter, Depends

from ..deps import (
    get_catalog_repo,
    get_clients_repo,
    get_equipment_repo,
    get_incidents_repo,
    get_sites_repo,
    get_usage_logs_repo,
)
from ..repositories.base import Repo
from ..schemas.admin import ResetResponse
from ..services import reset_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/reset", response_model=ResetResponse)
def reset(
    sites_repo: Repo = Depends(get_sites_repo),
    clients_repo: Repo = Depends(get_clients_repo),
    catalog_repo: Repo = Depends(get_catalog_repo),
    equipment_repo: Repo = Depends(get_equipment_repo),
    usage_repo: Repo = Depends(get_usage_logs_repo),
    incidents_repo: Repo = Depends(get_incidents_repo),
):
    repos = {
        "sites": sites_repo,
        "clients": clients_repo,
        "catalog": catalog_repo,
        "equipment": equipment_repo,
        "usage_logs": usage_repo,
        "misuse_incidents": incidents_repo,
    }
    return reset_service.reset(repos)
