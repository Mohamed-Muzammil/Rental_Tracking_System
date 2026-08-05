import { useState, useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { useAppStore } from '../../store/appStore'
import { sites } from '../../data/sites'
import { clients } from '../../data/clients'
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
  const [excavatorQty, setExcavatorQty] = useState(2)
  const [bulldozerQty, setBulldozerQty] = useState(1)
  const [craneQty, setCraneQty] = useState(0)
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

    // Helper to pick N available units of a type
    const pickUnits = (type, qty) => {
      if (qty <= 0) return
      const matches = availableEquipment.filter((e) => e.type === type && !allocated.some((a) => a.id === e.id))
      const picked = matches.slice(0, qty)
      allocated.push(...picked)
    }

    pickUnits('Excavator', Number(excavatorQty))
    pickUnits('Bulldozer', Number(bulldozerQty))
    pickUnits('Crane', Number(craneQty))

    if (allocated.length === 0) {
      openModal({
        title: 'Equipment Allocation Unavailable',
        message: 'No available equipment in the yard matching your requested categories. Please try adjusting requested quantities.',
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
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold">
            <Icon name="truck" size={20} />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900">
              Yard Barcode / QR Serialized Batch Dispatch & Verification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
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
              <label className="block font-bold uppercase tracking-wider text-slate-500 text-[10px]">Renting Client</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 font-medium text-xs outline-hidden"
                style={inputStyle}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 text-[10px]">Destination Site</label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 font-medium text-xs outline-hidden"
                style={inputStyle}
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.region})</option>
                ))}
              </select>
            </div>

            <div className="border-t pt-3 border-slate-200">
              <label className="block font-bold uppercase tracking-wider text-slate-500 text-[10px] mb-2">Requested Machinery Quantities</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-slate-700">Excavators</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={excavatorQty}
                    onChange={(e) => setExcavatorQty(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-2.5 py-1.5 font-bold outline-hidden"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-700">Bulldozers</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={bulldozerQty}
                    onChange={(e) => setBulldozerQty(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-2.5 py-1.5 font-bold outline-hidden"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-700">Cranes</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={craneQty}
                    onChange={(e) => setCraneQty(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-2.5 py-1.5 font-bold outline-hidden"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 text-[10px]">Expected Return Date</label>
              <input
                type="date"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 font-medium text-xs outline-hidden"
                style={inputStyle}
              />
            </div>

            <Button type="submit" variant="primary" className="mt-2 justify-center py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none">
              <Icon name="swap" size={15} /> Auto-Allocate & Create Order
            </Button>
          </form>
        </Card>

        {/* Right Column: Order Verification & QR Scanner Simulator */}
        <Card title="2. Warehouse QR Scanning & Verification Gate" className="xl:col-span-2">
          {!activeOrder ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <Icon name="truck" size={40} className="mb-2 text-slate-300" />
              <p className="text-sm font-semibold">No Active Dispatch Order</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Use the Batch Order Setup form on the left to allocate equipment and start the QR loading verification scanner.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Order Header & Progress Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-900 p-4 text-white">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Order Ref: {activeOrder.orderId}
                  </div>
                  <div className="text-sm font-extrabold text-white mt-0.5">
                    {totalScanned} / {totalAllocated} Equipment Verified
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full sm:w-48 bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(totalScanned / totalAllocated) * 100}%` }}
                  />
                </div>
              </div>

              {/* Mismatch Warning Box */}
              {mismatchAlert && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white font-bold">
                      ✕
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-rose-950">
                        DISPATCH MISMATCH WARNING: {mismatchAlert.scanned} is NOT allocated to Order {activeOrder.orderId}!
                      </h4>
                      <p className="text-xs text-rose-800 mt-1">
                        Expected Allocated Units: <strong className="font-mono text-slate-900">{mismatchAlert.expected}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive QR Scan Simulator Bar */}
              <div className="flex flex-wrap items-center gap-2 rounded-xl border p-3 bg-slate-50" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-bold text-slate-700">Scan Unit QR Code:</span>
                <input
                  type="text"
                  placeholder="e.g. EQX-1001 or EQX-1002"
                  value={manualScanInput}
                  onChange={(e) => setManualScanInput(e.target.value)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-mono font-bold uppercase outline-hidden"
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
                  className="text-xs bg-slate-900 text-white hover:bg-slate-800"
                >
                  Scan QR Code
                </Button>

                {/* Quick Simulation Buttons */}
                <div className="ml-auto flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] text-slate-400">Simulate Mismatch:</span>
                  <button
                    onClick={() => handleScanUnit('EQX-9999')}
                    className="rounded bg-rose-100 hover:bg-rose-200 text-rose-800 px-2 py-1 font-bold text-[11px]"
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
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                        isScanned
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-extrabold text-slate-900">{item.id}</span>
                        <StatusChip severity={isScanned ? 'good' : 'warning'}>
                          {isScanned ? '✓ Verified' : '⏳ Scan QR'}
                        </StatusChip>
                      </div>
                      <div className="text-xs text-slate-500">{item.tier} {item.type}</div>

                      {/* Simulated Barcode / QR Graphic */}
                      <div className="mt-3 flex items-center gap-3 border-t pt-2 border-slate-100">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-900 text-white font-mono text-[9px]">
                          QR
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Click card to simulate handheld QR scan
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Verification Gate Action Button */}
              <div className="mt-3 border-t pt-4 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs text-slate-500">
                  {isFullyVerified ? '✓ All allocated units verified' : 'Awaiting 100% QR scan verification'}
                </span>

                <Button
                  onClick={handleCompleteDispatch}
                  disabled={!isFullyVerified}
                  variant="primary"
                  className={`px-6 py-2.5 font-bold text-xs ${
                    isFullyVerified
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
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
