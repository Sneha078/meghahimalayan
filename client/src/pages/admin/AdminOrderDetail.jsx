
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getAdminOrder, updateOrderStatus, deleteOrder } from '../../api/adminClient'

const STATUS_COLORS = {
  Processing: { bg: '#fef9c3', color: '#854d0e' },
  Confirmed:  { bg: '#dbeafe', color: '#1e40af' },
  Shipped:    { bg: '#ede9fe', color: '#6d28d9' },
  Delivered:  { bg: '#dcfce7', color: '#15803d' },
  Cancelled:  { bg: '#fee2e2', color: '#dc2626' },
}

const STATUS_OPTIONS = ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']

function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [updateMsg, setUpdateMsg] = useState('')

  useEffect(() => {
    getAdminOrder(id)
      .then((data) => {
        const o = data.order ?? data
        setOrder(o)
        setNewStatus(o.orderStatus)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleUpdateStatus = async () => {
    if (newStatus === order.orderStatus) return
    setUpdating(true)
    setUpdateMsg('')
    try {
      await updateOrderStatus(id, newStatus)
      setOrder((prev) => ({ ...prev, orderStatus: newStatus }))
      setUpdateMsg('Status updated successfully.')
    } catch (err) {
      setUpdateMsg(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this order permanently? This cannot be undone.')) return
    setDeleting(true)
    try {
      await deleteOrder(id)
      navigate('/admin/orders')
    } catch (err) {
      alert(err.message)
      setDeleting(false)
    }
  }

  if (loading) return <div style={{ padding: '32px', color: '#64748b' }}>Loading order…</div>
  if (error)   return <div style={{ padding: '32px', color: '#dc2626' }}>{error}</div>
  if (!order)  return null

  const s = STATUS_COLORS[order.orderStatus] ?? STATUS_COLORS.Processing

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>

      {/* Back + Header */}
      <Link to="/admin/orders" style={{
        fontSize: '0.85rem', color: '#64748b',
        textDecoration: 'none', display: 'inline-flex',
        alignItems: 'center', gap: '4px', marginBottom: '20px',
      }}>
        ← Back to Orders
      </Link>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
            Order #{order.orderNumber}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <span style={{
          padding: '6px 16px', borderRadius: '20px',
          fontSize: '0.82rem', fontWeight: '700',
          backgroundColor: s.bg, color: s.color,
        }}>
          {order.orderStatus}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

       
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px',
          border: '1px solid #e2e8f0', padding: '24px',
        }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
            Update Status
          </h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={{
                padding: '9px 14px', borderRadius: '8px',
                border: '1px solid #e2e8f0', fontSize: '0.88rem',
                color: '#0f172a', outline: 'none', backgroundColor: '#f8fafc',
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={handleUpdateStatus}
              disabled={updating || newStatus === order.orderStatus}
              style={{
                padding: '9px 24px', borderRadius: '8px',
                backgroundColor: updating || newStatus === order.orderStatus ? '#e2e8f0' : 'var(--color-navy)',
                color: updating || newStatus === order.orderStatus ? '#94a3b8' : '#ffffff',
                border: 'none', fontSize: '0.85rem', fontWeight: '600',
                cursor: updating || newStatus === order.orderStatus ? 'not-allowed' : 'pointer',
              }}
            >
              {updating ? 'Updating…' : 'Update'}
            </button>
            {updateMsg && (
              <p style={{ fontSize: '0.82rem', color: updateMsg.includes('success') ? '#16a34a' : '#dc2626' }}>
                {updateMsg}
              </p>
            )}
          </div>
        </div>

       
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px',
          border: '1px solid #e2e8f0', overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
              Items ({order.orderItems?.length})
            </h2>
          </div>
          {order.orderItems?.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '16px 24px', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none',
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '8px',
                backgroundColor: '#f1f5f9', overflow: 'hidden', flexShrink: 0,
              }}>
                {item.image ? (
                  <img src={item.image} alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.88rem', fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>
                  {item.name}
                </p>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Qty: {item.quantity} · Rs. {item.price?.toLocaleString()}
                </p>
              </div>
              <p style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>
                Rs. {(item.price * item.quantity)?.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

       
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '12px',
            border: '1px solid #e2e8f0', padding: '24px',
          }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
              Shipping Info
            </h2>
            {[
              ['Name',    order.shippingInfo?.name],
              ['Phone',   order.shippingInfo?.phoneNo],
              ['Address', order.shippingInfo?.address],
              ['City',    order.shippingInfo?.city],
              ['State',   order.shippingInfo?.state],
            ].map(([label, value]) => value ? (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{label}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#0f172a' }}>{value}</span>
              </div>
            ) : null)}
          </div>

          <div style={{
            backgroundColor: '#ffffff', borderRadius: '12px',
            border: '1px solid #e2e8f0', padding: '24px',
          }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
              Payment & Summary
            </h2>
            {[
              ['Method',   order.paymentInfo?.method],
              ['Status',   order.paymentInfo?.status],
              ['Subtotal', `Rs. ${order.itemsPrice?.toLocaleString()}`],
              ['Shipping', `Rs. ${order.shippingPrice?.toLocaleString()}`],
              ['Total',    `Rs. ${order.totalPrice?.toLocaleString()}`],
            ].map(([label, value]) => value ? (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', marginBottom: '8px',
                fontWeight: label === 'Total' ? '700' : '400',
              }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{label}</span>
                <span style={{ fontSize: '0.82rem', color: label === 'Total' ? '#0f172a' : '#475569' }}>{value}</span>
              </div>
            ) : null)}
          </div>
        </div>

       
        <div style={{
          backgroundColor: '#fff5f5', borderRadius: '12px',
          border: '1px solid #fecaca', padding: '24px',
        }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#dc2626', marginBottom: '8px' }}>
            Danger Zone
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
            Deleting an order is permanent and cannot be undone.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: '9px 24px', borderRadius: '8px',
              backgroundColor: deleting ? '#e2e8f0' : '#dc2626',
              color: deleting ? '#94a3b8' : '#ffffff',
              border: 'none', fontSize: '0.85rem', fontWeight: '600',
              cursor: deleting ? 'not-allowed' : 'pointer',
            }}
          >
            {deleting ? 'Deleting…' : 'Delete Order'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default AdminOrderDetail
