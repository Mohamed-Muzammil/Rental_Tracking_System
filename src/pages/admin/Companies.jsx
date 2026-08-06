import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { clients } from '../../data/clients'
import { catalogById } from '../../data/catalog'
import { siteById } from '../../data/sites'
import { healthOf, utilizationOf } from '../../lib/rules'
import StatusChip from '../../components/ui/StatusChip'
import UtilizationBar from '../../components/ui/UtilizationBar'
import Icon from '../../components/ui/Icon'
import Card from '../../components/ui/Card'
import StatTile from '../../components/ui/StatTile'

export default function Companies() {
  const equipment = useAppStore((s) => s.equipment)
  const today = useAppStore((s) => s.today)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'atRisk' | 'filterBy'
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table'

  // Machine deployment filter state
  const [minDeploymentInput, setMinDeploymentInput] = useState('3')
  const [appliedMinDeployment, setAppliedMinDeployment] = useState(null)

  const active = useMemo(() => equipment.filter((e) => e.status === 'active'), [equipment])
  const TOTAL_UNITS = equipment.length // 40 total units in fleet

  const groups = useMemo(
    () =>
      clients
        .map((client) => {
          const units = active.filter((e) => e.clientId === client.id)
          const totalEngine = units.reduce((s, e) => s + e.avgEngineHoursPerDay, 0)
          const totalIdle = units.reduce((s, e) => s + e.avgIdleHoursPerDay, 0)
          const dailySpend = units.reduce((s, e) => s + (catalogById[e.catalogId]?.dailyCost ?? 0), 0)
          const atRisk = units.filter((e) => {
            const util = utilizationOf(e)
            const isDead = util < 0.1
            const showUtilAlert = !isDead && (util < 0.3 || util > 0.85)
            return isDead || showUtilAlert
          }).length

          // Machinery Breakdown (counts per category)
          const categoryCounts = {}
          units.forEach((u) => {
            categoryCounts[u.type] = (categoryCounts[u.type] || 0) + 1
          })

          // Sites deployed
          const siteNames = Array.from(new Set(units.map((u) => u.siteId).filter(Boolean))).map(
            (id) => siteById[id]?.name ?? id,
          )

          return {
            client,
            units,
            totalEngine,
            totalIdle,
            dailySpend,
            atRisk,
            categoryCounts,
            siteNames,
          }
        })
        .sort((a, b) => b.units.length - a.units.length),
    [active, today],
  )

  // Filter groups based on search query & selected tab
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        g.client.name.toLowerCase().includes(q) ||
        g.client.contact.toLowerCase().includes(q) ||
        g.siteNames.some((s) => s.toLowerCase().includes(q))

      if (!matchesSearch) return false

      if (filterMode === 'atRisk') return g.atRisk > 0
      if (filterMode === 'filterBy') {
        if (appliedMinDeployment !== null && appliedMinDeployment !== '') {
          return g.units.length >= Number(appliedMinDeployment)
        }
        return true
      }
      return true
    })
  }, [groups, searchQuery, filterMode, appliedMinDeployment])

  // Overall Fleet Summary Stats
  const totalRentedUnits = active.length
  const totalDailyRevenue = groups.reduce((sum, g) => sum + g.dailySpend, 0)
  const totalAtRiskUnits = groups.reduce((sum, g) => sum + g.atRisk, 0)

  const segmentBtnStyle = (active) => ({
    background: active ? 'var(--bg-surface)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--ink-secondary)',
    boxShadow: active ? 'var(--shadow-card)' : 'none',
    borderRadius: 'calc(var(--radius-sm) - 2px)',
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title & Context */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
            Client Accounts & Site Operations
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Enterprise rental accounts, active machinery deployment, and financial rate breakdown.
          </p>
        </div>
      </div>

      {/* Industrial Hero KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Active Renting Accounts" value={groups.length} unit="companies" />
        <StatTile
          label="Deployed Machinery"
          value={`${totalRentedUnits}/${TOTAL_UNITS}`}
          unit="units rented"
          severity="neutral"
        />
        <StatTile
          label="Total Daily Revenue"
          value={`$${totalDailyRevenue.toLocaleString()}`}
          unit="/day"
          severity="good"
        />
        <StatTile
          label="Needs Attention"
          value={totalAtRiskUnits}
          unit="units flagged"
          severity={totalAtRiskUnits > 0 ? 'critical' : 'good'}
        />
      </div>

      {/* Industrial Control Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 border p-3"
        style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--border)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input Box (Height h-9 = 36px) */}
          <div className="relative min-w-[280px]">
            <input
              type="text"
              placeholder="Search company, contact, or site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-[var(--radius-sm)] border px-3 text-xs outline-hidden font-medium"
              style={{
                background: 'var(--bg-surface-raised)',
                borderColor: 'var(--border-strong)',
                color: 'var(--ink-primary)',
              }}
            />
          </div>

          {/* Account Filter Tabs (1st: All Accounts, 2nd: At Risk, 3rd: Filter By) */}
          <div
            className="flex h-9 items-center gap-1 p-1 text-xs"
            style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-raised)', border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => {
                setFilterMode('all')
                setAppliedMinDeployment(null)
              }}
              className="flex h-7 items-center px-3 text-xs font-bold transition-all"
              style={segmentBtnStyle(filterMode === 'all')}
            >
              All Accounts ({groups.length})
            </button>

            <button
              onClick={() => {
                setFilterMode('atRisk')
                setAppliedMinDeployment(null)
              }}
              className="flex h-7 items-center px-3 text-xs font-bold transition-all"
              style={segmentBtnStyle(filterMode === 'atRisk')}
            >
              Needs Attention ({groups.filter((g) => g.atRisk > 0).length})
            </button>

            <button
              onClick={() => setFilterMode('filterBy')}
              className="flex h-7 items-center px-3 text-xs font-bold transition-all"
              style={segmentBtnStyle(filterMode === 'filterBy')}
            >
              Filter By
            </button>
          </div>
        </div>

        {/* View Mode Toggle (Height h-9 = 36px) */}
        <div
          className="flex h-9 items-center gap-1 p-1 text-xs"
          style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-raised)', border: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setViewMode('grid')}
            className="flex h-7 items-center gap-1 px-3 text-xs font-bold transition-all"
            style={segmentBtnStyle(viewMode === 'grid')}
          >
            <Icon name="grid" size={13} /> Grid Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className="flex h-7 items-center gap-1 px-3 text-xs font-bold transition-all"
            style={segmentBtnStyle(viewMode === 'table')}
          >
            <Icon name="table" size={13} /> Table
          </button>
        </div>
      </div>

      {/* Next Line Drawer for 'Filter By' Machine Deployment */}
      {filterMode === 'filterBy' && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 border p-3"
          style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-raised)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold" style={{ color: 'var(--ink-primary)' }}>
              Show companies based on machine deployment:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>Minimum units:</span>
              <input
                type="number"
                min="0"
                max="40"
                placeholder="e.g. 3"
                value={minDeploymentInput}
                onChange={(e) => setMinDeploymentInput(e.target.value)}
                className="h-8 w-20 rounded-[var(--radius-sm)] border px-2.5 text-xs font-mono font-bold outline-hidden"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)', color: 'var(--ink-primary)' }}
              />
              <button
                onClick={() => setAppliedMinDeployment(minDeploymentInput)}
                className="h-8 rounded-[var(--radius-sm)] px-4 text-xs font-bold transition-opacity hover:opacity-85"
                style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
              >
                Apply
              </button>
              {appliedMinDeployment !== null && (
                <button
                  onClick={() => {
                    setAppliedMinDeployment(null)
                    setMinDeploymentInput('3')
                  }}
                  className="h-8 rounded-[var(--radius-sm)] px-3 text-xs font-semibold transition-opacity hover:opacity-85"
                  style={{ background: 'var(--border)', color: 'var(--ink-secondary)' }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {appliedMinDeployment !== null && (
            <span
              className="text-xs font-bold px-3 py-1"
              style={{ borderRadius: 'var(--radius-sm)', color: 'var(--accent-dark)', background: 'var(--accent-wash)', border: '1px solid var(--border)' }}
            >
              Filtering: Companies with ≥ {appliedMinDeployment} machines deployed ({filteredGroups.length} matching)
            </span>
          )}
        </div>
      )}

      {/* Grid Cards View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((g) => (
            <Link
              key={g.client.id}
              to={`/admin/companies/${g.client.id}`}
              className="group flex flex-col justify-between border text-left transition-all hover:shadow-md"
              style={{
                borderRadius: 'var(--radius-md)',
                borderColor: 'var(--border)',
                background: 'var(--bg-surface)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div>
                {/* Account Card Header */}
                <div
                  className="flex items-start justify-between gap-2 border-b p-4"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center font-bold text-xs"
                      style={{ borderRadius: 'var(--radius-sm)', background: 'var(--accent-wash)', color: 'var(--accent-dark)' }}
                    >
                      {g.client.id}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm leading-tight transition-colors" style={{ color: 'var(--ink-primary)' }}>
                        {g.client.name}
                      </h3>
                      <div className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>{g.client.contact}</div>
                    </div>
                  </div>
                  {g.atRisk > 0 ? (
                    <StatusChip severity="critical">{g.atRisk} needs attention</StatusChip>
                  ) : (
                    <StatusChip severity="good">Healthy</StatusChip>
                  )}
                </div>

                {/* Account Body Content */}
                <div className="flex flex-col gap-3 p-4">
                  {/* Rented Equipment Fraction (Industrial format e.g. 4/40 total units rented) */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium" style={{ color: 'var(--ink-muted)' }}>Rented Fleet Share:</span>
                    <span className="font-mono font-bold" style={{ color: 'var(--ink-primary)' }}>
                      {g.units.length} / {TOTAL_UNITS} units rented ({Math.round((g.units.length / TOTAL_UNITS) * 100)}%)
                    </span>
                  </div>

                  {/* Machinery Breakdown Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(g.categoryCounts).length > 0 ? (
                      Object.entries(g.categoryCounts).map(([cat, count]) => (
                        <span
                          key={cat}
                          className="border px-2 py-0.5 text-[11px] font-semibold"
                          style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-raised)', borderColor: 'var(--border)', color: 'var(--ink-secondary)' }}
                        >
                          {count}x {cat}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs italic" style={{ color: 'var(--ink-faint)' }}>No equipment currently on rent</span>
                    )}
                  </div>

                  {/* Deployment Site Locations */}
                  {g.siteNames.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
                      <Icon name="mapPin" size={13} className="shrink-0" style={{ color: 'var(--ink-faint)' }} />
                      <span className="truncate">{g.siteNames.join(', ')}</span>
                    </div>
                  )}

                  {/* Telemetry Efficiency Bar */}
                  {g.units.length > 0 && (
                    <div className="mt-1">
                      <div className="mb-1 flex justify-between text-[11px] font-medium" style={{ color: 'var(--ink-muted)' }}>
                        <span>Utilization Efficiency</span>
                        <span className="font-mono" style={{ color: 'var(--ink-secondary)' }}>
                          {(g.totalEngine + g.totalIdle > 0
                            ? Math.round((g.totalEngine / (g.totalEngine + g.totalIdle)) * 100)
                            : 0)}%
                        </span>
                      </div>
                      <UtilizationBar engineHours={g.totalEngine} idleHours={g.totalIdle} width="100%" />
                    </div>
                  )}
                </div>
              </div>

              {/* Financial & Action Footer */}
              <div
                className="flex items-center justify-between border-t p-4 text-xs"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-raised)', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}
              >
                <div>
                  <span className="block text-[10px] uppercase font-bold" style={{ color: 'var(--ink-faint)' }}>Daily Billing</span>
                  <span className="font-mono font-bold text-sm" style={{ color: 'var(--ink-primary)' }}>${g.dailySpend.toLocaleString()}/day</span>
                </div>

                <span className="inline-flex items-center gap-1 font-bold transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--accent)' }}>
                  View Account Profile <Icon name="chevronRight" size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* High-Density Enterprise Table View */
        <Card bodyClassName="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-raised)', color: 'var(--ink-muted)' }}>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider">Account & Code</th>
                <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider">Contact</th>
                <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider">Rented Share</th>
                <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider">Machinery Breakdown</th>
                <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider">Deployment Sites</th>
                <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider">Daily Revenue</th>
                <th className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((g) => (
                <tr key={g.client.id} className="border-t transition-colors hover:opacity-90" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--ink-primary)' }}>
                    <div className="font-bold">{g.client.name}</div>
                    <div className="text-xs font-mono" style={{ color: 'var(--accent)' }}>{g.client.id}</div>
                  </td>
                  <td className="px-3 py-3.5 text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>{g.client.contact}</td>
                  <td className="px-3 py-3.5 font-mono text-xs font-bold" style={{ color: 'var(--ink-primary)' }}>
                    {g.units.length}/{TOTAL_UNITS} units
                  </td>
                  <td className="px-3 py-3.5 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(g.categoryCounts).map(([cat, count]) => (
                        <span
                          key={cat}
                          className="border px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-raised)', borderColor: 'var(--border)', color: 'var(--ink-secondary)' }}
                        >
                          {count}x {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-xs" style={{ color: 'var(--ink-secondary)' }}>{g.siteNames.join(', ') || '—'}</td>
                  <td className="px-3 py-3.5 font-mono text-xs font-bold" style={{ color: 'var(--good)' }}>
                    ${g.dailySpend.toLocaleString()}/day
                  </td>
                  <td className="px-3 py-3.5">
                    {g.atRisk > 0 ? (
                      <StatusChip severity="critical">{g.atRisk} needs attention</StatusChip>
                    ) : (
                      <StatusChip severity="good">Healthy</StatusChip>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      to={`/admin/companies/${g.client.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold transition-opacity hover:opacity-80"
                      style={{ borderRadius: 'var(--radius-sm)', background: 'var(--accent-wash)', color: 'var(--accent-dark)' }}
                    >
                      View Account <Icon name="chevronRight" size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
