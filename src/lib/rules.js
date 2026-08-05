import { differenceInCalendarDays } from 'date-fns'
import { catalogById, catalogFor } from '../data/catalog'
import { geofenceCheck } from './geo'
import { latestLogByEquipment } from '../data/usageLogs'
import { FUEL_L_PER_ENGINE_HOUR } from './genLogs'

export const UNDERUTILIZED_THRESHOLD = 0.3
export const CRITICAL_UTILIZATION = 0.1
export const DUE_SOON_DAYS = 5

// Fuel burn is flagged when litres-per-engine-hour strays this far from the
// expected rate. Only evaluated above a minimum runtime — on a machine that
// barely moved, the ratio is dominated by noise.
export const FUEL_DEVIATION_THRESHOLD = 0.35
export const FUEL_MIN_ENGINE_HOURS = 1.0

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

/** Fuel burn versus the expected litres per engine hour for one log entry. */
export function fuelCheck(log) {
  if (!log || log.engineHours < FUEL_MIN_ENGINE_HOURS || log.fuelUsageL == null) return null
  const actualRate = log.fuelUsageL / log.engineHours
  const deviation = (actualRate - FUEL_L_PER_ENGINE_HOUR) / FUEL_L_PER_ENGINE_HOUR
  return {
    actualRate,
    expectedRate: FUEL_L_PER_ENGINE_HOUR,
    deviation,
    anomalous: Math.abs(deviation) > FUEL_DEVIATION_THRESHOLD,
  }
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

// `usageLogs` is optional so existing callers keep working; pass it in to
// enable the location and fuel rules, which are derived from the latest log.
export function buildAlerts(equipmentList, today, usageLogs = []) {
  const alerts = []
  const latestLog = latestLogByEquipment(usageLogs)

  for (const eq of equipmentList) {
    if (eq.status !== 'active') continue
    const rs = returnStatus(eq, today)

    if (eq.returnRequested) {
      alerts.push({
        id: `returnreq-${eq.id}`,
        equipmentId: eq.id,
        type: 'return-request',
        severity: 'info',
        message: `${eq.id} — customer has requested collection`,
      })
    }

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

    // Location and fuel rules read the unit's most recent telemetry log.
    const log = latestLog[eq.id]

    const fence = geofenceCheck(log?.location, eq.siteId)
    if (fence?.breach) {
      alerts.push({
        id: `geofence-${eq.id}`,
        equipmentId: eq.id,
        type: 'anomaly',
        severity: fence.overshootKm > 2 ? 'critical' : 'serious',
        message: `${eq.id} — ${fence.overshootKm.toFixed(1)} km outside ${fence.site.name} boundary`,
      })
    }

    const fuel = fuelCheck(log)
    if (fuel?.anomalous) {
      const pct = Math.round(Math.abs(fuel.deviation) * 100)
      alerts.push({
        id: `fuel-${eq.id}`,
        equipmentId: eq.id,
        type: 'anomaly',
        severity: 'warning',
        message: `${eq.id} — fuel burn ${pct}% ${fuel.deviation > 0 ? 'above' : 'below'} expected (${fuel.actualRate.toFixed(1)} L/hr)`,
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
