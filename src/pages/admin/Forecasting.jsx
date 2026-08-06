import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { mlModelMeta, mlSummaries, reallocationSuggestions } from '../../lib/mlForecast'
import { utilizationOf, UNDERUTILIZED_THRESHOLD } from '../../lib/rules'
import Card from '../../components/ui/Card'
import StatusChip from '../../components/ui/StatusChip'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import ForecastChart from '../../components/ui/ForecastChart'
import StatTile from '../../components/ui/StatTile'

export default function Forecasting() {
  const equipment = useAppStore((s) => s.equipment)
  const pushToast = useAppStore((s) => s.pushToast)
  const mlForecast = useAppStore((s) => s.mlForecast)

  const model = useMemo(() => mlModelMeta(mlForecast), [mlForecast])
  const summaries = useMemo(() => mlSummaries(mlForecast), [mlForecast])
  
  const [type, setType] = useState(summaries[0]?.type)
  const selected = summaries.find((s) => s.type === type) ?? summaries[0]

  // Ranked by absolute change, not percent: at these volumes a category can
  // swing +200% off a 2-rental baseline, which is noise dressed up as a signal.
  const topMover = useMemo(
    () => [...summaries].sort((a, b) => b.delta - a.delta)[0],
    [summaries],
  )

  // Reallocation is computed from the model's per-site forecast against units
  // that are actually idle right now — not a fixed list.
  const reallocations = useMemo(() => {
    const idle = equipment.filter(
      (e) => e.status === 'active' && utilizationOf(e) < UNDERUTILIZED_THRESHOLD,
    )
    return reallocationSuggestions(mlForecast, idle)
  }, [equipment, mlForecast])

  const handleReallocate = (r) => {
    pushToast(`Reallocation queued — ${r.unit.id} (${r.category}) from ${r.fromSite} to ${r.toSite}`, 'good')
  }

  const nextMonth = selected?.projected[0]?.month ?? '—'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
          Demand Forecasting
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Gradient-boosted model predicting monthly rental demand per category and site,
          driving pre-positioning of yard stock.
        </p>
      </div>

      {/* Measured model facts — every number here comes from the training run. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Forecast Month" value={nextMonth} unit={`+${model.horizonMonths}mo horizon`} />
        <StatTile
          label="Strongest Growth"
          value={topMover?.type ?? '—'}
          unit={topMover ? `${topMover.delta > 0 ? '+' : ''}${topMover.delta} vs 3-mo avg` : ''}
          severity={topMover?.pct > 0 ? 'good' : 'neutral'}
        />
        <StatTile
          label="Reallocation Opps"
          value={reallocations.length}
          unit="idle units to move"
          severity={reallocations.length ? 'warning' : 'neutral'}
        />
        <StatTile
          label="Model R²"
          value={model.metrics.r2.toFixed(2)}
          unit={`MAE ${model.metrics.mae}`}
          severity="good"
        />
      </div>

      <div
        className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border px-4 py-2.5 text-xs"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--ink-secondary)' }}
      >
        <span className="font-medium" style={{ color: 'var(--ink-primary)' }}>{model.name}</span>
        <span>{model.featureCount} features</span>
        <span>{model.trainRows.toLocaleString()} train / {model.testRows.toLocaleString()} held-out rows</span>
        <span>
          beats seasonal-naive baseline by{' '}
          <span className="font-medium" style={{ color: 'var(--good)' }}>
            {model.metrics.skillVsSeasonalNaive}%
          </span>{' '}
          MAE
        </span>
        <span className="ml-auto" style={{ color: 'var(--ink-muted)' }}>
          Trained on synthetic history · metrics measured on {model.testWindow}
        </span>
      </div>

      {/* Category selector */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {summaries.map((s) => (
          <button
            key={s.type}
            onClick={() => setType(s.type)}
            className="rounded-xl border p-3 text-left transition-transform hover:-translate-y-0.5"
            style={{
              background: 'var(--bg-surface)',
              borderColor: type === s.type ? 'var(--accent)' : 'var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="font-display text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-muted)' }}>
              {s.type}
            </div>
            <div className="tabular mt-1 font-data text-xl font-medium" style={{ color: 'var(--ink-primary)' }}>
              {s.nextForecast ?? '—'}
            </div>
            <div className="mt-1.5">
              <StatusChip severity={s.delta > 0 ? 'good' : s.delta < 0 ? 'warning' : 'neutral'}>
                {s.delta === 0 ? 'Flat' : `${s.delta > 0 ? '+' : ''}${s.delta}`}
              </StatusChip>
            </div>
          </button>
        ))}
      </div>

      <Card title={`${selected?.type} — actual vs predicted monthly demand`}>
        <ForecastChart data={selected?.series ?? []} />
        <p className="mt-3 border-t pt-3 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}>
          Solid line: observed rentals. Dashed: {model.name} projection, rolled forward{' '}
          {model.horizonMonths} months by feeding each prediction back in as the next month&apos;s lag.
          Features: lags 1/2/3/6/12, rolling means, month seasonality, category, site, region.
        </p>
      </Card>

      <Card title="Recommended reallocations — idle stock vs predicted site demand" bodyClassName="p-0">
        {reallocations.length === 0 ? (
          <p className="px-5 py-6 text-sm" style={{ color: 'var(--ink-secondary)' }}>
            No reallocation needed — no idle unit is sitting at a site with lower predicted demand than elsewhere.
          </p>
        ) : (
          <ul>
            {reallocations.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 border-t px-5 py-3.5 first:border-t-0 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: 'var(--accent-wash)', color: 'var(--accent)' }}
                  >
                    <Icon name="swap" size={17} />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-data text-xs font-medium" style={{ color: 'var(--ink-primary)' }}>
                        {r.unit.id}
                      </span>
                      <StatusChip severity="info">{r.category}</StatusChip>
                      <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                        idle at {Math.round(utilizationOf(r.unit) * 100)}% utilization
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                      Move from <span style={{ color: 'var(--ink-secondary)' }}>{r.fromSite}</span> →{' '}
                      <span style={{ color: 'var(--accent)' }}>{r.toSite}</span>
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                      Model predicts {r.demandThere} {r.category.toLowerCase()} rental
                      {r.demandThere === 1 ? '' : 's'} at {r.toSite} in {r.month} vs {r.demandHere} where it
                      sits now.
                    </p>
                  </div>
                </div>

                <Button variant="primary" onClick={() => handleReallocate(r)} className="self-start sm:self-center">
                  <Icon name="swap" size={14} /> Queue transfer
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
