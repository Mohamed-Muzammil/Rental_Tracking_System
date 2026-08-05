// Simple moving-average + trend projection — deliberately not ML, just
// enough to demonstrate the "demand forecasting" outcome from the brief.
function shiftMonth(monthStr, n) {
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function forecastSeries(type, history, monthsAhead = 2, windowSize = 3) {
  const rows = history.filter((h) => h.type === type).sort((a, b) => a.month.localeCompare(b.month))
  if (!rows.length) return []

  const points = rows.map((r) => ({ month: r.month, actual: r.rentals, forecast: null }))
  points[points.length - 1].forecast = points[points.length - 1].actual // connect the line

  let window = rows.slice(-windowSize).map((r) => r.rentals)
  let lastMonth = rows[rows.length - 1].month

  for (let i = 0; i < monthsAhead; i++) {
    const avg = window.reduce((a, b) => a + b, 0) / window.length
    const trend = (window[window.length - 1] - window[0]) / Math.max(1, window.length - 1)
    const next = Math.max(0, Math.round(avg + trend))
    lastMonth = shiftMonth(lastMonth, 1)
    points.push({ month: lastMonth, actual: null, forecast: next })
    window = [...window.slice(1), next]
  }

  return points
}
