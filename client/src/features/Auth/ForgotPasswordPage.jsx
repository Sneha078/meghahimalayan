import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../../api/authClient'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [serverError, setServerError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    setSubmitting(true)
    setServerError('')

    try {
      await forgotPassword({ email })
      setSubmitted(true)
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{
        backgroundColor: 'var(--color-sbg)', minHeight: '100vh',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '40px 20px',
      }}>
        <div style={{
          backgroundColor: 'var(--color-white)', borderRadius: '20px',
          padding: '48px', width: '100%', maxWidth: '440px',
          border: '1px solid var(--color-border)', textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📧</div>
          <h2 style={{
            fontFamily: 'var(--font-serif)', fontSize: '1.6rem',
            fontWeight: '700', color: 'var(--color-navy)', marginBottom: '12px',
          }}>
            Check Your Email
          </h2>
          <p style={{
            color: 'var(--color-muted)', fontSize: '0.88rem',
            lineHeight: '1.7', marginBottom: '32px',
          }}>
            If an account with <strong style={{ color: 'var(--color-navy)' }}>{email}</strong> exists,
            we've sent a reset link to it. Check your inbox.
          </p>
          <Link to="/login" style={{
            display: 'block', padding: '13px',
            backgroundColor: 'var(--color-navy)', color: 'var(--color-taupe)',
            textDecoration: 'none', borderRadius: '8px',
            fontSize: '0.82rem', fontWeight: '700', letterSpacing: '0.1em',
          }}>
            BACK TO LOGIN
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'var(--color-sbg)', minHeight: '100vh',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px',
    }}>
      <div style={{
        backgroundColor: 'var(--color-white)', borderRadius: '20px',
        padding: '48px', width: '100%', maxWidth: '440px',
        border: '1px solid var(--color-border)',
        boxShadow: '0 20px 60px rgba(13,32,49,0.08)',
      }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔑</div>
          <h2 style={{
            fontFamily: 'var(--font-serif)', fontSize: '1.8rem',
            fontWeight: '800', color: 'var(--color-navy)', marginBottom: '8px',
          }}>
            Forgot Password?
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-muted)', lineHeight: '1.6' }}>
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {serverError && (
          <div style={{
            padding: '12px 16px', borderRadius: '8px',
            backgroundColor: '#fef2f2', color: '#dc2626',
            fontSize: '0.85rem', fontWeight: '500',
            marginBottom: '20px', border: '1px solid #fecaca',
          }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block', fontSize: '0.78rem', fontWeight: '600',
              color: 'var(--color-navy)', marginBottom: '6px',
            }}>
              Email Address
            </label>
            <input
              type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder="your@email.com"
              style={{
                width: '100%', padding: '11px 14px', borderRadius: '8px',
                border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
                fontSize: '0.88rem', color: 'var(--color-navy)',
                outline: 'none', backgroundColor: 'var(--color-white)',
              }}
            />
            {error && <p style={{ fontSize: '0.72rem', color: 'var(--color-error)', marginTop: '4px' }}>{error}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '13px',
              backgroundColor: submitting ? '#e5e7eb' : 'var(--color-navy)',
              color: submitting ? '#9ca3af' : 'var(--color-taupe)',
              border: 'none', borderRadius: '8px',
              fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.1em',
              cursor: submitting ? 'not-allowed' : 'pointer',
              marginBottom: '20px', transition: 'opacity 0.2s ease',
            }}
          >
            {submitting ? 'Sending…' : 'SEND RESET LINK'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Remember your password?{' '}
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

export default ForgotPasswordPage
