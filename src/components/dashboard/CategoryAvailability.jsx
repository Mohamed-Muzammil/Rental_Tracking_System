import { Link } from 'react-router-dom'

const ASSET_META = {
  Excavator: { image: '/equipment/excavator.png' },
  Bulldozer: { image: '/equipment/bulldozer.png' },
  Crane:     { image: '/equipment/crane.png' },
  Grader:    { image: '/equipment/grader.png' },
  Forklift:  { image: '/equipment/forklift.png' },
  Loader:    { image: '/equipment/loader.png' },
  Roller:    { image: '/equipment/roller.png' },
}

export default function CategoryAvailability({ categories }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
      {categories.map((cat) => {
        const meta = ASSET_META[cat.type]
        const pct = cat.total ? Math.round((cat.rented / cat.total) * 100) : 0
        const barColor = pct >= 80 ? '#15803d' : pct >= 50 ? '#1d4ed8' : '#9ca3af'

        return (
          <Link
            key={cat.type}
            to={`/admin/equipment?type=${cat.type}`}
            className="group flex flex-col bg-white px-3 py-4 hover:shadow-md transition-shadow"
            style={{
              borderRadius: '8px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {/* Transparent-background image using mix-blend-mode */}
            <div
              className="mb-3 flex h-16 items-center justify-center overflow-hidden"
              style={{ background: '#ffffff' }}
            >
              {meta?.image ? (
                <img
                  src={meta.image}
                  alt={cat.type}
                  className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  style={{
                    mixBlendMode: 'multiply',
                    filter: 'contrast(1.05) saturate(1.1)',
                  }}
                />
              ) : (
                <div className="h-10 w-10 rounded bg-slate-100" />
              )}
            </div>

            {/* Type label */}
            <div
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--ink-muted)' }}
            >
              {cat.type}
            </div>

            {/* Count */}
            <div className="tabular mt-0.5 font-data text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
              {cat.rented}
              <span className="text-[11px] font-normal" style={{ color: 'var(--ink-muted)' }}>
                &nbsp;/ {cat.total} rented
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-1 w-full rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>
            <div className="mt-1 text-[10px]" style={{ color: 'var(--ink-muted)' }}>
              {pct}% deployed
            </div>
          </Link>
        )
      })}

      {/* View All card */}
      <Link
        to="/admin/equipment"
        className="group flex flex-col items-center justify-center bg-white px-3 py-4 hover:shadow-md transition-all"
        style={{
          borderRadius: '8px',
          border: '1px dashed #d1d5db',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <div
          className="mb-1 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--accent)' }}
        >
          View All
        </div>
        <div className="text-[10px]" style={{ color: 'var(--ink-muted)' }}>
          Full fleet roster →
        </div>
      </Link>
    </div>
  )
}
