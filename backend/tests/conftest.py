import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import deps  # noqa: E402
from app.main import app  # noqa: E402
from app.repositories.memory_repo import build_memory_repos  # noqa: E402
from app.seed_data import get_seed  # noqa: E402

_DEP_MAP = {
    "sites": deps.get_sites_repo,
    "clients": deps.get_clients_repo,
    "catalog": deps.get_catalog_repo,
    "equipment": deps.get_equipment_repo,
    "usage_logs": deps.get_usage_logs_repo,
    "misuse_incidents": deps.get_incidents_repo,
}


@pytest.fixture
def memory_repos():
    return build_memory_repos(get_seed())


def _make_override(repo):
    # A plain closure, not a `lambda repo=repo: repo` default-arg trick —
    # FastAPI introspects an override callable's own parameters, and a
    # defaulted-but-unannotated param gets treated as a phantom query param
    # and silently re-resolved, handing routes a different repo instance
    # than the one seeded here. Zero parameters sidesteps that entirely.
    def _get():
        return repo

    return _get


@pytest.fixture
def client(memory_repos):
    for table, dep_fn in _DEP_MAP.items():
        app.dependency_overrides[dep_fn] = _make_override(memory_repos[table])
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
