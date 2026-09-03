
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllOrders } from '../../api/adminClient'

const STATUS_COLORS = {
  Processing: { bg: '#fef9c3', color: '#854d0e' },
  Confirmed:  { bg: '#dbeafe', color: '#1e40af' },
  Shipped:    { bg: '#ede9fe', color: '#6d28d9' },
  Delivered:  { bg: '#dcfce7', color: '#15803d' },
  Cancelled:  { bg: '#fee2e2', color: '#dc2626' },
}

function AdminOrders() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filter, setFilter]   = useState('All')

  useEffect(() => {
    getAllOrders()
      .then((data) => setOrders(data.orders ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const statuses = ['All', 'Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']

  const filtered = filter === 'All'
    ? orders
    : orders.filter((o) => o.orderStatus === filter)

  return (
    <div style={{ padding: '32px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
          Orders
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          {orders.length} total orders
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap',
      }}>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '6px 16px', borderRadius: '20px',
              fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
              border: '1px solid',
              backgroundColor: filter === s ? 'var(--color-navy)' : '#ffffff',
              color: filter === s ? '#ffffff' : '#64748b',
              borderColor: filter === s ? 'var(--color-navy)' : '#e2e8f0',
              transition: 'all 0.15s ease',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: '10px',
          backgroundColor: '#fef2f2', border: '1px solid #fecaca',
          color: '#dc2626', fontSize: '0.88rem', marginBottom: '24px',
        }}>
          {error}
        </div>
      )}

      {loading && <p style={{ color: '#64748b' }}>Loading orders…</p>}

      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px',
          backgroundColor: '#ffffff', borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>No orders found.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px',
          border: '1px solid #e2e8f0', overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Date', ''].map((h) => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: '0.75rem', fontWeight: '700',
                      color: '#64748b', textTransform: 'uppercase',
                      letterSpacing: '0.06em', whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const s = STATUS_COLORS[order.orderStatus] ?? STATUS_COLORS.Processing
                  return (
                    <tr key={order._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                        #{order.orderNumber}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>
                        {order.shippingInfo?.name ?? '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>
                        {order.orderItems?.length ?? 0} item{order.orderItems?.length !== 1 ? 's' : ''}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                        Rs. {order.totalPrice?.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: '0.72rem', fontWeight: '700',
                          backgroundColor: s.bg, color: s.color,
                        }}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <Link
                          to={`/admin/orders/${order._id}`}
                          style={{
                            fontSize: '0.8rem', fontWeight: '600',
                            color: '#2563eb', textDecoration: 'none',
                          }}
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders
