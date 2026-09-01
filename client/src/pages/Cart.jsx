import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function Cart() {
  const { cartItems, updateQuantity, removeItem, subtotal } = useCart()

  const shipping = subtotal >= 5000 ? 0 : 200
  const total = subtotal + shipping

  if (cartItems.length === 0) {
    return (
      <div style={{
        backgroundColor: 'var(--color-sbg)',
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 5rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🛒</div>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2rem',
          fontWeight: '700',
          color: 'var(--color-navy)',
          marginBottom: '12px',
        }}>
          Your cart is empty
        </h2>
        <p style={{
          color: 'var(--color-muted)',
          fontSize: '0.95rem',
          marginBottom: '32px',
          maxWidth: '400px',
          lineHeight: '1.6',
        }}>
          Looks like you haven't added anything yet. Explore our collection and find something you love.
        </p>
        <Link
          to="/shop"
          style={{
            backgroundColor: 'var(--color-navy)',
            color: 'var(--color-taupe)',
            padding: '13px 32px',
            fontSize: '0.82rem',
            fontWeight: '700',
            letterSpacing: '0.12em',
            textDecoration: 'none',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          CONTINUE SHOPPING
        </Link>
      </div>
    )
  }

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
          YOUR SELECTION
        </p>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          color: '#ffffff',
          fontSize: '2.8rem',
          fontWeight: '800',
        }}>
          Shopping Cart
        </h1>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '32px',
        padding: '40px 5rem',
        alignItems: 'flex-start',
      }}>

        {/* Left — Cart Items */}
        <div>

          {/* Header Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            padding: '12px 0',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: '8px',
          }}>
            {['Product', 'Price', 'Quantity', 'Total'].map((h) => (
              <p key={h} style={{
                fontSize: '0.72rem',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
              }}>
                {h}
              </p>
            ))}
          </div>

          {/* Cart Items */}
          {cartItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                alignItems: 'center',
                padding: '20px 0',
                borderBottom: '1px solid var(--color-border)',
                gap: '16px',
              }}
            >
              {/* Product Info */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {/* Image */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '10px',
                  backgroundColor: '#f3f4f6',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  {item.image?.[0]?.url ? (
                    <img
                      src={item.image[0].url}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '1.5rem',
                    }}>
                      {item.category === 'watches' ? '⌚' : item.category === 'perfumes' ? '🧴' : '👓'}
                    </div>
                  )}
                </div>

                {/* Name & Brand */}
                <div>
                  <p style={{
                    fontSize: '0.68rem',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    color: 'var(--color-taupe)',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}>
                    {item.brand}
                  </p>
                  <h3 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: 'var(--color-navy)',
                    marginBottom: '8px',
                    lineHeight: '1.3',
                  }}>
                    {item.name}
                  </h3>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: 'var(--color-error)',
                      padding: '0',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>

              {/* Price */}
              <div>
                <p style={{
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: 'var(--color-navy)',
                }}>
                  Rs. {item.price.toLocaleString()}
                </p>
                {item.originalPrice && (
                  <p style={{
                    fontSize: '0.78rem',
                    color: 'var(--color-muted)',
                    textDecoration: 'line-through',
                    marginTop: '2px',
                  }}>
                    Rs. {item.originalPrice.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Quantity Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                overflow: 'hidden',
                width: 'fit-content',
              }}>
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  style={{
                    width: '36px',
                    height: '36px',
                    border: 'none',
                    backgroundColor: 'var(--color-white)',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    color: 'var(--color-navy)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-sbg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-white)'}
                >
                  −
                </button>
                <span style={{
                  width: '40px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'var(--color-navy)',
                  backgroundColor: 'var(--color-white)',
                  borderLeft: '1px solid var(--color-border)',
                  borderRight: '1px solid var(--color-border)',
                }}>
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  style={{
                    width: '36px',
                    height: '36px',
                    border: 'none',
                    backgroundColor: 'var(--color-white)',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    color: 'var(--color-navy)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-sbg)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-white)'}
                >
                  +
                </button>
              </div>

              {/* Item Total */}
              <p style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: 'var(--color-navy)',
              }}>
                Rs. {(item.price * item.quantity).toLocaleString()}
              </p>

            </div>
          ))}

          {/* Continue Shopping */}
          <div style={{ marginTop: '24px' }}>
            <Link
              to="/shop"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-muted)',
                fontSize: '0.85rem',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-navy)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-muted)'}
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right — Order Summary */}
        <div style={{
          backgroundColor: 'var(--color-white)',
          borderRadius: '16px',
          padding: '28px',
          border: '1px solid var(--color-border)',
          position: 'sticky',
          top: '100px',
        }}>

          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.3rem',
            fontWeight: '700',
            color: 'var(--color-navy)',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            Order Summary
          </h2>

          {/* Summary Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--color-muted)' }}>
                Subtotal
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--color-navy)' }}>
                Rs. {subtotal.toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--color-muted)' }}>
                Shipping
              </span>
              <span style={{
                fontSize: '0.88rem',
                fontWeight: '600',
                color: shipping === 0 ? 'var(--color-success, #15803D)' : 'var(--color-navy)',
              }}>
                {shipping === 0 ? 'FREE' : `Rs. ${shipping}`}
              </span>
            </div>

            {shipping > 0 && (
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--color-taupe)',
                backgroundColor: 'var(--color-ivory)',
                padding: '8px 12px',
                borderRadius: '6px',
                lineHeight: '1.5',
              }}>
                Add Rs. {(5000 - subtotal).toLocaleString()} more for free shipping!
              </p>
            )}

          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />

          {/* Total */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}>
            <span style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: 'var(--color-navy)',
            }}>
              Total
            </span>
            <span style={{
              fontSize: '1.2rem',
              fontWeight: '800',
              color: 'var(--color-navy)',
              fontFamily: 'var(--font-serif)',
            }}>
              Rs. {total.toLocaleString()}
            </span>
          </div>

          {/* Checkout Button */}
          <Link
            to="/checkout"
            style={{
              display: 'block',
              width: '100%',
              padding: '14px',
              backgroundColor: 'var(--color-navy)',
              color: 'var(--color-taupe)',
              textAlign: 'center',
              fontSize: '0.82rem',
              fontWeight: '700',
              letterSpacing: '0.15em',
              textDecoration: 'none',
              borderRadius: '8px',
              transition: 'opacity 0.2s ease',
              marginBottom: '12px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            PROCEED TO CHECKOUT
          </Link>

          {/* Trust badges */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '16px',
          }}>
            {['🔒 Secure', '✅ Genuine', '🚚 Fast'].map((badge) => (
              <span key={badge} style={{
                fontSize: '0.72rem',
                color: 'var(--color-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                {badge}
              </span>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

export default Cart