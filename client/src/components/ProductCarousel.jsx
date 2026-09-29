import { useRef } from 'react'
import ProductCard from './ProductCard'

function ProductCarousel({ products }) {
  const scrollRef = useRef(null)

  const scrollBy = (dir) => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector('[data-card]')?.offsetWidth || 300
    const gap = 16
    el.scrollBy({ left: dir * (cardWidth + gap) * 2, behavior: 'smooth' })
  }

  const handleWheel = (e) => {
    const el = scrollRef.current
    if (!el) return
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Prev arrow - left side */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Scroll left"
        style={{
          position: 'absolute',
          left: '-16px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-white)',
          color: 'var(--color-navy)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-navy)'
          e.currentTarget.style.color = '#fff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-white)'
          e.currentTarget.style.color = 'var(--color-navy)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Scrollable strip */}
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: 'var(--section-gap)',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '4px',
        }}
      >
        {products.map((product) => (
          <div
            key={product._id ?? product.id}
            data-card
            className="carousel-card"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Next arrow - right side */}
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Scroll right"
        style={{
          position: 'absolute',
          right: '-16px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-white)',
          color: 'var(--color-navy)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-navy)'
          e.currentTarget.style.color = '#fff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-white)'
          e.currentTarget.style.color = 'var(--color-navy)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  )
}

export default ProductCarousel
