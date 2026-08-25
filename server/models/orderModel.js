import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // Customer-friendly order ID
    orderNumber: {
      type: String,
      unique: true,
      index: true, // Makes search faster in database
    },

    // Order destination
    // Shipping info is stored inside the order
    // because the user may change their address in the future
    shippingInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
        default: "Nepal",
      },
      pincode: {
        type: String,
        required: true,
      },
      phoneNo: {
        type: String,
        required: true,
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
        },

        // Quantity purchased
        // At least one product
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        image: {
          type: String,
          required: true,
        },

        // Connect order item with Product collection
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        // Server-verified unit price at the time of order
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // Order status
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
  },
  {
    timestamps: true,
  }
);
//indexes for faster database queries
orderSchema.index({ user: 1 }); //user order quickly find
orderSchema.index({ orderStatus: 1 });//status wise order filter
orderSchema.index({ createdAt: -1 }); //latest order first fetch

const Order = mongoose.model("Order", orderSchema);
export default Order;