// Smoothed-trend projection — deliberately not ML, just enough to demonstrate
// the "demand forecasting" outcome from the brief.
//
// Projects from the LAST observed value plus a slope averaged over the window,
// rather than from the window's mean: a plain moving average lags a rising
// series badly enough that a clear upward trend reads as "flat".
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
    const last = window[window.length - 1]
    const trend = (last - window[0]) / Math.max(1, window.length - 1)
    const next = Math.max(0, Math.round(last + trend))
    lastMonth = shiftMonth(lastMonth, 1)
    points.push({ month: lastMonth, actual: null, forecast: next })
    window = [...window.slice(1), next]
  }

  return points
}
