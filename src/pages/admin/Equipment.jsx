import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const STATUS_FILTERS = ['All', 'Active', 'Available']

const inputStyle = {
  background: 'var(--bg-surface-raised)',
  borderColor: 'var(--border-strong)',
  color: 'var(--ink-primary)',
}

export default function Equipment() {
  const navigate = useNavigate()
  const equipment = useAppStore((s) => s.equipment)
  const today = useAppStore((s) => s.today)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(null)

  const filtered = useMemo(() => {
    return equipment
      .filter((e) => (statusFilter === 'All' ? true : statusFilter === 'Active' ? e.status === 'active' : e.status === 'completed'))
      .filter((e) => (typeFilter === 'All' ? true : e.type === typeFilter))
      .filter((e) => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        return e.id.toLowerCase().includes(q) || e.type.toLowerCase().includes(q) || e.tier.toLowerCase().includes(q)
      })
      .sort((a, b) => (a.status === b.status ? a.id.localeCompare(b.id) : a.status === 'active' ? -1 : 1))
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
            Full fleet roster — {equipment.length} units, {equipment.filter((e) => e.status === 'active').length} currently on rent.
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
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" bodyClassName="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left" style={{ color: 'var(--ink-muted)' }}>
                <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Unit</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Status</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Site</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Utilization</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((eq) => {
                const isActive = eq.status === 'active'
                const health = isActive ? healthOf(eq, today) : 'neutral'
                const site = eq.siteId ? siteById[eq.siteId]?.name : null
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
                      <StatusChip severity={isActive ? 'good' : 'neutral'} icon={isActive ? 'truck' : undefined}>
                        {isActive ? 'On Rent' : 'Available'}
                      </StatusChip>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--ink-secondary)' }}>
                      {isActive ? (site ?? 'Unassigned') : '—'}
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
  const catalog = catalogById[eq.catalogId]
  const rs = eq.status === 'active' ? returnStatus(eq, today) : null
  const util = eq.status === 'active' ? utilizationOf(eq) : null

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center gap-2">
        <StatusChip severity={eq.status === 'active' ? 'good' : 'neutral'}>
          {eq.status === 'active' ? 'On Rent' : 'Available'}
        </StatusChip>
        <span className="text-sm" style={{ color: 'var(--ink-secondary)' }}>{eq.tier} {eq.type}</span>
      </div>

      <Row label="Daily rate" value={`$${catalog.dailyCost}`} />
      <Row label="Site" value={eq.siteId ? siteById[eq.siteId]?.name : 'Unassigned'} />
      <Row label="Client" value={eq.clientId ? clientById[eq.clientId]?.name : '—'} />
      <Row label="Operator" value={eq.operatorId ?? 'Unassigned'} />
      {eq.status === 'active' ? (
        <>
          <Row label="Checked in" value={eq.checkIn} />
          <Row label="Expected return" value={eq.expectedReturn} />
          <Row label="Utilization" value={`${Math.round(util * 100)}%`} />
          <Row label="Engine hrs/day" value={eq.avgEngineHoursPerDay} />
          <Row label="Idle hrs/day" value={eq.avgIdleHoursPerDay} />
        </>
      ) : (
        <>
          <Row label="Last checked out" value={eq.checkIn} />
          <Row label="Last checked in" value={eq.checkOut ?? '—'} />
        </>
      )}

      <Button variant="primary" className="mt-4 justify-center" onClick={() => navigate('/admin/checkin')}>
        <Icon name="swap" size={14} /> {eq.status === 'active' ? 'Check in this unit' : 'Check out this unit'}
      </Button>
    </div>
  )
}
