import { useEffect, useState } from 'react'

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000'

/**
 * Fetches and displays an AI-powered sentiment breakdown for a product's
 * reviews. Calls /sentiment/product/{productId} on the AI service.
 *
 * Shows:
 *  - Positive / Neutral / Negative percentage bars
 *  - Total review count
 *  - Individual review sentiment pills (if reviews exist)
 *
 * Renders nothing if the product has no reviews.
 *
 * Usage:
 *   <SentimentSummary productId={product._id} />
 */
function SentimentSummary({ productId }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(false)

  useEffect(() => {
    if (!productId) return

    let cancelled = false
    setLoading(true)
    setError(false)

    fetch(`${AI_API_URL}/sentiment/product/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json()
      })
      .then((json) => { if (!cancelled) setData(json) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [productId])

  // No reviews → don't show the section
  if (!loading && !error && (!data || data.total_reviews === 0)) return null
  // Failed silently
  if (!loading && error) return null
  // Still loading — show a small placeholder matching section height
  if (loading) {
    return (
      <div style={{ marginTop: '28px' }}>
        <div style={{
          height: '12px', width: '140px',
          borderRadius: '6px', backgroundColor: '#f3f4f6', marginBottom: '12px',
        }} />
        <div style={{ height: '60px', borderRadius: '8px', backgroundColor: '#f3f4f6' }} />
      </div>
    )
  }

  const { total_reviews, positive_percentage, neutral_percentage, negative_percentage, reviews } = data

  return (
    <div style={{ marginTop: '28px' }}>

      {/* Section label */}
      <h3 style={{
        fontSize: '0.78rem',
        fontWeight: '700',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--color-muted)',
        marginBottom: '14px',
      }}>
        Customer Sentiment · {total_reviews} review{total_reviews !== 1 ? 's' : ''}
      </h3>

      {/* Percentage bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        <SentimentBar label="Positive" pct={positive_percentage} color="#16a34a" />
        <SentimentBar label="Neutral"  pct={neutral_percentage}  color="#a59887" />
        <SentimentBar label="Negative" pct={negative_percentage} color="#e74c3c" />
      </div>

      {/* Overall verdict pill */}
      <div style={{ marginBottom: '16px' }}>
        {(() => {
          const dominant =
            positive_percentage >= neutral_percentage && positive_percentage >= negative_percentage
              ? 'positive'
              : negative_percentage >= neutral_percentage
              ? 'negative'
              : 'neutral'
          const pillColors = {
            positive: { bg: '#dcfce7', text: '#15803d' },
            neutral:  { bg: '#f3f4f6', text: '#6b6862' },
            negative: { bg: '#fee2e2', text: '#b91c1c' },
          }
          const { bg, text } = pillColors[dominant]
          const labels = { positive: 'Mostly Positive', neutral: 'Mixed Reviews', negative: 'Mostly Negative' }
          return (
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '999px',
              backgroundColor: bg,
              color: text,
              fontSize: '0.75rem',
              fontWeight: '600',
            }}>
              {labels[dominant]}
            </span>
          )
        })()}
      </div>

      {/* Recent review sentiments (up to 4) */}
      {reviews && reviews.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {reviews.slice(0, 4).map((r, i) => (
            <div key={r.review_id ?? i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 12px',
              backgroundColor: 'var(--color-sbg)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}>
              <SentimentDot sentiment={r.sentiment} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--color-navy)' }}>
                    {r.user_name ?? 'Customer'}
                  </span>
                  {r.rating != null && (
                    <span style={{ fontSize: '0.72rem', color: '#C9A84C', fontWeight: '600' }}>
                      {'★'.repeat(Math.round(r.rating))}{'☆'.repeat(5 - Math.round(r.rating))}
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: '0.82rem',
                  color: 'var(--color-muted)',
                  lineHeight: '1.5',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {r.review_text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Helper components ──────────────────────────────────────────────────────────

function SentimentBar({ label, pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', width: '56px', flexShrink: 0 }}>
        {label}
      </span>
      <div style={{
        flex: 1, height: '6px',
        backgroundColor: '#f3f4f6',
        borderRadius: '999px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          backgroundColor: color,
          borderRadius: '999px',
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-navy)', width: '36px', textAlign: 'right', flexShrink: 0 }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

function SentimentDot({ sentiment }) {
  const colors = { positive: '#16a34a', neutral: '#a59887', negative: '#e74c3c' }
  return (
    <span style={{
      width: '8px', height: '8px',
      borderRadius: '50%',
      backgroundColor: colors[sentiment] ?? '#a59887',
      flexShrink: 0,
      marginTop: '5px',
      display: 'inline-block',
    }} />
  )
}

export default SentimentSummary
