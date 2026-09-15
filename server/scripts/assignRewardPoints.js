import "dotenv/config";
import mongoose from "mongoose";
import readline from "readline";

import Product from "../models/productModel.js";
import connectDB from "../config/db.js";
import { POINTS_PER_RUPEE, POINTS_TO_RUPEE_RATE } from "../services/pointsService.js";

// ============================================================
// CONFIGURATION
// ============================================================

const PRODUCTS_PER_CATEGORY = 4;

const CATEGORIES = [
  "eyeglasses",
  "watches",
  "perfumes",
];

// ------------------------------------------------------------
// REWARD ECONOMICS
// ------------------------------------------------------------
//
// IMPORTANT: pointsCost is derived from POINTS_PER_RUPEE (the
// EARN rate — 1 point per Rs. 100 spent), NOT from
// POINTS_TO_RUPEE_RATE (the checkout-discount CONVERSION rate).
//
// These two rates are not calibrated against each other in this
// system — POINTS_TO_RUPEE_RATE implies a ~0.1% cashback rate,
// so deriving catalog prices from it (even with a "loyalty
// discount" applied) requires several HUNDRED times a product's
// own price in prior spend to earn. That doesn't make redemption
// harder — it makes it permanently unreachable, for every product,
// at every price point.
//
// Instead, REDEMPTION_SPEND_MULTIPLIER answers a directly useful
// question: "how many times a product's price should a customer
// have to have spent, cumulatively, before they can redeem it for
// free?" That's the actual lever for "can't give out expensive
// products too cheap" — tune this number up or down as needed.
//
// Example at the default value of 8, for a Rs. 5,000 product:
//
//   pointsCost = ceil(5,000 × 8 × 0.01) = 400 points
//
// Earning 400 points requires spending 400 / 0.01 = Rs. 40,000 —
// 8× the item's own price. That's a real, reachable loyalty goal.
// ------------------------------------------------------------

const REDEMPTION_SPEND_MULTIPLIER = 8;

// Never allow a reward to cost less than this.
const MIN_REWARD_POINTS = 200;

// ============================================================
// PRICE GROUPS
// ============================================================
//
// These are NOT point-cost bands — they're only used to divide
// each category's inventory into four price groups so the
// catalog features a spread (entry-level through exclusive)
// instead of clustering at one end. The actual pointsCost is
// calculated from product.price via the formula above.
// ============================================================

const PRICE_GROUPS = [
  { key: "entry" },
  { key: "popular" },
  { key: "premium" },
  { key: "exclusive" },
];

const PRODUCTS_PER_GROUP = PRODUCTS_PER_CATEGORY;

const TOTAL_PRODUCTS_PER_CATEGORY =
  PRICE_GROUPS.length * PRODUCTS_PER_CATEGORY;

// ============================================================
// POINT CALCULATION
// ============================================================

function calculateRewardPoints(price) {
  const numericPrice = Number(price) || 0;

  if (numericPrice <= 0) {
    return 0;
  }

  const points = Math.ceil(
    numericPrice * REDEMPTION_SPEND_MULTIPLIER * POINTS_PER_RUPEE
  );

  return Math.max(MIN_REWARD_POINTS, points);
}

// ============================================================
// QUALITY SCORE
// ============================================================
//
// Price determines WHICH price group a product belongs to.
// Rating / bestseller / featured / new arrival determine WHICH
// products are preferred INSIDE that price group. A cheap
// bestseller can beat another cheap product, but it can NEVER
// jump into a higher-priced reward group.
//

function getQualityScore(product) {
  const rating = Number(product.ratings) || 0;
  const bestseller = product.isBestSeller ? 1 : 0;
  const featured = product.isFeatured ? 1 : 0;
  const newArrival = product.isNewArrival ? 1 : 0;

  return rating * 10 + bestseller * 5 + featured * 2 + newArrival * 1;
}

// ============================================================
// POINT UNIQUENESS / ORDERING
// ============================================================

function createIncreasingPointCosts(products) {
  const sorted = [...products].sort((a, b) => {
    const priceA = Number(a.price) || 0;
    const priceB = Number(b.price) || 0;
    if (priceA !== priceB) return priceA - priceB;
    return a._id.toString().localeCompare(b._id.toString());
  });

  let previousPoints = 0;

  return sorted.map((product) => {
    let pointsCost = calculateRewardPoints(product.price);

    if (pointsCost <= previousPoints) {
      pointsCost = previousPoints + 1;
    }

    previousPoints = pointsCost;

    return { ...product, pointsCost };
  });
}

// ============================================================
// SELECT PRODUCTS
// ============================================================

async function selectRewardProducts() {
  const selected = [];

  for (const category of CATEGORIES) {
    console.log("\n========================================");
    console.log(`CATEGORY: ${category.toUpperCase()}`);
    console.log("========================================");

    const candidates = await Product.find({
      category,
      stock: { $gt: 0 },
    })
      .select(
        "_id name category price pointsCost image ratings isBestSeller isFeatured isNewArrival stock isOutOfStock"
      )
      .lean();

    console.log(`Eligible products: ${candidates.length}`);

    if (candidates.length < TOTAL_PRODUCTS_PER_CATEGORY) {
      throw new Error(
        `Not enough ${category} products. Need ${TOTAL_PRODUCTS_PER_CATEGORY}, found ${candidates.length}.`
      );
    }

    candidates.sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      if (priceA !== priceB) return priceA - priceB;
      const qualityA = getQualityScore(a);
      const qualityB = getQualityScore(b);
      if (qualityB !== qualityA) return qualityB - qualityA;
      return a._id.toString().localeCompare(b._id.toString());
    });

    const totalCandidates = candidates.length;
    const baseGroupSize = Math.floor(totalCandidates / PRICE_GROUPS.length);
    const priceGroups = [];

    for (let groupIndex = 0; groupIndex < PRICE_GROUPS.length; groupIndex++) {
      const start = groupIndex * baseGroupSize;
      const end =
        groupIndex === PRICE_GROUPS.length - 1
          ? totalCandidates
          : (groupIndex + 1) * baseGroupSize;
      priceGroups.push(candidates.slice(start, end));
    }

    for (let groupIndex = 0; groupIndex < PRICE_GROUPS.length; groupIndex++) {
      const groupConfig = PRICE_GROUPS[groupIndex];
      const group = priceGroups[groupIndex];

      if (group.length < PRODUCTS_PER_GROUP) {
        throw new Error(`Not enough products in price group ${groupConfig.key} for ${category}.`);
      }

      console.log(`\nPRICE GROUP: ${groupConfig.key}`);

      group.sort((a, b) => {
        const qualityA = getQualityScore(a);
        const qualityB = getQualityScore(b);
        if (qualityB !== qualityA) return qualityB - qualityA;
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        if (priceA !== priceB) return priceA - priceB;
        return a._id.toString().localeCompare(b._id.toString());
      });

      const chosen = group.slice(0, PRODUCTS_PER_GROUP);

      chosen.sort((a, b) => {
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        if (priceA !== priceB) return priceA - priceB;
        return a._id.toString().localeCompare(b._id.toString());
      });

      const productsWithPoints = createIncreasingPointCosts(chosen);

      for (const product of productsWithPoints) {
        selected.push({ ...product, tier: groupConfig.key });

        const spendRequired = product.pointsCost / POINTS_PER_RUPEE;
        const checkoutDiscountValue = product.pointsCost * POINTS_TO_RUPEE_RATE;

        console.log(`\n  ${product.name}`);
        console.log(`    Price: Rs. ${Number(product.price).toLocaleString()}`);
        console.log(`    Rating: ${Number(product.ratings || 0).toFixed(1)}`);
        console.log(`    Bestseller: ${product.isBestSeller ? "Yes" : "No"}`);
        console.log(`    Featured: ${product.isFeatured ? "Yes" : "No"}`);
        console.log(`    Reward: ${Number(product.pointsCost).toLocaleString()} points`);
        console.log(`    Requires ~Rs. ${spendRequired.toLocaleString()} of prior spend to earn`);
        console.log(`    (For comparison, worth only Rs. ${checkoutDiscountValue.toFixed(2)} as a checkout discount)`);
      }
    }
  }

  return selected;
}

// ============================================================
// DISPLAY PREVIEW
// ============================================================

function displayPreview(products) {
  console.log("\n\n============================================================");
  console.log("                 REWARD PRODUCT PREVIEW");
  console.log("============================================================");

  for (const group of PRICE_GROUPS) {
    console.log(`\n### ${group.key.toUpperCase()} ###`);

    const groupProducts = products.filter((p) => p.tier === group.key);

    for (const category of CATEGORIES) {
      console.log(`\n  ${category.toUpperCase()}`);

      const categoryProducts = groupProducts
        .filter((p) => p.category === category)
        .sort((a, b) => Number(a.pointsCost) - Number(b.pointsCost));

      for (const product of categoryProducts) {
        const hasImage =
          Array.isArray(product.image) &&
          product.image.length > 0 &&
          Boolean(product.image[0]?.url);

        const spendRequired = Number(product.pointsCost) / POINTS_PER_RUPEE;

        console.log(`    • ${product.name}`);
        console.log(`      Price: Rs. ${Number(product.price).toLocaleString()}`);
        console.log(`      Reward: ${Number(product.pointsCost).toLocaleString()} points`);
        console.log(`      Requires ~Rs. ${spendRequired.toLocaleString()} of prior spend`);
        console.log(`      Image: ${hasImage ? "✓ Cloudinary image exists" : "⚠ NO IMAGE"}`);
        console.log(`      ID: ${product._id}`);
      }
    }
  }

  console.log(`\n============================================================`);
  console.log(`TOTAL PRODUCTS SELECTED: ${products.length}`);
  console.log(`REDEMPTION_SPEND_MULTIPLIER: ${REDEMPTION_SPEND_MULTIPLIER}x`);
  console.log("============================================================");
}

// ============================================================
// VERIFY SELECTION
// ============================================================

function verifySelection(products) {
  const expected = PRICE_GROUPS.length * CATEGORIES.length * PRODUCTS_PER_CATEGORY;

  if (products.length !== expected) {
    throw new Error(`Expected ${expected} products, but selected ${products.length}.`);
  }

  for (const group of PRICE_GROUPS) {
    for (const category of CATEGORIES) {
      const matching = products.filter((p) => p.tier === group.key && p.category === category);
      if (matching.length !== PRODUCTS_PER_CATEGORY) {
        throw new Error(`${group.key} / ${category}: expected ${PRODUCTS_PER_CATEGORY}, got ${matching.length}.`);
      }
    }
  }

  const ids = products.map((p) => p._id.toString());
  if (new Set(ids).size !== ids.length) {
    throw new Error("Duplicate product detected.");
  }

  for (const product of products) {
    if (!Number.isFinite(Number(product.pointsCost)) || Number(product.pointsCost) < MIN_REWARD_POINTS) {
      throw new Error(`Invalid points ${product.pointsCost} for ${product.name}.`);
    }
  }

  for (const category of CATEGORIES) {
    let previousMaxPrice = -Infinity;

    for (const group of PRICE_GROUPS) {
      const groupProducts = products
        .filter((p) => p.category === category && p.tier === group.key)
        .sort((a, b) => Number(a.price) - Number(b.price));

      const currentMinPrice = Number(groupProducts[0].price);
      const currentMaxPrice = Number(groupProducts[groupProducts.length - 1].price);

      if (currentMinPrice <= previousMaxPrice) {
        throw new Error(
          `PRICE ORDER VIOLATION: ${category} / ${group.key}. A higher price group contains a product ` +
            `that is not more expensive than the previous group. Previous max: Rs. ${previousMaxPrice.toLocaleString()}, ` +
            `Current min: Rs. ${currentMinPrice.toLocaleString()}`
        );
      }

      previousMaxPrice = currentMaxPrice;
    }
  }

  for (const category of CATEGORIES) {
    for (const group of PRICE_GROUPS) {
      const groupProducts = products
        .filter((p) => p.category === category && p.tier === group.key)
        .sort((a, b) => Number(a.pointsCost) - Number(b.pointsCost));

      for (let i = 1; i < groupProducts.length; i++) {
        const previous = groupProducts[i - 1];
        const current = groupProducts[i];

        if (Number(current.price) <= Number(previous.price)) {
          throw new Error(
            `PRICE ORDER VIOLATION: ${category} / ${group.key}. ${current.name} (Rs. ${current.price}) must cost more than ${previous.name} (Rs. ${previous.price}).`
          );
        }

        if (Number(current.pointsCost) <= Number(previous.pointsCost)) {
          throw new Error(
            `POINT ORDER VIOLATION: ${category} / ${group.key}. ${current.name} must require more points than ${previous.name}.`
          );
        }
      }
    }
  }

  for (const category of CATEGORIES) {
    const categoryProducts = products
      .filter((p) => p.category === category)
      .sort((a, b) => Number(a.price) - Number(b.price));

    for (let i = 1; i < categoryProducts.length; i++) {
      const previous = categoryProducts[i - 1];
      const current = categoryProducts[i];

      if (Number(current.price) <= Number(previous.price)) {
        throw new Error(`PRICE ORDER VIOLATION: ${category}. ${current.name} must cost more than ${previous.name}.`);
      }

      if (Number(current.pointsCost) <= Number(previous.pointsCost)) {
        throw new Error(`POINT ORDER VIOLATION: ${category}. ${current.name} must require more points than ${previous.name}.`);
      }
    }
  }

  console.log("\n✓ Selection verification passed.");
  console.log(`✓ Exactly ${products.length} unique products selected.`);
  console.log("✓ Product price determines reward point value (via the earn rate, not the discount rate).");
  console.log("✓ Price increases with reward points.");
  console.log("✓ Rating/bestseller quality filtering applied.");

  return true;
}

// ============================================================
// CONFIRMATION
// ============================================================

function askForConfirmation() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    rl.question("\n⚠️ Apply these changes to MongoDB? Type YES to continue: ", (answer) => {
      rl.close();
      resolve(answer.trim().toUpperCase() === "YES");
    });
  });
}

// ============================================================
// APPLY UPDATES
// ============================================================

async function applyUpdates(products) {
  console.log("\n============================================================");
  console.log("                    UPDATING MONGODB");
  console.log("============================================================\n");

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const result = await Product.updateOne(
      { _id: product._id },
      { $set: { pointsCost: product.pointsCost } }
    );

    if (result.modifiedCount === 1) {
      updated++;
      console.log(`✓ ${product.name} → ${Number(product.pointsCost).toLocaleString()} points`);
    } else {
      skipped++;
      console.log(`⚠ No change: ${product.name}`);
    }
  }

  console.log("\n============================================================");
  console.log("                    UPDATE COMPLETE");
  console.log("============================================================");
  console.log(`Updated: ${updated}`);
  console.log(`Unchanged: ${skipped}`);
}

// ============================================================
// FINAL SUMMARY
// ============================================================

async function showFinalSummary() {
  const rewards = await Product.find({ pointsCost: { $gte: MIN_REWARD_POINTS } })
    .select("name category price pointsCost image")
    .sort({ pointsCost: 1 })
    .lean();

  console.log("\n============================================================");
  console.log("                   FINAL REWARD SUMMARY");
  console.log("============================================================");
  console.log(`\nTotal reward products: ${rewards.length}`);
  console.log(`REDEMPTION_SPEND_MULTIPLIER: ${REDEMPTION_SPEND_MULTIPLIER}x`);

  console.log("\nReward products:");

  for (const category of CATEGORIES) {
    console.log(`\n${category.toUpperCase()}`);

    const categoryRewards = rewards
      .filter((p) => p.category === category)
      .sort((a, b) => Number(a.pointsCost) - Number(b.pointsCost));

    for (const product of categoryRewards) {
      const spendRequired = Number(product.pointsCost) / POINTS_PER_RUPEE;

      console.log(`  • ${product.name}`);
      console.log(`    Price: Rs. ${Number(product.price).toLocaleString()}`);
      console.log(`    Reward: ${Number(product.pointsCost).toLocaleString()} points`);
      console.log(`    Requires ~Rs. ${spendRequired.toLocaleString()} of prior spend`);
    }
  }

  console.log("\n============================================================\n");
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const isPreview = process.argv.includes("--preview");
  const isApply = process.argv.includes("--apply");

  if (!isPreview && !isApply) {
    console.log(`
Usage:
  Preview only:
    node scripts/assignRewardPoints.js --preview

  Apply changes:
    node scripts/assignRewardPoints.js --apply
`);
    process.exitCode = 1;
    return;
  }

  try {
    console.log("\n============================================================");
    console.log("              REWARD POINT ASSIGNMENT TOOL");
    console.log("============================================================");
    console.log(`\nPOINTS_PER_RUPEE (earn rate): ${POINTS_PER_RUPEE}`);
    console.log(`REDEMPTION_SPEND_MULTIPLIER: ${REDEMPTION_SPEND_MULTIPLIER}x`);
    console.log(`MIN_REWARD_POINTS: ${MIN_REWARD_POINTS}`);

    if (isPreview) {
      console.log("\nMODE: PREVIEW ONLY");
      console.log("✓ NO DATABASE CHANGES WILL BE MADE.");
    }

    if (isApply) {
      console.log("\nMODE: APPLY");
      console.log("⚠ DATABASE CHANGES REQUIRE CONFIRMATION.");
      console.log("⚠ Existing reward point values will be recalculated.");
    }

    await connectDB();
    console.log("\n✓ MongoDB connected.");

    const existingRewards = await Product.countDocuments({ pointsCost: { $gte: MIN_REWARD_POINTS } });
    console.log(`✓ Existing reward products: ${existingRewards}`);

    console.log("\nSelecting reward products...");
    const selectedProducts = await selectRewardProducts();

    verifySelection(selectedProducts);
    displayPreview(selectedProducts);

    if (isPreview) {
      console.log("\n============================================================");
      console.log("                   PREVIEW COMPLETE");
      console.log("✓ No products were modified.");
      console.log("============================================================\n");
      return;
    }

    const confirmed = await askForConfirmation();

    if (!confirmed) {
      console.log("\n❌ Cancelled.");
      console.log("✓ No products were modified.\n");
      return;
    }

    await applyUpdates(selectedProducts);
    await showFinalSummary();

    console.log("✓ Reward points assignment finished successfully.\n");
  } catch (error) {
    console.error("\n❌ ERROR:");
    console.error(error.message);
    console.log("\n⚠ Any updates already completed before this error remain in MongoDB.");
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
}

main();