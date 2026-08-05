import { useMemo, useState } from 'react'
import { demandHistory, equipmentTypes } from '../../data/demandHistory'
import { forecastSeries } from '../../lib/forecast'
import Card from '../../components/ui/Card'
import StatusChip from '../../components/ui/StatusChip'
import ForecastChart from '../../components/ui/ForecastChart'

export default function Forecasting() {
  const [type, setType] = useState(equipmentTypes[0])

  const summaries = useMemo(
    () =>
      equipmentTypes.map((t) => {
        const series = forecastSeries(t, demandHistory)
        const actuals = series.filter((p) => p.actual != null)
        const lastActual = actuals[actuals.length - 1]
        const prevActual = actuals[actuals.length - 2]
        const nextForecast = series[series.length - 2] // last two points are projected months
        const trend = lastActual && prevActual ? lastActual.actual - prevActual.actual : 0
        return { type: t, series, lastActual, nextForecast, trend }
      }),
    [],
  )

  const selected = summaries.find((s) => s.type === type)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
          Demand Forecasting
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Moving-average projection over monthly rental counts, per equipment type.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaries.map((s) => (
          <button
            key={s.type}
            onClick={() => setType(s.type)}
            className="rounded-xl border p-4 text-left transition-opacity hover:opacity-90"
            style={{
              background: 'var(--bg-surface)',
              borderColor: type === s.type ? 'var(--accent)' : 'var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="font-display text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-muted)' }}>
              {s.type}
            </div>
            <div className="tabular mt-1 font-data text-2xl font-medium" style={{ color: 'var(--ink-primary)' }}>
              {s.nextForecast?.forecast ?? '—'}
            </div>
            <div className="mt-1">
              <StatusChip severity={s.trend > 0 ? 'good' : s.trend < 0 ? 'warning' : 'neutral'} icon={s.trend > 0 ? 'checkCircle' : s.trend < 0 ? 'clock' : undefined}>
                {s.trend === 0 ? 'Flat' : `${s.trend > 0 ? '+' : ''}${s.trend} vs last month`}
              </StatusChip>
            </div>
          </button>
        ))}
      </div>

      <Card title={`${type} — historical vs projected demand`}>
        <ForecastChart data={selected.series} />
        <p className="mt-3 text-xs" style={{ color: 'var(--ink-muted)' }}>
          Dashed line is a 3-month moving-average + trend projection — a simple baseline, not a trained model.
        </p>
      </Card>
    </div>
  )
}
