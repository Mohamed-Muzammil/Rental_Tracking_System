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
      // Reserved units are allocated but not yet dispatched. Counting them
      // keeps the buckets summing to total — without this they vanish from
      // every column while still inflating the fleet count.
      const reserved = units.filter((e) => e.status === 'hold').length
      const total = units.length
      return {
        type,
        total,
        available,
        rented,
        reserved,
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

/**
 * Time utilisation — days on rent divided by days available. This is the
 * metric the rental industry actually manages the business by; the engine-hour
 * measure above answers a different question (is the machine working hard
 * while it is out) and both are worth showing.
 */
export function timeUtilization(equipment) {
  const rentable = equipment.filter((e) => e.status !== 'maintenance').length
  if (rentable === 0) return 0
  const onRent = equipment.filter((e) => e.status === 'active').length
  return Math.round((onRent / rentable) * 100)
}

// Ranked utilization — top N performers and bottom N, for the leaderboard.
export function utilizationRanking(activeUnits, n = 5) {
  const ranked = [...activeUnits]
    .map((e) => ({ eq: e, util: Math.round(utilizationOf(e) * 100) }))
    .sort((a, b) => b.util - a.util)
  return { top: ranked.slice(0, n), bottom: ranked.slice(-n).reverse() }
}
