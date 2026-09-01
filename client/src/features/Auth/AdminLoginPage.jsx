import { useState } from 'react'

function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.email.trim()) newErrors.email = 'Email is required'
    if (!form.password.trim()) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    alert('Admin login coming soon!')
  }

  return (
    <div style={{
      backgroundColor: 'var(--color-navy)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        backgroundColor: '#162840',
        borderRadius: '20px',
        padding: '48px',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-taupe)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            margin: '0 auto 16px',
          }}>
            🛡️
          </div>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.8rem',
            fontWeight: '800',
            color: '#ffffff',
            marginBottom: '8px',
          }}>
            Admin Portal
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>
            Mega Himalaya Management System
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '6px',
              letterSpacing: '0.04em',
            }}>
              Admin Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@megahimalaya.com"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: `1px solid ${errors.email
                  ? 'var(--color-error)'
                  : 'rgba(255,255,255,0.1)'}`,
                fontSize: '0.88rem',
                color: '#ffffff',
                outline: 'none',
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            />
            {errors.email && (
              <p style={{ fontSize: '0.72rem', color: 'var(--color-error)', marginTop: '4px' }}>
                {errors.email}
              </p>
            )}
          </div>

     
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '6px',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter admin password"
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${errors.password
                    ? 'var(--color-error)'
                    : 'rgba(255,255,255,0.1)'}`,
                  fontSize: '0.88rem',
                  color: '#ffffff',
                  outline: 'none',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && (
              <p style={{ fontSize: '0.72rem', color: 'var(--color-error)', marginTop: '4px' }}>
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '13px',
              backgroundColor: 'var(--color-taupe)',
              color: 'var(--color-navy)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '700',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              marginBottom: '16px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-taupe-dark)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-taupe)'}
          >
            ACCESS DASHBOARD
          </button>

          <p style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.3)',
          }}>
            🔒 Restricted access - authorized personnel only
          </p>

        </form>
      </div>
    </div>
  )
}

export default AdminLoginPage