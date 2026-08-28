import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

const TIMEZONE = "Asia/Kathmandu";
const MAX_MONTHS = 24;

// Valid revenue criteria:
// 1. Online payment (eSewa / Khalti / Card) -> Paid
// 2. Cash on Delivery (COD) -> Delivered
// 3. Cancelled, deleted, and refunded orders are excluded
const REVENUE_MATCH = {
  isDeleted: false,
  orderStatus: { $ne: "Cancelled" },
  "paymentInfo.status": { $ne: "Refunded" },
  $or: [
    { "paymentInfo.status": "Paid" },
    {
      "paymentInfo.method": "COD",
      orderStatus: "Delivered",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getMonths = (value) => {
  const months = Number(value);
  if (!Number.isFinite(months)) return 6;
  return Math.min(Math.max(Math.floor(months), 1), MAX_MONTHS);
};

const getStartDate = (months) => {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - (months - 1),
      1
    )
  );
};

const getMonthKey = (year, month) => `${year}-${month}`;

const formatMonth = (date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: TIMEZONE,
  }).format(date);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — DASHBOARD OVERVIEW
// GET /api/v1/admin/dashboard
// ─────────────────────────────────────────────────────────────────────────────

export const getDashboardStats = handleAsyncError(async (req, res, next) => {
  const [counts, orderStats, categoryStats] = await Promise.all([
    // 1. Quick parallel counts
    Promise.all([
      Order.countDocuments({ isDeleted: false }),
      User.countDocuments({ role: "user", isDeleted: false }),
      Product.countDocuments({ isDeleted: { $ne: true } }),
    ]),

    // 2. Order status distribution & Total Revenue via single DB aggregation
    Order.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $facet: {
          statusCounts: [
            {
              $group: {
                _id: "$orderStatus",
                count: { $sum: 1 },
              },
            },
          ],
          revenue: [
            {
              $match: REVENUE_MATCH,
            },
            {
              $group: {
                _id: null,
                totalRevenue: {
                  $sum: "$totalPrice",
                },
                revenueOrderCount: {
                  $sum: 1,
                },
              },
            },
          ],
        },
      },
    ]),

    // 3. Revenue by Category (Snapshotted inside orderItems)
    Order.aggregate([
      {
        $match: REVENUE_MATCH,
      },
      {
        $unwind: "$orderItems",
      },
      {
        $group: {
          _id: "$orderItems.category",
          revenue: {
            $sum: {
              $multiply: ["$orderItems.price", "$orderItems.quantity"],
            },
          },
          quantity: {
            $sum: "$orderItems.quantity",
          },
        },
      },
      {
        $sort: {
          revenue: -1,
        },
      },
    ]),
  ]);

  const [totalOrders, totalCustomers, totalProducts] = counts;
  const revenueData = orderStats[0]?.revenue?.[0];
  const totalRevenue = revenueData?.totalRevenue || 0;
  const revenueOrderCount = revenueData?.revenueOrderCount || 0;
  const avgOrderValue =
    revenueOrderCount > 0
      ? Math.round(totalRevenue / revenueOrderCount)
      : 0;

  // ── Order status distribution ─────────────────────────────────────────────
  const statusDistribution = {
    Processing: 0,
    Confirmed: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  };

  (orderStats[0]?.statusCounts || []).forEach((item) => {
    if (
      item._id &&
      Object.prototype.hasOwnProperty.call(statusDistribution, item._id)
    ) {
      statusDistribution[item._id] = item.count;
    }
  });

  // ── Revenue by category ───────────────────────────────────────────────────
  const revenueByCategory = {};
  categoryStats.forEach((item) => {
    if (item._id) {
      revenueByCategory[item._id] = {
        revenue: item.revenue || 0,
        quantity: item.quantity || 0,
      };
    }
  });

  res.status(200).json({
    success: true,
    stats: {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      avgOrderValue,
      revenueOrderCount,
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
  const months = getMonths(req.query.months);
  const startDate = getStartDate(months);
  const endDate = new Date();

  const [monthlyStats, topProducts, categoryStats] = await Promise.all([
    // ── Monthly revenue and orders ──────────────────────────────────────────
    Order.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: {
                date: "$createdAt",
                timezone: TIMEZONE,
              },
            },
            month: {
              $month: {
                date: "$createdAt",
                timezone: TIMEZONE,
              },
            },
          },
          orders: {
            $sum: 1,
          },
          revenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$orderStatus", "Cancelled"] },
                    { $ne: ["$paymentInfo.status", "Refunded"] },
                    {
                      $or: [
                        { $eq: ["$paymentInfo.status", "Paid"] },
                        {
                          $and: [
                            { $eq: ["$paymentInfo.method", "COD"] },
                            { $eq: ["$orderStatus", "Delivered"] },
                          ],
                        },
                      ],
                    },
                  ],
                },
                "$totalPrice",
                0,
              ],
            },
          },
          revenueOrderCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$orderStatus", "Cancelled"] },
                    { $ne: ["$paymentInfo.status", "Refunded"] },
                    {
                      $or: [
                        { $eq: ["$paymentInfo.status", "Paid"] },
                        {
                          $and: [
                            { $eq: ["$paymentInfo.method", "COD"] },
                            { $eq: ["$orderStatus", "Delivered"] },
                          ],
                        },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]),

    // ── Top 5 products ──────────────────────────────────────────────────────
    Order.aggregate([
      {
        $match: {
          ...REVENUE_MATCH,
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $unwind: "$orderItems",
      },
      {
        $group: {
          _id: "$orderItems.product",
          name: {
            $first: "$orderItems.name",
          },
          category: {
            $first: "$orderItems.category",
          },
          quantity: {
            $sum: "$orderItems.quantity",
          },
          revenue: {
            $sum: {
              $multiply: ["$orderItems.price", "$orderItems.quantity"],
            },
          },
        },
      },
      {
        $sort: {
          quantity: -1,
          revenue: -1,
        },
      },
      {
        $limit: 5,
      },
      {
        $project: {
          _id: 0,
          product: "$_id",
          name: 1,
          category: 1,
          quantity: 1,
          revenue: 1,
        },
      },
    ]),

    // ── Category performance ────────────────────────────────────────────────
    Order.aggregate([
      {
        $match: {
          ...REVENUE_MATCH,
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $unwind: "$orderItems",
      },
      {
        $group: {
          _id: "$orderItems.category",
          quantity: {
            $sum: "$orderItems.quantity",
          },
          revenue: {
            $sum: {
              $multiply: ["$orderItems.price", "$orderItems.quantity"],
            },
          },
        },
      },
      {
        $sort: {
          revenue: -1,
        },
      },
    ]),
  ]);

  // ── Fill months with zero values ───────────────────────────────────────────
  const monthlyMap = new Map();
  monthlyStats.forEach((item) => {
    monthlyMap.set(getMonthKey(item._id.year, item._id.month), item);
  });

  const monthlyRevenue = [];
  const monthlyOrders = [];
  const monthlyRevenueOrderCount = [];

  for (let i = 0; i < months; i++) {
    const date = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth() + i,
        1
      )
    );

    const year = date.getUTCFullYear();
    const monthNumber = date.getUTCMonth() + 1;
    const data = monthlyMap.get(getMonthKey(year, monthNumber));
    const month = formatMonth(date);

    monthlyRevenue.push({
      month,
      revenue: data?.revenue || 0,
    });

    monthlyOrders.push({
      month,
      orders: data?.orders || 0,
    });

    monthlyRevenueOrderCount.push({
      month,
      orders: data?.revenueOrderCount || 0,
    });
  }

  // ── Category performance response ─────────────────────────────────────────
  const categoryPerformance = {};
  categoryStats.forEach((item) => {
    if (item._id) {
      categoryPerformance[item._id] = {
        quantity: item.quantity || 0,
        revenue: item.revenue || 0,
      };
    }
  });

  res.status(200).json({
    success: true,
    period: {
      months,
      timezone: TIMEZONE,
      startDate,
      endDate,
    },
    monthlyRevenue,
    monthlyOrders,
    monthlyRevenueOrderCount,
    topProducts,
    categoryPerformance,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — TOP 10 CUSTOMERS BY SPEND
// GET /api/v1/admin/customers/top
// ─────────────────────────────────────────────────────────────────────────────

export const getTopCustomers = handleAsyncError(async (req, res, next) => {
  const topCustomers = await Order.aggregate([
    {
      $match: REVENUE_MATCH,
    },
    {
      $group: {
        _id: "$user",
        totalSpent: {
          $sum: "$totalPrice",
        },
        orderCount: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        totalSpent: -1,
        orderCount: -1,
      },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $match: {
        "user.isDeleted": {
          $ne: true,
        },
      },
    },
    {
      $project: {
        _id: 0,
        user: {
          id: "$user._id",
          name: "$user.name",
          email: "$user.email",
        },
        orderCount: 1,
        totalSpent: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    topCustomers,
  });
});