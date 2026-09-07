import { motion } from 'framer-motion'

function ChatMessage({ role, text }) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '10px',
      }}
    >
      <div
        style={{
          maxWidth: '78%',
          padding: '10px 14px',
          borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          backgroundColor: isUser ? '#0d2031' : '#ffffff',
          color: isUser ? '#f4f0eb' : '#0d2031',
          border: isUser ? 'none' : '1px solid var(--color-border)',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.88rem',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
        }}
      >
        {text}
      </div>
    </motion.div>
  )
}

export default ChatMessage