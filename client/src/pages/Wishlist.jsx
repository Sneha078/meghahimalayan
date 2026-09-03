// src/pages/Wishlist.jsx
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'

function Wishlist() {
  const { user, loading: authLoading } = useAuth()
  const { wishlist } = useWishlist()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  if (authLoading) return null

  return (
    <div style={{ backgroundColor: 'var(--color-sbg)', minHeight: '100vh' }}>

      {/* Page Header */}
      <div style={{
        backgroundColor: 'var(--color-navy)',
        padding: '48px 5rem 36px',
      }}>
        <p style={{
          color: 'var(--color-taupe)',
          fontSize: '0.72rem',
          fontWeight: '700',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}>
          Your Account
        </p>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          color: '#ffffff',
          fontSize: '2.4rem',
          fontWeight: '800',
        }}>
          My Wishlist
        </h1>
        {wishlist.length > 0 && (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '8px' }}>
            {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved
          </p>
        )}
      </div>

      <div style={{ padding: '40px 5rem' }}>

        {/* Empty state */}
        {wishlist.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: 'var(--color-white)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤍</div>
            <p style={{
              fontSize: '1rem', fontWeight: '600',
              color: 'var(--color-navy)', marginBottom: '8px',
            }}>
              Your wishlist is empty
            </p>
            <p style={{
              fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '24px',
            }}>
              Save products you love by clicking the heart icon.
            </p>
            <Link
              to="/shop"
              style={{
                padding: '11px 28px',
                backgroundColor: 'var(--color-navy)',
                color: 'var(--color-taupe)',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '700',
                letterSpacing: '0.1em',
              }}
            >
              BROWSE PRODUCTS
            </Link>
          </div>
        )}

        {/* Wishlist grid */}
        {wishlist.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '20px',
          }}>
            {wishlist.map((product) => (
              <ProductCard
                key={product._id ?? product.id}
                product={product}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default Wishlist
