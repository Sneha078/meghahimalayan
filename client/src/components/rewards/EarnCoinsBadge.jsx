const POINTS_PER_RUPEE = 1 / 100 // must match server/services/pointsService.js
const POINTS_TO_RUPEE_RATE = 0.1 // must match server/services/pointsService.js

/**
 * Place directly below the price / above the Add to Cart button on your
 * Product Detail Page:
 *   <EarnCoinsBadge price={product.price} />
 */
function EarnCoinsBadge({ price }) {
  const coinsEarned = Math.floor(price * POINTS_PER_RUPEE)
  const cashValue = (coinsEarned * POINTS_TO_RUPEE_RATE).toFixed(2)

  if (coinsEarned <= 0) return null

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: '#f4f0eb',
        border: '1px solid rgba(165,152,135,0.35)',
        borderRadius: '999px',
        padding: '6px 14px',
        fontSize: '0.8rem',
        color: '#0d2031',
        margin: '8px 0',
      }}
    >
      🪙 Earn <strong>{coinsEarned} Coins</strong> (Rs. {cashValue} value) with this purchase
    </div>
  )
}

export default EarnCoinsBadge