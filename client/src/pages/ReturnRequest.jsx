// src/pages/ReturnRequest.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMySingleOrder, submitReturnRequest } from '../api/productClient'
import PageBanner from '../components/PageBanner'

const RETURN_REASONS = [
  'Wrong item received',
  'Item damaged or defective',
  'Item not as described',
  'Changed my mind',
  'Size / fit issue',
  'Duplicate order',
  'Other',
]

// Payment methods where we ask the customer for a refund destination account
// COD orders need bank details since there's no digital payment to reverse
const NEEDS_BANK_DETAILS = ['COD']

function ReturnRequest() {
  const { id: orderId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Per-item selection: { [productId]: { selected, reason, description, images } }
  const [items, setItems] = useState({})

  // Refund method (only asked for COD)
  const [refundMethod, setRefundMethod] = useState('bank_transfer')

  // Bank / wallet details (shown only when needed)
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // ── Load the order ────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }

    let cancelled = false
    setLoading(true)

    getMySingleOrder(orderId)
      .then((data) => {
        if (cancelled) return
        const ord = data.order ?? data
        setOrder(ord)

        // Initialise per-item state
        const init = {}
        ;(ord.orderItems ?? []).forEach((item) => {
          const key = item.product?._id ?? item.product ?? item._id
          init[key] = { selected: false, reason: '', description: '', images: [], previews: [] }
        })
        setItems(init)
      })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [orderId, user, authLoading, navigate])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleItem = (key) => {
    setItems((prev) => ({
      ...prev,
      [key]: { ...prev[key], selected: !prev[key].selected },
    }))
  }

  const setItemField = (key, field, value) => {
    setItems((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  const handleImages = (key, files) => {
    const arr = Array.from(files).slice(0, 5) // max 5 images per item
    const previews = arr.map((f) => URL.createObjectURL(f))
    setItems((prev) => ({ ...prev, [key]: { ...prev[key], images: arr, previews } }))
  }

  const selectedCount = Object.values(items).filter((v) => v.selected).length

  const paymentMethod = order?.paymentInfo?.method ?? 'COD'
  const isCOD = NEEDS_BANK_DETAILS.includes(paymentMethod)

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)

    const selectedItems = (order?.orderItems ?? []).filter((item) => {
      const key = item.product?._id ?? item.product ?? item._id
      return items[key]?.selected
    })

    if (selectedItems.length === 0) {
      setSubmitError('Please select at least one item to return.')
      return
    }

    for (const item of selectedItems) {
      const key = item.product?._id ?? item.product ?? item._id
      if (!items[key].reason) {
        setSubmitError(`Please choose a return reason for "${item.name}".`)
        return
      }
    }

    if (isCOD) {
      if (!bankDetails.accountName.trim() || !bankDetails.accountNumber.trim() || !bankDetails.bankName.trim()) {
        setSubmitError('Please fill in all bank / account details for your refund.')
        return
      }
    }

    setSubmitting(true)

    try {
      // Convert images to base64
      const returnItems = await Promise.all(
        selectedItems.map(async (item) => {
          const key = item.product?._id ?? item.product ?? item._id
          const meta = items[key]
          const imageBase64 = await Promise.all(
            meta.images.map(
              (file) =>
                new Promise((res, rej) => {
                  const reader = new FileReader()
                  reader.onload = () => res(reader.result)
                  reader.onerror = rej
                  reader.readAsDataURL(file)
                })
            )
          )
          return {
            product: key,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            reason: meta.reason,
            description: meta.description,
            images: imageBase64,
          }
        })
      )

      const payload = {
        orderId,
        items: returnItems,
        refundMethod: isCOD ? refundMethod : paymentMethod.toLowerCase().replace(' ', '_'),
        ...(isCOD && refundMethod === 'bank_transfer' ? { bankDetails } : {}),
      }

      await submitReturnRequest(payload)
      navigate('/orders', { state: { returnSuccess: true } })
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render states ─────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div style={{ backgroundColor: 'var(--color-sbg)', minHeight: '100vh' }}>
        <PageBanner eyebrow="My Orders" title="Return Request" />
        <div style={{ padding: '60px 5rem' }}>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>Loading order…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ backgroundColor: 'var(--color-sbg)', minHeight: '100vh' }}>
        <PageBanner eyebrow="My Orders" title="Return Request" />
        <div style={{ padding: '60px 5rem' }}>
          <div style={styles.errorBox}>{error}</div>
        </div>
      </div>
    )
  }

  if (!order) return null

  // Only Delivered orders are eligible
  if (order.orderStatus !== 'Delivered') {
    return (
      <div style={{ backgroundColor: 'var(--color-sbg)', minHeight: '100vh' }}>
        <PageBanner eyebrow="My Orders" title="Return Request" />
        <div style={{ padding: '60px 5rem', maxWidth: '700px' }}>
          <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
            <p style={{ fontSize: '2rem', marginBottom: '16px' }}>⚠️</p>
            <p style={{ fontWeight: '700', color: 'var(--color-navy)', marginBottom: '8px' }}>
              Returns are only available for delivered orders.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '24px' }}>
              Current status: <strong>{order.orderStatus}</strong>
            </p>
            <Link to="/orders" style={styles.primaryBtn}>Back to My Orders</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'var(--color-sbg)', minHeight: '100vh' }}>
      <PageBanner eyebrow="My Orders" title="Return Request" />

      <form onSubmit={handleSubmit} style={{ padding: '40px 5rem', maxWidth: '780px' }}>

        {/* Order reference */}
        <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '28px' }}>
          Order{' '}
          <span style={{ fontWeight: '700', color: 'var(--color-navy)' }}>
            #{order.orderNumber}
          </span>{' '}
          · {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {/* ── Step 1: Select items ─────────────────────────────────────────── */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={styles.sectionHeading}>1. Select items to return</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {order.orderItems.map((item) => {
              const key = item.product?._id ?? item.product ?? item._id
              const meta = items[key] ?? {}

              return (
                <div
                  key={key}
                  style={{
                    ...styles.card,
                    border: meta.selected
                      ? '1.5px solid var(--color-navy)'
                      : '1px solid var(--color-border)',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {/* Item row */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={meta.selected ?? false}
                      onChange={() => toggleItem(key)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--color-navy)', flexShrink: 0 }}
                    />

                    {/* Image */}
                    <div style={styles.thumb}>
                      {item.image
                        ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '1.4rem' }}>📦</span>
                      }
                    </div>

                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-navy)', marginBottom: '2px' }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                        Qty: {item.quantity} · Rs. {item.price.toLocaleString()}
                      </p>
                    </div>
                  </label>

                  {/* Expanded fields when selected */}
                  {meta.selected && (
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                      {/* Reason */}
                      <div>
                        <label style={styles.label}>Return reason *</label>
                        <select
                          value={meta.reason}
                          onChange={(e) => setItemField(key, 'reason', e.target.value)}
                          required
                          style={styles.select}
                        >
                          <option value="">Select a reason…</option>
                          {RETURN_REASONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>

                      {/* Description */}
                      <div>
                        <label style={styles.label}>Description (optional)</label>
                        <textarea
                          value={meta.description}
                          onChange={(e) => setItemField(key, 'description', e.target.value)}
                          rows={3}
                          placeholder="Describe the issue in detail…"
                          style={{ ...styles.input, resize: 'vertical', minHeight: '80px' }}
                        />
                      </div>

                      {/* Images */}
                      <div>
                        <label style={styles.label}>Upload photos (up to 5)</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleImages(key, e.target.files)}
                          style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}
                        />
                        {meta.previews?.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                            {meta.previews.map((src, i) => (
                              <img
                                key={i}
                                src={src}
                                alt={`preview-${i}`}
                                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Step 2: Refund method (COD only) ────────────────────────────── */}
        {isCOD && selectedCount > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <h2 style={styles.sectionHeading}>2. Refund method</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', marginBottom: '16px' }}>
              Your original payment was <strong>Cash on Delivery</strong>. Choose how you'd like to receive your refund.
            </p>

            <div style={styles.card}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {[
                  { value: 'bank_transfer', label: '🏦 Bank transfer' },
                  { value: 'esewa', label: '📱 eSewa' },
                  { value: 'khalti', label: '📱 Khalti' },
                ].map(({ value, label }) => (
                  <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '500', color: 'var(--color-navy)' }}>
                    <input
                      type="radio"
                      name="refundMethod"
                      value={value}
                      checked={refundMethod === value}
                      onChange={() => setRefundMethod(value)}
                      style={{ accentColor: 'var(--color-navy)' }}
                    />
                    {label}
                  </label>
                ))}
              </div>

              {/* Bank details fields */}
              {refundMethod === 'bank_transfer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                  <div>
                    <label style={styles.label}>Account holder name *</label>
                    <input
                      type="text"
                      value={bankDetails.accountName}
                      onChange={(e) => setBankDetails((p) => ({ ...p, accountName: e.target.value }))}
                      placeholder="Full name on account"
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Account number *</label>
                    <input
                      type="text"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails((p) => ({ ...p, accountNumber: e.target.value }))}
                      placeholder="e.g. 0100123456789"
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Bank name *</label>
                    <input
                      type="text"
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails((p) => ({ ...p, bankName: e.target.value }))}
                      placeholder="e.g. NMB Bank, Nabil Bank"
                      style={styles.input}
                    />
                  </div>
                </div>
              )}

              {/* eSewa / Khalti — just need the registered number */}
              {(refundMethod === 'esewa' || refundMethod === 'khalti') && (
                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                  <label style={styles.label}>
                    {refundMethod === 'esewa' ? 'eSewa' : 'Khalti'} registered mobile number *
                  </label>
                  <input
                    type="tel"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails((p) => ({ ...p, accountNumber: e.target.value }))}
                    placeholder="98XXXXXXXX"
                    style={styles.input}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Step 2 (non-COD): just confirm refund destination ───────────── */}
        {!isCOD && selectedCount > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <h2 style={styles.sectionHeading}>2. Refund destination</h2>
            <div style={{ ...styles.card, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: '0.88rem', color: '#15803d', fontWeight: '500' }}>
                ✅ Your refund will be returned to your original payment method ({paymentMethod}).
              </p>
              <p style={{ fontSize: '0.8rem', color: '#166534', marginTop: '6px' }}>
                Refunds typically appear within 5–7 business days after we receive the item.
              </p>
            </div>
          </section>
        )}

        {/* ── Policy note ──────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: '#fef9c3', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 18px', fontSize: '0.82rem', color: '#854d0e', marginBottom: '28px' }}>
          Items must be returned within <strong>7 days</strong> of delivery in original packaging with tags attached. Final sale items are not eligible.
        </div>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {submitError && (
          <div style={{ ...styles.errorBox, marginBottom: '20px' }}>
            {submitError}
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={submitting || selectedCount === 0}
            style={{
              ...styles.primaryBtn,
              opacity: submitting || selectedCount === 0 ? 0.55 : 1,
              cursor: submitting || selectedCount === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Submitting…' : `Submit Return${selectedCount > 1 ? ` (${selectedCount} items)` : ''}`}
          </button>

          <Link to="/orders" style={styles.ghostBtn}>Cancel</Link>
        </div>

      </form>
    </div>
  )
}

// ── Shared micro-styles ───────────────────────────────────────────────────────
const styles = {
  card: {
    backgroundColor: 'var(--color-white)',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    padding: '20px 24px',
  },
  sectionHeading: {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--color-navy)',
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: '600',
    color: 'var(--color-navy)',
    marginBottom: '6px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    fontSize: '0.88rem',
    color: 'var(--color-navy)',
    backgroundColor: 'var(--color-white)',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    fontSize: '0.88rem',
    color: 'var(--color-navy)',
    backgroundColor: 'var(--color-white)',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
  },
  thumb: {
    width: '56px',
    height: '56px',
    borderRadius: '8px',
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    display: 'inline-block',
    padding: '12px 32px',
    backgroundColor: 'var(--color-navy)',
    color: 'var(--color-taupe)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '700',
    letterSpacing: '0.1em',
    textDecoration: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  ghostBtn: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: 'transparent',
    color: 'var(--color-muted)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '600',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  errorBox: {
    padding: '14px 18px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    color: '#dc2626',
    fontSize: '0.85rem',
  },
}

export default ReturnRequest
