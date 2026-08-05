const STRIPE = {
  good: '#16a34a',
  warning: '#ca8a04',
  serious: '#ea580c',
  critical: '#dc2626',
  neutral: '#cbd5e1',
}

export default function StatTile({ label, value, unit, hint, severity = 'neutral' }) {
  const stripeColor = STRIPE[severity] ?? STRIPE.neutral
  const hasAccent = severity !== 'neutral'

  return (
    <div
      className="relative flex flex-col justify-between rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      style={{
        borderColor: 'var(--border)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Left border accent line if non-neutral, or subtle left border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-xl"
        style={{
          backgroundColor: stripeColor,
          opacity: hasAccent ? 1 : 0.4,
        }}
      />

      <div className="pl-1">
        <div className="font-display text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-muted)' }}>
          {label}
        </div>

        <div className="tabular mt-2 flex items-baseline gap-1 font-data text-[28px] font-medium leading-none" style={{ color: 'var(--ink-primary)' }}>
          <span>{value}</span>
          {unit && <span className="text-xs font-normal text-slate-400 ml-0.5">{unit}</span>}
        </div>

        {hint && (
          <div className="mt-2 text-xs font-normal" style={{ color: 'var(--ink-secondary)' }}>
            {hint}
          </div>
        )}
      </div>
    </div>
  )
}

