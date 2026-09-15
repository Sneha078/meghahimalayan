import "dotenv/config";
import mongoose from "mongoose";

import Order from "../models/orderModel.js";
import connectDB from "../config/db.js";
import { awardOrderPoints } from "../services/pointsService.js";

// ============================================================
// BACKFILL REWARD POINTS
// ============================================================
//
// Finds every order that is effectively "paid" — COD orders that reached
// Delivered, or online orders (eSewa/Khalti/Bank Transfer/Card) marked
// Paid — and awards points for it via awardOrderPoints().
//
// Safe to run multiple times. awardOrderPoints() -> earnPoints() is
// idempotent: a duplicate-key error on the PointsLedger unique index means
// "already awarded", not a failure, so orders that already have a ledger
// entry are silently skipped rather than double-credited.
//
// Usage:
//   node scripts/backfillRewardPoints.js --preview   (no writes, just lists)
//   node scripts/backfillRewardPoints.js --apply     (actually awards points)
// ============================================================

async function findEligibleOrders() {
  return Order.find({
    isDeleted: false,
    $or: [
      { "paymentInfo.method": "COD", orderStatus: "Delivered" },
      { "paymentInfo.status": "Paid" }, // covers eSewa/Khalti/Bank Transfer/Card
    ],
  })
    .select("orderNumber user totalPrice pointsAwarded orderStatus paymentInfo")
    .lean();
}

async function main() {
  const isPreview = process.argv.includes("--preview");
  const isApply = process.argv.includes("--apply");

  if (!isPreview && !isApply) {
    console.log(`
Usage:
  Preview only:
    node scripts/backfillRewardPoints.js --preview

  Apply changes:
    node scripts/backfillRewardPoints.js --apply
`);
    process.exitCode = 1;
    return;
  }

  await connectDB();
  console.log("✓ MongoDB connected.\n");

  const orders = await findEligibleOrders();
  console.log(`Found ${orders.length} orders eligible for points (Delivered COD or Paid).\n`);

  if (isPreview) {
    for (const order of orders) {
      console.log(
        `  ${order.orderNumber} — Rs. ${order.totalPrice} — pointsAwarded flag: ${order.pointsAwarded ?? false}`
      );
    }
    console.log("\n✓ Preview complete. No changes made. Re-run with --apply to award points.");
    await mongoose.connection.close();
    return;
  }

  let awarded = 0;
  let skipped = 0;
  let failed = 0;

  for (const order of orders) {
    try {
      const result = await awardOrderPoints(order._id);
      if (result) {
        awarded++;
        console.log(`✓ ${order.orderNumber} — awarded ${result.amount} points`);
      } else {
        skipped++;
        console.log(`⚠ ${order.orderNumber} — already had points, skipped`);
      }
    } catch (err) {
      failed++;
      console.error(`✗ ${order.orderNumber} — failed:`, err?.message || err);
    }
  }

  console.log("\n============================================================");
  console.log(`Awarded: ${awarded}`);
  console.log(`Already had points (skipped): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log("============================================================\n");

  await mongoose.connection.close();
}

main();