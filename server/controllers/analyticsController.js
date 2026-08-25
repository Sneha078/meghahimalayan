import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — DASHBOARD OVERVIEW
// GET /api/v1/admin/dashboard
// ─────────────────────────────────────────────────────────────────────────────
export const getDashboardStats = handleAsyncError(async (req, res, next) => {
  // Run all count queries in parallel for speed
  const [totalOrders, totalCustomers, totalProducts, allOrders] =
    await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: "user" }),
      Product.countDocuments(),
      Order.find().lean(),
    ]);

  // Revenue only from paid, non-cancelled orders
  const paidOrders = allOrders.filter(
    (o) => o.orderStatus !== "Cancelled" && o.paymentInfo?.status === "Paid"
  );

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // ── Order status distribution ─────────────────────────────────────────────
  const statusDistribution = {
    Processing: 0,
    Confirmed:  0,
    Shipped:    0,
    Delivered:  0,
    Cancelled:  0,
  };
  allOrders.forEach((o) => {
    if (statusDistribution[o.orderStatus] !== undefined) {
      statusDistribution[o.orderStatus]++;
    }
  });

  // ── Revenue by category ───────────────────────────────────────────────────
  // Fetch product categories once and cache in a Map to avoid N+1
  const productIds = [
    ...new Set(
      paidOrders.flatMap((o) => o.orderItems.map((i) => i.product.toString()))
    ),
  ];

  const products = await Product.find(
    { _id: { $in: productIds } },
    "category"
  ).lean();

  const categoryMap = new Map(products.map((p) => [p._id.toString(), p.category]));

  const revenueByCategory = { eyeglasses: 0, watches: 0, perfumes: 0 };
  for (const order of paidOrders) {
    for (const item of order.orderItems) {
      const cat = categoryMap.get(item.product.toString());
      if (cat && revenueByCategory[cat] !== undefined) {
        revenueByCategory[cat] += item.price * item.quantity;
      }
    }
  }

  res.status(200).json({
    success: true,
    stats: {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      avgOrderValue,
    },
    statusDistribution,
    revenueByCategory,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — MONTHLY ANALYTICS
// GET /api/v1/admin/analytics?months=6
// ─────────────────────────────────────────────────────────────────────────────
export const getAnalytics = handleAsyncError(async (req, res, next) => {
  const months = Math.min(Math.max(Number(req.query.months) || 6, 1), 24);

  // Start of the oldest month in the range
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  startDate.setMonth(startDate.getMonth() - (months - 1));

  const orders = await Order.find({ createdAt: { $gte: startDate } }).lean();

  // ── Monthly revenue + order count ─────────────────────────────────────────
  const monthlyData = [];
  for (let i = 0; i < months; i++) {
    const monthStart = new Date(startDate);
    monthStart.setMonth(monthStart.getMonth() + i);

    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const slice = orders.filter(
      (o) => new Date(o.createdAt) >= monthStart && new Date(o.createdAt) < monthEnd
    );

    const revenue = slice
      .filter(
        (o) => o.orderStatus !== "Cancelled" && o.paymentInfo?.status === "Paid"
      )
      .reduce((sum, o) => sum + o.totalPrice, 0);

    monthlyData.push({
      month:   monthStart.toLocaleString("en-US", { month: "short", year: "2-digit" }),
      revenue,
      orders:  slice.length,
    });
  }

  // ── Top 5 selling products by quantity ────────────────────────────────────
  const salesMap = new Map();
  for (const order of orders) {
    if (order.orderStatus === "Cancelled") continue;
    for (const item of order.orderItems) {
      const key = item.product.toString();
      const entry = salesMap.get(key) || { name: item.name, quantity: 0, revenue: 0 };
      entry.quantity += item.quantity;
      entry.revenue  += item.price * item.quantity;
      salesMap.set(key, entry);
    }
  }

  const topProducts = [...salesMap.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // ── Category performance ──────────────────────────────────────────────────
  const relevantProductIds = [
    ...new Set(
      orders
        .filter((o) => o.orderStatus !== "Cancelled")
        .flatMap((o) => o.orderItems.map((i) => i.product.toString()))
    ),
  ];

  const productDocs = await Product.find(
    { _id: { $in: relevantProductIds } },
    "category"
  ).lean();

  const catMap = new Map(productDocs.map((p) => [p._id.toString(), p.category]));

  const categoryPerformance = {
    eyeglasses: { quantity: 0, revenue: 0 },
    watches:    { quantity: 0, revenue: 0 },
    perfumes:   { quantity: 0, revenue: 0 },
  };

  for (const order of orders) {
    if (order.orderStatus === "Cancelled") continue;
    for (const item of order.orderItems) {
      const cat = catMap.get(item.product.toString());
      if (cat && categoryPerformance[cat]) {
        categoryPerformance[cat].quantity += item.quantity;
        categoryPerformance[cat].revenue  += item.price * item.quantity;
      }
    }
  }

  res.status(200).json({
    success: true,
    monthlyRevenue: monthlyData.map(({ month, revenue }) => ({ month, revenue })),
    monthlyOrders:  monthlyData.map(({ month, orders }) => ({ month, orders })),
    topProducts,
    categoryPerformance,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — TOP 10 CUSTOMERS BY SPEND
// GET /api/v1/admin/customers/top
// ─────────────────────────────────────────────────────────────────────────────
export const getTopCustomers = handleAsyncError(async (req, res, next) => {
  const orders = await Order.find({ orderStatus: { $ne: "Cancelled" } })
    .populate("user", "name email")
    .lean();

  const customerMap = new Map();
  for (const order of orders) {
    if (!order.user) continue;
    const key = order.user._id.toString();
    const entry = customerMap.get(key) || {
      user:       { id: order.user._id, name: order.user.name, email: order.user.email },
      orderCount: 0,
      totalSpent: 0,
    };
    entry.orderCount++
    entry.totalSpent += order.totalPrice;
    customerMap.set(key, entry);
  }

  const topCustomers = [...customerMap.values()]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  res.status(200).json({ success: true, topCustomers });
});
