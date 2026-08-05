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

  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [regType, setRegType] = useState('Excavator')
  const [regTier, setRegTier] = useState('Heavy Duty')
  const [regCost, setRegCost] = useState('350')
  const registerEquipment = useAppStore((s) => s.registerEquipment)

  const handleRegisterSubmit = (e) => {
    e.preventDefault()
    const newId = `EQX-2${Math.floor(40 + Math.random() * 60)}`
    registerEquipment({
      id: newId,
      type: regType,
      tier: regTier,
      dailyCost: Number(regCost),
      qrCode: `QR-${newId}`,
    })
    setShowRegisterModal(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
            Equipment Roster & Life Cycle
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            {clientFilter
              ? `${clientById[clientFilter]?.name || 'Client'} — ${equipment.filter((e) => e.clientId === clientFilter && e.status === 'active').length}/${equipment.length} units currently on rent.`
              : `Full fleet roster — ${equipment.filter((e) => e.status === 'active').length}/${equipment.length} units currently on rent.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowRegisterModal(true)}>
            <Icon name="plus" size={14} /> Register New Equipment
          </Button>
          <Button variant="primary" onClick={() => navigate('/admin/checkin')}>
            <Icon name="swap" size={14} /> Check-in / Check-out
          </Button>
        </div>
      </div>

      {/* Equipment Registration Modal */}
      {showRegisterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(2px)' }}
        >
          <div
            className="w-full max-w-md p-6"
            style={{ borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lifted)' }}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-bold text-base" style={{ color: 'var(--ink-primary)' }}>Register New Equipment Unit</h3>
              <button onClick={() => setShowRegisterModal(false)} style={{ color: 'var(--ink-muted)' }}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4 text-xs font-medium">
              <div>
                <label className="block uppercase text-[10px] font-bold mb-1" style={{ color: 'var(--ink-muted)' }}>Equipment Category</label>
                <select
                  value={regType}
                  onChange={(e) => setRegType(e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border p-2 text-sm outline-hidden"
                  style={inputStyle}
                >
                  {equipmentTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block uppercase text-[10px] font-bold mb-1" style={{ color: 'var(--ink-muted)' }}>Tier / Specification</label>
                <input
                  type="text"
                  value={regTier}
                  onChange={(e) => setRegTier(e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border p-2 text-sm outline-hidden"
                  style={inputStyle}
                  placeholder="e.g. Heavy Duty / Compact / Standard"
                  required
                />
              </div>

              <div>
                <label className="block uppercase text-[10px] font-bold mb-1" style={{ color: 'var(--ink-muted)' }}>Daily Billing Rate ($/day)</label>
                <input
                  type="number"
                  value={regCost}
                  onChange={(e) => setRegCost(e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border p-2 text-sm outline-hidden"
                  style={inputStyle}
                  required
                />
              </div>

              <div
                className="p-3 text-[11px]"
                style={{ borderRadius: 'var(--radius-sm)', background: 'var(--accent-wash)', border: '1px solid var(--border)', color: 'var(--accent-dark)' }}
              >
                <span className="font-bold">QR Barcode Generator:</span> A unique QR barcode (`QR-EQX-${Math.floor(40+Math.random()*60)}`) will be automatically assigned to this physical machine for warehouse dispatch scanning.
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                <Button variant="secondary" onClick={() => setShowRegisterModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Generate Unique ID & Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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

  const todayStr = format(today, 'yyyy-MM-dd')
  const agreementStart = eq.checkIn || '2026-01-01'
  const agreementEnd = eq.expectedReturn || todayStr

  // Custom date validation against agreement range
  const dateError = useMemo(() => {
    if (presetPeriod !== 'custom') return null
    if (customStartDate && (customStartDate < agreementStart || customStartDate > agreementEnd)) {
      return `Date out of range! Custom start date must be between ${agreementStart} and ${agreementEnd}.`
    }
    if (customEndDate && (customEndDate < agreementStart || customEndDate > agreementEnd)) {
      return `Date out of range! Custom end date must be between ${agreementStart} and ${agreementEnd}.`
    }
    if (customStartDate && customEndDate && customStartDate > customEndDate) {
      return `Start date cannot be after end date.`
    }
    return null
  }, [presetPeriod, customStartDate, customEndDate, agreementStart, agreementEnd])

  const eqLogs = useMemo(() => {
    let logs = usageLogs.filter((l) => l.equipmentId === eq.id)
    if (presetPeriod === 'agreement' && eq.checkIn) {
      logs = logs.filter((l) => l.date >= eq.checkIn && (eq.expectedReturn ? l.date <= eq.expectedReturn : true))
    } else if (presetPeriod === '7days') {
      logs = logs.slice(-7)
    } else if (presetPeriod === 'custom') {
      if (dateError) {
        logs = []
      } else {
        if (customStartDate) logs = logs.filter((l) => l.date >= customStartDate)
        if (customEndDate) logs = logs.filter((l) => l.date <= customEndDate)
      }
    }
    // Always sort in ASCENDING order (earliest date to latest date)
    return logs.sort((a, b) => a.date.localeCompare(b.date))
  }, [usageLogs, eq.id, eq.checkIn, eq.expectedReturn, presetPeriod, customStartDate, customEndDate, dateError])

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
            <h4 className="font-semibold text-xs" style={{ color: 'var(--ink-primary)' }}>Unit Telemetry Logs</h4>
            
            {/* View Mode Toggle */}
            <div className="flex gap-1 rounded-md border p-0.5" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setViewMode('chart')}
                className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors"
                style={{
                  background: viewMode === 'chart' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'chart' ? 'var(--accent-ink)' : 'var(--ink-muted)',
                  fontWeight: viewMode === 'chart' ? 700 : 500,
                }}
              >
                <Icon name="trendingUp" size={12} /> Chart
              </button>
              <button
                onClick={() => setViewMode('table')}
                className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors"
                style={{
                  background: viewMode === 'table' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--accent-ink)' : 'var(--ink-muted)',
                  fontWeight: viewMode === 'table' ? 700 : 500,
                }}
              >
                <Icon name="table" size={12} /> Table
              </button>
            </div>
          </div>

          {/* Sleek Segmented Range Control */}
          <div className="mb-3 flex p-1 text-xs" style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-raised)', border: '1px solid var(--border)' }}>
            {[
              { key: 'agreement', label: 'Agreement' },
              { key: '7days', label: '7 Days' },
              { key: 'all', label: 'All Records' },
              { key: 'custom', label: 'Custom Range' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setPresetPeriod(opt.key)}
                className="flex-1 py-1.5 px-2 text-[11px] font-bold whitespace-nowrap transition-all"
                style={{
                  borderRadius: 'calc(var(--radius-sm) - 2px)',
                  background: presetPeriod === opt.key ? 'var(--bg-surface)' : 'transparent',
                  color: presetPeriod === opt.key ? 'var(--accent)' : 'var(--ink-muted)',
                  boxShadow: presetPeriod === opt.key ? 'var(--shadow-card)' : 'none',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Manual Custom Date Range Inputs with Agreement Bounds & Error Display */}
          {presetPeriod === 'custom' && (
            <div className="mb-3 flex flex-col gap-2 p-2.5" style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-raised)', border: '1px solid var(--border)' }}>
              {dateError && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium"
                  style={{ borderRadius: 'var(--radius-sm)', background: 'var(--critical-wash)', color: 'var(--critical)', border: '1px solid var(--border)' }}
                >
                  <Icon name="alert" size={14} />
                  <span>{dateError}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <span className="block text-[9px] font-bold uppercase mb-0.5" style={{ color: 'var(--ink-muted)' }}>From Date</span>
                  <input
                    type="date"
                    min={agreementStart}
                    max={agreementEnd}
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full rounded-[var(--radius-sm)] border px-2 py-1 text-xs outline-hidden"
                    style={{ background: 'var(--bg-surface)', borderColor: dateError ? 'var(--critical)' : 'var(--border-strong)', color: 'var(--ink-primary)' }}
                  />
                </div>
                <span className="text-xs font-bold mt-3" style={{ color: 'var(--ink-muted)' }}>to</span>
                <div className="flex-1">
                  <span className="block text-[9px] font-bold uppercase mb-0.5" style={{ color: 'var(--ink-muted)' }}>To Date</span>
                  <input
                    type="date"
                    min={agreementStart}
                    max={agreementEnd}
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full rounded-[var(--radius-sm)] border px-2 py-1 text-xs outline-hidden"
                    style={{ background: 'var(--bg-surface)', borderColor: dateError ? 'var(--critical)' : 'var(--border-strong)', color: 'var(--ink-primary)' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Telemetry Quick Summary Badges */}
          <div className="mb-3 grid grid-cols-2 gap-2 p-2 text-xs border" style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-raised)', borderColor: 'var(--border)' }}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>Total Runtime</span>
              <div className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{totalRuntime.toFixed(1)} hrs</div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>Est. Fuel Consumed</span>
              <div className="font-mono font-bold" style={{ color: 'var(--good)' }}>{totalFuel.toFixed(1)} L</div>
            </div>
          </div>

          {/* Telemetry Display (Chart or Table) */}
          {viewMode === 'chart' ? (
            <div className="pt-2">
              <UsageHistoryChart data={chartData} height={180} />
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto border" style={{ borderRadius: 'var(--radius-sm)', borderColor: 'var(--border)' }}>
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0" style={{ background: 'var(--bg-surface-raised)', color: 'var(--ink-muted)' }}>
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
                      <tr key={log.date} className="border-t" style={{ borderColor: 'var(--border)' }}>
                        <td className="px-3 py-1.5 font-mono" style={{ color: 'var(--ink-primary)' }}>{log.date}</td>
                        <td className="px-2 py-1.5 font-mono font-bold" style={{ color: 'var(--accent)' }}>{log.engineHours}h</td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: 'var(--warning)' }}>{log.idleHours}h</td>
                        <td className="px-2 py-1.5 font-mono" style={{ color: 'var(--good)' }}>{log.fuelUsageL}L</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-xs" style={{ color: 'var(--ink-muted)' }}>
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
