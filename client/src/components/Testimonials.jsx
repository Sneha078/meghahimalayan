const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    location: 'Pokhara',
    rating: 5,
    comment: 'Amazing collection! I bought a Ray-Ban frame and the quality is outstanding. The staff was very helpful and the price was much better than other stores in Pokhara.',
    product: 'Ray-Ban Aviator',
  },
  {
    id: 2,
    name: 'Rohan Thapa',
    location: 'Kathmandu',
    rating: 5,
    comment: 'Mega Himalaya has the best watch collection in Nepal. Got a Titan watch for my father and he absolutely loves it. Will definitely come back.',
    product: 'Titan Chronograph',
  },
  {
    id: 3,
    name: 'Anisha Gurung',
    location: 'Pokhara',
    rating: 5,
    comment: 'Bought a Dior perfume as a gift. The packaging was beautiful and the fragrance is exactly as described. Very happy with the purchase!',
    product: 'Miss Dior',
  },
  {
    id: 4,
    name: 'Sagar Poudel',
    location: 'Butwal',
    rating: 4,
    comment: 'Great store with genuine international brands. The prices are very competitive and the staff knows their products well. Highly recommended.',
    product: 'Gucci Eyeglasses',
  },
]

function Testimonials() {
  return (
    <section style={{ backgroundColor: 'var(--color-white)', padding: '80px 5rem' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <p style={{
          color:         'var(--color-taupe)',
          fontSize:      '0.85rem',
          fontWeight:    '800',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom:  '12px',
        }}>
          CUSTOMER REVIEWS
        </p>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize:   '2.5rem',
          fontWeight: '700',
          color:      'var(--color-navy)',
          lineHeight: '1.2',
        }}>
          What Our Customers Say
        </h2>
      </div>

      {/* Cards grid */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap:                 '24px',
      }}>
        {testimonials.map(t => (
          <div
            key={t.id}
            style={{
              backgroundColor: 'var(--color-sbg)',
              borderRadius:    '16px',
              padding:         '32px',
              border:          '3px solid var(--color-border)',
              borderTop:       '3px solid var(--color-taupe)',
              boxShadow:       '0 4px 16px rgba(13,32,49,0.08)',
              transition:      'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-6px)'
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(13,32,49,0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(13,32,49,0.08)'
            }}
          >
            {/* Stars */}
            <div style={{ display: 'flex', gap: '3px', marginBottom: '16px' }}>
              {[1,2,3,4,5].map(star => (
                <svg key={star} width="14" height="14" viewBox="0 0 24 24"
                  fill={star <= t.rating ? '#C9A84C' : 'none'}
                  stroke="#C9A84C" strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>

            {/* Comment */}
            <p style={{
              color:        'var(--color-muted)',
              fontSize:     '0.88rem',
              lineHeight:   '1.75',
              marginBottom: '20px',
              fontStyle:    'italic',
              textAlign:    'justify',
            }}>
              "{t.comment}"
            </p>

            {/* Divider */}
            <div style={{ height: '1px', backgroundColor: 'var(--color-border)', marginBottom: '16px' }} />

            {/* Reviewer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width:           '38px',
                height:          '38px',
                borderRadius:    '50%',
                backgroundColor: 'var(--color-navy)',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                color:           'var(--color-taupe)',
                fontSize:        '0.88rem',
                fontWeight:      '700',
                flexShrink:       0,
              }}>
                {t.name[0]}
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '2px' }}>
                  {t.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                  {t.location} · {t.product}
                </p>
              </div>
            </div>

          </div>
        ))}
      </div>

    </section>
  )
}

export default Testimonials
