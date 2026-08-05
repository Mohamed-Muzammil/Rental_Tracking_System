// Boundary layer between the app's camelCase objects and Supabase's
// snake_case rows, so nothing outside src/store/appStore.js needs to know
// the database column names.

export function rowToEquipment(r) {
  return {
    id: r.id,
    type: r.type,
    tier: r.tier,
    catalogId: r.catalog_id,
    status: r.status,
    siteId: r.site_id,
    clientId: r.client_id,
    operatorId: r.operator_id,
    checkIn: r.check_in,
    checkOut: r.check_out,
    expectedReturn: r.expected_return,
    rentalDays: r.rental_days,
    avgEngineHoursPerDay: r.avg_engine_hours_per_day,
    avgIdleHoursPerDay: r.avg_idle_hours_per_day,
    maintenanceNote: r.maintenance_note,
    expectedBackOn: r.expected_back_on,
    returnRequested: r.return_requested,
    qrCode: r.qr_code,
  }
}

// Partial-safe: only includes keys that are actually present on `e`, so this
// doubles as a patch builder for .update() calls.
export function equipmentToRow(e) {
  const map = {
    id: 'id',
    type: 'type',
    tier: 'tier',
    catalogId: 'catalog_id',
    status: 'status',
    siteId: 'site_id',
    clientId: 'client_id',
    operatorId: 'operator_id',
    checkIn: 'check_in',
    checkOut: 'check_out',
    expectedReturn: 'expected_return',
    rentalDays: 'rental_days',
    avgEngineHoursPerDay: 'avg_engine_hours_per_day',
    avgIdleHoursPerDay: 'avg_idle_hours_per_day',
    maintenanceNote: 'maintenance_note',
    expectedBackOn: 'expected_back_on',
    returnRequested: 'return_requested',
    qrCode: 'qr_code',
  }
  const row = {}
  for (const [jsKey, colKey] of Object.entries(map)) {
    if (jsKey in e) row[colKey] = e[jsKey] ?? null
  }
  return row
}

export function rowToUsageLog(r) {
  return {
    id: r.id,
    equipmentId: r.equipment_id,
    operatorId: r.operator_id,
    date: r.date,
    engineHours: r.engine_hours,
    idleHours: r.idle_hours,
    fuelUsageL: r.fuel_usage_l,
    location: r.location,
  }
}

export function usageLogToRow(l) {
  return {
    equipment_id: l.equipmentId,
    operator_id: l.operatorId ?? null,
    date: l.date,
    engine_hours: l.engineHours ?? 0,
    idle_hours: l.idleHours ?? 0,
    fuel_usage_l: l.fuelUsageL ?? 0,
    location: l.location ?? null,
  }
}

export function rowToIncident(r) {
  return {
    id: r.id,
    equipmentId: r.equipment_id,
    type: r.type,
    title: r.title,
    severity: r.severity,
    details: r.details,
    anomalyScore: r.anomaly_score,
    status: r.status,
    createdAt: r.created_at,
    resolution: r.resolution,
    resolutionNotes: r.resolution_notes,
  }
}

export function incidentToRow(i) {
  const map = {
    id: 'id',
    equipmentId: 'equipment_id',
    type: 'type',
    title: 'title',
    severity: 'severity',
    details: 'details',
    anomalyScore: 'anomaly_score',
    status: 'status',
    createdAt: 'created_at',
    resolution: 'resolution',
    resolutionNotes: 'resolution_notes',
  }
  const row = {}
  for (const [jsKey, colKey] of Object.entries(map)) {
    if (jsKey in i) row[colKey] = i[jsKey] ?? null
  }
  return row
}
