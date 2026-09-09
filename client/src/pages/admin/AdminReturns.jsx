import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllReturns } from '../../api/adminClient'

const STATUS_COLORS = {
  Pending:          { bg: '#fef9c3', color: '#854d0e' },
  Approved:         { bg: '#dbeafe', color: '#1e40af' },
  'Item Received':  { bg: '#ede9fe', color: '#6d28d9' },
  Completed:        { bg: '#dcfce7', color: '#15803d' },
  Rejected:         { bg: '#fee2e2', color: '#dc2626' },
  Cancelled:        { bg: '#f1f5f9', color: '#64748b' },
  Expired:          { bg: '#f1f5f9', color: '#64748b' },
}

const STATUSES = ['All', 'Pending', 'Approved', 'Item Received', 'Completed', 'Rejected', 'Cancelled', 'Expired']

function AdminReturns() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filter !== 'All') params.status = filter
    if (search.trim()) params.search = search.trim()

    getAllReturns(params)
      .then((data) => setReturns(data.returns ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [filter, search])

  return (
    <div style={{ padding: '32px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
          Returns
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          {returns.length} return{returns.length !== 1 ? 's' : ''}{filter !== 'All' ? ` · ${filter}` : ''}
        </p>
      </div>

      {/* Filter tabs + search */}
      <div style={{
        display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {STATUSES.map((s) => (
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
                whiteSpace: 'nowrap',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search return #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: '8px',
            border: '1px solid #e2e8f0', fontSize: '0.85rem',
            minWidth: '220px', outline: 'none',
          }}
        />
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

      {loading && <p style={{ color: '#64748b' }}>Loading returns…</p>}

      {!loading && returns.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px',
          backgroundColor: '#ffffff', borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>No return requests found.</p>
        </div>
      )}

      {!loading && returns.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px',
          border: '1px solid #e2e8f0', overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Return #', 'Order #', 'Customer', 'Reason', 'Requested', 'Refund Status', 'Status', 'Date', ''].map((h) => (
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
                {returns.map((ret) => {
                  const s = STATUS_COLORS[ret.status] ?? STATUS_COLORS.Pending
                  return (
                    <tr key={ret._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                        #{ret.returnNumber ?? ret._id.slice(-6).toUpperCase()}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>
                        {ret.order?.orderNumber ? `#${ret.order.orderNumber}` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>
                        {ret.user?.name ?? '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>
                        {ret.reason}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                        Rs. {ret.refund?.requestedAmount?.toLocaleString() ?? '0'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#64748b' }}>
                        {ret.refundStatus}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: '0.72rem', fontWeight: '700',
                          backgroundColor: s.bg, color: s.color,
                        }}>
                          {ret.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {new Date(ret.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <Link
                          to={`/admin/returns/${ret._id}`}
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

export default AdminReturns