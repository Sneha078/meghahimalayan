import { useState } from 'react'
import { useRewards } from '../../hooks/useRewards'
import { getRedeemPreview } from '../../api/rewardsClient'

/**
 * Drop inside your checkout Order Summary card, between Shipping and Total:
 *   <RedeemPointsToggle subtotal={subtotal} onDiscountChange={setDiscount} />
 */
function RedeemPointsToggle({ subtotal, onDiscountChange }) {
  const { balance, cashValue, loading } = useRewards()
  const [applied, setApplied] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [capped, setCapped] = useState(false)

  const handleToggle = async () => {
    const next = !applied
    setApplied(next)

    if (!next) {
      setDiscount(0)
      setCapped(false)
      onDiscountChange?.(0)
      return
    }

    try {
      const result = await getRedeemPreview(balance, subtotal)
      setDiscount(result.discount)
      setCapped(result.discount < balance * 0.1) // 0.1 = POINTS_TO_RUPEE_RATE, hit the 20% cap
      onDiscountChange?.(result.discount)
    } catch {
      setApplied(false)
    }
  }

  if (loading) return null

  if (balance <= 0) {
    return (
      <p style={{ fontSize: '0.78rem', color: '#6b6862', padding: '10px 0' }}>
        Earn at least 100 coins to unlock discounts at checkout.
      </p>
    )
  }

  return (
    <div style={{ padding: '12px 0', borderTop: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0d2031', margin: 0 }}>
            {applied ? `Applied ${balance.toLocaleString()} Coins!` : 'Redeem Coins'}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-taupe)', marginTop: '2px' }}>
            {applied
              ? `You saved Rs. ${discount.toLocaleString()}`
              : `You have ${balance.toLocaleString()} coins (Rs. ${cashValue.toLocaleString()} value)`}
          </p>
        </div>

        <button
          onClick={handleToggle}
          aria-label="Toggle coin redemption"
          style={{
            width: '42px',
            height: '24px',
            borderRadius: '999px',
            border: 'none',
            padding: '2px',
            backgroundColor: applied ? '#0d2031' : '#e5e2dc',
            display: 'flex',
            justifyContent: applied ? 'flex-end' : 'flex-start',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              display: 'block',
            }}
          />
        </button>
      </div>

      {applied && capped && (
        <p style={{ fontSize: '0.72rem', color: '#b45309', marginTop: '8px' }}>
          Maximum redemption reached for this order - points can cover up to 20% of your subtotal.
        </p>
      )}
    </div>
  )
}

export default RedeemPointsToggle