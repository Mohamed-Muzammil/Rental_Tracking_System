function Row({ entry, tone, rank }) {
  const { eq, util } = entry
  const barColor = tone === 'top' ? '#1d4ed8' : '#b45309'

  return (
    <tr className="border-t" style={{ borderColor: 'var(--border)' }}>
      <td className="w-7 px-4 py-2.5 text-[11px] font-semibold tabular" style={{ color: 'var(--ink-muted)' }}>
        #{rank}
      </td>
      <td className="py-2.5 pr-3 min-w-[90px]">
        <div className="text-[13px] font-medium leading-tight" style={{ color: 'var(--ink-primary)' }}>{eq.id}</div>
        <div className="text-[10px]" style={{ color: 'var(--ink-muted)' }}>{eq.type}</div>
      </td>
      <td className="py-2.5 pr-4 w-full">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(util, 2)}%`, background: barColor }}
            />
          </div>
          <span className="tabular shrink-0 font-data text-xs font-semibold w-8 text-right" style={{ color: 'var(--ink-primary)' }}>
            {util}%
          </span>
        </div>
      </td>
    </tr>
  )
}

export default function UtilizationLeaderboard({ ranking }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {/* Top Performers */}
      <div
        className="bg-white"
        style={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="border-b px-5 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-raised)', borderRadius: '8px 8px 0 0' }}>
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
      <div
        className="bg-white"
        style={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="border-b px-5 py-3" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-raised)', borderRadius: '8px 8px 0 0' }}>
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
