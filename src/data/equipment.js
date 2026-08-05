// Fleet roster — 40 units across 7 categories, in three states:
//   'completed'   → back in the yard, available to rent out again
//   'active'      → currently on rent with a client
//   'maintenance' → in the workshop, not rentable
//
// The EQX-10xx block is the original problem-statement sample table, kept
// verbatim (2025 dates) as rental history. Everything dated 2026 is live
// against SIM_TODAY (2026-08-05) so overdue / due-soon / idle / unassigned
// states are all true on first load.
export const equipment = [
  // ── completed / available — original problem-statement records ───────────
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

  // ── completed / available — additional yard stock ─────────────────────────
  {
    id: 'EQX-1008', type: 'Excavator', tier: 'Compact', catalogId: 'CAT-EXC-C',
    status: 'completed', siteId: 'S005', clientId: 'C004', operatorId: 'OP118',
    checkIn: '2026-05-02', checkOut: '2026-05-28', rentalDays: 26,
    avgEngineHoursPerDay: 3.4, avgIdleHoursPerDay: 2.1,
  },
  {
    id: 'EQX-1009', type: 'Grader', tier: 'Standard', catalogId: 'CAT-GRD-S',
    status: 'completed', siteId: 'S011', clientId: 'C005', operatorId: 'OP122',
    checkIn: '2026-06-01', checkOut: '2026-06-24', rentalDays: 23,
    avgEngineHoursPerDay: 5.8, avgIdleHoursPerDay: 1.4,
  },
  {
    id: 'EQX-1010', type: 'Forklift', tier: 'Standard', catalogId: 'CAT-FRK-S',
    status: 'completed', siteId: 'S010', clientId: 'C006', operatorId: 'OP131',
    checkIn: '2026-06-10', checkOut: '2026-07-02', rentalDays: 22,
    avgEngineHoursPerDay: 2.6, avgIdleHoursPerDay: 1.8,
  },
  {
    id: 'EQX-1011', type: 'Loader', tier: 'Compact', catalogId: 'CAT-LDR-C',
    status: 'completed', siteId: 'S001', clientId: 'C001', operatorId: 'OP140',
    checkIn: '2026-06-15', checkOut: '2026-07-09', rentalDays: 24,
    avgEngineHoursPerDay: 2.9, avgIdleHoursPerDay: 1.5,
  },
  {
    id: 'EQX-1012', type: 'Roller', tier: 'Single Drum', catalogId: 'CAT-RLR-S',
    status: 'completed', siteId: 'S002', clientId: 'C003', operatorId: 'OP145',
    checkIn: '2026-06-20', checkOut: '2026-07-14', rentalDays: 24,
    avgEngineHoursPerDay: 2.2, avgIdleHoursPerDay: 2.4,
  },

  // ── active — original live block ──────────────────────────────────────────
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

  // ── active — expanded fleet ───────────────────────────────────────────────
  {
    id: 'EQX-2007', type: 'Excavator', tier: 'Heavy', catalogId: 'CAT-EXC-H',
    status: 'active', siteId: 'S007', clientId: 'C004', operatorId: 'OP210',
    checkIn: '2026-07-22', expectedReturn: '2026-08-28',
    avgEngineHoursPerDay: 8.1, avgIdleHoursPerDay: 0.5,
  },
  {
    id: 'EQX-2008', type: 'Excavator', tier: 'Heavy', catalogId: 'CAT-EXC-H',
    status: 'active', siteId: 'S011', clientId: 'C005', operatorId: 'OP211',
    checkIn: '2026-07-15', expectedReturn: '2026-08-18',
    avgEngineHoursPerDay: 6.8, avgIdleHoursPerDay: 1.4,
  },
  {
    id: 'EQX-2009', type: 'Excavator', tier: 'Compact', catalogId: 'CAT-EXC-C',
    status: 'active', siteId: 'S005', clientId: 'C004', operatorId: 'OP212',
    checkIn: '2026-07-30', expectedReturn: '2026-08-08',
    avgEngineHoursPerDay: 3.2, avgIdleHoursPerDay: 4.1,
  },
  {
    id: 'EQX-2010', type: 'Excavator', tier: 'Compact', catalogId: 'CAT-EXC-C',
    status: 'active', siteId: 'S010', clientId: 'C006', operatorId: null,
    checkIn: '2026-07-08', expectedReturn: '2026-08-03',
    avgEngineHoursPerDay: 0.6, avgIdleHoursPerDay: 8.4,
  },
  {
    id: 'EQX-2011', type: 'Bulldozer', tier: 'Heavy', catalogId: 'CAT-BLD-H',
    status: 'active', siteId: 'S012', clientId: 'C002', operatorId: 'OP213',
    checkIn: '2026-07-19', expectedReturn: '2026-08-30',
    avgEngineHoursPerDay: 7.9, avgIdleHoursPerDay: 0.6,
  },
  {
    id: 'EQX-2012', type: 'Bulldozer', tier: 'Compact', catalogId: 'CAT-BLD-C',
    status: 'active', siteId: 'S006', clientId: 'C007', operatorId: 'OP214',
    checkIn: '2026-07-25', expectedReturn: '2026-08-09',
    avgEngineHoursPerDay: 2.2, avgIdleHoursPerDay: 5.8,
  },
  {
    id: 'EQX-2013', type: 'Crane', tier: 'Mobile Standard', catalogId: 'CAT-CRN-S',
    status: 'active', siteId: 'S009', clientId: 'C008', operatorId: 'OP215',
    checkIn: '2026-07-11', expectedReturn: '2026-08-24',
    avgEngineHoursPerDay: 5.9, avgIdleHoursPerDay: 1.1,
  },
  {
    id: 'EQX-2014', type: 'Crane', tier: 'Mini', catalogId: 'CAT-CRN-M',
    status: 'active', siteId: 'S008', clientId: 'C003', operatorId: 'OP216',
    checkIn: '2026-07-28', expectedReturn: '2026-08-07',
    avgEngineHoursPerDay: 2.6, avgIdleHoursPerDay: 1.2,
  },
  {
    id: 'EQX-2015', type: 'Grader', tier: 'Standard', catalogId: 'CAT-GRD-S',
    status: 'active', siteId: 'S011', clientId: 'C005', operatorId: 'OP217',
    checkIn: '2026-07-16', expectedReturn: '2026-08-21',
    avgEngineHoursPerDay: 6.4, avgIdleHoursPerDay: 1.0,
  },
  {
    id: 'EQX-2016', type: 'Forklift', tier: 'Heavy Duty', catalogId: 'CAT-FRK-H',
    status: 'active', siteId: 'S008', clientId: 'C006', operatorId: 'OP218',
    checkIn: '2026-07-20', expectedReturn: '2026-08-26',
    avgEngineHoursPerDay: 7.2, avgIdleHoursPerDay: 0.9,
  },
  {
    id: 'EQX-2017', type: 'Forklift', tier: 'Heavy Duty', catalogId: 'CAT-FRK-H',
    status: 'active', siteId: 'S010', clientId: 'C006', operatorId: 'OP219',
    checkIn: '2026-07-24', expectedReturn: '2026-08-19',
    avgEngineHoursPerDay: 6.1, avgIdleHoursPerDay: 1.6,
  },
  {
    id: 'EQX-2018', type: 'Forklift', tier: 'Standard', catalogId: 'CAT-FRK-S',
    status: 'active', siteId: 'S005', clientId: 'C004', operatorId: 'OP220',
    checkIn: '2026-07-31', expectedReturn: '2026-08-12',
    avgEngineHoursPerDay: 1.9, avgIdleHoursPerDay: 2.3,
  },
  {
    id: 'EQX-2019', type: 'Forklift', tier: 'Standard', catalogId: 'CAT-FRK-S',
    status: 'active', siteId: 'S007', clientId: 'C004', operatorId: null,
    checkIn: '2026-07-14', expectedReturn: '2026-08-16',
    avgEngineHoursPerDay: 0.9, avgIdleHoursPerDay: 7.1,
  },
  {
    id: 'EQX-2020', type: 'Loader', tier: 'Wheel', catalogId: 'CAT-LDR-W',
    status: 'active', siteId: 'S003', clientId: 'C007', operatorId: 'OP221',
    checkIn: '2026-07-21', expectedReturn: '2026-08-27',
    avgEngineHoursPerDay: 7.6, avgIdleHoursPerDay: 0.7,
  },
  {
    id: 'EQX-2021', type: 'Loader', tier: 'Wheel', catalogId: 'CAT-LDR-W',
    status: 'active', siteId: 'S012', clientId: 'C002', operatorId: 'OP222',
    checkIn: '2026-07-17', expectedReturn: '2026-08-23',
    avgEngineHoursPerDay: 5.4, avgIdleHoursPerDay: 2.1,
  },
  {
    id: 'EQX-2022', type: 'Loader', tier: 'Compact', catalogId: 'CAT-LDR-C',
    status: 'active', siteId: 'S001', clientId: 'C001', operatorId: 'OP223',
    checkIn: '2026-07-29', expectedReturn: '2026-08-10',
    avgEngineHoursPerDay: 2.8, avgIdleHoursPerDay: 1.4,
  },
  {
    id: 'EQX-2023', type: 'Roller', tier: 'Tandem', catalogId: 'CAT-RLR-T',
    status: 'active', siteId: 'S011', clientId: 'C005', operatorId: 'OP224',
    checkIn: '2026-07-23', expectedReturn: '2026-08-25',
    avgEngineHoursPerDay: 6.7, avgIdleHoursPerDay: 1.2,
  },
  {
    id: 'EQX-2024', type: 'Roller', tier: 'Single Drum', catalogId: 'CAT-RLR-S',
    status: 'active', siteId: 'S002', clientId: 'C003', operatorId: 'OP225',
    checkIn: '2026-07-27', expectedReturn: '2026-08-04',
    avgEngineHoursPerDay: 1.4, avgIdleHoursPerDay: 4.9,
  },

  // ── maintenance — in the workshop, not rentable ───────────────────────────
  {
    id: 'EQX-3001', type: 'Bulldozer', tier: 'Heavy', catalogId: 'CAT-BLD-H',
    status: 'maintenance', siteId: null, clientId: null, operatorId: null,
    maintenanceNote: 'Hydraulic seal replacement', expectedBackOn: '2026-08-11',
    avgEngineHoursPerDay: 0, avgIdleHoursPerDay: 0,
  },
  {
    id: 'EQX-3002', type: 'Crane', tier: 'Mobile Standard', catalogId: 'CAT-CRN-S',
    status: 'maintenance', siteId: null, clientId: null, operatorId: null,
    maintenanceNote: '500-hour service + boom inspection', expectedBackOn: '2026-08-14',
    avgEngineHoursPerDay: 0, avgIdleHoursPerDay: 0,
  },
  {
    id: 'EQX-3003', type: 'Forklift', tier: 'Heavy Duty', catalogId: 'CAT-FRK-H',
    status: 'maintenance', siteId: null, clientId: null, operatorId: null,
    maintenanceNote: 'Mast chain wear — parts on order', expectedBackOn: '2026-08-18',
    avgEngineHoursPerDay: 0, avgIdleHoursPerDay: 0,
  },
  {
    id: 'EQX-3004', type: 'Roller', tier: 'Tandem', catalogId: 'CAT-RLR-T',
    status: 'maintenance', siteId: null, clientId: null, operatorId: null,
    maintenanceNote: 'Drum vibration bearing', expectedBackOn: '2026-08-09',
    avgEngineHoursPerDay: 0, avgIdleHoursPerDay: 0,
  },
]

export const equipmentById = Object.fromEntries(equipment.map((e) => [e.id, e]))
export const activeEquipment = equipment.filter((e) => e.status === 'active')
export const completedEquipment = equipment.filter((e) => e.status === 'completed')
export const maintenanceEquipment = equipment.filter((e) => e.status === 'maintenance')
