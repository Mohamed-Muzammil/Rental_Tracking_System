import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { buildAlerts } from '../../lib/rules'
import Card from '../../components/ui/Card'
import StatusChip from '../../components/ui/StatusChip'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'

const SEVERITY_RANK = { critical: 0, serious: 1, warning: 2, info: 3 }
const SEVERITY_LABEL = { critical: 'Critical', serious: 'Serious', warning: 'Warning', info: 'Idea' }

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'due-soon', label: 'Due Soon' },
  { id: 'anomaly', label: 'Anomaly' },
  { id: 'recommendation', label: 'Recommendation' },
]

export default function AlertsCenter() {
  const equipment = useAppStore((s) => s.equipment)
  const today = useAppStore((s) => s.today)
  const dismissedAlertIds = useAppStore((s) => s.dismissedAlertIds)
  const dismissAlert = useAppStore((s) => s.dismissAlert)
  const sendReminder = useAppStore((s) => s.sendReminder)
  const acceptRecommendation = useAppStore((s) => s.acceptRecommendation)

  const [typeFilter, setTypeFilter] = useState('all')

  const alerts = useMemo(
    () => buildAlerts(equipment, today).filter((a) => !dismissedAlertIds.includes(a.id)),
    [equipment, today, dismissedAlertIds],
  )

  const filtered = useMemo(
    () =>
      [...alerts]
        .filter((a) => typeFilter === 'all' || a.type === typeFilter)
        .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]),
    [alerts, typeFilter],
  )

  const accept = (alert) => {
    acceptRecommendation(alert.equipmentId, alert.recommendation)
    dismissAlert(alert.id)
    dismissAlert(`underutilized-${alert.equipmentId}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
          Alerts Center
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Overdue returns, usage anomalies, and rightsizing suggestions — {alerts.length} open.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 self-start rounded-lg border p-0.5" style={{ borderColor: 'var(--border-strong)' }}>
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setTypeFilter(f.id)}
            className="rounded-md px-3 py-1.5 text-sm font-medium"
            style={{
              background: typeFilter === f.id ? 'var(--accent)' : 'transparent',
              color: typeFilter === f.id ? 'var(--accent-ink)' : 'var(--ink-secondary)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card bodyClassName="p-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
            <Icon name="checkCircle" size={28} className="opacity-60" />
            <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
              Nothing here — fleet is clear on this filter.
            </p>
          </div>
        ) : (
          <ul>
            {filtered.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 border-t px-5 py-3.5 first:border-t-0" style={{ borderColor: 'var(--border)' }}>
                <StatusChip severity={a.severity}>{SEVERITY_LABEL[a.severity]}</StatusChip>
                <span className="min-w-[240px] flex-1 text-sm" style={{ color: 'var(--ink-primary)' }}>{a.message}</span>

                <div className="ml-auto flex items-center gap-2">
                  {a.type === 'overdue' && (
                    <Button variant="secondary" onClick={() => sendReminder(a.equipmentId)}>
                      <Icon name="bell" size={13} /> Send reminder
                    </Button>
                  )}
                  {a.type === 'recommendation' && (
                    <Button variant="primary" onClick={() => accept(a)}>
                      <Icon name="swap" size={13} /> Accept swap
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => dismissAlert(a.id)}>
                    <Icon name="x" size={13} /> Dismiss
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
