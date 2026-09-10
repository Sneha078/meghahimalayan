import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSocket } from '../../context/SocketContext'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../../api/notificationClient'

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60)  return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function NotificationBell() {
  const { liveNotifications, unreadCount, setUnreadCount, markOneRead, markAllRead } = useSocket()

  const [open, setOpen] = useState(false)
  // Persisted notifications from the REST API (history)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch initial unread count on mount
  useEffect(() => {
    getUnreadCount()
      .then((data) => setUnreadCount(data.unreadCount ?? 0))
      .catch(() => {})
  }, [setUnreadCount])

  // Fetch notification history when dropdown opens
  useEffect(() => {
    if (!open) return
    setHistoryLoading(true)
    getNotifications(1, 20)
      .then((data) => setHistory(data.notifications ?? []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Merge live notifications (newest) on top of history, deduplicate by _id
  const merged = [
    ...liveNotifications,
    ...history.filter((h) => !liveNotifications.some((l) => l._id === h._id)),
  ].slice(0, 30)

  const handleMarkOne = async (notification) => {
    if (notification.readByMe || notification.readBy?.length > 0) return
    try {
      await markAsRead(notification._id)
      markOneRead(notification._id)
      setHistory((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, readBy: ['me'] } : n
        )
      )
    } catch (_) {}
  }

  const handleMarkAll = async () => {
    try {
      await markAllAsRead()
      markAllRead()
      setHistory((prev) => prev.map((n) => ({ ...n, readBy: ['me'] })))
    } catch (_) {}
  }

  const isUnread = (n) =>
    n.readByMe === false && (!n.readBy || n.readBy.length === 0)

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          backgroundColor: open ? '#f1f5f9' : '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          transition: 'background-color 0.15s ease',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            minWidth: '18px',
            height: '18px',
            borderRadius: '999px',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            fontSize: '0.65rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid #ffffff',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '360px',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a' }}>
                Notifications
              </p>
              {unreadCount > 0 && (
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  {unreadCount} unread
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#2563eb',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {historyLoading && (
              <p style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                Loading…
              </p>
            )}

            {!historyLoading && merged.length === 0 && (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: '1.6rem', marginBottom: '8px' }}>🔕</p>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No notifications yet</p>
              </div>
            )}

            {!historyLoading && merged.map((n) => {
              const unread = isUnread(n)
              const link = n.link ?? '/admin/dashboard'

              return (
                <Link
                  key={n._id}
                  to={link}
                  onClick={() => {
                    handleMarkOne(n)
                    setOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 20px',
                    borderBottom: '1px solid #f8fafc',
                    backgroundColor: unread ? '#f0f9ff' : '#ffffff',
                    textDecoration: 'none',
                    transition: 'background-color 0.15s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = unread ? '#f0f9ff' : '#ffffff' }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}>
                    {n.icon ?? '🔔'}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.82rem',
                      fontWeight: unread ? '700' : '500',
                      color: '#0f172a',
                      marginBottom: '3px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {n.title}
                    </p>
                    <p style={{
                      fontSize: '0.76rem',
                      color: '#64748b',
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {n.message}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {unread && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#2563eb',
                      flexShrink: 0,
                      marginTop: '4px',
                    }} />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Footer */}
          {merged.length > 0 && (
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #f1f5f9',
              textAlign: 'center',
            }}>
              <Link
                to="/admin/dashboard"
                onClick={() => setOpen(false)}
                style={{ fontSize: '0.78rem', fontWeight: '600', color: '#2563eb', textDecoration: 'none' }}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
