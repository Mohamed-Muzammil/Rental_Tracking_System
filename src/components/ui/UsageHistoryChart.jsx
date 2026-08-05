import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border)', color: 'var(--ink-primary)' }}
    >
      <div className="mb-1 font-medium">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: 'var(--ink-secondary)' }}>{p.name}</span>
          <span className="tabular ml-auto font-medium">{p.value}h</span>
        </div>
      ))}
    </div>
  )
}

export default function UsageHistoryChart({ data, height = 220 }) {
  if (!data?.length) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm" style={{ color: 'var(--ink-muted)' }}>
        No usage history yet.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barGap={2}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--border-strong)' }} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} tickLine={false} axisLine={false} width={28} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent-wash)' }} />
        <Legend wrapperStyle={{ fontSize: 12, color: 'var(--ink-secondary)' }} />
        <Bar dataKey="engineHours" name="Engine hrs" fill="var(--series-engine)" radius={[3, 3, 0, 0]} maxBarSize={22} />
        <Bar dataKey="idleHours" name="Idle hrs" fill="var(--series-idle)" radius={[3, 3, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}
