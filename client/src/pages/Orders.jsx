// src/pages/Orders.jsx

import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getMyOrders, cancelOrder, downloadInvoice } from '../api/productClient'
import { useAuth } from '../context/AuthContext'
import OrderTimeline from '../components/OrderTimeline'

const STATUS_STYLES = {
  Processing: { bg: '#fef9c3', color: '#854d0e' },
  Confirmed: { bg: '#dbeafe', color: '#1e40af' },
  Shipped: { bg: '#ede9fe', color: '#6d28d9' },
  Delivered: { bg: '#dcfce7', color: '#15803d' },
  Cancelled: { bg: '#fee2e2', color: '#dc2626' },
}

const STATUS_FILTERS = [
  'All',
  'Processing',
  'Confirmed',
  'Shipped',
  'Delivered',
  'Cancelled',
]

function Orders() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const returnSuccess = location.state?.returnSuccess

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [downloadingInvoice, setDownloadingInvoice] = useState(null)

  // ============================================================
  // URL FILTERS
  // ============================================================

  const activeStatus = searchParams.get('status') ?? 'All'

  // This comes from the Rewards page when the user clicks
  // an order inside their rewards history.
  const targetOrderNumber = searchParams.get('orderNumber')

  // ============================================================
  // STATUS FILTER
  // ============================================================

  const setActiveStatus = (status) => {
    if (status === 'All') {
      setSearchParams({})
    } else {
      setSearchParams({ status })
    }
  }

  // ============================================================
  // CANCEL ORDER
  // ============================================================

  // Clear the return-success flag from history state so the
  // banner doesn't reappear on refresh.
  useEffect(() => {
    if (location.state?.returnSuccess) {
      window.history.replaceState({}, '', location.pathname)
    }
  }, [location])

  const handleCancel = async (orderId) => {
    if (
      !window.confirm(
        'Are you sure you want to cancel this order?'
      )
    ) {
      return
    }

    setCancelling(orderId)

    try {
      await cancelOrder(orderId)

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? {
                ...o,
                orderStatus: 'Cancelled',
              }
            : o
        )
      )
    } catch (err) {
      alert(err.message)
    } finally {
      setCancelling(null)
    }
  }

  // Invoice
  const handleDownloadInvoice = async (orderId, orderNumber) => {
    setDownloadingInvoice(orderId)
    try {
      const blob = await downloadInvoice(orderId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${orderNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message)
    } finally {
      setDownloadingInvoice(null)
    }
  }

  // ============================================================
  // LOAD ORDERS
  // ============================================================

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate('/login')
      return
    }

    let cancelled = false

    setLoading(true)
    setError(null)

    getMyOrders()
      .then((data) => {
        if (!cancelled) {
          setOrders(data.orders ?? [])
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [user, authLoading, navigate])

  // ============================================================
  // AUTH LOADING
  // ============================================================

  if (authLoading) return null

  // ============================================================
  // FILTER BY STATUS
  // ============================================================

  const visibleOrders =
    activeStatus === 'All'
      ? orders
      : orders.filter(
          (o) => o.orderStatus === activeStatus
        )

  // ============================================================
  // MOVE TARGET ORDER TO THE TOP
  // ============================================================

  /*
    When coming from Rewards, the URL will look like:

    /orders?orderNumber=MH-1789028498100-1F5767A5

    We find that order and place it at the top.
  */

  const orderedVisibleOrders = targetOrderNumber
    ? [
        ...visibleOrders.filter(
          (order) =>
            order.orderNumber ===
            targetOrderNumber
        ),
        ...visibleOrders.filter(
          (order) =>
            order.orderNumber !==
            targetOrderNumber
        ),
      ]
    : visibleOrders

  // ============================================================
  // CHECK WHETHER TARGET ORDER EXISTS
  // ============================================================

  const targetOrderFound = orders.some(
    (order) =>
      order.orderNumber === targetOrderNumber
  )

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        backgroundColor: 'var(--color-sbg)',
        minHeight: '100vh',
      }}
    >
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}

      <div
        style={{
          backgroundColor: 'var(--color-navy)',
          padding: '48px 5rem 36px',
        }}
      >
        <p
          style={{
            color: 'var(--color-taupe)',
            fontSize: '0.72rem',
            fontWeight: '700',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}
        >
          Your Account
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            color: '#ffffff',
            fontSize: '2.4rem',
            fontWeight: '800',
          }}
        >
          My Orders
        </h1>
      </div>

      {/* ========================================================
          MAIN CONTENT
          ======================================================== */}

      <div
        style={{
          padding: '40px 5rem',
          maxWidth: '900px',
        }}
      >
        {/* ======================================================
            RETURN SUBMITTED NOTICE
            ====================================================== */}

        {returnSuccess && (
          <div
            style={{
              padding: '14px 18px',
              marginBottom: '20px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.88rem',
                fontWeight: '700',
                color: '#15803d',
              }}
            >
              Return request submitted successfully
            </p>

            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.8rem',
                color: '#166534',
              }}
            >
              Our team will review your return. You'll receive an
              email once it's approved or rejected, and can track its
              status in your order timeline.{' '}
              <Link
                to="/my-returns"
                style={{ color: '#166534', fontWeight: '700', textDecoration: 'underline', textUnderlineOffset: '2px' }}
              >
                View My Returns →
              </Link>
            </p>
          </div>
        )}

        {/* ======================================================
            REWARDS NAVIGATION NOTICE
            ====================================================== */}

        {targetOrderNumber && targetOrderFound && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              backgroundColor: '#f4f0eb',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: 'var(--color-navy)',
                }}
              >
                Order from Rewards
              </p>

              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: '0.75rem',
                  color: 'var(--color-muted)',
                }}
              >
                Showing Order #{targetOrderNumber}
              </p>
            </div>

            <button
              onClick={() => setSearchParams({})}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--color-navy)',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              View All Orders
            </button>
          </div>
        )}

        {/* ======================================================
            STATUS FILTER CHIPS + MY RETURNS LINK
            ====================================================== */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() =>
                setActiveStatus(status)
              }
              style={{
                padding: '7px 16px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '600',
                border:
                  activeStatus === status
                    ? '1px solid var(--color-navy)'
                    : '1px solid var(--color-border)',
                backgroundColor:
                  activeStatus === status
                    ? 'var(--color-navy)'
                    : 'var(--color-white)',
                color:
                  activeStatus === status
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

          <Link
            to="/my-returns"
            style={{
              padding: '7px 16px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '600',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-navy)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            📦 My Returns
          </Link>
        </div>

        {/* ======================================================
            LOADING
            ====================================================== */}

        {loading && (
          <p
            style={{
              color: 'var(--color-muted)',
              fontSize: '0.95rem',
            }}
          >
            Loading your orders…
          </p>
        )}

        {/* ======================================================
            ERROR
            ====================================================== */}

        {error && (
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              color: '#dc2626',
              fontSize: '0.88rem',
            }}
          >
            {error}
          </div>
        )}

        {/* ======================================================
            TARGET ORDER NOT FOUND
            ====================================================== */}

        {!loading &&
          !error &&
          targetOrderNumber &&
          !targetOrderFound && (
            <div
              style={{
                padding: '20px',
                marginBottom: '20px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                color: '#dc2626',
                fontSize: '0.85rem',
              }}
            >
              We couldn't find Order #
              {targetOrderNumber} in your orders.
            </div>
          )}

        {/* ======================================================
            NO ORDERS
            ====================================================== */}

        {!loading &&
          !error &&
          visibleOrders.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                backgroundColor: 'var(--color-white)',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
              }}
            >
              <p
                style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--color-navy)',
                  marginBottom: '8px',
                }}
              >
                {activeStatus === 'All'
                  ? 'No orders yet'
                  : `No ${activeStatus.toLowerCase()} orders`}
              </p>

              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-muted)',
                  marginBottom: '24px',
                }}
              >
                {activeStatus === 'All'
                  ? "Looks like you haven't placed any orders yet."
                  : 'Try a different status, or view all your orders.'}
              </p>

              <Link
                to={
                  activeStatus === 'All'
                    ? '/shop'
                    : '/orders'
                }
                style={{
                  padding: '11px 28px',
                  backgroundColor:
                    'var(--color-navy)',
                  color: 'var(--color-taupe)',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                }}
              >
                {activeStatus === 'All'
                  ? 'START SHOPPING'
                  : 'VIEW ALL ORDERS'}
              </Link>
            </div>
          )}

        {/* ======================================================
            ORDERS
            ====================================================== */}

        {!loading &&
          !error &&
          orderedVisibleOrders.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {orderedVisibleOrders.map((order) => {
                const statusStyle =
                  STATUS_STYLES[
                    order.orderStatus
                  ] ??
                  STATUS_STYLES.Processing

                const isTargetOrder =
                  targetOrderNumber &&
                  order.orderNumber ===
                    targetOrderNumber

                return (
                  <div
                    key={order._id}
                    style={{
                      backgroundColor:
                        'var(--color-white)',
                      borderRadius: '12px',

                      /*
                        Highlight the order when it was
                        opened from Rewards.
                      */
                      border: isTargetOrder
                        ? '2px solid var(--color-taupe)'
                        : '1px solid var(--color-border)',

                      padding: '24px 28px',

                      boxShadow: isTargetOrder
                        ? '0 4px 18px rgba(13, 26, 42, 0.08)'
                        : 'none',

                      transition:
                        'all 0.2s ease',
                    }}
                  >
                    {/* ==================================================
                        ORDER HEADER
                        ================================================== */}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'flex-start',
                        marginBottom: '16px',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems:
                              'center',
                            gap: '8px',
                            flexWrap:
                              'wrap',
                          }}
                        >
                          <p
                            style={{
                              fontSize:
                                '0.72rem',
                              fontWeight:
                                '700',
                              letterSpacing:
                                '0.1em',
                              color:
                                'var(--color-muted)',
                              textTransform:
                                'uppercase',
                              marginBottom:
                                '4px',
                            }}
                          >
                            Order #
                            {
                              order.orderNumber
                            }
                          </p>

                          {isTargetOrder && (
                            <span
                              style={{
                                padding:
                                  '3px 9px',
                                borderRadius:
                                  '20px',
                                backgroundColor:
                                  '#f4f0eb',
                                color:
                                  'var(--color-navy)',
                                fontSize:
                                  '0.62rem',
                                fontWeight:
                                  '700',
                                letterSpacing:
                                  '0.06em',
                                marginBottom:
                                  '4px',
                              }}
                            >
                              REWARDS HISTORY
                            </span>
                          )}
                        </div>

                        <p
                          style={{
                            fontSize:
                              '0.8rem',
                            color:
                              'var(--color-muted)',
                          }}
                        >
                          {new Date(
                            order.createdAt
                          ).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                        </p>
                      </div>

                      {/* Order status */}

                      <span
                        style={{
                          padding: '4px 14px',
                          borderRadius:
                            '20px',
                          fontSize:
                            '0.72rem',
                          fontWeight: '700',
                          letterSpacing:
                            '0.06em',
                          backgroundColor:
                            statusStyle.bg,
                          color:
                            statusStyle.color,
                        }}
                      >
                        {order.orderStatus.toUpperCase()}
                      </span>
                    </div>

                    {/* ==================================================
                        ORDER ITEMS
                        ================================================== */}

                    <div
                      style={{
                        display: 'flex',
                        flexDirection:
                          'column',
                        gap: '12px',
                        marginBottom:
                          '16px',
                      }}
                    >
                      {order.orderItems.map(
                        (item, i) => (
                          <div
                            key={i}
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              gap: '14px',
                            }}
                          >
                            {/* Product image */}

                            <div
                              style={{
                                width:
                                  '52px',
                                height:
                                  '52px',
                                borderRadius:
                                  '8px',
                                backgroundColor:
                                  '#f3f4f6',
                                overflow:
                                  'hidden',
                                flexShrink:
                                  0,
                              }}
                            >
                              {item.image ? (
                                <img
                                  src={
                                    item.image
                                  }
                                  alt={
                                    item.name
                                  }
                                  style={{
                                    width:
                                      '100%',
                                    height:
                                      '100%',
                                    objectFit:
                                      'cover',
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width:
                                      '100%',
                                    height:
                                      '100%',
                                    display:
                                      'flex',
                                    alignItems:
                                      'center',
                                    justifyContent:
                                      'center',
                                    fontSize:
                                      '1.2rem',
                                  }}
                                >
                                  📦
                                </div>
                              )}
                            </div>

                            {/* Product details */}

                            <div
                              style={{
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <p
                                style={{
                                  fontSize:
                                    '0.88rem',
                                  fontWeight:
                                    '600',
                                  color:
                                    'var(--color-navy)',
                                  marginBottom:
                                    '2px',
                                  whiteSpace:
                                    'nowrap',
                                  overflow:
                                    'hidden',
                                  textOverflow:
                                    'ellipsis',
                                }}
                              >
                                {item.name}
                              </p>

                              <p
                                style={{
                                  fontSize:
                                    '0.78rem',
                                  color:
                                    'var(--color-muted)',
                                }}
                              >
                                Qty:{' '}
                                {
                                  item.quantity
                                }{' '}
                                · Rs.{' '}
                                {item.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* ==================================================
                        ORDER TOTAL / PAYMENT / ACTIONS
                        ================================================== */}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center',
                        paddingTop:
                          '16px',
                        borderTop:
                          '1px solid var(--color-border)',
                        flexWrap:
                          'wrap',
                        gap: '8px',
                      }}
                    >
                      {/* Total + Payment */}

                      <div
                        style={{
                          display:
                            'flex',
                          gap: '20px',
                        }}
                      >
                        {/* Total */}

                        <div>
                          <p
                            style={{
                              fontSize:
                                '0.72rem',
                              color:
                                'var(--color-muted)',
                              marginBottom:
                                '2px',
                            }}
                          >
                            Total
                          </p>

                          <p
                            style={{
                              fontFamily:
                                'var(--font-serif)',
                              fontSize:
                                '1rem',
                              fontWeight:
                                '700',
                              color:
                                'var(--color-navy)',
                            }}
                          >
                            Rs.{' '}
                            {order.totalPrice.toLocaleString()}
                          </p>
                        </div>

                        {/* Payment */}

                        <div>
                          <p
                            style={{
                              fontSize:
                                '0.72rem',
                              color:
                                'var(--color-muted)',
                              marginBottom:
                                '2px',
                            }}
                          >
                            Payment
                          </p>

                          <p
                            style={{
                              fontSize:
                                '0.82rem',
                              fontWeight:
                                '600',
                              color:
                                'var(--color-navy)',
                            }}
                          >
                            {
                              order
                                .paymentInfo
                                .method
                            }{' '}
                            ·{' '}
                            {
                              order
                                .paymentInfo
                                .status
                            }
                          </p>
                        </div>
                      </div>

                      {/* ==================================================
                          ACTION BUTTONS
                          ================================================== */}

                      <div
                        style={{
                          display:
                            'flex',
                          gap: '8px',
                          flexWrap:
                            'wrap',
                        }}
                      >
                        {/* Cancel Order */}

                        {[
                          'Processing',
                          'Confirmed',
                        ].includes(
                          order.orderStatus
                        ) && (
                          <button
                            onClick={() =>
                              handleCancel(
                                order._id
                              )
                            }
                            disabled={
                              cancelling ===
                              order._id
                            }
                            style={{
                              padding:
                                '8px 20px',
                              borderRadius:
                                '8px',
                              border:
                                '1px solid #fecaca',
                              backgroundColor:
                                cancelling ===
                                order._id
                                  ? '#f3f4f6'
                                  : '#fef2f2',
                              color:
                                cancelling ===
                                order._id
                                  ? '#9ca3af'
                                  : '#dc2626',
                              fontSize:
                                '0.78rem',
                              fontWeight:
                                '600',
                              cursor:
                                cancelling ===
                                order._id
                                  ? 'not-allowed'
                                  : 'pointer',
                              transition:
                                'all 0.2s ease',
                            }}
                          >
                            {cancelling ===
                            order._id
                              ? 'Cancelling…'
                              : 'Cancel Order'}
                          </button>
                        )}

                        {/* Return Items */}

                        {order.orderStatus ===
                          'Delivered' && (
                          <Link
                            to={`/order/${order._id}/return`}
                            style={{
                              padding:
                                '8px 20px',
                              borderRadius:
                                '8px',
                              border:
                                '1px solid var(--color-border)',
                              backgroundColor:
                                'var(--color-white)',
                              color:
                                'var(--color-navy)',
                              fontSize:
                                '0.78rem',
                              fontWeight:
                                '600',
                              textDecoration:
                                'none',
                              transition:
                                'all 0.2s ease',
                            }}
                          >
                            Return Items
                          </Link>
                        )}

                        {/* Download Invoice */}

                        {order.orderStatus === 'Delivered' &&
                          order.paymentInfo?.status === 'Paid' && (
                            <button
                              onClick={() =>
                                handleDownloadInvoice(order._id, order.orderNumber)
                              }
                              disabled={downloadingInvoice === order._id}
                              style={{
                                padding: '8px 20px',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-white)',
                                color: 'var(--color-navy)',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                cursor:
                                  downloadingInvoice === order._id
                                    ? 'not-allowed'
                                    : 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              {downloadingInvoice === order._id
                                ? 'Downloading…'
                                : 'Download Invoice'}
                            </button>
                          )}
                      </div>
                    </div>

                    {/* ==================================================
                        ORDER TIMELINE
                        ================================================== */}

                    <OrderTimeline
                      status={
                        order.orderStatus
                      }
                      statusHistory={
                        order.statusHistory
                      }
                    />
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