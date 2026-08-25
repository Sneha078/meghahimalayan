import { useState } from 'react'

function ProductCard({ product }) {
const [wishlisted, setWishlisted] = useState(false)
const [added, setAdded] = useState(false)
const [hovered, setHovered] = useState(false)   

  const handleAddToCart = () => {
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(13,32,49,0.08)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-4px)'
  e.currentTarget.style.boxShadow = '0 12px 32px rgba(13,32,49,0.1)'
  setHovered(true)
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translateY(0)'
  e.currentTarget.style.boxShadow = 'none'
  setHovered(false)
}}
    >
   {/* Image / Placeholder */}
<div style={{ position: 'relative', overflow: 'hidden' }}>
  <div
    style={{
      background: product.gradient,
      height: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}
  >
    <div style={{
      opacity: 0.25,
      color: '#fff',
      transition: 'transform 0.4s ease',
      transform: hovered ? 'scale(1.15)' : 'scale(1)',
    }}>
      {product.category === 'watches' ? (
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="12" cy="12" r="7" />
          <polyline points="12 9 12 12 13.5 13.5" />
          <path d="M9 3h6l1 3H8L9 3z" />
          <path d="M9 21h6l1-3H8l1 3z" />
        </svg>
      ) : (
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M2 8c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z" />
          <path d="M7 10h10" />
        </svg>
      )}
    </div>
  </div>

  {/* Badges */}
  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
    {product.isNew && (
      <span style={{
        backgroundColor: '#C9A84C',
        color: '#0d1a2a',
        fontSize: '0.65rem',
        fontWeight: '700',
        letterSpacing: '0.08em',
        padding: '3px 8px',
        borderRadius: '4px',
      }}>NEW</span>
    )}
    {product.isBestseller && (
      <span style={{
        backgroundColor: '#0d1a2a',
        color: '#C9A84C',
        fontSize: '0.65rem',
        fontWeight: '700',
        letterSpacing: '0.08em',
        padding: '3px 8px',
        borderRadius: '4px',
      }}>BESTSELLER</span>
    )}
    {discount && (
      <span style={{
        backgroundColor: '#e74c3c',
        color: '#fff',
        fontSize: '0.65rem',
        fontWeight: '700',
        padding: '3px 8px',
        borderRadius: '4px',
      }}>{discount}% OFF</span>
    )}
  </div>

  {/* Wishlist */}
  <button
    onClick={(e) => { e.stopPropagation(); setWishlisted(!wishlisted) }}
    style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(255,255,255,0.9)',
      border: 'none',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    }}
    aria-label="Add to wishlist"
  >
    <svg width="15" height="15" viewBox="0 0 24 24"
      fill={wishlisted ? '#e74c3c' : 'none'}
      stroke={wishlisted ? '#e74c3c' : '#555'}
      strokeWidth="2"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  </button>

  {/* Add to Cart Overlay — slides up from bottom of image */}
  <div style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(13, 32, 49, 0.92)',
    transform: hovered ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.35s ease',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <button
      onClick={handleAddToCart}
      style={{
        width: '100%',
        padding: '8px',
        backgroundColor: 'transparent',
        color: added ? '#15803D' : 'var(--color-taupe)',
        border: 'none',
        fontSize: '0.78rem',
        fontWeight: '700',
        letterSpacing: '0.12em',
        cursor: 'pointer',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'color 0.2s ease',
      }}
    >
      {added ? '✓ Added!' : '🛒 Add to Cart'}
    </button>
  </div>


</div> 
      {/* Card Body */}
      <div style={{ padding: '16px' }}>

        {/* Brand */}
        <p style={{
          fontSize: '0.7rem',
          fontWeight: '700',
          letterSpacing: '0.12em',
          color: '#C9A84C',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}>
          {product.brand}
        </p>

        {/* Name */}
        <h3 style={{
          fontSize: '0.9rem',
          fontWeight: '600',
          color: '#0d2031',
          marginBottom: '8px',
          lineHeight: '1.3',
        }}>
          {product.name}
        </h3>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} width="11" height="11" viewBox="0 0 24 24"
                fill={star <= Math.round(product.rating) ? '#C9A84C' : 'none'}
                stroke="#C9A84C" strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>({product.reviews})</span>
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem', fontWeight: '700', color: '#0d2031' }}>
            Rs. {product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span style={{ fontSize: '0.8rem', color: '#9ca3af', textDecoration: 'line-through' }}>
              Rs. {product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

      </div>

    </div>
  )
}

export default ProductCard
  



