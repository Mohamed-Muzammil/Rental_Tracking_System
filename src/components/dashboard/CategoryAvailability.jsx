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
            pct >= 80 ? 'var(--good)' : pct >= 50 ? 'var(--accent)' : 'var(--ink-faint)'

          return (
            <Link
              key={cat.type}
              to={`/admin/equipment?type=${cat.type}`}
              className="group flex flex-col"
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
                padding: '12px',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-lifted)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}
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
                  <div style={{ width: 40, height: 40, background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-sm)' }} />
                )}
              </div>

              {/* Label */}
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                {cat.type}
              </div>

              {/* Count */}
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                {cat.rented}
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-muted)' }}> / {cat.total} rented</span>
              </div>

              {/* Bar */}
              <div style={{ marginTop: 8, height: 4, width: '100%', borderRadius: 9999, background: 'var(--bg-surface-raised)' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 9999, background: barColor, transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 4 }}>{pct}% deployed</div>
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
            color: 'var(--accent)',
            background: 'var(--accent-wash)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 20px',
            textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          View All Categories →
        </Link>
      </div>
    </div>
  )
}
