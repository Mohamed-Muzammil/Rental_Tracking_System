import { Routes, Route } from 'react-router-dom'
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

import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import Forecasting from './pages/admin/Forecasting'

import FineInvoice from './pages/admin/FineInvoice'
import CompanyDetail from './pages/admin/CompanyDetail'

export default function App() {
  const initializeStore = useAppStore(s => s.initializeStore)
  useEffect(() => {
    initializeStore()
  }, [initializeStore])

  return (
    <Routes>
      <Route path="/" element={<RoleSelect />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="companies" element={<Companies />} />
        <Route path="companies/:id" element={<CompanyDetail />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="checkin" element={<CheckInOut />} />
        <Route path="usage" element={<UsageLogging />} />
        <Route path="alerts" element={<AlertsCenter />} />
        <Route path="forecasting" element={<Forecasting />} />
        <Route path="fine/:id" element={<FineInvoice />} />
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
