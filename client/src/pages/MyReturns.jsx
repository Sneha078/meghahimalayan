// src/pages/MyReturns.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyReturns, cancelReturn } from '../api/productClient'
import { useAuth } from '../context/AuthContext'
import PageBanner from '../components/PageBanner'

// ── Status colours ────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Pending:        { bg: '#fef9c3', color: '#854d0e' },
  Approved:       { bg: '#dbeafe', color: '#1e40af' },
  'Item Received':{ bg: '#ede9fe', color: '#6d28d9' },
  Completed:      { bg: '#dcfce7', color: '#15803d' },
  Rejected:       { bg: '#fee2e2', color: '#dc2626' },
  Cancelled:      { bg: '#f3f4f6', color: '#6b7280' },
  Expired:        { bg: '#fff7ed', color: '#c2410c' },
}

const REFUND_STATUS_STYLES = {
  Pending:            { bg: '#fef9c3', color: '#854d0e' },
  Processing:         { bg: '#dbeafe', color: '#1e40af' },
  Succeeded:          { bg: '#dcfce7', color: '#15803d' },
  Failed:             { bg: '#fee2e2', color: '#dc2626' },
  Cancelled:          { bg: '#f3f4f6', color: '#6b7280' },
  'Partially Refunded': { bg: '#ede9fe', color: '#6d28d9' },
  'Not Applicable':   { bg: '#f3f4f6', color: '#9ca3af' },
}

function StatusBadge({ label, styleMap }) {
  const s = styleMap[label] ?? { bg: '#f3f4f6', color: '#374151' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '99px',
        fontSize: '0.72rem',
        fontWeight: '700',
        letterSpacing: '0.05em',
        backgroundColor: s.bg,
        color: s.color,
      }}
    >
      {label}
    </span>
  )
}

function MyReturns() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(null)  // returnId being cancelled
  const [expandedId, setExpandedId] = useState(null)  // which return card is expanded

  // ── Load returns ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }

    let cancelled = false
    setLoading(true)
    setError(null)

    getMyReturns()
      .then((data) => {
        if (!cancelled) setReturns(data.returns ?? [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [user, authLoading, navigate])

  // ── Cancel a return ───────────────────────────────────────────────────────
  const handleCancel = async (returnId) => {
    if (!window.confirm('Are you sure you want to cancel this return request?')) return
    setCancelling(returnId)
    try {
      await cancelReturn(returnId)
      setReturns((prev) =>
        prev.map((r) =>
          r._id === returnId
            ? { ...r, status: 'Cancelled', refundStatus: 'Cancelled' }
            : r
        )
      )
    } catch (err) {
      alert(err.message)
    } finally {
      setCancelling(null)
    }
  }

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id))

  // ── Loading / auth ────────────────────────────────────────────────────────
  if (authLoading) return null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: 'var(--color-sbg)', minHeight: '100vh' }}>
      <PageBanner eyebrow="Your Account" title="My Returns" />

      <div style={{ padding: '40px 5rem', maxWidth: '860px' }}>

        {/* Back link */}
        <Link
          to="/orders"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: '600',
            color: 'var(--color-muted)',
            textDecoration: 'none',
            marginBottom: '28px',
          }}
        >
          ← Back to My Orders
        </Link>

        {/* ── Error ── */}
        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>
            Loading your returns…
          </p>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && returns.length === 0 && (
          <div style={{ ...styles.card, textAlign: 'center', padding: '56px 40px' }}>
            <p style={{ fontSize: '2.2rem', marginBottom: '12px' }}>📦</p>
            <p style={{ fontWeight: '700', color: 'var(--color-navy)', marginBottom: '8px' }}>
              No return requests yet
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '24px' }}>
              If you need to return an item, go to your delivered orders and click "Return Items".
            </p>
            <Link to="/orders" style={styles.primaryBtn}>View My Orders</Link>
          </div>
        )}

        {/* ── Return cards ── */}
        {!loading && returns.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {returns.map((ret) => {
              const isExpanded = expandedId === ret._id
              const canCancel = ret.status === 'Pending'

              return (
                <div key={ret._id} style={styles.card}>

                  {/* ── Card header ── */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    {/* Left: return number + dates */}
                    <div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginBottom: '2px' }}>
                        Return Request
                      </p>
                      <p style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--color-navy)', marginBottom: '4px' }}>
                        #{ret.returnNumber}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                        Submitted {new Date(ret.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                        {ret.order?.orderNumber && (
                          <> · Order <span style={{ color: 'var(--color-navy)', fontWeight: '600' }}>#{ret.order.orderNumber}</span></>
                        )}
                      </p>
                    </div>

                    {/* Right: status badges */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <StatusBadge label={ret.status} styleMap={STATUS_STYLES} />
                      {ret.refundStatus && ret.refundStatus !== 'Not Applicable' && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
                          Refund:{' '}
                          <StatusBadge label={ret.refundStatus} styleMap={REFUND_STATUS_STYLES} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Item thumbnails (always visible) ── */}
                  <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {ret.items.map((item) => (
                      <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={styles.thumb}>
                          {item.image
                            ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: '1.2rem' }}>📦</span>
                          }
                        </div>
                        <div>
                          <p style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--color-navy)' }}>{item.name}</p>
                          <p style={{ fontSize: '0.74rem', color: 'var(--color-muted)' }}>
                            Qty: {item.quantity} · {item.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Refund amount summary ── */}
                  {ret.refund && (
                    <div
                      style={{
                        marginTop: '14px',
                        paddingTop: '14px',
                        borderTop: '1px solid var(--color-border)',
                        display: 'flex',
                        gap: '28px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <p style={styles.metaLabel}>Refund Requested</p>
                        <p style={styles.metaValue}>Rs. {ret.refund.requestedAmount?.toLocaleString()}</p>
                      </div>
                      {ret.refund.approvedAmount > 0 && (
                        <div>
                          <p style={styles.metaLabel}>Approved Amount</p>
                          <p style={{ ...styles.metaValue, color: '#15803d' }}>Rs. {ret.refund.approvedAmount?.toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <p style={styles.metaLabel}>Refund Method</p>
                        <p style={styles.metaValue}>{ret.refund.method ?? '—'}</p>
                      </div>
                    </div>
                  )}

                  {/* ── Expand / collapse details ── */}
                  <button
                    onClick={() => toggleExpand(ret._id)}
                    style={{
                      marginTop: '14px',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      color: 'var(--color-navy)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: '3px',
                    }}
                  >
                    {isExpanded ? 'Hide details ▲' : 'View details ▼'}
                  </button>

                  {/* ── Expanded detail section ── */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                      }}
                    >
                      {/* Description */}
                      {ret.description && (
                        <div>
                          <p style={styles.metaLabel}>Customer Description</p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-navy)', whiteSpace: 'pre-wrap' }}>{ret.description}</p>
                        </div>
                      )}

                      {/* Admin remarks */}
                      {ret.adminRemarks && (
                        <div style={{ backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '12px 16px', border: '1px solid #bbf7d0' }}>
                          <p style={{ ...styles.metaLabel, color: '#166534' }}>Admin Remarks</p>
                          <p style={{ fontSize: '0.85rem', color: '#15803d' }}>{ret.adminRemarks}</p>
                        </div>
                      )}

                      {/* Per-item details */}
                      <div>
                        <p style={{ ...styles.metaLabel, marginBottom: '10px' }}>Items</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {ret.items.map((item) => (
                            <div
                              key={item._id}
                              style={{
                                display: 'flex',
                                gap: '14px',
                                alignItems: 'flex-start',
                                padding: '12px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--color-sbg)',
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              <div style={{ ...styles.thumb, flexShrink: 0 }}>
                                {item.image
                                  ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : <span style={{ fontSize: '1.2rem' }}>📦</span>
                                }
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--color-navy)', marginBottom: '4px' }}>{item.name}</p>
                                <p style={{ fontSize: '0.76rem', color: 'var(--color-muted)', marginBottom: '4px' }}>
                                  Qty: {item.quantity} · Rs. {item.itemPrice?.toLocaleString()} · Reason: {item.reason}
                                </p>
                                {item.itemCondition && item.itemCondition !== 'Not Evaluated' && (
                                  <p style={{ fontSize: '0.74rem', color: 'var(--color-muted)' }}>Condition: {item.itemCondition}</p>
                                )}
                                {/* Item photos */}
                                {item.images?.length > 0 && (
                                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                                    {item.images.map((img, i) => (
                                      <a key={i} href={img.url} target="_blank" rel="noreferrer">
                                        <img
                                          src={img.url}
                                          alt={`return-photo-${i + 1}`}
                                          style={{ width: '54px', height: '54px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                                        />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status history */}
                      {ret.statusHistory?.length > 0 && (
                        <div>
                          <p style={{ ...styles.metaLabel, marginBottom: '10px' }}>Status History</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {ret.statusHistory.map((entry, i) => (
                              <div
                                key={i}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '10px',
                                  fontSize: '0.8rem',
                                }}
                              >
                                <span
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--color-navy)',
                                    flexShrink: 0,
                                    marginTop: '4px',
                                  }}
                                />
                                <div>
                                  <span style={{ fontWeight: '600', color: 'var(--color-navy)' }}>{entry.status}</span>
                                  {entry.note && (
                                    <span style={{ color: 'var(--color-muted)' }}> — {entry.note}</span>
                                  )}
                                  <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: '1px' }}>
                                    {new Date(entry.changedAt).toLocaleDateString('en-US', {
                                      year: 'numeric', month: 'short', day: 'numeric',
                                      hour: '2-digit', minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key dates */}
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        {ret.returnShippingDeadline && (
                          <div>
                            <p style={styles.metaLabel}>Ship Item By</p>
                            <p style={{ ...styles.metaValue, color: '#c2410c', fontWeight: '700' }}>
                              {new Date(ret.returnShippingDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        )}
                        {ret.approvedAt && (
                          <div>
                            <p style={styles.metaLabel}>Approved At</p>
                            <p style={styles.metaValue}>{new Date(ret.approvedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          </div>
                        )}
                        {ret.completedAt && (
                          <div>
                            <p style={styles.metaLabel}>Completed At</p>
                            <p style={styles.metaValue}>{new Date(ret.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          </div>
                        )}
                        {ret.refundedAt && (
                          <div>
                            <p style={styles.metaLabel}>Refunded At</p>
                            <p style={{ ...styles.metaValue, color: '#15803d' }}>{new Date(ret.refundedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Actions ── */}
                  {canCancel && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                      <button
                        onClick={() => handleCancel(ret._id)}
                        disabled={cancelling === ret._id}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '8px',
                          border: '1px solid #fecaca',
                          backgroundColor: cancelling === ret._id ? '#f3f4f6' : '#fef2f2',
                          color: cancelling === ret._id ? '#9ca3af' : '#dc2626',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          cursor: cancelling === ret._id ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {cancelling === ret._id ? 'Cancelling…' : 'Cancel Return'}
                      </button>
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Micro-styles ──────────────────────────────────────────────────────────────
const styles = {
  card: {
    backgroundColor: 'var(--color-white)',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    padding: '20px 24px',
  },
  thumb: {
    width: '52px',
    height: '52px',
    borderRadius: '8px',
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: {
    fontSize: '0.68rem',
    fontWeight: '600',
    color: 'var(--color-muted)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '3px',
  },
  metaValue: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--color-navy)',
  },
  primaryBtn: {
    display: 'inline-block',
    padding: '12px 28px',
    backgroundColor: 'var(--color-navy)',
    color: 'var(--color-taupe)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textDecoration: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  errorBox: {
    padding: '14px 18px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    color: '#dc2626',
    fontSize: '0.85rem',
    marginBottom: '20px',
  },
}

export default MyReturns
