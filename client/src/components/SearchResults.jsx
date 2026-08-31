
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from './ProductCard'
import { fetchSearchResults } from '../services/searchClient'

function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadResults() {
      if (!query.trim()) {
        setProducts([])
        return
      }

      try {
        setLoading(true)
        setError('')

        const data = await fetchSearchResults(query)

        if (!cancelled) {
          setProducts(data.results || [])
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Search failed:', err)
          setError('Unable to load search results. Please try again.')
          setProducts([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadResults()

    return () => {
      cancelled = true
    }
  }, [query])

  return (
    <main
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '48px 32px 80px',
      }}
    >
      {/* Search heading */}
      <div style={{ marginBottom: '32px' }}>
        <p
          style={{
            fontSize: '0.72rem',
            fontWeight: '700',
            letterSpacing: '0.14em',
            color: '#C9A84C',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Search Results
        </p>

        <h1
          style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: '#0d2031',
            margin: 0,
          }}
        >
          {query ? `"${query}"` : 'Search'}
        </h1>

        {!loading && !error && (
          <p
            style={{
              marginTop: '8px',
              color: '#6b7280',
              fontSize: '0.9rem',
            }}
          >
            {products.length}{' '}
            {products.length === 1 ? 'product' : 'products'} found
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
          }}
        >
          Searching...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            color: '#b91c1c',
            backgroundColor: '#fef2f2',
            borderRadius: '12px',
          }}
        >
          {error}
        </div>
      )}

      {/* No results */}
      {!loading && !error && products.length === 0 && (
        <div
          style={{
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              color: '#0d2031',
              fontSize: '1.3rem',
              marginBottom: '8px',
            }}
          >
            No products found
          </h2>

          <p
            style={{
              color: '#6b7280',
              fontSize: '0.9rem',
            }}
          >
            Try a different search term or check your spelling.
          </p>
        </div>
      )}

      {/* Results grid */}
      {!loading && !error && products.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '24px',
          }}
        >
          {products.map((product) => (
            <ProductCard
              key={product._id || product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </main>
  )
}

export default SearchResults

