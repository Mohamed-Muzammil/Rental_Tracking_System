import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { logsFor } from '../../data/usageLogs'
import { usageBySite, totalRentedHours, totalDowntimeHours } from '../../lib/reports'
import Card from '../../components/ui/Card'
import StatTile from '../../components/ui/StatTile'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import UsageHistoryChart from '../../components/ui/UsageHistoryChart'

const TABS = [
  { id: 'log', label: 'Log Usage', icon: 'clock' },
  { id: 'reports', label: 'Reports', icon: 'gauge' },
]

const fieldStyle = {
  background: 'var(--bg-surface-raised)',
  borderColor: 'var(--border-strong)',
  color: 'var(--ink-primary)',
}

export default function UsageLogging() {
  const [tab, setTab] = useState('log')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
          Usage Logging
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Daily runtime, idle time, and fuel — plus the reports rolled up from it.
        </p>
      </div>

      <div className="flex gap-1 self-start rounded-lg border p-0.5" style={{ borderColor: 'var(--border-strong)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium"
            style={{
              background: tab === t.id ? 'var(--accent)' : 'transparent',
              color: tab === t.id ? 'var(--accent-ink)' : 'var(--ink-secondary)',
            }}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'log' ? <LogUsageTab /> : <ReportsTab />}
    </div>
  )
}

function LogUsageTab() {
  const equipment = useAppStore((s) => s.equipment)
  const usageLogs = useAppStore((s) => s.usageLogs)

  const active = useMemo(() => equipment.filter((e) => e.status === 'active'), [equipment])
  const [equipmentId, setEquipmentId] = useState(active[0]?.id ?? equipment[0]?.id ?? '')

  const selected = active.find((e) => e.id === equipmentId) ?? equipment.find((e) => e.id === equipmentId)
  const history = useMemo(
    () => [...usageLogs.filter((l) => l.equipmentId === equipmentId)].slice(-10).map((l) => ({ ...l, date: l.date.slice(5) })),
    [usageLogs, equipmentId],
  )

  const totalEngine = history.reduce((sum, h) => sum + h.engineHours, 0)
  const totalIdle = history.reduce((sum, h) => sum + h.idleHours, 0)
  const avgEfficiency = totalEngine + totalIdle > 0 ? Math.round((totalEngine / (totalEngine + totalIdle)) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Top Vehicle Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4 shadow-xs" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold">
            <Icon name="truck" size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Vehicle / Equipment</div>
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="mt-0.5 rounded-lg border px-3 py-1.5 font-display text-sm font-bold outline-hidden"
              style={fieldStyle}
            >
              {equipment.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} — {e.tier} {e.type} ({e.status === 'active' ? 'On Rent' : 'Available'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Vehicle Telemetry Summary Stats */}
        {selected && (
          <div className="flex items-center gap-6 text-xs border-l pl-6 border-slate-200">
            <div>
              <div className="text-slate-400 font-medium">10-Day Runtime</div>
              <div className="font-mono text-sm font-bold text-blue-600">{totalEngine.toFixed(1)} hrs</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">10-Day Idle Time</div>
              <div className="font-mono text-sm font-bold text-amber-600">{totalIdle.toFixed(1)} hrs</div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Operational Efficiency</div>
              <div className="font-mono text-sm font-bold text-emerald-600">{avgEfficiency}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Usage History Telemetry Graph */}
      <Card title={selected ? `${selected.id} — ${selected.tier} ${selected.type} Telemetry Graph` : 'Vehicle Telemetry Graph'}>
        <UsageHistoryChart data={history} />
      </Card>
    </div>
  )
}

function ReportsTab() {
  const equipment = useAppStore((s) => s.equipment)
  const active = useMemo(() => equipment.filter((e) => e.status === 'active'), [equipment])
  const bySite = useMemo(() => usageBySite(active), [active])
  const rented = totalRentedHours(active)
  const downtime = totalDowntimeHours(active)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Total Rented Hours/Day" value={rented.toFixed(1)} unit="hrs" />
        <StatTile label="Total Downtime/Day" value={downtime.toFixed(1)} unit="hrs" severity={downtime > rented ? 'warning' : 'neutral'} />
        <StatTile label="Fleet Efficiency" value={rented + downtime === 0 ? 0 : Math.round((rented / (rented + downtime)) * 100)} unit="%" />
      </div>

      <Card title="Usage per Site" bodyClassName="overflow-x-auto p-0">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--ink-muted)' }}>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Site</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Units</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Engine hrs/day</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Idle hrs/day</th>
            </tr>
          </thead>
          <tbody>
            {bySite.map((row) => (
              <tr key={row.siteId ?? 'unassigned'} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="px-5 py-3 font-medium" style={{ color: 'var(--ink-primary)' }}>{row.name}</td>
                <td className="tabular px-3 py-3" style={{ color: 'var(--ink-secondary)' }}>{row.units}</td>
                <td className="tabular px-3 py-3" style={{ color: 'var(--series-engine)' }}>{row.engineHours.toFixed(1)}</td>
                <td className="tabular px-3 py-3" style={{ color: 'var(--series-idle)' }}>{row.idleHours.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
