import { useEffect } from "react";
import { useRewards } from "../hooks/useRewards";

const DEFAULT_RATE = 0.1; // 10 points = Rs. 1
const DEFAULT_CAP = 0.2; // points can cover at most 20% of an order

/**
 * Shared "Use points" widget.
 *
 * The selected points are controlled by CartContext.
 *
 * Usage:
 *
 * <PointsRedeemBox
 *   subtotal={discounted}
 *   pointsUsed={pointsUsed}
 *   pointsDiscount={pointsDiscount}
 *   onChange={(points, discount) => {
 *     setPointsRedemption(points, discount);
 *   }}
 * />
 */
function PointsRedeemBox({
  subtotal,
  pointsUsed = 0,
  pointsDiscount = 0,
  onChange,
}) {
  const {
    balance,
    pointsToRupeeRate: rateFromApi,
    maxDiscountPercent: capFromApi,
    loading,
  } = useRewards();

  const pointsToRupeeRate =
    typeof rateFromApi === "number" && rateFromApi > 0
      ? rateFromApi
      : DEFAULT_RATE;

  const maxDiscountPercent =
    typeof capFromApi === "number" && capFromApi > 0
      ? capFromApi
      : DEFAULT_CAP;

  const safeSubtotal = Number(subtotal) || 0;
  const safeBalance = Number(balance) || 0;
  const safePointsUsed = Number(pointsUsed) || 0;

  /**
   * Maximum points that can be used:
   *
   * 1. Cannot exceed user's balance
   * 2. Cannot exceed the configured percentage of subtotal
   */
  const maxAllowedByCap = Math.floor(
    (safeSubtotal * maxDiscountPercent) /
      pointsToRupeeRate
  );

  const maxUsable = Math.max(
    0,
    Math.min(
      safeBalance,
      maxAllowedByCap
    )
  );

  const maxSavings =
    maxUsable * pointsToRupeeRate;

  /**
   * The checkbox is now controlled by CartContext.
   *
   * If pointsUsed > 0:
   *     checkbox = checked
   *
   * If pointsUsed = 0:
   *     checkbox = unchecked
   */
  const enabled = safePointsUsed > 0;

  /**
   * If the cart/subtotal changes while points are enabled,
   * make sure the selected points never exceed the new maximum.
   */
  useEffect(() => {
    if (!onChange) return;

    if (safePointsUsed > 0) {
      const validPoints = Math.min(
        safePointsUsed,
        maxUsable
      );

      const validDiscount =
        validPoints * pointsToRupeeRate;

      /**
       * Only update when the value actually changed.
       * This prevents an unnecessary update loop.
       */
      if (
        validPoints !== safePointsUsed ||
        Math.abs(
          validDiscount -
            Number(pointsDiscount || 0)
        ) > 0.001
      ) {
        onChange(
          validPoints,
          validDiscount
        );
      }
    }
  }, [
    safePointsUsed,
    pointsDiscount,
    maxUsable,
    pointsToRupeeRate,
    onChange,
  ]);

  /**
   * When user checks/unchecks the box:
   *
   * Checked:
   *   → use maximum available points
   *
   * Unchecked:
   *   → use 0 points
   */
  const handleChange = (event) => {
    const checked = event.target.checked;

    if (checked) {
      if (maxUsable > 0) {
        const savings =
          maxUsable * pointsToRupeeRate;

        onChange?.(
          maxUsable,
          savings
        );
      }
    } else {
      onChange?.(0, 0);
    }
  };

  /**
   * Don't show the component if:
   * - rewards are still loading
   * - user has no points
   */
  if (loading || safeBalance <= 0) {
    return null;
  }

  return (
    <div
      style={{
        border:
          "1px solid var(--color-border)",
        borderRadius: "10px",
        padding: "16px",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.78rem",
              color: "#6b6862",
              margin: 0,
            }}
          >
            Available points
          </p>

          <p
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "#0d1a2a",
              margin: "2px 0 0",
            }}
          >
            {safeBalance.toLocaleString()}
          </p>

          <p
            style={{
              fontSize: "0.72rem",
              color: "#6b6862",
              margin: "2px 0 0",
            }}
          >
            Save up to Rs.{" "}
            {maxSavings.toLocaleString(
              undefined,
              {
                maximumFractionDigits: 2,
              }
            )}
          </p>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor:
              maxUsable > 0
                ? "pointer"
                : "not-allowed",
          }}
        >
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#0d1a2a",
            }}
          >
            {enabled
              ? "Points applied"
              : "Use points"}
          </span>

          <input
            type="checkbox"
            checked={enabled}
            disabled={maxUsable === 0}
            onChange={handleChange}
            style={{
              width: "18px",
              height: "18px",
              cursor:
                maxUsable > 0
                  ? "pointer"
                  : "not-allowed",
            }}
          />
        </label>
      </div>

      <p
        style={{
          fontSize: "0.72rem",
          color: "#a59887",
          margin: "10px 0 0",
        }}
      >
        {(1 / pointsToRupeeRate).toFixed(0)}{" "}
        points = Rs. 1
      </p>

      {enabled && safePointsUsed > 0 && (
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
          <span>
            Using{" "}
            {safePointsUsed.toLocaleString()}{" "}
            points - you'll save
          </span>

          <span>
            Rs.{" "}
            {Number(
              pointsDiscount || 0
            ).toLocaleString(
              undefined,
              {
                maximumFractionDigits: 2,
              }
            )}
          </span>
        </div>
      )}
    </div>
  );
}

export default PointsRedeemBox;