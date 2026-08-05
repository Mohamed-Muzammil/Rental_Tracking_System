import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { clients } from '../../data/clients'
import { catalogById } from '../../data/catalog'
import { siteById } from '../../data/sites'
import { healthOf } from '../../lib/rules'
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
          const atRisk = units.filter((e) => ['critical', 'serious'].includes(healthOf(e, today))).length

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

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title & Context */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-slate-900" style={{ color: 'var(--ink-primary)' }}>
            Client Accounts & Site Operations
          </h1>
          <p className="text-sm text-slate-500" style={{ color: 'var(--ink-secondary)' }}>
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
          label="At-Risk Machinery"
          value={totalAtRiskUnits}
          unit="units flagged"
          severity={totalAtRiskUnits > 0 ? 'critical' : 'good'}
        />
      </div>

      {/* Industrial Control Toolbar — Pixel-Perfect Baseline Alignment */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-3 shadow-xs"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input Box (Height h-9 = 36px) */}
          <div className="relative min-w-[280px]">
            <input
              type="text"
              placeholder="Search company, contact, or site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border px-3 text-xs outline-hidden font-medium"
              style={{
                background: 'var(--bg-surface-raised)',
                borderColor: 'var(--border-strong)',
                color: 'var(--ink-primary)',
              }}
            />
          </div>

          {/* Account Filter Tabs (1st: All Accounts, 2nd: At Risk, 3rd: Filter By) */}
          <div className="flex h-9 items-center gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              onClick={() => {
                setFilterMode('all')
                setAppliedMinDeployment(null)
              }}
              className={`flex h-7 items-center rounded-md px-3 text-xs font-bold transition-all ${
                filterMode === 'all' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Accounts ({groups.length})
            </button>

            <button
              onClick={() => {
                setFilterMode('atRisk')
                setAppliedMinDeployment(null)
              }}
              className={`flex h-7 items-center rounded-md px-3 text-xs font-bold transition-all ${
                filterMode === 'atRisk' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              At Risk ({groups.filter((g) => g.atRisk > 0).length})
            </button>

            <button
              onClick={() => setFilterMode('filterBy')}
              className={`flex h-7 items-center rounded-md px-3 text-xs font-bold transition-all ${
                filterMode === 'filterBy' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Filter By
            </button>
          </div>
        </div>

        {/* View Mode Toggle (Height h-9 = 36px) */}
        <div className="flex h-9 items-center gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex h-7 items-center gap-1 rounded-md px-3 text-xs font-bold transition-all ${
              viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🗃️</span> Grid Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex h-7 items-center gap-1 rounded-md px-3 text-xs font-bold transition-all ${
              viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📋</span> Enterprise Table
          </button>
        </div>
      </div>

      {/* Next Line Drawer for 'Filter By' Machine Deployment */}
      {filterMode === 'filterBy' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-slate-50 p-3 shadow-xs border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-800">
              Show companies based on machine deployment:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Minimum units:</span>
              <input
                type="number"
                min="0"
                max="40"
                placeholder="e.g. 3"
                value={minDeploymentInput}
                onChange={(e) => setMinDeploymentInput(e.target.value)}
                className="h-8 w-20 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-mono font-bold outline-hidden focus:border-blue-500"
              />
              <button
                onClick={() => setAppliedMinDeployment(minDeploymentInput)}
                className="h-8 rounded-md bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                Apply
              </button>
              {appliedMinDeployment !== null && (
                <button
                  onClick={() => {
                    setAppliedMinDeployment(null)
                    setMinDeploymentInput('3')
                  }}
                  className="h-8 rounded-md bg-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-300 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {appliedMinDeployment !== null && (
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
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
              to={`/admin/equipment?client=${g.client.id}`}
              className="group flex flex-col justify-between rounded-xl border bg-white text-left transition-all hover:border-blue-400 hover:shadow-md"
              style={{
                borderColor: 'var(--border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div>
                {/* Account Card Header */}
                <div className="flex items-start justify-between gap-2 border-b p-4 bg-slate-50/70 rounded-t-xl" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">
                      {g.client.id}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm leading-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                        {g.client.name}
                      </h3>
                      <div className="text-xs text-slate-500 font-medium">{g.client.contact}</div>
                    </div>
                  </div>
                  {g.atRisk > 0 ? (
                    <StatusChip severity="critical">{g.atRisk} at risk</StatusChip>
                  ) : (
                    <StatusChip severity="good">Healthy</StatusChip>
                  )}
                </div>

                {/* Account Body Content */}
                <div className="flex flex-col gap-3 p-4">
                  {/* Rented Equipment Fraction (Industrial format e.g. 4/40 total units rented) */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Rented Fleet Share:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {g.units.length} / {TOTAL_UNITS} units rented ({Math.round((g.units.length / TOTAL_UNITS) * 100)}%)
                    </span>
                  </div>

                  {/* Machinery Breakdown Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(g.categoryCounts).length > 0 ? (
                      Object.entries(g.categoryCounts).map(([cat, count]) => (
                        <span
                          key={cat}
                          className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                        >
                          {count}x {cat}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No equipment currently on rent</span>
                    )}
                  </div>

                  {/* Deployment Site Locations */}
                  {g.siteNames.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Icon name="mapPin" size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{g.siteNames.join(', ')}</span>
                    </div>
                  )}

                  {/* Telemetry Efficiency Bar */}
                  {g.units.length > 0 && (
                    <div className="mt-1">
                      <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-500">
                        <span>Utilization Efficiency</span>
                        <span className="font-mono text-slate-700">
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
                className="flex items-center justify-between border-t p-4 text-xs bg-slate-50/50 rounded-b-xl"
                style={{ borderColor: 'var(--border)' }}
              >
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Daily Billing</span>
                  <span className="font-mono font-bold text-sm text-slate-900">${g.dailySpend.toLocaleString()}/day</span>
                </div>

                <span className="inline-flex items-center gap-1 font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  View Account Fleet <Icon name="chevronRight" size={14} />
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
              <tr className="text-left bg-slate-50 text-slate-500 border-b" style={{ borderColor: 'var(--border)' }}>
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
                <tr key={g.client.id} className="border-t hover:bg-slate-50/80 transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    <div className="font-bold">{g.client.name}</div>
                    <div className="text-xs text-blue-600 font-mono">{g.client.id}</div>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-slate-600 font-medium">{g.client.contact}</td>
                  <td className="px-3 py-3.5 font-mono text-xs font-bold text-slate-800">
                    {g.units.length}/{TOTAL_UNITS} units
                  </td>
                  <td className="px-3 py-3.5 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(g.categoryCounts).map(([cat, count]) => (
                        <span key={cat} className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                          {count}x {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-slate-600">{g.siteNames.join(', ') || '—'}</td>
                  <td className="px-3 py-3.5 font-mono text-xs font-bold text-emerald-600">
                    ${g.dailySpend.toLocaleString()}/day
                  </td>
                  <td className="px-3 py-3.5">
                    {g.atRisk > 0 ? (
                      <StatusChip severity="critical">{g.atRisk} at risk</StatusChip>
                    ) : (
                      <StatusChip severity="good">Healthy</StatusChip>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      to={`/admin/equipment?client=${g.client.id}`}
                      className="inline-flex items-center gap-1 rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      View Fleet <Icon name="chevronRight" size={12} />
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
