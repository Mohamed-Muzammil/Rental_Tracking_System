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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl transition-all"
        style={{ borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold ${
              isAlert
                ? 'bg-rose-100 text-rose-600'
                : isWarning
                ? 'bg-amber-100 text-amber-600'
                : 'bg-blue-100 text-blue-600'
            }`}
          >
            <Icon name={isAlert ? 'x' : 'alertTriangle'} size={24} />
          </div>

          <div className="flex-1">
            <h3 className="font-display text-base font-bold text-slate-900 leading-tight">
              {title}
            </h3>
            <p className="mt-2 text-xs font-medium text-slate-600 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4 border-slate-100">
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
            className={`text-xs px-5 py-2 font-bold ${
              isAlert
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isAlert ? 'OK' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
