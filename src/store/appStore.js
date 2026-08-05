import { create } from 'zustand'
import { addDays, format } from 'date-fns'
import { equipment as seedEquipment } from '../data/equipment'
import { usageLogs as seedUsageLogs } from '../data/usageLogs'
import { SIM_TODAY } from '../lib/clock'

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
  equipment: seedEquipment.map((e) => ({ ...e })),
  usageLogs: [...seedUsageLogs],
  misuseIncidents: [...seedIncidents],
  dismissedAlertIds: [],
  toasts: [],
  modalConfig: null,

  setRole: (role) => set({ role }),
  setActiveClientId: (activeClientId) => set({ activeClientId, selectedSiteId: 'ALL' }),
  setSelectedSiteId: (selectedSiteId) => set({ selectedSiteId }),

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

  // Admin registers new physical equipment with unique ID & QR Code
  registerEquipment: ({ id, type, tier, dailyCost, qrCode }) => {
    const newEq = {
      id: id || `EQX-${Math.floor(2030 + Math.random() * 100)}`,
      type: type || 'Excavator',
      tier: tier || 'Heavy Duty',
      catalogId: 'CAT-EXC-01',
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

    set((s) => ({ equipment: [newEq, ...s.equipment] }))
    get().pushToast(`Registered ${newEq.id} (${newEq.tier} ${newEq.type}) — Status: Available in Yard`, 'good')
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

  logUsage: ({ equipmentId, engineHours, idleHours, fuelUsageL, operatorId }) => {
    const s = get()
    const date = format(s.today, 'yyyy-MM-dd')
    set((state) => ({
      usageLogs: [
        ...state.usageLogs,
        { equipmentId, operatorId, date, engineHours, idleHours, fuelUsageL },
      ],
      equipment: state.equipment.map((e) =>
        e.id === equipmentId ? { ...e, avgEngineHoursPerDay: engineHours, avgIdleHoursPerDay: idleHours } : e,
      ),
    }))
    get().pushToast(`Usage logged for ${equipmentId}`, 'good')
  },

  rentFromCatalog: (catalogItem, siteId) => {
    const s = get()
    const newId = `EQX-3${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    const newEquipment = {
      id: newId,
      type: catalogItem.type,
      tier: catalogItem.tier,
      catalogId: catalogItem.id,
      status: 'active',
      siteId: siteId || 'S001',
      clientId: s.activeClientId,
      operatorId: null,
      checkIn: format(s.today, 'yyyy-MM-dd'),
      expectedReturn: format(addDays(s.today, 30), 'yyyy-MM-dd'),
      avgEngineHoursPerDay: 0,
      avgIdleHoursPerDay: 0,
    }

    set((state) => ({
      equipment: [...state.equipment, newEquipment],
    }))

    get().pushToast(`Successfully rented ${catalogItem.tier} ${catalogItem.type} (${newId})`, 'good')
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

  requestReturn: (equipmentId) => {
    const s = get()
    set((state) => ({
      equipment: state.equipment.map((e) =>
        e.id === equipmentId ? { ...e, expectedReturn: format(s.today, 'yyyy-MM-dd') } : e,
      ),
    }))
    get().pushToast(`Return dispatch scheduled for ${equipmentId}`, 'warning')
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
