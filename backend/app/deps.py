"""Depends() providers for repositories. Routers depend on these functions,
never on supabase-py or the repository classes directly — tests override
these in app.dependency_overrides to swap in in-memory fakes.
"""

from .db import get_supabase
from .repositories.supabase_repo import SupabaseRepo


def get_sites_repo() -> SupabaseRepo:
    return SupabaseRepo(get_supabase(), "sites")


def get_clients_repo() -> SupabaseRepo:
    return SupabaseRepo(get_supabase(), "clients")


def get_catalog_repo() -> SupabaseRepo:
    return SupabaseRepo(get_supabase(), "catalog")


def get_equipment_repo() -> SupabaseRepo:
    return SupabaseRepo(get_supabase(), "equipment")


def get_usage_logs_repo() -> SupabaseRepo:
    return SupabaseRepo(get_supabase(), "usage_logs")


def get_incidents_repo() -> SupabaseRepo:
    return SupabaseRepo(get_supabase(), "misuse_incidents")
