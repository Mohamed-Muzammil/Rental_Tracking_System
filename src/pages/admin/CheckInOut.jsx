import { useMemo, useState } from 'react'
import { format, addDays } from 'date-fns'
import { useAppStore } from '../../store/appStore'
import { sites } from '../../data/sites'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import StatusChip from '../../components/ui/StatusChip'
import WarehouseQrDispatch from '../../components/admin/WarehouseQrDispatch'
import ContractInvoice from './ContractInvoice'

const TABS = [
  { id: 'req', label: 'Client Requisitions & Order Approvals', icon: 'fileText' },
  { id: 'batch', label: 'Warehouse Batch Dispatch (QR Verification)', icon: 'truck' },
  { id: 'out', label: 'Single Unit Check Out & Contract Generation', icon: 'swap' },
  { id: 'in', label: 'Unit Check In', icon: 'checkCircle' },
]

const fieldStyle = {
  background: 'var(--bg-surface-raised)',
  borderColor: 'var(--border-strong)',
  color: 'var(--ink-primary)',
}

export default function CheckInOut() {
  const [tab, setTab] = useState('req')
  const requests = useAppStore((s) => s.requests)
  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'pending').length, [requests])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
          Yard Check-in / Check-out, Requisitions & QR Dispatch
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Approve incoming client machinery orders, generate official Rental Contracts & Tax Invoices, verify physical QR codes on truck loading, and process unit check-ins.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 self-start rounded-lg border p-0.5" style={{ borderColor: 'var(--border-strong)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              background: tab === t.id ? 'var(--accent)' : 'transparent',
              color: tab === t.id ? 'var(--accent-ink)' : 'var(--ink-secondary)',
            }}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
            {t.id === 'req' && pendingCount > 0 && (
              <span className="rounded-full px-1.5 py-0.2 text-[10px] font-extrabold" style={{ background: 'var(--critical)', color: '#fff' }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'req' ? (
        <ClientRequisitionsTab />
      ) : tab === 'batch' ? (
        <WarehouseQrDispatch />
      ) : tab === 'out' ? (
        <CheckOutForm />
      ) : (
        <CheckInList />
      )}
    </div>
  )
}

function ClientRequisitionsTab() {
  const requests = useAppStore((s) => s.requests)
  const clients = useAppStore((s) => s.clients)
  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients])
  const approveRentalRequest = useAppStore((s) => s.approveRentalRequest)
  const rejectRentalRequest = useAppStore((s) => s.rejectRentalRequest)
  const openModal = useAppStore((s) => s.openModal)

  const handleApprove = (req) => {
    openModal({
      title: `Approve Requisition ${req.id}`,
      message: `Allocate machinery and dispatch to ${clientById[req.clientId]?.name || req.clientId} at site ${req.siteId}?`,
      confirmText: 'Approve & Dispatch Unit',
      onConfirm: () => approveRentalRequest(req.id),
    })
  }

  const handleReject = (req) => {
    openModal({
      title: `Decline Requisition ${req.id}`,
      message: `Decline request for ${req.requestedTier} ${req.requestedType} from ${clientById[req.clientId]?.name || req.clientId}?`,
      confirmText: 'Decline Request',
      onConfirm: () => rejectRentalRequest(req.id, 'Yard fleet currently fully allocated'),
    })
  }

  return (
    <Card title={`Incoming Client Equipment Requisitions (${requests.length})`} bodyClassName="p-0">
      {requests.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm" style={{ color: 'var(--ink-secondary)' }}>
          No client requisitions submitted yet.
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {requests.map((r) => {
            const client = clientById[r.clientId]
            return (
              <div key={r.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors hover:opacity-95">
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--ink-primary)' }}>{r.id}</span>
                    <span className="font-bold text-sm" style={{ color: 'var(--accent)' }}>{client?.name || r.clientId}</span>
                    <StatusChip severity={r.status === 'approved' ? 'good' : r.status === 'rejected' ? 'critical' : 'warning'}>
                      {r.status.toUpperCase()}
                    </StatusChip>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                    {r.quantity}x {r.requestedTier} {r.requestedType} • Daily Rate: ${r.dailyRate}/day
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                    <span>Site: <strong>{r.siteId}</strong></span>
                    <span>Start: <strong>{r.requestedStart}</strong></span>
                    <span>Duration: <strong>{r.requestedDurationDays} Days</strong></span>
                    <span>Submitted: <strong>{r.createdAt}</strong></span>
                  </div>
                  {r.notes && (
                    <div className="text-xs italic rounded p-1.5 mt-1" style={{ background: 'var(--bg-surface-raised)', color: 'var(--ink-muted)' }}>
                      Client Notes: "{r.notes}"
                    </div>
                  )}
                  {r.equipmentId && (
                    <div className="text-xs font-bold text-good mt-0.5">
                      ✓ Allocated Unit: {r.equipmentId}
                    </div>
                  )}
                </div>

                {r.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="danger" onClick={() => handleReject(r)} className="text-xs">
                      Decline
                    </Button>
                    <Button variant="primary" onClick={() => handleApprove(r)} className="text-xs">
                      <Icon name="checkCircle" size={13} /> Approve & Dispatch
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

function CheckOutForm() {
  const equipment = useAppStore((s) => s.equipment)
  const today = useAppStore((s) => s.today)
  const checkOutEquipment = useAppStore((s) => s.checkOutEquipment)
  const clients = useAppStore((s) => s.clients)
  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients])

  const available = useMemo(() => equipment.filter((e) => e.status === 'completed'), [equipment])

  const [equipmentId, setEquipmentId] = useState('')
  const [siteId, setSiteId] = useState('')
  const [clientId, setClientId] = useState('')
  const [operatorId, setOperatorId] = useState('')
  const [expectedReturn, setExpectedReturn] = useState(format(addDays(today, 14), 'yyyy-MM-dd'))
  const [createdContract, setCreatedContract] = useState(null)

  const canSubmit = equipmentId && siteId && clientId && expectedReturn

  const submit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    const targetEq = equipment.find((e) => e.id === equipmentId)
    const targetClient = clientById[clientId]
    const targetSite = sites.find((s) => s.id === siteId)
    const orderId = `CNT-2026-${Math.floor(1000 + Math.random() * 9000)}`

    checkOutEquipment({ equipmentId, siteId, clientId, operatorId: operatorId.trim() || null, expectedReturn })

    setCreatedContract({
      orderId,
      client: targetClient,
      site: targetSite,
      units: targetEq ? [targetEq] : [],
      checkInDate: format(today, 'yyyy-MM-dd'),
      expectedReturn,
    })
  }

  return (
    <Card title="Single Unit Check Out & Contract Generation">
      {createdContract ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg p-4 font-medium" style={{ background: 'var(--good-wash)', color: 'var(--good)' }}>
            ✓ Check-out completed and equipment dispatched to client site!
          </div>
          <ContractInvoice
            inlineData={createdContract}
            onBack={() => setCreatedContract(null)}
          />
        </div>
      ) : (
        <form onSubmit={submit} className="flex max-w-lg flex-col gap-4">
          <Field label="Equipment unit">
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={fieldStyle}
              required
            >
              <option value="">Select available unit ({available.length} in yard)</option>
              {available.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} — {e.tier} {e.type}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Client site">
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={fieldStyle}
              required
            >
              <option value="">Select site</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
              ))}
            </select>
          </Field>
          <Field label="Client company">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={fieldStyle}
              required
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {clientById[clientId]?.fineAmount > 0 && (
              <div className="mt-2 text-[10px] font-bold px-2 py-1.5 rounded" style={{ background: 'var(--critical-wash)', color: 'var(--critical)' }}>
                <Icon name="alertTriangle" size={12} className="inline-block mr-1 -mt-0.5" />
                Warning: The organization has already been fined for not maintaining equipment. Please proceed at your own risk.
              </div>
            )}
          </Field>
          <Field label="Operator ID (optional)">
            <input
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              placeholder="e.g. OP205"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={fieldStyle}
            />
          </Field>
          <Field label="Expected return date">
            <input
              type="date"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={fieldStyle}
              required
            />
          </Field>
          <Button type="submit" variant="primary" disabled={!canSubmit} className="justify-center">
            <Icon name="checkCircle" size={14} /> Confirm check-out
          </Button>
        </form>
      )}
    </Card>
  )
}

function CheckInList() {
  const equipment = useAppStore((s) => s.equipment)
  const checkInEquipment = useAppStore((s) => s.checkInEquipment)
  const active = useMemo(() => equipment.filter((e) => e.status === 'active'), [equipment])

  return (
    <Card title="On rent — scan to check in" bodyClassName="p-0">
      {active.length === 0 ? (
        <p className="px-5 py-6 text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Nothing is currently checked out.
        </p>
      ) : (
        <ul>
          {active.map((eq) => (
            <li key={eq.id} className="flex items-center justify-between gap-3 border-t px-5 py-3 first:border-t-0" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="flex items-center gap-2 font-medium" style={{ color: 'var(--ink-primary)' }}>
                  <span>{eq.id}</span>
                  <span style={{ color: 'var(--ink-muted)' }}>— {eq.tier} {eq.type}</span>
                  {eq.returnRequested && (
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase animate-pulse" style={{ background: 'var(--good-wash)', color: 'var(--good)', border: '1px solid var(--good)' }}>
                      Client Return Requested
                    </span>
                  )}
                  {eq.finePending && (
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase" style={{ background: 'var(--critical-wash)', color: 'var(--critical)', border: '1px solid var(--critical)' }}>
                      Fine Pending
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
                  <span>Expected {eq.expectedReturn}</span>
                  {!eq.operatorId && <StatusChip severity="serious">No operator</StatusChip>}
                </div>
              </div>
              <Button variant={eq.returnRequested ? 'primary' : 'secondary'} onClick={() => checkInEquipment(eq.id)}>
                <Icon name="checkCircle" size={14} /> Check in
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>{label}</span>
      {children}
    </label>
  )
}
