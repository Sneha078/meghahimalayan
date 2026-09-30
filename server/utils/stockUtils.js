import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";

/**
 * Restores stock for every item in an order, atomically (matches the $inc
 * pattern used throughout orderController.js, avoiding the read-then-save
 * race condition where two concurrent restores could clobber each other).
 *
 * Handles variant and flat products: when an item had a variant we restore
 * both that variant's own stock AND the product's flat stock (kept in sync
 * with it), otherwise just the flat stock. Previously this variant branch
 * lived only in orderController.js, so paymentController's failure path
 * restored only the flat count and leaked variant stock permanently.
 *
 * An item whose product no longer exists is skipped with a warning instead
 * of throwing: there is no stock left to restore in that case, and failing
 * here would abort the surrounding transaction — leaving the order
 * uncancellable and every remaining item unrestored.
 *
 * Used by both cancellation paths in orderController.js and by
 * paymentController.js when a gateway payment fails or a bank transfer is
 * rejected — so stock deducted at order creation doesn't stay silently
 * locked up when a payment never completes.
 *
 * Pass a Mongoose `session` to run inside a transaction alongside other
 * writes (both callers do).
 */
export const restoreStock = async (orderItems, session = null) => {
  for (const item of orderItems) {
    if (item.variant?.variantId) {
      const updated = await Product.findOneAndUpdate(
        {
          _id: item.product,
          "variants._id": item.variant.variantId,
        },
        {
          $inc: {
            "variants.$[v].stock": item.quantity,
            stock: item.quantity,
          },
        },
        {
          arrayFilters: [{ "v._id": item.variant.variantId }],
          new: true,
          session,
        }
      );

      if (!updated) {
        console.warn(
          `restoreStock: product ${item.product} (variant ${item.variant.variantId}) not found for "${item.name}" — stock not restored`
        );
      }

      continue;
    }

    const product = await Product.findOneAndUpdate(
      { _id: item.product },
      { $inc: { stock: item.quantity } },
      { new: true, session }
    );

    if (!product) {
      console.warn(
        `restoreStock: product ${item.product} not found for "${item.name}" — stock not restored`
      );
    }
  }
};

/**
 * Releases one usage of a coupon, using the same atomic $inc/$pull pattern
 * used to consume it. No-ops if couponCode is empty.
 *
 * This is the single source of truth for releasing coupon usage — both
 * cancellation paths in orderController.js call it, as does
 * paymentController.js, so they can't drift apart.
 *
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