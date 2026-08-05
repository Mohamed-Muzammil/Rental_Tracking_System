import { useAppStore } from '../../store/appStore'
import Icon from './Icon'
import Button from './Button'

export default function CustomModal() {
  const modalConfig = useAppStore((s) => s.modalConfig)
  const closeModal = useAppStore((s) => s.closeModal)

  if (!modalConfig) return null

  const {
    title = 'Action Required',
    message = 'Are you sure you want to proceed?',
    type = 'confirm', // 'confirm' | 'alert' | 'warning'
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
  } = modalConfig

  const handleConfirm = () => {
    if (onConfirm) onConfirm()
    closeModal()
  }

  const isAlert = type === 'alert'
  const isWarning = type === 'warning' || type === 'confirm'
  const iconWash = isAlert ? 'var(--critical-wash)' : isWarning ? 'var(--warning-wash)' : 'var(--accent-wash)'
  const iconInk = isAlert ? 'var(--critical)' : isWarning ? 'var(--warning)' : 'var(--accent)'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(2px)' }}
      onClick={closeModal}
    >
      <div
        className="w-full max-w-md border p-6 transition-all"
        style={{ borderRadius: 'var(--radius-lg)', borderColor: 'var(--border)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-lifted)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center font-bold"
            style={{ borderRadius: 'var(--radius-md)', background: iconWash, color: iconInk }}
          >
            <Icon name={isAlert ? 'x' : 'alertTriangle'} size={24} />
          </div>

          <div className="flex-1">
            <h3 className="font-display text-base font-bold leading-tight" style={{ color: 'var(--ink-primary)' }}>
              {title}
            </h3>
            <p className="mt-2 text-xs font-medium leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          {!isAlert && (
            <Button
              variant="secondary"
              onClick={closeModal}
              className="text-xs px-4 py-2"
            >
              {cancelText}
            </Button>
          )}

          <Button
            variant="primary"
            onClick={handleConfirm}
            className="text-xs px-5 py-2 font-bold"
            style={isAlert ? { background: 'var(--ink-primary)', borderColor: 'var(--ink-primary)' } : undefined}
          >
            {isAlert ? 'OK' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
