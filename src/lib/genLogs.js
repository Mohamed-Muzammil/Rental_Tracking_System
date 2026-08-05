import { addDays, format } from 'date-fns'

// Deterministic (not random) daily usage generator — same output on every
// load so charts and derived alerts never jitter between reloads/demos.
export function genDailyLogs({ equipmentId, operatorId, startDate, days, baseEngine, baseIdle }) {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(new Date(startDate), i)
    const wobble = Math.sin(i * 1.3) * Math.min(0.6, baseEngine * 0.15)
    const engineHours = Math.max(0, +(baseEngine + wobble).toFixed(1))
    const idleHours = Math.max(0, +(baseIdle - wobble * 0.5).toFixed(1))
    return {
      equipmentId,
      operatorId,
      date: format(date, 'yyyy-MM-dd'),
      engineHours,
      idleHours,
      fuelUsageL: +(engineHours * 4.2).toFixed(1),
    }
  })
}
