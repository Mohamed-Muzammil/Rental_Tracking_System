import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useAppStore } from '../../store/appStore'
import { catalogById } from '../../data/catalog'
import { useMemo } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import StatusChip from '../../components/ui/StatusChip'

export default function FineInvoice() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const equipment = useAppStore((s) => s.equipment)
  const today = useAppStore((s) => s.today)
  const pushToast = useAppStore((s) => s.pushToast)
  const issueFine = useAppStore((s) => s.issueFine)
  const openModal = useAppStore((s) => s.openModal)

  const [isSent, setIsSent] = useState(false)

  const clients = useAppStore((s) => s.clients)
  const clientById = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c])), [clients])

  const eq = equipment.find((e) => e.id === id)

  if (!eq) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="mb-2 font-display text-xl font-bold" style={{ color: 'var(--ink-primary)' }}>Unit Not Found</h2>
        <p style={{ color: 'var(--ink-muted)' }}>The equipment ID {id} could not be found.</p>
        <Button className="mt-4" onClick={() => navigate('/admin/equipment')}>Back to Equipment</Button>
      </div>
    )
  }

  const client = clientById[eq.clientId]
  const catalogItem = catalogById[eq.catalogId]

  // Mocking replacement cost based on catalog daily cost (just for visual purposes)
  const replacementCost = catalogItem ? catalogItem.dailyCost * 120 : 25000
  const adminFee = 450
  const totalDue = replacementCost + adminFee

  const handleSendInvoice = () => {
    const doIssue = () => {
      setIsSent(true)
      pushToast(`Fine Tax Invoice for ${eq.id} sent to ${client?.name || 'Client'}`, 'good')
      // Flag the equipment as having a pending fine, without removing it from active fleet yet
      issueFine(eq.id, totalDue)
    }

    const hasRecentFine = client?.billingHistory?.some(inv => {
      const isThisEq = inv.id.startsWith(`FINE-${eq.id}`)
      const isToday = inv.date === format(today, 'yyyy-MM-dd')
      return isThisEq && isToday
    })

    if (hasRecentFine) {
      openModal({
        title: 'Repeated Fine Warning',
        message: `Fine of ₹${client?.fineAmount?.toLocaleString() || totalDue.toLocaleString()} has been implemented on ${client?.name || 'this organization'}. Do you want to issue fine again?`,
        type: 'confirm',
        confirmText: 'Issue Fine Again',
        onConfirm: doIssue,
      })
    } else {
      doIssue()
    }
  }

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-6 pb-12 print:gap-0 print:pb-0">
      {/* Header Actions */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(eq.clientId ? `/admin/companies/${eq.clientId}` : '/admin/equipment')}
          className="flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ color: 'var(--ink-secondary)' }}
        >
          <Icon name="chevronRight" size={14} className="rotate-180" /> Back to Company
        </button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <Icon name="bulb" size={14} /> Print / PDF
          </Button>
          {!isSent && (
            <Button variant="primary" onClick={handleSendInvoice}>
              <Icon name="checkCircle" size={14} /> Issue Invoice to Client
            </Button>
          )}
        </div>
      </div>

      <Card className="print:border-none print:shadow-none" bodyClassName="p-8 sm:p-12 print:p-0">
        {/* Invoice Header */}
        <div className="mb-12 flex flex-wrap items-start justify-between gap-8 border-b pb-8" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h1 className="font-display text-3xl font-black uppercase tracking-tight" style={{ color: 'var(--critical)' }}>
              Tax Invoice
            </h1>
            <h2 className="mt-1 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ink-secondary)' }}>
              Asset Loss / Non-Recovery
            </h2>
          </div>
          <div className="text-right text-sm" style={{ color: 'var(--ink-primary)' }}>
            <div className="font-bold">Summit Rental HQ</div>
            <div style={{ color: 'var(--ink-secondary)' }}>1200 Industrial Pkwy<br/>Metro City, MC 80210</div>
            <div className="mt-2 font-bold uppercase" style={{ color: 'var(--ink-muted)' }}>Invoice #{Math.floor(10000 + Math.random() * 90000)}</div>
            <div style={{ color: 'var(--ink-muted)' }}>Date: {format(today, 'MMM dd, yyyy')}</div>
          </div>
        </div>

        {/* Client & Equipment Details */}
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>Bill To</h3>
            <div className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
              <div className="font-bold text-base">{client?.name || 'Unknown Client'}</div>
              <div style={{ color: 'var(--ink-secondary)' }}>{client?.contact || '—'}</div>
              <div className="mt-1" style={{ color: 'var(--ink-secondary)' }}>Contract: {eq.id}-C{eq.clientId}</div>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>Asset Details</h3>
            <div className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
              <div className="font-bold text-base">{eq.id}</div>
              <div style={{ color: 'var(--ink-secondary)' }}>{eq.tier} {eq.type}</div>
              <div className="mt-1" style={{ color: 'var(--ink-secondary)' }}>Status: <StatusChip severity="critical">Lost Connection</StatusChip></div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-12 rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-left text-sm">
            <thead style={{ background: 'var(--bg-surface-raised)' }}>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="px-4 py-3 font-semibold" style={{ color: 'var(--ink-muted)' }}>Description</th>
                <th className="px-4 py-3 font-semibold text-right" style={{ color: 'var(--ink-muted)' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-4" style={{ color: 'var(--ink-primary)' }}>
                  <div className="font-bold">Asset Replacement Cost</div>
                  <div className="text-xs" style={{ color: 'var(--ink-secondary)' }}>Full replacement value for {eq.tier} {eq.type} ({eq.id}) due to loss of telemetry and failure to return.</div>
                </td>
                <td className="px-4 py-4 text-right font-mono font-bold" style={{ color: 'var(--ink-primary)' }}>
                  ${replacementCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-4" style={{ color: 'var(--ink-primary)' }}>
                  <div className="font-bold">Administrative Fee</div>
                  <div className="text-xs" style={{ color: 'var(--ink-secondary)' }}>Asset recovery and contract termination processing.</div>
                </td>
                <td className="px-4 py-4 text-right font-mono font-bold" style={{ color: 'var(--ink-primary)' }}>
                  ${adminFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
            <tfoot style={{ background: 'var(--bg-surface-raised)' }}>
              <tr className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-4 text-right font-bold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                  Total Due
                </td>
                <td className="px-4 py-4 text-right font-mono text-xl font-black" style={{ color: 'var(--critical)' }}>
                  ${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer Notes */}
        <div className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
          <p className="mb-2"><strong>Terms:</strong> Payment is due immediately upon receipt of this invoice. Failure to remit payment within 14 days will result in legal action and suspension of all active rental agreements.</p>
          <p>Please contact support@summitrentalhq.com if the unit is located.</p>
        </div>
      </Card>
      
      {isSent && (
        <div className="mt-4 rounded-lg border p-4 text-center font-bold" style={{ borderColor: 'var(--good)', background: 'var(--good-wash)', color: 'var(--good)' }}>
          <Icon name="checkCircle" size={18} className="inline-block mr-2" />
          Invoice has been officially issued to {client?.name}.
        </div>
      )}
    </div>
  )
}
