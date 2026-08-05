import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { buildAlerts } from '../../lib/rules'
import Card from '../../components/ui/Card'
import StatusChip from '../../components/ui/StatusChip'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import StatTile from '../../components/ui/StatTile'

const SEVERITY_RANK = { critical: 0, high: 1, serious: 1, medium: 2, warning: 2, info: 3 }
const SEVERITY_LABEL = { critical: 'Critical', high: 'High Risk', serious: 'Serious', medium: 'Medium Risk', warning: 'Warning', info: 'Info' }

export default function AlertsCenter() {
  const equipment = useAppStore((s) => s.equipment)
  const usageLogs = useAppStore((s) => s.usageLogs)
  const today = useAppStore((s) => s.today)
  const dismissedAlertIds = useAppStore((s) => s.dismissedAlertIds)
  const dismissAlert = useAppStore((s) => s.dismissAlert)
  const sendReminder = useAppStore((s) => s.sendReminder)
  const acceptRecommendation = useAppStore((s) => s.acceptRecommendation)

  const misuseIncidents = useAppStore((s) => s.misuseIncidents)
  const resolveMisuseIncident = useAppStore((s) => s.resolveMisuseIncident)
  const openModal = useAppStore((s) => s.openModal)

  const [activeTab, setActiveTab] = useState('incidents') // 'incidents' | 'fleetAlerts'
  const [typeFilter, setTypeFilter] = useState('all')

  // Rule-based fleet alerts
  const alerts = useMemo(
    () => buildAlerts(equipment, today, usageLogs).filter((a) => !dismissedAlertIds.includes(a.id)),
    [equipment, today, usageLogs, dismissedAlertIds],
  )

  const activeIncidents = useMemo(
    () => misuseIncidents.filter((i) => i.status === 'active'),
    [misuseIncidents],
  )

  const resolvedIncidents = useMemo(
    () => misuseIncidents.filter((i) => i.status === 'resolved'),
    [misuseIncidents],
  )

  const handleCorrectiveActionModal = (incident) => {
    openModal({
      title: `Take Corrective Action — ${incident.id}`,
      message: `Review incident for ${incident.equipmentId}: "${incident.details}"`,
      confirmText: 'Apply Action',
      onConfirm: () => {
        // Default corrective action execution
        resolveMisuseIncident({
          incidentId: incident.id,
          actionType: 'penalty',
          notes: 'Penalty fee applied & customer notified via Admin Command Console',
        })
      },
    })
  }

  const handleFalseAlarm = (incidentId) => {
    resolveMisuseIncident({
      incidentId,
      actionType: 'false_alarm',
      notes: 'Verified as authorized operational exception by Fleet Manager',
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-slate-900" style={{ color: 'var(--ink-primary)' }}>
            Telematics Anomaly & Misuse Command Console
          </h1>
          <p className="text-sm text-slate-500" style={{ color: 'var(--ink-secondary)' }}>
            Real-time geofence breaches, unauthorized operators, ML anomaly scores & overdue rental returns.
          </p>
        </div>
      </div>

      {/* Industrial Hero KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Active Misuse Incidents"
          value={activeIncidents.length}
          unit="cases open"
          severity={activeIncidents.length > 0 ? 'critical' : 'good'}
        />
        <StatTile
          label="Geofence Breaches"
          value={activeIncidents.filter((i) => i.type === 'geofence_breach').length}
          unit="out-of-bounds"
          severity="critical"
        />
        <StatTile
          label="Unauthorized Scans"
          value={activeIncidents.filter((i) => i.type === 'unauthorized_operator').length}
          unit="unauthorized"
          severity="warning"
        />
        <StatTile
          label="Fleet Overdue Alerts"
          value={alerts.filter((a) => a.type === 'overdue').length}
          unit="overdue units"
          severity={alerts.filter((a) => a.type === 'overdue').length > 0 ? 'critical' : 'neutral'}
        />
      </div>

      {/* Primary Section Tabs */}
      <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('incidents')}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all"
            style={{
              background: activeTab === 'incidents' ? 'var(--accent)' : 'var(--bg-surface-raised)',
              color: activeTab === 'incidents' ? 'var(--accent-ink)' : 'var(--ink-secondary)',
            }}
          >
            <Icon name="alertTriangle" size={13} /> Telematics Misuse Incidents ({activeIncidents.length})
          </button>
          <button
            onClick={() => setActiveTab('fleetAlerts')}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all"
            style={{
              background: activeTab === 'fleetAlerts' ? 'var(--accent)' : 'var(--bg-surface-raised)',
              color: activeTab === 'fleetAlerts' ? 'var(--accent-ink)' : 'var(--ink-secondary)',
            }}
          >
            <Icon name="gauge" size={13} /> Rental &amp; Maintenance Alerts ({alerts.length})
          </button>
        </div>

        {activeTab === 'incidents' && (
          <span className="text-xs font-medium text-slate-500">
            History: {resolvedIncidents.length} resolved cases archived
          </span>
        )}
      </div>

      {/* TAB 1: Telematics Misuse Incidents */}
      {activeTab === 'incidents' && (
        <Card title="Active Telematics & Anomaly Incidents" bodyClassName="p-0">
          {activeIncidents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
              <Icon name="checkCircle" size={32} className="text-emerald-500 opacity-80" />
              <p className="text-sm font-medium text-slate-700">No active telematics misuse incidents detected.</p>
              <p className="text-xs text-slate-400">All machinery operating within assigned geofences and authorized limits.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeIncidents.map((inc) => (
                <div key={inc.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 font-bold">
                      <Icon name="alert" size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{inc.id}</span>
                        <StatusChip severity={inc.severity}>{SEVERITY_LABEL[inc.severity]}</StatusChip>
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-600">
                          ML Score: {inc.anomalyScore}%
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">{inc.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{inc.details}</p>
                      <div className="mt-1 text-[11px] text-slate-400 font-medium">Logged at: {inc.createdAt}</div>
                    </div>
                  </div>

                  {/* Incident Corrective Action Buttons */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button variant="secondary" onClick={() => handleFalseAlarm(inc.id)} className="text-xs px-2.5 py-1">
                      False Alarm
                    </Button>
                    <Button variant="primary" onClick={() => handleCorrectiveActionModal(inc)} className="text-xs px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white">
                      Take Corrective Action
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: Fleet Rental & Maintenance Alerts */}
      {activeTab === 'fleetAlerts' && (
        <Card title="Fleet Overdue & Rightsizing System Alerts" bodyClassName="p-0">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
              <Icon name="checkCircle" size={28} className="opacity-60" />
              <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
                Nothing here — fleet is clear on this filter.
              </p>
            </div>
          ) : (
            <ul>
              {alerts.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-3 border-t px-5 py-3.5 first:border-t-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <StatusChip severity={a.severity}>{SEVERITY_LABEL[a.severity]}</StatusChip>
                  <span className="min-w-[240px] flex-1 text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                    {a.message}
                  </span>

                  <div className="ml-auto flex items-center gap-2">
                    {a.type === 'overdue' && (
                      <Button variant="secondary" onClick={() => sendReminder(a.equipmentId)}>
                        <Icon name="bell" size={13} /> Send reminder
                      </Button>
                    )}
                    {a.type === 'recommendation' && (
                      <Button variant="primary" onClick={() => acceptRecommendation(a.equipmentId, a.recommendation)}>
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
      )}
    </div>
  )
}
