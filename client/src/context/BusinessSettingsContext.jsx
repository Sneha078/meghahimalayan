import { createContext, useContext, useState, useEffect } from 'react'
import { getBusinessSettings } from '../api/businessSettingsClient'

const BusinessSettingsContext = createContext()

export function BusinessSettingsProvider({ children }) {
  const [businessSettings, setBusinessSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadBusinessSettings()
  }, [])

  const loadBusinessSettings = async () => {
    try {
      const data = await getBusinessSettings()
      setBusinessSettings(data.settings)
      setError(null)
    } catch (err) {
      console.error('Failed to load business settings:', err)
      setError(err.message)
      // Use fallback values if API fails
      setBusinessSettings({
        companyName: 'Mega Himalaya',
        tagline: 'Optical House',
        description: "Pokhara's premier destination for international eyewear, watches and fragrances founded by Mr. Suraj Singh in 2001.",
        phone: '9840604668',
        whatsapp: '9840604668',
        email: 'mail@megahimalaya.com',
        address: {
          street: 'Mahendra Pool',
          city: 'Pokhara',
          postalCode: '33700',
          country: 'Nepal'
        },
        openingHours: {
          weekdays: 'Sun–Fri: 10:00 AM – 6:00 PM',
          saturday: 'Closed'
        },
        socialMedia: {
          facebook: '',
          instagram: '',
          tiktok: ''
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshBusinessSettings = () => {
    setLoading(true)
    loadBusinessSettings()
  }

  const updateBusinessSettingsCache = (newSettings) => {
    setBusinessSettings(newSettings)
  }

  return (
    <BusinessSettingsContext.Provider
      value={{
        businessSettings,
        loading,
        error,
        refreshBusinessSettings,
        updateBusinessSettingsCache,
      }}
    >
      {children}
    </BusinessSettingsContext.Provider>
  )
}

export function useBusinessSettings() {
  const context = useContext(BusinessSettingsContext)
  if (!context) {
    throw new Error('useBusinessSettings must be used within a BusinessSettingsProvider')
  }
  return context
}