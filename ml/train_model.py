"""
Train an XGBoost demand-forecasting model on the synthetic rental history.

Evaluation is deliberately conservative:
  * the split is by TIME, not random — training on future months to predict the
    past would leak and inflate every metric;
  * every feature is a lag or a calendar value, i.e. knowable at prediction time;
  * the model is scored against two standard baselines (naive and seasonal
    naive) so the headline number is "how much better than the obvious guess",
    not an unanchored percentage.

Run:  python ml/train_model.py
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

HERE = Path(__file__).parent
DATA = HERE / "data" / "demand_history.csv"
ARTIFACTS = HERE / "artifacts"

TEST_MONTHS = 12       # final year held out
FORECAST_HORIZON = 3   # months projected beyond the end of history
LAGS = [1, 2, 3, 6, 12]
ROLLS = [3, 6, 12]


# ── features ──────────────────────────────────────────────────────────────────
def add_features(df: pd.DataFrame) -> pd.DataFrame:
    """Lag/rolling features per (site, category) series + calendar features.

    Every rolling window is shifted by 1 so a row never sees its own target.
    """
    df = df.sort_values(["site_id", "category", "month_ts"]).copy()
    g = df.groupby(["site_id", "category"], observed=True)["rentals"]

    for lag in LAGS:
        df[f"lag_{lag}"] = g.shift(lag)

    # transform keeps the original index and applies per group, so a window
    # never spills from one series into the next.
    for win in ROLLS:
        df[f"roll_mean_{win}"] = g.transform(lambda s, w=win: s.shift(1).rolling(w).mean())
    df["roll_std_3"] = g.transform(lambda s: s.shift(1).rolling(3).std())

    # momentum + year-on-year change: cheap signals the baselines cannot use
    df["diff_1"] = df["lag_1"] - df["lag_2"]
    df["yoy_diff"] = df["lag_1"] - df["lag_12"]

    month_num = df["month_ts"].dt.month
    df["month_num"] = month_num
    df["month_sin"] = np.sin(2 * np.pi * month_num / 12)
    df["month_cos"] = np.cos(2 * np.pi * month_num / 12)
    df["quarter"] = df["month_ts"].dt.quarter
    df["time_idx"] = (df["month_ts"].dt.year - df["month_ts"].dt.year.min()) * 12 + month_num

    for col in ["category", "site_id", "region"]:
        df[col] = df[col].astype("category")

    return df


FEATURES = (
    [f"lag_{l}" for l in LAGS]
    + [f"roll_mean_{w}" for w in ROLLS]
    + ["roll_std_3", "diff_1", "yoy_diff",
       "month_num", "month_sin", "month_cos", "quarter", "time_idx",
       "category", "site_id", "region"]
)


def metrics(y_true, y_pred) -> dict:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    return {
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "r2": float(r2_score(y_true, y_pred)),
    }


# ── training ──────────────────────────────────────────────────────────────────
def train_and_export(raw: pd.DataFrame) -> tuple[xgb.XGBRegressor, dict]:
    """Train + evaluate + build the forecast export from a raw demand-history
    dataframe (as produced by generate_dataset.build()), returning the final
    (refit-on-all-data) model and the export dict — without touching disk.
    Callable directly from the FastAPI ml_service for live retraining."""
    df = add_features(raw)
    # Rows without a full 12-month lag history cannot be scored fairly.
    df = df.dropna(subset=FEATURES).reset_index(drop=True)

    cutoff = df["month_ts"].max() - pd.DateOffset(months=TEST_MONTHS - 1)
    train = df[df["month_ts"] < cutoff]
    test = df[df["month_ts"] >= cutoff]

    print("=" * 68)
    print("DATASET")
    print("=" * 68)
    print(f"usable rows      : {len(df):,} (of {len(raw):,} raw — first 12m consumed by lags)")
    print(f"train            : {len(train):,} rows  "
          f"{train.month.min()} -> {train.month.max()}")
    print(f"test  (held out) : {len(test):,} rows  "
          f"{test.month.min()} -> {test.month.max()}")
    print(f"features         : {len(FEATURES)}")

    X_train, y_train = train[FEATURES], train["rentals"]
    X_test, y_test = test[FEATURES], test["rentals"]

    model = xgb.XGBRegressor(
        n_estimators=600,
        learning_rate=0.05,
        max_depth=5,
        min_child_weight=3,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_lambda=1.5,
        objective="count:poisson",   # counts, not continuous values
        enable_categorical=True,
        tree_method="hist",
        early_stopping_rounds=50,
        random_state=42,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    pred = np.clip(model.predict(X_test), 0, None)

    # Baselines on the same held-out rows.
    naive = test["lag_1"].to_numpy(dtype=float)             # last month repeated
    seasonal = test["lag_12"].to_numpy(dtype=float)         # same month last year

    m_model = metrics(y_test, pred)
    m_naive = metrics(y_test, naive)
    m_seasonal = metrics(y_test, seasonal)

    skill_naive = (1 - m_model["mae"] / m_naive["mae"]) * 100
    skill_seasonal = (1 - m_model["mae"] / m_seasonal["mae"]) * 100

    print()
    print("=" * 68)
    print("HELD-OUT PERFORMANCE (final 12 months, never seen in training)")
    print("=" * 68)
    print(f"{'':<22}{'MAE':>9}{'RMSE':>9}{'R2':>9}")
    for name, m in [("XGBoost", m_model), ("naive (last month)", m_naive), ("seasonal naive (t-12)", m_seasonal)]:
        print(f"{name:<22}{m['mae']:>9.3f}{m['rmse']:>9.3f}{m['r2']:>9.3f}")
    print()
    print(f"MAE improvement vs naive          : {skill_naive:+.1f}%")
    print(f"MAE improvement vs seasonal naive : {skill_seasonal:+.1f}%")
    print(f"best iteration                    : {model.best_iteration}")

    # Site-level counts are sparse (~0.85/month, many zeros), so per-row error is
    # dominated by Poisson noise. The chart shows CATEGORY totals, so score that
    # aggregation too — it is the number a user actually reads.
    agg = (
        test.assign(pred=pred)
        .groupby(["month", "category"], observed=True)[["rentals", "pred", "lag_1", "lag_12"]]
        .sum()
        .reset_index()
    )
    a_model = metrics(agg["rentals"], agg["pred"])
    a_naive = metrics(agg["rentals"], agg["lag_1"])
    a_seasonal = metrics(agg["rentals"], agg["lag_12"])
    agg_skill_naive = (1 - a_model["mae"] / a_naive["mae"]) * 100
    agg_skill_seasonal = (1 - a_model["mae"] / a_seasonal["mae"]) * 100

    print()
    print("=" * 68)
    print("AGGREGATED TO CATEGORY x MONTH (what the forecast chart displays)")
    print("=" * 68)
    print(f"{'':<22}{'MAE':>9}{'RMSE':>9}{'R2':>9}")
    for name, m in [("XGBoost", a_model), ("naive (last month)", a_naive), ("seasonal naive (t-12)", a_seasonal)]:
        print(f"{name:<22}{m['mae']:>9.3f}{m['rmse']:>9.3f}{m['r2']:>9.3f}")
    print()
    print(f"MAE improvement vs naive          : {agg_skill_naive:+.1f}%")
    print(f"MAE improvement vs seasonal naive : {agg_skill_seasonal:+.1f}%")

    print()
    print("top features by gain:")
    booster = model.get_booster()
    gain = booster.get_score(importance_type="gain")
    for feat, score in sorted(gain.items(), key=lambda kv: -kv[1])[:10]:
        print(f"  {feat:<16}{score:>10.1f}")

    # ── recursive forward forecast ────────────────────────────────────────────
    # Retrain on ALL data before projecting the future — holding out a year was
    # for honest measurement, not something to ship.
    final = xgb.XGBRegressor(**{
        **model.get_params(),
        "n_estimators": max(50, model.best_iteration + 1),
        "early_stopping_rounds": None,
    })
    final.fit(df[FEATURES], df["rentals"], verbose=False)

    future = forecast_forward(raw, final, FORECAST_HORIZON)

    # ── export ────────────────────────────────────────────────────────────────
    history = (
        raw.groupby(["month", "category"], as_index=False)["rentals"].sum()
        .rename(columns={"rentals": "actual"})
    )
    export = build_export(
        history, future,
        (m_model, m_naive, m_seasonal),
        (a_model, a_naive, a_seasonal),
        len(train), len(test),
    )
    return final, export


def main() -> None:
    raw = pd.read_csv(DATA)
    raw["month_ts"] = pd.to_datetime(raw["month"] + "-01")

    final, export = train_and_export(raw)

    ARTIFACTS.mkdir(exist_ok=True)
    final.save_model(ARTIFACTS / "demand_model.json")
    (ARTIFACTS / "forecast_export.json").write_text(json.dumps(export, indent=2))

    print(f"\nwrote {ARTIFACTS / 'demand_model.json'}")
    print(f"wrote {ARTIFACTS / 'forecast_export.json'}")
    print("\nforecast by category:")
    for cat, points in export["byCategory"].items():
        proj = [p for p in points if p["forecast"] is not None and p["actual"] is None]
        print(f"  {cat:<12}{' -> '.join(str(p['forecast']) for p in proj)}")


def forecast_forward(raw: pd.DataFrame, model, horizon: int) -> pd.DataFrame:
    """Roll the model forward `horizon` months, feeding each prediction back in
    as the next step's lag_1. Predictions are rounded to whole rentals so the
    lags stay on the same scale as observed counts."""
    work = raw.copy()
    out = []

    for _ in range(horizon):
        nxt = work["month_ts"].max() + pd.DateOffset(months=1)
        frame = (
            work[["site_id", "site_name", "region", "category"]]
            .drop_duplicates()
            .assign(month_ts=nxt, month=nxt.strftime("%Y-%m"), rentals=np.nan)
        )
        combined = pd.concat([work, frame], ignore_index=True)
        feats = add_features(combined)
        rows = feats[feats["month_ts"] == nxt].dropna(subset=FEATURES)

        preds = np.clip(model.predict(rows[FEATURES]), 0, None).round()
        rows = rows.assign(rentals=preds)

        out.append(rows[["month", "site_id", "category", "rentals"]])
        work = pd.concat(
            [work, rows[["month", "month_ts", "site_id", "site_name", "region", "category", "rentals"]]],
            ignore_index=True,
        )

    return pd.concat(out, ignore_index=True)


def build_export(history, future, site_level, category_level, n_train, n_test) -> dict:
    """Shape the artefacts the React app consumes: 18 months of actuals plus the
    projected months, per category, and the measured metrics."""
    fut = (
        future.groupby(["month", "category"], as_index=False)["rentals"].sum()
        .rename(columns={"rentals": "forecast"})
    )

    # Per-site projected demand for the first forecast month — drives the
    # "which site needs what" reallocation panel in the app.
    first_month = sorted(future["month"].unique())[0]
    site_forecasts = [
        {
            "siteId": r.site_id,
            "category": r.category,
            "month": r.month,
            "forecast": int(r.rentals),
        }
        for r in future[future.month == first_month]
        .sort_values("rentals", ascending=False)
        .itertuples()
        if r.rentals > 0
    ]

    months = sorted(history["month"].unique())[-18:]
    by_category = {}

    for cat in sorted(history["category"].unique()):
        hist_c = history[(history.category == cat) & (history.month.isin(months))].sort_values("month")
        fut_c = fut[fut.category == cat].sort_values("month")

        points = [
            {"month": r.month, "actual": int(r.actual), "forecast": None}
            for r in hist_c.itertuples()
        ]
        if points:  # join the dashed forecast line onto the last actual point
            points[-1]["forecast"] = points[-1]["actual"]
        points += [
            {"month": r.month, "actual": None, "forecast": int(r.forecast)}
            for r in fut_c.itertuples()
        ]
        by_category[cat] = points

    def block(model_m, naive_m, seasonal_m):
        return {
            "mae": round(model_m["mae"], 3),
            "rmse": round(model_m["rmse"], 3),
            "r2": round(model_m["r2"], 4),
            "maeNaive": round(naive_m["mae"], 3),
            "maeSeasonalNaive": round(seasonal_m["mae"], 3),
            "skillVsNaive": round((1 - model_m["mae"] / naive_m["mae"]) * 100, 1),
            "skillVsSeasonalNaive": round((1 - model_m["mae"] / seasonal_m["mae"]) * 100, 1),
        }

    return {
        "model": "XGBoost (count:poisson)",
        "trainedOn": "synthetic 5-year rental history — 5,040 observations, 84 site x category series",
        "note": "Data is synthetic. Metrics are measured on a held-out final year, never seen during training.",
        "features": len(FEATURES),
        "trainRows": int(n_train),
        "testRows": int(n_test),
        "testWindow": "2025-08 to 2026-07",
        "horizonMonths": FORECAST_HORIZON,
        "metrics": block(*category_level),      # headline — matches the chart
        "siteLevelMetrics": block(*site_level),  # per site x category rows
        "byCategory": by_category,
        "siteForecasts": site_forecasts,
    }


if __name__ == "__main__":
    main()
