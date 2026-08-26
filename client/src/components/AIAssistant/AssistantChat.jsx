import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatMessage from './ChatMessage'
import AssistantProductResult from './AssistantProductResult'
import { chatWithAssistant, AiApiError } from '../../api/aiClient'
import avatarMark from '../../assets/avatar-mark.png'

const STARTER_PROMPTS = [
  'Watches under Rs. 10,000',
  'Something for a summer fragrance',
  'Best sunglasses',
]

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '4px', padding: '10px 14px' }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#a59887',
            display: 'inline-block',
          }}
        />
      ))}
    </div>
  )
}

function AssistantChat({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi, I'm your Megahimalayan AI Assistant. Tell me what you're shopping for - a budget, an occasion, or a specific piece - and I'll find it.",
      products: [],
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const query = text.trim()
    if (!query || loading) return

    setMessages((prev) => [...prev, { role: 'user', text: query, products: [] }])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const result = await chatWithAssistant(query)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: result.response || "Here's what I found:",
          products: result.products?.slice(0, 4) || [],
        },
      ])
    } catch (err) {
      const msg = err instanceof AiApiError ? err.message : 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 48px rgba(13,32,49,0.08)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          backgroundColor: '#3b4044ff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <img
          src={avatarMark}
          alt=""
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid #C9A84C',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            color: '#f4f0eb',
            fontSize: '1rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
            flex: 1,
          }}
        >
          Ask Our Assistant
        </span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close chat"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(244,240,235,0.7)',
              fontSize: '1.1rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          padding: '18px 20px',
          maxHeight: '360px',
          overflowY: 'auto',
          backgroundColor: '#f7f4f0',
        }}
      >
        {messages.map((m, i) => (
          <div key={i}>
            <ChatMessage role={m.role} text={m.text} />
            {m.products?.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  overflowX: 'auto',
                  paddingBottom: '10px',
                  marginBottom: '10px',
                }}
              >
                {m.products.map((p) => (
                  <AssistantProductResult key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        ))}

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '4px' }}>{error}</p>
        )}
      </div>

      {/* Starter prompts (only before the first user message) */}
      {messages.length === 1 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0 20px 14px' }}>
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem',
                color: '#0d2031',
                backgroundColor: '#f4f0eb',
                border: '1px solid var(--color-border)',
                borderRadius: '999px',
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          borderTop: '1px solid var(--color-border)',
          padding: '12px 14px',
          gap: '10px',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a product, budget, or occasion..."
          disabled={loading}
          style={{
            flex: 1,
            border: '1px solid var(--color-border)',
            borderRadius: '999px',
            padding: '10px 16px',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.85rem',
            color: '#0d2031',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            backgroundColor: '#0d2031',
            color: '#f4f0eb',
            border: 'none',
            borderRadius: '999px',
            padding: '10px 20px',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default AssistantChat