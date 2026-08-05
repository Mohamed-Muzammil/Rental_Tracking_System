import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'

const ASSET_META = {
  Excavator: {
    image: '/equipment/excavator.png',
    desc: 'Heavy-duty digging and earthmoving. Essential for site prep and trenching.',
  },
  Bulldozer: {
    image: '/equipment/bulldozer.png',
    desc: 'Powerful pushing and grading. Used for clearing land and rough grading.',
  },
  Crane: {
    image: '/equipment/crane.png',
    desc: 'Vertical lifting and material placement. Critical for high-rise steel or precast.',
  },
  Grader: {
    image: '/equipment/grader.png',
    desc: 'Precision leveling and surface finishing. Used heavily in road construction.',
  },
  Forklift: {
    image: '/equipment/forklift.png',
    desc: 'Material handling and pallet moving. Fast mobility around yards and sites.',
  },
  Loader: {
    image: '/equipment/loader.png',
    desc: 'Scooping and loading loose materials. High-capacity bucket operations.',
  },
  Roller: {
    image: '/equipment/roller.png',
    desc: 'Soil and asphalt compaction. Creates stable, flat foundations.',
  },
}

export default function CategoryAvailability({ categories }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((cat) => {
          const meta = ASSET_META[cat.type]
          return (
            <Link
              key={cat.type}
              to={`/admin/equipment?type=${cat.type}`}
              className="group flex flex-col overflow-hidden rounded-xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="relative h-32 w-full overflow-hidden bg-white p-2">
                <img
                  src={meta?.image}
                  alt={cat.type}
                  className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  {cat.type}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                  {meta?.desc}
                </p>
                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span style={{ color: 'var(--ink-muted)' }}>Consumed</span>
                    <span style={{ color: 'var(--ink-primary)' }}>{cat.rented} / {cat.total} units</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${cat.total > 0 ? (cat.rented / cat.total) * 100 : 0}%`,
                        background: 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
  )
}
