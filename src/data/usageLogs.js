import { differenceInCalendarDays } from 'date-fns'
import { activeEquipment } from './equipment.js'
import { genDailyLogs } from '../lib/genLogs.js'
import { SIM_TODAY } from '../lib/clock.js'

// Two units are seeded to misbehave so the geofence and fuel rules have
// something real to catch on first load. Everything else logs normally.
const SEEDED_ANOMALIES = {
  'EQX-2025': { driftKm: 18.5 }, // wanders 18.5km to Tambaram Railway Yard
  'EQX-2003': { driftKm: 18.5 }, // wanders 18.5km to Tambaram Railway Yard
  'EQX-2016': { fuelFactor: 1.8 }, // burning ~80% more fuel per engine hour than expected
}

// Daily usage logs for every active rental, from check-in through "today".
// This is what the utilization charts, reports, and the anomaly/recommendation
// rules all read from — completed rentals already carry their aggregate
// avgEngineHoursPerDay / avgIdleHoursPerDay directly on the equipment record.
export const usageLogs = activeEquipment.flatMap((eq) => {
  const days = Math.max(1, differenceInCalendarDays(SIM_TODAY, new Date(eq.checkIn)) + 1)
  return genDailyLogs({
    equipmentId: eq.id,
    operatorId: eq.operatorId,
    siteId: eq.siteId,
    startDate: eq.checkIn,
    days,
    baseEngine: eq.avgEngineHoursPerDay,
    baseIdle: eq.avgIdleHoursPerDay,
    ...(SEEDED_ANOMALIES[eq.id] ?? {}),
  })
})

export function logsFor(equipmentId) {
  return usageLogs.filter((l) => l.equipmentId === equipmentId)
}

/** Most recent log per equipment id — what the anomaly rules evaluate. */
export function latestLogByEquipment(logs) {
  const latest = {}
  for (const log of logs) {
    if (!latest[log.equipmentId] || log.date > latest[log.equipmentId].date) {
      latest[log.equipmentId] = log
    }
  }
  return latest
}
