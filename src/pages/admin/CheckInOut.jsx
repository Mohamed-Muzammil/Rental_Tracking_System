import { useMemo, useState } from 'react'
import { format, addDays } from 'date-fns'
import { useAppStore } from '../../store/appStore'
import { sites } from '../../data/sites'
import { clients } from '../../data/clients'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import StatusChip from '../../components/ui/StatusChip'
import WarehouseQrDispatch from '../../components/admin/WarehouseQrDispatch'

const TABS = [
  { id: 'batch', label: 'Warehouse Batch Dispatch (QR Verification)', icon: 'truck' },
  { id: 'out', label: 'Single Unit Check Out', icon: 'swap' },
  { id: 'in', label: 'Unit Check In', icon: 'checkCircle' },
]

const fieldStyle = {
  background: 'var(--bg-surface-raised)',
  borderColor: 'var(--border-strong)',
  color: 'var(--ink-primary)',
}

export default function CheckInOut() {
  const [tab, setTab] = useState('batch')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
          Yard Check-in / Check-out & QR Dispatch
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Manage batch orders, verify physical machinery QR codes on truck loading, and process single unit check-ins.
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
          </button>
        ))}
      </div>

      {tab === 'batch' ? (
        <WarehouseQrDispatch />
      ) : tab === 'out' ? (
        <CheckOutForm />
      ) : (
        <CheckInList />
      )}
    </div>
  )
}

function CheckOutForm() {
  const equipment = useAppStore((s) => s.equipment)
  const today = useAppStore((s) => s.today)
  const checkOutEquipment = useAppStore((s) => s.checkOutEquipment)

  const available = useMemo(() => equipment.filter((e) => e.status === 'completed'), [equipment])

  const [equipmentId, setEquipmentId] = useState('')
  const [siteId, setSiteId] = useState('')
  const [clientId, setClientId] = useState('')
  const [operatorId, setOperatorId] = useState('')
  const [expectedReturn, setExpectedReturn] = useState(format(addDays(today, 14), 'yyyy-MM-dd'))

  const canSubmit = equipmentId && siteId && clientId && expectedReturn

  const submit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    checkOutEquipment({ equipmentId, siteId, clientId, operatorId: operatorId.trim() || null, expectedReturn })
    setEquipmentId('')
    setSiteId('')
    setClientId('')
    setOperatorId('')
    setExpectedReturn(format(addDays(today, 14), 'yyyy-MM-dd'))
  }

  return (
    <Card title="Simulated scan — check out a single unit" className="max-w-xl">
      {available.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
          No available units in the yard right now.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Equipment (scan / select)">
            <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={fieldStyle} required>
              <option value="" disabled>Select a unit…</option>
              {available.map((e) => (
                <option key={e.id} value={e.id}>{e.id} — {e.tier} {e.type}</option>
              ))}
            </select>
          </Field>
          <Field label="Destination site">
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={fieldStyle} required>
              <option value="" disabled>Select a site…</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Renting client">
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={fieldStyle} required>
              <option value="" disabled>Select a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Operator ID (optional — leave blank to flag as unassigned)">
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
                <div className="font-medium" style={{ color: 'var(--ink-primary)' }}>{eq.id} <span style={{ color: 'var(--ink-muted)' }}>— {eq.tier} {eq.type}</span></div>
                <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
                  <span>Expected {eq.expectedReturn}</span>
                  {!eq.operatorId && <StatusChip severity="serious">No operator</StatusChip>}
                </div>
              </div>
              <Button variant="secondary" onClick={() => checkInEquipment(eq.id)}>
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
