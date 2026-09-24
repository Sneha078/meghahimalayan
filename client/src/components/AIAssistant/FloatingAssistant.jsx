import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AssistantChat from './AssistantChat'
import avatarMark from '../../assets/avatar-mark.png'

// The widget reappears this long after the X is clicked.
// To hide it for the rest of the page session instead, see the note in handleDismiss.
const DISMISS_COOLDOWN_MS = 12000

function FloatingAssistant() {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const cooldownTimerRef = useRef(null)

  // Clear any pending reappearance timer on unmount so we never call
  // setState after the component is gone.
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    }
  }, [])

  const handleOpen = () => {
    setOpen(true)
  }

  const handleDismiss = (e) => {
    e.stopPropagation()
    setDismissed(true)

    // To keep it hidden until the page is reloaded, delete everything
    // below this comment (the timer that brings the widget back).
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    cooldownTimerRef.current = setTimeout(() => {
      setDismissed(false)
    }, DISMISS_COOLDOWN_MS)
  }

  // While dismissed, the whole launcher is hidden. An already-open chat
  // panel stays visible.
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

      {/* Avatar launcher with its own dismiss (×) */}
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