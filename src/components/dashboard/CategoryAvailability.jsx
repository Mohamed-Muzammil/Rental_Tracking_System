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
    <div className="flex flex-col gap-3">
      {/* Category cards row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {categories.map((cat) => {
          const meta = ASSET_META[cat.type]
          const pct  = cat.total ? Math.round((cat.rented / cat.total) * 100) : 0
          const barColor =
            pct >= 80 ? '#15803d' : pct >= 50 ? '#1d4ed8' : '#9ca3af'

          return (
            <Link
              key={cat.type}
              to={`/admin/equipment?type=${cat.type}`}
              className="group flex flex-col"
              style={{
                background: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                padding: '12px',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              {/* Image — white bg + multiply blend = transparent background effect */}
              <div
                style={{
                  background: '#ffffff',
                  height: '72px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  overflow: 'hidden',
                }}
              >
                {meta?.image ? (
                  <img
                    src={meta.image}
                    alt={cat.type}
                    style={{
                      maxHeight: '100%',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      mixBlendMode: 'multiply',   /* removes white bg pixels */
                      filter: 'contrast(1.05) saturate(1.1)',
                      transition: 'transform 0.25s',
                    }}
                    className="group-hover:scale-105"
                  />
                ) : (
                  <div style={{ width: 40, height: 40, background: '#f3f4f6', borderRadius: 4 }} />
                )}
              </div>

              {/* Label */}
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#6b7280' }}>
                {cat.type}
              </div>

              {/* Count */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                {cat.rented}
                <span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280' }}> / {cat.total} rented</span>
              </div>

              {/* Bar */}
              <div style={{ marginTop: 8, height: 4, width: '100%', borderRadius: 9999, background: '#f1f5f9' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 9999, background: barColor, transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>{pct}% deployed</div>
            </Link>
          )
        })}
      </div>

      {/* View All — centered below all cards */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4px' }}>
        <Link
          to="/admin/equipment"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 12,
            fontWeight: 600,
            color: '#1d4ed8',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            padding: '6px 20px',
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#dbeafe' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff' }}
        >
          View All Categories →
        </Link>
      </div>
    </div>
  )
}
