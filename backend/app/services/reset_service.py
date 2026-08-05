"""Wipes and reseeds every table back to the original demo snapshot. Used
by POST /api/admin/reset — the explicit "testing phase" undo-everything
button the frontend Dashboard exposes.

Operates purely through the Repo interface (delete_all/insert_many), so the
exact same code path is exercised against real Supabase repos in production
and in-memory fakes in tests/test_reset.py — no separate "how do I reset a
fake DB" logic to keep in sync.
"""

from datetime import datetime, timezone

from ..repositories.base import Repo
from ..seed_data import get_seed

# Delete in reverse-FK order, insert in forward-FK order.
_TABLE_ORDER = ["sites", "clients", "catalog", "equipment", "usage_logs", "misuse_incidents"]


def reset(repos: dict[str, Repo]) -> dict:
    for table in reversed(_TABLE_ORDER):
        repos[table].delete_all()

    seed = get_seed()
    counts = {}
    for table in _TABLE_ORDER:
        rows = seed[table]
        if table == "usage_logs":
            # id is DB-generated (bigserial) — never insert a client-side one.
            rows = [{k: v for k, v in row.items() if k != "id"} for row in rows]
        inserted = repos[table].insert_many(rows)
        counts[table] = len(inserted)

    return {
        "ok": True,
        "reset_at": datetime.now(timezone.utc).isoformat(),
        "counts": counts,
    }
