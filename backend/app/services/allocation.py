"""Port of appStore.js's rentFromCatalog: allocate an existing idle yard
unit of the requested catalog tier first, and only mint a brand-new
equipment record if the yard genuinely has none of that tier.
"""

import random
from datetime import date, timedelta

from ..repositories.base import Repo


def _dispatch_fields(site_id: str, client_id: str, today: date) -> dict:
    return {
        "status": "active",
        "site_id": site_id,
        "client_id": client_id,
        "operator_id": None,
        "check_in": today.isoformat(),
        "expected_return": (today + timedelta(days=30)).isoformat(),
        "avg_engine_hours_per_day": 0,
        "avg_idle_hours_per_day": 0,
        "return_requested": False,
    }


def rent_from_catalog(
    catalog_item: dict,
    site_id: str | None,
    client_id: str,
    equipment_repo: Repo,
    today: date,
) -> tuple[dict, str]:
    site_id = site_id or "S001"
    available = equipment_repo.list(status="completed", catalog_id=catalog_item["id"])

    if available:
        unit = available[0]
        updated = equipment_repo.update(unit["id"], _dispatch_fields(site_id, client_id, today))
        return updated, "existing"

    new_id = f"EQX-3{random.randint(0, 999):03d}"
    while equipment_repo.get(new_id):
        new_id = f"EQX-3{random.randint(0, 999):03d}"

    row = {
        "id": new_id,
        "type": catalog_item["type"],
        "tier": catalog_item["tier"],
        "catalog_id": catalog_item["id"],
        **_dispatch_fields(site_id, client_id, today),
    }
    created = equipment_repo.insert(row)
    return created, "new"
