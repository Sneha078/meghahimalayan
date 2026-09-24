#!/usr/bin/env javascript
/**
 * Backfill reward points for existing reviews
 * 
 * Usage:
 *   node scripts/backfillReviewPoints.js --preview   (no writes, just lists)
 *   node scripts/backfillReviewPoints.js --apply     (actually awards points)
 */

import "dotenv/config";
import mongoose from "mongoose";
import Product from "../models/productModel.js";
import PointsLedger from "../models/PointsLedger.js";
import connectDB from "../config/db.js";
import { awardReviewPoints } from "../services/pointsService.js";

async function main() {
  const isPreview = process.argv.includes("--preview");
  const isApply = process.argv.includes("--apply");

  if (!isPreview && !isApply) {
    console.log(`
Usage:
  Preview only:
    node scripts/backfillReviewPoints.js --preview

  Apply changes:
    node scripts/backfillReviewPoints.js --apply
`);
    process.exitCode = 1;
    return;
  }

  await connectDB();
  console.log("✓ MongoDB connected.\n");

  // Find all products with reviews
  const productsWithReviews = await Product.find({ 
    "reviews.0": { $exists: true } 
  }).select("reviews").lean();

  let totalReviews = 0;
  let eligibleReviews = [];

  console.log("Finding reviews without points...\n");

  for (const product of productsWithReviews) {
    for (const review of product.reviews) {
      totalReviews++;
      
      // Check if this review already has points awarded
      const existingPoints = await PointsLedger.findOne({
        review: review._id,
        type: "earn"
      }).lean();

      if (!existingPoints) {
        const hasMedia = (review.images && review.images.length > 0) || 
                        (review.videos && review.videos.length > 0);
        
        eligibleReviews.push({
          reviewId: review._id,
          userId: review.user,
          reviewerName: review.name,
          hasMedia,
          mediaCount: (review.images?.length || 0) + (review.videos?.length || 0)
        });
      }
    }
  }

  console.log(`Found ${totalReviews} total reviews`);
  console.log(`Found ${eligibleReviews.length} reviews without points\n`);

  if (isPreview) {
    for (const review of eligibleReviews) {
      const points = 5 + (review.hasMedia ? 10 : 0);
      console.log(`  Review by ${review.reviewerName} — ${points} points (${review.hasMedia ? 'with' : 'no'} media, ${review.mediaCount} files)`);
    }
    console.log(`\n✓ Preview complete. No changes made. Re-run with --apply to award ${eligibleReviews.length} review points.`);
    await mongoose.connection.close();
    return;
  }

  console.log("Awarding points for reviews...\n");

  let awarded = 0;
  let failed = 0;

  for (const review of eligibleReviews) {
    try {
      const result = await awardReviewPoints(review.userId, review.reviewId, review.hasMedia);
      if (result) {
        awarded++;
        console.log(`✓ ${review.reviewerName} — awarded ${result.amount} points (${review.hasMedia ? 'with' : 'no'} media)`);
      } else {
        console.log(`⚠ ${review.reviewerName} — already had points, skipped`);
      }
    } catch (err) {
      failed++;
      console.error(`✗ ${review.reviewerName} — failed:`, err?.message || err);
    }
  }

  console.log("\n============================================================");
  console.log(`Awarded: ${awarded}`);
  console.log(`Failed: ${failed}`);
  console.log("============================================================\n");

  await mongoose.connection.close();
}

main().catch(console.error);