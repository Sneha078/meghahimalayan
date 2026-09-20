import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";

/**
 * Restores stock atomically (matches the $inc pattern used throughout
 * orderController.js, avoiding the read-then-save race condition where two
 * concurrent restores could clobber each other).
 *
 * Used by orderController.js's own cancel/admin-cancel paths AND by
 * paymentController.js when a gateway payment fails or a bank transfer is
 * rejected — so stock deducted at order creation doesn't stay silently
 * locked up when a payment never completes.
 *
 * Pass a Mongoose `session` to run inside a transaction alongside other
 * writes (recommended — see paymentController.js for usage).
 */
export const restoreStock = async (orderItems, session = null) => {
  for (const item of orderItems) {
    await Product.findOneAndUpdate(
      { _id: item.product },
      { $inc: { stock: item.quantity } },
      { new: true, session }
    );
  }
};

/**
 * Releases one usage of a coupon, mirroring the same $inc pattern
 * cancelMyOrder/updateOrderStatus already use. No-ops if couponCode is empty.
 * Pass userId to also remove the user from usedBy so their per-user
 * limit is correctly restored.
 */
export const releaseCouponUsage = async (couponCode, session = null, userId = null) => {
  if (!couponCode) return;

  const update = { $inc: { usedCount: -1 } };
  if (userId) {
    update.$pull = { usedBy: userId };
  }

  await Coupon.findOneAndUpdate(
    { code: couponCode, usedCount: { $gt: 0 } },
    update,
    { session }
  );
};