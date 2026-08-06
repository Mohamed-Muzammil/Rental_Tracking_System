import { addDays, format } from 'date-fns'
import { pointNearSite } from './geo.js'

export const FUEL_L_PER_ENGINE_HOUR = 4.2

// Deterministic (not random) daily usage generator — same output on every
// load so charts and derived alerts never jitter between reloads/demos.
//
// `driftKm` pushes the logged position away from the assigned site centre so a
// unit can be seeded outside its geofence; `fuelFactor` skews fuel burn away
// from the expected litres-per-engine-hour. Both default to normal behaviour.
export function genDailyLogs({
  equipmentId,
  operatorId,
  siteId,
  startDate,
  days,
  baseEngine,
  baseIdle,
  driftKm = 0,
  fuelFactor = 1,
}) {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(new Date(startDate), i)
    const wobble = Math.sin(i * 1.3) * Math.min(0.6, baseEngine * 0.15)
    const engineHours = Math.max(0, +(baseEngine + wobble).toFixed(1))
    const idleHours = Math.max(0, +(baseIdle - wobble * 0.5).toFixed(1))

    // A drifting unit walks further from the site each day rather than
    // teleporting, so the breach builds up the way a real one would.
    const dayDrift = driftKm === 0 ? 0 : (driftKm * (i + 1)) / days
    const jitterKm = Math.sin(i * 2.1) * 0.15

    return {
      equipmentId,
      operatorId,
      date: format(date, 'yyyy-MM-dd'),
      engineHours,
      idleHours,
      fuelUsageL: +(engineHours * FUEL_L_PER_ENGINE_HOUR * fuelFactor).toFixed(1),
      location: pointNearSite(siteId, dayDrift + jitterKm),
    }
  })
}
