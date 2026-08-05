const SEVERITY_BORDER = {
  good:     '#15803d',
  warning:  '#b45309',
  serious:  '#c2410c',
  critical: '#b91c1c',
  neutral:  '#d1d5db',
}

const SEVERITY_VALUE_COLOR = {
  good:     '#15803d',
  warning:  '#b45309',
  serious:  '#c2410c',
  critical: '#b91c1c',
  neutral:  'var(--ink-primary)',
}

export default function StatTile({ label, value, unit, hint, severity = 'neutral' }) {
  const borderColor = SEVERITY_BORDER[severity] ?? SEVERITY_BORDER.neutral
  const valueColor  = SEVERITY_VALUE_COLOR[severity] ?? SEVERITY_VALUE_COLOR.neutral
  const hasAccent   = severity !== 'neutral'

  return (
    <div
      className="relative flex flex-col gap-2 bg-white border p-4"
      style={{
        borderColor: 'var(--border)',
        borderLeft: `3px solid ${borderColor}`,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Label */}
      <div
        className="text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: 'var(--ink-muted)', letterSpacing: '0.07em' }}
      >
        {label}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="tabular font-data text-2xl font-semibold leading-none"
          style={{ color: hasAccent ? valueColor : 'var(--ink-primary)' }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
            {unit}
          </span>
        )}
      </div>

      {/* Hint */}
      {hint && (
        <div className="text-[12px]" style={{ color: 'var(--ink-muted)' }}>
          {hint}
        </div>
      )}
    </div>
  )
}
