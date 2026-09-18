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
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        padding: 'clamp(1.5rem, 4vw, 2rem) var(--section-px)',
        gap: '1rem',
      }}>
        {stats.map((stat, index) => (
          <div key={stat.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(1rem, 3vw, 3rem)',
          }}>
            <div style={{ textAlign: 'center' }}>
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
            {index < stats.length - 1 && (
              <div style={{
                width: '1px',
                height: '40px',
                backgroundColor: 'rgba(255,255,255,0.1)',
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default StatsBar
