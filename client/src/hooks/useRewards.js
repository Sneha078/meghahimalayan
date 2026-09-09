import { useEffect, useState, useCallback } from 'react'
import { getBalance } from '../api/rewardsClient'

/**
 * Usage:
 *   const { balance, cashValue, expiringSoon, expiringDate, loading, refresh } = useRewards()
 */
export function useRewards() {
  const [data, setData] = useState({
    balance: 0,
    cashValue: 0,
    expiringSoon: 0,
    expiringDate: null,
  })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const result = await getBalance()
      setData(result)
    } catch {
      // not logged in, or request failed — treat as zero balance
      setData({ balance: 0, cashValue: 0, expiringSoon: 0, expiringDate: null })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ...data, loading, refresh }
}