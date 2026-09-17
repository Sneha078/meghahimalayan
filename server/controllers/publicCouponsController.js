import Coupon from "../models/couponModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

// PUBLIC — GET ACTIVE PUBLIC COUPONS
// GET /api/v1/coupons/public
// No auth required — returns coupons flagged isPublic:true that are
// currently active and not expired. Only fields relevant to a shopper
// deciding whether to use a code are returned (usedCount/__v/etc. stay
// out of the public response).
export const getPublicCoupons = handleAsyncError(async (req, res, next) => {
  const now = new Date();

  const coupons = await Coupon.find({
    isPublic: true,
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }],
  })
    .select("code description type value minOrder maxDiscount expiresAt")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    coupons,
  });
});