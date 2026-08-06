"""Single source of truth for "the original demo snapshot" that
POST /api/admin/reset restores. Mirrors src/data/*.js at a larger, richer
scale for realistic testing, while keeping the same site ids / catalog ids
/ equipment types the ML pipeline (ml/generate_dataset.py) depends on.
"""

import copy

from .catalog import CATALOG
from .clients import CLIENTS
from .equipment import EQUIPMENT
from .incidents import INCIDENTS
from .sites import SITES
from .usage_logs import build_usage_logs


def get_seed() -> dict[str, list[dict]]:
    """Deep-copied so callers (reset_service, test fixtures) never mutate
    the shared module-level fixtures."""
    equipment = copy.deepcopy(EQUIPMENT)
    return {
        "sites": copy.deepcopy(SITES),
        "clients": copy.deepcopy(CLIENTS),
        "catalog": copy.deepcopy(CATALOG),
        "equipment": equipment,
        "usage_logs": build_usage_logs(equipment),
        "misuse_incidents": copy.deepcopy(INCIDENTS),
    }
