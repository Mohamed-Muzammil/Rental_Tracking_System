import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import Icon from '../components/ui/Icon'

const OPTIONS = [
  {
    role: 'admin',
    path: '/admin',
    icon: 'gauge',
    title: 'Rental Provider',
    subtitle: 'Dealer / Admin',
    description: 'Track the fleet, resolve overdue and anomaly alerts, review demand forecasts, and manage check-in / check-out.',
  },
  {
    role: 'client',
    path: '/client',
    icon: 'truck',
    title: 'Client Portal',
    subtitle: 'End customer',
    description: 'See your rented equipment, usage, upcoming returns, and cost-saving recommendations.',
  },
]

export default function RoleSelect() {
  const navigate = useNavigate()
  const setRole = useAppStore((s) => s.setRole)

  const choose = (opt) => {
    setRole(opt.role)
    navigate(opt.path)
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16" style={{ background: 'var(--bg-page)' }}>
      <div className="mb-10 text-center">
        <div className="font-display text-[13px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--accent)' }}>
          FleetLoop
        </div>
        <h1 className="font-display mt-2 text-[32px] font-semibold tracking-tight" style={{ color: 'var(--ink-primary)' }}>
          Smart Rental Tracking System
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Prototype demo — choose which side of the platform you want to view.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.role}
            onClick={() => choose(opt)}
            className="group flex flex-col items-start gap-3 rounded-2xl border p-6 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)', outlineColor: 'var(--accent)' }}
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: 'var(--accent-wash)', color: 'var(--accent)' }}
            >
              <Icon name={opt.icon} size={22} />
            </span>
            <div>
              <div className="font-display text-lg font-semibold" style={{ color: 'var(--ink-primary)' }}>
                {opt.title}
              </div>
              <div className="font-display text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-muted)' }}>
                {opt.subtitle}
              </div>
            </div>
            <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
              {opt.description}
            </p>
            <span
              className="mt-1 inline-flex items-center gap-1 text-sm font-medium transition-transform group-hover:translate-x-0.5"
              style={{ color: 'var(--accent)' }}
            >
              Enter <Icon name="chevronRight" size={14} />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
