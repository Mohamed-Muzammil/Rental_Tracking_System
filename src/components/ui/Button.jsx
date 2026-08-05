const VARIANTS = {
  primary: {
    background: 'var(--accent)',
    color: '#ffffff',
    border: '1px solid var(--accent)',
  },
  secondary: {
    background: '#ffffff',
    color: 'var(--ink-primary)',
    border: '1px solid var(--border-strong)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--ink-secondary)',
    border: '1px solid transparent',
  },
  danger: {
    background: '#b91c1c',
    color: '#ffffff',
    border: '1px solid #b91c1c',
  },
}

export default function Button({ variant = 'secondary', className = '', style, ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold tracking-wide transition-all hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      style={{ ...VARIANTS[variant], outlineColor: 'var(--accent)', ...style }}
      {...props}
    />
  )
}
