export default function Card({ title, action, children, className = '', bodyClassName = '' }) {
  return (
    <div
      className={`border bg-white ${className}`}
      style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      {(title || action) && (
        <div
          className="flex items-center justify-between gap-4 border-b px-5 py-3"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-raised)' }}
        >
          {title && (
            <h3
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--ink-muted)', letterSpacing: '0.08em' }}
            >
              {title}
            </h3>
          )}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={bodyClassName || 'p-5'}>{children}</div>
    </div>
  )
}
