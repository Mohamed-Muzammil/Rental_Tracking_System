// Synthetic monthly rental-count history per equipment type, feeding the
// demand forecasting chart (simple moving-average projection over this).
export const demandHistory = [
  // Excavator — steady climb
  { month: '2026-01', type: 'Excavator', rentals: 5 },
  { month: '2026-02', type: 'Excavator', rentals: 6 },
  { month: '2026-03', type: 'Excavator', rentals: 6 },
  { month: '2026-04', type: 'Excavator', rentals: 8 },
  { month: '2026-05', type: 'Excavator', rentals: 9 },
  { month: '2026-06', type: 'Excavator', rentals: 10 },
  { month: '2026-07', type: 'Excavator', rentals: 12 },

  // Bulldozer — roughly flat
  { month: '2026-01', type: 'Bulldozer', rentals: 7 },
  { month: '2026-02', type: 'Bulldozer', rentals: 6 },
  { month: '2026-03', type: 'Bulldozer', rentals: 8 },
  { month: '2026-04', type: 'Bulldozer', rentals: 7 },
  { month: '2026-05', type: 'Bulldozer', rentals: 8 },
  { month: '2026-06', type: 'Bulldozer', rentals: 7 },
  { month: '2026-07', type: 'Bulldozer', rentals: 8 },

  // Crane — declining (matches the low-utilization signal we're flagging live)
  { month: '2026-01', type: 'Crane', rentals: 6 },
  { month: '2026-02', type: 'Crane', rentals: 5 },
  { month: '2026-03', type: 'Crane', rentals: 5 },
  { month: '2026-04', type: 'Crane', rentals: 4 },
  { month: '2026-05', type: 'Crane', rentals: 3 },
  { month: '2026-06', type: 'Crane', rentals: 3 },
  { month: '2026-07', type: 'Crane', rentals: 2 },

  // Grader — seasonal bump mid-year
  { month: '2026-01', type: 'Grader', rentals: 2 },
  { month: '2026-02', type: 'Grader', rentals: 2 },
  { month: '2026-03', type: 'Grader', rentals: 3 },
  { month: '2026-04', type: 'Grader', rentals: 4 },
  { month: '2026-05', type: 'Grader', rentals: 5 },
  { month: '2026-06', type: 'Grader', rentals: 5 },
  { month: '2026-07', type: 'Grader', rentals: 4 },
]

export const equipmentTypes = ['Excavator', 'Bulldozer', 'Crane', 'Grader']
