
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function AdminLoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (serverError) setServerError('')
  }

  const validate = () => {
    const newErrors = {}
    if (!form.email.trim()) newErrors.email = 'Email is required'
    if (!form.password.trim()) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setServerError('')

    try {
      const data = await login({ email: form.email, password: form.password })

    
      if (data.user?.role !== 'admin') {
        setServerError('Access denied. Admin accounts only.')
        return
      }

      navigate('/admin/dashboard')
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
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

        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '12px',
            backgroundColor: 'var(--color-taupe)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1.5rem',
            margin: '0 auto 16px',
          }}>
            🛡️
          </div>
          <h2 style={{
            fontFamily: 'var(--font-serif)', fontSize: '1.8rem',
            fontWeight: '800', color: '#ffffff', marginBottom: '8px',
          }}>
            Admin Portal
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>
            Mega Himalaya Management System
          </p>
        </div>

        {serverError && (
          <div style={{
            padding: '12px 16px', borderRadius: '8px',
            backgroundColor: 'rgba(220,38,38,0.15)',
            border: '1px solid rgba(220,38,38,0.3)',
            color: '#fca5a5', fontSize: '0.85rem',
            fontWeight: '500', marginBottom: '20px',
          }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Admin Email</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="admin@megahimalaya.com"
              style={inputStyle(errors.email)}
            />
            {errors.email && <p style={errorStyle}>{errors.email}</p>}
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password" value={form.password}
                onChange={handleChange} placeholder="Enter admin password"
                style={{ ...inputStyle(errors.password), paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <p style={errorStyle}>{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '13px',
              backgroundColor: submitting ? '#374151' : 'var(--color-taupe)',
              color: submitting ? '#9ca3af' : 'var(--color-navy)',
              border: 'none', borderRadius: '8px',
              fontSize: '0.85rem', fontWeight: '700',
              letterSpacing: '0.1em',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
              marginBottom: '16px',
            }}
          >
            {submitting ? 'Verifying…' : 'ACCESS DASHBOARD'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
            🔒 Restricted access - authorized personnel only
          </p>
        </form>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '0.78rem', fontWeight: '600',
  color: 'rgba(255,255,255,0.6)', marginBottom: '6px', letterSpacing: '0.04em',
}

const inputStyle = (hasError) => ({
  width: '100%', padding: '12px 14px', borderRadius: '8px',
  border: `1px solid ${hasError ? 'var(--color-error)' : 'rgba(255,255,255,0.1)'}`,
  fontSize: '0.88rem', color: '#ffffff', outline: 'none',
  backgroundColor: 'rgba(255,255,255,0.06)',
})

const errorStyle = {
  fontSize: '0.72rem', color: 'var(--color-error)', marginTop: '4px',
}

export default AdminLoginPage
