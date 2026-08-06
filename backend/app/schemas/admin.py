from . import CamelModel


class ResetResponse(CamelModel):
    ok: bool
    reset_at: str
    counts: dict[str, int]
