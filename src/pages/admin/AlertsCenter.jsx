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

  const [selectedIncidentForAction, setSelectedIncidentForAction] = useState(null)
  const [selectedActionType, setSelectedActionType] = useState('penalty')
  const [actionNotes, setActionNotes] = useState('')

  const handleOpenCorrectiveModal = (incident) => {
    setSelectedIncidentForAction(incident)
    setSelectedActionType('penalty')
    setActionNotes(
      incident.type === 'geofence_breach'
        ? 'Geofence perimeter violation outside contracted site. Implemented $1,500 compliance penalty.'
        : incident.type === 'unauthorized_operator'
        ? 'Unauthorized operator detected without certified RFID token.'
        : 'Excessive continuous idling telemetry logged.'
    )
  }

  const handleExecuteCorrectiveAction = () => {
    if (!selectedIncidentForAction) return
    resolveMisuseIncident({
      incidentId: selectedIncidentForAction.id,
      actionType: selectedActionType,
      notes: actionNotes,
    })
    setSelectedIncidentForAction(null)
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
          <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
            Telematics Anomaly & Misuse Command Console
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Real-time geofence breaches, unauthorized operators, ML anomaly scores & overdue rental returns.
          </p>
        </div>
      </div>

      {/* Admin Plain-English Decision Guide Card */}
      <div
        className="rounded-xl border p-4 shadow-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.04))',
          borderColor: 'rgba(239, 68, 68, 0.3)',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold"
            style={{ background: '#ef4444', color: '#ffffff' }}
          >
            🛡️
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
              ADMIN ACTION GUIDE — FLEET RISK & ANOMALY RESPONSE
            </h3>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              • <strong>Geofence Mismatch (Critical):</strong> Machines operating outside contracted site boundary (e.g. <em>EQX-2025 at Tambaram</em>). Click <strong>"Resolve & Fine Client"</strong> to issue an automated fine invoice.<br />
              • <strong>Unassigned Ignition (High):</strong> Machine started without operator RFID tag validation. Click <strong>"Issue Warning"</strong> to enforce authorized operator logs.<br />
              • <strong>Idle Fuel Waste (Medium):</strong> Machine sitting idle for extended periods wasting fuel. Suggest rightsizing to compact models.
            </p>
          </div>
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
          <span className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
            History: {resolvedIncidents.length} resolved cases archived
          </span>
        )}
      </div>

      {/* TAB 1: Telematics Misuse Incidents */}
      {activeTab === 'incidents' && (
        <Card title="Active Telematics & Anomaly Incidents" bodyClassName="p-0">
          {activeIncidents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
              <Icon name="checkCircle" size={32} style={{ color: 'var(--good)', opacity: 0.8 }} />
              <p className="text-sm font-medium" style={{ color: 'var(--ink-secondary)' }}>No active telematics misuse incidents detected.</p>
              <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>All machinery operating within assigned geofences and authorized limits.</p>
            </div>
          ) : (
            <div>
              {activeIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="flex flex-col gap-3 border-t p-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between transition-colors"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center font-bold"
                      style={{ borderRadius: 'var(--radius-sm)', background: 'var(--critical-wash)', color: 'var(--critical)' }}
                    >
                      <Icon name="alert" size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold" style={{ color: 'var(--ink-primary)' }}>{inc.id}</span>
                        <StatusChip severity={inc.severity}>{SEVERITY_LABEL[inc.severity]}</StatusChip>
                        <span
                          className="px-2 py-0.5 font-mono text-[11px] font-bold"
                          style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-raised)', color: 'var(--ink-secondary)' }}
                        >
                          ML Score: {inc.anomalyScore}%
                        </span>
                      </div>
                      <h4 className="font-bold text-sm mt-1" style={{ color: 'var(--ink-primary)' }}>{inc.title}</h4>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--ink-secondary)' }}>{inc.details}</p>
                      <div className="mt-1 text-[11px] font-medium" style={{ color: 'var(--ink-faint)' }}>Logged at: {inc.createdAt}</div>
                    </div>
                  </div>

                  {/* Incident Corrective Action Buttons */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button variant="secondary" onClick={() => handleFalseAlarm(inc.id)} className="text-xs px-2.5 py-1">
                      False Alarm
                    </Button>
                    <Button variant="danger" onClick={() => handleOpenCorrectiveModal(inc)} className="text-xs px-3 py-1">
                      Take Corrective Action
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Corrective Action Modal */}
      {selectedIncidentForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)' }}>
          <div
            className="w-full max-w-md border p-6 shadow-2xl animate-in fade-in zoom-in duration-200"
            style={{ borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="font-display text-base font-bold" style={{ color: 'var(--ink-primary)' }}>
                  Take Corrective Action — {selectedIncidentForAction.id}
                </h3>
                <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
                  Machine: <strong>{selectedIncidentForAction.equipmentId}</strong> • Type: {selectedIncidentForAction.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedIncidentForAction(null)}
                className="flex h-7 w-7 items-center justify-center rounded-md border text-xs"
                style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--ink-primary)' }}>
                  Select Resolution Action:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'penalty', label: '⚠️ Assess $1,500 Fine & Bill Client', desc: 'Applies penalty fee to client account and pushes fine notification' },
                    { id: 'warn_operator', label: '📢 Send Formal Warning & Dealer Ping', desc: 'Dispatches operational warning notice to client portal' },
                    { id: 'inspection', label: '🔍 Dispatch Field Technical Inspector', desc: 'Alerts client of on-site technical inspection team arrival' },
                    { id: 'recall', label: '🛑 Immediate Machine Recall & Return Request', desc: 'Demands immediate machine return to dealer yard' },
                  ].map((act) => (
                    <label
                      key={act.id}
                      onClick={() => setSelectedActionType(act.id)}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all"
                      style={{
                        background: selectedActionType === act.id ? 'var(--bg-surface-raised)' : 'transparent',
                        borderColor: selectedActionType === act.id ? 'var(--accent)' : 'var(--border)',
                      }}
                    >
                      <input
                        type="radio"
                        name="actionType"
                        checked={selectedActionType === act.id}
                        onChange={() => setSelectedActionType(act.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="text-xs font-bold" style={{ color: 'var(--ink-primary)' }}>{act.label}</div>
                        <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>{act.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--ink-primary)' }}>
                  Resolution Notes (sent to client & logged):
                </label>
                <textarea
                  rows={2}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full rounded-lg border p-2.5 text-xs outline-none"
                  style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-strong)', color: 'var(--ink-primary)' }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <Button variant="secondary" onClick={() => setSelectedIncidentForAction(null)} className="text-xs">
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleExecuteCorrectiveAction} className="text-xs">
                  <Icon name="checkCircle" size={13} /> Execute Corrective Action
                </Button>
              </div>
            </div>
          </div>
        </div>
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
