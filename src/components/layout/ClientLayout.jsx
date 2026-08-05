import { Outlet, useNavigate } from 'react-router-dom'
import ToastStack from '../ui/ToastStack'

export default function ClientLayout() {
  const navigate = useNavigate()
  return (
    <div className="min-h-full" style={{ background: 'var(--bg-page)' }}>
      <header
        className="flex items-center justify-between border-b px-6 py-3"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <button onClick={() => navigate('/')} className="font-display text-[15px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--accent)' }}>
          FleetLoop
        </button>
        <span className="font-display text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-muted)' }}>
          Client Portal
        </span>
      </header>
      <main className="px-6 py-6">
        <Outlet />
      </main>
      <ToastStack />
    </div>
  )
}
