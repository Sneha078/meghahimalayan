import {useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats } from '../../api/adminClient'

function StatCard({ label, value, icon, color, link }) {
    return (
       <Link to={link ?? '#'} style={{ textDecoration: 'none' }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        transition: 'box-shadow 0.2s ease',
        cursor: link ? 'pointer' : 'default',
      }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
      >
        <div style={{
          width: '52px', height: '52px', borderRadius: '12px',
          backgroundColor: color + '20',
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
    )}

function Dashboard(){
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null) 

   useEffect(() => {
    getDashboardStats()
      .then((data) => setStats(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '32px'}}>
        <div style={{marginBottom: '32px'}}>
        <h1 style={{
           fontSize: '1.6rem', fontWeight: '800',
          color: '#0f172a', marginBottom: '4px',  
        }}>
            Dashboard
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b'}}>
            Welcome Back. Here's what's happening today.
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
     {loading && (
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading stats…</p>
      )}

      {!loading && stats && (
        <>
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '32px', 
        }}>
            <StatCard
            label="Total Revenue"
            value={`Rs. ${(stats.totalRevenue ?? 0).toLocaleString()}`}
            link='/admin/analytics' />

          <StatCard
              label="Total Orders"
              value={stats.totalOrders ?? 0}
              link="/admin/orders"
            />
          <StatCard
              label="Total Products"
              value={stats.totalProducts ?? 0}
              link="/admin/products"
            />

        <StatCard
              label="Total Users"
              value={stats.totalUsers ?? 0}
              link="/admin/users"
            />   

        
        </div>
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

const STATUS_COLORS = {
  Processing: { bg: '#fef9c3', color: '#854d0e' },
  Confirmed:  { bg: '#dbeafe', color: '#1e40af' },
  Shipped:    { bg: '#ede9fe', color: '#6d28d9' },
  Delivered:  { bg: '#dcfce7', color: '#15803d' },
  Cancelled:  { bg: '#fee2e2', color: '#dc2626' },
}

function StatusBadge({ status }) {
  const style = STATUS_COLORS[status] ?? STATUS_COLORS.Processing
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '0.72rem', fontWeight: '700',
      backgroundColor: style.bg, color: style.color,
    }}>
      {status}
    </span>
  )
}

export default Dashboard