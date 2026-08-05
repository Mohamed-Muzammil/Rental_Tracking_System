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
  const logUsage = useAppStore((s) => s.logUsage)

  const active = useMemo(() => equipment.filter((e) => e.status === 'active'), [equipment])
  const [equipmentId, setEquipmentId] = useState(active[0]?.id ?? '')
  const [engineHours, setEngineHours] = useState('')
  const [idleHours, setIdleHours] = useState('')

  const selected = active.find((e) => e.id === equipmentId)
  const history = useMemo(
    () => [...usageLogs.filter((l) => l.equipmentId === equipmentId)].slice(-10).map((l) => ({ ...l, date: l.date.slice(5) })),
    [usageLogs, equipmentId],
  )

  const canSubmit = equipmentId && engineHours !== '' && idleHours !== ''

  const submit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    logUsage({
      equipmentId,
      engineHours: +engineHours,
      idleHours: +idleHours,
      fuelUsageL: +(+engineHours * 4.2).toFixed(1),
      operatorId: selected?.operatorId ?? null,
    })
    setEngineHours('')
    setIdleHours('')
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card title="Log today's usage" className="xl:col-span-1">
        {active.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>No active rentals to log against.</p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>Equipment</span>
              <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={fieldStyle}>
                {active.map((e) => (
                  <option key={e.id} value={e.id}>{e.id} — {e.tier} {e.type}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>Engine hours</span>
              <input type="number" min="0" max="24" step="0.1" value={engineHours} onChange={(e) => setEngineHours(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={fieldStyle} required />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>Idle hours</span>
              <input type="number" min="0" max="24" step="0.1" value={idleHours} onChange={(e) => setIdleHours(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={fieldStyle} required />
            </label>
            <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              Fuel usage is derived automatically (≈4.2L per engine hour).
            </div>
            <Button type="submit" variant="primary" disabled={!canSubmit} className="justify-center">
              <Icon name="checkCircle" size={14} /> Save log entry
            </Button>
          </form>
        )}
      </Card>

      <Card title={selected ? `${selected.id} — usage history` : 'Usage history'} className="xl:col-span-2">
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
