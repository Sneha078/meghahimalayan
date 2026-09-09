
import { useState, useEffect } from 'react'
import { getAnalytics, getTopCustomers } from '../../api/adminClient'

function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [topCustomers, setTopCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getAnalytics(), getTopCustomers()])
      .then(([analyticsData, customersData]) => {
        setAnalytics(analyticsData)
        setTopCustomers(customersData.customers ?? customersData.topCustomers ?? [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '32px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
          Analytics
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          Sales trends and customer insights.
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
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading analytics…</p>
      )}

      {!loading && analytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

         
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            {[
              { label: 'Total Revenue',   value: `Rs. ${(analytics.totalRevenue ?? 0).toLocaleString()}`,  color: '#16a34a' },
              { label: 'Total Orders',    value: analytics.totalOrders ?? 0,   color: '#2563eb' },
              { label: 'Avg Order Value', value: `Rs. ${(analytics.avgOrderValue ?? 0).toLocaleString()}`, color: '#9333ea' },
              { label: 'Pending Orders',  value: analytics.pendingOrders ?? 0, color: '#ea580c' },
            ].map((card) => (
              <div key={card.label} style={{
                backgroundColor: '#ffffff', borderRadius: '12px',
                padding: '20px', border: '1px solid #e2e8f0',
              }}>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '8px' }}>
                  {card.label}
                </p>
                <p style={{ fontSize: '1.4rem', fontWeight: '800', color: card.color }}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {analytics.salesByCategory?.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff', borderRadius: '12px',
              border: '1px solid #e2e8f0', padding: '24px',
            }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '20px' }}>
                Sales by Category
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analytics.salesByCategory.map((cat) => {
                  const max = Math.max(...analytics.salesByCategory.map((c) => c.revenue))
                  const pct = max > 0 ? (cat.revenue / max) * 100 : 0
                  return (
                    <div key={cat.category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '500', color: '#475569', textTransform: 'capitalize' }}>
                          {cat.category}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                          Rs. {cat.revenue?.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          backgroundColor: 'var(--color-navy)',
                          borderRadius: '4px', transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {topCustomers.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff', borderRadius: '12px',
              border: '1px solid #e2e8f0', overflow: 'hidden',
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>
                  Top Customers
                </h2>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    {['#', 'Customer', 'Email', 'Orders', 'Total Spent'].map((h) => (
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
                  {topCustomers.map((customer, i) => (
                    <tr key={customer._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                        {customer.name}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#64748b' }}>
                        {customer.email}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#0f172a' }}>
                        {customer.orderCount ?? customer.totalOrders ?? '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: '700', color: '#16a34a' }}>
                        Rs. {(customer.totalSpent ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Analytics
