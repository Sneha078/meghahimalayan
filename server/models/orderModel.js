import mongoose from "mongoose";

// Stores order status change history
const orderStatusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "Processing",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Server-verified price at the time of purchase
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Customer-friendly order ID
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // Snapshot of delivery information
    shippingInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      address: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300,
      },

      city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      state: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      pincode: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20,
      },

      phoneNo: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20,
      },
    },

    // Snapshot of purchased products
    orderItems: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },

    // Current order status
    orderStatus: {
      type: String,
      enum: [
        "Processing",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Processing",
      index: true,
    },

    // Complete order status history
    statusHistory: {
      type: [orderStatusHistorySchema],
      default: () => [
        {
          status: "Processing",
          changedAt: new Date(),
        },
      ],
    },

    // Customer who placed the order
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Payment information
    paymentInfo: {
      id: {
        type: String,
        default: null,
        trim: true,
      },

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

    // Payment completion date
    paidAt: {
      type: Date,
      default: null,
    },

    // Order confirmation date
    confirmedAt: {
      type: Date,
      default: null,
    },

    // Shipping date
    shippedAt: {
      type: Date,
      default: null,
    },

    // Cancellation date
    cancelledAt: {
      type: Date,
      default: null,
    },

    // Delivery date
    deliveredAt: {
      type: Date,
      default: null,
    },

    // Refund date
    refundedAt: {
      type: Date,
      default: null,
    },

    // Financial fields calculated by server
    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    taxPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    couponCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
      maxlength: 50,
    },

    totalPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ isDeleted: 1, createdAt: -1 });
orderSchema.index({
  isDeleted: 1,
  orderStatus: 1,
  createdAt: -1,
});
orderSchema.index({
  isDeleted: 1,
  "paymentInfo.status": 1,
  createdAt: -1,
});
orderSchema.index({
  isDeleted: 1,
  "paymentInfo.method": 1,
  orderStatus: 1,
  createdAt: -1,
});

const Order = mongoose.model("Order", orderSchema);

export default Order;