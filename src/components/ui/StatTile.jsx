const STRIPE = {
  good: 'var(--good)',
  warning: 'var(--warning)',
  serious: 'var(--serious)',
  critical: 'var(--critical)',
  neutral: 'var(--border-strong)',
}

export default function StatTile({ label, value, unit, hint, severity = 'neutral' }) {
  return (
    <div
      className="rounded-xl border pl-4 pr-5 py-4"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        borderLeft: `3px solid ${STRIPE[severity] ?? STRIPE.neutral}`,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="font-display text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-muted)' }}>
        {label}
      </div>
      <div className="tabular mt-1.5 flex items-baseline gap-1.5 font-data text-[26px] font-medium leading-none" style={{ color: 'var(--ink-primary)' }}>
        {value}
        {unit && <span className="text-sm font-normal" style={{ color: 'var(--ink-muted)' }}>{unit}</span>}
      </div>
      {hint && <div className="mt-1.5 text-xs" style={{ color: 'var(--ink-secondary)' }}>{hint}</div>}
    </div>
  )
}
