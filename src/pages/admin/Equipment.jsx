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
import RecommendationModal from '../../components/dashboard/RecommendationModal'
import UnitDetail from '../../components/dashboard/UnitDetail'

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

  // When viewing a client, we only care about their active fleet and units that have issues.
  const activeFilters = clientFilter 
    ? ['All Deployed', 'Needs Attention'] 
    : ['All', 'Active', 'Available', 'Maintenance']

  // If the current filter isn't valid for the new set of filters, reset it.
  if (!activeFilters.includes(statusFilter)) {
    if (clientFilter && (statusFilter === 'All' || statusFilter === 'Active')) {
      setStatusFilter('All Deployed')
    } else if (!clientFilter && statusFilter === 'All Deployed') {
      setStatusFilter('All')
    } else {
      setStatusFilter(activeFilters[0])
    }
  }

  const filtered = useMemo(() => {
    return equipment
      .filter((e) => {
        if (clientFilter) {
          // Client view filters
          if (statusFilter === 'All Deployed') return e.status === 'active'
          if (statusFilter === 'Needs Attention') {
            if (e.status !== 'active') return false
            const util = utilizationOf(e)
            const isDead = util < 0.1
            const showUtilAlert = !isDead && (util < 0.3 || util > 0.85)
            return isDead || showUtilAlert
          }
          return e.status === 'active'
        } else {
          // Global view filters
          if (statusFilter === 'All') return true
          return e.status === STATUS_TO_FIELD[statusFilter]
        }
      })
      .filter((e) => (typeFilter === 'All' ? true : e.type === typeFilter))
      .filter((e) => (clientFilter ? e.clientId === clientFilter : true))
      .filter((e) => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        return e.id.toLowerCase().includes(q) || e.type.toLowerCase().includes(q) || e.tier.toLowerCase().includes(q)
      })
      .sort((a, b) =>
        a.status === b.status ? a.id.localeCompare(b.id) : STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
      )
  }, [equipment, statusFilter, typeFilter, query, clientFilter, today])

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
          {activeFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
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
                const util = isActive ? utilizationOf(eq) : 0
                const client = eq.clientId ? clientById[eq.clientId]?.name : null

                let isDead = false
                let showUtilAlert = false
                if (isActive) {
                  if (util < 0.1) isDead = true
                  else if (util < 0.3 || util > 0.85) showUtilAlert = true
                }

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
                      {eq.finePending ? (
                        <StatusChip severity="critical" icon="alertTriangle">Fine Pending</StatusChip>
                      ) : (
                        <StatusChip
                          severity={isActive ? (isDead ? 'critical' : 'good') : eq.status === 'maintenance' ? 'warning' : 'neutral'}
                          icon={isActive ? (isDead ? 'alertTriangle' : 'truck') : eq.status === 'maintenance' ? 'alertTriangle' : undefined}
                        >
                          {isActive ? (isDead ? 'Lost Connection' : 'On Rent') : eq.status === 'maintenance' ? 'Maintenance' : 'Available'}
                        </StatusChip>
                      )}
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--ink-secondary)' }}>
                      {isActive ? (client ?? 'Unassigned') : '—'}
                    </td>
                    <td className="px-3 py-3">
                      {isActive ? (
                        <div className="flex items-center gap-2">
                          <UtilizationBar engineHours={eq.avgEngineHoursPerDay} idleHours={eq.avgIdleHoursPerDay} />
                          {showUtilAlert && <Icon name="alertTriangle" size={14} style={{ color: 'var(--critical)' }} />}
                        </div>
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

        <div className="sticky top-6 self-start max-h-[calc(100vh-8rem)] overflow-y-auto w-full">
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
    </div>
  )
}

