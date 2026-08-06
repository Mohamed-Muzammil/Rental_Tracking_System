import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { equipmentTypes } from '../../data/demandHistory'
import { siteById } from '../../data/sites'
import { totalRentedHours, totalDowntimeHours, usageBySite } from '../../lib/reports'
import Card from '../../components/ui/Card'
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
          Usage Logging & Telemetry Reports
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Daily runtime, idle time, fuel metrics — toggle between vehicle-wise or category-wise telemetry.
        </p>
      </div>

      <div className="flex gap-1 self-start rounded-lg border p-0.5" style={{ borderColor: 'var(--border-strong)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
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
  const [filterMode, setFilterMode] = useState('vehicle') // 'vehicle' | 'category'
  const [equipmentId, setEquipmentId] = useState(active[0]?.id ?? equipment[0]?.id ?? '')
  const [selectedType, setSelectedType] = useState(equipmentTypes[0])

  const history = useMemo(() => {
    let logs = []
    if (filterMode === 'vehicle') {
      logs = usageLogs.filter((l) => l.equipmentId === equipmentId)
    } else {
      const categoryEqIds = new Set(equipment.filter((e) => e.type === selectedType).map((e) => e.id))
      const dateMap = {}
      usageLogs.filter((l) => categoryEqIds.has(l.equipmentId)).forEach((l) => {
        if (!dateMap[l.date]) dateMap[l.date] = { date: l.date, engineHours: 0, idleHours: 0, fuelUsageL: 0, count: 0 }
        dateMap[l.date].engineHours += l.engineHours || 0
        dateMap[l.date].idleHours += l.idleHours || 0
        dateMap[l.date].fuelUsageL += l.fuelUsageL || 0
        dateMap[l.date].count += 1
      })
      logs = Object.values(dateMap).map((d) => ({
        ...d,
        engineHours: +(d.engineHours / (d.count || 1)).toFixed(1),
        idleHours: +(d.idleHours / (d.count || 1)).toFixed(1),
      }))
    }
    return [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-10).map((l) => ({ ...l, date: l.date.slice(5) }))
  }, [usageLogs, equipment, equipmentId, selectedType, filterMode])

  const totalEngine = history.reduce((sum, h) => sum + h.engineHours, 0)
  const totalIdle = history.reduce((sum, h) => sum + h.idleHours, 0)
  const avgEfficiency = totalEngine + totalIdle > 0 ? Math.round((totalEngine / (totalEngine + totalIdle)) * 100) : 0

  const selectedVehicle = active.find((e) => e.id === equipmentId) ?? equipment.find((e) => e.id === equipmentId)

  return (
    <div className="flex flex-col gap-6">
      {/* Top Mode Selector Bar with Pixel-Perfect Alignment */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 border p-4"
        style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex flex-wrap items-end gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center font-bold self-center"
            style={{ borderRadius: 'var(--radius-sm)', background: 'var(--accent-wash)', color: 'var(--accent)' }}
          >
            <Icon name="truck" size={20} />
          </div>

          {/* Mode Column */}
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-faint)' }}>FILTER MODE</div>
            <div
              className="flex h-[38px] items-center gap-1 p-1"
              style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-raised)', border: '1px solid var(--border)' }}
            >
              <button
                onClick={() => setFilterMode('vehicle')}
                className="h-full px-3 text-xs font-bold transition-all"
                style={{
                  borderRadius: 'calc(var(--radius-sm) - 2px)',
                  background: filterMode === 'vehicle' ? 'var(--bg-surface)' : 'transparent',
                  color: filterMode === 'vehicle' ? 'var(--accent)' : 'var(--ink-muted)',
                  boxShadow: filterMode === 'vehicle' ? 'var(--shadow-card)' : 'none',
                }}
              >
                By Vehicle
              </button>
              <button
                onClick={() => setFilterMode('category')}
                className="h-full px-3 text-xs font-bold transition-all"
                style={{
                  borderRadius: 'calc(var(--radius-sm) - 2px)',
                  background: filterMode === 'category' ? 'var(--bg-surface)' : 'transparent',
                  color: filterMode === 'category' ? 'var(--accent)' : 'var(--ink-muted)',
                  boxShadow: filterMode === 'category' ? 'var(--shadow-card)' : 'none',
                }}
              >
                By Category
              </button>
            </div>
          </div>

          {/* Dynamic Selection Column */}
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-faint)' }}>
              {filterMode === 'vehicle' ? 'CHOOSE VEHICLE' : 'CHOOSE CATEGORY'}
            </div>
            {filterMode === 'vehicle' ? (
              <select
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
                className="h-[38px] rounded-lg border px-3 font-display text-sm font-bold outline-hidden"
                style={fieldStyle}
              >
                {equipment.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.id} — {e.tier} {e.type} ({e.status === 'active' ? 'On Rent' : 'Available'})
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-[38px] rounded-lg border px-3 font-display text-sm font-bold outline-hidden"
                style={fieldStyle}
              >
                {equipmentTypes.map((t) => (
                  <option key={t} value={t}>{t}s</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Quick Vehicle / Category Telemetry Summary Stats */}
        <div className="flex items-center gap-6 text-xs border-l pl-6" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="font-medium" style={{ color: 'var(--ink-muted)' }}>10-Day Runtime</div>
            <div className="font-mono text-sm font-bold" style={{ color: 'var(--accent)' }}>{totalEngine.toFixed(1)} hrs</div>
          </div>
          <div>
            <div className="font-medium" style={{ color: 'var(--ink-muted)' }}>10-Day Idle Time</div>
            <div className="font-mono text-sm font-bold" style={{ color: 'var(--warning)' }}>{totalIdle.toFixed(1)} hrs</div>
          </div>
          <div>
            <div className="font-medium" style={{ color: 'var(--ink-muted)' }}>Operational Efficiency</div>
            <div className="font-mono text-sm font-bold" style={{ color: 'var(--good)' }}>{avgEfficiency}%</div>
          </div>
        </div>
      </div>

      {/* Usage History Telemetry Graph */}
      <Card title={filterMode === 'vehicle' ? `${selectedVehicle?.id} (${selectedVehicle?.type}) Telemetry Graph` : `All ${selectedType}s Average Telemetry Graph`}>
        <UsageHistoryChart data={history} />
      </Card>
    </div>
  )
}

function ReportsTab() {
  const equipment = useAppStore((s) => s.equipment)
  const active = useMemo(() => equipment.filter((e) => e.status === 'active'), [equipment])

  const [filterMode, setFilterMode] = useState('vehicle') // 'vehicle' | 'category'
  const [selectedEqId, setSelectedEqId] = useState('ALL')
  const [selectedType, setSelectedType] = useState('ALL')

  const filteredEquipment = useMemo(() => {
    if (filterMode === 'vehicle') {
      return active.filter((e) => (selectedEqId === 'ALL' ? true : e.id === selectedEqId))
    } else {
      return active.filter((e) => (selectedType === 'ALL' ? true : e.type === selectedType))
    }
  }, [active, selectedEqId, selectedType, filterMode])

  const rented = useMemo(() => totalRentedHours(filteredEquipment), [filteredEquipment])
  const downtime = useMemo(() => totalDowntimeHours(filteredEquipment), [filteredEquipment])
  const efficiency = rented + downtime === 0 ? 0 : Math.round((rented / (rented + downtime)) * 100)
  const bySite = useMemo(() => usageBySite(filteredEquipment), [filteredEquipment])

  return (
    <div className="flex flex-col gap-6">
      {/* Top Mode Selector Bar with Pixel-Perfect Alignment */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 border p-4"
        style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex flex-wrap items-end gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center font-bold self-center"
            style={{ borderRadius: 'var(--radius-sm)', background: 'var(--accent-wash)', color: 'var(--accent)' }}
          >
            <Icon name="truck" size={20} />
          </div>

          {/* Mode Column */}
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-faint)' }}>FILTER MODE</div>
            <div
              className="flex h-[38px] items-center gap-1 p-1"
              style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-raised)', border: '1px solid var(--border)' }}
            >
              <button
                onClick={() => { setFilterMode('vehicle'); setSelectedType('ALL'); }}
                className="h-full px-3 text-xs font-bold transition-all"
                style={{
                  borderRadius: 'calc(var(--radius-sm) - 2px)',
                  background: filterMode === 'vehicle' ? 'var(--bg-surface)' : 'transparent',
                  color: filterMode === 'vehicle' ? 'var(--accent)' : 'var(--ink-muted)',
                  boxShadow: filterMode === 'vehicle' ? 'var(--shadow-card)' : 'none',
                }}
              >
                By Vehicle
              </button>
              <button
                onClick={() => { setFilterMode('category'); setSelectedEqId('ALL'); }}
                className="h-full px-3 text-xs font-bold transition-all"
                style={{
                  borderRadius: 'calc(var(--radius-sm) - 2px)',
                  background: filterMode === 'category' ? 'var(--bg-surface)' : 'transparent',
                  color: filterMode === 'category' ? 'var(--accent)' : 'var(--ink-muted)',
                  boxShadow: filterMode === 'category' ? 'var(--shadow-card)' : 'none',
                }}
              >
                By Category
              </button>
            </div>
          </div>

          {/* Dynamic Selection Column */}
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-faint)' }}>
              {filterMode === 'vehicle' ? 'CHOOSE VEHICLE' : 'CHOOSE CATEGORY'}
            </div>
            {filterMode === 'vehicle' ? (
              <select
                value={selectedEqId}
                onChange={(e) => setSelectedEqId(e.target.value)}
                className="h-[38px] rounded-lg border px-3 font-display text-sm font-bold outline-hidden"
                style={fieldStyle}
              >
                <option value="ALL">All Active Fleet ({active.length} units)</option>
                {active.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.id} — {e.tier} {e.type}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-[38px] rounded-lg border px-3 font-display text-sm font-bold outline-hidden"
                style={fieldStyle}
              >
                <option value="ALL">All Categories</option>
                {equipmentTypes.map((t) => (
                  <option key={t} value={t}>{t}s</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Quick Summary Telemetry Stats */}
        <div className="flex items-center gap-6 text-xs border-l pl-6" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="font-medium" style={{ color: 'var(--ink-muted)' }}>Total Rented Hours</div>
            <div className="font-mono text-sm font-bold" style={{ color: 'var(--accent)' }}>{rented.toFixed(1)} hrs</div>
          </div>
          <div>
            <div className="font-medium" style={{ color: 'var(--ink-muted)' }}>Total Downtime</div>
            <div className="font-mono text-sm font-bold" style={{ color: 'var(--warning)' }}>{downtime.toFixed(1)} hrs</div>
          </div>
          <div>
            <div className="font-medium" style={{ color: 'var(--ink-muted)' }}>Operational Efficiency</div>
            <div className="font-mono text-sm font-bold" style={{ color: 'var(--good)' }}>{efficiency}%</div>
          </div>
        </div>
      </div>

      {/* Usage by Site */}
      <Card title="Usage by Site" bodyClassName="overflow-x-auto p-0">
        {bySite.length === 0 ? (
          <p className="px-5 py-6 text-sm" style={{ color: 'var(--ink-secondary)' }}>
            No active machinery matches the current filter.
          </p>
        ) : (
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left" style={{ color: 'var(--ink-muted)' }}>
                <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Site</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Units Deployed</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Engine hrs/day</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Idle hrs/day</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Site Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {bySite.map((s) => {
                const total = s.engineHours + s.idleHours
                const eff = total > 0 ? Math.round((s.engineHours / total) * 100) : 0
                return (
                  <tr key={s.siteId ?? '__unassigned__'} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--ink-primary)' }}>{s.name}</td>
                    <td className="px-3 py-3 tabular" style={{ color: 'var(--ink-secondary)' }}>{s.units}</td>
                    <td className="tabular px-3 py-3 font-mono font-bold" style={{ color: 'var(--series-engine)' }}>{s.engineHours.toFixed(1)} h</td>
                    <td className="tabular px-3 py-3 font-mono font-bold" style={{ color: 'var(--series-idle)' }}>{s.idleHours.toFixed(1)} h</td>
                    <td className="tabular px-3 py-3 font-mono font-bold" style={{ color: eff >= 60 ? 'var(--good)' : 'var(--warning)' }}>{eff}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Detailed Telemetry Report Table */}
      <Card
        title={
          filterMode === 'vehicle'
            ? selectedEqId !== 'ALL' ? `${selectedEqId} Telemetry Report` : 'All Machinery Telemetry Breakdown'
            : selectedType !== 'ALL' ? `${selectedType}s Category Telemetry Report` : 'All Categories Breakdown Report'
        }
        bodyClassName="overflow-x-auto p-0"
      >
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="text-left" style={{ color: 'var(--ink-muted)' }}>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Equipment Unit</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Deployment Site</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Engine hrs/day</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Idle hrs/day</th>
              <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {filteredEquipment.length > 0 ? (
              filteredEquipment.map((eq) => {
                const siteName = eq.siteId ? siteById[eq.siteId]?.name : 'Unassigned'
                const eng = eq.avgEngineHoursPerDay || 0
                const idle = eq.avgIdleHoursPerDay || 0
                const eff = eng + idle > 0 ? Math.round((eng / (eng + idle)) * 100) : 0
                return (
                  <tr key={eq.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--ink-primary)' }}>
                      <div>{eq.id}</div>
                      <div className="text-xs font-normal" style={{ color: 'var(--ink-faint)' }}>{eq.tier} {eq.type}</div>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--ink-secondary)' }}>{siteName}</td>
                    <td className="tabular px-3 py-3 font-mono font-bold" style={{ color: 'var(--series-engine)' }}>{eng.toFixed(1)} h</td>
                    <td className="tabular px-3 py-3 font-mono font-bold" style={{ color: 'var(--series-idle)' }}>{idle.toFixed(1)} h</td>
                    <td className="tabular px-3 py-3 font-mono font-bold" style={{ color: eff >= 60 ? 'var(--good)' : 'var(--warning)' }}>{eff}%</td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-xs" style={{ color: 'var(--ink-faint)' }}>
                  No machinery matched the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
