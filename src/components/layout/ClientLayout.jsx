import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { clients, clientById } from '../../data/clients'
import { sites } from '../../data/sites'
import Icon from '../ui/Icon'
import ToastStack from '../ui/ToastStack'
import CustomModal from '../ui/CustomModal'

const NAV = [
  { to: '/client', end: true, icon: 'gauge', label: 'Fleet Overview' },
  { to: '/client/usage', icon: 'clock', label: 'Usage Logs' },
  { to: '/client/returns', icon: 'swap', label: 'Rentals & Returns' },
  { to: '/client/marketplace', icon: 'truck', label: 'Marketplace' },
]

const selectStyle = {
  background: 'var(--bg-surface-raised)',
  borderColor: 'var(--border)',
  color: 'var(--ink-primary)',
}

export default function ClientLayout() {
  const navigate = useNavigate()
  const activeClientId = useAppStore((s) => s.activeClientId)
  const setActiveClientId = useAppStore((s) => s.setActiveClientId)
  const selectedSiteId = useAppStore((s) => s.selectedSiteId)
  const setSelectedSiteId = useAppStore((s) => s.setSelectedSiteId)

  const activeClient = clientById[activeClientId]
  const clientSites = sites.filter((s) => activeClient?.sites?.includes(s.id))

  return (
    <div className="flex h-screen flex-col" style={{ background: 'var(--bg-page)' }}>
      {/* Top Application Bar — same structure/colors as the admin header */}
      <header
        className="flex items-center gap-0 border-b shrink-0"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', height: '52px' }}
      >
        <div
          className="flex h-full items-center gap-2.5 border-r px-5 shrink-0"
          style={{ borderColor: 'var(--border)', minWidth: '200px' }}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded" style={{ background: 'var(--accent)' }}>
            <Icon name="truck" size={14} style={{ color: '#fff' }} />
          </div>
          <button onClick={() => navigate('/')} className="text-left">
            <span className="block text-[13px] font-bold tracking-tight leading-none" style={{ color: 'var(--ink-primary)' }}>
              FleetLoop
            </span>
            <span className="block text-[10px] font-normal leading-none mt-0.5" style={{ color: 'var(--ink-muted)' }}>
              Client Portal
            </span>
          </button>
        </div>

        <nav className="flex h-full min-w-0 flex-1 items-stretch overflow-x-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="relative flex shrink-0 items-center gap-1.5 border-b-2 px-4 text-[13px] font-medium transition-colors"
              style={({ isActive }) => ({
                borderColor: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--ink-secondary)',
              })}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex h-full items-center gap-1.5 border-l px-3 shrink-0" style={{ borderColor: 'var(--border)' }}>
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: 'var(--good-wash)', color: 'var(--good)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--good)' }} />
            Telemetry live
          </span>
        </div>
      </header>

      {/* Account context sub-bar */}
      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-5 py-2"
        style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border)' }}
      >
        <label className="flex items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
            Account
          </span>
          <select
            value={activeClientId}
            onChange={(e) => setActiveClientId(e.target.value)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium outline-hidden"
            style={selectStyle}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
            Site
          </span>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="rounded-md border px-2.5 py-1 text-xs font-medium outline-hidden"
            style={selectStyle}
          >
            <option value="ALL">All sites ({clientSites.length})</option>
            {clientSites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Page Content */}
      <main className="min-w-0 flex-1 overflow-y-auto" style={{ padding: '24px 32px' }}>
        <Outlet />
      </main>

      <ToastStack />
      <CustomModal />
    </div>
  )
}
