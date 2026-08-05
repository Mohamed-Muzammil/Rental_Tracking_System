import mlForecast from '../data/mlForecast.json'
import { siteById } from '../data/sites'

// Output of the XGBoost model trained in ml/train_model.py. Predictions are
// computed offline and exported as JSON (batch inference) — retrain with:
//   python ml/generate_dataset.py && python ml/train_model.py
// then copy ml/artifacts/forecast_export.json to src/data/mlForecast.json.

export const model = {
  name: mlForecast.model,
  trainedOn: mlForecast.trainedOn,
  note: mlForecast.note,
  featureCount: mlForecast.features,
  trainRows: mlForecast.trainRows,
  testRows: mlForecast.testRows,
  testWindow: mlForecast.testWindow,
  horizonMonths: mlForecast.horizonMonths,
  metrics: mlForecast.metrics,
  siteLevelMetrics: mlForecast.siteLevelMetrics,
}

export const forecastTypes = Object.keys(mlForecast.byCategory).sort()

/** Actual + predicted monthly rentals for one category, ready to chart. */
export function mlSeriesFor(category) {
  return mlForecast.byCategory[category] ?? []
}

/**
 * Summary row per category: last actual, first projected month, and the change.
 *
 * The change is measured against the mean of the last 3 observed months, not
 * against the single most recent one. Monthly counts are noisy enough that a
 * one-month dip makes an ordinary forecast look like explosive growth (a 3 ->
 * 8 rebound reads as +167% against last month, but only +60% against trend).
 */
const BASELINE_MONTHS = 3

export function mlSummaries() {
  return forecastTypes.map((type) => {
    const series = mlSeriesFor(type)
    const actuals = series.filter((p) => p.actual != null)
    const projected = series.filter((p) => p.actual == null && p.forecast != null)

    const lastActual = actuals[actuals.length - 1]?.actual ?? 0
    const recent = actuals.slice(-BASELINE_MONTHS).map((p) => p.actual)
    const baseline = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0

    const nextForecast = projected[0]?.forecast ?? null
    const delta = nextForecast == null ? 0 : nextForecast - Math.round(baseline)
    const pct = nextForecast != null && baseline > 0
      ? Math.round(((nextForecast - baseline) / baseline) * 100)
      : 0

    return { type, series, lastActual, baseline, nextForecast, projected, delta, pct }
  })
}

/**
 * Reallocation candidates, derived from the model's per-site forecast for the
 * next month rather than hardcoded: for each category, compare the site with
 * the highest predicted demand against units of that category currently idle
 * elsewhere. Returns at most `limit` suggestions, biggest gap first.
 */
export function reallocationSuggestions(idleUnits, limit = 3) {
  const bySite = mlForecast.siteForecasts ?? []
  const out = []

  for (const unit of idleUnits) {
    if (!unit.siteId) continue

    const demandHere = bySite.find((f) => f.siteId === unit.siteId && f.category === unit.type)?.forecast ?? 0
    const target = bySite
      .filter((f) => f.category === unit.type && f.siteId !== unit.siteId)
      .sort((a, b) => b.forecast - a.forecast)[0]
    if (!target) continue

    const gap = target.forecast - demandHere
    if (gap <= 0) continue

    out.push({
      id: `REALLOC-${unit.id}`,
      unit,
      category: unit.type,
      fromSiteId: unit.siteId,
      fromSite: siteById[unit.siteId]?.name ?? unit.siteId,
      toSiteId: target.siteId,
      toSite: siteById[target.siteId]?.name ?? target.siteId,
      demandHere,
      demandThere: target.forecast,
      gap,
      month: target.month,
    })
  }

  return out.sort((a, b) => b.gap - a.gap).slice(0, limit)
}
