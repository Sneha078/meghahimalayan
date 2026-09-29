import { useState } from 'react'
import { updateProfile } from '../api/userClient'
import { useAuth } from '../context/AuthContext'

function ProfileEditModal({ isOpen, onClose, onSuccess }) {
  const { user, setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '', 
    phone: user?.phone || '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      })

      // Update user context
      setUser(data.user)
      
      onSuccess?.('Profile updated successfully!')
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'var(--color-white)',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.4rem',
            fontWeight: '700',
            color: 'var(--color-navy)',
            margin: 0,
          }}>
            Update Profile Information
          </h2>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: 'var(--color-muted)',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Name Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--color-navy)',
                marginBottom: '6px',
              }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={50}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: 'var(--color-navy)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="Enter your full name"
              />
            </div>

            {/* Email Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--color-navy)',
                marginBottom: '6px',
              }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                maxLength={100}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: 'var(--color-navy)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="Enter your email address"
              />
            </div>

            {/* Phone Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--color-navy)',
                marginBottom: '6px',
              }}>
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                pattern="^(\+977)?9[678]\d{8}$"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: 'var(--color-navy)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="98XXXXXXXX (Optional)"
              />
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--color-muted)',
                margin: '4px 0 0 0',
              }}>
                Nepal phone number format (optional)
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '8px',
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-muted)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: loading ? '#e5e7eb' : 'var(--color-navy)',
                  color: loading ? '#9ca3af' : 'var(--color-white)',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileEditModal