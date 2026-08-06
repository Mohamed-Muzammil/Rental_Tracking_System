import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useAppStore } from '../../store/appStore'
import { siteById } from '../../data/sites'
import { catalogById } from '../../data/catalog'
import { healthOf, utilizationOf } from '../../lib/rules'
import { distanceKm, geofenceCheck } from '../../lib/geo'
import StatusChip from '../ui/StatusChip'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import UsageHistoryChart from '../ui/UsageHistoryChart'
import RecommendationModal from './RecommendationModal'
import LostConnectionModal from './LostConnectionModal'

import LocationModal from './LocationModal'

export function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between border-t py-2 first:border-t-0" style={{ borderColor: 'var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{label}</span>
      <span className="tabular text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>{value}</span>
    </div>
  )
}

export default function UnitDetail({ eq, today }) {
  const navigate = useNavigate()
  const checkInEquipment = useAppStore((s) => s.checkInEquipment || s.checkIn)
  const usageLogs = useAppStore((s) => s.usageLogs)
  const openModal = useAppStore((s) => s.openModal)
  const clients = useAppStore((s) => s.clients)
  const clientById = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients])
  
  const [presetPeriod, setPresetPeriod] = useState('7days') // '7days' | 'all' | 'custom'
  const [viewMode, setViewMode] = useState('chart')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showRecModal, setShowRecModal] = useState(false)
  const [showLostConnModal, setShowLostConnModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)

  const catalog = catalogById[eq.catalogId]
  const util = eq.status === 'active' ? utilizationOf(eq) : null
  const health = eq.status === 'active' ? healthOf(eq, today) : 'neutral'
  const isMaintenance = eq.status === 'maintenance'

  const isDead = eq.status === 'active' && util < 0.1
  const showUtilAlert = eq.status === 'active' && !isDead && (util < 0.3 || util > 0.85)

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
    if (presetPeriod === '7days') {
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

  const misuseIncidents = useAppStore((s) => s.misuseIncidents)
  const activeIncident = misuseIncidents.find((i) => i.equipmentId === eq.id && i.status === 'active')
  const liveGeoResult = eq.status === 'active' ? geofenceCheck(eq.currentLocation || eq.current_location, eq.siteId) : null
  const liveGeoBreach = Boolean(liveGeoResult?.breach)
  const isAnomaly = Boolean(activeIncident) || Boolean(eq.locationAnomaly) || Boolean(eq.contractSiteId && eq.contractSiteId !== eq.siteId) || liveGeoBreach

  // For incident-based anomalies, use incident site data; for live GPS breach, use assigned site vs current location
  const contractSiteObj = activeIncident?.contractSiteId
    ? siteById[activeIncident.contractSiteId]
    : eq.contractSiteId
      ? siteById[eq.contractSiteId]
      : liveGeoBreach
        ? liveGeoResult.site  // assigned site is the contracted boundary
        : null
  const actualSiteObj = activeIncident?.actualSiteId
    ? siteById[activeIncident.actualSiteId]
    : eq.siteId && !liveGeoBreach
      ? siteById[eq.siteId]
      : null
  const computedOffset = liveGeoBreach
    ? Math.round(liveGeoResult.overshootKm * 10) / 10  // distance past boundary
    : contractSiteObj && actualSiteObj
      ? Math.round(distanceKm(contractSiteObj, actualSiteObj) * 10) / 10
      : null
  const displayOffset = activeIncident?.distanceOffsetKm ?? computedOffset ?? 4.5

  // For live GPS breach, show the actual GPS coordinates as location text
  const liveGpsLabel = liveGeoBreach && (eq.currentLocation || eq.current_location)
    ? `GPS (${(eq.currentLocation || eq.current_location).lat?.toFixed(4)}, ${(eq.currentLocation || eq.current_location).lng?.toFixed(4)})`
    : null

  return (
    <div className="flex flex-col">
      {showLocationModal && (
        <LocationModal eq={eq} onClose={() => setShowLocationModal(false)} />
      )}

      <div className="mb-3 flex items-center gap-2">
        {eq.finePending ? (
          <StatusChip severity="critical" icon="alertTriangle">Fine Pending</StatusChip>
        ) : (
          <StatusChip
            severity={eq.status === 'active' ? (isAnomaly ? 'critical' : isDead ? 'critical' : 'good') : isMaintenance ? 'warning' : 'neutral'}
            icon={eq.status === 'active' ? (isAnomaly ? 'alertTriangle' : isDead ? 'alertTriangle' : 'truck') : isMaintenance ? 'alertTriangle' : undefined}
          >
            {eq.status === 'active' ? (isAnomaly ? '🚩 Site Mismatch Anomaly' : isDead ? 'Lost Connection' : 'On Rent') : isMaintenance ? 'Maintenance' : 'Available'}
          </StatusChip>
        )}
        <span className="text-sm font-semibold" style={{ color: 'var(--ink-secondary)' }}>{eq.tier} {eq.type}</span>
        {isAnomaly && (
          <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase bg-red-500/20 text-red-500 border border-red-500/40">
            🚩 Flagged
          </span>
        )}
      </div>

      {/* Telematics Anomaly & Contract Mismatch Alert Banner */}
      {isAnomaly && (
        <div
          className="mb-3 rounded-lg border p-3 text-xs shadow-sm"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            borderColor: '#ef4444',
            color: 'var(--ink-primary)',
          }}
        >
          <div className="flex items-center gap-1.5 font-bold" style={{ color: '#ef4444' }}>
            <Icon name="alertTriangle" size={16} />
            <span>ANOMALY DETECTED: {activeIncident?.type?.replace(/_/g, ' ') || 'SITE MISMATCH GEOFENCE BREACH'}</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
            {activeIncident?.details || `Contract Site Mismatch: Unit ${eq.id} contracted for ${contractSiteObj?.name || 'Anna Nagar Metro Hub'} was detected operating at ${actualSiteObj?.name || 'Tambaram Railway Yard'} (${displayOffset} km outside contracted boundary).`}
          </p>
        </div>
      )}

      {/* View Location Action Button — Rendered directly above the $200+ Daily Rate */}
      <div className="mb-3">
        <button
          onClick={() => setShowLocationModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-bold shadow-sm transition-all hover:opacity-90 active:scale-[0.99]"
          style={{
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Icon name="mapPin" size={15} />
          <span>View Location</span>
        </button>
      </div>

      <Row label="Daily rate" value={`$${catalog.dailyCost}`} />
      {isMaintenance ? (
        <>
          <Row label="In workshop for" value={eq.maintenanceNote ?? 'Scheduled service'} />
          <Row label="Expected back" value={eq.expectedBackOn ?? '—'} />
        </>
      ) : (
        <>
          {isAnomaly ? (
            <>
              <Row
                label="Contracted Site"
                value={activeIncident?.contractSiteName || contractSiteObj?.name || siteById[eq.siteId]?.name || 'Assigned Site'}
              />
              <Row
                label="Current GPS Location"
                value={
                  <span className="font-bold text-red-500">
                    {activeIncident?.actualSiteName || actualSiteObj?.name || liveGpsLabel || 'Outside Boundary'} ({displayOffset} km Mismatch)
                  </span>
                }
              />
            </>
          ) : (
            <Row label="Site" value={siteById[eq.siteId]?.name} />
          )}
          <Row label="Client" value={clientById[eq.clientId]?.name} />
          <Row label="Operator" value={eq.operatorId} />
        </>
      )}
      {eq.status === 'active' && (
        <>
          <Row label="Checked in" value={eq.checkIn} />
          <Row label="Expected return" value={eq.expectedReturn} />
          <Row label="Utilization" value={
            <div className="flex items-center gap-1">
              <span>{Math.round(util * 100)}%</span>
              {showUtilAlert && <Icon name="alertTriangle" size={14} style={{ color: 'var(--critical)' }} />}
            </div>
          } />
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
        <div className="mt-4 flex flex-col gap-2">
          {isDead && (
            <Button 
              variant="primary" 
              className="justify-center"
              style={{ background: 'var(--critical)', color: 'var(--critical-ink)' }}
              onClick={() => setShowLostConnModal(true)}
            >
              <Icon name="alertTriangle" size={14} /> Resolve Lost Unit Connection
            </Button>
          )}
          {showUtilAlert && (
            <Button 
              variant="warning" 
              className="justify-center"
              onClick={() => setShowRecModal(true)}
            >
              <Icon name="bulb" size={14} /> Review Utilization Error
            </Button>
          )}
          <Button 
            variant="primary"
            className="justify-center" 
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
        </div>
      )}

      {showRecModal && (
        <RecommendationModal 
          eq={eq} 
          currentUtil={util} 
          onClose={() => setShowRecModal(false)} 
        />
      )}

      {showLostConnModal && (
        <LostConnectionModal 
          eq={eq} 
          onClose={() => setShowLostConnModal(false)} 
        />
      )}
    </div>
  )
}
