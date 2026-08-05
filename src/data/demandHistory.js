export const equipmentTypes = ['Excavator', 'Bulldozer', 'Crane', 'Grader', 'Forklift', 'Loader', 'Roller']

const MONTHS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07']

// Monthly rental counts per type — the input to the moving-average forecast.
// Shapes are deliberately varied: climbing, flat, declining, seasonal.
const SERIES = {
  Excavator: [5, 6, 6, 8, 9, 10, 12], // steady climb — strongest demand
  Bulldozer: [7, 6, 8, 7, 8, 7, 8], // flat
  Crane: [6, 5, 5, 4, 3, 3, 2], // declining — matches the low-utilization signal
  Grader: [2, 2, 3, 4, 5, 5, 4], // seasonal mid-year bump
  Forklift: [4, 5, 5, 6, 6, 7, 9], // climbing
  Loader: [3, 4, 4, 3, 4, 5, 5], // gentle climb
  Roller: [2, 3, 4, 5, 4, 3, 3], // peaked and easing
}

export const demandHistory = Object.entries(SERIES).flatMap(([type, counts]) =>
  counts.map((rentals, i) => ({ month: MONTHS[i], type, rentals })),
)
