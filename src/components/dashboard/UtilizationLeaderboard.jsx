import Card from '../ui/Card'

function Row({ entry, tone }) {
  const { eq, util } = entry
  const color = tone === 'top' ? 'var(--series-engine)' : 'var(--warning)'
  return (
    <li className="flex items-center gap-3 px-5 py-2">
      <div className="min-w-[104px] shrink-0">
        <div className="text-sm font-medium leading-tight" style={{ color: 'var(--ink-primary)' }}>{eq.id}</div>
        <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>{eq.type}</div>
      </div>
      <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
        <span className="block h-full rounded-full" style={{ width: `${Math.max(util, 2)}%`, background: color }} />
      </div>
      <span className="tabular w-10 shrink-0 text-right font-data text-sm" style={{ color: 'var(--ink-primary)' }}>
        {util}%
      </span>
    </li>
  )
}

export default function UtilizationLeaderboard({ ranking }) {
  return (
    <Card title="Utilization Leaderboard" bodyClassName="p-0 pb-3">
      <div className="px-5 pt-3 pb-1 font-display text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-muted)' }}>
        Top performers
      </div>
      <ul>
        {ranking.top.map((e) => (
          <Row key={e.eq.id} entry={e} tone="top" />
        ))}
      </ul>

      <div
        className="mx-5 my-2 border-t pt-3 font-display text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}
      >
        Least utilized
      </div>
      <ul>
        {ranking.bottom.map((e) => (
          <Row key={e.eq.id} entry={e} tone="bottom" />
        ))}
      </ul>
    </Card>
  )
}
