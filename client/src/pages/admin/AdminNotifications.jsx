import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSocket, getNotificationLink, getNotificationIcon } from '../../context/SocketContext'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../../api/notificationClient'

function timeAgo(date) {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function AdminNotifications() {
  const { unreadCount, markOneRead, markAllRead } = useSocket()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filter, setFilter] = useState('ALL')
  const [unreadOnly, setUnreadOnly] = useState(false)

  const fetchNotifications = (p = 1) => {
    setLoading(true)
    getNotifications(p, 20)
      .then((data) => {
        setNotifications(data.notifications ?? [])
        setTotalPages(data.totalPages ?? 1)
        setTotalCount(data.total ?? 0)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchNotifications(page)
  }, [page])

  const handleMarkOne = async (n) => {
    if (n.readByMe || n.readBy?.length > 0) return
    try {
      await markAsRead(n._id)
      markOneRead(n._id)
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === n._id ? { ...item, readBy: ['me'] } : item
        )
      )
    } catch (_) {}
  }

  const handleMarkAll = async () => {
    try {
      await markAllAsRead()
      markAllRead()
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, readBy: ['me'] }))
      )
    } catch (_) {}
  }

  const isUnread = (n) =>
    n.readByMe === false && (!n.readBy || n.readBy.length === 0)

  const filterTabs = [
    { key: 'ALL', label: 'All' },
    { key: 'ORDER', label: 'Orders 🛒' },
    { key: 'RETURN', label: 'Returns ↩️' },
    { key: 'MESSAGE', label: 'Messages ✉️' },
    { key: 'USER', label: 'Users 👤' },
    { key: 'SYSTEM', label: 'System ⚙️' },
  ]

  const filtered = notifications.filter((n) => {
    if (filter !== 'ALL' && (n.type || '').toUpperCase() !== filter) return false
    if (unreadOnly && !isUnread(n)) return false
    return true
  })

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
            Notifications
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All notifications read'} · {totalCount} total notifications
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
            }}
          >
            ✓ Mark all as read
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {filterTabs.map((t) => {
            const active = filter === t.key
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: '1px solid',
                  backgroundColor: active ? 'var(--color-navy)' : '#ffffff',
                  color: active ? '#ffffff' : '#64748b',
                  borderColor: active ? 'var(--color-navy)' : '#e2e8f0',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Unread Only Toggle */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.82rem',
          color: '#475569',
          cursor: 'pointer',
          userSelect: 'none',
        }}>
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            style={{ borderRadius: '4px', cursor: 'pointer' }}
          />
          Show unread only
        </label>
      </div>

      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: '10px', backgroundColor: '#fef2f2',
          border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.88rem', marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {/* Notifications Container */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        overflow: 'hidden',
      }}>
        {loading && (
          <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
            Loading notifications…
          </p>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '2.2rem', marginBottom: '12px' }}>🔕</p>
            <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
              No notifications found
            </p>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              {unreadOnly ? 'No unread notifications' : 'There are no notifications matching your filter criteria.'}
            </p>
          </div>
        )}

        {!loading && filtered.map((n) => {
          const unread = isUnread(n)
          const targetLink = getNotificationLink(n)
          const icon = getNotificationIcon(n)

          return (
            <Link
              key={n._id}
              to={targetLink}
              onClick={() => handleMarkOne(n)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '18px 24px',
                borderBottom: '1px solid #e2e8f0',
                borderLeft: unread ? '4px solid #2563eb' : '4px solid transparent',
                backgroundColor: unread ? '#eff6ff' : '#ffffff',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = unread ? '#dbeafe' : '#f8fafc' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = unread ? '#eff6ff' : '#ffffff' }}
            >
              {/* Type Icon Badge */}
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: unread ? '#dbeafe' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0,
              }}>
                {icon}
              </div>

              {/* Notification Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: unread ? '700' : '600',
                    color: unread ? '#1e40af' : '#0f172a',
                  }}>
                    {n.title}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: unread ? '#dbeafe' : '#f1f5f9',
                    color: unread ? '#1e40af' : '#64748b',
                    textTransform: 'uppercase',
                  }}>
                    {n.type || 'SYSTEM'}
                  </span>
                </div>
                <p style={{
                  fontSize: '0.83rem',
                  color: unread ? '#3b82f6' : '#475569',
                  lineHeight: '1.4',
                  margin: 0,
                }}>
                  {n.message}
                </p>
              </div>

              {/* Date & Unread Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <span style={{ fontSize: '0.78rem', color: unread ? '#60a5fa' : '#94a3b8', whiteSpace: 'nowrap' }}>
                  {timeAgo(n.createdAt)}
                </span>
                {unread && (
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.2)',
                  }} />
                )}
                <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>›</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          marginTop: '28px',
        }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: page <= 1 ? '#f1f5f9' : '#ffffff',
              color: page <= 1 ? '#94a3b8' : '#334155',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.82rem',
            }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: page >= totalPages ? '#f1f5f9' : '#ffffff',
              color: page >= totalPages ? '#94a3b8' : '#334155',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.82rem',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
