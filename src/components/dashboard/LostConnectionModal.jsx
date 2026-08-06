import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import Card from '../ui/Card'

export default function LostConnectionModal({ eq, onClose }) {
  const navigate = useNavigate()
  const pushToast = useAppStore((s) => s.pushToast)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleIssueFine = () => {
    onClose()
    navigate(`/admin/fine/${eq.id}`)
  }

  const handlePingRequest = () => {
    setIsProcessing(true)
    setTimeout(() => {
      pushToast(`Ping request sent to ${eq.id}. Waiting for response...`, 'good')
      setIsProcessing(false)
      onClose()
    }, 600)
  }

  const handleRequestCheckin = () => {
    setIsProcessing(true)
    setTimeout(() => {
      pushToast(`Requested physical check-in of ${eq.id} from client.`, 'warning')
      setIsProcessing(false)
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <Card bodyClassName="w-full max-w-sm p-6 relative flex flex-col gap-4">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-xs font-bold transition-opacity hover:opacity-70"
          style={{ color: 'var(--ink-muted)' }}
          disabled={isProcessing}
        >
          <Icon name="x" size={16} />
        </button>

        <div>
          <h2 className="font-display text-lg font-bold flex items-center gap-2" style={{ color: 'var(--critical)' }}>
            <Icon name="alertTriangle" size={20} /> Lost Connection
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-secondary)' }}>
            Unit <strong>{eq.id}</strong> ({eq.tier} {eq.type}) has stopped reporting telemetry. How would you like to resolve this?
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <Button 
            variant="primary" 
            onClick={handleIssueFine}
            disabled={isProcessing}
            style={{ background: 'var(--critical)', color: 'var(--critical-ink)', borderColor: 'var(--critical)' }}
            className="justify-center"
          >
            <Icon name="alertTriangle" size={14} /> Issue Fine to Client
          </Button>

          <Button 
            variant="secondary" 
            onClick={handlePingRequest}
            disabled={isProcessing}
            className="justify-center"
          >
            <Icon name="refresh" size={14} /> Ping Request (Attempt Reconnect)
          </Button>

          <Button 
            variant="secondary" 
            onClick={handleRequestCheckin}
            disabled={isProcessing}
            className="justify-center"
          >
            <Icon name="swap" size={14} /> Request Material Check-in
          </Button>
        </div>
      </Card>
    </div>
  )
}
