import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import PointsRedeemBox from './PointsRedeemBox'
import { getPublicCoupons } from '../api/productClient'

function Cart() {
  const {
    cartItems, updateQuantity, removeItem, subtotal,
    couponCode, discount, applyCoupon, removeCoupon,
    //shared points state
    pointsUsed, 
    pointsDiscount, setPointsRedemption,
  } = useCart()
  const { user } = useAuth()

  const [couponInput, setCouponInput] = useState('')
  const [couponMessage, setCouponMessage] = useState(null)
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  

  const [publicOffers, setPublicOffers] = useState([])
  const [offersLoading, setOffersLoading] = useState(true)
  const [productToDelete, setProductToDelete] = useState(null)

  useEffect(() => {
    let cancelled = false
    getPublicCoupons()
      .then((data) => { if (!cancelled) setPublicOffers(data) })
      .catch(() => { /* offers are non-critical — fail silently */ })
      .finally(() => { if (!cancelled) setOffersLoading(false) })
    return () => { cancelled = true }
  }, [])

  const shipping = subtotal >= 5000 ? 0 : 200

  const discounted = Math.max(0, subtotal - discount)
  const calculatedTotal = Math.max(0, discounted + shipping - pointsDiscount)
  const total = Math.floor(calculatedTotal)

  const handleApplyCoupon = async () => {
    const code = couponInput.trim()
    if (!code) return

    setApplyingCoupon(true)
    setCouponMessage(null)
    try {
      await applyCoupon(code)
      setCouponInput('')
      setCouponMessage({ type: 'success', text: `Coupon "${code.toUpperCase()}" applied` })
    } catch (err) {
      setCouponMessage({ type: 'error', text: err.message || 'Failed to apply coupon' })
    } finally {
      setApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = async () => {
    setCouponMessage(null)
    await removeCoupon()
  }
//to have coupon
  const handleApplyOffer = async (code) => {
    setCouponInput(code)
    setApplyingCoupon(true)
    setCouponMessage(null)
    try {
      await applyCoupon(code)
      setCouponInput('')
      setCouponMessage({ type: 'success', text: `Coupon "${code.toUpperCase()}" applied` })
    } catch (err) {
      setCouponMessage({ type: 'error', text: err.message || 'Failed to apply coupon' })
    } finally {
      setApplyingCoupon(false)
    }
  }

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
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr',
      alignItems: 'center',
      padding: '20px 0',
      borderBottom: '1px solid var(--color-border)',
      gap: '16px',
    }}
  >
    {/* Delete icon — top-right of the row */}
    <button
      onClick={() => setProductToDelete(item)}
      aria-label="Remove item"
      title="Remove item"
      style={{
        position: 'absolute',
        top: '50px',
        right: '0',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '6px',
        color: 'var(--color-muted)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        transition: 'color 0.2s ease, background-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--color-error)'
        e.currentTarget.style.backgroundColor = 'var(--color-sbg)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--color-muted)'
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </button>

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
          lineHeight: '1.3',
        }}>
          {item.name}
        </h3>
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

            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--color-muted)' }}>
                  Coupon Discount
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#15803D' }}>
                  − Rs. {discount.toLocaleString()}
                </span>
              </div>
            )}

            {pointsDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--color-muted)' }}>
                  Points discount ({((pointsDiscount / Math.max(discounted, 1)) * 100).toFixed(1)}%)
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#15803D' }}>
                  − Rs. {pointsDiscount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

          </div>

          {/* Coupon Section */}
          <div style={{
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '16px',
            backgroundColor: 'var(--color-sbg)',
          }}>
            {couponCode ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-taupe)', marginBottom: '4px' }}>
                    Applied Coupon
                  </p>
                  <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-navy)', letterSpacing: '0.05em' }}>
                    {couponCode}
                  </p>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  aria-label="Remove coupon"
                  title="Remove coupon"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-muted)', padding: '4px 8px', borderRadius: '6px',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'color 0.2s ease, background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-error)'
                    e.currentTarget.style.backgroundColor = 'var(--color-white)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-muted)'
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-taupe)', marginBottom: '8px' }}>
                  Have a coupon?
                </p>
                {user ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="ENTER COUPON CODE"
                      style={{
                        flex: 1, padding: '10px 12px', border: '1px solid var(--color-border)',
                        borderRadius: '8px', fontSize: '0.8rem', letterSpacing: '0.05em',
                        textTransform: 'uppercase', outline: 'none', color: 'var(--color-navy)',
                        backgroundColor: 'var(--color-white)',
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon() }}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon}
                      style={{
                        padding: '10px 16px', backgroundColor: 'var(--color-navy)', color: 'var(--color-taupe)',
                        border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700',
                        letterSpacing: '0.08em', cursor: applyingCoupon ? 'wait' : 'pointer', opacity: applyingCoupon ? 0.6 : 1,
                      }}
                    >
                      {applyingCoupon ? '…' : 'APPLY'}
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', lineHeight: '1.5' }}>
                    <Link to="/login" style={{ color: 'var(--color-navy)', fontWeight: '600' }}>Log in</Link> to apply coupon codes.
                  </p>
                )}
                {couponMessage && (
                  <p style={{
                    marginTop: '8px', fontSize: '0.75rem', lineHeight: '1.5',
                    color: couponMessage.type === 'error' ? 'var(--color-error)' : '#15803D',
                  }}>
                    {couponMessage.text}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Available Offers */}
          {!offersLoading && publicOffers.length > 0 && !couponCode && (
            <div style={{
              marginBottom: '16px',
            }}>
              <p style={{
                fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--color-taupe)', marginBottom: '8px',
              }}>
                Available Offers
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {publicOffers.map((offer) => (
                  <div key={offer._id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    border: '1px dashed var(--color-border)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-white)',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-navy)',
                        letterSpacing: '0.03em', marginBottom: '2px',
                      }}>
                        {offer.code}
                      </p>
                      <p style={{
                        fontSize: '0.75rem', color: 'var(--color-muted)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {offer.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleApplyOffer(offer.code)}
                      disabled={!user || applyingCoupon}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-navy)',
                        backgroundColor: 'transparent',
                        color: 'var(--color-navy)',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        letterSpacing: '0.05em',
                        cursor: !user || applyingCoupon ? 'not-allowed' : 'pointer',
                        opacity: !user || applyingCoupon ? 0.5 : 1,
                        flexShrink: 0,
                      }}
                    >
                      APPLY
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Redeem Points */}
          {user && (
            <PointsRedeemBox
              subtotal={discounted}
              pointsUsed={pointsUsed}
              pointsDiscount={pointsDiscount}
              onChange={(points, pointsDisc) => {
                setPointsRedemption(points, pointsDisc)
              }}
            />
          )}

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
          {/* Delete Confirmation Modal */}
{productToDelete && (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(13, 26, 42, 0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backdropFilter: 'blur(3px)',
    }}
    onClick={() => setProductToDelete(null)}
  >
    <div
      style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'var(--color-white)',
        borderRadius: '16px',
        padding: '30px',
        border: '1px solid var(--color-border)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Icon */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '18px',
          fontSize: '1.3rem',
        }}
      >
        🗑️
      </div>

      {/* Title */}
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.4rem',
          fontWeight: '700',
          color: 'var(--color-navy)',
          marginBottom: '10px',
        }}
      >
        Remove product?
      </h2>

      {/* Message */}
      <p
        style={{
          fontSize: '0.9rem',
          color: 'var(--color-muted)',
          lineHeight: '1.6',
          marginBottom: '8px',
        }}
      >
        Do you want to delete this product from the
        cart?
      </p>

      {/* Product name */}
      <p
        style={{
          fontSize: '0.85rem',
          fontWeight: '600',
          color: 'var(--color-navy)',
          marginBottom: '24px',
        }}
      >
        {productToDelete.name}
      </p>

      {/* Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
        }}
      >
        {/* Cancel */}
        <button
          type="button"
          onClick={() => setProductToDelete(null)}
          style={{
            padding: '11px 22px',
            borderRadius: '8px',
            border:
              '1px solid var(--color-border)',
            backgroundColor:
              'var(--color-white)',
            color: 'var(--color-navy)',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          CANCEL
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={async () => {
            const id = productToDelete.id

            setProductToDelete(null)

            await removeItem(id)
          }}
          style={{
            padding: '11px 22px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          DELETE
        </button>
      </div>
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  )
}

export default Cart