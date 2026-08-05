import { useState, useMemo } from 'react'
import { useAppStore } from '../../store/appStore'
import { siteById } from '../../data/sites'
import { catalogById } from '../../data/catalog'
import { clientById } from '../../data/clients'
import Card from '../../components/ui/Card'
import StatTile from '../../components/ui/StatTile'
import UtilizationBar from '../../components/ui/UtilizationBar'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import LogTelemetryModal from '../../components/client/LogTelemetryModal'

export default function ClientUsage() {
  const equipment = useAppStore((s) => s.equipment)
  const usageLogs = useAppStore((s) => s.usageLogs)
  const activeClientId = useAppStore((s) => s.activeClientId)
  const selectedSiteId = useAppStore((s) => s.selectedSiteId)
  const client = clientById[activeClientId]

  const [selectedEqForLog, setSelectedEqForLog] = useState(null)

  // Filter client equipment
  const activeFleet = useMemo(() => {
    return equipment.filter((e) => {
      if (e.clientId !== activeClientId) return false
      if (e.status !== 'active') return false
      if (selectedSiteId !== 'ALL' && e.siteId !== selectedSiteId) return false
      return true
    })
  }, [equipment, activeClientId, selectedSiteId])

  // Summaries
  const stats = useMemo(() => {
    let totalEngineHrs = 0
    let totalIdleHrs = 0
    let totalDailyCost = 0

    activeFleet.forEach((eq) => {
      totalEngineHrs += eq.avgEngineHoursPerDay || 0
      totalIdleHrs += eq.avgIdleHoursPerDay || 0
      totalDailyCost += catalogById[eq.catalogId]?.dailyCost || 0
    })

    const totalHrs = totalEngineHrs + totalIdleHrs
    const avgEfficiency = totalHrs > 0 ? Math.round((totalEngineHrs / totalHrs) * 100) : 0
    // Estimate waste cost: idle hours proportion of daily cost
    const totalIdleWasteCost = totalHrs > 0 ? Math.round((totalIdleHrs / totalHrs) * totalDailyCost) : 0

    return { totalEngineHrs: totalEngineHrs.toFixed(1), totalIdleHrs: totalIdleHrs.toFixed(1), avgEfficiency, totalIdleWasteCost }
  }, [activeFleet])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight" style={{ color: 'var(--ink-primary)' }}>
            Telemetry & Site Usage Logs
          </h1>
          <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
            Detailed breakdown of runtime hours, idle downtime, and fuel metrics for {client?.name}.
          </p>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Active Runtime (hrs/day)" value={stats.totalEngineHrs} unit="hrs" />
        <StatTile label="Idle Downtime (hrs/day)" value={stats.totalIdleHrs} severity={Number(stats.totalIdleHrs) > 5 ? 'warning' : 'neutral'} unit="hrs" />
        <StatTile label="Fleet Efficiency" value={`${stats.avgEfficiency}%`} severity={stats.avgEfficiency > 60 ? 'good' : 'warning'} />
        <StatTile label="Daily Idle Waste Cost" value={`$${stats.totalIdleWasteCost}`} severity={stats.totalIdleWasteCost > 150 ? 'critical' : 'neutral'} unit="/day" />
      </div>

      {/* Active Fleet Telemetry Roster */}
      <Card title="Live Equipment Telemetry Feed" action={<span className="text-xs text-slate-500">{activeFleet.length} Machines Active</span>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-xs">
            <thead>
              <tr className="border-b text-left text-[11px] font-bold uppercase tracking-wider" style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}>
                <th className="px-4 py-3">Equipment Unit</th>
                <th className="px-3 py-3">Deployed Site</th>
                <th className="px-3 py-3">Operator</th>
                <th className="px-3 py-3">Engine / Idle Breakdown</th>
                <th className="px-3 py-3">Efficiency</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeFleet.map((eq) => {
                const site = siteById[eq.siteId]?.name || 'Unassigned Site'
                const total = (eq.avgEngineHoursPerDay || 0) + (eq.avgIdleHoursPerDay || 0)
                const eff = total > 0 ? Math.round(((eq.avgEngineHoursPerDay || 0) / total) * 100) : 0

                return (
                  <tr key={eq.id} className="border-b transition-colors hover:bg-slate-50/50" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3">
                      <div className="font-bold" style={{ color: 'var(--ink-primary)' }}>{eq.id}</div>
                      <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>{eq.tier} {eq.type}</div>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--ink-secondary)' }}>
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
                    <td className="px-3 py-3">
                      <UtilizationBar engineHours={eq.avgEngineHoursPerDay} idleHours={eq.avgIdleHoursPerDay} />
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-block rounded px-2 py-0.5 font-bold ${eff >= 60 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {eff}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button variant="secondary" onClick={() => setSelectedEqForLog(eq)} className="text-xs">
                        <Icon name="clock" size={13} /> Log Telemetry
                      </Button>
                    </td>
                  </tr>
                )
              })}
              {activeFleet.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No active equipment matches the selected site filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {selectedEqForLog && (
        <LogTelemetryModal equipment={selectedEqForLog} onClose={() => setSelectedEqForLog(null)} />
      )}
    </div>
  )
}
