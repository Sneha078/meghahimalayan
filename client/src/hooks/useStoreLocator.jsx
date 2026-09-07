import { useState, useCallback } from 'react'

// ---- Store details ----
const STORE = {
  name: 'Mega Himalaya Optical',
  address: 'Mahendra Pool Road, Pokhara 33700, Gandaki Province, Nepal',
  lat: 28.2245661,
  lng: 83.9909505,
}

// Modal sizing per mode
const SIZES = {
  minimized: { maxWidth: '320px', mapHeight: 0 },
  normal: { maxWidth: '600px', mapHeight: 360 },
  maximized: { maxWidth: '92vw', mapHeight: 560 },
}

function ControlBtn({ onClick, label, bold, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '26px',
        height: '26px',
        borderRadius: '50%',
        border: `1px solid ${hovered ? 'var(--color-taupe)' : 'rgba(13,32,49,0.2)'}`,
        backgroundColor: hovered ? 'rgba(165,152,135,0.15)' : 'transparent',
        color: hovered ? 'var(--color-taupe)' : '#6b6862',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: bold ? '1rem' : '0.8rem',
        fontWeight: bold ? 800 : 500,
        lineHeight: 1,
        padding: 0,
        transition: 'all 0.2s ease',
      }}
    >
      {children}
    </button>
  )
}

/**
 * Hook: gives you an `openStoreLocator()` function to call from anywhere
 * (e.g. a starter-prompt click), plus a <StoreLocatorModal /> to render
 * once inside the component that uses this hook.
 *
 * Usage:
 *   const { openStoreLocator, StoreLocatorModal } = useStoreLocator()
 *   ...
 *   <button onClick={openStoreLocator}>Find Our Store</button>
 *   ...
 *   return ( <> ...your UI... <StoreLocatorModal /> </> )
 */
export function useStoreLocator() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('normal') // minimized | normal | maximized
  const [status, setStatus] = useState('idle') // idle | locating | granted | denied
  const [userCoords, setUserCoords] = useState(null)

  const openStoreLocator = useCallback(() => {
    setOpen(true)
    setMode('normal')

    if (!navigator.geolocation) {
      setStatus('denied')
      return
    }

    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('granted')
      },
      () => setStatus('denied'), // user declined, or it failed — fall back to store-only view
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  const close = useCallback(() => setOpen(false), [])

  const StoreLocatorModal = useCallback(() => {
    if (!open) return null

    const storeQuery = `${STORE.lat},${STORE.lng}`
    const hasUserLocation = status === 'granted' && userCoords

    const mapSrc = hasUserLocation
      ? `https://www.google.com/maps?saddr=${userCoords.lat},${userCoords.lng}&daddr=${storeQuery}&output=embed`
      : `https://www.google.com/maps?q=${storeQuery}&output=embed`

    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${storeQuery}`
    const size = SIZES[mode]

    return (
      <div
        onClick={(e) => e.target === e.currentTarget && close()}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(13,32,49,0.55)',
          padding: '20px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: size.maxWidth,
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 20px 48px rgba(13,32,49,0.28)',
            transition: 'max-width 0.25s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '16px 20px',
              borderBottom: mode === 'minimized' ? 'none' : '1px solid var(--color-border)',
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#0d2031',
                  margin: 0,
                }}
              >
                {STORE.name}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  color: '#6b6862',
                  margin: '4px 0 0',
                }}
              >
                {STORE.address}
              </p>
              {mode !== 'minimized' && status === 'locating' && (
                <p style={{ fontSize: '0.72rem', color: '#a59887', marginTop: '6px' }}>
                  Finding your location…
                </p>
              )}
              {mode !== 'minimized' && status === 'denied' && (
                <p style={{ fontSize: '0.72rem', color: '#a59887', marginTop: '6px' }}>
                  Location unavailable - showing store location only.
                </p>
              )}
            </div>

            {/* Controls: close (bold, leftmost) → minimize → maximize */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, marginLeft: '12px' }}>
              <ControlBtn label="Close" bold onClick={close}>
                ✕
              </ControlBtn>
              <ControlBtn
                label={mode === 'minimized' ? 'Restore' : 'Minimize'}
                onClick={() => setMode(mode === 'minimized' ? 'normal' : 'minimized')}
              >
                –
              </ControlBtn>
              <ControlBtn
                label={mode === 'maximized' ? 'Restore' : 'Maximize'}
                onClick={() => setMode(mode === 'maximized' ? 'normal' : 'maximized')}
              >
                □
              </ControlBtn>
            </div>
          </div>

          {/* Map body */}
          <div
            style={{
              height: `${size.mapHeight}px`,
              overflow: 'hidden',
              backgroundColor: '#f4f0eb',
              transition: 'height 0.25s ease',
            }}
          >
            <iframe
              title="store-map"
              loading="lazy"
              src={mapSrc}
              style={{ width: '100%', height: `${SIZES.maximized.mapHeight}px`, border: 0, display: 'block' }}
            />
          </div>

          {mode !== 'minimized' && (
            <div style={{ padding: '16px 20px' }}>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#0d2031',
                  color: '#f4f0eb',
                  textDecoration: 'none',
                  borderRadius: '999px',
                  padding: '10px 20px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                Get Directions
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }, [open, mode, status, userCoords, close])

  return { openStoreLocator, StoreLocatorModal }
}