import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border)', color: 'var(--ink-primary)' }}
    >
      <div className="mb-1 font-bold text-slate-800">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 my-0.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
          <span style={{ color: 'var(--ink-secondary)' }}>{p.name}:</span>
          <span className="tabular ml-auto font-mono font-bold">{p.value}h</span>
        </div>
      ))}
    </div>
  )
}

export default function UsageHistoryChart({ data, height = 220 }) {
  // Smart aggregation & scaling based on date range length
  const processedData = useMemo(() => {
    if (!data?.length) return []

    // If data length is <= 25 (approx 3-4 weeks), show daily
    if (data.length <= 25) {
      return data
    }

    // If 25 < data.length <= 90 (1 to 3 months), group by 7-day Weekly buckets
    if (data.length <= 90) {
      const weeks = []
      for (let i = 0; i < data.length; i += 7) {
        const chunk = data.slice(i, i + 7)
        const firstDate = chunk[0].date
        const lastDate = chunk[chunk.length - 1].date
        const avgEngine = +(chunk.reduce((sum, d) => sum + (d.engineHours || 0), 0) / chunk.length).toFixed(1)
        const avgIdle = +(chunk.reduce((sum, d) => sum + (d.idleHours || 0), 0) / chunk.length).toFixed(1)
        weeks.push({
          date: `${firstDate} - ${lastDate}`,
          engineHours: avgEngine,
          idleHours: avgIdle,
        })
      }
      return weeks
    }

    // If > 90 days (over 3 months), group by Month
    const monthMap = {}
    data.forEach((d) => {
      const monthKey = d.date.length >= 7 ? d.date.slice(0, 7) : d.date
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { engineHours: 0, idleHours: 0, count: 0 }
      }
      monthMap[monthKey].engineHours += d.engineHours || 0
      monthMap[monthKey].idleHours += d.idleHours || 0
      monthMap[monthKey].count += 1
    })

    return Object.keys(monthMap).map((m) => ({
      date: m,
      engineHours: +(monthMap[m].engineHours / monthMap[m].count).toFixed(1),
      idleHours: +(monthMap[m].idleHours / monthMap[m].count).toFixed(1),
    }))
  }, [data])

  if (!processedData?.length) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm" style={{ color: 'var(--ink-muted)' }}>
        No usage history available for selected period.
      </div>
    )
  }

  // Calculate dynamic bar size based on processed data length
  const maxBarSize = processedData.length > 20 ? 12 : processedData.length > 10 ? 18 : 26

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: processedData.length > 30 ? `${processedData.length * 24}px` : '100%', height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={processedData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }} barGap={3}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--ink-muted)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-strong)' }}
              minTickGap={20}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10, fill: 'var(--ink-muted)' }} tickLine={false} axisLine={false} width={28} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent-wash)' }} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--ink-secondary)', paddingTop: 4 }} />
            <Bar dataKey="engineHours" name="Engine hrs/day" fill="var(--series-engine)" radius={[3, 3, 0, 0]} maxBarSize={maxBarSize} />
            <Bar dataKey="idleHours" name="Idle hrs/day" fill="var(--series-idle)" radius={[3, 3, 0, 0]} maxBarSize={maxBarSize} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
