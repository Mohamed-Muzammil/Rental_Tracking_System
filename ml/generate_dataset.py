"""
Generate a synthetic rental-demand history for model training.

WHY SYNTHETIC: the app ships 7 months x 7 categories = 49 observations, which is
far too small to fit a gradient-boosted model. This script simulates 5 years of
monthly demand per (category, site) so there is enough signal to learn from.

The generative process below is deliberately NOT trivially learnable: demand is
driven by a category base level, a site multiplier, a slow trend, an annual
seasonal cycle with a category-specific phase, occasional project-scale shocks,
and negative-binomial-style count noise. A model has to recover the interaction
of those pieces, not memorise a formula.

Output: ml/data/demand_history.csv
"""

from pathlib import Path

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)  # fixed seed -> reproducible dataset

START = pd.Timestamp("2021-08-01")
MONTHS = 60  # 5 years through 2026-07

# Calibrated so fleet-wide monthly totals per category land in the range a
# ~40-unit fleet could actually serve (Excavator ~14/month, Roller ~5/month),
# matching the magnitudes the rest of the app displays. Raising these inflates
# demand past what the fleet could fulfil; the shapes stay the same either way.
SCALE = 0.128

# Mirrors src/data/catalog.js and src/data/sites.js so the trained model speaks
# the same vocabulary as the app.
CATEGORIES = {
    #                 base  trend/mo  seasonal amp  peak month  noise
    "Excavator": dict(base=9.0, trend=0.055, amp=0.28, peak=5, noise=0.16),
    "Bulldozer": dict(base=7.0, trend=0.012, amp=0.20, peak=6, noise=0.15),
    "Crane": dict(base=5.5, trend=-0.040, amp=0.16, peak=8, noise=0.20),
    "Grader": dict(base=3.6, trend=0.020, amp=0.34, peak=6, noise=0.22),
    "Forklift": dict(base=6.2, trend=0.048, amp=0.14, peak=11, noise=0.14),
    "Loader": dict(base=4.4, trend=0.022, amp=0.22, peak=5, noise=0.18),
    "Roller": dict(base=3.2, trend=0.008, amp=0.42, peak=7, noise=0.24),
}
for _cfg in CATEGORIES.values():  # trend scales with level, so shapes are preserved
    _cfg["base"] *= SCALE
    _cfg["trend"] *= SCALE

SITES = {
    "S001": dict(name="North Yard", region="Metro North", mult=1.25),
    "S002": dict(name="Riverside Site", region="Metro East", mult=1.10),
    "S003": dict(name="Hillside Quarry", region="Highlands", mult=1.30),
    "S004": dict(name="East Depot", region="Metro East", mult=0.75),
    "S005": dict(name="Central Plant", region="Metro Central", mult=0.95),
    "S006": dict(name="Lakeside Project", region="Highlands", mult=0.80),
    "S007": dict(name="Westgate Expansion", region="Metro West", mult=1.05),
    "S008": dict(name="Harbour Terminal", region="Coastal", mult=0.90),
    "S009": dict(name="Ridgeline Tunnel", region="Highlands", mult=0.70),
    "S010": dict(name="Southfield Logistics", region="Metro South", mult=0.85),
    "S011": dict(name="Airport Runway Ph2", region="Metro West", mult=1.15),
    "S012": dict(name="Granite Ridge Mine", region="Highlands", mult=1.00),
}

# Sites in these regions skew toward earth-moving; coastal/logistics skew toward
# materials handling. Gives the model a real category x site interaction to find.
REGION_AFFINITY = {
    "Highlands": {"Excavator": 1.25, "Bulldozer": 1.30, "Loader": 1.20, "Forklift": 0.65, "Crane": 0.85},
    "Coastal": {"Forklift": 1.55, "Crane": 1.25, "Bulldozer": 0.70, "Grader": 0.60},
    "Metro South": {"Forklift": 1.40, "Roller": 0.80, "Crane": 0.90},
    "Metro West": {"Roller": 1.45, "Grader": 1.35, "Crane": 0.95},
    "Metro North": {"Excavator": 1.15, "Roller": 1.10},
    "Metro East": {"Crane": 1.20, "Loader": 1.10},
    "Metro Central": {"Forklift": 1.20, "Excavator": 0.90},
}


def build() -> pd.DataFrame:
    months = pd.date_range(START, periods=MONTHS, freq="MS")
    rows = []

    for site_id, site in SITES.items():
        affinity = REGION_AFFINITY.get(site["region"], {})

        for category, cfg in CATEGORIES.items():
            # Each (site, category) series gets its own multi-month project
            # shocks — contracts starting and ending — so the series are not
            # pure smooth curves.
            shock = np.zeros(MONTHS)
            for _ in range(RNG.integers(1, 4)):
                start = RNG.integers(0, MONTHS - 4)
                length = RNG.integers(3, 9)
                size = RNG.uniform(0.25, 0.85) * (1 if RNG.random() < 0.7 else -1)
                shock[start : start + length] += size

            level = cfg["base"] * site["mult"] * affinity.get(category, 1.0)

            for t, month in enumerate(months):
                trend = cfg["trend"] * t
                season = cfg["amp"] * np.sin(2 * np.pi * (month.month - cfg["peak"]) / 12)
                mean = max(0.25, level * (1 + season + shock[t]) + trend)
                # Overdispersed counts: Poisson mean jittered by a lognormal
                # factor, which is what real rental counts look like.
                jitter = RNG.lognormal(mean=0.0, sigma=cfg["noise"])
                rentals = int(RNG.poisson(max(0.05, mean * jitter)))

                rows.append(
                    {
                        "month": month.strftime("%Y-%m"),
                        "site_id": site_id,
                        "site_name": site["name"],
                        "region": site["region"],
                        "category": category,
                        "rentals": rentals,
                    }
                )

    return pd.DataFrame(rows)


if __name__ == "__main__":
    df = build()
    out = Path(__file__).parent / "data"
    out.mkdir(exist_ok=True)
    path = out / "demand_history.csv"
    df.to_csv(path, index=False)

    print(f"wrote {path}")
    print(f"rows: {len(df):,}  months: {df.month.nunique()}  "
          f"series: {df.groupby(['site_id', 'category']).ngroups}")
    print(f"range: {df.month.min()} -> {df.month.max()}")
    print(f"rentals/month: mean {df.rentals.mean():.2f}  max {df.rentals.max()}  zeros {(df.rentals == 0).mean():.1%}")
    print("\nby category (total over 5y):")
    print(df.groupby("category").rentals.sum().sort_values(ascending=False).to_string())
