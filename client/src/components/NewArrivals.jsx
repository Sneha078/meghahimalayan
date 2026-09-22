import { useProducts } from '../hooks/useProducts'
import ProductCard from './ProductCard'

function NewArrivals() {
  const { products: newProducts, loading, error } = useProducts({ new: true, limit: 8 })

  return (
    <section style={{
      backgroundColor: 'var(--color-sbg)',
      padding: 'var(--section-py) var(--section-px)',
      overflow: 'hidden',
    }}>

      {/* Section Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'clamp(20px, 3vw, 40px)',
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
            fontSize: 'var(--text-3xl)',
            fontWeight: '700',
            color: 'var(--color-navy)',
            lineHeight: '1.2',
          }}>
            New Arrivals
          </h2>
        </div>
      </div>

      {/* Loading / error states */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              height: '340px',
              borderRadius: '12px', background: '#e5e7eb',
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

      {/* 2-column product grid */}
      {!loading && !error && newProducts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {newProducts.map((product) => (
            <div key={product._id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}

    </section>
  )
}

export default NewArrivals
