
import { useState, useEffect } from 'react'
import { getMessages, updateMessageStatus, deleteMessage } from '../../api/adminClient'

const STATUS_STYLES = {
  unread: { bg: '#dbeafe', color: '#1e40af', label: 'Unread' },
  read:  { bg: '#f1f5f9', color: '#64748b', label: 'Read' },
  resolved: { bg: '#dcfce7', color: '#15803d', label: 'Resolved' },
}

function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [filter, setFilter]     = useState('All')

  useEffect(() => {
    getMessages()
      .then((data) => setMessages(data.messages ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleStatus = async (id, status) => {
    setUpdating(id)
    try {
      await updateMessageStatus(id, status)
      setMessages((prev) => prev.map((m) => m._id === id ? { ...m, status } : m))
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdating(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message permanently?')) return
    setDeleting(id)
    try {
      await deleteMessage(id)
      setMessages((prev) => prev.filter((m) => m._id !== id))
      if (expanded === id) setExpanded(null)
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const statuses = ['All', 'unread', 'read', 'resolved']
  const filtered = filter === 'All'
    ? messages
    : messages.filter((m) => m.status === filter)

  return (
    <div style={{ padding: '32px' }}>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
          Messages
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          {messages.filter((m) => m.status === 'unread').length} unread · {messages.length} total
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
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
              textTransform: 'capitalize',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: '10px', backgroundColor: '#fef2f2',
          border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.88rem', marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {loading && <p style={{ color: '#64748b' }}>Loading messages…</p>}

      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px',
          backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0',
        }}>
          <p style={{ color: '#64748b' }}>No messages found.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((msg) => {
            const s = STATUS_STYLES[msg.status] ?? STATUS_STYLES.unread
            const isExpanded = expanded === msg._id
            return (
              <div
                key={msg._id}
                style={{
                  backgroundColor: '#ffffff', borderRadius: '12px',
                  border: `1px solid ${msg.status === 'unread' ? '#bfdbfe' : '#e2e8f0'}`,
                  overflow: 'hidden',
                }}
              >
                {/* Header row */}
                <div
                  onClick={() => setExpanded(isExpanded ? null : msg._id)}
                  style={{
                    padding: '16px 20px', display: 'flex',
                    alignItems: 'center', gap: '14px',
                    cursor: 'pointer', flexWrap: 'wrap',
                  }}
                >
                  {/* Name + email */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
                      {msg.name}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {msg.email} {msg.phone ? `· ${msg.phone}` : ''}
                    </p>
                  </div>

                
                  <p style={{
                    fontSize: '0.85rem', color: '#475569',
                    flex: 2, minWidth: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {msg.subject ?? msg.message?.slice(0, 60) + '…'}
                  </p>

                
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.72rem', fontWeight: '700',
                    backgroundColor: s.bg, color: s.color, flexShrink: 0,
                  }}>
                    {s.label}
                  </span>

                
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', flexShrink: 0 }}>
                    {new Date(msg.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric',
                    })}
                  </span>

                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>

              
                {isExpanded && (
                  <div style={{
                    padding: '0 20px 20px',
                    borderTop: '1px solid #f1f5f9',
                  }}>
                    <p style={{
                      fontSize: '0.88rem', color: '#475569',
                      lineHeight: '1.7', padding: '16px 0',
                    }}>
                      {msg.message}
                    </p>

                   
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {msg.status !== 'read' && (
                        <button
                          onClick={() => handleStatus(msg._id, 'read')}
                          disabled={updating === msg._id}
                          style={actionBtn('#f1f5f9', '#475569')}
                        >
                          Mark as Read
                        </button>
                      )}
                      {msg.status !== 'resolved' && (
                        <button
                          onClick={() => handleStatus(msg._id, 'resolved')}
                          disabled={updating === msg._id}
                          style={actionBtn('#dcfce7', '#15803d')}
                        >
                          Mark as Resolved
                        </button>
                      )}
                      {msg.status !== 'unread' && (
                        <button
                          onClick={() => handleStatus(msg._id, 'unread')}
                          disabled={updating === msg._id}
                          style={actionBtn('#dbeafe', '#1e40af')}
                        >
                          Mark as Unread
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(msg._id)}
                        disabled={deleting === msg._id}
                        style={actionBtn('#fee2e2', '#dc2626')}
                      >
                        {deleting === msg._id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const actionBtn = (bg, color) => ({
  padding: '7px 16px', borderRadius: '8px',
  backgroundColor: bg, color, border: 'none',
  fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
})

export default AdminMessages
