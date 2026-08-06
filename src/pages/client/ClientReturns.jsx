import { useState, useMemo } from 'react'
import { useAppStore } from '../../store/appStore'
import { siteById } from '../../data/sites'
import { catalogById } from '../../data/catalog'
import { returnStatus, healthOf } from '../../lib/rules'
import Card from '../../components/ui/Card'
import StatTile from '../../components/ui/StatTile'
import StatusChip from '../../components/ui/StatusChip'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import ExtendRentalModal from '../../components/client/ExtendRentalModal'

const RETURN_LABEL = {
  overdue: (d) => `${d}d OVERDUE`,
  'due-soon': (d) => `Due in ${d} days`,
  'on-track': (d) => `${d} days remaining`,
}

const RETURN_SEVERITY = { overdue: 'critical', 'due-soon': 'warning', 'on-track': 'good' }

export default function ClientReturns() {
  const equipment = useAppStore((s) => s.equipment)
  const today = useAppStore((s) => s.today)
  const activeClientId = useAppStore((s) => s.activeClientId)
  const selectedSiteId = useAppStore((s) => s.selectedSiteId)
  const requestReturn = useAppStore((s) => s.requestReturn)
  const clients = useAppStore((s) => s.clients)
  const clientById = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients])
  const client = clientById[activeClientId]

  const [selectedEqForExtend, setSelectedEqForExtend] = useState(null)
  const [returnQrModalEq, setReturnQrModalEq] = useState(null)

  const activeFleet = useMemo(() => {
    return equipment.filter((e) => {
      if (e.clientId !== activeClientId) return false
      if (e.status !== 'active') return false
      if (selectedSiteId !== 'ALL' && e.siteId !== selectedSiteId) return false
      return true
    })
  }, [equipment, activeClientId, selectedSiteId])

  const kpis = useMemo(() => {
    let overdueCount = 0
    let dueSoonCount = 0
    let onTrackCount = 0

    activeFleet.forEach((eq) => {
      const rs = returnStatus(eq, today)
      if (rs?.state === 'overdue') overdueCount++
      else if (rs?.state === 'due-soon') dueSoonCount++
      else onTrackCount++
    })

    return { overdueCount, dueSoonCount, onTrackCount, totalCount: activeFleet.length }
  }, [activeFleet, today])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight" style={{ color: 'var(--ink-primary)' }}>
          Active Machinery & Return Deadlines
        </h1>
        <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
          Monitor deployed fleet return deadlines, receive nearing-deadline alerts, request rental duration extensions, or dispatch returns for {client?.name}.
        </p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total Active Rentals" value={kpis.totalCount} />
        <StatTile label="Overdue Returns" value={kpis.overdueCount} severity={kpis.overdueCount > 0 ? 'critical' : 'neutral'} />
        <StatTile label="Due Within 5 Days" value={kpis.dueSoonCount} severity={kpis.dueSoonCount > 0 ? 'warning' : 'neutral'} />
        <StatTile label="On Track" value={kpis.onTrackCount} severity="good" />
      </div>

      {/* Rentals Table */}
      <Card title="Active Rental Deadlines & Return Schedule">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-xs">
            <thead>
              <tr className="border-b text-left text-[11px] font-bold uppercase tracking-wider" style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}>
                <th className="px-4 py-3">Equipment Unit</th>
                <th className="px-3 py-3">Deployed Site</th>
                <th className="px-3 py-3">Check-In Date</th>
                <th className="px-3 py-3">Expected Return</th>
                <th className="px-3 py-3">Return Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeFleet.map((eq) => {
                const rs = returnStatus(eq, today)
                const site = siteById[eq.siteId]?.name || 'Unassigned'

                return (
                  <tr key={eq.id} className="border-b transition-colors hover:opacity-90" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--ink-primary)' }}>
                        {eq.id}
                        {eq.finePending && (
                          <span className="rounded px-1 py-0.2 text-[9px] font-extrabold uppercase" style={{ background: 'var(--critical-wash)', color: 'var(--critical)', border: '1px solid var(--critical)' }}>
                            Fine Assessed
                          </span>
                        )}
                        {eq.returnRequested && (
                          <span className="rounded px-1 py-0.2 text-[9px] font-extrabold uppercase" style={{ background: 'var(--good-wash)', color: 'var(--good)', border: '1px solid var(--good)' }}>
                            Check-In Requested
                          </span>
                        )}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>{eq.tier} {eq.type}</div>
                    </td>
                    <td className="px-3 py-3 font-medium" style={{ color: 'var(--ink-secondary)' }}>
                      <span className="inline-flex items-center gap-1">
                        <Icon name="mapPin" size={13} /> {site}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-data" style={{ color: 'var(--ink-secondary)' }}>{eq.checkIn || '2026-07-15'}</td>
                    <td className="px-3 py-3 font-data font-bold" style={{ color: rs.state === 'overdue' ? 'var(--critical)' : 'var(--ink-primary)' }}>
                      {eq.expectedReturn}
                    </td>
                    <td className="px-3 py-3">
                      <StatusChip severity={RETURN_SEVERITY[rs.state]}>
                        {RETURN_LABEL[rs.state](rs.days)}
                      </StatusChip>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="secondary" onClick={() => setSelectedEqForExtend(eq)} className="text-xs">
                          <Icon name="clock" size={13} /> Extend
                        </Button>
                        <Button variant="primary" onClick={() => setReturnQrModalEq(eq)} className="text-xs">
                          <Icon name="swap" size={13} /> Schedule Return
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {activeFleet.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center" style={{ color: 'var(--ink-muted)' }}>
                    No active rentals to display.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Extension Modal */}
      {selectedEqForExtend && (
        <ExtendRentalModal equipment={selectedEqForExtend} onClose={() => setSelectedEqForExtend(null)} />
      )}

      {/* Return Dispatch QR Modal */}
      {returnQrModalEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(2px)' }}>
          <div
            className="w-full max-w-sm border p-6 text-center"
            style={{ borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lifted)' }}
          >
            <div className="mb-2 font-display text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>
              Return Dispatch QR Code
            </div>
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              Show this QR code to dealer logistics truck driver upon pickup of <strong style={{ color: 'var(--ink-primary)' }}>{returnQrModalEq.id}</strong>.
            </p>

            <div className="my-6 flex justify-center">
              <div
                className="flex h-44 w-44 items-center justify-center p-2"
                style={{ borderRadius: 'var(--radius-lg)', border: '4px solid var(--ink-primary)', background: '#ffffff', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)' }}
              >
                {/* Simulated QR Pattern */}
                <div className="grid grid-cols-5 gap-1.5 h-full w-full p-2" style={{ background: 'var(--ink-primary)', borderRadius: 'var(--radius-sm)' }}>
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} style={{ borderRadius: '1px', background: i % 2 === 0 || i % 3 === 0 ? '#ffffff' : 'var(--ink-primary)' }} />
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => {
                requestReturn(returnQrModalEq.id)
                setReturnQrModalEq(null)
              }}
              className="w-full justify-center py-2.5"
            >
              Confirm Logistics Return Dispatch
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
