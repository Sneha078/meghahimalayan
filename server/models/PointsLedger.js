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

// ─────────────────────────────────────────────────────────────────────────
// IDEMPOTENCY GUARD
// ─────────────────────────────────────────────────────────────────────────
//
// Ensures at most one "earn" entry can ever exist per order, enforced by
// MongoDB itself rather than application-level flags/locks. This is what
// makes earnPoints()/awardOrderPoints() in pointsService.js safe to call
// more than once for the same order — a second attempt will hit a
// duplicate-key error (code 11000) instead of creating a second entry.
//
// partialFilterExpression scopes the uniqueness constraint to type: "earn"
// only, so "redeem" and "expire" entries (which don't carry a meaningful
// unique order relationship) are unaffected.
pointsLedgerSchema.index(
  { order: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "earn", order: { $ne: null } },
  }
);

export default mongoose.model("PointsLedger", pointsLedgerSchema);