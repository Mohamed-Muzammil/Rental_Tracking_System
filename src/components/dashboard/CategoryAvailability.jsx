import { Link } from 'react-router-dom'

const ASSET_META = {
  Excavator: { image: '/equipment/excavator.png' },
  Bulldozer: { image: '/equipment/bulldozer.png' },
  Crane: { image: '/equipment/crane.png' },
  Grader: { image: '/equipment/grader.png' },
  Forklift: { image: '/equipment/forklift.png' },
  Loader: { image: '/equipment/loader.png' },
  Roller: { image: '/equipment/roller.png' },
}

export default function CategoryAvailability({ categories }) {
  return (
    <div className="grid grid-cols-2 gap-px border border-slate-200 bg-slate-200 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
      {categories.map((cat) => {
        const meta = ASSET_META[cat.type]
        const pct = cat.total ? Math.round((cat.rented / cat.total) * 100) : 0
        return (
          <Link
            key={cat.type}
            to={`/admin/equipment?type=${cat.type}`}
            className="group flex flex-col bg-white px-4 py-4 hover:bg-slate-50 transition-colors"
          >
            {/* Equipment image */}
            <div className="mb-3 flex h-16 items-center justify-center">
              {meta?.image ? (
                <img
                  src={meta.image}
                  alt={cat.type}
                  className="max-h-full max-w-full object-contain"
                  style={{ mixBlendMode: 'multiply', filter: 'contrast(1.1)' }}
                />
              ) : (
                <div className="h-12 w-12 rounded bg-slate-100" />
              )}
            </div>

            {/* Labels */}
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-muted)' }}>
              {cat.type}
            </div>
            <div className="tabular mt-1 font-data text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
              {cat.rented} / {cat.total}
              <span className="ml-1 text-[11px] font-normal" style={{ color: 'var(--ink-muted)' }}>rented</span>
            </div>

            {/* Utilization bar */}
            <div className="mt-2 h-1.5 w-full rounded-none bg-slate-100">
              <div
                className="h-full rounded-none transition-all"
                style={{
                  width: `${pct}%`,
                  background: pct >= 80 ? '#15803d' : pct >= 50 ? '#1d4ed8' : '#6b7280',
                }}
              />
            </div>
            <div className="mt-1 text-[10px]" style={{ color: 'var(--ink-muted)' }}>
              {pct}% deployed
            </div>
          </Link>
        )
      })}

      {/* View All */}
      <Link
        to="/admin/equipment"
        className="group flex flex-col items-center justify-center bg-white px-4 py-4 hover:bg-slate-50 transition-colors border-l-2 border-dashed border-slate-300"
      >
        <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
          View All
        </div>
        <div className="text-[10px] mt-1" style={{ color: 'var(--ink-muted)' }}>
          Full fleet roster →
        </div>
      </Link>
    </div>
  )
}
