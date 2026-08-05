import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useMemo } from 'react'
import { useAppStore } from '../../store/appStore'
import { buildAlerts } from '../../lib/rules'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import ToastStack from '../ui/ToastStack'

const NAV = [
  { to: '/admin', end: true, icon: 'gauge', label: 'Dashboard' },
  { to: '/admin/companies', icon: 'building', label: 'Companies' },
  { to: '/admin/equipment', icon: 'truck', label: 'Equipment' },
  { to: '/admin/checkin', icon: 'swap', label: 'Check-in / Out' },
  { to: '/admin/usage', icon: 'clock', label: 'Usage Logging' },
  { to: '/admin/alerts', icon: 'bell', label: 'Alerts' },
  { to: '/admin/forecasting', icon: 'chevronRight', label: 'Forecasting' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const today = useAppStore((s) => s.today)
  const equipment = useAppStore((s) => s.equipment)
  const dismissedAlertIds = useAppStore((s) => s.dismissedAlertIds)
  const advanceDay = useAppStore((s) => s.advanceDay)

  const openAlertCount = useMemo(() => {
    const alerts = buildAlerts(equipment, today).filter((a) => !dismissedAlertIds.includes(a.id))
    return alerts.length
  }, [equipment, today, dismissedAlertIds])

  return (
    <div className="flex min-h-full flex-col" style={{ background: 'var(--bg-page)' }}>
      <header
        className="flex items-center gap-4 border-b px-5 py-2.5"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="mr-2 shrink-0"
        >
          <span className="font-display text-[15px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--accent)' }}>
            FleetLoop
          </span>
        </button>

        <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${isActive ? '' : 'hover:opacity-80'}`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--accent-wash)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--ink-secondary)',
              })}
            >
              <Icon name={item.icon} size={15} />
              {item.label}
              {item.to === '/admin/alerts' && openAlertCount > 0 && (
                <span
                  className="tabular ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                  style={{ background: 'var(--critical)', color: '#fff' }}
                >
                  {openAlertCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <div className="font-display text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-muted)' }}>
              Simulated date
            </div>
            <div className="tabular font-data text-[13px] font-medium" style={{ color: 'var(--ink-primary)' }}>
              {format(today, 'EEE, d MMM yyyy')}
            </div>
          </div>
          <Button variant="secondary" onClick={advanceDay}>
            <Icon name="clock" size={14} /> Advance day
          </Button>
        </div>
      </header>

      <main className="min-w-0 flex-1 overflow-y-auto px-6 py-6">
        <Outlet />
      </main>
      <ToastStack />
    </div>
  )
}

