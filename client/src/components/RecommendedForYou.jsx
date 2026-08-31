import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000'

/**
 * Normalises a product from the AI recommendation service into the
 * shape ProductCard expects (mirrors the raw Mongo document).
 */
function adaptProduct(product) {
  return {
    ...product,
    _id: product._id ?? product.id,
    image: product.image ?? product.images ?? [],
    ratings: product.ratings ?? product.rating ?? 0,
    numOfReviews: product.numOfReviews ?? 0,
  }
}

/**
 * "Recommended for you" — personalised product row powered by the
 * hybrid recommendation engine's /recommendation/for-user endpoint.
 *
 * Pass `userId` when the user is logged in for collaborative filtering.
 * Pass `viewedIds` (array of product _id strings) for content-based filtering.
 * When neither is available the engine falls back to top-rated products.
 *
 * Usage:
 *   <RecommendedForYou userId={user?._id} viewedIds={recentlyViewed} />
 */
function RecommendedForYou({ userId = null, viewedIds = [] }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    const params = new URLSearchParams()
    if (userId)             params.set('user_id', userId)
    params.set('top_n', '8')

    fetch(`${AI_API_URL}/recommendation/for-user?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId ?? undefined,
        viewed_product_ids: viewedIds,
        top_n: 8,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        const list = data.recommendations ?? []
        setProducts(list.map(adaptProduct))
      })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  // Re-fetch when the user logs in/out or viewed products change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, JSON.stringify(viewedIds)])

  const scrollBy = (amount) =>
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' })

  // Don't render a section header if there's genuinely nothing to show.
  if (!loading && !error && products.length === 0) return null

  return (
    <section style={{
      backgroundColor: 'var(--color-white)',
      padding: '64px 5rem',
      borderTop: '1px solid var(--color-border)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '40px',
      }}>
        <div>
          <p style={{
            color: 'var(--color-taupe)',
            fontSize: '0.72rem',
            fontWeight: '700',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            PERSONALISED FOR YOU
          </p>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2rem',
            fontWeight: '700',
            color: 'var(--color-navy)',
            lineHeight: '1.2',
          }}>
            Recommended for You
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!loading && !error && products.length > 4 && (
            <>
              <button onClick={() => scrollBy(-280)} aria-label="Scroll left" style={navBtn}>‹</button>
              <button onClick={() => scrollBy(280)}  aria-label="Scroll right" style={{ ...navBtn, backgroundColor: 'var(--color-navy)', color: '#fff', border: 'none' }}>›</button>
            </>
          )}
          <Link
            to="/shop"
            style={{
              padding: '10px 24px',
              border: '1px solid var(--color-navy)',
              color: 'var(--color-navy)',
              fontSize: '0.78rem',
              fontWeight: '600',
              letterSpacing: '0.1em',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-navy)'
              e.currentTarget.style.color = 'var(--color-taupe)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--color-navy)'
            }}
          >
            VIEW ALL
          </Link>
        </div>
      </div>

      {/* Skeleton loaders */}
      {loading && (
        <div style={{ display: 'flex', gap: '16px', overflow: 'hidden' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              minWidth: '220px', height: '340px',
              borderRadius: '12px', background: '#f3f4f6', flexShrink: 0,
            }} />
          ))}
        </div>
      )}

      {error && (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
          Couldn't load recommendations right now.
        </p>
      )}

      {/* Product row */}
      {!loading && !error && products.length > 0 && (
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
          }}
        >
          {products.map((product) => (
            <div
              key={product._id ?? product.id}
              style={{ minWidth: '220px', maxWidth: '220px', scrollSnapAlign: 'start', flexShrink: 0 }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

const navBtn = {
  width: '36px', height: '36px',
  borderRadius: '50%',
  border: '1px solid var(--color-border)',
  background: 'var(--color-white)',
  color: 'var(--color-navy)',
  fontSize: '1.2rem',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

export default RecommendedForYou
