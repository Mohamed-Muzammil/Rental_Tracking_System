import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { useAppStore } from '../../store/appStore'
import { siteById } from '../../data/sites'
import { clientById } from '../../data/clients'
import { catalogById } from '../../data/catalog'
import { equipmentTypes } from '../../data/demandHistory'
import { healthOf, returnStatus, utilizationOf } from '../../lib/rules'
import Card from '../../components/ui/Card'
import StatusChip from '../../components/ui/StatusChip'
import UtilizationBar from '../../components/ui/UtilizationBar'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import UsageHistoryChart from '../../components/ui/UsageHistoryChart'

const STATUS_FILTERS = ['All', 'Active', 'Available', 'Maintenance']
const STATUS_TO_FIELD = { Active: 'active', Available: 'completed', Maintenance: 'maintenance' }
const STATUS_ORDER = { active: 0, completed: 1, maintenance: 2 }

const inputStyle = {
  background: 'var(--bg-surface-raised)',
  borderColor: 'var(--border-strong)',
  color: 'var(--ink-primary)',
}

export default function Equipment() {
  const navigate = useNavigate()
  const equipment = useAppStore((s) => s.equipment)
  const today = useAppStore((s) => s.today)

  const [searchParams, setSearchParams] = useSearchParams()
  const typeFilter = searchParams.get('type') || 'All'
  const clientFilter = searchParams.get('client') || null

  const setTypeFilter = (val) => {
    if (val === 'All') searchParams.delete('type')
    else searchParams.set('type', val)
    setSearchParams(searchParams)
  }
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(null)

  const filtered = useMemo(() => {
    return equipment
      .filter((e) => (statusFilter === 'All' ? true : e.status === STATUS_TO_FIELD[statusFilter]))
      .filter((e) => (typeFilter === 'All' ? true : e.type === typeFilter))
      .filter((e) => (clientFilter ? e.clientId === clientFilter && e.status === 'active' : true))
      .filter((e) => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        return e.id.toLowerCase().includes(q) || e.type.toLowerCase().includes(q) || e.tier.toLowerCase().includes(q)
      })
      .sort((a, b) =>
        a.status === b.status ? a.id.localeCompare(b.id) : STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
      )
  }, [equipment, statusFilter, typeFilter, query])

  const selected = equipment.find((e) => e.id === selectedId) ?? null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
            Equipment
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            {clientFilter
              ? `${clientById[clientFilter]?.name || 'Client'} — ${equipment.filter((e) => e.clientId === clientFilter && e.status === 'active').length}/${equipment.length} units currently on rent.`
              : `Full fleet roster — ${equipment.filter((e) => e.status === 'active').length}/${equipment.length} units currently on rent.`}
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/admin/checkin')}>
          <Icon name="swap" size={14} /> Check-in / Check-out
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-muted)' }}>
            <Icon name="search" size={14} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search unit, type, tier…"
            className="rounded-lg border py-1.5 pl-8 pr-3 text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div className="flex gap-1 rounded-lg border p-0.5" style={{ borderColor: 'var(--border-strong)' }}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="rounded-md px-2.5 py-1 text-xs font-medium"
              style={{
                background: statusFilter === s ? 'var(--accent)' : 'transparent',
                color: statusFilter === s ? 'var(--accent-ink)' : 'var(--ink-secondary)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border py-1.5 px-2.5 text-sm outline-none"
          style={inputStyle}
        >
          <option>All</option>
          {equipmentTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {clientFilter && (
          <Button variant="secondary" onClick={() => { searchParams.delete('client'); setSearchParams(searchParams) }}>
            Clear Client Filter
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" bodyClassName="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left" style={{ color: 'var(--ink-muted)' }}>
                <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Unit</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Status</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Client</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Utilization</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((eq) => {
                const isActive = eq.status === 'active'
                const health = isActive ? healthOf(eq, today) : 'neutral'
                const client = eq.clientId ? clientById[eq.clientId]?.name : null
                return (
                  <tr
                    key={eq.id}
                    onClick={() => setSelectedId(eq.id)}
                    className="cursor-pointer border-t transition-colors hover:opacity-90"
                    style={{ borderColor: 'var(--border)', background: selectedId === eq.id ? 'var(--accent-wash)' : 'transparent' }}
                  >
                    <td className="px-5 py-3" style={isActive ? { borderLeft: `3px solid var(--${health})` } : undefined}>
                      <div className="font-medium" style={{ color: 'var(--ink-primary)' }}>{eq.id}</div>
                      <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>{eq.tier} {eq.type}</div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusChip
                        severity={isActive ? 'good' : eq.status === 'maintenance' ? 'warning' : 'neutral'}
                        icon={isActive ? 'truck' : eq.status === 'maintenance' ? 'alertTriangle' : undefined}
                      >
                        {isActive ? 'On Rent' : eq.status === 'maintenance' ? 'Maintenance' : 'Available'}
                      </StatusChip>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--ink-secondary)' }}>
                      {isActive ? (client ?? 'Unassigned') : '—'}
                    </td>
                    <td className="px-3 py-3">
                      {isActive ? (
                        <UtilizationBar engineHours={eq.avgEngineHoursPerDay} idleHours={eq.avgIdleHoursPerDay} />
                      ) : (
                        <span style={{ color: 'var(--ink-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Icon name="chevronRight" size={14} className="inline-block" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        <Card title={selected ? selected.id : 'Unit Detail'}>
          {!selected ? (
            <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
              Select a unit from the list to see its full record.
            </p>
          ) : (
            <UnitDetail eq={selected} today={today} />
          )}
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between border-t py-2 first:border-t-0" style={{ borderColor: 'var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{label}</span>
      <span className="tabular text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>{value}</span>
    </div>
  )
}

function UnitDetail({ eq, today }) {
  const navigate = useNavigate()
  const checkInEquipment = useAppStore((s) => s.checkInEquipment || s.checkIn)
  const usageLogs = useAppStore((s) => s.usageLogs)
  const openModal = useAppStore((s) => s.openModal)
  
  const [presetPeriod, setPresetPeriod] = useState('agreement') // 'agreement' | '7days' | 'all' | 'custom'
  const [viewMode, setViewMode] = useState('chart')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const catalog = catalogById[eq.catalogId]
  const util = eq.status === 'active' ? utilizationOf(eq) : null
  const isMaintenance = eq.status === 'maintenance'

  const eqLogs = useMemo(() => {
    let logs = usageLogs.filter((l) => l.equipmentId === eq.id)
    if (presetPeriod === 'agreement' && eq.checkIn) {
      logs = logs.filter((l) => l.date >= eq.checkIn && (eq.expectedReturn ? l.date <= eq.expectedReturn : true))
    } else if (presetPeriod === '7days') {
      logs = logs.slice(-7)
    } else if (presetPeriod === 'custom') {
      if (customStartDate) logs = logs.filter((l) => l.date >= customStartDate)
      if (customEndDate) logs = logs.filter((l) => l.date <= customEndDate)
    }
    // Always sort in ASCENDING order (earliest date to latest date)
    return logs.sort((a, b) => a.date.localeCompare(b.date))
  }, [usageLogs, eq.id, eq.checkIn, eq.expectedReturn, presetPeriod, customStartDate, customEndDate])

  const chartData = useMemo(
    () => eqLogs.map((l) => ({ ...l, date: l.date.slice(5) })),
    [eqLogs],
  )

  const totalRuntime = useMemo(() => eqLogs.reduce((sum, l) => sum + (l.engineHours || 0), 0), [eqLogs])
  const totalFuel = useMemo(() => eqLogs.reduce((sum, l) => sum + (l.fuelUsageL || 0), 0), [eqLogs])

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center gap-2">
        <StatusChip severity={eq.status === 'active' ? 'good' : isMaintenance ? 'warning' : 'neutral'}>
          {eq.status === 'active' ? 'On Rent' : isMaintenance ? 'Maintenance' : 'Available'}
        </StatusChip>
        <span className="text-sm" style={{ color: 'var(--ink-secondary)' }}>{eq.tier} {eq.type}</span>
      </div>

      <Row label="Daily rate" value={`$${catalog.dailyCost}`} />
      {isMaintenance ? (
        <>
          <Row label="In workshop for" value={eq.maintenanceNote ?? 'Scheduled service'} />
          <Row label="Expected back" value={eq.expectedBackOn ?? '—'} />
        </>
      ) : (
        <>
          <Row label="Site" value={eq.siteId ? siteById[eq.siteId]?.name : 'Unassigned'} />
          <Row label="Client" value={eq.clientId ? clientById[eq.clientId]?.name : '—'} />
          <Row label="Operator" value={eq.operatorId ?? 'Unassigned'} />
        </>
      )}
      {eq.status === 'active' && (
        <>
          <Row label="Checked in" value={eq.checkIn} />
          <Row label="Expected return" value={eq.expectedReturn} />
          <Row label="Utilization" value={`${Math.round(util * 100)}%`} />
          <Row label="Engine hrs/day" value={eq.avgEngineHoursPerDay} />
          <Row label="Idle hrs/day" value={eq.avgIdleHoursPerDay} />
        </>
      )}
      {eq.status === 'completed' && (
        <>
          <Row label="Last checked out" value={eq.checkIn} />
          <Row label="Last checked in" value={eq.checkOut ?? '—'} />
        </>
      )}

      {!isMaintenance && (
        <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold text-xs text-slate-800">Unit Telemetry Logs</h4>
            
            {/* View Mode Toggle */}
            <div className="flex gap-1 rounded-md border p-0.5" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setViewMode('chart')}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  viewMode === 'chart' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📊 Chart
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📋 Table
              </button>
            </div>
          </div>

          {/* Quick Preset Filter Pills */}
          <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setPresetPeriod('agreement')}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
                presetPeriod === 'agreement'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Current Agreement
            </button>
            <button
              onClick={() => setPresetPeriod('7days')}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
                presetPeriod === '7days'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setPresetPeriod('all')}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
                presetPeriod === 'all'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setPresetPeriod('custom')}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
                presetPeriod === 'custom'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Custom Dates
            </button>
          </div>

          {/* Manual Custom Date Range Inputs */}
          {presetPeriod === 'custom' && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-50 p-2 border border-slate-200">
              <div className="flex-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">From</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full rounded border px-2 py-1 text-xs outline-hidden bg-white"
                  style={inputStyle}
                />
              </div>
              <span className="text-xs text-slate-400 font-bold mt-3">to</span>
              <div className="flex-1">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">To</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full rounded border px-2 py-1 text-xs outline-hidden bg-white"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* Telemetry Quick Summary Badges */}
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2 text-xs border" style={{ borderColor: 'var(--border)' }}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Runtime</span>
              <div className="font-mono font-bold text-blue-600">{totalRuntime.toFixed(1)} hrs</div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Est. Fuel Consumed</span>
              <div className="font-mono font-bold text-emerald-600">{totalFuel.toFixed(1)} L</div>
            </div>
          </div>

          {/* Telemetry Display (Chart or Table) */}
          {viewMode === 'chart' ? (
            <div className="pt-2">
              <UsageHistoryChart data={chartData} height={180} />
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 shadow-xs bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Date</th>
                    <th className="px-2 py-2 font-semibold">Runtime</th>
                    <th className="px-2 py-2 font-semibold">Idle</th>
                    <th className="px-2 py-2 font-semibold">Fuel</th>
                  </tr>
                </thead>
                <tbody>
                  {eqLogs.length > 0 ? (
                    eqLogs.map((log) => (
                      <tr key={log.date} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-1.5 font-mono text-slate-800">{log.date}</td>
                        <td className="px-2 py-1.5 font-mono text-blue-600 font-bold">{log.engineHours}h</td>
                        <td className="px-2 py-1.5 font-mono text-amber-600">{log.idleHours}h</td>
                        <td className="px-2 py-1.5 font-mono text-emerald-600">{log.fuelUsageL}L</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-400">
                        No telemetry logs for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!isMaintenance && (
        <Button 
          variant="primary" 
          className="mt-4 justify-center" 
          onClick={() => {
            if (eq.status === 'active') {
              openModal({
                title: `Confirm Unit Check-In`,
                message: `Are you sure you want to check in ${eq.id} (${eq.tier} ${eq.type}) back to the equipment yard?`,
                confirmText: 'Check In Unit',
                onConfirm: () => {
                  checkInEquipment(eq.id)
                },
              })
            } else {
              navigate('/admin/checkin')
            }
          }}
        >
          <Icon name="swap" size={14} /> {eq.status === 'active' ? 'Check in this unit' : 'Check out this unit'}
        </Button>
      )}
    </div>
  )
}
