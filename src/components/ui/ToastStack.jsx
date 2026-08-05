import { useAppStore } from '../../store/appStore'
import Icon from './Icon'

export default function ToastStack() {
  const toasts = useAppStore((s) => s.toasts)
  const dismissToast = useAppStore((s) => s.dismissToast)

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="flex items-start gap-2 rounded-lg border px-3.5 py-3 text-sm shadow-lg"
          style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border)', color: 'var(--ink-primary)' }}
        >
          <span style={{ color: 'var(--good)' }} className="mt-0.5">
            <Icon name="checkCircle" size={16} />
          </span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismissToast(t.id)} style={{ color: 'var(--ink-muted)' }} aria-label="Dismiss">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
