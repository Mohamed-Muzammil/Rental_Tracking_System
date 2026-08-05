import { useState, useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { useAppStore } from '../../store/appStore'
import { sites } from '../../data/sites'
import { clients } from '../../data/clients'
import { equipmentTypes } from '../../data/demandHistory'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import StatusChip from '../ui/StatusChip'

const inputStyle = {
  background: 'var(--bg-surface-raised)',
  borderColor: 'var(--border-strong)',
  color: 'var(--ink-primary)',
}

export default function WarehouseQrDispatch() {
  const equipment = useAppStore((s) => s.equipment)
  const today = useAppStore((s) => s.today)
  const batchCheckOutEquipment = useAppStore((s) => s.batchCheckOutEquipment)
  const openModal = useAppStore((s) => s.openModal)

  // Step 1: Order Setup
  const [clientId, setClientId] = useState('C001')
  const [siteId, setSiteId] = useState('S001')
  const [requestedQuantities, setRequestedQuantities] = useState({
    Excavator: 2,
    Bulldozer: 1,
    Crane: 0,
    Grader: 0,
    Forklift: 0,
    Loader: 0,
    Roller: 0,
  })
  const [expectedReturn, setExpectedReturn] = useState(format(addDays(today, 14), 'yyyy-MM-dd'))

  // Step 2: Allocated Order State
  const [activeOrder, setActiveOrder] = useState(null)
  const [scannedIds, setScannedIds] = useState(new Set())
  const [mismatchAlert, setMismatchAlert] = useState(null)
  const [manualScanInput, setManualScanInput] = useState('')

  // Filter available items
  const availableEquipment = useMemo(() => equipment.filter((e) => e.status === 'completed'), [equipment])

  // Handle Order Allocation Generation
  const handleGenerateOrder = (e) => {
    e.preventDefault()
    setMismatchAlert(null)

    const allocated = []

    equipmentTypes.forEach((type) => {
      const qty = Number(requestedQuantities[type] || 0)
      if (qty <= 0) return
      const matches = availableEquipment.filter((eq) => eq.type === type && !allocated.some((a) => a.id === eq.id))
      const picked = matches.slice(0, qty)
      allocated.push(...picked)
    })

    if (allocated.length === 0) {
      openModal({
        title: 'Equipment Allocation Unavailable',
        message: 'No available equipment in the yard matching your requested quantities. Please check available machinery counts.',
        type: 'alert',
      })
      return
    }

    setActiveOrder({
      orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId,
      siteId,
      expectedReturn,
      allocatedUnits: allocated,
    })
    setScannedIds(new Set())
  }

  // Handle Scan Action
  const handleScanUnit = (unitIdToScan) => {
    if (!activeOrder) return
    const targetId = unitIdToScan.trim().toUpperCase()
    setMismatchAlert(null)

    const isAllocated = activeOrder.allocatedUnits.some((u) => u.id === targetId)

    if (!isAllocated) {
      const expectedList = activeOrder.allocatedUnits.map((u) => u.id).join(', ')
      setMismatchAlert({
        scanned: targetId,
        expected: expectedList,
      })
      return
    }

    // Valid Scan
    setScannedIds((prev) => new Set([...prev, targetId]))
  }

  // Handle Complete Dispatch
  const handleCompleteDispatch = () => {
    if (!activeOrder) return
    const equipmentIds = activeOrder.allocatedUnits.map((u) => u.id)
    batchCheckOutEquipment({
      equipmentIds,
      siteId: activeOrder.siteId,
      clientId: activeOrder.clientId,
      expectedReturn: activeOrder.expectedReturn,
    })
    setActiveOrder(null)
    setScannedIds(new Set())
    setMismatchAlert(null)
  }

  const totalAllocated = activeOrder?.allocatedUnits.length || 0
  const totalScanned = scannedIds.size
  const isFullyVerified = totalAllocated > 0 && totalScanned === totalAllocated

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner Explanation */}
      <div
        className="border p-4"
        style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--border)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center"
            style={{ borderRadius: 'var(--radius-sm)', background: 'var(--accent-wash)', color: 'var(--accent)' }}
          >
            <Icon name="truck" size={20} />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
              Yard Barcode / QR Serialized Batch Dispatch & Verification
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
              Simulates real-world warehouse logistics. Physical machines have unique QR identities (`EQX-1001`, `EQX-1004`, etc.). As staff load trucks, each QR is scanned and verified against order allocation.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column: Order Creator Form */}
        <Card title="1. Customer Batch Order Setup" className="xl:col-span-1">
          <form onSubmit={handleGenerateOrder} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--ink-muted)' }}>Renting Client</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-sm)] border px-3 py-2 font-medium text-xs outline-hidden"
                style={inputStyle}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--ink-muted)' }}>Destination Site</label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-sm)] border px-3 py-2 font-medium text-xs outline-hidden"
                style={inputStyle}
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.region})</option>
                ))}
              </select>
            </div>

            <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <label className="block font-bold uppercase tracking-wider text-[10px] mb-2" style={{ color: 'var(--ink-muted)' }}>
                Requested Machinery Quantities (All 7 Fleet Categories)
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {equipmentTypes.map((type) => {
                  const availCount = availableEquipment.filter((e) => e.type === type).length
                  return (
                    <div key={type} className="border p-2" style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-raised)', borderColor: 'var(--border)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold" style={{ color: 'var(--ink-primary)' }}>{type}s</span>
                        <span className="text-[9px] font-semibold" style={{ color: 'var(--ink-faint)' }}>Yard: {availCount}</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={availCount || 10}
                        value={requestedQuantities[type] ?? 0}
                        onChange={(e) =>
                          setRequestedQuantities((prev) => ({
                            ...prev,
                            [type]: Math.max(0, parseInt(e.target.value) || 0),
                          }))
                        }
                        className="mt-1 w-full rounded-[var(--radius-sm)] border px-2 py-1 text-xs font-bold font-mono outline-hidden"
                        style={{ ...inputStyle, background: 'var(--bg-surface)' }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--ink-muted)' }}>Expected Return Date</label>
              <input
                type="date"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-sm)] border px-3 py-2 font-medium text-xs outline-hidden"
                style={inputStyle}
              />
            </div>

            <Button type="submit" variant="primary" className="mt-2 justify-center py-2.5 font-bold">
              <Icon name="swap" size={15} /> Auto-Allocate & Create Order
            </Button>
          </form>
        </Card>

        {/* Right Column: Order Verification & QR Scanner Simulator */}
        <Card title="2. Warehouse QR Scanning & Verification Gate" className="xl:col-span-2">
          {!activeOrder ? (
            <div className="flex flex-col items-center justify-center py-16 text-center" style={{ color: 'var(--ink-muted)' }}>
              <Icon name="truck" size={40} className="mb-2" style={{ color: 'var(--ink-faint)' }} />
              <p className="text-sm font-semibold">No Active Dispatch Order</p>
              <p className="text-xs mt-1 max-w-sm" style={{ color: 'var(--ink-muted)' }}>
                Use the Batch Order Setup form on the left to allocate equipment and start the QR loading verification scanner.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Order Header & Progress Bar */}
              <div
                className="flex flex-wrap items-center justify-between gap-4 p-4"
                style={{ borderRadius: 'var(--radius-md)', background: 'var(--ink-primary)', color: '#ffffff' }}
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Order Ref: {activeOrder.orderId}
                  </div>
                  <div className="text-sm font-extrabold mt-0.5">
                    {totalScanned} / {totalAllocated} Equipment Verified
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  className="w-full sm:w-48 h-3 overflow-hidden p-0.5"
                  style={{ borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${(totalScanned / totalAllocated) * 100}%`, background: 'var(--accent)' }}
                  />
                </div>
              </div>

              {/* Mismatch Warning Box */}
              {mismatchAlert && (
                <div
                  className="border p-4"
                  style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--critical)', background: 'var(--critical-wash)' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center font-bold"
                      style={{ borderRadius: 'var(--radius-sm)', background: 'var(--critical)', color: '#ffffff' }}
                    >
                      <Icon name="x" size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs" style={{ color: 'var(--critical)' }}>
                        DISPATCH MISMATCH WARNING: {mismatchAlert.scanned} is NOT allocated to Order {activeOrder.orderId}!
                      </h4>
                      <p className="text-xs mt-1" style={{ color: 'var(--ink-secondary)' }}>
                        Expected Allocated Units: <strong className="font-mono" style={{ color: 'var(--ink-primary)' }}>{mismatchAlert.expected}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive QR Scan Simulator Bar */}
              <div
                className="flex flex-wrap items-center gap-2 border p-3"
                style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-raised)', borderColor: 'var(--border)' }}
              >
                <span className="text-xs font-bold" style={{ color: 'var(--ink-secondary)' }}>Scan Unit QR Code:</span>
                <input
                  type="text"
                  placeholder="e.g. EQX-1001 or EQX-1002"
                  value={manualScanInput}
                  onChange={(e) => setManualScanInput(e.target.value)}
                  className="rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-mono font-bold uppercase outline-hidden"
                  style={inputStyle}
                />
                <Button
                  onClick={() => {
                    if (manualScanInput) {
                      handleScanUnit(manualScanInput)
                      setManualScanInput('')
                    }
                  }}
                  variant="primary"
                  className="text-xs"
                  style={{ background: 'var(--ink-primary)', borderColor: 'var(--ink-primary)' }}
                >
                  Scan QR Code
                </Button>

                {/* Quick Simulation Buttons */}
                <div className="ml-auto flex items-center gap-1.5 text-xs">
                  <span className="text-[11px]" style={{ color: 'var(--ink-faint)' }}>Simulate Mismatch:</span>
                  <button
                    onClick={() => handleScanUnit('EQX-9999')}
                    className="px-2 py-1 font-bold text-[11px] transition-opacity hover:opacity-80"
                    style={{ borderRadius: 'var(--radius-sm)', background: 'var(--critical-wash)', color: 'var(--critical)' }}
                  >
                    Scan EQX-9999 (Wrong Unit)
                  </button>
                </div>
              </div>

              {/* Allocated Equipment QR Cards Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeOrder.allocatedUnits.map((item) => {
                  const isScanned = scannedIds.has(item.id)

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleScanUnit(item.id)}
                      className="cursor-pointer border p-3.5 transition-all"
                      style={{
                        borderRadius: 'var(--radius-md)',
                        borderColor: isScanned ? 'var(--good)' : 'var(--border)',
                        background: isScanned ? 'var(--good-wash)' : 'var(--bg-surface)',
                        boxShadow: isScanned ? 'var(--shadow-card)' : 'none',
                      }}
                      onMouseEnter={(e) => { if (!isScanned) e.currentTarget.style.borderColor = 'var(--accent)' }}
                      onMouseLeave={(e) => { if (!isScanned) e.currentTarget.style.borderColor = 'var(--border)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-extrabold" style={{ color: 'var(--ink-primary)' }}>{item.id}</span>
                        <StatusChip severity={isScanned ? 'good' : 'warning'} icon={isScanned ? 'checkCircle' : 'clock'}>
                          {isScanned ? 'Verified' : 'Scan QR'}
                        </StatusChip>
                      </div>
                      <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>{item.tier} {item.type}</div>

                      {/* Simulated Barcode / QR Graphic */}
                      <div className="mt-3 flex items-center gap-3 border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center font-mono text-[9px]"
                          style={{ borderRadius: 'var(--radius-sm)', background: 'var(--ink-primary)', color: '#ffffff' }}
                        >
                          QR
                        </div>
                        <div className="text-[10px] font-mono" style={{ color: 'var(--ink-faint)' }}>
                          Click card to simulate handheld QR scan
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Verification Gate Action Button */}
              <div className="mt-3 border-t pt-4 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {isFullyVerified ? '✓ All allocated units verified' : 'Awaiting 100% QR scan verification'}
                </span>

                <Button
                  onClick={handleCompleteDispatch}
                  disabled={!isFullyVerified}
                  variant="primary"
                  className="px-6 py-2.5 font-bold text-xs"
                  style={isFullyVerified ? { background: 'var(--good)', borderColor: 'var(--good)', boxShadow: 'var(--shadow-card)' } : undefined}
                >
                  <Icon name="checkCircle" size={16} /> Complete Batch Dispatch & Release Truck
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
