import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AssistantChat from './AssistantChat'
import avatarMark from '../../assets/avatar-mark.png'

const GREETING_DELAY_MS = 1500
const DISMISS_COOLDOWN_MS = 12000 // whole widget reappears ~12s after being dismissed

function FloatingAssistant() {
  const [open, setOpen] = useState(false)
  const [showGreeting, setShowGreeting] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const cooldownTimerRef = useRef(null)

  useEffect(() => {
    if (open || dismissed) return
    const timer = setTimeout(() => setShowGreeting(true), GREETING_DELAY_MS)
    return () => clearTimeout(timer)
  }, [open, dismissed])

  // Clear any pending reappearance timer on unmount so we never call
  // setState after the component is gone.
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    }
  }, [])

  const handleOpen = () => {
    setOpen(true)
    setShowGreeting(false)
  }

  const handleDismiss = (e) => {
    e.stopPropagation()
    setShowGreeting(false)
    setDismissed(true)

    // Bring the whole widget back after a short cooldown instead of
    // hiding it for the rest of the session.
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    cooldownTimerRef.current = setTimeout(() => {
      setDismissed(false)
    }, DISMISS_COOLDOWN_MS)
  }

  // While dismissed, the entire widget — avatar launcher included — is
  // hidden. Only the open chat panel (if the user already opened it) stays
  // visible; dismissing only applies to the collapsed bubble/greeting state.
  if (dismissed && !open) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '14px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ width: 'min(380px, 90vw)' }}
          >
            <AssistantChat onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Greeting popup (collapsed state only) */}
      <AnimatePresence>
        {!open && showGreeting && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'relative',
              maxWidth: '260px',
              background: 'linear-gradient(135deg, #0d2031, #1a3a52)',
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: '0 16px 36px rgba(13,32,49,0.28)',
              border: '3px solid #C9A84C',
              cursor: 'pointer',
            }}
            onClick={handleOpen}
          >
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              style={{
                position: 'absolute',
                top: '8px',
                right: '10px',
                background: 'none',
                border: 'none',
                color: 'rgba(244,240,235,0.6)',
                fontSize: '1rem',
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
            <p
              style={{
                color: '#f4f0eb',
                fontSize: '0.92rem',
                fontWeight: 500,
                lineHeight: 1.4,
                marginBottom: '12px',
                paddingRight: '10px',
              }}
            >
              Hi there! Looking for something?
            </p>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: '#f4f0eb',
                color: '#0d2031',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                padding: '8px 16px',
                borderRadius: '999px',
              }}
            >
              Chat now
            </span>
            {/* speech-bubble tail, pointing down to the avatar */}
            <div
              style={{
                position: 'absolute',
                bottom: '-8px',
                right: '28px',
                width: '16px',
                height: '16px',
                background: '#12314a',
                transform: 'rotate(45deg)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar launcher bubble — also has its own dismiss (×) so the
          whole widget can be closed even when the greeting text isn't
          showing yet. */}
      {!open && (
        <div style={{ position: 'relative' }}>
          <motion.button
            onClick={handleOpen}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            aria-label="Open shopping assistant chat"
            style={{
              position: 'relative',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '4px solid #C9A84C',
              padding: 0,
              overflow: 'visible',
              backgroundColor: '#0d2031',
              boxShadow: '0 10px 28px rgba(13,32,49,0.35), 0 0 0 4px rgba(201,168,76,0.4)',
              cursor: 'pointer',
            }}
          >
            <img
              src={avatarMark}
              alt="Chat with our stylist"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#e74c3c',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #f4f0eb',
              }}
            >
              1
            </span>
          </motion.button>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss assistant"
            style={{
              position: 'absolute',
              top: '-6px',
              left: '-6px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '1px solid var(--color-border)',
              backgroundColor: '#ffffff',
              color: 'var(--color-navy)',
              fontSize: '0.65rem',
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(13,32,49,0.2)',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

export default FloatingAssistant