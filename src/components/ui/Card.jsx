export default function Card({ title, action, children, className = '', bodyClassName = '' }) {
  return (
    <div
      className={`rounded-xl border ${className}`}
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b px-5 py-3.5" style={{ borderColor: 'var(--border)' }}>
          {title && (
            <h3 className="font-display text-[13px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--ink-secondary)' }}>
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      <div className={bodyClassName || 'p-5'}>{children}</div>
    </div>
  )
}
