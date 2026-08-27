import Coupon from "../models/couponModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

// HELPERS functions
//coupon code into standard format
const normalizeCouponCode = (code) => {
  if (typeof code !== "string") return null;
  const normalized = code.trim().toUpperCase();
  return normalized || null;
};

//Discount rules checking
const validateDiscountFields = ({
  type,
  value,
  maxDiscount,
}) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "Discount value must be greater than 0";
  }
  if (type === "percentage" && numericValue > 100) {
    return "Percentage discount cannot exceed 100%";
  }
  if (
    maxDiscount !== null &&
    maxDiscount !== undefined
  ) {
    const numericMaxDiscount = Number(maxDiscount);
    if (
      !Number.isFinite(numericMaxDiscount) ||
      numericMaxDiscount < 0
    ) {
      return "Maximum discount must be a valid positive amount";
    }
  }
  return null;
};

// Discount calculation according to coupon type
const calculateDiscount = (coupon, subtotal) => {
  let discount;
  if (coupon.type === "percentage") {
    discount = (subtotal * coupon.value) / 100;

    if (
      coupon.maxDiscount !== null &&
      discount > coupon.maxDiscount
    ) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.value;
  }
  // Discount can never exceed the order subtotal
  discount = Math.min(discount, subtotal);

  // NPR should be stored as whole rupees
  return Math.round(discount);
};

// CUSTOMER
// POST /api/v1/coupon/validate
// Used during checkout to preview a coupon.
// IMPORTANT:
// - Does NOT increment usedCount.
// - Does NOT create an order.
// - Actual subtotal must be recalculated again during order creation.
export const validateCoupon = handleAsyncError(
  async (req, res, next) => {
    const { code, subtotal } = req.body;
    // Validate coupon code
    const normalizedCode = normalizeCouponCode(code);
    if (!normalizedCode) {
      return next(
        new HandleError(
          "Please enter a valid coupon code",
          400
        )
      );
    }
    // Validate subtotal
    const orderTotal = Number(subtotal);
    if (
      !Number.isFinite(orderTotal) ||
      orderTotal < 0
    ) {
      return next(
        new HandleError(
          "Invalid order subtotal",
          400
        )
      );
    }
    // Find active coupon
    const coupon = await Coupon.findOne({
      code: normalizedCode,
      isActive: true,
    });
    if (!coupon) {
      return next(
        new HandleError(
          "Invalid or inactive coupon code",
          400
        )
      );
    }
    // Check expiry
    if (
      coupon.expiresAt &&
      coupon.expiresAt <= new Date()
    ) {
      return next(
        new HandleError("This coupon has expired",400));
    }

    // Check global usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return next(
        new HandleError("This coupon has reached its usage limit",400));
    }

    // Check minimum order
    if (orderTotal < coupon.minOrder) {
      return next(
        new HandleError(
          `This coupon requires a minimum order of NPR ${coupon.minOrder}`,
          400
        )
      );
    }

    // Calculate discount
    const discount = calculateDiscount(
      coupon,
      orderTotal
    );
    const finalTotal = Math.max(
      0,
      orderTotal - discount
    );
    res.status(200).json({
      success: true,

      coupon: {
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        minOrder: coupon.minOrder,
        maxDiscount: coupon.maxDiscount,
      },
      discount,
      finalTotal,
    });
  }
);

// ADMIN — GET ALL COUPONS
// GET /api/v1/admin/coupons
export const getCoupons = handleAsyncError(
  async (req, res, next) => {
    const coupons = await Coupon.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  }
);

// ADMIN — CREATE COUPON
// POST /api/v1/admin/coupons
export const createCoupon = handleAsyncError(
  async (req, res, next) => {
    const {
      code,
      description,
      type = "percentage",
      value,
      minOrder = 0,
      maxDiscount = null,
      usageLimit = null,
      expiresAt = null,
      isActive = true,
    } = req.body;

    // Normalize code
    const normalizedCode =
      normalizeCouponCode(code);
    if (!normalizedCode) {
      return next(
        new HandleError("Coupon code is required",400));
    }

    // Validate coupon type
    if (!["percentage", "flat"].includes(type)) {
      return next(
        new HandleError("Coupon type must be percentage or flat",400));
    }

    // Validate discount
    const discountError =
      validateDiscountFields({
        type,
        value,
        maxDiscount,
      });

    if (discountError) {
      return next(
        new HandleError(
          discountError,
          400
        )
      );
    }

    // Validate minimum order
    const numericMinOrder = Number(minOrder);
    if (
      !Number.isFinite(numericMinOrder) ||
      numericMinOrder < 0
    ) {
      return next(
        new HandleError(
          "Minimum order must be 0 or greater",
          400
        )
      );
    }

    // Validate usage limit
    let numericUsageLimit = null;
    if (
      usageLimit !== null &&
      usageLimit !== undefined
    ) {
      numericUsageLimit = Number(usageLimit);
      if (
        !Number.isInteger(numericUsageLimit) ||
        numericUsageLimit < 1
      ) {
        return next(
          new HandleError(
            "Usage limit must be a positive whole number",
            400
          )
        );
      }
    }

    // Validate expiry
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      if (
        Number.isNaN(expiryDate.getTime()) ||
        expiryDate <= new Date()
      ) {
        return next(
          new HandleError(
            "Coupon expiry date must be in the future",
            400
          )
        );
      }
    }

    // Check duplicate coupon
    const existingCoupon = await Coupon.findOne({
      code: normalizedCode,
    });
    if (existingCoupon) {
      return next(
        new HandleError(
          "A coupon with this code already exists",
          400
        )
      );
    }
    // maxDiscount is only meaningful for percentage coupons
    const finalMaxDiscount =
      type === "percentage"
        ? Number(maxDiscount)
        : null;

    // Create coupon
    const coupon = await Coupon.create({
      code: normalizedCode,
      description:
        typeof description === "string"
          ? description.trim()
          : "",

      type,
      value: Number(value),
      minOrder: numericMinOrder,
      maxDiscount: finalMaxDiscount,
      usageLimit: numericUsageLimit,
      usedCount: 0,
      expiresAt: expiresAt
        ? new Date(expiresAt)
        : null,
      isActive: Boolean(isActive),
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  }
);

// ADMIN — UPDATE EXISTING COUPON
// PUT /api/v1/admin/coupon/:id
export const updateCoupon = handleAsyncError(
  async (req, res, next) => {
    const coupon = await Coupon.findById(
      req.params.id
    );

    if (!coupon) {
      return next(
        new HandleError(
          "Coupon not found",
          404
        )
      );
    }
    // Only these fields can be updated.
    // usedCount is intentionally NOT included.
    const allowedFields = [
      "code",
      "description",
      "type",
      "value",
      "minOrder",
      "maxDiscount",
      "usageLimit",
      "expiresAt",
      "isActive",
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] =
          req.body[field];
      }
    }

    // Normalize code
    if (updateData.code !== undefined) {
      const normalizedCode =
        normalizeCouponCode(
          updateData.code
        );

      if (!normalizedCode) {
        return next(
          new HandleError(
            "Coupon code cannot be empty",
            400
          )
        );
      }

      const duplicateCoupon =
        await Coupon.findOne({
          code: normalizedCode,
          _id: { $ne: coupon._id },
        });

      if (duplicateCoupon) {
        return next(
          new HandleError(
            "A coupon with this code already exists",
            400
          )
        );
      }

      updateData.code =
        normalizedCode;
    }

    // Determine final values after update
    const finalType =
      updateData.type ?? coupon.type;

    const finalValue =
      updateData.value !== undefined
        ? Number(updateData.value)
        : coupon.value;

    const finalMaxDiscount =
      updateData.maxDiscount !== undefined
        ? updateData.maxDiscount
        : coupon.maxDiscount;

    // Validate type
    if (!["percentage", "flat"].includes(finalType)) {
      return next(
        new HandleError(
          "Coupon type must be percentage or flat",
          400
        )
      );
    }

    // Validate discount
    const discountError =
      validateDiscountFields({
        type: finalType,
        value: finalValue,
        maxDiscount:
          finalMaxDiscount,
      });

    if (discountError) {
      return next(
        new HandleError(
          discountError,
          400
        )
      );
    }

    // Validate minimum order
    if (updateData.minOrder !== undefined) {
      const numericMinOrder =
        Number(updateData.minOrder);

      if (
        !Number.isFinite(
          numericMinOrder
        ) ||
        numericMinOrder < 0
      ) {
        return next(
          new HandleError(
            "Minimum order must be 0 or greater",
            400
          )
        );
      }

      updateData.minOrder =
        numericMinOrder;
    }

    // Validate usage limit
    if (
      updateData.usageLimit !== undefined
    ) {
      if (
        updateData.usageLimit !== null
      ) {
        const numericUsageLimit =
          Number(
            updateData.usageLimit
          );

        if (
          !Number.isInteger(
            numericUsageLimit
          ) ||
          numericUsageLimit < 1
        ) {
          return next(
            new HandleError(
              "Usage limit must be a positive whole number",
              400
            )
          );
        }

        // Cannot reduce limit below already-used count
        if (
          numericUsageLimit <
          coupon.usedCount
        ) {
          return next(
            new HandleError(
              `Usage limit cannot be less than current used count (${coupon.usedCount})`,
              400
            )
          );
        }

        updateData.usageLimit =
          numericUsageLimit;
      }
    }

    // Validate expiry
    if (
      updateData.expiresAt !== undefined
    ) {
      if (updateData.expiresAt === null) {
        // null means no expiry
      } else {
        const expiryDate =
          new Date(
            updateData.expiresAt
          );

        if (
          Number.isNaN(
            expiryDate.getTime()
          ) ||
          expiryDate <= new Date()
        ) {
          return next(
            new HandleError(
              "Coupon expiry date must be in the future",
              400
            )
          );
        }

        updateData.expiresAt =
          expiryDate;
      }
    }

    // Flat coupon cannot have maxDiscount
    if (finalType === "flat") {
      updateData.maxDiscount = null;
    }

    // Apply changes
    Object.assign(
      coupon,
      updateData
    );

    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  }
);

// ADMIN — DELETE COUPON
// DELETE /api/v1/admin/coupon/:id
export const deleteCoupon = handleAsyncError(
  async (req, res, next) => {
    const coupon =
      await Coupon.findByIdAndDelete(
        req.params.id
      );

    if (!coupon) {
      return next(
        new HandleError(
          "Coupon not found",
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      message:
        "Coupon deleted successfully",
    });
  }
);