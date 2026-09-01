import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatMessage from './ChatMessage'
import AssistantProductResult from './AssistantProductResult'
import { chatWithAssistant, AiApiError } from '../../api/aiClient'
import avatarMark from '../../assets/avatar-mark.png'
import { useStoreLocator } from '../../hooks/useStoreLocator'

const STARTER_PROMPTS = [
  'Find Our Store',
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
  const { openStoreLocator, StoreLocatorModal } = useStoreLocator()
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
          reviewAnalysis: result.review_analysis ?? null,
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

  const handlePrompt = (prompt) => {
    if (prompt === 'Find Our Store') {
      openStoreLocator()
      return
    }
    sendMessage(prompt)
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
            {m.reviewAnalysis && m.reviewAnalysis.total_reviews > 0 && (
              <ReviewAnalysisCard data={m.reviewAnalysis} />
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
              onClick={() => handlePrompt(prompt)}
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
      <StoreLocatorModal />
    </div>
  )
}

// ── Review analysis card rendered inside the chat ─────────────────────────────
function ReviewAnalysisCard({ data }) {
  const { total_reviews, overall_sentiment, average_compound, reviews } = data

  const sentimentColors = { positive: '#16a34a', neutral: '#a59887', negative: '#e74c3c' }
  const sentimentBg     = { positive: '#dcfce7', neutral: '#f3f4f6', negative: '#fee2e2' }
  const color = sentimentColors[overall_sentiment] ?? '#a59887'
  const bg    = sentimentBg[overall_sentiment]    ?? '#f3f4f6'

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid var(--color-border)',
      borderRadius: '10px',
      padding: '12px 14px',
      marginBottom: '10px',
      maxWidth: '320px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {total_reviews} Review{total_reviews !== 1 ? 's' : ''}
        </span>
        <span style={{
          padding: '3px 10px', borderRadius: '999px',
          backgroundColor: bg, color,
          fontSize: '0.72rem', fontWeight: '700',
          textTransform: 'capitalize',
        }}>
          {overall_sentiment}
        </span>
      </div>

      {/* Score bar */}
      {average_compound != null && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ height: '5px', backgroundColor: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              // compound is -1 to +1; map to 0-100%
              width: `${Math.round(((average_compound + 1) / 2) * 100)}%`,
              backgroundColor: color,
              borderRadius: '999px',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)', marginTop: '4px' }}>
            Sentiment score: {average_compound.toFixed(3)} (−1 negative → +1 positive)
          </p>
        </div>
      )}

      {/* Top 3 reviews */}
      {reviews?.slice(0, 3).map((r, i) => (
        <div key={r.review_id ?? i} style={{
          display: 'flex', gap: '8px', alignItems: 'flex-start',
          paddingTop: i > 0 ? '8px' : 0,
          borderTop: i > 0 ? '1px solid var(--color-border)' : 'none',
          marginTop: i > 0 ? '8px' : 0,
        }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, marginTop: '5px',
            backgroundColor: sentimentColors[r.sentiment] ?? '#a59887',
            display: 'inline-block',
          }} />
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--color-navy)' }}>
              {r.user_name ?? 'Customer'}
            </span>
            {r.rating != null && (
              <span style={{ marginLeft: '6px', fontSize: '0.68rem', color: '#C9A84C' }}>
                {'★'.repeat(Math.round(r.rating))}
              </span>
            )}
            <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginTop: '2px', lineHeight: 1.4 }}>
              {r.review_text?.length > 80 ? r.review_text.slice(0, 80) + '…' : r.review_text}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AssistantChat