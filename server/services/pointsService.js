import PointsLedger from "../models/PointsLedger.js";

// ---- Configuration — tune to your margins ----
export const POINTS_PER_RUPEE = 1 / 100; // 1 point per Rs. 100 spent
export const EXPIRY_DAYS = 30;
export const POINTS_TO_RUPEE_RATE = 0.1; // 10 points = Rs. 1 at checkout
export const MAX_DISCOUNT_PERCENT = 0.2; // points can cover at most 20% of an order

/**
 * Award points for a completed order. Call from your order-success handler
 * (likely inside orderController.js, after payment/order creation succeeds).
 */
export async function earnPoints(userId, orderTotal, orderId) {
  const amount = Math.floor(orderTotal * POINTS_PER_RUPEE);
  if (amount <= 0) return null;

  const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  return PointsLedger.create({
    user: userId,
    type: "earn",
    amount,
    reason: `Order #${orderId}`,
    order: orderId,
    expiresAt,
  });
}

/**
 * Current usable balance = sum of everything except settled (expired) earn entries.
 */
export async function getBalance(userId) {
  const result = await PointsLedger.aggregate([
    { $match: { user: userId, $or: [{ type: { $ne: "earn" } }, { settled: false }] } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return result[0]?.total ?? 0;
}

/**
 * Points expiring within `days` days, not yet settled.
 */
export async function getExpiringSoon(userId, days = 7) {
  const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const batches = await PointsLedger.find({
    user: userId,
    type: "earn",
    settled: false,
    expiresAt: { $lte: cutoff, $gte: new Date() },
  }).sort({ expiresAt: 1 });

  const totalExpiring = batches.reduce((sum, b) => sum + b.amount, 0);
  const soonest = batches[0]?.expiresAt ?? null;

  return { totalExpiring, soonest };
}

/**
 * Redeem points for a catalog reward product (Rewards Page flow).
 */
export async function redeemPoints(userId, pointsCost, rewardLabel) {
  const balance = await getBalance(userId);
  if (balance < pointsCost) {
    const err = new Error("Not enough points for this reward");
    err.status = 400;
    throw err;
  }

  return PointsLedger.create({
    user: userId,
    type: "redeem",
    amount: -pointsCost,
    reason: `Redeemed: ${rewardLabel}`,
  });
}

/**
 * Pure calculation, no DB write — used for the checkout toggle's live preview.
 */
export function calculateDiscount(points, orderSubtotal) {
  const rawDiscount = points * POINTS_TO_RUPEE_RATE;
  const maxAllowed = orderSubtotal * MAX_DISCOUNT_PERCENT;
  return Math.min(rawDiscount, maxAllowed);
}

/**
 * Call from your order-creation flow when the order is actually placed.
 */
export async function redeemForCheckoutDiscount(userId, points, orderSubtotal, orderId) {
  if (points <= 0) return 0;

  const balance = await getBalance(userId);
  if (balance < points) {
    const err = new Error("Not enough points");
    err.status = 400;
    throw err;
  }

  const discount = calculateDiscount(points, orderSubtotal);

  await PointsLedger.create({
    user: userId,
    type: "redeem",
    amount: -points,
    reason: `Checkout discount on Order #${orderId}`,
    order: orderId,
  });

  return discount;
}

/**
 * Ledger history for the Rewards page tabs (All / Earned / Used / Expired).
 * `type` is 'earn' | 'redeem' | 'expire' | undefined (undefined = all).
 */
export async function getHistory(userId, type) {
  const filter = { user: userId };
  if (type) filter.type = type;
  return PointsLedger.find(filter).sort({ createdAt: -1 }).limit(100);
}

/**
 * Daily sweep: expire earn-entries past their expiresAt.
 */
export async function expirePoints() {
  const now = new Date();
  const expiredBatches = await PointsLedger.find({
    type: "earn",
    settled: false,
    expiresAt: { $lte: now },
  });

  for (const batch of expiredBatches) {
    await PointsLedger.create({
      user: batch.user,
      type: "expire",
      amount: -batch.amount,
      reason: `Expired: ${batch.reason}`,
    });
    batch.settled = true;
    await batch.save();
  }

  return expiredBatches.length;
}