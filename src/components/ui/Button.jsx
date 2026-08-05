const VARIANTS = {
  primary: { background: 'var(--accent)', color: 'var(--accent-ink)', border: '1px solid transparent' },
  secondary: { background: 'transparent', color: 'var(--ink-primary)', border: '1px solid var(--border-strong)' },
  ghost: { background: 'transparent', color: 'var(--ink-secondary)', border: '1px solid transparent' },
}

export default function Button({ variant = 'secondary', className = '', style, ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{ ...VARIANTS[variant], outlineColor: 'var(--accent)', ...style }}
      {...props}
    />
  )
}
