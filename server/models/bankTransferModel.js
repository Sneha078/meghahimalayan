//manual UTR + screenshhot submissions
import mongoose from "mongoose";

const bankTransferSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    referenceNumber: {
      // UTR / transaction reference the customer typed in from their bank app
      type: String,
      required: true,
    },
    screenshotUrl: {
      // Cloudinary URL — you already have config/cloudinary.js wired up
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending_review", "approved", "rejected"],
      default: "pending_review",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("BankTransfer", bankTransferSchema);