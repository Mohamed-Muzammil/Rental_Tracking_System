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
import { seedRentalRequests } from '../data/seedRequests'
import { seedNotifications } from '../data/seedNotifications'
import seedMlForecast from '../data/mlForecast.json'

const shortId = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.floor(Math.random() * 100)}`

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

  // Client requests & notifications
  requests: seedRentalRequests,
  notifications: seedNotifications,

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
    const [eqRes, incRes] = await Promise.all([
      supabase.from('equipment').select('*').limit(10000),
      supabase.from('misuse_incidents').select('*').limit(10000),
    ])

    // Paginate usage_logs to bypass the 1000-row limit
    let allLogs = []
    let from = 0
    let step = 1000
    let logError = null
    while (true) {
      const { data, error } = await supabase.from('usage_logs').select('*').range(from, from + step - 1)
      if (error) {
        logError = error
        break
      }
      if (data) allLogs.push(...data)
      if (!data || data.length < step) break
      from += step
    }

    const failed = eqRes.error || logError || incRes.error
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
      usageLogs: allLogs.map(rowToUsageLog),
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

  sendReminder: (equipmentId, customMessage) => {
    const s = get()
    const eq = s.equipment.find((e) => e.id === equipmentId)
    if (eq && eq.clientId) {
      get().addNotification({
        clientId: eq.clientId,
        type: 'ping_reminder',
        title: `📡 Dealer Ping: Attention Required on ${eq.id}`,
        body: customMessage || `Dealer dispatched an urgent operational ping reminder regarding unit ${eq.id} (${eq.tier} ${eq.type}) at site ${eq.siteId || 'current site'}. Please check machine telemetry and return schedule.`,
        severity: 'warning',
        relatedId: eq.id,
      })
    }
    get().pushToast(`Ping reminder dispatched to client for ${equipmentId}`, 'good')
  },

  sendFineReminder: ({ clientId, equipmentId, amount, reason }) => {
    const s = get()
    const targetClientId = clientId || s.equipment.find((e) => e.id === equipmentId)?.clientId
    if (!targetClientId) return

    get().addNotification({
      clientId: targetClientId,
      type: 'fine_reminder',
      title: `⚠️ Penalty & Fine Assessment: ${equipmentId || 'Contract Violation'}`,
      body: `A penalty fine of $${(amount || 450).toLocaleString()} has been assessed by the dealer for ${reason || 'overdue return / contract violation'}. Please review your account or contact the fleet manager.`,
      severity: 'critical',
      relatedId: equipmentId,
    })
    get().pushToast(`Fine notice delivered to client ${targetClientId}`, 'critical')
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

    // Notify client of check-out & dispatch
    get().addNotification({
      clientId,
      type: 'checkout_dispatched',
      title: '🚚 Machinery Check-Out Dispatched by Dealer',
      body: `Unit ${equipmentId} has been checked out and dispatched to your project site. Expected Return: ${expectedReturn}.`,
      severity: 'good',
      relatedId: equipmentId,
    })

    get().pushToast(`${equipmentId} checked out & client notified`, 'good')
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

    // Notify client of batch dispatch
    get().addNotification({
      clientId,
      type: 'checkout_dispatched',
      title: `🚚 Batch Dispatch: ${equipmentIds.length} Units On The Way`,
      body: `Dealer has verified and dispatched ${equipmentIds.join(', ')} to your site. Expected Return: ${expectedReturn}.`,
      severity: 'good',
      relatedId: equipmentIds[0],
    })

    get().pushToast(`Batch Dispatch Verified: ${equipmentIds.length} units checked out!`, 'good')
  },

  // QR Return & Condition Inspection
  inspectAndReturnEquipment: async ({ equipmentId, condition, notes }) => {
    const s = get()
    const eq = s.equipment.find((e) => e.id === equipmentId)
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

    // Notify client that check-in was received and completed
    if (eq && eq.clientId) {
      get().addNotification({
        clientId: eq.clientId,
        type: 'checkin_request',
        title: isDamaged ? '⚠️ Equipment Check-In: Maintenance Inspection Logged' : '✅ Equipment Check-In Completed',
        body: isDamaged
          ? `Unit ${equipmentId} checked in at dealer yard with inspection notes: "${notes || 'Wear & tear noted'}".`
          : `Unit ${equipmentId} successfully received, inspected, and checked into dealer yard. Rental concluded.`,
        severity: isDamaged ? 'warning' : 'good',
        relatedId: equipmentId,
      })
    }

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

  issueFine: async (equipmentId, amount, reason) => {
    const s = get()
    const eq = s.equipment.find(e => e.id === equipmentId)
    
    if (eq && eq.clientId) {
      const fineTotal = amount || 25000
      set((state) => ({
        clients: state.clients.map(c => c.id === eq.clientId ? { ...c, fineAmount: (c.fineAmount || 0) + fineTotal } : c),
        equipment: state.equipment.map(e => e.id === equipmentId ? { ...e, finePending: true } : e)
      }))

      // Send Fine Reminder Notification to Client
      get().addNotification({
        clientId: eq.clientId,
        type: 'fine_reminder',
        title: `⚠️ Penalty & Fine Assessment: Unit ${eq.id}`,
        body: `Dealer has issued an official penalty fine of $${fineTotal.toLocaleString()} for unit ${eq.id} (${eq.tier} ${eq.type}). Reason: ${reason || 'Late return / Contract policy breach'}.`,
        severity: 'critical',
        relatedId: eq.id,
      })

      get().pushToast(`Fine formally issued and notified to ${eq.clientId}`, 'critical')

      try {
        await fetch(`http://localhost:8000/api/clients/${eq.clientId}/fine`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ equipmentId, amount: fineTotal })
        })
      } catch (err) {
        console.error("Backend fine update failed", err)
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
    const s = get()
    const inc = s.misuseIncidents.find((i) => i.id === incidentId)
    const patch = { status: 'resolved', resolution: actionType, resolutionNotes: notes }
    const { error } = await supabase.from('misuse_incidents').update(incidentToRow(patch)).eq('id', incidentId)
    if (error) return get().pushToast(`Failed to resolve ${incidentId}: ${error.message}`, 'critical')

    set((state) => ({
      misuseIncidents: state.misuseIncidents.map((i) => (i.id === incidentId ? { ...i, ...patch } : i)),
    }))

    // Deeply interlink with client side based on corrective action taken
    if (inc) {
      const eq = s.equipment.find((e) => e.id === inc.equipmentId)
      const clientId = inc.clientId || eq?.clientId

      if (actionType === 'penalty') {
        get().issueFine(inc.equipmentId, 1500, `Telemetry Anomaly #${inc.id}: ${inc.title}`)
      } else if (actionType === 'warn_operator') {
        if (clientId) {
          get().addNotification({
            clientId,
            type: 'ping_reminder',
            title: `⚠️ Dealer Warning Notice: ${inc.title}`,
            body: `Dealer has issued a formal operational warning for unit ${inc.equipmentId}: "${inc.details}". Notes: ${notes || 'Please instruct operator to stay within authorized site limits.'}`,
            severity: 'warning',
            relatedId: inc.equipmentId,
          })
        }
      } else if (actionType === 'inspection') {
        if (clientId) {
          get().addNotification({
            clientId,
            type: 'ping_reminder',
            title: `🔍 Field Inspector Dispatched: ${inc.equipmentId}`,
            body: `Dealer dispatched a field technical specialist to inspect unit ${inc.equipmentId} at your project site regarding: "${inc.title}".`,
            severity: 'info',
            relatedId: inc.equipmentId,
          })
        }
      } else if (actionType === 'recall') {
        get().requestReturn(inc.equipmentId)
      }
    }

    const actionText =
      actionType === 'false_alarm'
        ? 'Closed as False Alarm'
        : actionType === 'warn_operator'
        ? 'Operator Formally Warned & Client Notified'
        : actionType === 'penalty'
        ? 'Penalty Fine Implemented & Charged to Client'
        : actionType === 'inspection'
        ? 'Field Inspector Dispatched & Client Alerted'
        : 'Immediate Unit Recall Notice Sent to Client'

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

    if (eq.clientId) {
      get().addNotification({
        clientId: eq.clientId,
        type: 'deadline_warning',
        title: `📅 Rental Extended: Unit ${equipmentId}`,
        body: `Rental term for unit ${equipmentId} (${eq.tier} ${eq.type}) successfully extended by ${extraDays} days. New Expected Return: ${newReturn}.`,
        severity: 'good',
        relatedId: equipmentId,
      })
    }

    get().pushToast(`Rental extended by ${extraDays} days for ${equipmentId}`, 'good')
  },

  // Flags the unit for the provider's queue rather than silently rewriting the
  // contract's expected-return date — that was overwriting real rental terms
  // with today's date. The provider now sees an explicit alert and actions it
  // through the normal check-in flow.
  requestReturn: async (equipmentId) => {
    const s = get()
    const eq = s.equipment.find((e) => e.id === equipmentId)
    const { error } = await supabase.from('equipment').update({ return_requested: true }).eq('id', equipmentId)
    if (error) return get().pushToast(`Failed to request return for ${equipmentId}: ${error.message}`, 'critical')

    set((state) => ({
      equipment: state.equipment.map((e) => (e.id === equipmentId ? { ...e, returnRequested: true } : e)),
    }))

    if (eq && eq.clientId) {
      get().addNotification({
        clientId: eq.clientId,
        type: 'checkin_request',
        title: `📦 Return Scheduled & Check-In Initiated: ${equipmentId}`,
        body: `Return dispatch QR generated for unit ${equipmentId}. Dealer yard reception has been alerted for incoming inspection.`,
        severity: 'warning',
        relatedId: equipmentId,
      })
    }

    get().pushToast(`Return requested for ${equipmentId} — dealer notified`, 'warning')
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

  // ── Notifications System ───────────────────────────────────────────────────
  addNotification: ({ clientId, type, title, body, severity = 'info', relatedId = null }) => {
    const s = get()
    const notif = {
      id: shortId('NOTIF'),
      clientId: clientId || s.activeClientId,
      type,
      title,
      body,
      severity,
      relatedId,
      read: false,
      createdAt: format(s.today, 'yyyy-MM-dd HH:mm'),
    }
    set((state) => ({ notifications: [notif, ...state.notifications] }))
    return notif
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
  },

  clearAllNotifications: (clientId) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.clientId !== clientId),
    }))
    get().pushToast('Notifications cleared', 'neutral')
  },

  // ── Client Order Request Workflow ──────────────────────────────────────────
  submitRentalRequest: async ({ clientId, catalogItem, siteId, requestedStart, requestedDurationDays, quantity = 1, notes = '' }) => {
    const s = get()
    const targetClientId = clientId || s.activeClientId
    const newReq = {
      id: shortId('REQ'),
      clientId: targetClientId,
      type: 'new_rental',
      equipmentId: null,
      requestedType: catalogItem.type,
      requestedCatalogId: catalogItem.id,
      requestedTier: catalogItem.tier,
      dailyRate: catalogItem.dailyCost,
      quantity,
      siteId: siteId || 'S001',
      requestedStart: requestedStart || format(s.today, 'yyyy-MM-dd'),
      requestedDurationDays: requestedDurationDays || 14,
      notes,
      status: 'pending',
      dealerNotes: null,
      createdAt: format(s.today, 'yyyy-MM-dd HH:mm'),
    }

    set((state) => ({ requests: [newReq, ...state.requests] }))
    get().pushToast(`Order request ${newReq.id} for ${catalogItem.tier} ${catalogItem.type} sent to dealer!`, 'good')
    return newReq
  },

  approveRentalRequest: async (requestId) => {
    const s = get()
    const req = s.requests.find((r) => r.id === requestId)
    if (!req) return

    // Find available yard unit of requested catalog or type
    const availableUnit = s.equipment.find(
      (e) => e.status === 'completed' && (e.catalogId === req.requestedCatalogId || e.type === req.requestedType),
    )

    const unitId = availableUnit
      ? availableUnit.id
      : `${getPrefix(req.requestedType)}-3${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`

    const expectedReturn = format(addDays(new Date(req.requestedStart || s.today), req.requestedDurationDays || 14), 'yyyy-MM-dd')

    // If unit existed in yard, update it; otherwise mint as active
    if (availableUnit) {
      const patch = {
        status: 'active',
        siteId: req.siteId,
        clientId: req.clientId,
        operatorId: null,
        checkIn: req.requestedStart || format(s.today, 'yyyy-MM-dd'),
        expectedReturn,
        avgEngineHoursPerDay: 0,
        avgIdleHoursPerDay: 0,
        returnRequested: false,
      }
      set((state) => ({
        equipment: state.equipment.map((e) => (e.id === availableUnit.id ? { ...e, ...patch } : e)),
        requests: state.requests.map((r) =>
          r.id === requestId ? { ...r, status: 'approved', equipmentId: unitId, dealerNotes: `Allocated unit ${unitId}` } : r,
        ),
      }))
    } else {
      const newEquipment = {
        id: unitId,
        type: req.requestedType,
        tier: req.requestedTier || 'Heavy Duty',
        catalogId: req.requestedCatalogId || 'CAT-01',
        status: 'active',
        siteId: req.siteId,
        clientId: req.clientId,
        operatorId: null,
        checkIn: req.requestedStart || format(s.today, 'yyyy-MM-dd'),
        expectedReturn,
        avgEngineHoursPerDay: 0,
        avgIdleHoursPerDay: 0,
        returnRequested: false,
      }
      set((state) => ({
        equipment: [...state.equipment, newEquipment],
        requests: state.requests.map((r) =>
          r.id === requestId ? { ...r, status: 'approved', equipmentId: unitId, dealerNotes: `Allocated unit ${unitId}` } : r,
        ),
      }))
    }

    // Instantly dispatch notification to the client portal
    get().addNotification({
      clientId: req.clientId,
      type: 'order_approved',
      title: 'Rental Request Approved by Dealer',
      body: `Your request ${requestId} for ${req.requestedTier} ${req.requestedType} was approved. Unit ${unitId} is dispatched to your site (Return: ${expectedReturn}).`,
      severity: 'good',
      relatedId: unitId,
    })

    get().pushToast(`Request ${requestId} approved & unit ${unitId} dispatched!`, 'good')
  },

  rejectRentalRequest: async (requestId, reason = 'Equipment currently unavailable') => {
    const s = get()
    const req = s.requests.find((r) => r.id === requestId)

    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === requestId ? { ...r, status: 'rejected', dealerNotes: reason } : r,
      ),
    }))

    if (req) {
      get().addNotification({
        clientId: req.clientId,
        type: 'order_rejected',
        title: 'Rental Request Declined',
        body: `Your request ${requestId} for ${req.requestedTier} ${req.requestedType} was declined by dealer. Reason: "${reason}".`,
        severity: 'critical',
        relatedId: requestId,
      })
    }

    get().pushToast(`Request ${requestId} declined by provider`, 'warning')
  },

  cancelRentalRequest: async (requestId) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === requestId ? { ...r, status: 'cancelled' } : r,
      ),
    }))
    get().pushToast(`Request ${requestId} cancelled`, 'neutral')
  },
}))

