import { useEffect, useRef, useState } from 'react'
import ProductCard from './ProductCard'

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000'

/**
 * Normalizes a product object coming from the Python recommendation
 * service (`_product_to_dict()` in product_service.py) into the shape
 * ProductCard.jsx expects (which mirrors the raw Mongo document).
 *
 * Known mismatches as of writing:
 *   - service returns `images` (plural)      -> ProductCard reads `image`
 *   - service returns `rating`  (singular)    -> ProductCard reads `ratings`
 *   - service does not return `numOfReviews`  -> defaults to 0 here
 *
 * If/when the backend is updated to return matching field names directly,
 * this adapter becomes a no-op and can be deleted.
 */
function adaptProduct(product) {
  return {
    ...product,
    image: product.image ?? product.images ?? [],
    ratings: product.ratings ?? product.rating ?? 0,
    numOfReviews: product.numOfReviews ?? 0,
  }
}

/**
 * "You may also like" — horizontal scrolling row of similar products,
 * sourced from the hybrid recommendation engine.
 *
 * Usage (on a product detail page):
 *   <RecommendedProducts productId={product.id} />
 */
function RecommendedProducts({ productId, title = 'You May Also Like' }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!productId) return

    let cancelled = false
    setLoading(true)
    setError(false)

    fetch(`${AI_API_URL}/recommendation/similar/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        // The endpoint returns { product_id, recommendations: [...] }
        const list = Array.isArray(data) ? data : data.recommendations ?? []
        setProducts(list.map(adaptProduct))
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [productId])

  const scrollBy = (amount) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
  }

  // Nothing to show and nothing went wrong — don't render an empty section.
  if (!loading && !error && products.length === 0) return null

  return (
    <section style={{ padding: '32px 0' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <h2
          style={{
            fontSize: '1.3rem',
            fontWeight: '700',
            color: '#0d2031',
            margin: 0,
          }}
        >
          {title}
        </h2>

        {!loading && !error && products.length > 3 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => scrollBy(-280)}
              aria-label="Scroll left"
              style={navButtonStyle}
            >
              ‹
            </button>
            <button
              onClick={() => scrollBy(280)}
              aria-label="Scroll right"
              style={navButtonStyle}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {error && (
        <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
          Couldn't load recommendations right now.
        </p>
      )}

      {loading && (
        <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                minWidth: '220px',
                height: '340px',
                borderRadius: '12px',
                background: '#f3f4f6',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: '4px',
            // Hide scrollbar visually while keeping it functional
            scrollbarWidth: 'none',
          }}
        >
          {products.map((product) => (
            <div
              key={product.id ?? product._id}
              style={{ minWidth: '220px', maxWidth: '220px', scrollSnapAlign: 'start' }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

const navButtonStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  border: '1px solid rgba(13,32,49,0.15)',
  background: '#fff',
  color: '#0d2031',
  fontSize: '1.1rem',
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export default RecommendedProducts