import mongoose from "mongoose";

import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";

import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

import {
  getBalance,
  getExpiringSoon,
  getHistory,
  calculateDiscount,
  spendPointsForOrder,
  POINTS_TO_RUPEE_RATE,
  MAX_DISCOUNT_PERCENT,
} from "../services/pointsService.js";

import {
  generateOrderNumber,
  validateShippingInfo,
} from "./orderController.js";

import { sendOrderConfirmationEmail } from "../services/emailService.js";
import { notifyAdmins } from "../services/notificationService.js";

// GET /api/v1/rewards/balance
export const getRewardsBalance = handleAsyncError(async (req, res) => {
  const balance = await getBalance(req.user._id);
  const expiring = await getExpiringSoon(req.user._id, 7);

  res.status(200).json({
    success: true,
    balance,
    cashValue: Number((balance * POINTS_TO_RUPEE_RATE).toFixed(2)),
    expiringSoon: expiring.totalExpiring,
    expiringDate: expiring.soonest,
    // Exposed so the checkout page can compute a live discount preview
    // client-side (instant feedback as the customer types/drags), using
    // the EXACT same formula the server applies authoritatively at order
    // creation. This is purely for display — the server always recomputes
    // the real discount from scratch when the order is actually placed,
    // so there's no risk in the client mirroring this math.
    pointsToRupeeRate: POINTS_TO_RUPEE_RATE,
    maxDiscountPercent: MAX_DISCOUNT_PERCENT,
  });
});

// Point-cost bands for the Rewards catalog
const POINT_TIERS = [
  { key: "200-500", min: 200, max: 500 },
  { key: "501-800", min: 501, max: 800 },
  { key: "801-1300", min: 801, max: 1300 },
  { key: "1300+", min: 1301, max: Infinity },
];

function bandForPoints(points) {
  return POINT_TIERS.find((t) => points >= t.min && points <= t.max)?.key ?? null;
}

// GET /api/v1/rewards/catalog?maxPoints=1500
export const getRewardsCatalog = handleAsyncError(async (req, res) => {
  const filter = { pointsCost: { $gte: 200 } };
  if (req.query.maxPoints) filter.pointsCost.$lte = Number(req.query.maxPoints);

  const rewards = await Product.find(filter).sort({ pointsCost: 1 });

  const tiers = {};
  for (const product of rewards) {
    const band = bandForPoints(product.pointsCost);
    if (!band) continue;
    if (!tiers[band]) tiers[band] = [];
    tiers[band].push(product);
  }

  res.status(200).json({ success: true, tiers, tierOrder: POINT_TIERS.map((t) => t.key) });
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/v1/rewards/redeem
// body: { productId, shippingInfo: { name, address, city, state, pincode, phoneNo } }
//
// Redeeming now creates a REAL Order — same shape as a normal checkout
// order, just paid entirely in points instead of cash. This means the
// redeemed item flows through your existing admin order pipeline
// (Processing → Confirmed → Shipped → Delivered), shows up in the
// customer's "My Orders", and gets the same status-change emails —
// without needing any separate fulfillment UI.
//
// Runs as a single transaction: points deduction, stock deduction, and
// order creation either all succeed or all roll back together. If any
// step fails, the customer is not charged points for a reward that didn't
// actually get created.
// ─────────────────────────────────────────────────────────────────────────
export const redeemReward = handleAsyncError(async (req, res, next) => {
  const { productId, shippingInfo } = req.body;

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return next(new HandleError("A valid product ID is required", 400));
  }

  // Reuse the exact same shipping validation checkout uses, so a redeemed
  // item can't end up with an incomplete/invalid delivery address.
  validateShippingInfo(shippingInfo);

  const session = await mongoose.startSession();

  try {
    let createdOrder;
    let pointsSpent;

    await session.withTransaction(async () => {
      const product = await Product.findById(productId).session(session);

      if (!product) {
        throw new HandleError("Reward product not found", 404);
      }

      if (!product.pointsCost || product.pointsCost < 200) {
        throw new HandleError("This product is not available as a reward", 400);
      }

      if (product.isDeleted === true || product.isActive === false) {
        throw new HandleError(`"${product.name}" is currently unavailable`, 400);
      }

      if (!product.stock || product.stock < 1) {
        throw new HandleError(`"${product.name}" is out of stock`, 400);
      }

      // ─────────────────────────
      // STOCK DEDUCTION
      // ─────────────────────────
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: product._id,
          isDeleted: { $ne: true },
          isActive: { $ne: false },
          stock: { $gte: 1 },
        },
        { $inc: { stock: -1 } },
        { new: true, session }
      );

      if (!updatedProduct) {
        throw new HandleError(`"${product.name}" is out of stock`, 400);
      }

      // ─────────────────────────
      // CREATE ORDER (paid entirely in points)
      // ─────────────────────────
      const order = new Order({
        orderNumber: generateOrderNumber(),

        shippingInfo: {
          name: shippingInfo.name.trim(),
          address: shippingInfo.address.trim(),
          city: shippingInfo.city.trim(),
          state: shippingInfo.state.trim(),
          pincode: shippingInfo.pincode.trim(),
          phoneNo: shippingInfo.phoneNo.trim().replace(/\s|-/g, ""),
        },

        orderItems: [
          {
            product: product._id,
            name: product.name,
            category: product.category,
            image: product.images?.[0]?.url || product.image?.[0]?.url || "",
            quantity: 1,
            // Paid in points, not cash — the item itself carries no cash price.
            price: 0,
          },
        ],

        orderStatus: "Processing",

        statusHistory: [
          {
            status: "Processing",
            changedAt: new Date(),
            note: `Redeemed for ${product.pointsCost} points`,
          },
        ],

        user: req.user._id,

        paymentInfo: {
          id: null,
          method: "Reward Redemption",
          // Points are deducted immediately below — there's no separate
          // "pending payment" state the way cash orders have.
          status: "Paid",
        },

        paidAt: new Date(),
        confirmedAt: null,
        shippedAt: null,
        cancelledAt: null,
        deliveredAt: null,
        refundedAt: null,

        itemsPrice: 0,
        taxPrice: 0,
        shippingPrice: 0,
        discount: 0,
        couponCode: "",
        totalPrice: 0,

        // Points were already spent to create this order — don't let the
        // rewards system award points back for a Rs. 0 total if this order
        // is later marked Delivered.
        pointsAwarded: true,

        // Reusing the same field the checkout points-discount flow uses.
        // This is what makes the EXISTING cancellation refund logic
        // (cancelMyOrder / admin updateOrderStatus in orderController.js)
        // automatically return these points if this order is cancelled
        // before it ships — no separate refund code needed for this flow.
        pointsRedeemed: product.pointsCost,

        isDeleted: false,
      });

      await order.save({ session });
      createdOrder = order;

      // ─────────────────────────
      // DEDUCT POINTS
      // ─────────────────────
      //
      // Uses the same atomic, session-aware helper the checkout
      // points-discount flow uses (spendPointsForOrder), so the balance
      // check and ledger write are part of THIS transaction — if
      // anything above or below fails, this rolls back too.
      //
      await spendPointsForOrder(
        req.user._id,
        product.pointsCost,
        order._id,
        session,
        `Redeemed: ${product.name}`
      );
      pointsSpent = product.pointsCost;
    });

    // Transaction committed — fire non-critical side effects after, same
    // pattern as regular order creation in orderController.js.
    void notifyAdmins({
      type: "ORDER",
      title: "Reward Redeemed",
      message: `${createdOrder.orderNumber} — redeemed for ${pointsSpent} points`,
      data: {
        orderId: createdOrder._id,
        orderNumber: createdOrder.orderNumber,
      },
    });

    try {
      const customer = req.user;
      void sendOrderConfirmationEmail(createdOrder, customer).catch((err) => {
        console.error(`Redemption confirmation email failed for ${createdOrder.orderNumber}:`, err?.message || err);
      });
    } catch (err) {
      console.error(`Failed to prepare redemption email for ${createdOrder.orderNumber}:`, err?.message || err);
    }

    const newBalance = await getBalance(req.user._id);

    res.status(201).json({
      success: true,
      message: "Redeemed successfully",
      order: createdOrder,
      balance: newBalance,
    });
  } catch (err) {
    return next(err instanceof HandleError ? err : new HandleError(err.message, err.status || 400));
  } finally {
    await session.endSession();
  }
});

// GET /api/v1/rewards/redeem-preview?points=200&subtotal=10908
export const getRedeemPreview = handleAsyncError(async (req, res, next) => {
  const points = Number(req.query.points) || 0;
  const subtotal = Number(req.query.subtotal) || 0;
  const balance = await getBalance(req.user._id);

  if (points > balance) {
    return next(new HandleError("Not enough points", 400));
  }

  const discount = calculateDiscount(points, subtotal);
  res.status(200).json({ success: true, discount, balance });
});

// GET /api/v1/rewards/history?type=earn|redeem|expire  (omit type for all)
export const getRewardsHistory = handleAsyncError(async (req, res) => {
  const { type } = req.query;
  const validTypes = ["earn", "redeem", "expire"];
  const entries = await getHistory(req.user._id, validTypes.includes(type) ? type : undefined);

  res.status(200).json({ success: true, entries });
});