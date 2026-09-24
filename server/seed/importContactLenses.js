// seeder/importContactLenses.js  (next to products.json)
import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

import connectDB from "../config/db.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawProducts = JSON.parse(
  readFileSync(path.join(__dirname, "products.json"), "utf8")
).products;

const run = async () => {
  await connectDB();

  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    console.error("No admin user found.");
    process.exit(1);
  }

  const lenses = rawProducts.filter((p) => p.category === "contact-lenses");
  console.log(`Found ${lenses.length} contact lenses in products.json`);

  let added = 0, skipped = 0, failed = 0;

  for (const p of lenses) {
    const exists = await Product.findOne({
      $or: [{ slug: p.slug }, { name: p.name, brand: p.brand }],
    });
    if (exists) { skipped++; continue; }

    try {
      await Product.create({
        name: p.name,
        slug: p.slug,
        description: p.description,
        brand: p.brand,
        category: p.category,
        subcategory: p.subcategory || "",
        gender: p.gender || "Unisex",
        price: p.price,
        discountPrice: p.discountPrice ?? null,
        ratings: p.ratings || 0,
        numOfReviews: p.numOfReviews || 0,
        stock: p.stock ?? 10,
        isOutOfStock: (p.stock ?? 10) === 0,
        isFeatured: !!p.isFeatured,
        isBestSeller: !!p.isBestSeller,
        isNewArrival: !!p.isNewArrival,
        image: Array.isArray(p.image) ? p.image : [],
        lensType: p.lensType || "",
        baseCurve: p.baseCurve || "",
        diameter: p.diameter || "",
        waterContent: p.waterContent || "",
        replacementSchedule: p.replacementSchedule || "",
        packSize: p.packSize || "",
        isPrescriptionRequired: p.isPrescriptionRequired ?? false,
        user: admin._id,
      });
      added++;
    } catch (err) {
      failed++;
      console.error(`FAILED "${p.name}": ${err.message}`);
    }
  }

  console.log(`Added: ${added}, skipped: ${skipped}, failed: ${failed}`);
  process.exit(0);
};

run();