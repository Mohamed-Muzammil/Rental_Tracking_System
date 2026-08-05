from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from ..deps import get_incidents_repo
from ..repositories.base import Repo
from ..schemas.incidents import IncidentOut, ResolveIncidentRequest

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("", response_model=list[IncidentOut])
def list_incidents(status: Optional[str] = None, repo: Repo = Depends(get_incidents_repo)):
    return repo.list(status=status)


@router.post("/{incident_id}/resolve", response_model=IncidentOut)
def resolve_incident(incident_id: str, body: ResolveIncidentRequest, repo: Repo = Depends(get_incidents_repo)):
    if not repo.get(incident_id):
        raise HTTPException(404, f"Unknown incident {incident_id}")
    return repo.update(
        incident_id,
        {"status": "resolved", "resolution": body.action_type, "resolution_notes": body.notes},
    )
