import { equipmentTypes } from '../data/demandHistory'
import { utilizationOf } from './rules'

// Per-category availability rollup — drives the dashboard's category table.
export function categorySummary(equipment) {
  return equipmentTypes
    .map((type) => {
      const units = equipment.filter((e) => e.type === type)
      const available = units.filter((e) => e.status === 'completed').length
      const rented = units.filter((e) => e.status === 'active').length
      const maintenance = units.filter((e) => e.status === 'maintenance').length
      const total = units.length
      return {
        type,
        total,
        available,
        rented,
        maintenance,
        availPct: total === 0 ? 0 : Math.round((available / total) * 100),
      }
    })
    .filter((row) => row.total > 0)
}

// Fleet-wide utilization: share of engine hours out of all logged hours
// across everything currently on rent.
export function fleetUtilization(activeUnits) {
  const engine = activeUnits.reduce((s, e) => s + e.avgEngineHoursPerDay, 0)
  const idle = activeUnits.reduce((s, e) => s + e.avgIdleHoursPerDay, 0)
  if (engine + idle === 0) return 0
  return Math.round((engine / (engine + idle)) * 100)
}

// Ranked utilization — top N performers and bottom N, for the leaderboard.
export function utilizationRanking(activeUnits, n = 5) {
  const ranked = [...activeUnits]
    .map((e) => ({ eq: e, util: Math.round(utilizationOf(e) * 100) }))
    .sort((a, b) => b.util - a.util)
  return { top: ranked.slice(0, n), bottom: ranked.slice(-n).reverse() }
}
