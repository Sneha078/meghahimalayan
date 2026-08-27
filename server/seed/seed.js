/**
 * Database Seed Script — Mega Himalaya
 *
 * Creates:
 *   - 1 admin user
 *   - 1 demo customer (with saved address + 2 sample orders)
 *   - 150 products (from products.json)
 *   - 3 coupons
 *
 * Run:  npm run seed
 *
 * Credentials (override via .env):
 *   Admin   — ADMIN_EMAIL / ADMIN_PASSWORD
 *   Demo    — demo@megahimalaya.com / Demo@12345
 *
 * WARNING: This script DELETES existing products, coupons, and the
 * seed users before re-creating them.  Never run in production.
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

import connectDB from "../config/db.js";
import User    from "../models/userModel.js";
import Product from "../models/productModel.js";
import Order   from "../models/orderModel.js";
import Coupon  from "../models/couponModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// products.json is shaped as { "products": [ ...150 items ] }
const rawFile = JSON.parse(
  readFileSync(path.join(__dirname, "products.json"), "utf8")
);
const rawProducts = rawFile.products;

// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
  await connectDB();

  // ── 1. Admin ────────────────────────────────────────────────────────────────
  const adminEmail    = process.env.ADMIN_EMAIL    || "admin@megahimalaya.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";

  await User.deleteOne({ email: adminEmail });

  const admin = await User.create({
    name:     "Admin User",
    email:    adminEmail,
    password: adminPassword,
    phone:    "+977-1-4220404",
    role:     "admin",
  });

  console.log(`✓ Admin created: ${adminEmail}`);

  // ── 2. Products ─────────────────────────────────────────────────────────────
  await Product.deleteMany({});

  const products = rawProducts.map((p) => ({
    name:          p.name,
    slug:          p.slug,
    description:   p.description,
    brand:         p.brand,
    category:      p.category,
    subcategory:   p.subcategory   || "",
    gender:        p.gender        || "Unisex",
    price:         p.price,
    discountPrice: p.discountPrice ?? null,
    ratings:       p.ratings       || 0,
    numOfReviews:  p.numOfReviews  || 0,
    stock:         p.stock         ?? 10,
    isFeatured:    !!p.isFeatured,
    isBestSeller:  !!p.isBestSeller,
    isNewArrival:  !!p.isNewArrival,
    // image is already [{ public_id, url }, ...] in products.json — use as-is.
    // (isOutOfStock is recalculated automatically by the Product pre-save hook.)
    image: Array.isArray(p.image) ? p.image : [],
    // Eyeglasses
    frameShape:    p.frameShape    || "",
    frameMaterial: p.frameMaterial || "",
    frameColor:    p.frameColor    || "",
    lensType:      p.lensType      || "",
    // Watches
    watchType:       p.watchType       || "",
    dialColor:       p.dialColor       || "",
    strapMaterial:   p.strapMaterial   || "",
    caseSize:        p.caseSize        || "",
    movementType:    p.movementType    || "",
    waterResistance: p.waterResistance || "",
    // Perfumes
    fragranceFamily: p.fragranceFamily || "",
    fragranceType:   p.fragranceType   || "",
    volume:          p.volume          || "",
    user: admin._id,
  }));

  await Product.insertMany(products);
  console.log(`✓ Seeded ${products.length} products`);

  // ── 3. Coupons ──────────────────────────────────────────────────────────────
  await Coupon.deleteMany({});

  await Coupon.insertMany([
    {
      code:        "MH10",
      description: "10% off your entire order",
      type:        "percentage",
      value:       10,
      minOrder:    0,
      maxDiscount: 2000,
      usageLimit:  null,
      isActive:    true,
    },
    {
      code:        "WELCOME200",
      description: "NPR 200 off on orders above NPR 3,000",
      type:        "flat",
      value:       200,
      minOrder:    3000,
      maxDiscount: null,
      usageLimit:  null,
      isActive:    true,
    },
    {
      code:        "FESTIVE15",
      description: "15% off on orders above NPR 10,000 (max NPR 5,000)",
      type:        "percentage",
      value:       15,
      minOrder:    10000,
      maxDiscount: 5000,
      usageLimit:  null,
      isActive:    true,
    },
  ]);

  console.log("✓ Seeded 3 coupons: MH10, WELCOME200, FESTIVE15");

  // ── 4. Demo customer + sample orders ────────────────────────────────────────
  const demoEmail = "demo@megahimalaya.com";

  // Clean up any previous demo data
  const existingDemo = await User.findOne({ email: demoEmail });
  if (existingDemo) {
    await Order.deleteMany({ user: existingDemo._id });
    await User.deleteOne({ _id: existingDemo._id });
  }

  const demo = await User.create({
    name:     "Ram Prasad Shrestha",
    email:    demoEmail,
    password: "Demo@12345",
    phone:    "+977 9841-234567",
    role:     "user",
    addresses: [
      {
        name:       "Ram Prasad Shrestha",
        phone:      "+977 9841-234567",
        street:     "Chabahil Chowk, House No. 14",
        city:       "Kathmandu",
        province:   "Bagmati Province",
        postalCode: "44600",
        isDefault:  true,
      },
    ],
  });

  // Grab the first 3 seeded products for sample orders
  const seededProducts = await Product.find().limit(3).lean();

  const unitPrice = (p) =>
    p.discountPrice !== null && p.discountPrice < p.price
      ? p.discountPrice
      : p.price;

  const shippingInfo = {
    name:    "Ram Prasad Shrestha",
    address: "Chabahil Chowk, House No. 14",
    city:    "Kathmandu",
    state:   "Bagmati Province",
    country: "Nepal",
    pinCode: "44600",
    phoneNo: "+977 9841-234567",
  };

  // Order 1 — Delivered, Paid
  if (seededProducts.length >= 2) {
    const items1 = [
      {
        name:     seededProducts[0].name,
        quantity: 2,
        image:    seededProducts[0].image[0]?.url || "",
        product:  seededProducts[0]._id,
        price:    unitPrice(seededProducts[0]),
      },
      {
        name:     seededProducts[1].name,
        quantity: 1,
        image:    seededProducts[1].image[0]?.url || "",
        product:  seededProducts[1]._id,
        price:    unitPrice(seededProducts[1]),
      },
    ];
    const items1Total = items1.reduce((s, i) => s + i.price * i.quantity, 0);

    await Order.create({
      orderNumber:  "MH-831924",
      shippingInfo,
      orderItems:   items1,
      orderStatus:  "Delivered",
      user:         demo._id,
      paymentInfo:  { id: "", method: "COD", status: "Paid" },
      paidAt:       new Date("2026-08-05"),
      itemsPrice:   items1Total,
      taxPrice:     0,
      shippingPrice: 0,
      discount:     0,
      totalPrice:   items1Total,
      deliveredAt:  new Date("2026-08-10"),
    });
  }

  // Order 2 — Shipped, Pending payment
  if (seededProducts.length >= 3) {
    const items2 = [
      {
        name:     seededProducts[2].name,
        quantity: 1,
        image:    seededProducts[2].image[0]?.url || "",
        product:  seededProducts[2]._id,
        price:    unitPrice(seededProducts[2]),
      },
    ];
    const items2Total = items2.reduce((s, i) => s + i.price * i.quantity, 0);

    await Order.create({
      orderNumber:  "MH-719238",
      shippingInfo,
      orderItems:   items2,
      orderStatus:  "Shipped",
      user:         demo._id,
      paymentInfo:  { id: "", method: "COD", status: "Pending" },
      paidAt:       null,
      itemsPrice:   items2Total,
      taxPrice:     0,
      shippingPrice: 0,
      discount:     0,
      totalPrice:   items2Total,
    });
  }

  console.log(`✓ Demo customer created: ${demoEmail} / Demo@12345`);
  console.log("✓ 2 sample orders created for demo customer");
  console.log("\n Seeding complete!");
  console.log("─────────────────────────────────────────");
  console.log("  Admin login  →  POST /api/v1/login");
  console.log(`  Email:      ${adminEmail}`);
  console.log(`  Password:   ${adminPassword}`);
  console.log("─────────────────────────────────────────");
  console.log("  Demo login   →  POST /api/v1/login");
  console.log(`  Email:      ${demoEmail}`);
  console.log("  Password:   Demo@12345");
  console.log("─────────────────────────────────────────\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});