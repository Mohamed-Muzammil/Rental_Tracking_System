from fastapi import APIRouter, Depends

from ..deps import get_equipment_repo
from ..repositories.base import Repo
from ..services.fleet import category_summary, fleet_utilization, time_utilization, utilization_ranking

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(repo: Repo = Depends(get_equipment_repo)):
    equipment = repo.list()
    active = [e for e in equipment if e["status"] == "active"]
    return {
        "categories": category_summary(equipment),
        "fleetUtilization": fleet_utilization(active),
        "timeUtilization": time_utilization(equipment),
        "utilizationRanking": utilization_ranking(active),
    }
