export default function UtilizationBar({ engineHours, idleHours, width = 80 }) {
  const total = engineHours + idleHours
  const enginePct = total === 0 ? 0 : Math.round((engineHours / total) * 100)

  return (
    <div
      className="inline-flex flex-col gap-0.5"
      title={`Engine ${Math.round(engineHours * 10) / 10}h/day · Idle ${Math.round(idleHours * 10) / 10}h/day`}
    >
      {/* Segmented bar */}
      <div className="flex h-1.5 overflow-hidden bg-slate-100" style={{ width }}>
        <div style={{ width: `${enginePct}%`, background: '#1d4ed8' }} />
        <div style={{ width: `${100 - enginePct}%`, background: '#d1d5db' }} />
      </div>
      {/* Labels */}
      <div className="flex justify-between text-[9px] font-medium" style={{ width, color: 'var(--ink-muted)' }}>
        <span className="tabular">{enginePct}% eng</span>
        <span className="tabular">{100 - enginePct}% idle</span>
      </div>
    </div>
  )
}
