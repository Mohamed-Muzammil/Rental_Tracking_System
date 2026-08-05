import { create } from 'zustand'
import { addDays, format } from 'date-fns'
import { equipment as seedEquipment } from '../data/equipment'
import { usageLogs as seedUsageLogs } from '../data/usageLogs'
import { SIM_TODAY } from '../lib/clock'

let toastId = 0

export const useAppStore = create((set, get) => ({
  role: null, // 'admin' | 'client'
  activeClientId: 'C001', // which client the Client dashboard is viewing

  today: SIM_TODAY,
  equipment: seedEquipment.map((e) => ({ ...e })),
  usageLogs: [...seedUsageLogs],
  dismissedAlertIds: [],
  toasts: [],

  setRole: (role) => set({ role }),

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
