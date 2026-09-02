import "dotenv/config";
import mongoose from "mongoose";
import readline from "readline";

import Product from "../models/productModel.js";
import connectDB from "../config/db.js";

// ============================================================
// CONFIGURATION
// ============================================================

const PRODUCTS_PER_CATEGORY = 4;

const CATEGORIES = [
  "eyeglasses",
  "watches",
  "perfumes",
];

// Exactly four reward point values per tier.
// Each category receives one product at each value.
const POINT_TIERS = [
  {
    key: "200-500",
    points: [250, 350, 425, 500],
  },
  {
    key: "501-800",
    points: [550, 650, 725, 800],
  },
  {
    key: "801-1300",
    points: [850, 1000, 1150, 1300],
  },
  {
    key: "1300+",
    points: [1500, 1800, 2200, 2500],
  },
];

// Total rewards per category = 4 tiers × 4 products
const PRODUCTS_PER_TIER = PRODUCTS_PER_CATEGORY;

const TOTAL_PRODUCTS_PER_CATEGORY =
  POINT_TIERS.length * PRODUCTS_PER_CATEGORY;

// ============================================================
// QUALITY SCORE
// ============================================================
//
// Price determines WHICH PRICE GROUP a product belongs to.
//
// Rating / bestseller / featured / new arrival determine
// WHICH products are preferred INSIDE that price group.
//
// This means a cheap bestseller can beat another cheap product,
// but it can NEVER jump into a higher-priced reward tier.
//

function getQualityScore(product) {
  const rating = Number(product.ratings) || 0;

  const bestseller = product.isBestSeller ? 1 : 0;
  const featured = product.isFeatured ? 1 : 0;
  const newArrival = product.isNewArrival ? 1 : 0;

  return (
    rating * 10 +
    bestseller * 5 +
    featured * 2 +
    newArrival * 1
  );
}

// ============================================================
// SELECT PRODUCTS
// ============================================================

async function selectRewardProducts() {
  const selected = [];

  const selectedProductIds = new Set();

  for (const category of CATEGORIES) {
    console.log("\n========================================");
    console.log(`CATEGORY: ${category.toUpperCase()}`);
    console.log("========================================");

    // ----------------------------------------------------------
    // Get eligible products
    // ----------------------------------------------------------

    const candidates = await Product.find({
      category,

      // Existing reward products are protected.
      // Only products with no reward points or points < 200
      // are eligible for assignment.
      $or: [
        { pointsCost: { $exists: false } },
        { pointsCost: { $lt: 200 } },
      ],

      // Do not give rewards to products with no stock.
      stock: { $gt: 0 },
    })
      .select(
        "_id name category price pointsCost image ratings isBestSeller isFeatured isNewArrival stock isOutOfStock"
      )
      .lean();

    console.log(
      `Eligible products: ${candidates.length}`
    );

    if (
      candidates.length <
      TOTAL_PRODUCTS_PER_CATEGORY
    ) {
      throw new Error(
        `Not enough ${category} products. ` +
          `Need ${TOTAL_PRODUCTS_PER_CATEGORY}, ` +
          `found ${candidates.length}.`
      );
    }

    // ----------------------------------------------------------
    // STEP 1 — Sort by PRICE
    // ----------------------------------------------------------
    //
    // Price is ALWAYS the primary ordering.
    //
    // Rating/bestseller are NOT allowed to change the price
    // ordering between reward tiers.
    //

    candidates.sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;

      if (priceA !== priceB) {
        return priceA - priceB;
      }

      // Same price:
      // better products are preferred.
      const qualityA = getQualityScore(a);
      const qualityB = getQualityScore(b);

      if (qualityB !== qualityA) {
        return qualityB - qualityA;
      }

      return a._id
        .toString()
        .localeCompare(b._id.toString());
    });

    // ----------------------------------------------------------
    // STEP 2 — Divide the category into four PRICE GROUPS
    // ----------------------------------------------------------
    //
    // Example:
    //
    // Lowest-price group  → 200-500
    // Lower-middle group  → 501-800
    // Upper-middle group  → 801-1300
    // Highest-price group → 1300+
    //
    // We use the complete category inventory rather than simply
    // taking the 16 cheapest products.
    //

    const totalCandidates = candidates.length;

    const baseGroupSize = Math.floor(
      totalCandidates / POINT_TIERS.length
    );

    const priceGroups = [];

    for (
      let tierIndex = 0;
      tierIndex < POINT_TIERS.length;
      tierIndex++
    ) {
      const start =
        tierIndex * baseGroupSize;

      const end =
        tierIndex === POINT_TIERS.length - 1
          ? totalCandidates
          : (tierIndex + 1) * baseGroupSize;

      const group = candidates.slice(
        start,
        end
      );

      priceGroups.push(group);
    }

    // ----------------------------------------------------------
    // STEP 3 — Choose the best 4 PRODUCTS inside each
    // PRICE GROUP using QUALITY
    // ----------------------------------------------------------

    for (
      let tierIndex = 0;
      tierIndex < POINT_TIERS.length;
      tierIndex++
    ) {
      const tier = POINT_TIERS[tierIndex];

      const group = priceGroups[tierIndex];

      if (
        group.length <
        PRODUCTS_PER_TIER
      ) {
        throw new Error(
          `Not enough products in price group ` +
            `${tier.key} for ${category}.`
        );
      }

      console.log(
        `\nPRICE GROUP: ${tier.key}`
      );

      // --------------------------------------------------------
      // Rank by QUALITY inside this price group.
      //
      // Rating is strongest.
      // Bestseller is second.
      // Featured and new arrival provide small bonuses.
      // --------------------------------------------------------

      group.sort((a, b) => {
        const qualityA =
          getQualityScore(a);

        const qualityB =
          getQualityScore(b);

        if (qualityB !== qualityA) {
          return qualityB - qualityA;
        }

        // If quality is equal, lower price wins.
        const priceA =
          Number(a.price) || 0;

        const priceB =
          Number(b.price) || 0;

        if (priceA !== priceB) {
          return priceA - priceB;
        }

        return a._id
          .toString()
          .localeCompare(b._id.toString());
      });

      // Pick exactly 4 high-quality products.
      const chosen = group.slice(
        0,
        PRODUCTS_PER_TIER
      );

      // --------------------------------------------------------
      // STEP 4 — Sort the chosen products by PRICE again.
      //
      // This is VERY important.
      //
      // Even if a more expensive product has a higher rating,
      // it cannot receive a lower points value than a cheaper
      // product in the same tier.
      // --------------------------------------------------------

      chosen.sort((a, b) => {
        const priceA =
          Number(a.price) || 0;

        const priceB =
          Number(b.price) || 0;

        if (priceA !== priceB) {
          return priceA - priceB;
        }

        return a._id
          .toString()
          .localeCompare(b._id.toString());
      });

      // --------------------------------------------------------
      // STEP 5 — Assign increasing points according to price
      // --------------------------------------------------------

      chosen.forEach((product, index) => {
        const pointsCost =
          tier.points[index];

        selected.push({
          ...product,
          pointsCost,
          tier: tier.key,
        });

        selectedProductIds.add(
          product._id.toString()
        );

        console.log(
          `  ${product.name}`
        );

        console.log(
          `    Price: Rs. ${Number(
            product.price
          ).toLocaleString()}`
        );

        console.log(
          `    Rating: ${Number(
            product.ratings || 0
          ).toFixed(1)}`
        );

        console.log(
          `    Bestseller: ${
            product.isBestSeller
              ? "Yes"
              : "No"
          }`
        );

        console.log(
          `    Featured: ${
            product.isFeatured
              ? "Yes"
              : "No"
          }`
        );

        console.log(
          `    Reward: ${pointsCost} points`
        );
      });
    }
  }

  return selected;
}

// ============================================================
// DISPLAY PREVIEW
// ============================================================

function displayPreview(products) {
  console.log("\n\n");

  console.log(
    "============================================================"
  );

  console.log(
    "                 REWARD PRODUCT PREVIEW"
  );

  console.log(
    "============================================================"
  );

  for (const tier of POINT_TIERS) {
    console.log(`\n### ${tier.key} ###`);

    const tierProducts = products.filter(
      (product) =>
        product.tier === tier.key
    );

    for (const category of CATEGORIES) {
      console.log(
        `\n  ${category.toUpperCase()}`
      );

      const categoryProducts =
        tierProducts
          .filter(
            (product) =>
              product.category === category
          )
          .sort(
            (a, b) =>
              Number(a.pointsCost) -
              Number(b.pointsCost)
          );

      for (const product of categoryProducts) {
        const hasImage =
          Array.isArray(product.image) &&
          product.image.length > 0 &&
          Boolean(product.image[0]?.url);

        console.log(
          `    • ${product.name}`
        );

        console.log(
          `      Price: Rs. ${Number(
            product.price
          ).toLocaleString()}`
        );

        console.log(
          `      Rating: ${Number(
            product.ratings || 0
          ).toFixed(1)}`
        );

        console.log(
          `      Bestseller: ${
            product.isBestSeller
              ? "Yes"
              : "No"
          }`
        );

        console.log(
          `      Reward: ${Number(
            product.pointsCost
          ).toLocaleString()} points`
        );

        console.log(
          `      Image: ${
            hasImage
              ? "✓ Cloudinary image exists"
              : "⚠ NO IMAGE"
          }`
        );

        console.log(
          `      ID: ${product._id}`
        );
      }
    }
  }

  console.log("\n");

  console.log(
    "============================================================"
  );

  console.log(
    `TOTAL PRODUCTS SELECTED: ${products.length}`
  );

  console.log(
    "============================================================"
  );
}

// ============================================================
// VERIFY SELECTION
// ============================================================

function verifySelection(products) {
  const expected =
    POINT_TIERS.length *
    CATEGORIES.length *
    PRODUCTS_PER_CATEGORY;

  // ----------------------------------------------------------
  // Total count
  // ----------------------------------------------------------

  if (products.length !== expected) {
    throw new Error(
      `Expected ${expected} products, ` +
        `but selected ${products.length}.`
    );
  }

  // ----------------------------------------------------------
  // Verify every tier/category has exactly 4 products
  // ----------------------------------------------------------

  for (const tier of POINT_TIERS) {
    for (const category of CATEGORIES) {
      const matching = products.filter(
        (product) =>
          product.tier === tier.key &&
          product.category === category
      );

      if (
        matching.length !==
        PRODUCTS_PER_CATEGORY
      ) {
        throw new Error(
          `${tier.key} / ${category}: ` +
            `expected ${PRODUCTS_PER_CATEGORY}, ` +
            `got ${matching.length}.`
        );
      }
    }
  }

  // ----------------------------------------------------------
  // Verify no duplicate products
  // ----------------------------------------------------------

  const ids = products.map((product) =>
    product._id.toString()
  );

  const uniqueIds = new Set(ids);

  if (uniqueIds.size !== ids.length) {
    throw new Error(
      "Duplicate product detected."
    );
  }

  // ----------------------------------------------------------
  // Verify points belong to correct tier
  // ----------------------------------------------------------

  for (const product of products) {
    const tier = POINT_TIERS.find(
      (t) => t.key === product.tier
    );

    if (!tier) {
      throw new Error(
        `Unknown tier: ${product.tier}`
      );
    }

    if (
      !tier.points.includes(
        product.pointsCost
      )
    ) {
      throw new Error(
        `Invalid points ${product.pointsCost} ` +
          `for tier ${product.tier}.`
      );
    }
  }

  // ----------------------------------------------------------
  // Verify price increases from one tier to the next
  // ----------------------------------------------------------
  //
  // This prevents something like:
  //
  // Rs. 15,000 → 1300+
  // Rs. 2,000  → 1500
  //
  // from ever being accepted.
  //

  for (const category of CATEGORIES) {
    let previousMaxPrice = -Infinity;

    for (const tier of POINT_TIERS) {
      const tierProducts = products
        .filter(
          (product) =>
            product.category === category &&
            product.tier === tier.key
        )
        .sort(
          (a, b) =>
            Number(a.price) -
            Number(b.price)
        );

      const currentMinPrice =
        Number(tierProducts[0].price);

      const currentMaxPrice =
        Number(
          tierProducts[
            tierProducts.length - 1
          ].price
        );

      if (
        currentMinPrice <=
        previousMaxPrice
      ) {
        throw new Error(
          `PRICE ORDER VIOLATION: ${category} / ${tier.key}. ` +
            `A higher reward tier contains a product ` +
            `that is not more expensive than the previous tier. ` +
            `Previous max: Rs. ${previousMaxPrice.toLocaleString()}, ` +
            `Current min: Rs. ${currentMinPrice.toLocaleString()}`
        );
      }

      previousMaxPrice =
        currentMaxPrice;
    }
  }

  // ----------------------------------------------------------
  // Verify prices increase with points INSIDE each tier
  // ----------------------------------------------------------

  for (const category of CATEGORIES) {
    for (const tier of POINT_TIERS) {
      const tierProducts = products
        .filter(
          (product) =>
            product.category === category &&
            product.tier === tier.key
        )
        .sort(
          (a, b) =>
            Number(a.pointsCost) -
            Number(b.pointsCost)
        );

      for (
        let i = 1;
        i < tierProducts.length;
        i++
      ) {
        const previous =
          tierProducts[i - 1];

        const current =
          tierProducts[i];

        if (
          Number(current.price) <=
          Number(previous.price)
        ) {
          throw new Error(
            `PRICE ORDER VIOLATION: ${category} / ${tier.key}. ` +
              `${current.name} (Rs. ${current.price}) ` +
              `must cost more than ` +
              `${previous.name} (Rs. ${previous.price}).`
          );
        }
      }
    }
  }

  // ----------------------------------------------------------
  // Verify reward points increase correctly
  // ----------------------------------------------------------

  for (const category of CATEGORIES) {
    const categoryProducts = products
      .filter(
        (product) =>
          product.category === category
      )
      .sort(
        (a, b) =>
          Number(a.pointsCost) -
          Number(b.pointsCost)
      );

    for (
      let i = 1;
      i < categoryProducts.length;
      i++
    ) {
      const previous =
        categoryProducts[i - 1];

      const current =
        categoryProducts[i];

      if (
        Number(current.pointsCost) <=
        Number(previous.pointsCost)
      ) {
        throw new Error(
          `POINT ORDER VIOLATION: ${category}. ` +
            `${current.name} must have more points ` +
            `than ${previous.name}.`
        );
      }
    }
  }

  console.log(
    "\n✓ Selection verification passed."
  );

  console.log(
    "✓ Exactly 48 unique products selected."
  );

  console.log(
    "✓ Price increases with reward points."
  );

  console.log(
    "✓ Rating/bestseller quality filtering applied."
  );

  return true;
}

// ============================================================
// CONFIRMATION
// ============================================================

function askForConfirmation() {
  return new Promise((resolve) => {
    const rl =
      readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

    rl.question(
      "\n⚠️  Apply these changes to MongoDB? Type YES to continue: ",
      (answer) => {
        rl.close();

        resolve(
          answer.trim().toUpperCase() ===
            "YES"
        );
      }
    );
  });
}

// ============================================================
// APPLY UPDATES
// ============================================================

async function applyUpdates(products) {
  console.log("\n");

  console.log(
    "============================================================"
  );

  console.log(
    "                    UPDATING MONGODB"
  );

  console.log(
    "============================================================\n"
  );

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    // --------------------------------------------------------
    // IMPORTANT SAFETY CHECK
    //
    // Only update if this product still does not have a
    // reward value >= 200.
    //
    // This prevents overwriting an existing reward if the
    // database changed between preview and confirmation.
    // --------------------------------------------------------

    const result =
      await Product.updateOne(
        {
          _id: product._id,

          $or: [
            {
              pointsCost: {
                $exists: false,
              },
            },
            {
              pointsCost: {
                $lt: 200,
              },
            },
          ],
        },
        {
          $set: {
            pointsCost:
              product.pointsCost,
          },
        }
      );

    if (result.modifiedCount === 1) {
      updated++;

      console.log(
        `✓ ${product.name} → ${product.pointsCost} points`
      );
    } else {
      skipped++;

      console.log(
        `⚠ Skipped: ${product.name}`
      );
    }
  }

  console.log("\n");

  console.log(
    "============================================================"
  );

  console.log(
    "                    UPDATE COMPLETE"
  );

  console.log(
    "============================================================"
  );

  console.log(
    `Updated: ${updated}`
  );

  console.log(
    `Skipped: ${skipped}`
  );
}

// ============================================================
// FINAL SUMMARY
// ============================================================

async function showFinalSummary() {
  const rewards =
    await Product.find({
      pointsCost: {
        $gte: 200,
      },
    })
      .select(
        "name category price pointsCost image"
      )
      .sort({
        pointsCost: 1,
      })
      .lean();

  console.log("\n");

  console.log(
    "============================================================"
  );

  console.log(
    "                   FINAL REWARD SUMMARY"
  );

  console.log(
    "============================================================"
  );

  console.log(
    `\nTotal reward products: ${rewards.length}`
  );

  for (const tier of POINT_TIERS) {
    console.log(`\n${tier.key}`);

    for (const category of CATEGORIES) {
      const count =
        rewards.filter(
          (product) => {
            const points =
              Number(
                product.pointsCost
              );

            let belongsToTier = false;

            if (
              tier.key === "200-500"
            ) {
              belongsToTier =
                points >= 200 &&
                points <= 500;
            }

            if (
              tier.key === "501-800"
            ) {
              belongsToTier =
                points >= 501 &&
                points <= 800;
            }

            if (
              tier.key === "801-1300"
            ) {
              belongsToTier =
                points >= 801 &&
                points <= 1300;
            }

            if (
              tier.key === "1300+"
            ) {
              belongsToTier =
                points >= 1301;
            }

            return (
              product.category ===
                category &&
              belongsToTier
            );
          }
        ).length;

      console.log(
        `  ${category}: ${count}`
      );
    }
  }

  console.log(
    "\n============================================================\n"
  );
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const isPreview =
    process.argv.includes(
      "--preview"
    );

  const isApply =
    process.argv.includes(
      "--apply"
    );

  // ----------------------------------------------------------
  // Validate command
  // ----------------------------------------------------------

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
    console.log("\n");

    console.log(
      "============================================================"
    );

    console.log(
      "              REWARD POINT ASSIGNMENT TOOL"
    );

    console.log(
      "============================================================"
    );

    if (isPreview) {
      console.log(
        "\nMODE: PREVIEW ONLY"
      );

      console.log(
        "✓ NO DATABASE CHANGES WILL BE MADE."
      );
    }

    if (isApply) {
      console.log(
        "\nMODE: APPLY"
      );

      console.log(
        "⚠ DATABASE CHANGES REQUIRE CONFIRMATION."
      );
    }

    // --------------------------------------------------------
    // Connect
    // --------------------------------------------------------

    await connectDB();

    console.log(
      "\n✓ MongoDB connected."
    );

    // --------------------------------------------------------
    // Existing rewards
    // --------------------------------------------------------

    const existingRewards =
      await Product.countDocuments({
        pointsCost: {
          $gte: 200,
        },
      });

    console.log(
      `✓ Existing reward products: ${existingRewards}`
    );

    // --------------------------------------------------------
    // Select
    // --------------------------------------------------------

    console.log(
      "\nSelecting reward products..."
    );

    const selectedProducts =
      await selectRewardProducts();

    // --------------------------------------------------------
    // Verify
    // --------------------------------------------------------

    verifySelection(
      selectedProducts
    );

    // --------------------------------------------------------
    // Preview
    // --------------------------------------------------------

    displayPreview(
      selectedProducts
    );

    // --------------------------------------------------------
    // Preview mode
    // --------------------------------------------------------

    if (isPreview) {
      console.log(
        "\n============================================================"
      );

      console.log(
        "                   PREVIEW COMPLETE"
      );

      console.log(
        "✓ No products were modified."
      );

      console.log(
        "============================================================\n"
      );

      return;
    }

    // --------------------------------------------------------
    // Apply confirmation
    // --------------------------------------------------------

    const confirmed =
      await askForConfirmation();

    if (!confirmed) {
      console.log(
        "\n❌ Cancelled."
      );

      console.log(
        "✓ No products were modified.\n"
      );

      return;
    }

    // --------------------------------------------------------
    // Apply
    // --------------------------------------------------------

    await applyUpdates(
      selectedProducts
    );

    // --------------------------------------------------------
    // Final summary
    // --------------------------------------------------------

    await showFinalSummary();

    console.log(
      "✓ Reward points assignment finished successfully.\n"
    );
  } catch (error) {
    console.error(
      "\n❌ ERROR:"
    );

    console.error(
      error.message
    );

    console.log(
      "\n✓ No database updates were performed by the script after this error."
    );
  } finally {
    await mongoose.connection.close();

    console.log(
      "MongoDB connection closed."
    );
  }
}

main();

