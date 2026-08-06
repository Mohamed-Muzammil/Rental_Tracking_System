import { create } from 'zustand'
import { addDays, format } from 'date-fns'
import { SIM_TODAY } from '../lib/clock'
import { pointNearSite } from '../lib/geo'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import {
  rowToEquipment,
  equipmentToRow,
  rowToUsageLog,
  usageLogToRow,
  rowToIncident,
  incidentToRow,
} from '../lib/db'
import { clients as seedClients } from '../data/clients'
import { equipment as seedEquipment } from '../data/equipment'
import { usageLogs as seedUsageLogs } from '../data/usageLogs'
import { misuseIncidents as seedIncidents } from '../data/incidents'
import seedMlForecast from '../data/mlForecast.json'

let toastId = 0

const getPrefix = (type) => ({
  Excavator: 'EXC',
  Bulldozer: 'BLD',
  Crane: 'CRN',
  Grader: 'GRD',
  Forklift: 'FRK',
  Loader: 'LDR',
  Roller: 'RLR'
}[type] || 'EQX')

export const useAppStore = create((set, get) => ({
  role: null, // 'admin' | 'client'
  activeClientId: 'C001', // which client the Client dashboard is viewing
  selectedSiteId: 'ALL', // 'ALL' or specific siteId

  today: SIM_TODAY,
  equipment: seedEquipment,
  clients: seedClients,
  usageLogs: seedUsageLogs,
  misuseIncidents: seedIncidents,
  mlForecast: seedMlForecast,
  dismissedAlertIds: [],
  toasts: [],
  modalConfig: null,

  dataLoaded: false,
  dataError: null,

  loadInitialData: async () => {
    if (!isSupabaseConfigured) {
      set({
        equipment: seedEquipment,
        clients: seedClients,
        usageLogs: seedUsageLogs,
        misuseIncidents: seedIncidents,
        mlForecast: seedMlForecast,
        dataLoaded: true,
        dataError: null,
      })
      return
    }
    set({ dataError: null })
    const [eqRes, logRes, incRes] = await Promise.all([
      supabase.from('equipment').select('*').limit(10000),
      supabase.from('usage_logs').select('*').limit(20000),
      supabase.from('misuse_incidents').select('*').limit(10000),
    ])
    const failed = eqRes.error || logRes.error || incRes.error
    if (failed) {
      // Fallback to static seed data on error so prototype remains operational
      set({
        equipment: seedEquipment,
        clients: seedClients,
        usageLogs: seedUsageLogs,
        misuseIncidents: seedIncidents,
        dataLoaded: true,
        dataError: null,
      })
      return
    }
    set({
      equipment: eqRes.data.map(rowToEquipment),
      usageLogs: logRes.data.map(rowToUsageLog),
      misuseIncidents: incRes.data.length ? incRes.data.map(rowToIncident) : seedIncidents,
      clients: seedClients,
      mlForecast: seedMlForecast,
      dataLoaded: true,
    })
  },

  setRole: (role) => set({ role }),
  setActiveClientId: (activeClientId) => set({ activeClientId, selectedSiteId: 'ALL' }),
  setSelectedSiteId: (selectedSiteId) => set({ selectedSiteId }),

  initializeStore: async () => {
    try {
      const [eqRes, logsRes, alertsRes, mlRes, clientsRes] = await Promise.all([
        fetch('http://localhost:8000/api/equipment'),
        fetch('http://localhost:8000/api/usage-logs'),
        fetch('http://localhost:8000/api/incidents'),
        fetch('http://localhost:8000/api/ml/forecast'),
        fetch('http://localhost:8000/api/clients')
      ])
      const [equipment, usageLogs, misuseIncidents, mlForecast, clients] = await Promise.all([
        eqRes.json(), logsRes.json(), alertsRes.json(), mlRes.json(), clientsRes.json()
      ])
      set({ equipment, usageLogs, misuseIncidents, mlForecast, clients })
    } catch (err) {
      console.error("Failed to fetch backend state:", err)
      get().pushToast("Failed to connect to backend", "critical")
    }
  },

  openModal: (config) => set({ modalConfig: config }),
  closeModal: () => set({ modalConfig: null }),

  advanceDay: () => set((s) => ({ today: addDays(s.today, 1) })),

  pushToast: (message, tone = 'good') => {
    const id = ++toastId
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3500)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  dismissAlert: (alertId) =>
    set((s) => ({ dismissedAlertIds: [...s.dismissedAlertIds, alertId] })),

  sendReminder: (equipmentId) => {
    get().pushToast(`Reminder sent for ${equipmentId}`, 'good')
  },

  registerEquipment: async ({ id, type, tier, catalogId, qrCode }) => {
    const eqType = type || 'Excavator'
    const newEq = {
      id: id || `${getPrefix(eqType)}-${Math.floor(2030 + Math.random() * 100)}`,
      type: eqType,
      tier: tier || 'Heavy Duty',
      catalogId,
      status: 'completed', // Available in warehouse yard
      siteId: null,
      clientId: null,
      operatorId: null,
      checkIn: null,
      expectedReturn: null,
      avgEngineHoursPerDay: 0,
      avgIdleHoursPerDay: 0,
      qrCode: qrCode || `QR-${id || 'NEW'}`,
    }

    const { error } = await supabase.from('equipment').insert(equipmentToRow(newEq))
    if (error) return get().pushToast(`Failed to register equipment: ${error.message}`, 'critical')

    set((s) => ({ equipment: [newEq, ...s.equipment] }))
    get().pushToast(`Registered ${newEq.id} (${newEq.tier} ${newEq.type}) — Status: Available in Yard`, 'good')
  },

  // Hold / Reservation Step
  reserveEquipmentOnHold: async ({ equipmentIds, clientId, siteId }) => {
    const { error } = await supabase
      .from('equipment')
      .update({ status: 'hold', client_id: clientId, site_id: siteId })
      .in('id', equipmentIds)
    if (error) return get().pushToast(`Failed to reserve units: ${error.message}`, 'critical')

    const idSet = new Set(equipmentIds)
    set((state) => ({
      equipment: state.equipment.map((e) =>
        idSet.has(e.id) ? { ...e, status: 'hold', clientId, siteId } : e,
      ),
    }))
    get().pushToast(`${equipmentIds.length} units set to ON HOLD (Reserved for ${clientId})`, 'good')
  },

  checkOutEquipment: async ({ equipmentId, siteId, clientId, operatorId, expectedReturn }) => {
    const s = get()
    const patch = {
      status: 'active',
      siteId,
      clientId,
      operatorId: operatorId || null,
      checkIn: format(s.today, 'yyyy-MM-dd'),
      expectedReturn,
      avgEngineHoursPerDay: 0,
      avgIdleHoursPerDay: 0,
      returnRequested: false,
    }

    const { error } = await supabase.from('equipment').update(equipmentToRow(patch)).eq('id', equipmentId)
    if (error) return get().pushToast(`Failed to check out ${equipmentId}: ${error.message}`, 'critical')

    set((state) => ({
      equipment: state.equipment.map((e) => (e.id === equipmentId ? { ...e, ...patch } : e)),
    }))
    get().pushToast(`${equipmentId} checked out`, 'good')
  },

  batchCheckOutEquipment: async ({ equipmentIds, siteId, clientId, expectedReturn }) => {
    const s = get()
    const patch = {
      status: 'active',
      siteId,
      clientId,
      operatorId: null,
      checkIn: format(s.today, 'yyyy-MM-dd'),
      expectedReturn,
      avgEngineHoursPerDay: 0,
      avgIdleHoursPerDay: 0,
      returnRequested: false,
    }

    const { error } = await supabase.from('equipment').update(equipmentToRow(patch)).in('id', equipmentIds)
    if (error) return get().pushToast(`Batch dispatch failed: ${error.message}`, 'critical')

    const idSet = new Set(equipmentIds)
    set((state) => ({
      equipment: state.equipment.map((e) => (idSet.has(e.id) ? { ...e, ...patch } : e)),
    }))
    get().pushToast(`Batch Dispatch Verified: ${equipmentIds.length} units checked out!`, 'good')
  },

  // QR Return & Condition Inspection
  inspectAndReturnEquipment: async ({ equipmentId, condition, notes }) => {
    const s = get()
    const isDamaged = condition === 'damaged'
    const newStatus = isDamaged ? 'maintenance' : 'completed'
    const patch = {
      status: newStatus,
      checkOut: format(s.today, 'yyyy-MM-dd'),
      operatorId: null,
      returnRequested: false,
      maintenanceNote: isDamaged ? notes || 'Damaged upon return inspection' : null,
    }

    const { error } = await supabase.from('equipment').update(equipmentToRow(patch)).eq('id', equipmentId)
    if (error) return get().pushToast(`Failed to process return for ${equipmentId}: ${error.message}`, 'critical')

    set((state) => ({
      equipment: state.equipment.map((e) => (e.id === equipmentId ? { ...e, ...patch } : e)),
    }))

    if (isDamaged) {
      get().pushToast(`Returned ${equipmentId} marked DAMAGED → Sent to Workshop Maintenance`, 'critical')
    } else {
      get().pushToast(`Returned ${equipmentId} verified GOOD condition → Returned to Yard`, 'good')
    }
  },

  checkInEquipment: (equipmentId) => {
    return get().inspectAndReturnEquipment({ equipmentId, condition: 'good', notes: 'Checked in' })
  },
  checkIn: (equipmentId) => get().checkInEquipment(equipmentId),

  issueFine: async (equipmentId, amount) => {
    const s = get()
    const eq = s.equipment.find(e => e.id === equipmentId)
    
    if (eq && eq.clientId) {
      try {
        const res = await fetch(`http://localhost:8000/api/clients/${eq.clientId}/fine`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ equipmentId, amount: amount || 25000 })
        })
        if (res.ok) {
          const updatedClient = await res.json()
          set((state) => ({
            clients: state.clients.map(c => c.id === updatedClient.id ? updatedClient : c),
            equipment: state.equipment.map(e => e.id === equipmentId ? { ...e, finePending: true } : e)
          }))
          get().pushToast(`Fine formally issued and pending for ${equipmentId}`, 'critical')
        }
      } catch (err) {
        console.error("Failed to issue fine", err)
        get().pushToast("Failed to issue fine", "critical")
      }
    }
  },

  payInvoice: async (clientId, invoiceId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/clients/${clientId}/invoice/${invoiceId}/pay`, {
        method: 'PUT'
      })
      if (res.ok) {
        const updatedClient = await res.json()
        set((state) => ({
          clients: state.clients.map(c => c.id === updatedClient.id ? updatedClient : c)
        }))
        get().pushToast(`Invoice ${invoiceId} marked as paid`, 'good')
      }
    } catch (err) {
      console.error("Failed to pay invoice", err)
      get().pushToast("Failed to pay invoice", "critical")
    }
  },

  // Misuse Incident Engine
  resolveMisuseIncident: async ({ incidentId, actionType, notes }) => {
    const patch = { status: 'resolved', resolution: actionType, resolutionNotes: notes }
    const { error } = await supabase.from('misuse_incidents').update(incidentToRow(patch)).eq('id', incidentId)
    if (error) return get().pushToast(`Failed to resolve ${incidentId}: ${error.message}`, 'critical')

    set((s) => ({
      misuseIncidents: s.misuseIncidents.map((inc) => (inc.id === incidentId ? { ...inc, ...patch } : inc)),
    }))

    const actionText =
      actionType === 'false_alarm'
        ? 'Closed as False Alarm'
        : actionType === 'warn_operator'
        ? 'Operator Formally Warned'
        : actionType === 'penalty'
        ? 'Penalty Fee Applied'
        : actionType === 'inspection'
        ? 'Field Inspector Dispatched'
        : 'Immediate Unit Recall Requested'

    get().pushToast(`Incident ${incidentId}: ${actionText}`, actionType === 'false_alarm' ? 'good' : 'warning')
  },

  logUsage: async ({ equipmentId, engineHours, idleHours, fuelUsageL, operatorId, location }) => {
    const s = get()
    const date = format(s.today, 'yyyy-MM-dd')
    // Fall back to the assigned site centre when no position is supplied, so a
    // log entry always carries a location for the geofence rule to test.
    const eq = s.equipment.find((e) => e.id === equipmentId)
    const resolvedLocation = location ?? pointNearSite(eq?.siteId, 0)
    const logEntry = { equipmentId, operatorId, date, engineHours, idleHours, fuelUsageL, location: resolvedLocation }

    const [{ error: logErr }, { error: eqErr }] = await Promise.all([
      supabase.from('usage_logs').upsert(usageLogToRow(logEntry), { onConflict: 'equipment_id,date' }),
      supabase
        .from('equipment')
        .update({ avg_engine_hours_per_day: engineHours, avg_idle_hours_per_day: idleHours })
        .eq('id', equipmentId),
    ])
    if (logErr || eqErr) return get().pushToast(`Failed to log usage for ${equipmentId}: ${(logErr || eqErr).message}`, 'critical')

    set((state) => ({
      usageLogs: [...state.usageLogs.filter((l) => !(l.equipmentId === equipmentId && l.date === date)), logEntry],
      equipment: state.equipment.map((e) =>
        e.id === equipmentId ? { ...e, avgEngineHoursPerDay: engineHours, avgIdleHoursPerDay: idleHours } : e,
      ),
    }))
    get().pushToast(`Usage logged for ${equipmentId}`, 'good')
  },

  // Allocates an existing yard unit of this catalog tier rather than
  // manufacturing a new one — a rental is supposed to consume available
  // stock, not grow the fleet. Only mints a new unit as a last resort, when
  // the yard genuinely has none of that tier (equivalent to a warehouse
  // order), and says so explicitly rather than pretending supply is infinite.
  rentFromCatalog: async (catalogItem, siteId) => {
    const s = get()
    const dispatch = () => ({
      status: 'active',
      siteId: siteId || 'S001',
      clientId: s.activeClientId,
      operatorId: null,
      checkIn: format(s.today, 'yyyy-MM-dd'),
      expectedReturn: format(addDays(s.today, 30), 'yyyy-MM-dd'),
      avgEngineHoursPerDay: 0,
      avgIdleHoursPerDay: 0,
      returnRequested: false,
    })

    const availableUnit = s.equipment.find(
      (e) => e.status === 'completed' && e.catalogId === catalogItem.id,
    )

    if (availableUnit) {
      const patch = dispatch()
      const { error } = await supabase.from('equipment').update(equipmentToRow(patch)).eq('id', availableUnit.id)
      if (error) return get().pushToast(`Failed to allocate ${availableUnit.id}: ${error.message}`, 'critical')

      set((state) => ({
        equipment: state.equipment.map((e) => (e.id === availableUnit.id ? { ...e, ...patch } : e)),
      }))
      get().pushToast(`Allocated ${availableUnit.id} — ${catalogItem.tier} ${catalogItem.type} from yard stock`, 'good')
      return
    }

    const newId = `${getPrefix(catalogItem.type)}-3${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    const newEquipment = {
      id: newId,
      type: catalogItem.type,
      tier: catalogItem.tier,
      catalogId: catalogItem.id,
      ...dispatch(),
    }
    const { error } = await supabase.from('equipment').insert(equipmentToRow(newEquipment))
    if (error) return get().pushToast(`Failed to order new unit: ${error.message}`, 'critical')

    set((state) => ({ equipment: [...state.equipment, newEquipment] }))
    get().pushToast(`No yard stock for ${catalogItem.tier} ${catalogItem.type} — ordered new unit ${newId}`, 'warning')
  },

  extendRental: async (equipmentId, extraDays) => {
    const s = get()
    const eq = s.equipment.find((e) => e.id === equipmentId)
    if (!eq) return
    const currentReturn = new Date(eq.expectedReturn)
    const newReturn = format(addDays(currentReturn, extraDays), 'yyyy-MM-dd')

    const { error } = await supabase.from('equipment').update({ expected_return: newReturn }).eq('id', equipmentId)
    if (error) return get().pushToast(`Failed to extend rental for ${equipmentId}: ${error.message}`, 'critical')

    set((state) => ({
      equipment: state.equipment.map((e) => (e.id === equipmentId ? { ...e, expectedReturn: newReturn } : e)),
    }))
    get().pushToast(`Rental extended by ${extraDays} days for ${equipmentId}`, 'good')
  },

  // Flags the unit for the provider's queue rather than silently rewriting the
  // contract's expected-return date — that was overwriting real rental terms
  // with today's date. The provider now sees an explicit alert and actions it
  // through the normal check-in flow.
  requestReturn: async (equipmentId) => {
    const { error } = await supabase.from('equipment').update({ return_requested: true }).eq('id', equipmentId)
    if (error) return get().pushToast(`Failed to request return for ${equipmentId}: ${error.message}`, 'critical')

    set((state) => ({
      equipment: state.equipment.map((e) => (e.id === equipmentId ? { ...e, returnRequested: true } : e)),
    }))
    get().pushToast(`Return requested for ${equipmentId} — provider notified`, 'warning')
  },

  acceptRecommendation: async (equipmentId, recommendation) => {
    const patch = { catalogId: recommendation.catalog.id, tier: recommendation.catalog.tier }
    const { error } = await supabase.from('equipment').update(equipmentToRow(patch)).eq('id', equipmentId)
    if (error) return get().pushToast(`Failed to swap ${equipmentId}: ${error.message}`, 'critical')

    set((s) => ({
      equipment: s.equipment.map((e) => (e.id === equipmentId ? { ...e, ...patch } : e)),
    }))
    get().pushToast(
      `${equipmentId} swapped to ${recommendation.catalog.tier} — saving $${recommendation.dailySavings}/day`,
      'good',
    )
  },
}))
