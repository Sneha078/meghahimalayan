import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // Human-readable order reference shown to customers  e.g. "MH-831924"
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },

    // ── Shipping destination ───────────────────────────────────────────────
    shippingInfo: {
      name: { type: String, required: true, trim: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true, default: "Nepal" },
      pinCode: { type: String, required: true },
      phoneNo: { type: String, required: true },
    },

    // ── Items snapshot ─────────────────────────────────────────────────────
    // Prices are snapshotted at order creation so future product price
    // changes do not affect historical orders.
    orderItems: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        // Server-verified unit price at time of order
        price: { type: Number, required: true, min: 0 },
      },
    ],

    // ── Status ────────────────────────────────────────────────────────────
    orderStatus: {
      type: String,
      enum: ["Processing", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Processing",
    },

    // ── Owner ─────────────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Payment ───────────────────────────────────────────────────────────
    paymentInfo: {
      id: { type: String, default: "" },
      method: {
        type: String,
        enum: ["COD", "eSewa", "Khalti", "Card", "Other"],
        default: "COD",
      },
      status: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending",
      },
    },

    paidAt: { type: Date, default: null },

    // ── Financials (all server-calculated) ────────────────────────────────
    itemsPrice: { type: Number, required: true, default: 0, min: 0 },
    taxPrice: { type: Number, required: true, default: 0, min: 0 },
    shippingPrice: { type: Number, required: true, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: "" },
    totalPrice: { type: Number, required: true, default: 0, min: 0 },

    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────
orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
