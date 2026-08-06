import { useState, useMemo } from 'react'
import { useAppStore } from '../../store/appStore'
import { siteById, sites } from '../../data/sites'
import { catalogById } from '../../data/catalog'
import { returnStatus, healthOf, recommendationFor, UNDERUTILIZED_THRESHOLD } from '../../lib/rules'
import Card from '../../components/ui/Card'
import StatTile from '../../components/ui/StatTile'
import StatusChip from '../../components/ui/StatusChip'
import UtilizationBar from '../../components/ui/UtilizationBar'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import LogTelemetryModal from '../../components/client/LogTelemetryModal'
import ExtendRentalModal from '../../components/client/ExtendRentalModal'

const RETURN_LABEL = {
  overdue: (d) => `${d}d OVERDUE`,
  'due-soon': (d) => `Due in ${d}d`,
  'on-track': () => 'On track',
}
const RETURN_SEVERITY = { overdue: 'critical', 'due-soon': 'warning', 'on-track': 'good' }

export default function ClientDashboard() {
  const equipment = useAppStore((s) => s.equipment)
  const today = useAppStore((s) => s.today)
  const activeClientId = useAppStore((s) => s.activeClientId)
  const selectedSiteId = useAppStore((s) => s.selectedSiteId)
  const acceptRecommendation = useAppStore((s) => s.acceptRecommendation)
  const clients = useAppStore((s) => s.clients)
  const clientById = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients])

  const [selectedEqForLog, setSelectedEqForLog] = useState(null)
  const [selectedEqForExtend, setSelectedEqForExtend] = useState(null)

  const client = clientById[activeClientId]

  // Filter client equipment by active status & selected site
  const activeFleet = useMemo(() => {
    return equipment.filter((e) => {
      if (e.clientId !== activeClientId) return false
      if (e.status !== 'active') return false
      if (selectedSiteId !== 'ALL' && e.siteId !== selectedSiteId) return false
      return true
    })
  }, [equipment, activeClientId, selectedSiteId])

  // KPIs
  const kpis = useMemo(() => {
    let overdue = 0
    let dueSoon = 0
    let dailyCost = 0
    let totalEngineHrs = 0
    let totalIdleHrs = 0

    activeFleet.forEach((eq) => {
      const rs = returnStatus(eq, today)
      if (rs?.state === 'overdue') overdue++
      if (rs?.state === 'due-soon') dueSoon++

      const cost = catalogById[eq.catalogId]?.dailyCost ?? 0
      dailyCost += cost

      totalEngineHrs += eq.avgEngineHoursPerDay || 0
      totalIdleHrs += eq.avgIdleHoursPerDay || 0
    })

    const totalHrs = totalEngineHrs + totalIdleHrs
    const avgUtilization = totalHrs > 0 ? Math.round((totalEngineHrs / totalHrs) * 100) : 0
    const dailyIdleWaste = totalHrs > 0 ? Math.round((totalIdleHrs / totalHrs) * dailyCost) : 0

    return { activeCount: activeFleet.length, overdue, dueSoon, dailyCost, avgUtilization, dailyIdleWaste }
  }, [activeFleet, today])

  // Flagged Anomalies & Recommendations
  const underutilizedUnits = useMemo(() => {
    const recs = []
    activeFleet.forEach((eq) => {
      const totalHrs = (eq.avgEngineHoursPerDay || 0) + (eq.avgIdleHoursPerDay || 0)
      const ratio = totalHrs > 0 ? eq.avgEngineHoursPerDay / totalHrs : 0
      if (ratio < UNDERUTILIZED_THRESHOLD || eq.avgIdleHoursPerDay >= 5) {
        const rec = recommendationFor(eq)
        recs.push({ eq, ratio: Math.round(ratio * 100), rec })
      }
    })
    return recs
  }, [activeFleet])

  // Site Distribution
  const siteDistribution = useMemo(() => {
    const dist = {}
    activeFleet.forEach((eq) => {
      const siteName = siteById[eq.siteId]?.name || 'Unassigned Site'
      if (!dist[siteName]) dist[siteName] = { count: 0, engineHrs: 0 }
      dist[siteName].count++
      dist[siteName].engineHrs += eq.avgEngineHoursPerDay || 0
    })
    return Object.entries(dist).map(([name, val]) => ({ name, ...val }))
  }, [activeFleet])

  return (
    <div className="flex flex-col gap-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold tracking-tight" style={{ color: 'var(--ink-primary)' }}>
              {client?.name}
            </h1>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border)', color: 'var(--ink-secondary)' }}
            >
              {selectedSiteId === 'ALL' ? 'All Active Sites' : siteById[selectedSiteId]?.name}
            </span>
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--ink-secondary)' }}>
            Real-time asset telemetry, downtime waste alerts, and fleet operations overview.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Active Deployed Units" value={kpis.activeCount} />
        <StatTile label="Total Daily Spend" value={`$${kpis.dailyCost.toLocaleString()}`} unit="/day" />
        <StatTile label="Fleet Utilization" value={`${kpis.avgUtilization}%`} severity={kpis.avgUtilization >= 60 ? 'good' : 'warning'} />
        <StatTile label="Daily Idle Waste Cost" value={`$${kpis.dailyIdleWaste}`} severity={kpis.dailyIdleWaste > 100 ? 'critical' : 'neutral'} unit="/day" />
        <StatTile label="Overdue Returns" value={kpis.overdue} severity={kpis.overdue > 0 ? 'critical' : 'neutral'} />
      </div>

      {/* Idle Waste & Rightsizing Intelligence Alert Banner */}
      {underutilizedUnits.length > 0 && (
        <div
          className="border p-5"
          style={{ borderRadius: 'var(--radius-lg)', borderColor: 'var(--border)', background: 'var(--warning-wash)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center font-bold"
              style={{ borderRadius: 'var(--radius-md)', background: 'var(--warning)', color: '#ffffff' }}
            >
              <Icon name="bell" size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold" style={{ color: 'var(--warning)' }}>
                  Anomaly Detected: High Idle Waste & Rightsizing Opportunities ({underutilizedUnits.length} Machines Flagged)
                </h3>
                <span
                  className="px-2 py-0.5 text-[11px] font-bold"
                  style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', color: 'var(--warning)', border: '1px solid var(--border)' }}
                >
                  Potential Waste: ${kpis.dailyIdleWaste}/day
                </span>
              </div>
              <p className="mt-1 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                The IoT telemetry engine detected machinery sitting idle for extended periods (e.g. up to 10 hrs/day). Rightsizing to compact models or reassigning can eliminate unnecessary rental overhead.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {underutilizedUnits.map(({ eq, ratio, rec }) => (
                  <div
                    key={eq.id}
                    className="flex items-center justify-between border p-3"
                    style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--border)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs" style={{ color: 'var(--ink-primary)' }}>{eq.id}</span>
                        <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>{eq.tier} {eq.type}</span>
                      </div>
                      <div className="mt-1 text-[11px]" style={{ color: 'var(--ink-secondary)' }}>
                        Utilization: <strong style={{ color: 'var(--warning)' }}>{ratio}%</strong> ({eq.avgIdleHoursPerDay}h idle/day)
                      </div>
                    </div>
                    {rec ? (
                      <Button
                        variant="primary"
                        onClick={() => acceptRecommendation(eq.id, rec)}
                        className="text-xs font-bold"
                        style={{ background: 'var(--warning)', borderColor: 'var(--warning)' }}
                      >
                        Swap to {rec.catalog.tier} (Save ${rec.dailySavings}/d)
                      </Button>
                    ) : (
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--warning)' }}>Flagged for Review</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Roster & Site Breakdown */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Active Fleet Table */}
        <Card title="Live Equipment Roster & Telemetry Status" className="xl:col-span-2" bodyClassName="overflow-x-auto">
          <table className="w-full min-w-[700px] text-xs">
            <thead>
              <tr className="border-b text-left text-[11px] font-bold uppercase tracking-wider" style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}>
                <th className="px-4 py-3">Unit & Category</th>
                <th className="px-3 py-3">Deployed Site</th>
                <th className="px-3 py-3">Operator</th>
                <th className="px-3 py-3">Daily Cost</th>
                <th className="px-3 py-3">Utilization Telemetry</th>
                <th className="px-3 py-3">Return Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeFleet.map((eq) => {
                const health = healthOf(eq, today)
                const rs = returnStatus(eq, today)
                const site = eq.siteId ? siteById[eq.siteId]?.name : 'Unassigned'
                const cost = catalogById[eq.catalogId]?.dailyCost ?? 0

                return (
                  <tr key={eq.id} className="border-b transition-colors hover:opacity-90" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3 font-medium" style={{ borderLeft: `4px solid var(--${health})` }}>
                      <div className="font-bold" style={{ color: 'var(--ink-primary)' }}>{eq.id}</div>
                      <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>{eq.tier} {eq.type}</div>
                    </td>
                    <td className="px-3 py-3 font-medium" style={{ color: 'var(--ink-secondary)' }}>
                      <span className="inline-flex items-center gap-1">
                        <Icon name="mapPin" size={13} /> {site}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-medium" style={{ color: eq.operatorId ? 'var(--ink-primary)' : 'var(--critical)' }}>
                      {eq.operatorId ? (
                        eq.operatorId
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="alertTriangle" size={12} /> Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-data font-bold" style={{ color: 'var(--ink-primary)' }}>${cost}</td>
                    <td className="px-3 py-3">
                      <UtilizationBar engineHours={eq.avgEngineHoursPerDay} idleHours={eq.avgIdleHoursPerDay} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusChip severity={RETURN_SEVERITY[rs.state]}>
                        {RETURN_LABEL[rs.state](rs.days)}
                      </StatusChip>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" onClick={() => setSelectedEqForLog(eq)} title="Log Telemetry" className="px-2 py-1 text-xs">
                          <Icon name="clock" size={13} />
                        </Button>
                        <Button variant="ghost" onClick={() => setSelectedEqForExtend(eq)} title="Extend Rental" className="px-2 py-1 text-xs">
                          <Icon name="swap" size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {activeFleet.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center" style={{ color: 'var(--ink-muted)' }}>
                    No deployed equipment found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        {/* Sidebar: Site Distribution & Account Overview */}
        <div className="flex flex-col gap-6">
          <Card title="Site Equipment Allocation">
            <div className="flex flex-col gap-3">
              {siteDistribution.map((s) => (
                <div key={s.name} className="flex items-center justify-between border-b pb-2 text-xs" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--ink-primary)' }}>{s.name}</div>
                    <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>{s.engineHrs.toFixed(1)} hrs active/day</div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 font-data font-bold"
                    style={{ background: 'var(--bg-surface-raised)', color: 'var(--ink-secondary)' }}
                  >
                    {s.count} Machine{s.count === 1 ? '' : 's'}
                  </span>
                </div>
              ))}
              {siteDistribution.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>No active sites.</p>
              )}
            </div>
          </Card>

          <Card title="Operational Quick Actions">
            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={() => setSelectedEqForLog(activeFleet[0])} disabled={!activeFleet.length} className="justify-start py-2">
                <Icon name="clock" size={15} /> Log Runtime Telemetry / QR Scan
              </Button>
              <Button variant="secondary" onClick={() => setSelectedEqForExtend(activeFleet[0])} disabled={!activeFleet.length} className="justify-start py-2">
                <Icon name="swap" size={15} /> Request Rental Extension
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {selectedEqForLog && (
        <LogTelemetryModal equipment={selectedEqForLog} onClose={() => setSelectedEqForLog(null)} />
      )}
      {selectedEqForExtend && (
        <ExtendRentalModal equipment={selectedEqForExtend} onClose={() => setSelectedEqForExtend(null)} />
      )}
    </div>
  )
}
