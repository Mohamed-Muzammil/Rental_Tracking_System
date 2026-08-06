import { useMemo, useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { sites } from '../../data/sites'
import { returnStatus } from '../../lib/rules'
import Icon from '../ui/Icon'
import ToastStack from '../ui/ToastStack'
import CustomModal from '../ui/CustomModal'

const NAV = [
  { to: '/client', end: true, icon: 'truck', label: 'Equipment Requisition & Orders' },
  { to: '/client/rentals', icon: 'clock', label: 'Active Rentals & Return Deadlines' },
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

  const clients = useAppStore((s) => s.clients)
  const equipment = useAppStore((s) => s.equipment)
  const today = useAppStore((s) => s.today)
  const notifications = useAppStore((s) => s.notifications)
  const markNotificationRead = useAppStore((s) => s.markNotificationRead)
  const clearAllNotifications = useAppStore((s) => s.clearAllNotifications)

  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients])
  const activeClient = clientById[activeClientId]
  const clientSites = sites.filter((s) => activeClient?.sites?.includes(s.id))

  // Filter client's active machinery & calculate deadline alerts
  const clientActiveFleet = useMemo(() => {
    return equipment.filter((e) => e.clientId === activeClientId && e.status === 'active')
  }, [equipment, activeClientId])

  const deadlineUrgentUnits = useMemo(() => {
    return clientActiveFleet
      .map((e) => ({ ...e, rs: returnStatus(e, today) }))
      .filter((e) => e.rs?.state === 'due-soon' || e.rs?.state === 'overdue')
  }, [clientActiveFleet, today])

  // Client notifications (relevant to this client)
  const clientNotifications = useMemo(() => {
    return notifications.filter((n) => !n.clientId || n.clientId === activeClientId)
  }, [notifications, activeClientId])

  const unreadCount = useMemo(() => {
    return clientNotifications.filter((n) => !n.read).length
  }, [clientNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex h-screen flex-col" style={{ background: 'var(--bg-page)' }}>
      {/* Top Application Bar */}
      <header
        className="flex items-center gap-0 border-b shrink-0"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', height: '52px' }}
      >
        <div
          className="flex h-full items-center gap-2.5 border-r px-5 shrink-0"
          style={{ borderColor: 'var(--border)', minWidth: '220px' }}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded" style={{ background: 'var(--accent)' }}>
            <Icon name="truck" size={14} style={{ color: '#fff' }} />
          </div>
          <button onClick={() => navigate('/')} className="text-left">
            <span className="block text-[13px] font-bold tracking-tight leading-none" style={{ color: 'var(--ink-primary)' }}>
              FleetLoop
            </span>
            <span className="block text-[10px] font-normal leading-none mt-0.5" style={{ color: 'var(--ink-muted)' }}>
              Client Requisition Portal
            </span>
          </button>
        </div>

        {/* Simplified Navigation */}
        <nav className="flex h-full min-w-0 flex-1 items-stretch overflow-x-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="relative flex shrink-0 items-center gap-1.5 border-b-2 px-5 text-[13px] font-semibold transition-colors"
              style={({ isActive }) => ({
                borderColor: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--ink-secondary)',
              })}
            >
              <Icon name={item.icon} size={15} />
              {item.label}
              {item.to === '/client/rentals' && deadlineUrgentUnits.length > 0 && (
                <span
                  className="ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold"
                  style={{ background: 'var(--critical)', color: '#ffffff' }}
                >
                  {deadlineUrgentUnits.length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Header Right Actions: Notifications & Telemetry */}
        <div className="flex h-full items-center gap-2 border-l px-3 shrink-0" style={{ borderColor: 'var(--border)' }}>
          {/* Notification Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:opacity-80"
              style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border)', color: 'var(--ink-primary)' }}
              title="Notifications from Dealer & Deadlines"
            >
              <Icon name="bell" size={15} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                  style={{ background: 'var(--critical)', color: '#ffffff' }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border p-0 shadow-2xl z-50 overflow-hidden"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-raised)' }}>
                  <div className="flex items-center gap-1.5">
                    <Icon name="bell" size={13} style={{ color: 'var(--accent)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--ink-primary)' }}>Dealer & Rental Notifications</span>
                  </div>
                  {clientNotifications.length > 0 && (
                    <button
                      onClick={() => clearAllNotifications(activeClientId)}
                      className="text-[10px] hover:underline"
                      style={{ color: 'var(--ink-muted)' }}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: 'var(--border)' }}>
                  {clientNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className="p-3 transition-colors cursor-pointer hover:opacity-90 flex flex-col gap-1"
                      style={{
                        background: n.read ? 'transparent' : 'var(--bg-surface-raised)',
                        borderLeft: n.read ? '3px solid transparent' : '3px solid var(--accent)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-[11px] font-bold"
                          style={{
                            color: n.severity === 'critical' ? 'var(--critical)' : n.severity === 'warning' ? 'var(--warning)' : 'var(--ink-primary)',
                          }}
                        >
                          {n.title}
                        </span>
                        <span className="text-[9px]" style={{ color: 'var(--ink-muted)' }}>{n.createdAt}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                        {n.body}
                      </p>
                    </div>
                  ))}

                  {clientNotifications.length === 0 && (
                    <div className="py-8 text-center text-xs" style={{ color: 'var(--ink-muted)' }}>
                      No new notifications from rental dealer.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: 'var(--good-wash)', color: 'var(--good)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--good)' }} />
            Connected
          </span>
        </div>
      </header>

      {/* Account context sub-bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b px-5 py-2"
        style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-muted)' }}>
              Client Org
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
              Project Site
            </span>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="rounded-md border px-2.5 py-1 text-xs font-medium outline-hidden"
              style={selectStyle}
            >
              <option value="ALL">All project sites ({clientSites.length})</option>
              {clientSites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
          Active Deployed Units: <strong style={{ color: 'var(--ink-primary)' }}>{clientActiveFleet.length}</strong>
        </div>
      </div>

      {/* Nearing Deadline Warning Banner */}
      {deadlineUrgentUnits.length > 0 && (
        <div
          className="flex items-center justify-between px-5 py-2.5 border-b text-xs font-medium"
          style={{
            background: 'var(--warning-wash)',
            borderColor: 'var(--warning)',
            color: 'var(--warning)',
          }}
        >
          <div className="flex items-center gap-2">
            <Icon name="alertTriangle" size={16} />
            <span>
              <strong>Deadline Attention Required:</strong> {deadlineUrgentUnits.length} equipment unit(s) are nearing return deadline or overdue!
            </span>
          </div>
          <NavLink
            to="/client/rentals"
            className="flex items-center gap-1 rounded-md px-3 py-1 font-bold underline transition-opacity hover:opacity-80"
          >
            Review Return Schedule & Extend <Icon name="arrowRight" size={13} />
          </NavLink>
        </div>
      )}

      {/* Page Content */}
      <main className="min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto px-4 sm:px-6 py-4">
        <Outlet />
      </main>

      <ToastStack />
      <CustomModal />
    </div>
  )
}

