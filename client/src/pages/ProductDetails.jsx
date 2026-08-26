import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import products from '../data/products'
import ProductCard from '../components/ProductCard'

function ProductDetails() {
  const { id } = useParams()
  const product = products.find(p => p.id === parseInt(id))

  const [activeTab, setActiveTab] = useState('description')
  const [quantity, setQuantity] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)
  const [added, setAdded] = useState(false)

  // ── Product not found ──
  if (!product) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--color-navy)' }}>Product Not Found</h2>
        <Link to="/shop" style={{ color: 'var(--color-taupe)', fontWeight: '600', textDecoration: 'none' }}>← Back to Shop</Link>
      </div>
    )
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  const handleAddToCart = () => {
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const tabs = ['description', 'specifications', 'reviews', 'shipping']

  return (
    <div style={{ backgroundColor: 'var(--color-sbg)', minHeight: '100vh' }}>

      {/* ── Breadcrumb ── */}
      <div style={{ padding: '1rem 5rem', borderBottom: '1px solid var(--color-border)', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-muted)' }}>
          <Link to="/" style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link to="/shop" style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>Shop</Link>
          <span>›</span>
          <span style={{ color: 'var(--color-navy)', fontWeight: '500' }}>{product.name}</span>
        </div>
      </div>

      {/* ── Main product section ── */}
      <div style={{ padding: '3rem 5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', maxWidth: '1400px', margin: '0 auto' }}>

        {/* ── LEFT: Image ── */}
        <div>
          {/* Main image */}
          <div style={{
            background: product.gradient,
            borderRadius: '16px',
            height: '480px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{ opacity: 0.3, color: '#fff' }}>
              {product.category === 'watches' ? (
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                  <circle cx="12" cy="12" r="7" />
                  <polyline points="12 9 12 12 13.5 13.5" />
                  <path d="M9 3h6l1 3H8L9 3z" />
                  <path d="M9 21h6l1-3H8l1 3z" />
                </svg>
              ) : product.category === 'perfumes' ? (
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                  <path d="M9 3h6v2H9z" />
                  <path d="M8 5h8l1 14H7L8 5z" />
                  <path d="M10 9c0 1.1.9 2 2 2s2-.9 2-2" />
                </svg>
              ) : (
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                  <path d="M2 8c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z" />
                  <path d="M7 10h10" />
                </svg>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                background: product.gradient,
                borderRadius: '8px',
                width: '80px',
                height: '80px',
                border: i === 1 ? '2px solid var(--color-taupe)' : '2px solid transparent',
                cursor: 'pointer',
                opacity: i === 1 ? 1 : 0.5,
                transition: 'opacity 0.2s ease, border-color 0.2s ease',
              }} />
            ))}
          </div>
        </div>

        {/* ── RIGHT: Info ── */}
        <div>

          {/* Brand */}
          <p style={{ color: 'var(--color-taupe)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {product.brand}
          </p>

          {/* Name */}
          <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-navy)', fontSize: '2.2rem', fontWeight: '700', lineHeight: '1.2', marginBottom: '1rem' }}>
            {product.name}
          </h1>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '3px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <svg key={star} width="16" height="16" viewBox="0 0 24 24"
                  fill={star <= Math.round(product.rating) ? '#C9A84C' : 'none'}
                  stroke="#C9A84C" strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{product.rating} ({product.reviews} reviews)</span>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: '700', color: 'var(--color-navy)' }}>
              Rs. {product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span style={{ fontSize: '1.1rem', color: 'var(--color-muted)', textDecoration: 'line-through' }}>
                Rs. {product.originalPrice.toLocaleString()}
              </span>
            )}
            {discount && (
              <span style={{ backgroundColor: '#dc2626', color: '#fff', fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '4px' }}>
                {discount}% OFF
              </span>
            )}
          </div>

          {/* Stock status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#15803d' }} />
            <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: '500' }}>In Stock</span>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'var(--color-border)', marginBottom: '1.5rem' }} />

          {/* Quantity selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '0.6rem' }}>
              Quantity
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                style={{ width: '40px', height: '40px', border: '1px solid var(--color-border)', backgroundColor: '#fff', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--color-navy)' }}
              >
                −
              </button>
              <span style={{ width: '56px', height: '40px', border: '1px solid var(--color-border)', borderLeft: 'none', borderRight: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-navy)' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                style={{ width: '40px', height: '40px', border: '1px solid var(--color-border)', backgroundColor: '#fff', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--color-navy)' }}
              >
                +
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <button
              onClick={handleAddToCart}
              style={{
                flex: 1,
                padding: '0.9rem',
                backgroundColor: added ? '#15803d' : 'var(--color-navy)',
                color: '#fff',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: '700',
                letterSpacing: '0.12em',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              }}
            >
              {added ? '✓ ADDED TO CART' : 'ADD TO CART'}
            </button>

            <button
              style={{
                flex: 1,
                padding: '0.9rem',
                backgroundColor: 'var(--color-taupe)',
                color: 'var(--color-navy)',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: '700',
                letterSpacing: '0.12em',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-taupe-dark)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-taupe)'}
            >
              BUY NOW
            </button>

            {/* Wishlist */}
            <button
              onClick={() => setWishlisted(!wishlisted)}
              style={{
                width: '48px',
                border: `1px solid ${wishlisted ? '#e74c3c' : 'var(--color-border)'}`,
                backgroundColor: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'border-color 0.2s ease',
              }}
              aria-label="Add to wishlist"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"
                fill={wishlisted ? '#e74c3c' : 'none'}
                stroke={wishlisted ? '#e74c3c' : 'var(--color-muted)'} strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-ivory)', borderRadius: '8px' }}>
            {[
              { icon: '🔒', text: 'Secure Payment' },
              { icon: '🚚', text: 'Free Delivery' },
              { icon: '↩️', text: 'Easy Returns' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: '500' }}>{item.text}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ padding: '0 5rem', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Tab headers */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)', marginBottom: '2rem' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.85rem 1.5rem',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '0.82rem',
                fontWeight: '600',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                color: activeTab === tab ? 'var(--color-navy)' : 'var(--color-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--color-navy)' : '2px solid transparent',
                marginBottom: '-2px',
                transition: 'color 0.2s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ marginBottom: '3rem', padding: '0 0.5rem' }}>

          {activeTab === 'description' && (
            <div style={{ maxWidth: '700px' }}>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', lineHeight: '1.85', textAlign: 'justify' }}>
                The {product.name} by {product.brand} is a premium quality product crafted with precision and care.
                Designed for those who appreciate fine craftsmanship and timeless style, this piece combines
                functionality with aesthetic elegance. Perfect for everyday wear or special occasions.
              </p>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', lineHeight: '1.85', marginTop: '1rem', textAlign: 'justify' }}>
                Available exclusively at Mega Himalaya Optical House, Pokhara's premier destination for
                international brands since 2001.
              </p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div style={{ maxWidth: '600px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                {[
                  ['Brand', product.brand],
                  ['Category', product.category.charAt(0).toUpperCase() + product.category.slice(1)],
                  ['Gender', product.gender.charAt(0).toUpperCase() + product.gender.slice(1)],
                  ['Price', `Rs. ${product.price.toLocaleString()}`],
                  ['Rating', `${product.rating} / 5`],
                  ['Reviews', product.reviews],
                  ['Availability', 'In Stock'],
                ].map(([key, val]) => (
                  <tr key={key} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-navy)', width: '40%', backgroundColor: 'var(--color-ivory)' }}>
                      {key}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                      {val}
                    </td>
                  </tr>
                ))}
              </table>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div style={{ maxWidth: '700px' }}>
              {[
                { name: 'Manisha Shahi', rating: 5, comment: 'Absolutely love this product. The quality is outstanding and it looks even better in person.' },
                { name: 'Biswas Adhikari', rating: 4, comment: 'Great product for the price. Fast delivery from Mega Himalaya. Will buy again.' },
                { name: 'Anisha Bhandari', rating: 5, comment: 'Premium quality. Exactly as described. Highly recommend.' },
              ].map((review, i) => (
                <div key={i} style={{ padding: '1.25rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.82rem', fontWeight: '700' }}>
                      {review.name[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--color-navy)' }}>{review.name}</p>
                      <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} width="11" height="11" viewBox="0 0 24 24"
                            fill={s <= review.rating ? '#C9A84C' : 'none'} stroke="#C9A84C" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-muted)', lineHeight: '1.7' }}>{review.comment}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'shipping' && (
            <div style={{ maxWidth: '600px' }}>
              {[
                { title: 'Standard Delivery', detail: '3–5 business days · Free over Rs. 5,000' },
                { title: 'Express Delivery', detail: '1–2 business days · Rs. 250' },
                { title: 'Cash on Delivery', detail: 'Available across Nepal' },
                { title: 'Return Policy', detail: '7-day easy return on all products' },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '1.1rem' }}>📦</span>
                  <div>
                    <p style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--color-navy)', marginBottom: '2px' }}>{item.title}</p>
                    <p style={{ fontSize: '0.83rem', color: 'var(--color-muted)' }}>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── Related Products ── */}
      {relatedProducts.length > 0 && (
        <div style={{ padding: '2rem 5rem 4rem', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ color: 'var(--color-taupe)', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              YOU MAY ALSO LIKE
            </p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: '700', color: 'var(--color-navy)' }}>
              Related Products
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default ProductDetails
