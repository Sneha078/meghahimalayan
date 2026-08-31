
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'

function BestSellers() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true)

        const response = await fetch(
          'http://localhost:5000/api/v1/products?limit=100'
        )

        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const data = await response.json()

        if (data.success) {
          const bestSellerProducts = data.products
            .filter((product) => product.isBestSeller === true)
            .slice(0, 8)

          setProducts(bestSellerProducts)
        } else {
          throw new Error('Failed to load products')
        }
      } catch (err) {
        console.error('Error fetching best sellers:', err)
        setError('Unable to load best sellers.')
      } finally {
        setLoading(false)
      }
    }

    fetchBestSellers()
  }, [])

  return (
    <section
      style={{
        backgroundColor: 'var(--color-white)',
        padding: '80px 5rem',
      }}
    >
      {/* Section Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '48px',
        }}
      >
        <p
          style={{
            color: 'var(--color-taupe)',
            fontSize: '0.85rem',
            fontWeight: '800',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          CUSTOMER FAVOURITES
        </p>

        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2.8rem',
            fontWeight: '700',
            color: 'var(--color-navy)',
            lineHeight: '1.2',
            marginBottom: '16px',
          }}
        >
          Best Sellers
        </h2>

        <p
          style={{
            color: 'var(--color-muted)',
            fontSize: '1rem',
            maxWidth: '480px',
            margin: '0 auto',
            lineHeight: '1.7',
          }}
        >
          Our most loved products - chosen by customers across Pokhara.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--color-muted)',
          }}
        >
          Loading best sellers...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: '#b91c1c',
          }}
        >
          {error}
        </div>
      )}

      {/* Products */}
      {!loading && !error && products.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '24px',
            marginBottom: '48px',
          }}
        >
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
            />
          ))}
        </div>
      )}

      {/* No Best Sellers */}
      {!loading && !error && products.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--color-muted)',
          }}
        >
          No best-selling products available.
        </div>
      )}

      {/* View All Products */}
      <div
        style={{
          textAlign: 'center',
        }}
      >
        <Link
          to="/shop"
          style={{
            display: 'inline-block',
            backgroundColor: 'var(--color-navy)',
            color: 'var(--color-taupe)',
            padding: '0.9rem 3rem',
            fontSize: '0.8rem',
            fontWeight: '700',
            letterSpacing: '0.18em',
            textDecoration: 'none',
            transition: 'background-color 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#162436'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              'var(--color-navy)'
          }}
        >
          VIEW ALL PRODUCTS
        </Link>
      </div>
    </section>
  )
}

export default BestSellers

