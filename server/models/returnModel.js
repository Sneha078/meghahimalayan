import mongoose from "mongoose";
import crypto from "crypto"; //secure random value generate

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const RETURN_REASONS = [
  "Damaged Item",
  "Wrong Item Received",
  "Quality Issue",
  "Not As Described",
  "Changed Mind",
  "Missing Parts/Accessories",
  "Other",
];

export const RETURN_STATUSES = [
  "Pending",
  "Approved",
  "Rejected",
  "Cancelled",
  "Item Received",
  "Completed",
  "Expired",
];

export const REFUND_STATUSES = [
  "Not Applicable",
  "Pending",
  "Processing",
  "Succeeded",
  "Failed",
  "Partially Refunded",
  "Cancelled",
];

export const REFUND_METHODS = [
  "Original Payment Method",
  "eSewa/Khalti",
  "Bank Transfer",
  "Store Credit",
];

export const ITEM_CONDITIONS = [
  "Unopened",
  "Opened/Good",
  "Damaged/Defective",
  "Missing Parts",
  "Not Evaluated",
];

// ─────────────────────────────────────────────────────────────────────────────
// 1. RETURN ITEM SUB-SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const returnItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 200,
    },

    image: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    quantity: {
      type: Number,
      required: [true, "Return quantity is required"],
      min: [1, "Return quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Return quantity must be a whole number",
      },
    },

    itemPrice: {
      type: Number,
      required: [true, "Item price is required"],
      min: [0, "Item price cannot be negative"],
    },

    refundUnitPrice: {
      type: Number,
      required: [true, "Refund unit price is required"],
      min: [0, "Refund unit price cannot be negative"],
    },

    reason: {
      type: String,
      enum: {
        values: RETURN_REASONS,
        message: "Invalid return reason",
      },
      required: [true, "Return reason is required"],
      trim: true,
    },

    itemCondition: {
      type: String,
      enum: {
        values: ITEM_CONDITIONS,
        message: "Invalid item condition",
      },
      default: "Not Evaluated",
    },

    restockable: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. RETURN STATUS HISTORY
// ─────────────────────────────────────────────────────────────────────────────

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: {
        values: RETURN_STATUSES,
        message: "Invalid return status",
      },
      required: true,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    _id: false,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. REFUND HISTORY
// ─────────────────────────────────────────────────────────────────────────────

const refundHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: {
        values: REFUND_STATUSES,
        message: "Invalid refund status",
      },
      required: true,
    },

    amount: {
      type: Number,
      min: [0, "Refund amount cannot be negative"],
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    _id: false,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. REFUND DETAILS SUB-SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const refundDetailsSchema = new mongoose.Schema(
  {
    accountHolderName: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    accountNumber: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    bankName: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    walletProvider: {
      type: String,
      enum: ["eSewa", "Khalti"],
    },

    walletId: {
      type: String,
      trim: true,
      maxlength: 150,
    },
  },
  {
    _id: false,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. REFUND TRANSACTION SUB-SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const refundTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    providerTransactionId: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    idempotencyKey: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    provider: {
      type: String,
      enum: [
        "eSewa",
        "Khalti",
        "Card",
        "Bank",
        "Store Credit",
        "Manual",
        "Other",
      ],
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Succeeded",
        "Failed",
        "Cancelled",
        "Partially Refunded",
      ],
      default: "Pending",
    },

    amount: {
      type: Number,
      min: [0, "Transaction amount cannot be negative"],
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "NPR",
      maxlength: 10,
    },

    requestedAt: {
      type: Date,
    },

    processedAt: {
      type: Date,
    },

    failureReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    receiptUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    _id: false,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. RETURN SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const returnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      unique: true,
      index: true,
      immutable: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order ID is required"],
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    items: {
      type: [returnItemSchema],
      required: [true, "Return items are required"],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "At least one return item is required",
      },
    },

    reason: {
      type: String,
      enum: {
        values: RETURN_REASONS,
        message: "Invalid return reason",
      },
      required: [true, "Return reason is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    images: [
      {
        public_id: {
          type: String,
          trim: true,
          maxlength: 300,
        },

        url: {
          type: String,
          required: true,
          trim: true,
          maxlength: 1000,
        },
      },
    ],

    status: {
      type: String,
      enum: {
        values: RETURN_STATUSES,
        message: "Invalid return status",
      },
      default: "Pending",
      index: true,
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    returnEligibilityDeadline: {
      type: Date,
      index: true,
    },

    returnShippingDeadline: {
      type: Date,
    },

    approvedAt: {
      type: Date,
    },

    rejectedAt: {
      type: Date,
    },

    cancelledAt: {
      type: Date,
    },

    receivedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // REFUND
    // ─────────────────────────────────────────────────────────────────────────

    refund: {
      requestedAmount: {
        type: Number,
        required: [true, "Requested refund amount is required"],
        min: [0, "Requested refund amount cannot be negative"],
      },

      approvedAmount: {
        type: Number,
        default: 0,
        min: [0, "Refund amount cannot be negative"],
      },

      currency: {
        type: String,
        trim: true,
        uppercase: true,
        default: "NPR",
        maxlength: 10,
      },

      method: {
        type: String,
        enum: {
          values: REFUND_METHODS,
          message: "Invalid refund method",
        },
      },

      details: {
        type: refundDetailsSchema,
        default: () => ({}),
      },
    },

    refundStatus: {
      type: String,
      enum: {
        values: REFUND_STATUSES,
        message: "Invalid refund status",
      },
      default: "Pending",
      index: true,
    },

    refundHistory: {
      type: [refundHistorySchema],
      default: [],
    },

    refundTransaction: {
      type: refundTransactionSchema,
    },

    refundedAt: {
      type: Date,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // INVENTORY
    // ─────────────────────────────────────────────────────────────────────────

    stockRestored: {
      type: Boolean,
      default: false,
      index: true,
    },

    stockRestoredAt: {
      type: Date,
    },

    stockRestoredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN / HANDLING
    // ─────────────────────────────────────────────────────────────────────────

    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    adminRemarks: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. RETURN NUMBER GENERATION
// ─────────────────────────────────────────────────────────────────────────────

returnSchema.pre("validate", function (next) {
  if (!this.returnNumber) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    const random = crypto
      .randomBytes(6)
      .toString("hex")
      .toUpperCase();

    this.returnNumber = `RET-${date}-${random}`;
  }

  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. INSTANCE METHODS
// ─────────────────────────────────────────────────────────────────────────────

returnSchema.methods.addStatusHistory = function (
  status,
  changedBy = null,
  note = ""
) {
  this.statusHistory.push({
    status,
    changedBy,
    changedAt: new Date(),
    note,
  });
};

returnSchema.methods.addRefundHistory = function (
  status,
  amount = 0,
  changedBy = null,
  note = ""
) {
  this.refundHistory.push({
    status,
    amount,
    changedBy,
    changedAt: new Date(),
    note,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. INDEXES
// ─────────────────────────────────────────────────────────────────────────────

returnSchema.index({
  user: 1,
  createdAt: -1,
});

returnSchema.index({
  order: 1,
  status: 1,
});

returnSchema.index({
  status: 1,
  createdAt: -1,
});

returnSchema.index({
  refundStatus: 1,
  createdAt: -1,
});

returnSchema.index({
  status: 1,
  returnShippingDeadline: 1,
});

returnSchema.index({
  isDeleted: 1,
  createdAt: -1,
});

returnSchema.index(
  { order: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      status: {
        $in: ["Pending", "Approved", "Item Received"],
      },
    },
    name: "one_active_return_per_order",
  }
);

returnSchema.index(
  { "refundTransaction.transactionId": 1 },
  {
    unique: true,
    sparse: true,
    name: "unique_refund_transaction_id",
  }
);

returnSchema.index(
  { "refundTransaction.providerTransactionId": 1 },
  {
    unique: true,
    sparse: true,
    name: "unique_refund_provider_transaction_id",
  }
);

returnSchema.index(
  { "refundTransaction.idempotencyKey": 1 },
  {
    unique: true,
    sparse: true,
    name: "unique_refund_idempotency_key",
  }
);

const Return = mongoose.model("Return", returnSchema);

export default Return;