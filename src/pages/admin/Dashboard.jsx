import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { siteById, sites } from '../../data/sites'
import { clientById, clients } from '../../data/clients'
import { buildAlerts, utilizationOf, returnStatus, UNDERUTILIZED_THRESHOLD } from '../../lib/rules'
import { categorySummary, fleetUtilization, utilizationRanking } from '../../lib/fleet'
import Card from '../../components/ui/Card'
import StatTile from '../../components/ui/StatTile'
import StatusChip from '../../components/ui/StatusChip'
import UtilizationBar from '../../components/ui/UtilizationBar'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import ForecastChart from '../../components/ui/ForecastChart'
import CategoryAvailability from '../../components/dashboard/CategoryAvailability'
import UtilizationLeaderboard from '../../components/dashboard/UtilizationLeaderboard'

import { mlSummaries } from '../../lib/mlForecast'

const SEVERITY_RANK = { critical: 0, serious: 1, warning: 2, info: 3 }
const SEVERITY_LABEL = { critical: 'Critical', serious: 'Serious', warning: 'Warning', info: 'Idea' }

const RETURN_LABEL = {
  overdue: (d) => `${d}d overdue`,
  'due-soon': (d) => `Due in ${d}d`,
  'on-track': () => 'On track',
}
const RETURN_SEVERITY = { overdue: 'critical', 'due-soon': 'warning', 'on-track': 'good' }

export default function Dashboard() {
  const equipment = useAppStore((s) => s.equipment)
  const usageLogs = useAppStore((s) => s.usageLogs)
  const today = useAppStore((s) => s.today)
  const dismissedAlertIds = useAppStore((s) => s.dismissedAlertIds)
  const sendReminder = useAppStore((s) => s.sendReminder)

  const active = useMemo(() => equipment.filter((e) => e.status === 'active'), [equipment])
  const categories = useMemo(() => categorySummary(equipment), [equipment])
  const ranking = useMemo(() => utilizationRanking(active), [active])

  // Same trained-model output the Forecasting page charts, so the two views
  // can never show different numbers for the same category.
  const forecastSummaries = useMemo(
    () => mlSummaries().map((s) => ({ ...s, trend: s.delta })),
    [],
  )
  const [forecastType, setForecastType] = useState(forecastSummaries[0]?.type)
  const selectedForecast =
    forecastSummaries.find((s) => s.type === forecastType) ?? forecastSummaries[0]

  const alerts = useMemo(
    () => buildAlerts(equipment, today, usageLogs).filter((a) => !dismissedAlertIds.includes(a.id)),
    [equipment, today, usageLogs, dismissedAlertIds],
  )

  const kpis = useMemo(() => {
    const overdue = alerts.filter((a) => a.type === 'overdue').length
    const idle = active.filter((e) => utilizationOf(e) < UNDERUTILIZED_THRESHOLD).length
    const availableCount = equipment.filter((e) => e.status === 'completed').length
    const maintenanceCount = equipment.filter((e) => e.status === 'maintenance').length
    const activeSites = new Set(active.map((e) => e.siteId).filter(Boolean)).size
    const activeCustomers = new Set(active.map((e) => e.clientId).filter(Boolean)).size
    return {
      utilization: fleetUtilization(active),
      rented: active.length,
      availableCount,
      maintenanceCount,
      overdue,
      idle,
      total: equipment.length,
      activeSites,
      activeCustomers,
    }
  }, [equipment, active, alerts])

  const topAlerts = useMemo(
    () => [...alerts].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]).slice(0, 7),
    [alerts],
  )

  const rentalRows = useMemo(
    () =>
      [...active]
        .map((eq) => ({ eq, rs: returnStatus(eq, today), util: utilizationOf(eq) }))
        .sort((a, b) => a.rs.days - b.rs.days)
        .slice(0, 8),
    [active, today],
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--ink-primary)' }}>
            Fleet Operations Dashboard
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
            Live asset status, open alerts, and performance metrics across all active sites.
          </p>
        </div>
      </div>

      {/* ① KPI Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          label="Fleet Utilization"
          value={kpis.utilization}
          unit="%"
          hint={`${kpis.rented} of ${kpis.total} units active`}
          severity={kpis.utilization >= 60 ? 'good' : 'warning'}
        />
        <StatTile label="On Rent" value={kpis.rented} hint={`${kpis.activeSites} active sites`} />
        <StatTile label="Available" value={kpis.availableCount} hint="yard-ready inventory" />
        <StatTile label="Overdue Returns" value={kpis.overdue} severity={kpis.overdue ? 'critical' : 'neutral'} hint="past return date" />
        <StatTile label="Under-utilized" value={kpis.idle} severity={kpis.idle ? 'warning' : 'neutral'} hint="below 30% engine usage" />
      </div>

      {/* ② Fleet Summary Strip */}
      <div
        className="flex flex-wrap items-center gap-4 bg-white px-5 py-3"
        style={{
          borderRadius: '8px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {[
          { label: 'Fleet Size', value: kpis.total + ' units' },
          { label: 'In Maintenance', value: kpis.maintenanceCount + ' units' },
          { label: 'Client Accounts', value: `${kpis.activeCustomers} / ${clients.length}` },
          { label: 'Deployed Sites', value: `${kpis.activeSites} / ${sites.length}` },
        ].map((s, i) => (
          <div key={s.label} className="flex items-center gap-3">
            {i > 0 && <div className="h-8 w-px bg-slate-200" />}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>{s.label}</span>
              <span className="tabular font-data text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ③ Asset Categories */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Category Availability</p>
        <CategoryAvailability categories={categories} />
      </div>

      {/* ④ Open Alerts */}
      <Card
        title="Open Alerts & Exceptions"
        action={
          <Link
            to="/admin/alerts"
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--accent)' }}
          >
            View all ({alerts.length}) →
          </Link>
        }
        bodyClassName="p-0"
      >
        {topAlerts.length === 0 ? (
          <p className="px-5 py-6 text-sm" style={{ color: 'var(--ink-muted)' }}>
            No open alerts — fleet operating within normal parameters.
          </p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {topAlerts.map((a) => (
                <tr key={a.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="w-24 px-5 py-2.5 align-middle">
                    <StatusChip severity={a.severity}>{SEVERITY_LABEL[a.severity]}</StatusChip>
                  </td>
                  <td className="py-2.5 pr-5 text-[13px] align-middle" style={{ color: 'var(--ink-primary)' }}>
                    {a.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* ⑤ Active Rentals Table */}
      <Card
        title="Active Rental Agreements"
        action={
          <Link
            to="/admin/equipment"
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--accent)' }}
          >
            View All ({active.length}) →
          </Link>
        }
        bodyClassName="overflow-x-auto p-0"
      >
        <table className="w-full min-w-[840px]">
          <thead>
            <tr
              className="text-left border-b"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-raised)' }}
            >
              <th className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Unit ID / Type</th>
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Client</th>
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Site</th>
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Expected Return</th>
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Engine / Idle Hrs</th>
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Return Status</th>
              <th className="px-5 py-2.5 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rentalRows.map(({ eq, rs, util }) => {
              const isIdle = util < UNDERUTILIZED_THRESHOLD
              return (
                <tr key={eq.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-5 py-2.5">
                    <div className="font-medium" style={{ color: 'var(--ink-primary)' }}>{eq.id}</div>
                    <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>{eq.tier} {eq.type}</div>
                  </td>
                  <td className="px-3 py-2.5 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
                    {eq.clientId ? clientById[eq.clientId]?.name : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
                    {eq.siteId ? siteById[eq.siteId]?.name : 'Unassigned'}
                  </td>
                  <td className="tabular px-3 py-2.5 font-data text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
                    {eq.expectedReturn}
                  </td>
                  <td className="px-3 py-2.5">
                    <UtilizationBar engineHours={eq.avgEngineHoursPerDay} idleHours={eq.avgIdleHoursPerDay} />
                  </td>
                  <td className="px-3 py-2.5">
                    {isIdle ? (
                      <StatusChip severity="warning" icon="bulb">Idle</StatusChip>
                    ) : (
                      <StatusChip severity={RETURN_SEVERITY[rs.state]}>{RETURN_LABEL[rs.state](rs.days)}</StatusChip>
                    )}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    {rs.state === 'overdue' ? (
                      <Button variant="ghost" onClick={() => sendReminder(eq.id)}>
                        <Icon name="bell" size={13} /> Remind
                      </Button>
                    ) : (
                      <Link to="/admin/checkin" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                        Check in
                      </Link>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {/* ⑦ Utilization leaderboard */}
      <UtilizationLeaderboard ranking={ranking} />

      {/* ⑧ Demand Forecasting */}
      <Card
        title="Demand Forecasting"
        action={
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
              XGBoost projection, 3-month horizon
            </span>
            <Button as={Link} to="/admin/forecasting" variant="secondary">
              <Icon name="trendingUp" size={13} /> View Full Forecast
            </Button>
            <Button as={Link} to="/admin/forecasting" variant="primary">
              <Icon name="swap" size={13} /> Site Reallocation
            </Button>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {forecastSummaries.map((s) => (
            <button
              key={s.type}
              onClick={() => setForecastType(s.type)}
              className="rounded-lg border px-3 py-2 text-left transition-opacity hover:opacity-90"
              style={{
                background: forecastType === s.type ? 'var(--accent-wash)' : 'var(--bg-surface-raised)',
                borderColor: forecastType === s.type ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <div className="font-display text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-muted)' }}>
                {s.type}
              </div>
              <div className="tabular mt-0.5 flex items-center gap-1.5 font-data text-lg font-medium leading-none" style={{ color: 'var(--ink-primary)' }}>
                {s.nextForecast ?? '—'}
                {s.trend !== 0 && (
                  <StatusChip severity={s.trend > 0 ? 'good' : 'warning'}>
                    {s.trend > 0 ? '+' : ''}{s.trend}
                  </StatusChip>
                )}
              </div>
            </button>
          ))}
        </div>
        <ForecastChart data={selectedForecast.series} height={240} />
      </Card>
    </div>
  )
}
