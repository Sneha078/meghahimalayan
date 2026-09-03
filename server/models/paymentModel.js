//transaction ledger(Payment/ complted/ failed)
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
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
    method: {
      type: String,
      enum: ["esewa", "khalti", "bank_transfer"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    // eSewa: transaction_uuid we generate. Khalti: pidx returned by their API.
    referenceId: {
      type: String,
      required: true,
      index: true,
    },
    // Gateway's own transaction/token id, once confirmed (eSewa's transaction_code,
    // Khalti's transaction_id). Null until verified.
    gatewayTransactionId: {
      type: String,
      default: null,
    },
    // Raw verification response, kept for auditing/debugging disputes.
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);