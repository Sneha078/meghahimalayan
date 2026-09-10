import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SocketProvider } from "../../context/SocketContext";
import NotificationBell from "./NotificationBell";

const NAV_ITEMS = [
  { path: '/admin/dashboard',  label: 'Dashboard'  },
  { path: '/admin/analytics',  label: 'Analytics'  },
  { path: '/admin/orders',     label: 'Orders'      },
  { path: '/admin/returns',    label: 'Returns'     },
  { path: '/admin/products',   label: 'Products'    },
  { path: '/admin/users',      label: 'Users'       },
  { path: '/admin/coupons',    label: 'Coupons'     },
  { path: '/admin/messages',   label: 'Messages'    },
]

function AdminLayoutInner({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside style={{
        width: sidebarOpen ? '240px' : '64px',
        backgroundColor: 'var(--color-navy)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}>

        {/* Logo row */}
        <div style={{
          padding: '24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            backgroundColor: 'var(--color-taupe)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '0.75rem',
            fontWeight: '800', color: 'var(--color-navy)',
            flexShrink: 0,
          }}>
            MH
          </div>
          {sidebarOpen && (
            <span style={{
              color: '#ffffff', fontWeight: '700',
              fontSize: '0.9rem', whiteSpace: 'nowrap',
            }}>
              Admin Panel
            </span>
          )}
          <button
            onClick={() => setSidebarOpen((p) => !p)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              fontSize: '1rem', flexShrink: 0,
            }}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  marginBottom: '4px',
                  textDecoration: 'none',
                  backgroundColor: isActive ? 'rgba(201,168,76,0.15)' : 'transparent',
                  color: isActive ? 'var(--color-taupe)' : 'rgba(255,255,255,0.6)',
                  fontWeight: isActive ? '600' : '400',
                  fontSize: '0.875rem',
                  transition: 'all 0.15s ease',
                  borderLeft: isActive ? '3px solid var(--color-taupe)' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User / logout */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          {sidebarOpen && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: '600', color: '#ffffff' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '8px',
              backgroundColor: 'rgba(220,38,38,0.15)',
              color: '#fca5a5', border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>🚪</span>
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>

        {/* Top header bar */}
        <header style={{
          height: '60px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexShrink: 0,
        }}>
          <NotificationBell />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '10px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              backgroundColor: 'var(--color-navy)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: '700', color: 'var(--color-taupe)',
            }}>
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#334155' }}>
              {user?.name}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  )
}

// Wrap with SocketProvider so NotificationBell and Dashboard can access the socket
function AdminLayout({ children }) {
  return (
    <SocketProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SocketProvider>
  )
}

export default AdminLayout
