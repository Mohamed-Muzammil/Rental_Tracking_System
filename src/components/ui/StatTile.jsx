const SEVERITY_BORDER = {
  good:     '#15803d',
  warning:  '#b45309',
  serious:  '#c2410c',
  critical: '#b91c1c',
  neutral:  '#e5e7eb',
}

const SEVERITY_VALUE = {
  good:     '#15803d',
  warning:  '#b45309',
  serious:  '#c2410c',
  critical: '#b91c1c',
  neutral:  '#111827',
}

export default function StatTile({ label, value, unit, hint, severity = 'neutral' }) {
  const borderTop = SEVERITY_BORDER[severity] ?? SEVERITY_BORDER.neutral
  const valueColor = SEVERITY_VALUE[severity] ?? SEVERITY_VALUE.neutral
  const hasAccent = severity !== 'neutral'

  return (
    <div
      className="flex flex-col gap-2 bg-white p-5"
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        borderTop: `3px solid ${borderTop}`,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: 'var(--ink-muted)' }}
      >
        {label}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span
          className="tabular font-data text-[26px] font-semibold leading-none"
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

      {hint && (
        <div className="text-[12px]" style={{ color: 'var(--ink-muted)' }}>
          {hint}
        </div>
      )}
    </div>
  )
}
