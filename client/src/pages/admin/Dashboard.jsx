import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats } from '../../api/adminClient'
import { useSocket } from '../../context/SocketContext'

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, link, live }) {
  return (
    <Link to={link ?? '#'} style={{ textDecoration: 'none' }}>
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          border: `1px solid ${live ? '#bfdbfe' : '#e2e8f0'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          transition: 'box-shadow 0.2s ease, border-color 0.3s ease',
          cursor: link ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
      >
        {/* Live pulse indicator */}
        {live && (
          <span style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
          }} />
        )}
        <div style={{
          width: '52px', height: '52px', borderRadius: '12px',
          backgroundColor: (color ?? '#64748b') + '20',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>
            {label}
          </p>
          <p style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>
            {value ?? '—'}
          </p>
        </div>
      </div>
    </Link>
  )
}

// ── Status badge ───────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Processing: { bg: '#fef9c3', color: '#854d0e' },
  Confirmed:  { bg: '#dbeafe', color: '#1e40af' },
  Shipped:    { bg: '#ede9fe', color: '#6d28d9' },
  Delivered:  { bg: '#dcfce7', color: '#15803d' },
  Cancelled:  { bg: '#fee2e2', color: '#dc2626' },
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS.Processing
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '0.72rem', fontWeight: '700',
      backgroundColor: s.bg, color: s.color,
    }}>
      {status}
    </span>
  )
}

// ── Live event feed ────────────────────────────────────────────────────────────
const EVENT_STYLE = {
  ORDER:   { bg: '#dbeafe', color: '#1e40af', label: 'New Order' },
  RETURN:  { bg: '#ede9fe', color: '#6d28d9', label: 'New Return' },
  MESSAGE: { bg: '#fef9c3', color: '#854d0e', label: 'New Message' },
  USER:    { bg: '#dcfce7', color: '#15803d', label: 'New User' },
  SYSTEM:  { bg: '#f1f5f9', color: '#64748b', label: 'System' },
}

function LiveFeed({ events }) {
  if (events.length === 0) return null

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          backgroundColor: '#22c55e',
          display: 'inline-block',
          boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
        }} />
        <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
          Live Activity
        </h2>
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.72rem', fontWeight: '600',
          backgroundColor: '#f1f5f9', color: '#64748b',
          padding: '2px 8px', borderRadius: '999px',
        }}>
          {events.length} event{events.length !== 1 ? 's' : ''} this session
        </span>
      </div>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {events.map((ev) => {
          const s = EVENT_STYLE[ev.type] ?? EVENT_STYLE.SYSTEM
          return (
            <div key={ev._id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 24px',
              borderBottom: '1px solid #f8fafc',
            }}>
              <span style={{
                padding: '2px 8px', borderRadius: '20px',
                fontSize: '0.68rem', fontWeight: '700',
                backgroundColor: s.bg, color: s.color,
                flexShrink: 0,
              }}>
                {s.label}
              </span>
              <p style={{ fontSize: '0.82rem', color: '#334155', flex: 1 }}>
                {ev.message}
              </p>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', flexShrink: 0 }}>
                {new Date(ev.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Live counters — incremented by socket events without a full refetch
  const [liveOrders, setLiveOrders] = useState(0)
  const [liveUsers, setLiveUsers]   = useState(0)

  const { liveNotifications } = useSocket() ?? {}

  const loadStats = useCallback(() => {
    setLoading(true)
    setError(null)
    getDashboardStats()
      .then((data) => setStats(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  // React to live socket notifications
  useEffect(() => {
    if (!liveNotifications?.length) return
    const latest = liveNotifications[0]
    if (latest.type === 'ORDER')  setLiveOrders((n) => n + 1)
    if (latest.type === 'USER')   setLiveUsers((n) => n + 1)
  }, [liveNotifications])

  const totalOrders   = stats ? (stats.totalOrders   ?? 0) + liveOrders : null
  const totalUsers    = stats ? (stats.totalUsers    ?? 0) + liveUsers  : null

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          Welcome back. Here's what's happening today.
        </p>
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

      {loading && <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading stats…</p>}

      {!loading && stats && (
        <>
          {/* Live activity feed — only shown when socket events arrive */}
          <LiveFeed events={liveNotifications ?? []} />

          {/* Stat cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}>
            <StatCard
              label="Total Revenue"
              value={`Rs. ${(stats.totalRevenue ?? 0).toLocaleString()}`}
              icon="💰"
              color="#16a34a"
              link="/admin/analytics"
            />
            <StatCard
              label="Total Orders"
              value={totalOrders}
              icon="🛒"
              color="#2563eb"
              link="/admin/orders"
              live={liveOrders > 0}
            />
            <StatCard
              label="Total Products"
              value={stats.totalProducts ?? 0}
              icon="📦"
              color="#9333ea"
              link="/admin/products"
            />
            <StatCard
              label="Total Users"
              value={totalUsers}
              icon="👥"
              color="#0891b2"
              link="/admin/users"
              live={liveUsers > 0}
            />
          </div>

          {/* Recent orders table */}
          {stats.recentOrders?.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>
                  Recent Orders
                </h2>
                <Link to="/admin/orders" style={{
                  fontSize: '0.82rem', color: '#2563eb',
                  fontWeight: '600', textDecoration: 'none',
                }}>
                  View all →
                </Link>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      {['Order #', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                        <th key={h} style={{
                          padding: '12px 16px', textAlign: 'left',
                          fontSize: '0.75rem', fontWeight: '700',
                          color: '#64748b', textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((order) => (
                      <tr key={order._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                          #{order.orderNumber}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>
                          {order.shippingInfo?.name ?? '—'}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                          Rs. {order.totalPrice?.toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <StatusBadge status={order.orderStatus} />
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#94a3b8' }}>
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard
