import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    // coupon code 
    code: {
      type: String,
      required: [true, "Please enter a coupon code"],
      unique: true,
      uppercase: true,
      trim: true
    },

    // coupon description
    description: {
      type: String,
      default: "",
      trim: true
    },

    // coupon type
    type: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage"
    },

    // Actual discount value stored eg:10%
    value: {
      type: Number,
      required: [true, "Please enter a discount value"],
      min: [1, "Discount value must be atleast 1"], //discount value must not be negative
    },

    //minimum order(minimum amount required in cart to use coupon)
    //default:0 means no minimum order requirement
    minOrder: {
      type: Number,
      default: 0,
      min: 0
    },

    //maximum discount
    //In %coupon how much maximum discount can be provided limit is set
    maxDiscount: {
      type: Number,
      default: null,
      min: 0
    },

    // coupon usage limit
    usageLimit: {
      type: Number,
      default: null
    },
    
    //coupon used count( track times coupon has been used)
    usedCount: {
      type: Number,
      default: 0
    },

    // coupon expiry date field
    expiresAt: {
      type: Date,
      default: null
    },

    // tracks coupon is enabled or disabled
    isActive: {
      type: Boolean,
      default: true
    },
  },
  {
      timestamps: true
  }
);
couponSchema.index({
  isActive: 1,
  expiresAt: 1
});

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;