from typing import Any, Optional

from . import CamelModel


class MlModelMeta(CamelModel):
    model: str
    trained_on: str
    note: str
    features: int
    train_rows: int
    test_rows: int
    test_window: str
    horizon_months: int
    metrics: dict[str, Any]
    site_level_metrics: dict[str, Any]


class ForecastResponse(MlModelMeta):
    by_category: dict[str, list[dict[str, Any]]]
    site_forecasts: list[dict[str, Any]]


class TrainResponse(CamelModel):
    ok: bool
    trained_at: str
    metrics: dict[str, Any]
    categories: int
