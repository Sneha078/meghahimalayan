import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getBalance } from "../api/rewardsClient";
import { useAuth } from "./AuthContext";

const RewardsContext = createContext(undefined);

const EMPTY_STATE = {
  balance: 0,
  cashValue: 0,
  expiringSoon: 0,
  expiringDate: null,
  pointsToRupeeRate: 0.1,
  maxDiscountPercent: 0.2,
};

/**
 * Wraps the app once (alongside CartProvider / AuthProvider / WishlistProvider)
 * so every component that calls useRewards() reads from the SAME balance
 * state, instead of each component fetching and holding its own independent
 * copy.
 *
 * This is what makes redeeming on the Rewards page instantly update the
 * CoinBadge in the navbar too — previously each called useRewards()
 * separately, so RewardsPage's refresh() had no way to notify CoinBadge's
 * separate copy, and only a full reload (which re-runs every component's
 * own useEffect from scratch) would show the new number.
 */
export function RewardsProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      // Logged out — don't bother hitting the API, just show zero.
      setData(EMPTY_STATE);
      setLoading(false);
      return;
    }

    try {
      const result = await getBalance();
      // Merge with EMPTY_STATE rather than replacing outright — if the
      // API response is ever missing a field (e.g. an older deploy that
      // hasn't picked up a new field yet), this falls back to a sane
      // default instead of `undefined`, which would otherwise silently
      // turn into NaN wherever that field gets used in arithmetic
      // (see PointsRedeemBox.jsx).
      setData({ ...EMPTY_STATE, ...result });
    } catch {
      // Not logged in, or request failed — treat as zero balance.
      setData(EMPTY_STATE);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refetch whenever the logged-in user changes (login/logout/switch account),
  // not just once on mount.
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <RewardsContext.Provider value={{ ...data, loading, refresh }}>
      {children}
    </RewardsContext.Provider>
  );
}

/**
 * Same shape as before: { balance, cashValue, expiringSoon, expiringDate, loading, refresh }.
 * Existing callers (CoinBadge, RewardsPage) need no changes.
 */
export function useRewards() {
  const ctx = useContext(RewardsContext);
  if (ctx === undefined) {
    throw new Error("useRewards must be used within a RewardsProvider — check that RewardsProvider wraps your app in main.jsx/App.jsx.");
  }
  return ctx;
}