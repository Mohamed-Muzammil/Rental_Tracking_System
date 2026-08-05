import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { equipment } from '../data/equipment'
import { clients } from '../data/clients'
import { sites } from '../data/sites'
import { equipmentTypes } from '../data/demandHistory'
import Icon from '../components/ui/Icon'

const OPTIONS = [
  {
    role: 'admin',
    path: '/admin',
    icon: 'gauge',
    title: 'Rental Provider',
    subtitle: 'Dealer / Admin',
    description: 'Track the fleet in real time, resolve overdue and anomaly alerts, review demand forecasts, and manage check-in / check-out and warehouse dispatch.',
    points: ['Live fleet dashboard', 'Overdue & anomaly alerts', 'XGBoost demand forecasting'],
  },
  {
    role: 'client',
    path: '/client',
    icon: 'truck',
    title: 'Client Portal',
    subtitle: 'End customer',
    description: 'See your rented equipment, log usage, track upcoming returns, and act on cost-saving rightsizing recommendations.',
    points: ['My equipment & usage', 'Return scheduling', 'Rent from the marketplace'],
  },
]

const STATS = [
  { value: equipment.length, label: 'Fleet units tracked' },
  { value: equipmentTypes.length, label: 'Equipment categories' },
  { value: sites.length, label: 'Active job sites' },
  { value: clients.length, label: 'Client accounts' },
]

export default function RoleSelect() {
  const navigate = useNavigate()
  const setRole = useAppStore((s) => s.setRole)

  const choose = (opt) => {
    setRole(opt.role)
    navigate(opt.path)
  }

  return (
    <div className="flex min-h-full flex-col" style={{ background: 'var(--bg-page)' }}>
      {/* Site header */}
      <header
        className="flex items-center gap-2.5 border-b px-6"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', height: '52px' }}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded" style={{ background: 'var(--accent)' }}>
          <Icon name="truck" size={14} style={{ color: '#fff' }} />
        </div>
        <span className="text-[13px] font-bold tracking-tight" style={{ color: 'var(--ink-primary)' }}>
          FleetLoop
        </span>
      </header>

      {/* Hero */}
      <div className="flex flex-1 flex-col items-center px-6 py-16">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider" style={{ background: 'var(--accent-wash)', color: 'var(--accent)' }}>
          Smart Rental Tracking System
        </div>
        <h1
          className="font-display max-w-2xl text-center text-[34px] font-extrabold leading-tight tracking-tight sm:text-[40px]"
          style={{ color: 'var(--ink-primary)' }}
        >
          Know where every rented machine is —
          <br />and what to do about it.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-[15px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
          Live fleet visibility, usage telemetry, overdue alerts, and demand
          forecasting for construction and mining equipment rental — built to
          replace the spreadsheet.
        </p>

        {/* Live stat strip */}
        <div className="mt-10 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-0.5 rounded-xl border px-4 py-4 text-center"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
            >
              <span className="tabular font-data text-2xl font-bold" style={{ color: 'var(--ink-primary)' }}>
                {s.value}
              </span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--ink-muted)' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Role picker */}
        <div className="mt-12 w-full max-w-3xl">
          <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
            Continue as
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {OPTIONS.map((opt) => (
              <button
                key={opt.role}
                onClick={() => choose(opt)}
                className="group flex flex-col items-start gap-3 rounded-2xl border p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)', outlineColor: 'var(--accent)' }}
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: 'var(--accent-wash)', color: 'var(--accent)' }}
                >
                  <Icon name={opt.icon} size={22} />
                </span>
                <div>
                  <div className="font-display text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>
                    {opt.title}
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                    {opt.subtitle}
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                  {opt.description}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {opt.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                      <Icon name="checkCircle" size={13} style={{ color: 'var(--good)' }} />
                      {p}
                    </li>
                  ))}
                </ul>
                <span
                  className="mt-1 inline-flex items-center gap-1 text-sm font-semibold transition-transform group-hover:translate-x-0.5"
                  style={{ color: 'var(--accent)' }}
                >
                  Enter <Icon name="chevronRight" size={14} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <footer
        className="border-t px-6 py-4 text-center text-[11px]"
        style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
      >
        FleetLoop — prototype demo. Data is simulated; no equipment was harmed.
      </footer>
    </div>
  )
}
