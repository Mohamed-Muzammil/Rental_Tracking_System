import { differenceInCalendarDays } from 'date-fns'
import { activeEquipment } from './equipment'
import { genDailyLogs } from '../lib/genLogs'
import { SIM_TODAY } from '../lib/clock'

// Daily usage logs for every active rental, from check-in through "today".
// This is what the utilization charts, reports, and the anomaly/recommendation
// rules all read from — completed rentals already carry their aggregate
// avgEngineHoursPerDay / avgIdleHoursPerDay directly on the equipment record.
export const usageLogs = activeEquipment.flatMap((eq) => {
  const days = Math.max(1, differenceInCalendarDays(SIM_TODAY, new Date(eq.checkIn)) + 1)
  return genDailyLogs({
    equipmentId: eq.id,
    operatorId: eq.operatorId,
    startDate: eq.checkIn,
    days,
    baseEngine: eq.avgEngineHoursPerDay,
    baseIdle: eq.avgIdleHoursPerDay,
  })
})

export function logsFor(equipmentId) {
  return usageLogs.filter((l) => l.equipmentId === equipmentId)
}
