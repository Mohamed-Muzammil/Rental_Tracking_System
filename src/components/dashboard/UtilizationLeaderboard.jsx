import Card from '../ui/Card'

function Row({ entry, tone, rank }) {
  const { eq, util } = entry
  const barColor = tone === 'top' ? '#1d4ed8' : '#b45309'
  return (
    <tr className="border-t" style={{ borderColor: 'var(--border)' }}>
      <td className="w-6 px-5 py-2 text-[11px] font-semibold tabular" style={{ color: 'var(--ink-muted)' }}>
        #{rank}
      </td>
      <td className="py-2 pr-3">
        <div className="text-[13px] font-medium leading-tight" style={{ color: 'var(--ink-primary)' }}>{eq.id}</div>
        <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>{eq.type}</div>
      </td>
      <td className="py-2 pr-5 w-full">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-slate-100">
            <div
              className="h-full transition-all"
              style={{ width: `${Math.max(util, 2)}%`, background: barColor }}
            />
          </div>
          <span className="tabular shrink-0 text-right font-data text-xs font-semibold w-8" style={{ color: 'var(--ink-primary)' }}>
            {util}%
          </span>
        </div>
      </td>
    </tr>
  )
}

export default function UtilizationLeaderboard({ ranking }) {
  return (
    <div className="grid grid-cols-1 gap-px border border-slate-200 bg-slate-200 md:grid-cols-2">
      {/* Top Performers */}
      <div className="bg-white">
        <div className="border-b px-5 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-raised)' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
            Top Performers — Engine Utilization
          </span>
        </div>
        <table className="w-full">
          <tbody>
            {ranking.top.map((e, i) => (
              <Row key={e.eq.id} entry={e} tone="top" rank={i + 1} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Least Utilized */}
      <div className="bg-white">
        <div className="border-b px-5 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-raised)' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
            Under-utilized — Attention Required
          </span>
        </div>
        <table className="w-full">
          <tbody>
            {ranking.bottom.map((e, i) => (
              <Row key={e.eq.id} entry={e} tone="bottom" rank={i + 1} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
