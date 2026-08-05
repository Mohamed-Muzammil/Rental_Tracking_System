import { differenceInCalendarDays } from 'date-fns'
import { catalogById, catalogFor } from '../data/catalog'

export const UNDERUTILIZED_THRESHOLD = 0.3
export const CRITICAL_UTILIZATION = 0.1
export const DUE_SOON_DAYS = 5

export function utilizationOf(eq) {
  const total = eq.avgEngineHoursPerDay + eq.avgIdleHoursPerDay
  if (total === 0) return 0
  return eq.avgEngineHoursPerDay / total
}

export function returnStatus(eq, today) {
  if (eq.status !== 'active') return null
  const days = differenceInCalendarDays(new Date(eq.expectedReturn), today)
  if (days < 0) return { state: 'overdue', days: Math.abs(days) }
  if (days <= DUE_SOON_DAYS) return { state: 'due-soon', days }
  return { state: 'on-track', days }
}

// The rightsizing suggestion: same equipment type, a cheaper catalog tier
// whose usage range still covers what this rental is actually using.
export function recommendationFor(eq) {
  const current = catalogById[eq.catalogId]
  const cheaper = catalogFor(eq.type)
    .filter((c) => c.id !== eq.catalogId && c.dailyCost < current.dailyCost)
    .filter((c) => eq.avgEngineHoursPerDay <= c.maxUsageHrs + 0.5)
    .sort((a, b) => a.dailyCost - b.dailyCost)
  if (!cheaper.length) return null
  const best = cheaper[0]
  return { catalog: best, currentCost: current.dailyCost, dailySavings: current.dailyCost - best.dailyCost }
}

// Overall "health" of a rental, used for status chips across the app.
export function healthOf(eq, today) {
  const rs = returnStatus(eq, today)
  const util = utilizationOf(eq)
  if (rs?.state === 'overdue') return 'critical'
  if (!eq.operatorId && eq.status === 'active') return 'serious'
  if (util < CRITICAL_UTILIZATION) return 'serious'
  if (rs?.state === 'due-soon' || util < UNDERUTILIZED_THRESHOLD) return 'warning'
  return 'good'
}

export function buildAlerts(equipmentList, today) {
  const alerts = []
  for (const eq of equipmentList) {
    if (eq.status !== 'active') continue
    const rs = returnStatus(eq, today)

    if (rs.state === 'overdue') {
      alerts.push({
        id: `overdue-${eq.id}`,
        equipmentId: eq.id,
        type: 'overdue',
        severity: eq.operatorId ? 'serious' : 'critical',
        message: `${eq.id} — ${eq.tier} ${eq.type} is ${rs.days} day${rs.days === 1 ? '' : 's'} overdue`,
      })
    } else if (rs.state === 'due-soon') {
      alerts.push({
        id: `duesoon-${eq.id}`,
        equipmentId: eq.id,
        type: 'due-soon',
        severity: 'warning',
        message: `${eq.id} — return due in ${rs.days} day${rs.days === 1 ? '' : 's'}`,
      })
    }

    if (!eq.operatorId) {
      alerts.push({
        id: `unassigned-${eq.id}`,
        equipmentId: eq.id,
        type: 'anomaly',
        severity: 'serious',
        message: `${eq.id} — checked out with no operator assigned`,
      })
    }

    const util = utilizationOf(eq)
    if (util < UNDERUTILIZED_THRESHOLD) {
      alerts.push({
        id: `underutilized-${eq.id}`,
        equipmentId: eq.id,
        type: 'anomaly',
        severity: util < CRITICAL_UTILIZATION ? 'critical' : 'warning',
        message: `${eq.id} — utilization at ${Math.round(util * 100)}% (idle ${eq.avgIdleHoursPerDay}h/day)`,
      })

      const rec = recommendationFor(eq)
      if (rec) {
        alerts.push({
          id: `recommend-${eq.id}`,
          equipmentId: eq.id,
          type: 'recommendation',
          severity: 'info',
          message: `${eq.id} — switch to ${rec.catalog.tier} ${eq.type} to save $${rec.dailySavings}/day`,
          recommendation: rec,
        })
      }
    }
  }
  return alerts
}
