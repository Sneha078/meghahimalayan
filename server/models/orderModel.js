import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// 1. ORDER STATUS HISTORY
// ─────────────────────────────────────────────────────────────────────────────

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
      required: [true, "Order status is required"],
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    note: {
      type: String,
      trim: true,
      maxlength: [500, "Status note cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    _id: false,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. ORDER ITEM SNAPSHOT
// ─────────────────────────────────────────────────────────────────────────────

const orderItemSchema = new mongoose.Schema(
  {
    // Product reference
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },

    // Product snapshot
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },

    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
      lowercase: true,
      maxlength: [100, "Product category cannot exceed 100 characters"],
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    // Quantity purchased
    quantity: {
      type: Number,
      required: [true, "Product quantity is required"],
      min: [1, "Quantity must be at least 1"],
      max: [100, "Quantity cannot exceed 100"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer",
      },
    },

    // Server-verified unit price at purchase time
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Product price cannot be negative"],
    },
  },
  {
    _id: false,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. ORDER SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const orderSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────────────────────────────────────
    // ORDER IDENTIFICATION
    // ─────────────────────────────────────────────────────────────────────────

    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      index: true,
      trim: true,
      maxlength: [50, "Order number cannot exceed 50 characters"],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // CUSTOMER
    // ─────────────────────────────────────────────────────────────────────────

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SHIPPING INFORMATION
    // Snapshot of shipping information at checkout
    // ─────────────────────────────────────────────────────────────────────────

    shippingInfo: {
      name: {
        type: String,
        required: [true, "Shipping name is required"],
        trim: true,
        maxlength: [100, "Shipping name cannot exceed 100 characters"],
      },

      address: {
        type: String,
        required: [true, "Shipping address is required"],
        trim: true,
        maxlength: [300, "Shipping address cannot exceed 300 characters"],
      },

      city: {
        type: String,
        required: [true, "Shipping city is required"],
        trim: true,
        maxlength: [100, "Shipping city cannot exceed 100 characters"],
      },

      state: {
        type: String,
        required: [true, "Shipping state is required"],
        trim: true,
        maxlength: [100, "Shipping state cannot exceed 100 characters"],
      },

      pincode: {
        type: String,
        required: [true, "Shipping pincode is required"],
        trim: true,
        maxlength: [20, "Shipping pincode cannot exceed 20 characters"],
      },

      phoneNo: {
        type: String,
        required: [true, "Shipping phone number is required"],
        trim: true,
        maxlength: [20, "Shipping phone number cannot exceed 20 characters"],
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // ORDER ITEMS
    // ─────────────────────────────────────────────────────────────────────────

    orderItems: {
      type: [orderItemSchema],

      required: [true, "Order items are required"],

      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "Order must contain at least one item",
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // ORDER STATUS
    // ─────────────────────────────────────────────────────────────────────────

    orderStatus: {
      type: String,

      enum: {
        values: [
          "Processing",
          "Confirmed",
          "Shipped",
          "Delivered",
          "Cancelled",
        ],

        message: "Invalid order status: {VALUE}",
      },

      default: "Processing",
      index: true,
    },

    // Complete order status audit trail
    statusHistory: {
      type: [orderStatusHistorySchema],

      default: () => [
        {
          status: "Processing",
          changedAt: new Date(),
          changedBy: null,
          note: "Order created",
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PAYMENT INFORMATION
    // ─────────────────────────────────────────────────────────────────────────

    paymentInfo: {
      // Payment gateway transaction/payment ID
      id: {
        type: String,
        trim: true,
        default: null,
        maxlength: [200, "Payment ID cannot exceed 200 characters"],
      },

      // Payment method
      method: {
        type: String,

        enum: {
          values: [
            "COD",
            "eSewa",
            "Khalti",
            "Card",
            "Bank Transfer",
            "Other",
          ],

          message: "Invalid payment method: {VALUE}",
        },

        default: "COD",
      },

      // IMPORTANT:
      // "Partially Refunded" is required by returnController.js
      // "Pending Verification" added for manual bank transfer review flow
      status: {
        type: String,

        enum: {
          values: [
            "Pending",
            "Pending Verification",
            "Paid",
            "Failed",
            "Partially Refunded",
            "Refunded",
          ],

          message: "Invalid payment status: {VALUE}",
        },

        default: "Pending",
      },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PAYMENT / ORDER TIMESTAMPS
    // ─────────────────────────────────────────────────────────────────────────

    paidAt: {
      type: Date,
      default: null,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    shippedAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // REFUND ACCOUNTING
    // ─────────────────────────────────────────────────────────────────────────

    // Total amount refunded against this order so far.
    // Important when an order has multiple return requests.
    refundedAmount: {
      type: Number,
      default: 0,
      min: [0, "Refunded amount cannot be negative"],
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // FINANCIAL INFORMATION
    // ─────────────────────────────────────────────────────────────────────────

    // Total price of products before discount
    itemsPrice: {
      type: Number,
      required: [true, "Items price is required"],
      default: 0,
      min: [0, "Items price cannot be negative"],
    },

    // Tax charged on order
    taxPrice: {
      type: Number,
      required: [true, "Tax price is required"],
      default: 0,
      min: [0, "Tax price cannot be negative"],
    },

    // Shipping charge
    shippingPrice: {
      type: Number,
      required: [true, "Shipping price is required"],
      default: 0,
      min: [0, "Shipping price cannot be negative"],
    },

    // Coupon / promotional discount
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },

    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [50, "Coupon code cannot exceed 50 characters"],
      default: "",
    },

    // Final amount customer paid / owes
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      default: 0,
      min: [0, "Total price cannot be negative"],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SOFT DELETE
    // ─────────────────────────────────────────────────────────────────────────

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
// 4. INDEXES
// ─────────────────────────────────────────────────────────────────────────────

// Customer order history
orderSchema.index({
  user: 1,
  createdAt: -1,
});

// Admin order listing/filtering
orderSchema.index({
  orderStatus: 1,
  createdAt: -1,
});

// Soft-delete filtering
orderSchema.index({
  isDeleted: 1,
  createdAt: -1,
});

// Admin status + date filtering
orderSchema.index({
  isDeleted: 1,
  orderStatus: 1,
  createdAt: -1,
});

// Payment status analytics
orderSchema.index({
  isDeleted: 1,
  "paymentInfo.status": 1,
  createdAt: -1,
});

// Payment method + order status analytics
orderSchema.index({
  isDeleted: 1,
  "paymentInfo.method": 1,
  orderStatus: 1,
  createdAt: -1,
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. MODEL
// ─────────────────────────────────────────────────────────────────────────────

const Order = mongoose.model("Order", orderSchema);

export default Order;