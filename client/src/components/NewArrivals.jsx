import { useRef } from 'react'
import { useProducts } from '../hooks/useProducts'
import ProductCard from './ProductCard'

function NewArrivals() {
  const scrollRef = useRef(null)
  const { products: newProducts, loading, error } = useProducts({ new: true, limit: 8 })

  const scrollBy = (amount) =>
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' })

  return (
    <section style={{
      backgroundColor: 'var(--color-sbg)',
      padding: '80px 5rem',
    }}>

      {/* Section Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
      }}>
        <div>
          <p style={{
            color: 'var(--color-taupe)',
            fontSize: '0.72rem',
            fontWeight: '700',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}>
            JUST ARRIVED
          </p>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.5rem',
            fontWeight: '700',
            color: 'var(--color-navy)',
            lineHeight: '1.2',
          }}>
            New Arrivals
          </h2>
        </div>

        {/* Arrow Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => scrollBy(-260)}
            aria-label="Scroll left"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-white)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              color: 'var(--color-navy)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-navy)'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-white)'
              e.currentTarget.style.color = 'var(--color-navy)'
            }}
          >
            ←
          </button>
          <button
            onClick={() => scrollBy(260)}
            aria-label="Scroll right"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'var(--color-navy)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              color: '#ffffff',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-taupe)'
              e.currentTarget.style.color = 'var(--color-navy)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-navy)'
              e.currentTarget.style.color = '#ffffff'
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Loading / error states */}
      {loading && (
        <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              minWidth: '220px', height: '340px',
              borderRadius: '12px', background: '#e5e7eb', flexShrink: 0,
            }} />
          ))}
        </div>
      )}
      {error && (
        <p style={{ color: '#e74c3c' }}>Couldn't load products: {error}</p>
      )}
      {!loading && !error && newProducts.length === 0 && (
        <p style={{ color: 'var(--color-navy)', opacity: 0.6 }}>No new arrivals right now.</p>
      )}

      {/* Scrollable product row */}
      {!loading && !error && newProducts.length > 0 && (
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
            cursor: 'grab',
          }}
          onMouseDown={(e) => {
            const el = scrollRef.current
            if (!el) return
            el.style.cursor = 'grabbing'
            const startX = e.pageX - el.offsetLeft
            const scrollLeft = el.scrollLeft

            const onMove = (ev) => {
              const x = ev.pageX - el.offsetLeft
              el.scrollLeft = scrollLeft - (x - startX)
            }
            const onUp = () => {
              el.style.cursor = 'grab'
              window.removeEventListener('mousemove', onMove)
              window.removeEventListener('mouseup', onUp)
            }
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
          }}
        >
          {newProducts.map((product) => (
            <div
              key={product._id}
              style={{ minWidth: '240px', maxWidth: '240px', scrollSnapAlign: 'start', flexShrink: 0 }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}

    </section>
  )
}

export default NewArrivals
