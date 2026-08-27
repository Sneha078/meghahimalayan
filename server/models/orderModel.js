import mongoose from "mongoose";

//stores order status change history
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
  {
    _id: false,
  }
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

    // Order destination/Delivery address
    // Shipping info is stored inside the order
    // because the user may change their address in the future
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

    // Order items purchased by the customer
    // Array is used because one order may contain multiple items
    orderItems: [
      {
        // Purchased product name
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: 200,
        },

        // Quantity purchased
        // At least one product
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

        // Connect order item with Product collection
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        // server le verify gareko product ko price
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // Current Order status
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

    // Order status history
    // Keeps a record of every important order status change
    statusHistory: {
      type: [orderStatusHistorySchema],
      default: [
        {
          status: "Processing",
          changedAt: new Date(),
        },
      ],
    },

    // User information who made the order
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Payment information
    paymentInfo: {
      // Store payment ID received from payment gateway
      id: {
        type: String,
        default: null,
        trim: true,
      },

      // Payment method
      method: {
        type: String,
        enum: ["COD", "eSewa", "Khalti", "Card", "Other"],
        default: "COD",
      },

      // Payment status
      status: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending",
      },
    },

    // Date when payment was completed
    paidAt: {
      type: Date,
      default: null,
    },

    // Date when order was confirmed
    confirmedAt: {
      type: Date,
      default: null,
    },

    // Date when order was shipped
    shippedAt: {
      type: Date,
      default: null,
    },

    // Date when order was cancelled
    cancelledAt: {
      type: Date,
      default: null,
    },

    // Financial fields (Server calculated)
    // Total price before tax, shipping and discount
    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Tax amount
    taxPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Shipping cost
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Discount amount
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Coupon used for the order
    couponCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    // Final order price
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Date when order was delivered
    deliveredAt: {
      type: Date,
      default: null,
    },

    // Soft delete
    // Orders are business records and should not normally be
    // permanently deleted from the database.
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

// Query indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ isDeleted: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;