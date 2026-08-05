import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { clients } from '../../data/clients'
import { siteById } from '../../data/sites'
import { catalogById } from '../../data/catalog'
import { healthOf, returnStatus } from '../../lib/rules'
import Card from '../../components/ui/Card'
import StatusChip from '../../components/ui/StatusChip'
import UtilizationBar from '../../components/ui/UtilizationBar'
import Icon from '../../components/ui/Icon'

const RETURN_LABEL = {
  overdue: (d) => `${d}d overdue`,
  'due-soon': (d) => `Due in ${d}d`,
  'on-track': () => 'On track',
}
const RETURN_SEVERITY = { overdue: 'critical', 'due-soon': 'warning', 'on-track': 'good' }

export default function Companies() {
  const equipment = useAppStore((s) => s.equipment)
  const today = useAppStore((s) => s.today)

  const active = useMemo(() => equipment.filter((e) => e.status === 'active'), [equipment])

  const groups = useMemo(
    () =>
      clients
        .map((client) => {
          const units = active.filter((e) => e.clientId === client.id)
          const totalEngine = units.reduce((s, e) => s + e.avgEngineHoursPerDay, 0)
          const totalIdle = units.reduce((s, e) => s + e.avgIdleHoursPerDay, 0)
          const dailySpend = units.reduce((s, e) => s + (catalogById[e.catalogId]?.dailyCost ?? 0), 0)
          const atRisk = units.filter((e) => ['critical', 'serious'].includes(healthOf(e, today))).length
          return { client, units, totalEngine, totalIdle, dailySpend, atRisk }
        })
        .sort((a, b) => b.units.length - a.units.length),
    [active, today],
  )

  const [selectedId, setSelectedId] = useState(null)
  const selected = groups.find((g) => g.client.id === selectedId) ?? null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
          Companies
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Every renting company and what they currently have on-site — {groups.length} accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <button
            key={g.client.id}
            onClick={() => setSelectedId((id) => (id === g.client.id ? null : g.client.id))}
            className="flex flex-col gap-3 rounded-xl border p-4 text-left transition-opacity hover:opacity-90"
            style={{
              background: 'var(--bg-surface)',
              borderColor: selectedId === g.client.id ? 'var(--accent)' : 'var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: 'var(--accent-wash)', color: 'var(--accent)' }}
                >
                  <Icon name="building" size={18} />
                </span>
                <div>
                  <div className="font-medium leading-tight" style={{ color: 'var(--ink-primary)' }}>{g.client.name}</div>
                  <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>{g.client.contact}</div>
                </div>
              </div>
              {g.atRisk > 0 && <StatusChip severity="critical">{g.atRisk} at risk</StatusChip>}
            </div>

            {g.units.length > 0 ? (
              <UtilizationBar engineHours={g.totalEngine} idleHours={g.totalIdle} width={120} />
            ) : (
              <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>No active rentals</span>
            )}

            <div className="flex items-center justify-between border-t pt-3 text-xs" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--ink-secondary)' }}>{g.units.length} unit{g.units.length === 1 ? '' : 's'}</span>
              <span className="tabular font-data font-medium" style={{ color: 'var(--ink-primary)' }}>${g.dailySpend.toLocaleString()}/day</span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <Card title={`${selected.client.name} — equipment on rent`} bodyClassName="overflow-x-auto p-0">
          {selected.units.length === 0 ? (
            <p className="px-5 py-6 text-sm" style={{ color: 'var(--ink-secondary)' }}>
              This company has nothing checked out right now.
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left" style={{ color: 'var(--ink-muted)' }}>
                  <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Unit</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Site</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Utilization</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Return</th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Operator</th>
                </tr>
              </thead>
              <tbody>
                {selected.units.map((eq) => {
                  const health = healthOf(eq, today)
                  const rs = returnStatus(eq, today)
                  const site = eq.siteId ? siteById[eq.siteId]?.name : null
                  return (
                    <tr key={eq.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-5 py-3" style={{ borderLeft: `3px solid var(--${health})` }}>
                        <div className="font-medium" style={{ color: 'var(--ink-primary)' }}>{eq.id}</div>
                        <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>{eq.tier} {eq.type}</div>
                      </td>
                      <td className="px-3 py-3">
                        {site ? (
                          <span className="inline-flex items-center gap-1" style={{ color: 'var(--ink-secondary)' }}>
                            <Icon name="mapPin" size={13} />
                            {site}
                          </span>
                        ) : (
                          <StatusChip severity="serious">Unassigned</StatusChip>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <UtilizationBar engineHours={eq.avgEngineHoursPerDay} idleHours={eq.avgIdleHoursPerDay} />
                      </td>
                      <td className="px-3 py-3">
                        <StatusChip severity={RETURN_SEVERITY[rs.state]}>{RETURN_LABEL[rs.state](rs.days)}</StatusChip>
                      </td>
                      <td className="px-3 py-3 text-xs" style={{ color: 'var(--ink-muted)' }}>{eq.operatorId ?? 'Unassigned'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  )
}
