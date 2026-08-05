import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'

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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.map((cat) => {
          const meta = ASSET_META[cat.type]
          return (
            <Link
              key={cat.type}
              to={`/admin/equipment?type=${cat.type}`}
              className="group flex flex-col items-center justify-center rounded-2xl border transition-all hover:-translate-y-1"
              style={{
                background: '#ffffff',
                borderColor: 'var(--border)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                padding: '24px 12px',
              }}
            >
              <div className="relative mb-4 h-24 w-28 sm:h-28 sm:w-32">
                <img
                  src={meta?.image}
                  alt={cat.type}
                  className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
                  style={{ 
                    mixBlendMode: 'multiply',
                    filter: 'contrast(1.15) brightness(1.08)' 
                  }}
                />
                {/* Floor shadow simulation */}
                <div className="absolute -bottom-1 left-1/2 h-1 w-3/4 -translate-x-1/2 rounded-[100%] bg-black/10 blur-sm" />
              </div>
              <h3 className="text-center font-display text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                {cat.type}
              </h3>
              <p className="mt-1 text-center text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                {cat.rented} / {cat.total} units consumed
              </p>
            </Link>
          )
        })}

        {/* View All Card */}
        <Link
          to="/admin/equipment"
          className="group flex flex-col items-center justify-center rounded-2xl border border-dashed transition-all hover:-translate-y-1 hover:border-blue-400 hover:bg-blue-50/30"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-strong)',
            padding: '24px 12px',
          }}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
            <Icon name="chevronRight" size={28} />
          </div>
          <h3 className="text-center font-display text-sm font-bold text-slate-900">
            View All Categories
          </h3>
          <p className="mt-1 text-center text-xs font-medium text-slate-500">
            Explore full fleet roster →
          </p>
        </Link>
      </div>
  )
}
