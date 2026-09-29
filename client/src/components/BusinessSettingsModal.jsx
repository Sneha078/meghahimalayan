import { useState, useEffect } from 'react'
import { updateBusinessSettings } from '../api/businessSettingsClient'
import { useBusinessSettings } from '../context/BusinessSettingsContext'

function BusinessSettingsModal({ isOpen, onClose, onSuccess }) {
  const { businessSettings, loading: contextLoading, updateBusinessSettingsCache } = useBusinessSettings()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    phone: '',
    whatsapp: '',
    email: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'Nepal',
    },
    openingHours: {
      weekdays: '',
      saturday: '',
    },
    companyName: '',
    tagline: '',
    description: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      tiktok: '',
    },
  })

  useEffect(() => {
    if (isOpen && businessSettings) {
      setForm(businessSettings)
    }
  }, [isOpen, businessSettings])

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name.includes('.')) {
      // Handle nested objects (address.street, openingHours.weekdays, etc.)
      const [parent, child] = name.split('.')
      setForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        }
      }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
    
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = await updateBusinessSettings(form)
      // Update the cached business settings
      updateBusinessSettingsCache(data.settings)
      onSuccess?.('Business settings updated successfully!')
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
        maxWidth: '600px',
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
            Business Settings
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

        {/* Loading State */}
        {contextLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            color: 'var(--color-muted)',
          }}>
            Loading business settings...
          </div>
        ) : (
          <>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Contact Information Section */}
                <div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--color-navy)',
                    marginBottom: '16px',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '8px',
                  }}>
                    Contact Information
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={labelStyle}>Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        pattern="^(\+977)?9[678]\d{8}$"
                        style={inputStyle}
                        placeholder="98XXXXXXXX"
                      />
                    </div>
                    
                    <div>
                      <label style={labelStyle}>WhatsApp Number</label>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={form.whatsapp}
                        onChange={handleChange}
                        required
                        pattern="^(\+977)?9[678]\d{8}$"
                        style={inputStyle}
                        placeholder="98XXXXXXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      style={inputStyle}
                      placeholder="business@example.com"
                    />
                  </div>
                </div>

                {/* Address Section */}
                <div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--color-navy)',
                    marginBottom: '16px',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '8px',
                  }}>
                    Business Address
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Street Address</label>
                      <input
                        type="text"
                        name="address.street"
                        value={form.address.street}
                        onChange={handleChange}
                        required
                        style={inputStyle}
                        placeholder="Mahendra Pool"
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={labelStyle}>City</label>
                        <input
                          type="text"
                          name="address.city"
                          value={form.address.city}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                          placeholder="Pokhara"
                        />
                      </div>
                      
                      <div>
                        <label style={labelStyle}>Postal Code</label>
                        <input
                          type="text"
                          name="address.postalCode"
                          value={form.address.postalCode}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                          placeholder="33700"
                        />
                      </div>
                      
                      <div>
                        <label style={labelStyle}>Country</label>
                        <input
                          type="text"
                          name="address.country"
                          value={form.address.country}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                          placeholder="Nepal"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Hours Section */}
                <div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--color-navy)',
                    marginBottom: '16px',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '8px',
                  }}>
                    Business Hours
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Weekdays</label>
                      <input
                        type="text"
                        name="openingHours.weekdays"
                        value={form.openingHours.weekdays}
                        onChange={handleChange}
                        required
                        style={inputStyle}
                        placeholder="Sun–Fri: 10:00 AM – 6:00 PM"
                      />
                    </div>
                    
                    <div>
                      <label style={labelStyle}>Saturday</label>
                      <input
                        type="text"
                        name="openingHours.saturday"
                        value={form.openingHours.saturday}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder="Closed"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Information Section */}
                <div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--color-navy)',
                    marginBottom: '16px',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '8px',
                  }}>
                    Company Information
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={labelStyle}>Company Name</label>
                        <input
                          type="text"
                          name="companyName"
                          value={form.companyName}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                          placeholder="Mega Himalaya"
                        />
                      </div>
                      
                      <div>
                        <label style={labelStyle}>Tagline</label>
                        <input
                          type="text"
                          name="tagline"
                          value={form.tagline}
                          onChange={handleChange}
                          style={inputStyle}
                          placeholder="Optical House"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label style={labelStyle}>Description</label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        style={{...inputStyle, minHeight: '80px', resize: 'vertical'}}
                        placeholder="Company description..."
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '8px',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '20px',
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
                    {loading ? 'Updating...' : 'Update Settings'}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: '600',
  color: 'var(--color-navy)',
  marginBottom: '6px',
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: '0.875rem',
  color: 'var(--color-navy)',
  outline: 'none',
  boxSizing: 'border-box',
}

export default BusinessSettingsModal