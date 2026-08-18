import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Please enter a coupon code"],
      unique: true,
      uppercase: true,
      trim: true,
    },

    description: { type: String, default: "", trim: true },

    type: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage",
    },

    // Percentage value (e.g. 10 = 10%) or flat amount in NPR (e.g. 200)
    value: {
      type: Number,
      required: [true, "Please enter a discount value"],
      min: [1, "Discount value must be at least 1"],
    },

    // Minimum cart total required to redeem this coupon
    minOrder: { type: Number, default: 0, min: 0 },

    // Cap on how much can be discounted (useful for percentage coupons)
    maxDiscount: { type: Number, default: null, min: 0 },

    // null = unlimited
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },

    expiresAt: { type: Date, default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────
// NOTE: code already has a unique index from the schema definition above.
couponSchema.index({ isActive: 1, expiresAt: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
