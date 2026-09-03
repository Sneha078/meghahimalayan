// src/pages/Orders.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getMyOrders, cancelOrder } from '../api/productClient'
import { useAuth } from '../context/AuthContext'

const STATUS_STYLES = {
  Processing:  { bg: '#fef9c3', color: '#854d0e' },
  Confirmed:   { bg: '#dbeafe', color: '#1e40af' },
  Shipped:     { bg: '#ede9fe', color: '#6d28d9' },
  Delivered:   { bg: '#dcfce7', color: '#15803d' },
  Cancelled:   { bg: '#fee2e2', color: '#dc2626' },
}

const STATUS_FILTERS = ['All', 'Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']

function Orders() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [cancelling, setCancelling] = useState(null)

  const activeStatus = searchParams.get('status') ?? 'All'

  const setActiveStatus = (status) => {
    if (status === 'All') {
      setSearchParams({})
    } else {
      setSearchParams({ status })
    }
  }

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    setCancelling(orderId)
    try {
      await cancelOrder(orderId)
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, orderStatus: 'Cancelled' } : o
        )
      )
    } catch (err) {
      alert(err.message)
    } finally {
      setCancelling(null)
    }
  }

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate('/login')
      return
    }

    let cancelled = false
    setLoading(true)

    getMyOrders()
      .then((data) => {
        if (!cancelled) setOrders(data.orders ?? [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [user, authLoading, navigate])

  if (authLoading) return null

  const visibleOrders =
    activeStatus === 'All'
      ? orders
      : orders.filter((o) => o.orderStatus === activeStatus)

  return (
    <div style={{ backgroundColor: 'var(--color-sbg)', minHeight: '100vh' }}>

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
          My Orders
        </h1>
      </div>

      <div style={{ padding: '40px 5rem', maxWidth: '900px' }}>

        {/* Status filter chips */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}>
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              style={{
                padding: '7px 16px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '600',
                border: activeStatus === status
                  ? '1px solid var(--color-navy)'
                  : '1px solid var(--color-border)',
                backgroundColor: activeStatus === status
                  ? 'var(--color-navy)'
                  : 'var(--color-white)',
                color: activeStatus === status
                  ? '#ffffff'
                  : 'var(--color-navy)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {loading && (
          <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>
            Loading your orders…
          </p>
        )}

        {error && (
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            color: '#dc2626',
            fontSize: '0.88rem',
          }}>
            {error}
          </div>
        )}

        {!loading && !error && visibleOrders.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: 'var(--color-white)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          }}>
            <p style={{
              fontSize: '1rem', fontWeight: '600',
              color: 'var(--color-navy)', marginBottom: '8px',
            }}>
              {activeStatus === 'All' ? 'No orders yet' : `No ${activeStatus.toLowerCase()} orders`}
            </p>
            <p style={{
              fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '24px',
            }}>
              {activeStatus === 'All'
                ? "Looks like you haven't placed any orders yet."
                : 'Try a different status, or view all your orders.'}
            </p>
            <Link
              to={activeStatus === 'All' ? '/shop' : '/orders'}
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
              {activeStatus === 'All' ? 'START SHOPPING' : 'VIEW ALL ORDERS'}
            </Link>
          </div>
        )}

        {!loading && !error && visibleOrders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {visibleOrders.map((order) => {
              const statusStyle = STATUS_STYLES[order.orderStatus] ?? STATUS_STYLES.Processing

              return (
                <div
                  key={order._id}
                  style={{
                    backgroundColor: 'var(--color-white)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    padding: '24px 28px',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}>
                    <div>
                      <p style={{
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        letterSpacing: '0.1em',
                        color: 'var(--color-muted)',
                        textTransform: 'uppercase',
                        marginBottom: '4px',
                      }}>
                        Order #{order.orderNumber}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                    </div>

                    <span style={{
                      padding: '4px 14px',
                      borderRadius: '20px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      letterSpacing: '0.06em',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                    }}>
                      {order.orderStatus.toUpperCase()}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '16px',
                  }}>
                    {order.orderItems.map((item, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                      }}>
                        <div style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '8px',
                          backgroundColor: '#f3f4f6',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}>
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{
                              width: '100%', height: '100%',
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: '1.2rem',
                            }}>
                              📦
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            color: 'var(--color-navy)',
                            marginBottom: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {item.name}
                          </p>
                          <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                            Qty: {item.quantity} · Rs. {item.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--color-border)',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginBottom: '2px' }}>
                          Total
                        </p>
                        <p style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: '1rem',
                          fontWeight: '700',
                          color: 'var(--color-navy)',
                        }}>
                          Rs. {order.totalPrice.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginBottom: '2px' }}>
                          Payment
                        </p>
                        <p style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--color-navy)' }}>
                          {order.paymentInfo.method} · {order.paymentInfo.status}
                        </p>
                      </div>
                    </div>

                    {['Processing', 'Confirmed'].includes(order.orderStatus) && (
                      <button
                        onClick={() => handleCancel(order._id)}
                        disabled={cancelling === order._id}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '8px',
                          border: '1px solid #fecaca',
                          backgroundColor: cancelling === order._id ? '#f3f4f6' : '#fef2f2',
                          color: cancelling === order._id ? '#9ca3af' : '#dc2626',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          cursor: cancelling === order._id ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {cancelling === order._id ? 'Cancelling…' : 'Cancel Order'}
                      </button>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

export default Orders