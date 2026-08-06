"""In-memory fake repository used by the pytest suite (via dependency
overrides in tests/conftest.py) so tests never touch the live Supabase
project. Implements the same shape as SupabaseRepo.
"""

from typing import Optional


class MemoryDB:
    def __init__(self):
        self.tables: dict[str, list[dict]] = {}
        self.next_id: dict[str, int] = {}


class MemoryRepo:
    def __init__(self, db: MemoryDB, table: str, id_field: str = "id", auto_id: bool = False):
        self.db = db
        self.table = table
        self.id_field = id_field
        self.auto_id = auto_id
        self.db.tables.setdefault(table, [])
        self.db.next_id.setdefault(table, 1)

    def list(self, **filters) -> list[dict]:
        rows = self.db.tables[self.table]
        active = {k: v for k, v in filters.items() if v is not None}
        if not active:
            return [dict(r) for r in rows]
        return [dict(r) for r in rows if all(r.get(k) == v for k, v in active.items())]

    def get(self, id: str) -> Optional[dict]:
        for r in self.db.tables[self.table]:
            if r[self.id_field] == id:
                return dict(r)
        return None

    def insert(self, row: dict) -> dict:
        row = dict(row)
        if self.auto_id and row.get(self.id_field) is None:
            row[self.id_field] = self.db.next_id[self.table]
            self.db.next_id[self.table] += 1
        self.db.tables[self.table].append(row)
        return dict(row)

    def insert_many(self, rows: list[dict]) -> list[dict]:
        return [self.insert(r) for r in rows]

    def update(self, id: str, patch: dict) -> Optional[dict]:
        for r in self.db.tables[self.table]:
            if r[self.id_field] == id:
                r.update(patch)
                return dict(r)
        return None

    def delete_all(self) -> None:
        self.db.tables[self.table] = []
        self.db.next_id[self.table] = 1


TABLE_SPECS = [
    ("sites", "id", False),
    ("clients", "id", False),
    ("catalog", "id", False),
    ("equipment", "id", False),
    ("usage_logs", "id", True),
    ("misuse_incidents", "id", False),
]


def build_memory_repos(seed: dict) -> dict[str, MemoryRepo]:
    db = MemoryDB()
    repos = {name: MemoryRepo(db, name, id_field, auto_id) for name, id_field, auto_id in TABLE_SPECS}
    for name, repo in repos.items():
        repo.insert_many(seed[name])
    return repos
