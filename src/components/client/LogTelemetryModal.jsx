import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import Button from '../ui/Button'
import Icon from '../ui/Icon'

export default function LogTelemetryModal({ equipment, onClose }) {
  const logUsage = useAppStore((s) => s.logUsage)
  const [engineHours, setEngineHours] = useState(equipment.avgEngineHoursPerDay || 5)
  const [idleHours, setIdleHours] = useState(equipment.avgIdleHoursPerDay || 2)
  const [fuelUsageL, setFuelUsageL] = useState(45)
  const [operatorId, setOperatorId] = useState(equipment.operatorId || 'OP101')
  const [mode, setMode] = useState('manual') // 'manual' | 'qr'
  const [scanning, setScanning] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    logUsage({
      equipmentId: equipment.id,
      engineHours: Number(engineHours),
      idleHours: Number(idleHours),
      fuelUsageL: Number(fuelUsageL),
      operatorId: operatorId.trim() || null,
    })
    onClose()
  }

  const handleSimulateScan = () => {
    setScanning(true)
    setTimeout(() => {
      setEngineHours(6.5)
      setIdleHours(1.0)
      setFuelUsageL(52)
      setScanning(false)
      setMode('manual')
    }, 1200)
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
              Telemetry & Runtime Logger
            </h2>
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              Unit ID: <strong style={{ color: 'var(--ink-primary)' }}>{equipment.id}</strong> ({equipment.type})
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:opacity-70" style={{ color: 'var(--ink-muted)' }}>
            ✕
          </button>
        </div>

        <div className="my-4 flex rounded-lg p-1" style={{ background: 'var(--bg-page)' }}>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
              mode === 'manual' ? 'shadow-xs' : ''
            }`}
            style={{
              background: mode === 'manual' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'manual' ? 'var(--ink-primary)' : 'var(--ink-muted)',
            }}
          >
            Manual Telemetry Form
          </button>
          <button
            type="button"
            onClick={() => setMode('qr')}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
              mode === 'qr' ? 'shadow-xs' : ''
            }`}
            style={{
              background: mode === 'qr' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'qr' ? 'var(--ink-primary)' : 'var(--ink-muted)',
            }}
          >
            QR / RFID Simulator
          </button>
        </div>

        {mode === 'qr' ? (
          <div className="my-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: 'var(--border-strong)' }}>
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--accent-wash)', color: 'var(--accent)' }}>
              <Icon name="swap" size={32} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
              Scan Telemetry Tag on {equipment.id}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
              Simulates receiving IoT telemetry stream directly from machinery sensors.
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={handleSimulateScan}
              disabled={scanning}
              className="mt-4 px-6"
            >
              {scanning ? 'Reading Sensor Feed...' : 'Simulate QR Scan'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                Runtime Engine Hours (Daily)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="24"
                value={engineHours}
                onChange={(e) => setEngineHours(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-medium focus:outline-hidden"
                style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                Idle Hours (Daily Downtime)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="24"
                value={idleHours}
                onChange={(e) => setIdleHours(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-medium focus:outline-hidden"
                style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                  Fuel Usage (Liters)
                </label>
                <input
                  type="number"
                  min="0"
                  value={fuelUsageL}
                  onChange={(e) => setFuelUsageL(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-medium focus:outline-hidden"
                  style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                  Assigned Operator ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. OP101"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-medium focus:outline-hidden"
                  style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Telemetry Record
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
