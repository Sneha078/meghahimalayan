import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'

function LoginPage() {
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

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

  // @react-oauth/google useGoogleLogin (implicit flow) returns access_token
  const handleGoogleSuccess = async (tokenResponse) => {
    setGoogleLoading(true)
    setServerError('')
    try {
      await googleLogin(tokenResponse.access_token)
      navigate('/')
    } catch (err) {
      setServerError(err.message || 'Google sign-in failed. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const triggerGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError:   () => setServerError('Google sign-in was cancelled or failed.'),
    flow: 'implicit',
  })

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

          {/* ── Divider ─────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            margin: '24px 0',
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
              or continue with
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          </div>

          {/* ── Google Sign-In button ────────────────────────────── */}
          <button
            type="button"
            onClick={() => triggerGoogle()}
            disabled={googleLoading || submitting}
            style={{
              width: '100%',
              padding: '11px',
              backgroundColor: googleLoading ? '#f8fafc' : '#ffffff',
              color: '#3c4043',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: (googleLoading || submitting) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'background 0.15s ease',
            }}
          >
            {/* Google SVG icon */}
            {!googleLoading && (
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
            )}
            {googleLoading ? 'Signing in with Google…' : 'Sign in with Google'}
          </button>

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
