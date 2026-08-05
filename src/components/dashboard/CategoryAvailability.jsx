import Card from '../ui/Card'

const LOW_AVAILABILITY = 25

// Inline stacked bar: rented / maintenance / available, in fixed order so the
// segments always mean the same thing across rows. 2px gaps between segments.
function StackBar({ row, width = 132 }) {
  const seg = (n) => (row.total === 0 ? 0 : (n / row.total) * 100)
  const parts = [
    { key: 'rented', pct: seg(row.rented), color: 'var(--series-engine)' },
    { key: 'maintenance', pct: seg(row.maintenance), color: 'var(--warning)' },
    { key: 'available', pct: seg(row.available), color: 'var(--border-strong)' },
  ].filter((p) => p.pct > 0)

  return (
    <div
      className="flex h-2 overflow-hidden rounded-full"
      style={{ width, background: 'var(--border)' }}
      title={`${row.rented} rented · ${row.maintenance} maintenance · ${row.available} available`}
    >
      {parts.map((p, i) => (
        <span key={p.key} className="h-full" style={{ width: `${p.pct}%`, background: p.color, marginLeft: i === 0 ? 0 : 2 }} />
      ))}
    </div>
  )
}

function Legend() {
  const items = [
    { label: 'Rented', color: 'var(--series-engine)' },
    { label: 'Maintenance', color: 'var(--warning)' },
    { label: 'Available', color: 'var(--border-strong)' },
  ]
  return (
    <div className="flex items-center gap-3">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-secondary)' }}>
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

export default function CategoryAvailability({ rows }) {
  return (
    <Card title="Equipment Availability by Category" action={<Legend />} bodyClassName="overflow-x-auto p-0">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="text-left" style={{ color: 'var(--ink-muted)' }}>
            <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Category</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Total</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Mix</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Avail</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Rented</th>
            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]">Maint</th>
            <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em]">Avail %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const low = row.availPct < LOW_AVAILABILITY
            return (
              <tr key={row.type} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="px-5 py-3 font-medium" style={{ color: 'var(--ink-primary)' }}>{row.type}</td>
                <td className="tabular px-3 py-3" style={{ color: 'var(--ink-secondary)' }}>{row.total}</td>
                <td className="px-3 py-3"><StackBar row={row} /></td>
                <td className="tabular px-3 py-3" style={{ color: 'var(--ink-primary)' }}>{row.available}</td>
                <td className="tabular px-3 py-3" style={{ color: 'var(--series-engine)' }}>{row.rented}</td>
                <td className="tabular px-3 py-3" style={{ color: row.maintenance ? 'var(--warning)' : 'var(--ink-muted)' }}>
                  {row.maintenance}
                </td>
                <td className="px-5 py-3 text-right">
                  <span
                    className="tabular inline-block rounded-md px-2 py-0.5 font-data text-sm font-medium"
                    style={{
                      background: low ? 'var(--warning-wash)' : 'transparent',
                      color: low ? 'var(--warning)' : 'var(--ink-primary)',
                    }}
                    title={low ? 'Low availability — under 25%' : undefined}
                  >
                    {row.availPct}%
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}
