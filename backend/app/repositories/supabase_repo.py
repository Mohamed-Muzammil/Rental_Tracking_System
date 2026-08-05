"""Supabase-backed repository — talks to Postgres via PostgREST (supabase-py),
using the service-role secret key so it bypasses RLS. One instance per table.
"""

from typing import Optional

from supabase import Client


class SupabaseRepo:
    def __init__(self, client: Client, table: str, id_field: str = "id"):
        self.client = client
        self.table = table
        self.id_field = id_field

    def list(self, **filters) -> list[dict]:
        all_data = []
        limit = 1000
        offset = 0
        while True:
            query = self.client.table(self.table).select("*").range(offset, offset + limit - 1)
            for key, value in filters.items():
                if value is not None:
                    query = query.eq(key, value)
            
            data = query.execute().data
            all_data.extend(data)
            
            if len(data) < limit:
                break
            offset += limit
            
        return all_data

    def get(self, id: str) -> Optional[dict]:
        res = self.client.table(self.table).select("*").eq(self.id_field, id).limit(1).execute()
        return res.data[0] if res.data else None

    def insert(self, row: dict) -> dict:
        res = self.client.table(self.table).insert(row).execute()
        return res.data[0]

    def insert_many(self, rows: list[dict]) -> list[dict]:
        if not rows:
            return []
        out: list[dict] = []
        for i in range(0, len(rows), 500):
            chunk = rows[i : i + 500]
            res = self.client.table(self.table).insert(chunk).execute()
            out.extend(res.data)
        return out

    def update(self, id: str, patch: dict) -> Optional[dict]:
        res = self.client.table(self.table).update(patch).eq(self.id_field, id).execute()
        return res.data[0] if res.data else None

    def delete_all(self) -> None:
        # PostgREST requires a filter on delete; "id is not null" matches
        # every row regardless of the id column's type (text or bigint),
        # which is what lets a single code path reset both real and fake repos.
        self.client.table(self.table).delete().not_.is_(self.id_field, "null").execute()
