import { useMemo } from 'react'
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
import CategoryAvailability from '../../components/dashboard/CategoryAvailability'
import UtilizationLeaderboard from '../../components/dashboard/UtilizationLeaderboard'
import AiInsights from '../../components/dashboard/AiInsights'

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
  const today = useAppStore((s) => s.today)
  const dismissedAlertIds = useAppStore((s) => s.dismissedAlertIds)
  const sendReminder = useAppStore((s) => s.sendReminder)

  const active = useMemo(() => equipment.filter((e) => e.status === 'active'), [equipment])
  const categories = useMemo(() => categorySummary(equipment), [equipment])
  const ranking = useMemo(() => utilizationRanking(active), [active])

  const alerts = useMemo(
    () => buildAlerts(equipment, today).filter((a) => !dismissedAlertIds.includes(a.id)),
    [equipment, today, dismissedAlertIds],
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
            Fleet Overview
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Live status, exceptions, and outlook across the whole fleet.
          </p>
        </div>
        <Link to="/admin/checkin">
          <Button variant="primary">
            <Icon name="plus" size={14} /> Create Rental
          </Button>
        </Link>
      </div>

      {/* ① KPI hero */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          label="Asset Utilization"
          value={kpis.utilization}
          unit="%"
          hint={`${kpis.rented} of ${kpis.total} units earning`}
          severity={kpis.utilization >= 60 ? 'good' : 'warning'}
        />
        <StatTile label="Currently Rented" value={kpis.rented} hint={`across ${kpis.activeSites} sites`} />
        <StatTile label="Available Now" value={kpis.availableCount} hint="ready to rent out" />
        <StatTile label="Overdue" value={kpis.overdue} severity={kpis.overdue ? 'critical' : 'neutral'} hint="past return date" />
        <StatTile label="Idle / Under-utilized" value={kpis.idle} severity={kpis.idle ? 'warning' : 'neutral'} hint="below 30% usage" />
      </div>

      {/* ② Context strip */}
      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border px-4 py-2.5 text-sm"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {[
          { label: 'Total Equipment', value: kpis.total },
          { label: 'Under Maintenance', value: kpis.maintenanceCount },
          { label: 'Active Customers', value: `${kpis.activeCustomers} of ${clients.length}` },
          { label: 'Active Sites', value: `${kpis.activeSites} of ${sites.length}` },
        ].map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{s.label}</span>
            <span className="tabular font-data font-medium" style={{ color: 'var(--ink-primary)' }}>{s.value}</span>
          </span>
        ))}
      </div>

      {/* ③ AI Insights */}
      <AiInsights equipment={equipment} active={active} today={today} categories={categories} />

      {/* ④ Category availability + ⑤ Alerts */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CategoryAvailability rows={categories} />
        </div>

        <Card
          title="Alerts"
          action={
            <Link to="/admin/alerts" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
              View all ({alerts.length})
            </Link>
          }
          bodyClassName="p-0"
        >
          {topAlerts.length === 0 ? (
            <p className="px-5 py-6 text-sm" style={{ color: 'var(--ink-secondary)' }}>
              No open alerts — fleet is healthy.
            </p>
          ) : (
            <ul>
              {topAlerts.map((a) => (
                <li key={a.id} className="flex items-start gap-2.5 border-t px-5 py-2.5 first:border-t-0" style={{ borderColor: 'var(--border)' }}>
                  <StatusChip severity={a.severity}>{SEVERITY_LABEL[a.severity]}</StatusChip>
                  <span className="text-[13px] leading-snug" style={{ color: 'var(--ink-primary)' }}>{a.message}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ⑥ Active rentals */}
      <Card
        title="Active Rentals"
        action={
          <Link to="/admin/equipment" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
            View all ({active.length})
          </Link>
        }
        bodyClassName="overflow-x-auto p-0"
      >
        <table className="w-full min-w-[840px] text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--ink-muted)' }}>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Equipment</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Customer</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Site</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Return</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Utilization</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Status</th>
              <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em]">Actions</th>
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
    </div>
  )
}
