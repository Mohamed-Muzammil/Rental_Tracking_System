export default function Card({ title, action, children, className = '', bodyClassName = '' }) {
  return (
    <div
      className={`bg-white ${className}`}
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {(title || action) && (
        <div
          className="flex items-center justify-between gap-4 px-5 py-3"
          style={{
            borderBottom: '1px solid var(--border)',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            background: 'var(--bg-surface-raised)',
          }}
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
