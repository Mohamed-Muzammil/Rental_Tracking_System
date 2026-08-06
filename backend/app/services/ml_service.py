"""Live demand-forecasting service, backing POST /api/ml/train and
GET /api/ml/forecast. Imports the repo-root ml/ package directly (its
generate_dataset.build() + train_model.train_and_export() are unchanged
from the standalone script) and caches results in-memory + on-disk under
a gitignored backend/ml_artifacts/ — kept separate from the git-tracked
ml/artifacts/ reference outputs so /train never creates surprise git diffs.
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

ARTIFACTS_DIR = Path(__file__).resolve().parents[2] / "ml_artifacts"

_cache: dict = {"model": None, "export": None}


def train() -> dict:
    from ml import generate_dataset, train_model

    df = generate_dataset.build()
    df["month_ts"] = pd.to_datetime(df["month"] + "-01")

    model, export = train_model.train_and_export(df)
    _cache["model"] = model
    _cache["export"] = export

    ARTIFACTS_DIR.mkdir(exist_ok=True)
    model.save_model(ARTIFACTS_DIR / "demand_model.json")
    (ARTIFACTS_DIR / "forecast_export.json").write_text(json.dumps(export))

    return export


def load_from_disk_or_train() -> dict:
    path = ARTIFACTS_DIR / "forecast_export.json"
    if path.exists():
        _cache["export"] = json.loads(path.read_text())
        return _cache["export"]
    return train()


def get_forecast() -> dict:
    if _cache["export"] is None:
        load_from_disk_or_train()
    return _cache["export"]


def train_response(export: dict) -> dict:
    return {
        "ok": True,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "metrics": export["metrics"],
        "categories": len(export["byCategory"]),
    }
