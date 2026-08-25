const stats = [
  { id: 1, number: 'Est. 2001', label: 'Serving Pokhara' },
  { id: 2, number: '20+', label: 'Premium Brands' },
  { id: 3, number: '5,000+', label: 'Happy Customers' },
  { id: 4, number: '50,000+', label: 'Eyeglasses Sold' },
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
        padding: '2rem 5rem',
      }}>
        {stats.map((stat, index) => (
          <div key={stat.id} style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--color-taupe)',
                fontSize: '2rem',
                fontWeight: '700',
                lineHeight: '1',
                marginBottom: '0.4rem',
              }}>
                {stat.number}
              </p>
              <p style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: '0.78rem',
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