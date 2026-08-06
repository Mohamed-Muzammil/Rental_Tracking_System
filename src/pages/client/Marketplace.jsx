import { useState, useMemo } from 'react'
import { catalog } from '../../data/catalog'
import { sites } from '../../data/sites'
import { useAppStore } from '../../store/appStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import StatusChip from '../../components/ui/StatusChip'
import Icon from '../../components/ui/Icon'
import RentalOrderModal from '../../components/client/RentalOrderModal'

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState('catalog')
  const [filter, setFilter] = useState('All')
  const [orderModalItem, setOrderModalItem] = useState(null)

  const activeClientId = useAppStore((s) => s.activeClientId)
  const clients = useAppStore((s) => s.clients)
  const requests = useAppStore((s) => s.requests)
  const cancelRentalRequest = useAppStore((s) => s.cancelRentalRequest)

  const clientById = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients])
  const siteByIdMap = useMemo(() => Object.fromEntries(sites.map(s => [s.id, s])), [])
  const client = clientById[activeClientId]

  const types = ['All', ...new Set(catalog.map((c) => c.type))]
  const filteredCatalog = filter === 'All' ? catalog : catalog.filter((c) => c.type === filter)

  // Filter requests for the current active client
  const clientRequests = useMemo(() => {
    return requests.filter((r) => r.clientId === activeClientId)
  }, [requests, activeClientId])

  const pendingRequestsCount = useMemo(() => {
    return clientRequests.filter((r) => r.status === 'pending').length
  }, [clientRequests])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight" style={{ color: 'var(--ink-primary)' }}>
            Equipment Requisitions & Dealer Requests
          </h1>
          <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
            Select machinery from dealer fleet, submit rental requisitions with project sites & dates, and track dealer approvals for {client?.name}.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-lg border p-1" style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border)' }}>
          <button
            onClick={() => setActiveTab('catalog')}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              background: activeTab === 'catalog' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'catalog' ? '#ffffff' : 'var(--ink-secondary)',
            }}
          >
            <Icon name="truck" size={13} /> Browse Machinery Catalog
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              background: activeTab === 'requests' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'requests' ? '#ffffff' : 'var(--ink-secondary)',
            }}
          >
            <Icon name="fileText" size={13} />
            My Order Requests
            {pendingRequestsCount > 0 && (
              <span
                className="ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold"
                style={{
                  background: activeTab === 'requests' ? '#ffffff' : 'var(--warning)',
                  color: activeTab === 'requests' ? 'var(--ink-primary)' : '#ffffff',
                }}
              >
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Category Filters */}
          <div className="flex gap-2 border-b pb-3 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className="whitespace-nowrap px-3.5 py-1.5 text-xs font-bold transition-all"
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background: filter === type ? 'var(--ink-primary)' : 'var(--bg-surface-raised)',
                  color: filter === type ? '#ffffff' : 'var(--ink-secondary)',
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCatalog.map((item) => (
              <Card key={item.id} bodyClassName="flex flex-col h-full p-5 transition-all duration-200">
                <div className="mb-3 flex items-start justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center font-bold border"
                    style={{ borderRadius: 'var(--radius-md)', background: 'var(--warning-wash)', color: 'var(--warning)', borderColor: 'var(--border)' }}
                  >
                    <Icon name="truck" size={22} />
                  </div>
                  <StatusChip severity="good">Available for Request</StatusChip>
                </div>

                <div className="mb-1 font-display text-base font-bold" style={{ color: 'var(--ink-primary)' }}>
                  {item.tier} {item.type}
                </div>
                <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Model Code: <span className="font-data font-semibold" style={{ color: 'var(--ink-secondary)' }}>{item.id}</span>
                </div>

                <div
                  className="my-4 grid grid-cols-2 gap-2 p-2.5 text-[11px] border"
                  style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-raised)', borderColor: 'var(--border)' }}
                >
                  <div>
                    <span className="block font-semibold uppercase text-[9px]" style={{ color: 'var(--ink-muted)' }}>Duty Rating</span>
                    <span className="font-bold" style={{ color: 'var(--ink-primary)' }}>{item.tier} Class</span>
                  </div>
                  <div>
                    <span className="block font-semibold uppercase text-[9px]" style={{ color: 'var(--ink-muted)' }}>Usage Capacity</span>
                    <span className="font-bold" style={{ color: 'var(--ink-primary)' }}>{item.minUsageHrs}-{item.maxUsageHrs} hrs/day</span>
                  </div>
                </div>

                <div className="mt-auto border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>Rental Rate</div>
                      <div className="font-data text-lg font-extrabold" style={{ color: 'var(--ink-primary)' }}>
                        ${item.dailyCost}<span className="text-xs font-normal" style={{ color: 'var(--ink-muted)' }}>/day</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setOrderModalItem(item)}
                      variant="primary"
                      className="font-bold px-3 py-2 text-xs"
                    >
                      <Icon name="plus" size={13} /> Request Machinery
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        /* My Requisitions Tab */
        <Card title="Submitted Equipment Order Requests & Dealer Status" bodyClassName="overflow-x-auto p-0">
          <table className="w-full min-w-[700px] text-xs">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-raised)' }}>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Request Ref</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Requested Machinery</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Destination Site</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Start & Duration</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Dealer Status</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clientRequests.map((req) => {
                const site = siteByIdMap[req.siteId]?.name || req.siteId

                return (
                  <tr key={req.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-5 py-3 font-mono font-bold" style={{ color: 'var(--ink-primary)' }}>
                      <div>{req.id}</div>
                      <div className="text-[10px] font-normal" style={{ color: 'var(--ink-muted)' }}>{req.createdAt}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-bold" style={{ color: 'var(--ink-primary)' }}>{req.requestedTier} {req.requestedType}</div>
                      <div className="text-[10px]" style={{ color: 'var(--ink-muted)' }}>Daily Rate: ${req.dailyRate}/day • Qty: {req.quantity}</div>
                      {req.notes && (
                        <div className="mt-0.5 text-[10px] italic" style={{ color: 'var(--ink-secondary)' }}>"{req.notes}"</div>
                      )}
                    </td>
                    <td className="px-3 py-3 font-medium" style={{ color: 'var(--ink-secondary)' }}>
                      <span className="inline-flex items-center gap-1">
                        <Icon name="mapPin" size={12} /> {site}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-data">
                      <div className="font-bold" style={{ color: 'var(--ink-primary)' }}>{req.requestedStart}</div>
                      <div className="text-[10px]" style={{ color: 'var(--ink-muted)' }}>{req.requestedDurationDays} Days</div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusChip
                        severity={
                          req.status === 'approved' ? 'good' : req.status === 'rejected' ? 'critical' : req.status === 'pending' ? 'warning' : 'neutral'
                        }
                      >
                        {req.status === 'pending' ? 'Pending Dealer Review' : req.status === 'approved' ? 'Approved & Dispatched' : req.status === 'rejected' ? 'Declined by Dealer' : req.status}
                      </StatusChip>
                      {req.equipmentId && (
                        <div className="mt-0.5 text-[10px] font-bold" style={{ color: 'var(--good)' }}>
                          Allocated Unit: {req.equipmentId}
                        </div>
                      )}
                      {req.dealerNotes && (
                        <div className="mt-0.5 text-[10px] italic" style={{ color: 'var(--ink-muted)' }}>
                          Dealer: {req.dealerNotes}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {req.status === 'pending' ? (
                        <Button
                          variant="secondary"
                          onClick={() => cancelRentalRequest(req.id)}
                          className="py-1 px-2.5 text-xs"
                        >
                          Cancel Request
                        </Button>
                      ) : (
                        <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>Processed</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {clientRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center" style={{ color: 'var(--ink-muted)' }}>
                    No equipment requests submitted yet. Browse the catalog above to request machinery.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Order Requisition Modal */}
      {orderModalItem && (
        <RentalOrderModal
          catalogItem={orderModalItem}
          onClose={() => setOrderModalItem(null)}
          onSuccess={() => {
            setOrderModalItem(null)
            setActiveTab('requests')
          }}
        />
      )}
    </div>
  )
}

