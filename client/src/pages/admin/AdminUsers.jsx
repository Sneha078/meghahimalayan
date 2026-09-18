
import { useState, useEffect } from 'react'
import { getUsers, updateUserRole, deleteUser } from '../../api/adminClient'

function AdminUsers() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [updating, setUpdating] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [userCount, setUserCount]   = useState(0)

  useEffect(() => {
    setLoading(true)
    getUsers(page, 15)
      .then((data) => {
        setUsers(data.users ?? [])
        setTotalPages(data.totalPages ?? 1)
        setUserCount(data.userCount ?? (data.users ?? []).length)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [page])

  const handleRoleChange = async (id, newRole) => {
    setUpdating(id)
    try {
      await updateUserRole(id, newRole)
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role: newRole } : u))
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdating(null)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await deleteUser(id)
      setUsers((prev) => {
        const next = prev.filter((u) => u._id !== id)
        if (next.length === 0 && page > 1) setPage((p) => p - 1)
        return next
      })
      setUserCount((c) => Math.max(0, c - 1))
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '32px' }}>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
          Users
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          {userCount} registered users
        </p>
      </div>

     
      <input
        type="text"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: '9px 14px', borderRadius: '8px',
          border: '1px solid #e2e8f0', fontSize: '0.88rem',
          outline: 'none', marginBottom: '20px', minWidth: '260px',
        }}
      />

      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: '10px',
          backgroundColor: '#fef2f2', border: '1px solid #fecaca',
          color: '#dc2626', fontSize: '0.88rem', marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {loading && <p style={{ color: '#64748b' }}>Loading users…</p>}

      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px',
          backgroundColor: '#ffffff', borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}>
          <p style={{ color: '#64748b' }}>No users found.</p>
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
                  {['User', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
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
                {filtered.map((user) => (
                  <tr key={user._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    {/* Avatar + name */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          backgroundColor: 'var(--color-navy)', color: 'var(--color-taupe)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem', fontWeight: '700', flexShrink: 0,
                        }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>
                      {user.email}
                    </td>
                
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={user.role}
                        disabled={updating === user._id}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        style={{
                          padding: '5px 10px', borderRadius: '6px',
                          border: '1px solid #e2e8f0', fontSize: '0.82rem',
                          backgroundColor: user.role === 'admin' ? '#ede9fe' : '#f1f5f9',
                          color: user.role === 'admin' ? '#6d28d9' : '#475569',
                          cursor: 'pointer', outline: 'none',
                        }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleDelete(user._id, user.name)}
                        disabled={deleting === user._id}
                        style={{
                          fontSize: '0.8rem', fontWeight: '600',
                          color: deleting === user._id ? '#94a3b8' : '#dc2626',
                          background: 'none', border: 'none',
                          cursor: deleting === user._id ? 'not-allowed' : 'pointer',
                          padding: 0,
                        }}
                      >
                        {deleting === user._id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
              backgroundColor: page <= 1 ? '#f1f5f9' : '#ffffff', color: page <= 1 ? '#cbd5e1' : '#0f172a',
              fontSize: '0.82rem', fontWeight: '600', cursor: page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
              backgroundColor: page >= totalPages ? '#f1f5f9' : '#ffffff', color: page >= totalPages ? '#cbd5e1' : '#0f172a',
              fontSize: '0.82rem', fontWeight: '600', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
