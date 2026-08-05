import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { clients } from '../../data/clients'
import { catalogById } from '../../data/catalog'
import { healthOf } from '../../lib/rules'
import StatusChip from '../../components/ui/StatusChip'
import UtilizationBar from '../../components/ui/UtilizationBar'
import Icon from '../../components/ui/Icon'

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {groups.map((g) => (
          <Link
            key={g.client.id}
            to={`/admin/companies/${g.client.id}`}
            className="group flex flex-col gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
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

            <span
              className="inline-flex items-center gap-1 text-xs font-medium transition-transform group-hover:translate-x-0.5"
              style={{ color: 'var(--accent)' }}
            >
              View details <Icon name="chevronRight" size={12} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

