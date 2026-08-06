import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

from app.services import reset_service
from app.db import get_supabase
from app.repositories.supabase_repo import SupabaseRepo

client = get_supabase()
repos = {
    "sites": SupabaseRepo(client, "sites"),
    "clients": SupabaseRepo(client, "clients"),
    "catalog": SupabaseRepo(client, "catalog"),
    "equipment": SupabaseRepo(client, "equipment"),
    "usage_logs": SupabaseRepo(client, "usage_logs"),
    "misuse_incidents": SupabaseRepo(client, "misuse_incidents"),
}

try:
    print("Starting reset...")
    res = reset_service.reset(repos)
    print("Success:", res)
except Exception as e:
    print("Error during reset:")
    print(repr(e))
