"""Repository interface every table-backed store implements, so routers can
depend on this shape without knowing whether they're talking to Supabase or
an in-memory fake (used by tests). One instance per table.
"""

from typing import Optional, Protocol


class Repo(Protocol):
    def list(self, **filters) -> list[dict]:
        ...

    def get(self, id: str) -> Optional[dict]:
        ...

    def insert(self, row: dict) -> dict:
        ...

    def insert_many(self, rows: list[dict]) -> list[dict]:
        ...

    def update(self, id: str, patch: dict) -> Optional[dict]:
        ...

    def delete_all(self) -> None:
        ...
