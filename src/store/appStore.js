import { create } from 'zustand'
import { addDays, format } from 'date-fns'
import { SIM_TODAY } from '../lib/clock'
import { pointNearSite } from '../lib/geo'
import { clientById } from '../data/clients'

let toastId = 0

const seedIncidents = [
  {
    id: 'INC-101',
    equipmentId: 'EQX-2003',
    type: 'geofence_breach',
    title: 'Outside Assigned Site (Geofence Violation)',
    severity: 'critical',
    details: 'EQX-2003 Heavy Excavator operating 4.2 km outside assigned Summit Mine bounds.',
    anomalyScore: 92,
    status: 'active',
    createdAt: '2026-08-05 14:20',
  },
  {
    id: 'INC-102',
    equipmentId: 'EQX-2007',
    type: 'excessive_idle',
    title: 'Excessive Engine Idle Hours',
    severity: 'medium',
    details: 'EQX-2007 Standard Crane logged 6.5h idle time with 1.2h engine runtime.',
    anomalyScore: 78,
    status: 'active',
    createdAt: '2026-08-05 11:45',
  },
  {
    id: 'INC-103',
    equipmentId: 'EQX-2012',
    type: 'unauthorized_operator',
    title: 'Unauthorized Operator Scan',
    severity: 'high',
    details: 'Operator ID OP-994 is not cleared for Heavy Duty Bulldozer EQX-2012.',
    anomalyScore: 88,
    status: 'active',
    createdAt: '2026-08-04 16:10',
  },
  {
    id: 'INC-104',
    equipmentId: 'EQX-2019',
    type: 'service_limit_exceeded',
    title: '500-Hour Service Maintenance Required',
    severity: 'warning',
    details: 'Total engine runtime reached 512.4 hrs. Hydraulic fluid service overdue.',
    anomalyScore: 65,
    status: 'active',
    createdAt: '2026-08-04 09:30',
  },
]

export const useAppStore = create((set, get) => ({
  role: null, // 'admin' | 'client'
  activeClientId: 'C001', // which client the Client dashboard is viewing
  selectedSiteId: 'ALL', // 'ALL' or specific siteId

  today: SIM_TODAY,
  equipment: [],
  usageLogs: [],
  misuseIncidents: [],
  mlForecast: null,
  dismissedAlertIds: [],
  toasts: [],
  modalConfig: null,

  setRole: (role) => set({ role }),
  setActiveClientId: (activeClientId) => set({ activeClientId, selectedSiteId: 'ALL' }),
  setSelectedSiteId: (selectedSiteId) => set({ selectedSiteId }),

  initializeStore: async () => {
    try {
      const [eqRes, logsRes, alertsRes, mlRes] = await Promise.all([
        fetch('http://localhost:8000/api/equipment'),
        fetch('http://localhost:8000/api/usage-logs'),
        fetch('http://localhost:8000/api/incidents'),
        fetch('http://localhost:8000/api/ml/forecast')
      ])
      const [equipment, usageLogs, misuseIncidents, mlForecast] = await Promise.all([
        eqRes.json(), logsRes.json(), alertsRes.json(), mlRes.json()
      ])
      set({ equipment, usageLogs, misuseIncidents, mlForecast })
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

  registerEquipment: async ({ id, type, tier, dailyCost, qrCode }) => {
    const newEq = {
      id: id || `EQX-${Math.floor(2030 + Math.random() * 100)}`,
      type: type || 'Excavator',
      tier: tier || 'Heavy Duty',
      catalog_id: 'CAT-EXC-01',
      status: 'completed',
      site_id: null,
      client_id: null,
      operator_id: null,
      check_in: null,
      expected_return: null,
      avg_engine_hours_per_day: 0,
      avg_idle_hours_per_day: 0,
    }

    try {
      const res = await fetch('http://localhost:8000/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEq)
      })
      if (!res.ok) throw new Error('Backend rejection')
      const savedEq = await res.json()
      set((s) => ({ equipment: [savedEq, ...s.equipment] }))
      get().pushToast(`Registered ${savedEq.id} (${savedEq.tier} ${savedEq.type}) — Status: Available in Yard`, 'good')
    } catch (err) {
      console.error(err)
      get().pushToast(`Failed to register equipment`, 'critical')
    }
  },

  // Hold / Reservation Step
  reserveEquipmentOnHold: ({ equipmentIds, clientId, siteId }) => {
    const idSet = new Set(equipmentIds)
    set((state) => ({
      equipment: state.equipment.map((e) =>
        idSet.has(e.id) ? { ...e, status: 'hold', clientId, siteId } : e,
      ),
    }))
    get().pushToast(`${equipmentIds.length} units set to ON HOLD (Reserved for ${clientId})`, 'good')
  },

  checkOutEquipment: ({ equipmentId, siteId, clientId, operatorId, expectedReturn }) => {
    set((s) => ({
      equipment: s.equipment.map((e) =>
        e.id === equipmentId
          ? {
              ...e,
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
          : e,
      ),
    }))
    get().pushToast(`${equipmentId} checked out`, 'good')
  },

  batchCheckOutEquipment: ({ equipmentIds, siteId, clientId, expectedReturn }) => {
    const s = get()
    const idSet = new Set(equipmentIds)
    set((state) => ({
      equipment: state.equipment.map((e) =>
        idSet.has(e.id)
          ? {
              ...e,
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
          : e,
      ),
    }))
    get().pushToast(`Batch Dispatch Verified: ${equipmentIds.length} units checked out!`, 'good')
  },

  // QR Return & Condition Inspection
  inspectAndReturnEquipment: ({ equipmentId, condition, notes }) => {
    const s = get()
    const isDamaged = condition === 'damaged'
    const newStatus = isDamaged ? 'maintenance' : 'completed'

    set((state) => ({
      equipment: state.equipment.map((e) =>
        e.id === equipmentId
          ? {
              ...e,
              status: newStatus,
              checkOut: format(s.today, 'yyyy-MM-dd'),
              operatorId: null,
              returnRequested: false,
              maintenanceNote: isDamaged ? notes || 'Damaged upon return inspection' : null,
            }
          : e,
      ),
    }))

    if (isDamaged) {
      get().pushToast(`Returned ${equipmentId} marked DAMAGED → Sent to Workshop Maintenance`, 'critical')
    } else {
      get().pushToast(`Returned ${equipmentId} verified GOOD condition → Returned to Yard`, 'good')
    }
  },

  checkInEquipment: (equipmentId) => {
    get().inspectAndReturnEquipment({ equipmentId, condition: 'good', notes: 'Checked in' })
  },
  checkIn: (equipmentId) => get().checkInEquipment(equipmentId),

  issueFine: (equipmentId, amount) => {
    const s = get()
    const eq = s.equipment.find(e => e.id === equipmentId)
    
    if (eq && eq.clientId) {
      const client = clientById[eq.clientId]
      if (client) {
        client.fineAmount = (client.fineAmount || 0) + (amount || 25000)
        client.billingHistory = client.billingHistory || []
        client.billingHistory.unshift({
          id: `FINE-${equipmentId}-${Date.now().toString().slice(-4)}`,
          date: format(s.today, 'yyyy-MM-dd'),
          amount: amount || 25000,
          status: 'overdue' // Default to overdue for fines to make them visible
        })
      }
    }
    
    set((state) => ({
      equipment: state.equipment.map((e) =>
        e.id === equipmentId ? { ...e, finePending: true } : e
      ),
    }))
    get().pushToast(`Fine formally issued and pending for ${equipmentId}`, 'critical')
  },

  payInvoice: (clientId, invoiceId) => {
    const client = clientById[clientId]
    if (client) {
      const invoice = client.billingHistory.find(inv => inv.id === invoiceId)
      if (invoice && invoice.status !== 'paid') {
        invoice.status = 'paid'
        if (invoice.id.startsWith('FINE-')) {
          client.fineAmount = Math.max(0, (client.fineAmount || 0) - invoice.amount)
          client.paidFines = (client.paidFines || 0) + invoice.amount
        } else {
          client.overdueAmount = Math.max(0, (client.overdueAmount || 0) - invoice.amount)
        }
        set((state) => ({ ...state })) // Trigger a re-render for components observing the store (even though we mutated the client object)
        get().pushToast(`Invoice ${invoiceId} marked as paid`, 'good')
      }
    }
  },

  // Misuse Incident Engine
  resolveMisuseIncident: ({ incidentId, actionType, notes }) => {
    set((s) => ({
      misuseIncidents: s.misuseIncidents.map((inc) =>
        inc.id === incidentId
          ? { ...inc, status: 'resolved', resolution: actionType, resolutionNotes: notes }
          : inc,
      ),
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

  logUsage: ({ equipmentId, engineHours, idleHours, fuelUsageL, operatorId, location }) => {
    const s = get()
    const date = format(s.today, 'yyyy-MM-dd')
    // Fall back to the assigned site centre when no position is supplied, so a
    // log entry always carries a location for the geofence rule to test.
    const eq = s.equipment.find((e) => e.id === equipmentId)
    const resolvedLocation = location ?? pointNearSite(eq?.siteId, 0)
    set((state) => ({
      usageLogs: [
        ...state.usageLogs,
        { equipmentId, operatorId, date, engineHours, idleHours, fuelUsageL, location: resolvedLocation },
      ],
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
  rentFromCatalog: (catalogItem, siteId) => {
    const s = get()
    const dispatch = (id) => ({
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
      set((state) => ({
        equipment: state.equipment.map((e) =>
          e.id === availableUnit.id ? { ...e, ...dispatch(e.id) } : e,
        ),
      }))
      get().pushToast(`Allocated ${availableUnit.id} — ${catalogItem.tier} ${catalogItem.type} from yard stock`, 'good')
      return
    }

    const newId = `EQX-3${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    const newEquipment = {
      id: newId,
      type: catalogItem.type,
      tier: catalogItem.tier,
      catalogId: catalogItem.id,
      ...dispatch(newId),
    }
    set((state) => ({ equipment: [...state.equipment, newEquipment] }))
    get().pushToast(`No yard stock for ${catalogItem.tier} ${catalogItem.type} — ordered new unit ${newId}`, 'warning')
  },

  extendRental: (equipmentId, extraDays) => {
    set((s) => ({
      equipment: s.equipment.map((e) => {
        if (e.id !== equipmentId) return e
        const currentReturn = new Date(e.expectedReturn)
        const newReturn = format(addDays(currentReturn, extraDays), 'yyyy-MM-dd')
        return { ...e, expectedReturn: newReturn }
      }),
    }))
    get().pushToast(`Rental extended by ${extraDays} days for ${equipmentId}`, 'good')
  },

  // Flags the unit for the provider's queue rather than silently rewriting the
  // contract's expected-return date — that was overwriting real rental terms
  // with today's date. The provider now sees an explicit alert and actions it
  // through the normal check-in flow.
  requestReturn: (equipmentId) => {
    set((state) => ({
      equipment: state.equipment.map((e) =>
        e.id === equipmentId ? { ...e, returnRequested: true } : e,
      ),
    }))
    get().pushToast(`Return requested for ${equipmentId} — provider notified`, 'warning')
  },

  acceptRecommendation: (equipmentId, recommendation) => {
    set((s) => ({
      equipment: s.equipment.map((e) =>
        e.id === equipmentId
          ? { ...e, catalogId: recommendation.catalog.id, tier: recommendation.catalog.tier }
          : e,
      ),
    }))
    get().pushToast(
      `${equipmentId} swapped to ${recommendation.catalog.tier} — saving $${recommendation.dailySavings}/day`,
      'good',
    )
  },
}))
