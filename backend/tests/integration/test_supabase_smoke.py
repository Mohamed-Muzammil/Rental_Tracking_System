"""Hits the real Supabase project. Excluded from the default `pytest` run
(see pytest.ini) — run deliberately with `pytest -m integration` after the
migration has been applied and the tables are populated via /api/admin/reset.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.db import get_supabase  # noqa: E402


@pytest.mark.integration
def test_can_read_sites_table():
    client = get_supabase()
    res = client.table("sites").select("*").limit(1).execute()
    assert isinstance(res.data, list)
