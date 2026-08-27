import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    // Coupon code
    code: {
      type: String,
      required: [true, "Please enter a coupon code"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, "Coupon code must be at least 3 characters"],
      maxlength: [30, "Coupon code cannot exceed 30 characters"],
      match: [
        /^[A-Z0-9_-]+$/,
        "Coupon code can contain only letters, numbers, hyphens and underscores",
      ],
    },

    // Coupon description
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },

    // Discount type
    type: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage",
    },

    // Discount value
    // percentage => 10 means 10%
    // flat => 500 means NPR 500
    value: {
      type: Number,
      required: [true, "Please enter a discount value"],
      min: [1, "Discount value must be at least 1"],

      validate: {
        validator: function (value) {
          if (this.type === "percentage") {
            return value <= 100;
          }

          return value > 0;
        },
        message: "Percentage discount cannot exceed 100%",
      },
    },

    // Minimum order amount required
    minOrder: {
      type: Number,
      default: 0,
      min: [0, "Minimum order cannot be negative"],
    },

    // Maximum discount allowed
    // Mainly useful for percentage coupons
    maxDiscount: {
      type: Number,
      default: null,
      min: [0, "Maximum discount cannot be negative"],
    },

    // Maximum number of times coupon can be used
    // null = unlimited
    usageLimit: {
      type: Number,
      default: null,
      min: [1, "Usage limit must be at least 1"],
    },

    // Number of successful orders using this coupon
    usedCount: {
      type: Number,
      default: 0,
      min: [0, "Used count cannot be negative"],
    },

    // Optional expiry date
    expiresAt: {
      type: Date,
      default: null,
    },

    // Enable / disable coupon
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Useful for finding active/non-expired coupons
couponSchema.index({
  isActive: 1,
  expiresAt: 1,
});

// Business validation before saving
couponSchema.pre("validate", function (next) {
  // Percentage coupon
  if (this.type === "percentage" && this.value > 100) {
    return next(new Error("Percentage discount cannot exceed 100%"));
  }

  // maxDiscount should normally only be used with percentage coupons
  if (this.type === "flat") {
    this.maxDiscount = null;
  }

  // Usage limit cannot be lower than already-used count
  if (
    this.usageLimit !== null &&
    this.usageLimit < this.usedCount
  ) {
    return next(
      new Error("Usage limit cannot be lower than used count")
    );
  }

  // Expiry date cannot be in the past when creating a coupon
  if (
    this.isNew &&
    this.expiresAt &&
    this.expiresAt <= new Date()
  ) {
    return next(new Error("Coupon expiry date must be in the future"));
  }

  next();
});

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;