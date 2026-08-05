import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { catalogById } from '../../data/catalog'
import Button from '../ui/Button'
import Icon from '../ui/Icon'

export default function ExtendRentalModal({ equipment, onClose }) {
  const extendRental = useAppStore((s) => s.extendRental)
  const [days, setDays] = useState(7)

  const catalogItem = catalogById[equipment.catalogId]
  const dailyCost = catalogItem?.dailyCost || 350
  const totalCost = dailyCost * Number(days)

  const handleSubmit = (e) => {
    e.preventDefault()
    extendRental(equipment.id, Number(days))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>
              Extend Rental Period
            </h2>
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              Unit ID: <strong style={{ color: 'var(--ink-primary)' }}>{equipment.id}</strong> ({equipment.tier} {equipment.type})
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:opacity-70" style={{ color: 'var(--ink-muted)' }} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
              Current Expected Return
            </label>
            <div className="mt-1 font-data text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
              {equipment.expectedReturn || '2026-08-10'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
              Select Additional Days
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`rounded-xl border py-2.5 text-center text-xs font-bold transition-all ${
                    days === d ? 'ring-2' : ''
                  }`}
                  style={{
                    background: days === d ? 'var(--accent-wash)' : 'var(--bg-page)',
                    color: days === d ? 'var(--accent)' : 'var(--ink-primary)',
                    borderColor: days === d ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  +{d} Days
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-4" style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--ink-secondary)' }}>
              <span>Daily Rate</span>
              <span className="font-data font-bold">${dailyCost}/day</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-bold border-t pt-2" style={{ borderColor: 'var(--border)', color: 'var(--ink-primary)' }}>
              <span>Estimated Extension Cost</span>
              <span className="font-data text-lg" style={{ color: 'var(--accent)' }}>${totalCost.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              <Icon name="clock" size={14} /> Confirm Extension
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
