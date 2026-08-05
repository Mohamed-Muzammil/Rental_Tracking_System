import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { format } from 'date-fns'
import { useAppStore } from '../../store/appStore'
import { buildAlerts } from '../../lib/rules'
import Icon from '../ui/Icon'
import ToastStack from '../ui/ToastStack'
import CustomModal from '../ui/CustomModal'

const NAV = [
  { to: '/admin', end: true, icon: 'gauge', label: 'Dashboard' },
  { to: '/admin/companies', icon: 'building', label: 'Companies' },
  { to: '/admin/equipment', icon: 'truck', label: 'Equipment' },
  { to: '/admin/checkin', icon: 'swap', label: 'Check-in / Out' },
  { to: '/admin/usage', icon: 'clock', label: 'Usage Logs' },
  { to: '/admin/forecasting', icon: 'trendingUp', label: 'Forecasting' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const today = useAppStore((s) => s.today)
  const equipment = useAppStore((s) => s.equipment)
  const usageLogs = useAppStore((s) => s.usageLogs)
  const dismissedAlertIds = useAppStore((s) => s.dismissedAlertIds)

  const openAlertCount = useMemo(() => {
    const alerts = buildAlerts(equipment, today, usageLogs).filter((a) => !dismissedAlertIds.includes(a.id))
    return alerts.length
  }, [equipment, today, usageLogs, dismissedAlertIds])

  const todayLabel = format(today, 'EEE, d MMM yyyy')

  return (
    <div className="flex min-h-full flex-col" style={{ background: 'var(--bg-page)' }}>
      {/* Top Application Bar */}
      <header
        className="flex items-center gap-0 border-b"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', height: '52px' }}
      >
        {/* Brand / Logo */}
        <div
          className="flex h-full items-center gap-2.5 border-r px-5 shrink-0"
          style={{ borderColor: 'var(--border)', minWidth: '200px' }}
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded"
            style={{ background: 'var(--accent)' }}
          >
            <Icon name="truck" size={14} className="text-white" style={{ color: '#fff' }} />
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-left"
          >
            <span
              className="block text-[13px] font-bold tracking-tight leading-none"
              style={{ color: 'var(--ink-primary)' }}
            >
              FleetLoop
            </span>
            <span className="block text-[10px] font-normal leading-none mt-0.5" style={{ color: 'var(--ink-muted)' }}>
              Asset Management
            </span>
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex h-full min-w-0 flex-1 items-stretch overflow-x-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex shrink-0 items-center gap-1.5 border-b-2 px-4 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`
              }
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: date + alerts */}
        <div className="flex h-full items-center gap-1 border-l px-3 shrink-0" style={{ borderColor: 'var(--border)' }}>
          <span className="mr-3 text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
            {todayLabel}
          </span>
          <NavLink
            to="/admin/alerts"
            className={({ isActive }) =>
              `relative flex h-8 w-8 items-center justify-center rounded transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`
            }
            title="Alerts & Incidents"
          >
            <Icon name="bell" size={16} />
            {openAlertCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none"
                style={{ background: 'var(--critical)', color: '#fff' }}
              >
                {openAlertCount}
              </span>
            )}
          </NavLink>
        </div>
      </header>

      {/* Page Content */}
      <main className="min-w-0 flex-1 overflow-y-auto" style={{ padding: '24px 32px' }}>
        <Outlet />
      </main>

      <ToastStack />
      <CustomModal />
    </div>
  )
}
