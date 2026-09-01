import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const getPasswordStrength = (password) => {
    if (password.length === 0) return null
    if (password.length < 6) return { label: 'Weak', color: 'var(--color-error)', width: '33%' }
    if (password.length < 10) return { label: 'Medium', color: 'var(--color-taupe)', width: '66%' }
    return { label: 'Strong', color: '#15803D', width: '100%' }
  }

  const strength = getPasswordStrength(form.password)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (serverError) setServerError('')
  }

  const validate = () => {
    const newErrors = {}
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!form.email.trim()) newErrors.email = 'Email is required'
    if (!form.phone.trim()) newErrors.phone = 'Phone is required'
    if (!form.password.trim()) newErrors.password = 'Password is required'
    if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!agreed) newErrors.agreed = 'Please agree to the terms'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setServerError('')

    try {
    
      await signup({
        name: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
      })
      navigate('/')   
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
        maxWidth: '480px',
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
            Create Account
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-muted)' }}>
            Join Mega Himalaya Optical House
          </p>
        </div>

      
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

          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text" name="fullName" value={form.fullName}
              onChange={handleChange} placeholder="Type your full name"
              style={inputStyle(errors.fullName)}
            />
            {errors.fullName && <p style={errorStyle}>{errors.fullName}</p>}
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="Type your valid email"
              style={inputStyle(errors.email)}
            />
            {errors.email && <p style={errorStyle}>{errors.email}</p>}
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel" name="phone" value={form.phone}
              onChange={handleChange} placeholder="98XXXXXXXX"
              style={inputStyle(errors.phone)}
            />
            {errors.phone && <p style={errorStyle}>{errors.phone}</p>}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password" value={form.password}
                onChange={handleChange} placeholder="Minimum 6 characters"
                style={{ ...inputStyle(errors.password), paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--color-muted)',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <p style={errorStyle}>{errors.password}</p>}
          </div>

          {/* Password strength bar */}
          {strength && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{
                height: '4px', backgroundColor: 'var(--color-border)',
                borderRadius: '2px', overflow: 'hidden', marginBottom: '4px',
              }}>
                <div style={{
                  height: '100%', width: strength.width,
                  backgroundColor: strength.color, borderRadius: '2px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <p style={{ fontSize: '0.72rem', color: strength.color, fontWeight: '600' }}>
                {strength.label} password
              </p>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password" name="confirmPassword" value={form.confirmPassword}
              onChange={handleChange} placeholder="Re-enter your password"
              style={inputStyle(errors.confirmPassword)}
            />
            {errors.confirmPassword && <p style={errorStyle}>{errors.confirmPassword}</p>}
          </div>

          <label style={{
            display: 'flex', alignItems: 'flex-start',
            gap: '10px', cursor: 'pointer', marginBottom: '24px',
          }}>
            <input
              type="checkbox" checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ accentColor: 'var(--color-navy)', marginTop: '2px' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', lineHeight: '1.5' }}>
              I agree to the{' '}
              <Link to="/" style={{ color: 'var(--color-navy)', fontWeight: '600', textDecoration: 'none' }}>
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/" style={{ color: 'var(--color-navy)', fontWeight: '600', textDecoration: 'none' }}>
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreed && (
            <p style={{ ...errorStyle, marginTop: '-16px', marginBottom: '16px' }}>
              {errors.agreed}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '13px',
              backgroundColor: submitting ? '#e5e7eb' : 'var(--color-navy)',
              color: submitting ? '#9ca3af' : 'var(--color-taupe)',
              border: 'none', borderRadius: '8px',
              fontSize: '0.85rem', fontWeight: '700',
              letterSpacing: '0.1em',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s ease', marginBottom: '20px',
            }}
          >
            {submitting ? 'Creating account…' : 'CREATE ACCOUNT'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: 'var(--color-navy)', fontWeight: '600', textDecoration: 'none',
            }}>
              Sign in
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '0.78rem', fontWeight: '600',
  color: 'var(--color-navy)', marginBottom: '6px',
}

const inputStyle = (hasError) => ({
  width: '100%', padding: '11px 14px', borderRadius: '8px',
  border: `1px solid ${hasError ? 'var(--color-error)' : 'var(--color-border)'}`,
  fontSize: '0.88rem', color: 'var(--color-navy)',
  outline: 'none', backgroundColor: 'var(--color-white)',
})

const errorStyle = {
  fontSize: '0.72rem', color: 'var(--color-error)', marginTop: '4px',
}

export default SignupPage
