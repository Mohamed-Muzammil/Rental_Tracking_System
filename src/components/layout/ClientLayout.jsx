import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useAppStore } from '../../store/appStore'
import { clients, clientById } from '../../data/clients'
import { sites } from '../../data/sites'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import ToastStack from '../ui/ToastStack'
import CustomModal from '../ui/CustomModal'

const NAV = [
  { to: '/client', end: true, icon: 'gauge', label: 'Fleet Overview' },
  { to: '/client/usage', icon: 'clock', label: 'Telemetry & Usage Logs' },
  { to: '/client/returns', icon: 'swap', label: 'Rentals & Returns' },
  { to: '/client/marketplace', icon: 'truck', label: 'Equipment Marketplace' },
]

export default function ClientLayout() {
  const navigate = useNavigate()
  const today = useAppStore((s) => s.today)
  const advanceDay = useAppStore((s) => s.advanceDay)
  const activeClientId = useAppStore((s) => s.activeClientId)
  const setActiveClientId = useAppStore((s) => s.setActiveClientId)
  const selectedSiteId = useAppStore((s) => s.selectedSiteId)
  const setSelectedSiteId = useAppStore((s) => s.setSelectedSiteId)

  const activeClient = clientById[activeClientId]

  // Filter sites for active client
  const clientSites = sites.filter((s) => activeClient?.sites?.includes(s.id))

  return (
    <div className="flex min-h-full flex-col" style={{ background: 'var(--bg-page)' }}>
      {/* Industrial Header Topbar */}
      <header
        className="flex flex-wrap items-center justify-between border-b px-6 py-3 text-xs"
        style={{ background: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
      >
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-display text-base font-extrabold uppercase tracking-wider transition-opacity hover:opacity-80"
            style={{ color: '#f59e0b' }}
          >
            <Icon name="truck" size={20} />
            <span>FleetLoop</span>
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-400">
              Client Operations
            </span>
          </button>

          {/* Client Switcher Dropdown */}
          <div className="flex items-center gap-2 border-l border-slate-700 pl-6">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Client Account:</span>
            <select
              value={activeClientId}
              onChange={(e) => setActiveClientId(e.target.value)}
              className="rounded-md bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          {/* Site Filter Dropdown */}
          <div className="flex items-center gap-2 border-l border-slate-700 pl-6">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Active Site:</span>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="rounded-md bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Active Sites ({clientSites.length})</option>
              {clientSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.region})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-emerald-400 font-medium text-[11px]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>IoT Telemetry Feed Active</span>
          </div>
        </div>
      </header>

      {/* Industrial Sub-Nav Tabs */}
      <div className="border-b px-6 shadow-xs" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <nav className="flex gap-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all ${
                  isActive ? 'border-amber-500 text-amber-600 bg-amber-50/50' : 'border-transparent hover:text-slate-900'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--accent)' : 'var(--ink-secondary)',
                borderColor: isActive ? 'var(--accent)' : 'transparent',
              })}
            >
              <Icon name={item.icon} size={15} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 px-6 py-6 lg:px-10 lg:py-8">
        <Outlet />
      </main>

      <ToastStack />
      <CustomModal />
    </div>
  )
}
