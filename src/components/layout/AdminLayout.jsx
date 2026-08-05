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
    <div className="flex min-h-full" style={{ background: 'var(--bg-page)' }}>
      <aside
        className="flex w-56 shrink-0 flex-col gap-1 border-r px-3 py-4"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2 px-2 text-left"
        >
          <span className="font-display text-[15px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--accent)' }}>
            FleetLoop
          </span>
        </button>

        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? '' : 'hover:opacity-80'}`
            }
            style={({ isActive }) => ({
              background: isActive ? 'var(--accent-wash)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--ink-secondary)',
            })}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
            {item.to === '/admin/alerts' && openAlertCount > 0 && (
              <span
                className="tabular ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
                style={{ background: 'var(--critical)', color: '#fff' }}
              >
                {openAlertCount}
              </span>
            )}
          </NavLink>
        ))}

        <div className="mt-auto px-2 pt-3 text-[11px] uppercase tracking-[0.06em]" style={{ color: 'var(--ink-muted)' }}>
          Rental Provider view
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex items-center justify-between gap-4 border-b px-6 py-3"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="font-display text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-secondary)' }}>
            Rental Provider Command Center
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
      <ToastStack />
    </div>
  )
}
