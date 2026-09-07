import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
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
      await login({ email: form.email, password: form.password })
      navigate('/')   // redirect to home on success
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      backgroundColor: 'var(--color-sbg)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        backgroundColor: 'var(--color-white)',
        borderRadius: '20px',
        padding: '48px',
        width: '100%',
        maxWidth: '440px',
        border: '1px solid var(--color-border)',
        boxShadow: '0 20px 60px rgba(13,32,49,0.08)',
      }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.8rem',
            fontWeight: '800',
            color: 'var(--color-navy)',
            marginBottom: '8px',
          }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-muted)' }}>
            Sign in to your Mega Himalaya account
          </p>
        </div>

        {/* Server error banner */}
        {serverError && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            fontSize: '0.85rem',
            fontWeight: '500',
            marginBottom: '20px',
            border: '1px solid #fecaca',
          }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              style={inputStyle(errors.email)}
            />
            {errors.email && <p style={errorStyle}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                style={{ ...inputStyle(errors.password), paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--color-muted)',
                  fontSize: '0.8rem',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <p style={errorStyle}>{errors.password}</p>}
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: 'right', marginBottom: '24px' }}>
            <Link to="/forgot-password" style={{
              fontSize: '0.78rem',
              color: 'var(--color-taupe)',
              textDecoration: 'none',
              fontWeight: '500',
            }}>
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '13px',
              backgroundColor: submitting ? '#e5e7eb' : 'var(--color-navy)',
              color: submitting ? '#9ca3af' : 'var(--color-taupe)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '700',
              letterSpacing: '0.1em',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s ease',
              marginBottom: '20px',
            }}
          >
            {submitting ? 'Signing in…' : 'SIGN IN'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{
              color: 'var(--color-navy)', fontWeight: '600', textDecoration: 'none',
            }}>
              Create one
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: '600',
  color: 'var(--color-navy)',
  marginBottom: '6px',
}

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '11px 14px',
  borderRadius: '8px',
  border: `1px solid ${hasError ? 'var(--color-error)' : 'var(--color-border)'}`,
  fontSize: '0.88rem',
  color: 'var(--color-navy)',
  outline: 'none',
  backgroundColor: 'var(--color-white)',
})

const errorStyle = {
  fontSize: '0.72rem',
  color: 'var(--color-error)',
  marginTop: '4px',
}

export default LoginPage
