import { useState } from 'react'
import { Link } from 'react-router-dom'

function ResetPasswordPage() {
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.password) newErrors.password = 'Password is required'
    if (form.password.length < 6) newErrors.password = 'At least 6 characters'
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    setSuccess(true)
  }

  if (success) {
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
          maxWidth: '440px',
          width: '100%',
          border: '1px solid var(--color-border)',
          textAlign: 'center',
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 20px',
          }}>
            ✓
          </div>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.6rem',
            fontWeight: '700',
            color: 'var(--color-navy)',
            marginBottom: '12px',
          }}>
            Password Reset!
          </h2>
          <p style={{
            color: 'var(--color-muted)',
            fontSize: '0.88rem',
            lineHeight: '1.7',
            marginBottom: '32px',
          }}>
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <Link
            to="/login"
            style={{
              display: 'block',
              padding: '13px',
              backgroundColor: 'var(--color-navy)',
              color: 'var(--color-taupe)',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: '700',
              letterSpacing: '0.1em',
            }}
          >
            SIGN IN NOW
          </Link>
        </div>
      </div>
    )
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
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔒</div>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.8rem',
            fontWeight: '800',
            color: 'var(--color-navy)',
            marginBottom: '8px',
          }}>
            Reset Password
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-muted)' }}>
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                style={{ ...inputStyle(errors.password), paddingRight: '44px' }}
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
                  color: 'var(--color-muted)',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <p style={errorStyle}>{errors.password}</p>}
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter new password"
              style={inputStyle(errors.confirmPassword)}
            />
            {errors.confirmPassword && <p style={errorStyle}>{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '13px',
              backgroundColor: 'var(--color-navy)',
              color: 'var(--color-taupe)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '700',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            RESET PASSWORD
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

export default ResetPasswordPage