// Base URL for the AI/ML service (the "ai" folder, run separately from the client).
// Set VITE_AI_API_URL in client/.env for local dev / deployment, e.g.:
//   VITE_AI_API_URL=http://localhost:8000
const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000'

console.log('AI_API_URL is:', AI_API_URL)
class AiApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'AiApiError'
    this.status = status
  }
}

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${AI_API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new AiApiError('Could not reach the assistant. Check your connection and try again.', 0)
  }

  if (!res.ok) {
    // Backend currently returns raw exception text in `detail` — don't surface
    // that to the user, just use a friendly fallback per status code.
    const fallback =
      res.status === 400
        ? 'That request was missing something. Try rephrasing.'
        : 'The assistant had trouble with that. Please try again.'
    throw new AiApiError(fallback, res.status)
  }

  return res.json()
}

/**
 * Send a message to the AI shopping assistant.
 * @param {string} query
 * @returns {Promise<{
 *   response: string,
 *   intent?: string,
 *   products: object[],
 *   recommended_products: object[],
 *   constraints?: object,
 *   review_analysis?: object,
 * }>}
 */
export function chatWithAssistant(query) {
  return request('/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}

export { AiApiError }