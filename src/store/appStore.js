import { create } from 'zustand'
import { addDays, format } from 'date-fns'
import { equipment as seedEquipment } from '../data/equipment'
import { usageLogs as seedUsageLogs } from '../data/usageLogs'
import { SIM_TODAY } from '../lib/clock'

let toastId = 0

export const useAppStore = create((set, get) => ({
  role: null, // 'admin' | 'client'
  activeClientId: 'C001', // which client the Client dashboard is viewing
  selectedSiteId: 'ALL', // 'ALL' or specific siteId

  today: SIM_TODAY,
  equipment: seedEquipment.map((e) => ({ ...e })),
  usageLogs: [...seedUsageLogs],
  dismissedAlertIds: [],
  toasts: [],
  modalConfig: null,

  setRole: (role) => set({ role }),
  setActiveClientId: (activeClientId) => set({ activeClientId, selectedSiteId: 'ALL' }),
  setSelectedSiteId: (selectedSiteId) => set({ selectedSiteId }),

  openModal: (config) => set({ modalConfig: config }),
  closeModal: () => set({ modalConfig: null }),

  advanceDay: () =>
    set((s) => ({ today: addDays(s.today, 1) })),

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
    get().pushToast(`Batch Dispatch Verified: ${equipmentIds.length} units dispatched!`, 'good')
  },

  checkInEquipment: (equipmentId) => {
    set((s) => ({
      equipment: s.equipment.map((e) =>
        e.id === equipmentId
          ? { ...e, status: 'completed', checkOut: format(s.today, 'yyyy-MM-dd'), operatorId: null }
          : e,
      ),
    }))
    get().pushToast(`${equipmentId} checked in`, 'good')
  },
  checkIn: (equipmentId) => get().checkInEquipment(equipmentId),

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
      equipment: [...state.equipment, newEquipment]
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
        e.id === equipmentId
          ? { ...e, expectedReturn: format(s.today, 'yyyy-MM-dd') }
          : e
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
    get().pushToast(`${equipmentId} swapped to ${recommendation.catalog.tier} — saving $${recommendation.dailySavings}/day`, 'good')
  },
}))
