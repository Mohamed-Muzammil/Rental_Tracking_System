import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { siteById } from '../../data/sites'
import { catalogById } from '../../data/catalog'
import { geofenceCheck } from '../../lib/geo'
import { healthOf } from '../../lib/rules'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import StatusChip from '../../components/ui/StatusChip'
import UtilizationBar from '../../components/ui/UtilizationBar'
import UnitDetail from '../../components/dashboard/UnitDetail'
import { utilizationOf } from '../../lib/rules'

export default function CompanyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const equipment = useAppStore((s) => s.equipment)
  const payInvoice = useAppStore((s) => s.payInvoice)
  const today = useAppStore((s) => s.today)

  const [selectedId, setSelectedId] = useState(null)
  const [assetFilter, setAssetFilter] = useState('all') // 'all' or 'attention'

  const clients = useAppStore(s => s.clients)
  const clientById = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients])
  const client = clientById[id]

  const activeAssets = useMemo(() => {
    if (!client) return []
    let active = []
    let needsAttention = []
    
    for (const eq of equipment) {
      if (eq.clientId !== client.id || eq.status !== 'active') continue
      active.push(eq)
      
      const util = utilizationOf(eq)
      const breach = geofenceCheck(eq.currentLocation || eq.current_location, eq.siteId)?.breach
      
      if (eq.finePending || util < 0.1 || util < 0.3 || util > 0.85 || breach) {
        needsAttention.push(eq)
      }
    }
    
    return assetFilter === 'attention' ? needsAttention : active
  }, [equipment, client, assetFilter])

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="mb-2 font-display text-xl font-bold" style={{ color: 'var(--ink-primary)' }}>Company Not Found</h2>
        <Button className="mt-4" onClick={() => navigate('/admin/companies')}>Back to Companies</Button>
      </div>
    )
  }
  
  const totalDailyCost = activeAssets.reduce((sum, e) => sum + (catalogById[e.catalogId]?.dailyCost || 0), 0)

  return (
    <div className="mx-auto max-w-6xl flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/admin/companies')}
          className="flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ color: 'var(--ink-secondary)' }}
        >
          <Icon name="chevronRight" size={14} className="rotate-180" /> Back to Accounts
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight" style={{ color: 'var(--ink-primary)' }}>
            {client.name}
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--ink-secondary)' }}>
            Primary Contact: {client.contact}
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          
          <Card bodyClassName="p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
              Company Profile
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-primary)' }}>
              {client.description || 'No description provided.'}
            </p>
          </Card>

          <Card bodyClassName="p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
              Managed Sites ({client.sites?.length || 0})
            </h2>
            <div className="flex flex-col gap-4">
              {client.sites?.map(siteId => {
                const site = siteById[siteId]
                if (!site) return null
                return (
                  <div key={siteId} className="flex flex-col gap-1 rounded border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm" style={{ color: 'var(--ink-primary)' }}>{site.name}</div>
                      <div className="text-xs font-mono" style={{ color: 'var(--ink-muted)' }}>{siteId}</div>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--ink-secondary)' }}>{site.region}</div>
                    <div className="text-sm mt-2" style={{ color: 'var(--ink-primary)' }}>{site.description}</div>
                  </div>
                )
              })}
            </div>
          </Card>

        </div>

        {/* Right Column: Financials */}
        <div className="flex flex-col gap-6">
          <Card bodyClassName="p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
              Financial Overview
            </h2>
            
            <div className="mb-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--ink-secondary)' }}>Current Daily Run Rate</span>
                <span className="font-mono font-bold" style={{ color: 'var(--ink-primary)' }}>
                  ${totalDailyCost.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--ink-secondary)' }}>Outstanding Fines</span>
                <span className="font-mono font-bold" style={{ color: client.fineAmount > 0 ? 'var(--critical)' : 'var(--ink-primary)' }}>
                  ${client.fineAmount?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--ink-secondary)' }}>Overdue Balance</span>
                <span className="font-mono font-bold" style={{ color: client.overdueAmount > 0 ? 'var(--critical)' : 'var(--ink-primary)' }}>
                  ${client.overdueAmount?.toLocaleString() || 0}
                </span>
              </div>
              {client.paidFines > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--ink-secondary)' }}>Paid Fines</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--good)' }}>
                    ${client.paidFines.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider border-b pb-2" style={{ color: 'var(--ink-muted)', borderColor: 'var(--border)' }}>
              Billing History
            </h3>
            <div className="flex flex-col gap-3">
              {client.billingHistory?.map(inv => (
                <div key={inv.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold" style={{ color: 'var(--ink-primary)' }}>{inv.id}</div>
                    <div className="text-[10px]" style={{ color: 'var(--ink-secondary)' }}>{inv.date}</div>
                  </div>
                  <div className="text-right flex items-center justify-end gap-3">
                    <div>
                      <div className="text-xs font-mono font-bold" style={{ color: 'var(--ink-primary)' }}>${inv.amount.toLocaleString()}</div>
                      <div 
                        className="text-[10px] font-bold uppercase" 
                        style={{ color: inv.status === 'paid' ? 'var(--good)' : 'var(--critical)' }}
                      >
                        {inv.status}
                      </div>
                    </div>
                    {inv.status !== 'paid' && (
                      <button 
                        className="text-[10px] font-bold uppercase tracking-wider hover:opacity-80 transition-opacity" 
                        style={{ color: 'var(--accent)' }}
                        onClick={() => payInvoice(client.id, inv.id)}
                      >
                        Payment Received
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
            {activeAssets.length > 0 || assetFilter !== 'all' ? (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <Card 
                  className={selectedId ? "xl:col-span-2" : "xl:col-span-3"} 
                  bodyClassName="overflow-x-auto p-0"
                  title={`Currently Rented Assets (${activeAssets.length})`}
                  action={
                    <select 
                      value={assetFilter} 
                      onChange={(e) => setAssetFilter(e.target.value)}
                      className="rounded border px-2 py-1 text-xs outline-none bg-white font-medium"
                      style={{ borderColor: 'var(--border)', color: 'var(--ink-primary)' }}
                    >
                      <option value="all">All Active</option>
                      <option value="attention">Needs Attention</option>
                    </select>
                  }
                >
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="text-left" style={{ color: 'var(--ink-muted)' }}>
                        <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Unit</th>
                        <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Status</th>
                        <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Utilization</th>
                        <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]" />
                      </tr>
                    </thead>
                    <tbody>
                      {activeAssets.map((eq) => {
                        const util = utilizationOf(eq)
                        const hasAnomaly = Boolean(eq.locationAnomaly) || Boolean(eq.contractSiteId && eq.contractSiteId !== eq.siteId) || Boolean(eq.finePending)
                        let isDead = false
                        let showUtilAlert = false
                        if (util < 0.1) isDead = true
                        if (util < 0.3 || util > 0.85 || hasAnomaly) showUtilAlert = true

                        return (
                          <tr
                            key={eq.id}
                            onClick={() => setSelectedId(eq.id)}
                            className="cursor-pointer border-t transition-colors hover:opacity-90"
                            style={{ borderColor: 'var(--border)', background: selectedId === eq.id ? 'var(--accent-wash)' : 'transparent' }}
                          >
                            <td className="px-5 py-3" style={{ borderLeft: `3px solid var(--good)` }}>
                              <div className="font-medium" style={{ color: 'var(--ink-primary)' }}>{eq.id}</div>
                              <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>{eq.tier} {eq.type}</div>
                            </td>
                            <td className="px-3 py-3">
                              {eq.finePending ? (
                                <StatusChip severity="critical" icon="alertTriangle">Fine Pending</StatusChip>
                              ) : geofenceCheck(eq.currentLocation || eq.current_location, eq.siteId)?.breach ? (
                                <StatusChip severity="critical" icon="mapPin">Site Mismatch</StatusChip>
                              ) : (
                                <StatusChip
                                  severity={isDead ? 'critical' : 'good'}
                                  icon={isDead ? 'alertTriangle' : 'truck'}
                                >
                                  {isDead ? 'Lost Connection' : 'On Rent'}
                                </StatusChip>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <UtilizationBar engineHours={eq.avgEngineHoursPerDay} idleHours={eq.avgIdleHoursPerDay} />
                                {showUtilAlert && (
                                  <span className="inline-flex items-center gap-1">
                                    {hasAnomaly && <span className="text-xs">🚩</span>}
                                    <Icon name="alertTriangle" size={14} style={{ color: 'var(--critical)' }} />
                                  </span>
                                )}
                              </div>
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
                {selectedId && (
                  <div className="xl:col-span-1 sticky top-6 self-start max-h-[calc(100vh-8rem)] overflow-y-auto w-full">
                    <Card className="border-l-4" style={{ borderLeftColor: 'var(--accent)' }}>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-bold text-sm" style={{ color: 'var(--ink-primary)' }}>Asset Details</h3>
                        <button onClick={() => setSelectedId(null)} style={{ color: 'var(--ink-muted)' }}>
                          <Icon name="x" size={18} />
                        </button>
                      </div>
                      <UnitDetail eq={equipment.find((e) => e.id === selectedId)} today={today} />
                    </Card>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-sm" style={{ color: 'var(--ink-muted)' }}>No active rentals.</div>
            )}
        </div>
      </div>
    </div>
  )
}
