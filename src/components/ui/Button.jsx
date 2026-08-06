const VARIANTS = {
  primary: {
    background: 'var(--accent)',
    color: 'var(--accent-ink)',
    border: '1px solid var(--accent)',
  },
  secondary: {
    background: 'var(--bg-surface)',
    color: 'var(--ink-primary)',
    border: '1px solid var(--border-strong)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--ink-secondary)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--critical)',
    color: '#ffffff',
    border: '1px solid var(--critical)',
  },
  warning: {
    background: 'var(--warning)',
    color: '#ffffff',
    border: '1px solid var(--warning)',
  },
}

export default function Button({ as: Tag = 'button', variant = 'secondary', className = '', style, ...props }) {
  return (
    <Tag
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold tracking-wide transition-all hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      style={{ ...VARIANTS[variant], outlineColor: 'var(--accent)', ...style }}
      {...props}
    />
  )
}
