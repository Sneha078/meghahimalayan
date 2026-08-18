import Coupon from "../models/couponModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/coupon/validate
// Called during checkout to preview discount before placing the order.
// Does NOT increment usedCount — that happens in orderController.createNewOrder.
export const validateCoupon = handleAsyncError(async (req, res, next) => {
  const { code, subtotal } = req.body;

  if (!code) {
    return next(new HandleError("Please enter a coupon code", 400));
  }

  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    return next(new HandleError("Invalid or inactive coupon code", 400));
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return next(new HandleError("This coupon has expired", 400));
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return next(new HandleError("This coupon has reached its usage limit", 400));
  }

  const orderTotal = Number(subtotal) || 0;

  if (orderTotal < coupon.minOrder) {
    return next(
      new HandleError(
        `This coupon requires a minimum order of NPR ${coupon.minOrder}`,
        400
      )
    );
  }

  let discount =
    coupon.type === "percentage"
      ? (orderTotal * coupon.value) / 100
      : coupon.value;

  if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
    discount = coupon.maxDiscount;
  }

  discount = Math.round(discount);

  res.status(200).json({
    success: true,
    coupon: {
      code:        coupon.code,
      description: coupon.description,
      type:        coupon.type,
      value:       coupon.value,
    },
    discount,
    finalTotal: Math.max(0, orderTotal - discount),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/admin/coupons
export const getCoupons = handleAsyncError(async (req, res, next) => {
  const coupons = await Coupon.find().sort("-createdAt");

  res.status(200).json({ success: true, count: coupons.length, coupons });
});

// POST /api/v1/admin/coupons
export const createCoupon = handleAsyncError(async (req, res, next) => {
  const { code, value } = req.body;

  if (!code || !value) {
    return next(new HandleError("Coupon code and discount value are required", 400));
  }

  const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (existing) {
    return next(new HandleError("A coupon with this code already exists", 400));
  }

  const coupon = await Coupon.create({
    ...req.body,
    code: code.trim().toUpperCase(),
  });

  res.status(201).json({ success: true, coupon });
});

// PUT /api/v1/admin/coupon/:id
export const updateCoupon = handleAsyncError(async (req, res, next) => {
  // Normalise code to uppercase if it's being updated
  if (req.body.code) {
    req.body.code = req.body.code.trim().toUpperCase();
  }

  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!coupon) {
    return next(new HandleError("Coupon not found", 404));
  }

  res.status(200).json({ success: true, coupon });
});

// DELETE /api/v1/admin/coupon/:id
export const deleteCoupon = handleAsyncError(async (req, res, next) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);

  if (!coupon) {
    return next(new HandleError("Coupon not found", 404));
  }

  res.status(200).json({ success: true, message: "Coupon deleted successfully" });
});
