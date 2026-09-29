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
    // Set only for review-reward entries. Reviews are subdocuments on
    // Product.reviews rather than their own top-level collection, so this
    // isn't a `ref` — just the subdocument's own (still-unique) _id, used
    // purely as an idempotency key via the index below.
    review: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // Set only on the clawback entry created when a Return's refund is
    // processed. Points that off, so awardOrderPoints/refund of one item
    // on a multi-item order don't touch the whole order — see
    // clawbackOrderPoints() in pointsService.js. Not a `ref` — Return
    // documents live in their own collection, but this is purely an
    // idempotency key here, not a populate target.
    returnRequest: {
      type: mongoose.Schema.Types.ObjectId,
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

// Same idea, for review-reward entries: at most one "earn" per review,
// ever — this is what makes awardReviewPoints() in pointsService.js safe
// to call even if something retries it.
pointsLedgerSchema.index(
  { review: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "earn", review: { $ne: null } },
  }
);

// Mirror index for the clawback side: at most one "redeem" entry per
// review too, so clawbackReviewPoints() in pointsService.js is safe to
// call more than once for the same review without double-reversing it.
pointsLedgerSchema.index(
  { review: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "redeem", review: { $ne: null } },
  }
);

// Same idea again: at most one points-clawback per Return document, so a
// refund that's somehow processed twice (or retried) never claws back
// twice for the same return.
pointsLedgerSchema.index(
  { returnRequest: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "redeem", returnRequest: { $ne: null } },
  }
);

export default mongoose.model("PointsLedger", pointsLedgerSchema);