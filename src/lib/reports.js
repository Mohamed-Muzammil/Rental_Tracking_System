import { siteById } from '../data/sites'

// Aggregates for the "usage per site / downtime" report card.
export function usageBySite(activeEquipment) {
  const bySite = new Map()
  for (const eq of activeEquipment) {
    const key = eq.siteId ?? '__unassigned__'
    if (!bySite.has(key)) {
      bySite.set(key, { siteId: eq.siteId, name: eq.siteId ? siteById[eq.siteId]?.name : 'Unassigned', units: 0, engineHours: 0, idleHours: 0 })
    }
    const row = bySite.get(key)
    row.units += 1
    row.engineHours += eq.avgEngineHoursPerDay
    row.idleHours += eq.avgIdleHoursPerDay
  }
  return [...bySite.values()].sort((a, b) => b.engineHours - a.engineHours)
}

export function totalRentedHours(activeEquipment) {
  return activeEquipment.reduce((sum, e) => sum + e.avgEngineHoursPerDay, 0)
}

export function totalDowntimeHours(activeEquipment) {
  return activeEquipment.reduce((sum, e) => sum + e.avgIdleHoursPerDay, 0)
}
