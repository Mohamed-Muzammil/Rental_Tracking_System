import { useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { useAppStore } from '../../store/appStore'
import { siteById } from '../../data/sites'
import { catalogById } from '../../data/catalog'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import StatusChip from '../../components/ui/StatusChip'

export default function ContractInvoice({ inlineData, onBack }) {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const today = useAppStore((s) => s.today)
  const clients = useAppStore((s) => s.clients)
  const equipment = useAppStore((s) => s.equipment)
  const pushToast = useAppStore((s) => s.pushToast)
  const clientById = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients])

  const [isSent, setIsSent] = useState(false)

  // Retrieve contract data passed via location state, inline prop, or URL param
  const contractData = useMemo(() => {
    if (inlineData) return inlineData
    if (location.state?.contract) return location.state.contract

    // Fallback generated mock data for orderId
    const fallbackClient = clients[0]
    const fallbackSite = siteById['ANNA-NAGAR'] || siteById['S001']
    const fallbackUnits = equipment.slice(0, 2)
    return {
      orderId: orderId || `CNT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      client: fallbackClient,
      site: fallbackSite,
      units: fallbackUnits,
      checkInDate: format(today, 'yyyy-MM-dd'),
      expectedReturn: format(today, 'yyyy-MM-dd'),
    }
  }, [inlineData, location.state, orderId, clients, equipment, today])

  const client = contractData.client || clientById[contractData.clientId] || clients[0]
  const site = contractData.site || siteById[contractData.siteId] || siteById['ANNA-NAGAR']
  const units = contractData.units || contractData.allocatedUnits || []

  // Compute contract financial subtotals
  const daysCount = 14
  const lineItems = useMemo(() => {
    if (units.length === 0) {
      return [{
        desc: 'Standard Heavy Equipment Rental Lease',
        details: '14-day rental lease agreement including IoT telematics tracking.',
        rate: '$450/day',
        amount: 6300,
      }]
    }

    return units.map((u) => {
      const cat = catalogById[u.catalogId]
      const dailyRate = cat ? cat.dailyCost : 250
      const total = dailyRate * daysCount
      return {
        unitId: u.id,
        desc: `${u.id} — ${u.tier || ''} ${u.type} Lease (${daysCount} Days)`,
        details: `Contracted site location: ${site?.name || 'Anna Nagar Metro Hub'}. Telematics GPS tracking active.`,
        rate: `$${dailyRate}/day`,
        amount: total,
      }
    })
  }, [units, site, daysCount])

  const rentalSubtotal = useMemo(() => lineItems.reduce((sum, item) => sum + item.amount, 0), [lineItems])
  const telematicsFee = 350
  const securityDeposit = 1500
  const grandTotal = rentalSubtotal + telematicsFee + securityDeposit

  const handleIssueContract = () => {
    pushToast(
      `Equipment allocation complete — Rental Contract & Tax Invoice #${contractData.orderId} has been successfully issued and dispatched to ${client?.name || 'the client'}.`,
      'good'
    )
    setIsSent(true)
    setTimeout(() => {
      if (onBack) onBack()
      else navigate('/admin/checkin')
    }, 400)
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/admin/checkin')
    }
  }

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-6 pb-12 print:gap-0 print:pb-0">
      {/* Header Action Bar */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ color: 'var(--ink-secondary)' }}
        >
          <Icon name="chevronRight" size={14} className="rotate-180" /> Back to Check-in / Out
        </button>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => window.print()} className="gap-2">
            <Icon name="bulb" size={14} /> Print / PDF
          </Button>
          {!isSent ? (
            <Button
              variant="primary"
              onClick={handleIssueContract}
              className="gap-2 font-bold shadow-md"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            >
              <Icon name="checkCircle" size={14} /> Issue Contract to Client
            </Button>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold shadow-sm"
              style={{ background: 'rgba(34, 197, 94, 0.18)', border: '1px solid #22c55e', color: '#22c55e' }}
            >
              <Icon name="checkCircle" size={14} /> Contract Issued & Sent
            </span>
          )}
        </div>
      </div>

      {/* Main Invoice Document Card */}
      <Card className="print:border-none print:shadow-none" bodyClassName="p-8 sm:p-12 print:p-0">
        {/* Document Header */}
        <div className="mb-10 flex flex-wrap items-start justify-between gap-8 border-b pb-8" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h1 className="font-display text-3xl font-black uppercase tracking-tight" style={{ color: 'var(--ink-primary)' }}>
              TAX INVOICE
            </h1>
            <h2 className="mt-1 text-sm font-bold uppercase tracking-wider text-blue-600">
              EQUIPMENT RENTAL & LEASE AGREEMENT
            </h2>
          </div>
          <div className="text-right text-sm" style={{ color: 'var(--ink-primary)' }}>
            <div className="font-bold text-base">Summit Rental HQ</div>
            <div style={{ color: 'var(--ink-secondary)' }}>1200 Industrial Pkwy<br />Metro City, MC 80210</div>
            <div className="mt-3 font-bold uppercase tracking-wide text-blue-600">
              INVOICE #{contractData.orderId || 'CNT-2026-8041'}
            </div>
            <div style={{ color: 'var(--ink-muted)' }}>Date: {format(today, 'MMM dd, yyyy')}</div>
          </div>
        </div>

        {/* Client & Asset Details Grid */}
        <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Bill To */}
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-raised)' }}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>BILL TO</h3>
            <div className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
              <div className="font-bold text-base">{client?.name || 'Vertex Builders Ltd'}</div>
              <div style={{ color: 'var(--ink-secondary)' }}>Primary Contact: {client?.contact || 'Priya Nair'}</div>
              <div className="mt-2 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                <strong>Contracted Site:</strong> {site?.name || 'Anna Nagar Metro Hub'} ({site?.region || 'Chennai North'})
              </div>
              <div className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
                <strong>Agreement Reference:</strong> {contractData.orderId || 'CNT-2026-8041'}
              </div>
            </div>
          </div>

          {/* Asset & Telematics Status */}
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-raised)' }}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>ASSET & TELEMATICS DETAILS</h3>
            <div className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
              <div className="font-bold text-base">
                {units.length > 0 ? units.map((u) => u.id).join(', ') : 'EQX-2025, EQX-2003'}
              </div>
              <div style={{ color: 'var(--ink-secondary)' }}>
                {units.length > 0 ? `${units.length} Machinery Unit(s) Allocated` : 'Bulldozer & Crane Heavy Fleet'}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--ink-secondary)' }}>Status:</span>
                <StatusChip severity="good" icon="checkCircle">Verified Yard Check-out</StatusChip>
              </div>
              <div className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
                IoT Telemetry: Active (15-min Geofence Pings)
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Financial Table */}
        <div className="mb-10 overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-left text-sm">
            <thead style={{ background: 'var(--bg-surface-raised)' }}>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs" style={{ color: 'var(--ink-muted)' }}>Description</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs text-center" style={{ color: 'var(--ink-muted)' }}>Rate / Period</th>
                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs text-right" style={{ color: 'var(--ink-muted)' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr key={idx} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-5 py-4" style={{ color: 'var(--ink-primary)' }}>
                    <div className="font-bold">{item.desc}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--ink-secondary)' }}>{item.details}</div>
                  </td>
                  <td className="px-5 py-4 text-center tabular font-mono font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    {item.rate}
                  </td>
                  <td className="px-5 py-4 text-right tabular font-mono font-bold" style={{ color: 'var(--ink-primary)' }}>
                    ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <td className="px-5 py-3.5" style={{ color: 'var(--ink-primary)' }}>
                  <div className="font-bold">IoT Telematics & GPS Geofence Monitoring Fee</div>
                  <div className="text-xs" style={{ color: 'var(--ink-secondary)' }}>Live boundary breach detection, RFID operator validation, and anti-tamper alert service.</div>
                </td>
                <td className="px-5 py-3.5 text-center tabular font-mono font-medium" style={{ color: 'var(--ink-secondary)' }}>Flat Fee</td>
                <td className="px-5 py-3.5 text-right tabular font-mono font-bold" style={{ color: 'var(--ink-primary)' }}>
                  ${telematicsFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <td className="px-5 py-3.5" style={{ color: 'var(--ink-primary)' }}>
                  <div className="font-bold">Refundable Equipment Security Deposit</div>
                  <div className="text-xs" style={{ color: 'var(--ink-secondary)' }}>Fully refundable upon clean check-in without unauthorized site movement or damage.</div>
                </td>
                <td className="px-5 py-3.5 text-center tabular font-mono font-medium" style={{ color: 'var(--ink-secondary)' }}>Deposit</td>
                <td className="px-5 py-3.5 text-right tabular font-mono font-bold" style={{ color: 'var(--ink-primary)' }}>
                  ${securityDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total Row */}
          <div className="flex items-center justify-between p-5" style={{ background: 'var(--bg-surface-raised)' }}>
            <div className="font-bold text-base uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
              TOTAL DUE / CONTRACT VALUE
            </div>
            <div className="font-mono text-2xl font-black" style={{ color: '#2563eb' }}>
              ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Contract Terms & Geofence Compliance */}
        <div className="rounded-lg border p-4 text-xs leading-relaxed" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-raised)', color: 'var(--ink-secondary)' }}>
          <div className="font-bold mb-1 uppercase tracking-wider text-blue-600">
            Terms & Geofence Compliance Notice:
          </div>
          <p>
            Payment is due upon receipt of this contract invoice. Equipment must operate strictly within designated site boundaries (<strong>{site?.name || 'Anna Nagar Metro Hub'}</strong>). Any operation outside contracted GPS boundaries will automatically trigger an <strong>Anomaly Flag</strong>, issue instant location mismatch fines, and initiate engine immobilizer protocols.
          </p>
          <p className="mt-1" style={{ color: 'var(--ink-muted)' }}>
            Please contact support@summitrentalhq.com for billing or contract adjustments.
          </p>
        </div>
      </Card>
    </div>
  )
}
