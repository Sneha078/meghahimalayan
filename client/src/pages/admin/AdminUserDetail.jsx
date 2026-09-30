
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getSingleUser,
  updateUserRole,
  deleteUser,
} from '../../api/adminClient'

const ROLES = ['user', 'intern', 'admin']

const ROLE_STYLES = {
  admin:  { bg: '#ede9fe', color: '#6d28d9' },
  intern: { bg: '#fef3c7', color: '#92400e' },
  user:   { bg: '#f1f5f9', color: '#475569' },
}

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Never'

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—'

// Small label/value row used across the info cards.
function Field({ label, children }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{
        fontSize: '0.72rem', color: '#64748b', marginBottom: '3px',
        textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600',
      }}>
        {label}
      </p>
      <div style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: '600', overflowWrap: 'anywhere' }}>
        {children}
      </div>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div style={{
      backgroundColor: '#ffffff', borderRadius: '12px',
      border: '1px solid #e2e8f0', padding: '20px 24px',
    }}>
      {title && (
        <h2 style={{
          fontSize: '0.95rem', fontWeight: '700', color: '#0f172a',
          marginBottom: '16px', paddingBottom: '12px',
          borderBottom: '1px solid #f1f5f9',
        }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  )
}

function AdminUserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage]   = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)

    getSingleUser(id)
      .then((data) => setUser(data.user ?? data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleRoleChange = async (e) => {
    const newRole = e.target.value
    const previous = user.role

    // Optimistic, rolled back on failure so the select never shows a role
    // the server rejected.
    setUser((prev) => ({ ...prev, role: newRole }))
    setUpdating(true)
    setMessage('')

    try {
      await updateUserRole(id, newRole)
      setMessage(`Role updated to "${newRole}".`)
    } catch (err) {
      setUser((prev) => ({ ...prev, role: previous }))
      setMessage(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) return

    setDeleting(true)
    try {
      await deleteUser(id)
      navigate('/admin/users')
    } catch (err) {
      setMessage(err.message)
      setDeleting(false)
    }
  }

  if (loading) return <div style={{ padding: '32px', color: '#64748b' }}>Loading user…</div>
  if (error)   return <div style={{ padding: '32px', color: '#dc2626' }}>{error}</div>
  if (!user)   return null

  const roleStyle = ROLE_STYLES[user.role] ?? ROLE_STYLES.user
  const addresses = Array.isArray(user.addresses) ? user.addresses : []

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>

      {/* Back + Header */}
      <Link to="/admin/users" style={{
        fontSize: '0.85rem', color: '#64748b',
        textDecoration: 'none', display: 'inline-flex',
        alignItems: 'center', gap: '4px', marginBottom: '20px',
      }}>
        ← Back to Users
      </Link>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '28px',
        flexWrap: 'wrap', gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          {user.avatar?.url ? (
            <img
              src={user.avatar.url}
              alt={user.name}
              style={{
                width: '56px', height: '56px', borderRadius: '50%',
                objectFit: 'cover', flexShrink: 0,
              }}
            />
          ) : (
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              backgroundColor: 'var(--color-navy)', color: 'var(--color-taupe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', fontWeight: '700', flexShrink: 0,
            }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <h1 style={{
              fontSize: '1.5rem', fontWeight: '800', color: '#0f172a',
              marginBottom: '4px', overflowWrap: 'anywhere',
            }}>
              {user.name}
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', overflowWrap: 'anywhere' }}>
              {user.email}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '6px 16px', borderRadius: '20px',
            fontSize: '0.78rem', fontWeight: '700',
            textTransform: 'capitalize',
            backgroundColor: roleStyle.bg, color: roleStyle.color,
          }}>
            {user.role}
          </span>

          {!user.isActive && (
            <span style={{
              padding: '6px 16px', borderRadius: '20px',
              fontSize: '0.78rem', fontWeight: '700',
              backgroundColor: '#fee2e2', color: '#dc2626',
            }}>
              Inactive
            </span>
          )}
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
          fontSize: '0.85rem',
          backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569',
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Account */}
        <Card title="Account">
          <div style={{
            display: 'grid', gap: '18px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          }}>
            <Field label="Full name">{user.name || '—'}</Field>
            <Field label="Email">{user.email || '—'}</Field>
            <Field label="Phone">{user.phone || 'Not provided'}</Field>
            <Field label="Sign-up method">
              {user.authProvider === 'google' ? 'Google' : 'Email & password'}
            </Field>
            <Field label="Joined">{formatDate(user.createdAt)}</Field>
            <Field label="Last login">{formatDateTime(user.lastLogin)}</Field>
            <Field label="Marketing emails">
              {user.marketingOptIn ? 'Subscribed' : 'Not subscribed'}
            </Field>
            <Field label="Wishlist items">
              {Array.isArray(user.wishlist) ? user.wishlist.length : 0}
            </Field>
          </div>
        </Card>

        {/* Role management */}
        <Card title="Role">
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
          }}>
            <select
              value={user.role}
              onChange={handleRoleChange}
              disabled={updating || deleting}
              style={{
                padding: '8px 12px', borderRadius: '8px',
                border: '1px solid #e2e8f0', fontSize: '0.85rem',
                backgroundColor: roleStyle.bg, color: roleStyle.color,
                fontWeight: '600', cursor: updating ? 'wait' : 'pointer', outline: 'none',
              }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {updating && (
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Saving…</span>
            )}
          </div>
        </Card>

        {/* Addresses */}
        <Card title={`Addresses (${addresses.length})`}>
          {addresses.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No saved addresses.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {addresses.map((addr, i) => (
                <div
                  key={addr._id ?? i}
                  style={{
                    padding: '14px 16px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                  }}
                >
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '4px', gap: '8px',
                  }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>
                      {addr.name}
                    </span>
                    {addr.isDefault && (
                      <span style={{
                        padding: '2px 8px', borderRadius: '20px',
                        fontSize: '0.68rem', fontWeight: '700',
                        backgroundColor: '#dbeafe', color: '#1e40af',
                      }}>
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: '1.6' }}>
                    {[addr.street, addr.city, addr.province, addr.postalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Danger zone */}
        <Card title="Danger zone">
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '14px', lineHeight: '1.6' }}>
            Deleting soft-deletes this account. Past orders and returns are
            preserved, and the user can no longer sign in.
          </p>

          <button
            onClick={handleDelete}
            disabled={deleting || updating}
            style={{
              padding: '9px 20px', borderRadius: '8px',
              border: '1px solid #fecaca', backgroundColor: '#fef2f2',
              color: deleting ? '#94a3b8' : '#dc2626',
              fontSize: '0.82rem', fontWeight: '600',
              cursor: deleting ? 'not-allowed' : 'pointer',
            }}
          >
            {deleting ? 'Deleting…' : 'Delete user'}
          </button>
        </Card>
      </div>
    </div>
  )
}

export default AdminUserDetail
