import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000'

function adaptProduct(product) {
  return {
    ...product,
    _id: product._id ?? product.id,
    image: product.image ?? product.images ?? [],
    ratings: product.ratings ?? product.rating ?? 0,
    numOfReviews: product.numOfReviews ?? 0,
  }
}

function RecommendedForYou({ userId = null, viewedIds = [] }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, JSON.stringify(viewedIds)])

  if (!loading && !error && products.length === 0) return null

  return (
    <section style={{
      backgroundColor: 'var(--color-white)',
      padding: 'clamp(2rem, 5vw, 4rem) var(--section-px)',
      borderTop: '1px solid var(--color-border)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 'clamp(20px, 3vw, 40px)',
        flexWrap: 'wrap',
        gap: '12px',
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
            fontSize: 'var(--text-2xl)',
            fontWeight: '700',
            color: 'var(--color-navy)',
            lineHeight: '1.2',
          }}>
            Recommended for You
          </h2>
        </div>

        <div className="hidden sm:flex" style={{ gap: '10px', alignItems: 'center' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              height: '340px',
              borderRadius: '12px', background: '#f3f4f6',
            }} />
          ))}
        </div>
      )}

      {error && (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
          Couldn't load recommendations right now.
        </p>
      )}

      {/* 2-column product grid */}
      {!loading && !error && products.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {products.map((product) => (
            <div key={product._id ?? product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default RecommendedForYou
