import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAppStore } from './store/appStore'
import RoleSelect from './pages/RoleSelect'
import AdminLayout from './components/layout/AdminLayout'
import ClientLayout from './components/layout/ClientLayout'
import Dashboard from './pages/admin/Dashboard'
import Companies from './pages/admin/Companies'
import Equipment from './pages/admin/Equipment'
import CheckInOut from './pages/admin/CheckInOut'
import UsageLogging from './pages/admin/UsageLogging'
import AlertsCenter from './pages/admin/AlertsCenter'
import ClientDashboard from './pages/client/ClientDashboard'
import ClientUsage from './pages/client/ClientUsage'
import ClientReturns from './pages/client/ClientReturns'
import Marketplace from './pages/client/Marketplace'

import Forecasting from './pages/admin/Forecasting'

export default function App() {
  const dataLoaded = useAppStore((s) => s.dataLoaded)
  const dataError = useAppStore((s) => s.dataError)
  const loadInitialData = useAppStore((s) => s.loadInitialData)

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  if (dataError) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 p-8 text-center" style={{ background: 'var(--bg-page)' }}>
        <div className="text-lg font-semibold" style={{ color: 'var(--critical)' }}>
          Couldn't load data from Supabase
        </div>
        <p className="max-w-md text-sm" style={{ color: 'var(--ink-secondary)' }}>
          {dataError}
        </p>
        <p className="max-w-md text-xs" style={{ color: 'var(--ink-muted)' }}>
          Check that <code>.env.local</code> has <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> set, that the schema in{' '}
          <code>supabase/schema.sql</code> has been run in your Supabase project, and that
          the dev server was restarted after adding the env file.
        </p>
      </div>
    )
  }

  if (!dataLoaded) {
    return (
      <div className="flex min-h-full items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <div className="text-sm font-medium" style={{ color: 'var(--ink-muted)' }}>
          Loading fleet data…
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<RoleSelect />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="companies" element={<Companies />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="checkin" element={<CheckInOut />} />
        <Route path="usage" element={<UsageLogging />} />
        <Route path="alerts" element={<AlertsCenter />} />
        <Route path="forecasting" element={<Forecasting />} />
      </Route>

      <Route path="/client" element={<ClientLayout />}>
        <Route index element={<ClientDashboard />} />
        <Route path="usage" element={<ClientUsage />} />
        <Route path="returns" element={<ClientReturns />} />
        <Route path="marketplace" element={<Marketplace />} />
      </Route>
    </Routes>
  )
}
