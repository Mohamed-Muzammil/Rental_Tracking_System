import { useMemo, useState } from 'react'
import { demandHistory, equipmentTypes } from '../../data/demandHistory'
import { sites } from '../../data/sites'
import { forecastSeries } from '../../lib/forecast'
import { useAppStore } from '../../store/appStore'
import Card from '../../components/ui/Card'
import StatusChip from '../../components/ui/StatusChip'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import ForecastChart from '../../components/ui/ForecastChart'
import StatTile from '../../components/ui/StatTile'

export default function Forecasting() {
  const [type, setType] = useState(equipmentTypes[0])
  const equipment = useAppStore((s) => s.equipment)
  const pushToast = useAppStore((s) => s.pushToast)

  const summaries = useMemo(
    () =>
      equipmentTypes.map((t) => {
        const series = forecastSeries(t, demandHistory)
        const actuals = series.filter((p) => p.actual != null)
        const lastActual = actuals[actuals.length - 1]
        const prevActual = actuals[actuals.length - 2]
        const nextForecast = series[series.length - 2]
        const trend = lastActual && prevActual ? lastActual.actual - prevActual.actual : 0
        return { type: t, series, lastActual, nextForecast, trend }
      }),
    [],
  )

  const selected = summaries.find((s) => s.type === type)

  // Reallocation Engine Recommendations
  const reallocations = useMemo(() => {
    return [
      {
        id: 'REALLOC-101',
        category: 'Excavator',
        fromSite: 'North Yard Warehouse',
        toSite: 'Summit Mine Project',
        quantity: 2,
        reason: 'XGBoost predicted +35% demand surge at Summit Mine for next 30 days.',
        impact: 'Prevents 14-day rental delay',
      },
      {
        id: 'REALLOC-102',
        category: 'Crane',
        fromSite: 'Harbour Logistics Hub',
        toSite: 'Metro Tunnel Expansion',
        quantity: 1,
        reason: 'Low utilization (< 30%) at Harbour Hub; high demand at Metro Tunnel.',
        impact: 'Saves $1,200/day idle cost',
      },
      {
        id: 'REALLOC-103',
        category: 'Roller',
        fromSite: 'East Coast Yard',
        toSite: 'Redstone Highway Site',
        quantity: 1,
        reason: 'Upcoming seasonal roadwork project contract starts next month.',
        impact: 'Optimizes regional fleet distribution',
      },
    ]
  }, [])

  const handleReallocate = (realloc) => {
    pushToast(`Reallocation Executed: Transferring ${realloc.quantity} ${realloc.category}(s) from ${realloc.fromSite} to ${realloc.toSite}`, 'good')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-slate-900" style={{ color: 'var(--ink-primary)' }}>
            XGBoost Demand Forecasting & Site Reallocation
          </h1>
          <p className="text-sm text-slate-500" style={{ color: 'var(--ink-secondary)' }}>
            Feature engineering pipeline (Seasonality, Holidays, Utilization) predicting equipment demand & reallocating yard stock.
          </p>
        </div>
      </div>

      {/* KPI Hero Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="ML Forecasted Month" value="Sep 2026" unit="target" />
        <StatTile label="High Demand Category" value="Excavators" unit="+35% demand" severity="good" />
        <StatTile label="Reallocation Opps" value={reallocations.length} unit="transfers ready" severity="warning" />
        <StatTile label="Forecast Confidence" value="94.8%" unit="model accuracy" severity="good" />
      </div>

      {/* Equipment Category Selection Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {summaries.map((s) => (
          <button
            key={s.type}
            onClick={() => setType(s.type)}
            className="rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5"
            style={{
              background: 'var(--bg-surface)',
              borderColor: type === s.type ? 'var(--accent)' : 'var(--border)',
              boxShadow: type === s.type ? '0 0 0 2px var(--accent-wash)' : 'var(--shadow-card)',
            }}
          >
            <div className="font-display text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {s.type}
            </div>
            <div className="tabular mt-1 font-mono text-xl font-bold text-slate-900">
              {s.nextForecast?.forecast ?? '—'}
            </div>
            <div className="mt-1">
              <StatusChip severity={s.trend > 0 ? 'good' : s.trend < 0 ? 'warning' : 'neutral'}>
                {s.trend === 0 ? 'Flat' : `${s.trend > 0 ? '+' : ''}${s.trend}`}
              </StatusChip>
            </div>
          </button>
        ))}
      </div>

      {/* Demand Forecast Chart */}
      <Card title={`${type} — Historical vs XGBoost Predicted Demand`}>
        <ForecastChart data={selected.series} />
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t pt-3">
          <span>Solid line = Actual historical rentals. Dashed line = XGBoost ML Feature Model Projection.</span>
          <span className="font-mono text-slate-700 font-bold">Model Features: [Category, Site, Month, Utilization, Holidays]</span>
        </div>
      </Card>

      {/* Site-to-Site Reallocation Engine */}
      <Card title="Recommended Equipment Reallocations Between Sites & Warehouses" bodyClassName="p-0">
        <div className="divide-y divide-slate-100">
          {reallocations.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/70 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold">
                  <Icon name="swap" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{r.id}</span>
                    <span className="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-700 text-xs">
                      {r.quantity}x {r.category}
                    </span>
                    <span className="text-xs text-emerald-600 font-bold">{r.impact}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    Transfer from <span className="text-slate-600">{r.fromSite}</span> → <span className="text-blue-600">{r.toSite}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{r.reason}</p>
                </div>
              </div>

              <Button variant="primary" onClick={() => handleReallocate(r)} className="self-start sm:self-center text-xs px-3 py-1.5">
                <Icon name="swap" size={14} /> Execute Reallocation
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
