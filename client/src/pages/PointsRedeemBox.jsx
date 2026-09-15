import { useEffect, useState } from "react";
import { useRewards } from "../hooks/useRewards";

// Fallback defaults — used only if the balance API response is somehow
// still missing these fields (e.g. backend not yet redeployed). Keeps this
// component from ever showing NaN, independent of RewardsContext.jsx's own
// merge-with-defaults fix. Belt and suspenders: two independent layers
// protecting against the same failure mode.
const DEFAULT_RATE = 0.1; // 10 points = Rs. 1
const DEFAULT_CAP = 0.2; // points can cover at most 20% of an order

/**
 * "Use points" widget for checkout order summaries — simple all-or-nothing
 * toggle (Daraz-style): checking it applies the maximum usable points in
 * one step, no partial slider.
 *
 * Usage in Checkout.jsx:
 *
 *   const [pointsUsed, setPointsUsed] = useState(0);
 *   const [pointsDiscount, setPointsDiscount] = useState(0);
 *
 *   <PointsRedeemBox
 *     subtotal={itemsPrice}
 *     onChange={(points, discount) => {
 *       setPointsUsed(points);
 *       setPointsDiscount(discount);
 *     }}
 *   />
 */
function PointsRedeemBox({ subtotal, onChange }) {
  const {
    balance,
    pointsToRupeeRate: rateFromApi,
    maxDiscountPercent: capFromApi,
    loading,
  } = useRewards();

  const pointsToRupeeRate =
    typeof rateFromApi === "number" && rateFromApi > 0 ? rateFromApi : DEFAULT_RATE;

  const maxDiscountPercent =
    typeof capFromApi === "number" && capFromApi > 0 ? capFromApi : DEFAULT_CAP;

  const [enabled, setEnabled] = useState(false);

  const safeSubtotal = Number(subtotal) || 0;
  const safeBalance = Number(balance) || 0;

  // Highest number of points that could possibly matter — capped by both
  // the customer's balance AND the 20%-of-subtotal safety rule. Checking
  // the box always uses exactly this many points; there's no partial
  // amount to choose.
  const maxAllowedByCap = Math.floor(
    (safeSubtotal * maxDiscountPercent) / pointsToRupeeRate
  );
  const maxUsable = Math.max(0, Math.min(safeBalance, maxAllowedByCap));
  const maxSavings = maxUsable * pointsToRupeeRate;

  const pointsUsed = enabled ? maxUsable : 0;
  const discount = enabled ? maxSavings : 0;

  useEffect(() => {
    onChange?.(pointsUsed, discount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsUsed, discount]);

  // If the cart changes and maxUsable drops to 0 (or the box is currently
  // enabled but there's nothing left to apply), turn the toggle back off
  // rather than silently applying zero.
  useEffect(() => {
    if (enabled && maxUsable === 0) {
      setEnabled(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxUsable]);

  if (loading || safeBalance <= 0) return null;

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "10px",
        padding: "16px",
        marginBottom: "16px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "0.78rem", color: "#6b6862", margin: 0 }}>
            Available points
          </p>
          <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0d1a2a", margin: "2px 0 0" }}>
            {safeBalance.toLocaleString()}
          </p>
          <p style={{ fontSize: "0.72rem", color: "#6b6862", margin: "2px 0 0" }}>
            Save up to Rs. {maxSavings.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: maxUsable > 0 ? "pointer" : "not-allowed" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0d1a2a" }}>
            Use points
          </span>
          <input
            type="checkbox"
            checked={enabled}
            disabled={maxUsable === 0}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: "18px", height: "18px", cursor: maxUsable > 0 ? "pointer" : "not-allowed" }}
          />
        </label>
      </div>

      <p style={{ fontSize: "0.72rem", color: "#a59887", margin: "10px 0 0" }}>
        {(1 / pointsToRupeeRate).toFixed(0)} points = Rs. 1
      </p>

      {enabled && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginTop: "10px",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "#16a34a",
          }}
        >
          <span>Using {pointsUsed.toLocaleString()} points - you'll save</span>
          <span>Rs. {discount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      )}
    </div>
  );
}

export default PointsRedeemBox;