export default function UtilizationBar({ engineHours, idleHours, width = 84 }) {
  const total = engineHours + idleHours
  const enginePct = total === 0 ? 0 : (engineHours / total) * 100
  const idlePct = total === 0 ? 100 : 100 - enginePct

  return (
    <div
      className="inline-flex items-center gap-1.5"
      title={`Engine ${engineHours}h/day · Idle ${idleHours}h/day`}
    >
      <div className="flex h-1.5 overflow-hidden rounded-full" style={{ width, background: 'var(--border)' }}>
        {enginePct > 0 && (
          <span style={{ width: `${enginePct}%`, background: 'var(--series-engine)' }} className="h-full rounded-full" />
        )}
        {idlePct > 0 && enginePct > 0 && <span style={{ width: 2 }} />}
        {idlePct > 0 && (
          <span style={{ width: `${idlePct}%`, background: 'var(--series-idle)' }} className="h-full rounded-full" />
        )}
      </div>
      <span className="tabular font-data text-xs" style={{ color: 'var(--ink-muted)' }}>
        {Math.round(enginePct)}%
      </span>
    </div>
  )
}
