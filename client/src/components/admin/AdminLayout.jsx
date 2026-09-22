import { useState, useEffect } from "react";
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
  { path: '/admin/notifications', label: 'Notifications' },
]

function AdminLayoutInner({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const check = (e) => setIsMobile(e.matches)
    check(mq)
    mq.addEventListener('change', check)
    return () => mq.removeEventListener('change', check)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [mobileOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? '64px' : '240px')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>

      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 199,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        />
      )}

      <aside style={{
        ...(isMobile ? {
          position: 'fixed',
          left: 0, top: 0, bottom: 0,
          zIndex: 200,
          width: '260px',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        } : {
          width: sidebarCollapsed ? '64px' : '240px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          transition: 'width 0.2s ease',
        }),
        backgroundColor: 'var(--color-navy)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}>

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
          {!sidebarCollapsed && (
            <span style={{
              color: '#ffffff', fontWeight: '700',
              fontSize: '0.9rem', whiteSpace: 'nowrap',
            }}>
              Admin Panel
            </span>
          )}
          {!isMobile && (
            <button
              onClick={() => setSidebarCollapsed((p) => !p)}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                fontSize: '1rem', flexShrink: 0,
              }}
            >
              {sidebarCollapsed ? '▶' : '◀'}
            </button>
          )}
        </div>

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
                {!sidebarCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div style={{
          padding: '16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          {!sidebarCollapsed && (
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
            {!sidebarCollapsed && 'Logout'}
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>

        <header style={{
          height: '60px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: isMobile ? '0 16px' : '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexShrink: 0,
        }}>
          {isMobile && (
            <button
              onClick={() => setMobileOpen((p) => !p)}
              aria-label="Toggle menu"
              style={{
                marginRight: 'auto',
                background: 'none', border: 'none',
                fontSize: '1.3rem', cursor: 'pointer',
                color: '#334155', padding: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ☰
            </button>
          )}

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

        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  )
}

function AdminLayout({ children }) {
  return (
    <SocketProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SocketProvider>
  )
}

export default AdminLayout
