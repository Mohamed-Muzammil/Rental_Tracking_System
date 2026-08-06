import { useState, useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { useAppStore } from '../../store/appStore'
import { sites } from '../../data/sites'
import Button from '../ui/Button'
import Icon from '../ui/Icon'

const DURATION_PRESETS = [7, 14, 30, 60]

export default function RentalOrderModal({ catalogItem, onClose, onSuccess }) {
  const today = useAppStore((s) => s.today)
  const activeClientId = useAppStore((s) => s.activeClientId)
  const clients = useAppStore((s) => s.clients)
  const submitRentalRequest = useAppStore((s) => s.submitRentalRequest)

  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients])
  const client = clientById[activeClientId]
  const clientSites = sites.filter((s) => client?.sites?.includes(s.id))

  const [siteId, setSiteId] = useState(clientSites[0]?.id || 'S001')
  const [startDate, setStartDate] = useState(format(today, 'yyyy-MM-dd'))
  const [durationDays, setDurationDays] = useState(14)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const calculatedReturnDate = useMemo(() => {
    try {
      return format(addDays(new Date(startDate), Number(durationDays)), 'yyyy-MM-dd')
    } catch {
      return format(addDays(today, 14), 'yyyy-MM-dd')
    }
  }, [startDate, durationDays, today])

  const estimatedCost = useMemo(() => {
    return (catalogItem?.dailyCost || 0) * Number(durationDays) * Number(quantity)
  }, [catalogItem, durationDays, quantity])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await submitRentalRequest({
        clientId: activeClientId,
        catalogItem,
        siteId,
        requestedStart: startDate,
        requestedDurationDays: Number(durationDays),
        quantity: Number(quantity),
        notes: notes.trim(),
      })
      if (onSuccess) onSuccess()
      else onClose()
    } finally {
      setSubmitting(false)
    }
  }

  if (!catalogItem) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)' }}
    >
      <div
        className="w-full max-w-lg border overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
        style={{
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg border"
              style={{ background: 'var(--warning-wash)', color: 'var(--warning)', borderColor: 'var(--border)' }}
            >
              <Icon name="truck" size={18} />
            </div>
            <div>
              <h2 className="font-display text-base font-bold" style={{ color: 'var(--ink-primary)' }}>
                Request {catalogItem.tier} {catalogItem.type}
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                Requisition for {client?.name} • Model: {catalogItem.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md border text-sm transition-colors hover:opacity-80"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 text-xs">
          {/* Target Job Site */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--ink-muted)' }}>
              Target Job Site Deployment
            </label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-xs font-semibold outline-none"
              style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-strong)', color: 'var(--ink-primary)' }}
              required
            >
              {clientSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.region})
                </option>
              ))}
              {clientSites.length === 0 && (
                sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.region})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Start Date & Return Date Preview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--ink-muted)' }}>
                Requested Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-xs font-semibold outline-none"
                style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-strong)', color: 'var(--ink-primary)' }}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--ink-muted)' }}>
                Calculated Return Date
              </label>
              <div
                className="flex items-center rounded-lg border px-3 py-2 font-mono font-bold"
                style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border)', color: 'var(--ink-primary)' }}
              >
                {calculatedReturnDate}
              </div>
            </div>
          </div>

          {/* Rental Duration */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--ink-muted)' }}>
                Rental Duration: <span style={{ color: 'var(--ink-primary)' }}>{durationDays} Days</span>
              </label>
              <div className="flex gap-1.5">
                {DURATION_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDurationDays(p)}
                    className="rounded px-2 py-0.5 text-[10px] font-bold transition-colors"
                    style={{
                      background: durationDays === p ? 'var(--accent)' : 'var(--bg-surface-raised)',
                      color: durationDays === p ? '#ffffff' : 'var(--ink-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {p}d
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="90"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full cursor-pointer accent-[var(--accent)]"
            />
          </div>

          {/* Delivery Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--ink-muted)' }}>
              Job Site Notes & Special Attachments (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Deliver to Gate B before 8:00 AM, heavy bucket attachment required..."
              className="w-full rounded-lg border p-2.5 text-xs outline-none resize-none"
              style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-strong)', color: 'var(--ink-primary)' }}
            />
          </div>

          {/* Cost Estimation Summary */}
          <div
            className="flex items-center justify-between rounded-lg border p-3"
            style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border)' }}
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                Estimated Rental Cost
              </div>
              <div className="text-[11px]" style={{ color: 'var(--ink-secondary)' }}>
                ${catalogItem.dailyCost}/day × {durationDays} days
              </div>
            </div>
            <div className="font-data text-lg font-extrabold" style={{ color: 'var(--ink-primary)' }}>
              ${estimatedCost.toLocaleString()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-2 flex items-center justify-end gap-2.5 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting} className="font-bold px-4 py-2">
              <Icon name="checkCircle" size={14} />
              {submitting ? 'Submitting...' : 'Send Request to Dealer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
