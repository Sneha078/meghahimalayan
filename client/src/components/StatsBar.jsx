const stats = [
  { id: 1, number: 'Est. 2001', label: 'Serving Pokhara' },
  { id: 2, number: '20+', label: 'Premium Brands' },
  { id: 3, number: '500+', label: 'Happy Customers' },
  { id: 4, number: '1000+', label: 'Eyeglasses Sold' },
]

function StatsBar() {
  return (
    <div style={{
      backgroundColor: 'var(--color-navy)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: 'clamp(1.5rem, 4vw, 2rem) var(--section-px)',
      }}>
        {/* Mobile: 2x2 grid, Desktop: 4 in a row */}
        <div
          className="grid grid-cols-2 md:grid-cols-4"
          style={{ gap: '1.5rem 2rem', justifyItems: 'center' }}
        >
          {stats.map((stat, index) => (
            <div key={stat.id} style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--color-taupe)',
                fontSize: 'clamp(1.2rem, 3vw, 2rem)',
                fontWeight: '700',
                lineHeight: '1',
                marginBottom: '0.4rem',
              }}>
                {stat.number}
              </p>
              <p style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: 'var(--text-xs)',
                letterSpacing: '0.05em',
              }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StatsBar
