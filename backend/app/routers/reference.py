from fastapi import APIRouter, Depends

from ..deps import get_clients_repo, get_sites_repo
from ..repositories.base import Repo
from ..schemas.reference import ClientOut, SiteOut

router = APIRouter(tags=["reference"])


@router.get("/sites", response_model=list[SiteOut])
def list_sites(repo: Repo = Depends(get_sites_repo)):
    return repo.list()


@router.get("/clients", response_model=list[ClientOut])
def list_clients(repo: Repo = Depends(get_clients_repo)):
    return repo.list()
