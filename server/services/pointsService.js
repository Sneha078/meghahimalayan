import PointsLedger from "../models/PointsLedger.js";
import Order from "../models/orderModel.js";

// ---- Configuration — tune to your margins ----
export const POINTS_PER_RUPEE = 1 / 100; // 1 point per Rs. 100 spent
export const EXPIRY_DAYS = 30;
export const POINTS_TO_RUPEE_RATE = 0.1; // 10 points = Rs. 1 at checkout
export const MAX_DISCOUNT_PERCENT = 0.2; // points can cover at most 20% of an order

/**
 * Award points for a completed order.
 *
 * Idempotency is enforced by the database, not application logic: the
 * PointsLedger schema has a unique index on { order: 1, type: 1 }
 * (partial: only applies to type: "earn"). If an "earn" entry already
 * exists for this order, this insert fails with a duplicate-key error
 * (code 11000), which we catch and treat as "already awarded, nothing to
 * do" rather than an error.
 *
 * This means calling earnPoints() twice for the same order — from two
 * concurrent requests, a retry after a partial failure, or a backfill
 * script re-run on an order that actually already got its points — is
 * always safe. There is no window where the ledger can end up with two
 * "earn" entries for one order, no matter how the calls are timed.
 */
export async function earnPoints(userId, orderTotal, orderObjectId, orderLabel) {
  const amount = Math.floor(orderTotal * POINTS_PER_RUPEE);
  if (amount <= 0) return null;

  const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  try {
    return await PointsLedger.create({
      user: userId,
      type: "earn",
      amount,
      // Human-readable label for display (falls back to the raw id if none given).
      reason: `Order #${orderLabel ?? orderObjectId}`,
      // Must be the actual Mongo ObjectId — the schema's `order` field is a
      // ref to Order, not a free-text string. Passing orderNumber here
      // instead of the real _id causes a silent cast failure at creation.
      order: orderObjectId,
      expiresAt,
    });
  } catch (err) {
    if (err?.code === 11000) {
      // Duplicate "earn" entry for this order — points were already
      // credited (possibly by a concurrent call, or an earlier attempt
      // that we don't have a record of finishing). Not an error.
      return null;
    }
    throw err;
  }
}

/**
 * Award points for an order. Safe to call multiple times for the same
 * order — see earnPoints() above for why. Call this from wherever an
 * order's payment is confirmed as final:
 *   - updateOrderStatus, when a COD order transitions to "Delivered"
 *   - verifyEsewa / verifyKhalti, on successful gateway verification
 *   - reviewBankTransfer, when an admin approves a manual transfer
 *   - a backfill script, for orders that were delivered/paid before
 *     this reward system existed
 */
export async function awardOrderPoints(orderId) {
  const order = await Order.findById(orderId);
  if (!order) return null;

  // order._id (the real ObjectId) goes into the ledger's `order` ref field.
  // order.orderNumber (the human-readable label) is passed separately, used
  // only for the ledger entry's display text.
  const ledgerEntry = await earnPoints(order.user, order.totalPrice, order._id, order.orderNumber);

  // pointsAwarded is a convenience flag for quick admin/UI queries only —
  // it is NOT what prevents double-crediting (the ledger's unique index
  // does that). If this update fails for some reason, points were still
  // correctly credited; the flag just wouldn't reflect it, which is
  // harmless since earnPoints() is safe to call again regardless.
  if (ledgerEntry) {
    await Order.updateOne({ _id: orderId }, { $set: { pointsAwarded: true } }).catch((err) => {
      console.error(`Points were credited for order ${orderId}, but the pointsAwarded flag failed to save:`, err?.message || err);
    });
  }

  return ledgerEntry;
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
 * Spend points as part of an order's creation transaction — used for BOTH
 * the checkout points-discount flow (orderController.js) and the
 * reward-catalog product redemption flow (rewardsController.js). Takes a
 * Mongoose session so the balance check and ledger write are part of the
 * SAME transaction as the order/stock writes — if anything else in that
 * transaction fails, this rolls back too, instead of leaving points spent
 * with no order to show for it.
 *
 * `reason` defaults to the checkout-discount wording for backward
 * compatibility with existing callers; pass a custom reason (e.g.
 * `Redeemed: ${product.name}`) for other flows.
 */
export async function spendPointsForOrder(userId, points, orderId, session, reason) {
  if (points <= 0) return null;

  const result = await PointsLedger.aggregate([
    { $match: { user: userId, $or: [{ type: { $ne: "earn" } }, { settled: false }] } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).session(session);

  const balance = result[0]?.total ?? 0;

  if (balance < points) {
    const err = new Error("Not enough points for this order");
    err.status = 400;
    throw err;
  }

  const [entry] = await PointsLedger.create(
    [
      {
        user: userId,
        type: "redeem",
        amount: -points,
        reason: reason || `Checkout discount on Order #${orderId}`,
        order: orderId,
      },
    ],
    { session }
  );

  return entry;
}

/**
 * Refund points that were spent as a checkout discount, when the order
 * they paid for gets cancelled (failed gateway payment, customer
 * cancellation, or admin cancellation). Safe to call multiple times for
 * the same order — reuses the same unique-index mechanism as earnPoints()
 * (order+type:"earn" can only exist once), so a duplicate call is a no-op
 * rather than a double-refund.
 *
 * No-op if the order never redeemed any points.
 */
export async function refundPointsForOrder(orderId, session = null) {
  const order = await Order.findById(orderId).session(session);

  if (!order || !order.pointsRedeemed || order.pointsRedeemed <= 0) {
    return null;
  }

  const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  try {
    const [entry] = await PointsLedger.create(
      [
        {
          user: order.user,
          type: "earn",
          amount: order.pointsRedeemed,
          reason: `Refund: points returned for cancelled Order #${order.orderNumber}`,
          order: order._id,
          expiresAt,
        },
      ],
      { session }
    );

    return entry;
  } catch (err) {
    if (err?.code === 11000) {
      // Already refunded (or, in principle, this order separately earned
      // points normally — mutually exclusive in practice, since a
      // cancelled order can never later reach Delivered).
      return null;
    }
    throw err;
  }
}

/**
 * Redeem points for a catalog reward product (Rewards Page flow).
 * orderId is optional — pass the Order created for this redemption so the
 * ledger entry links back to it, same as "earn" entries do.
 */
export async function redeemPoints(userId, pointsCost, rewardLabel, orderId = null) {
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
    order: orderId,
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