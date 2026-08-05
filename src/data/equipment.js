// Fleet roster. Two batches:
//  - "completed" rentals: the exact records from the original problem-statement
//    sample table — feed history/reports/forecasting, dates already closed out.
//  - "active" rentals: dated around SIM_TODAY (2026-08-05) so the live
//    dashboard's overdue / due-soon / anomaly logic has real states to show.
export const equipment = [
  // ── completed (historical) ──────────────────────────────────────────────
  {
    id: 'EQX-1001', type: 'Excavator', tier: 'Heavy', catalogId: 'CAT-EXC-H',
    status: 'completed', siteId: 'S003', clientId: 'C002', operatorId: 'OP101',
    checkIn: '2025-04-01', checkOut: '2025-04-16', rentalDays: 15,
    avgEngineHoursPerDay: 1.5, avgIdleHoursPerDay: 10,
  },
  {
    id: 'EQX-1002', type: 'Crane', tier: 'Mobile Standard', catalogId: 'CAT-CRN-S',
    status: 'completed', siteId: null, clientId: 'C003', operatorId: null,
    checkIn: '2025-03-10', checkOut: '2025-03-30', rentalDays: 20,
    avgEngineHoursPerDay: 0, avgIdleHoursPerDay: 11,
  },
  {
    id: 'EQX-1003', type: 'Bulldozer', tier: 'Heavy', catalogId: 'CAT-BLD-H',
    status: 'completed', siteId: 'S002', clientId: 'C001', operatorId: 'OP203',
    checkIn: '2025-02-15', checkOut: '2025-03-11', rentalDays: 25,
    avgEngineHoursPerDay: 7.5, avgIdleHoursPerDay: 0.5,
  },
  {
    id: 'EQX-1004', type: 'Excavator', tier: 'Compact', catalogId: 'CAT-EXC-C',
    status: 'completed', siteId: 'S004', clientId: 'C002', operatorId: 'OP106',
    checkIn: '2025-05-05', checkOut: '2025-05-15', rentalDays: 10,
    avgEngineHoursPerDay: 2, avgIdleHoursPerDay: 9,
  },
  {
    id: 'EQX-1005', type: 'Bulldozer', tier: 'Heavy', catalogId: 'CAT-BLD-H',
    status: 'completed', siteId: 'S006', clientId: 'C003', operatorId: 'OP301',
    checkIn: '2025-01-01', checkOut: '2025-01-31', rentalDays: 30,
    avgEngineHoursPerDay: 8, avgIdleHoursPerDay: 0,
  },
  {
    id: 'EQX-1006', type: 'Grader', tier: 'Standard', catalogId: 'CAT-GRD-S',
    status: 'completed', siteId: 'S001', clientId: 'C001', operatorId: 'OP114',
    checkIn: '2025-04-05', checkOut: '2025-04-23', rentalDays: 18,
    avgEngineHoursPerDay: 3, avgIdleHoursPerDay: 6,
  },
  {
    id: 'EQX-1007', type: 'Excavator', tier: 'Heavy', catalogId: 'CAT-EXC-H',
    status: 'completed', siteId: null, clientId: 'C002', operatorId: null,
    checkIn: '2025-03-20', checkOut: '2025-04-01', rentalDays: 12,
    avgEngineHoursPerDay: 0, avgIdleHoursPerDay: 12,
  },

  // ── active (live) ────────────────────────────────────────────────────────
  {
    id: 'EQX-2001', type: 'Excavator', tier: 'Heavy', catalogId: 'CAT-EXC-H',
    status: 'active', siteId: 'S001', clientId: 'C001', operatorId: 'OP101',
    checkIn: '2026-07-18', expectedReturn: '2026-08-20',
    avgEngineHoursPerDay: 7.2, avgIdleHoursPerDay: 0.8,
  },
  {
    id: 'EQX-2002', type: 'Crane', tier: 'Mobile Standard', catalogId: 'CAT-CRN-S',
    status: 'active', siteId: 'S002', clientId: 'C001', operatorId: null,
    checkIn: '2026-07-12', expectedReturn: '2026-08-02',
    avgEngineHoursPerDay: 0.4, avgIdleHoursPerDay: 9.1,
  },
  {
    id: 'EQX-2003', type: 'Bulldozer', tier: 'Heavy', catalogId: 'CAT-BLD-H',
    status: 'active', siteId: 'S001', clientId: 'C002', operatorId: 'OP203',
    checkIn: '2026-07-28', expectedReturn: '2026-08-25',
    avgEngineHoursPerDay: 6.5, avgIdleHoursPerDay: 1.0,
  },
  {
    id: 'EQX-2004', type: 'Excavator', tier: 'Compact', catalogId: 'CAT-EXC-C',
    status: 'active', siteId: 'S003', clientId: 'C002', operatorId: 'OP106',
    checkIn: '2026-08-01', expectedReturn: '2026-08-09',
    avgEngineHoursPerDay: 4.0, avgIdleHoursPerDay: 3.5,
  },
  {
    id: 'EQX-2005', type: 'Grader', tier: 'Standard', catalogId: 'CAT-GRD-S',
    status: 'active', siteId: 'S002', clientId: 'C003', operatorId: 'OP301',
    checkIn: '2026-07-10', expectedReturn: '2026-08-06',
    avgEngineHoursPerDay: 7.8, avgIdleHoursPerDay: 0.3,
  },
  {
    id: 'EQX-2006', type: 'Bulldozer', tier: 'Heavy', catalogId: 'CAT-BLD-H',
    status: 'active', siteId: 'S003', clientId: 'C003', operatorId: 'OP114',
    checkIn: '2026-07-20', expectedReturn: '2026-08-22',
    avgEngineHoursPerDay: 1.1, avgIdleHoursPerDay: 6.2,
  },
]

export const equipmentById = Object.fromEntries(equipment.map((e) => [e.id, e]))
export const activeEquipment = equipment.filter((e) => e.status === 'active')
export const completedEquipment = equipment.filter((e) => e.status === 'completed')
