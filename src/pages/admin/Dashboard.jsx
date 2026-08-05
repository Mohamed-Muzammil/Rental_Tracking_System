import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { siteById } from '../../data/sites'
import { clientById } from '../../data/clients'
import { catalogById } from '../../data/catalog'
import { buildAlerts, utilizationOf, returnStatus, healthOf, UNDERUTILIZED_THRESHOLD } from '../../lib/rules'
import Card from '../../components/ui/Card'
import StatTile from '../../components/ui/StatTile'
import StatusChip from '../../components/ui/StatusChip'
import UtilizationBar from '../../components/ui/UtilizationBar'
import Icon from '../../components/ui/Icon'

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

  const active = useMemo(() => equipment.filter((e) => e.status === 'active'), [equipment])

  const alerts = useMemo(
    () => buildAlerts(equipment, today).filter((a) => !dismissedAlertIds.includes(a.id)),
    [equipment, today, dismissedAlertIds],
  )

  const kpis = useMemo(() => {
    const overdue = alerts.filter((a) => a.type === 'overdue').length
    const dueSoon = alerts.filter((a) => a.type === 'due-soon').length
    const underutilized = active.filter((e) => utilizationOf(e) < UNDERUTILIZED_THRESHOLD).length
    const dailyRevenue = active.reduce((sum, e) => sum + (catalogById[e.catalogId]?.dailyCost ?? 0), 0)
    return { activeCount: active.length, overdue, dueSoon, underutilized, dailyRevenue }
  }, [active, alerts])

  const topAlerts = useMemo(
    () => [...alerts].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]).slice(0, 5),
    [alerts],
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
          Fleet Overview
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Live status across every rented-out unit.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Active Rentals" value={kpis.activeCount} />
        <StatTile label="Overdue" value={kpis.overdue} severity={kpis.overdue ? 'critical' : 'neutral'} />
        <StatTile label="Due Soon" value={kpis.dueSoon} severity={kpis.dueSoon ? 'warning' : 'neutral'} />
        <StatTile label="Under-utilized" value={kpis.underutilized} severity={kpis.underutilized ? 'warning' : 'neutral'} />
        <StatTile label="Daily Revenue" value={kpis.dailyRevenue.toLocaleString()} unit="$/day" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Live Fleet" className="xl:col-span-2" bodyClassName="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left" style={{ color: 'var(--ink-muted)' }}>
                <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Unit</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Site</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Client</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Utilization</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Return</th>
              </tr>
            </thead>
            <tbody>
              {active.map((eq) => {
                const health = healthOf(eq, today)
                const rs = returnStatus(eq, today)
                const site = eq.siteId ? siteById[eq.siteId]?.name : null
                const client = eq.clientId ? clientById[eq.clientId]?.name : '—'
                return (
                  <tr key={eq.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-5 py-3" style={{ borderLeft: `3px solid var(--${health})` }}>
                      <div className="font-medium" style={{ color: 'var(--ink-primary)' }}>{eq.id}</div>
                      <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>{eq.tier} {eq.type}</div>
                    </td>
                    <td className="px-3 py-3">
                      {site ? (
                        <span className="inline-flex items-center gap-1" style={{ color: 'var(--ink-secondary)' }}>
                          <Icon name="mapPin" size={13} />
                          {site}
                        </span>
                      ) : (
                        <StatusChip severity="serious">Unassigned</StatusChip>
                      )}
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--ink-secondary)' }}>{client}</td>
                    <td className="px-3 py-3">
                      <UtilizationBar engineHours={eq.avgEngineHoursPerDay} idleHours={eq.avgIdleHoursPerDay} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusChip severity={RETURN_SEVERITY[rs.state]}>{RETURN_LABEL[rs.state](rs.days)}</StatusChip>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        <div className="flex flex-col gap-6">
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
                  <li key={a.id} className="flex items-start gap-2.5 border-t px-5 py-3" style={{ borderColor: 'var(--border)' }}>
                    <StatusChip severity={a.severity}>{SEVERITY_LABEL[a.severity]}</StatusChip>
                    <span className="text-sm" style={{ color: 'var(--ink-primary)' }}>{a.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Revenue Snapshot">
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm" style={{ color: 'var(--ink-secondary)' }}>Active daily revenue</span>
                <span className="tabular font-data text-lg font-medium" style={{ color: 'var(--ink-primary)' }}>
                  ${kpis.dailyRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm" style={{ color: 'var(--ink-secondary)' }}>Fleet units on rent</span>
                <span className="tabular font-data text-lg font-medium" style={{ color: 'var(--ink-primary)' }}>
                  {kpis.activeCount}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm" style={{ color: 'var(--ink-secondary)' }}>At risk (overdue + unassigned)</span>
                <span className="tabular font-data text-lg font-medium" style={{ color: 'var(--critical)' }}>
                  {alerts.filter((a) => a.severity === 'critical').length}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
