import mongoose from "mongoose";

const pointsLedgerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["earn", "redeem", "expire"],
      required: true,
    },
    amount: {
      // positive for earn, negative for redeem/expire
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: "",
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    // Only set on 'earn' entries — when this specific batch expires
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    // Marks an 'earn' entry as already expired so the sweep doesn't repeat it
    settled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

pointsLedgerSchema.index({ user: 1, type: 1, settled: 1 });

export default mongoose.model("PointsLedger", pointsLedgerSchema);