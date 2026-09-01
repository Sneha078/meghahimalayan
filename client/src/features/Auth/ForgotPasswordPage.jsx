import { useState } from 'react'
import { Link } from 'react-router-dom'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
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
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '20px',
          }}>
            📧
          </div>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.6rem',
            fontWeight: '700',
            color: 'var(--color-navy)',
            marginBottom: '12px',
          }}>
            Check Your Email
          </h2>
          <p style={{
            color: 'var(--color-muted)',
            fontSize: '0.88rem',
            lineHeight: '1.7',
            marginBottom: '32px',
          }}>
            We've sent a password reset link to <strong style={{ color: 'var(--color-navy)' }}>{email}</strong>. Check your inbox and follow the instructions.
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
            BACK TO LOGIN
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
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔑</div>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.8rem',
            fontWeight: '800',
            color: 'var(--color-navy)',
            marginBottom: '8px',
          }}>
            Forgot Password?
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-muted)', lineHeight: '1.6' }}>
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: '600',
              color: 'var(--color-navy)',
              marginBottom: '6px',
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              placeholder="muna@email.com"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '8px',
                border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
                fontSize: '0.88rem',
                color: 'var(--color-navy)',
                outline: 'none',
                backgroundColor: 'var(--color-white)',
              }}
            />
            {error && (
              <p style={{ fontSize: '0.72rem', color: 'var(--color-error)', marginTop: '4px' }}>
                {error}
              </p>
            )}
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
              marginBottom: '20px',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            SEND RESET LINK
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Remember your password?{' '}
            <Link
              to="/login"
              style={{ color: 'var(--color-navy)', fontWeight: '600', textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}

export default ForgotPasswordPage

