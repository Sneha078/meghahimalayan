import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

const TIMEZONE = "Asia/Kathmandu";
const MAX_MONTHS = 24;
const DEFAULT_MONTHS = 6;

// ─────────────────────────────────────────────────────────────────────────────
// REVENUE BUSINESS RULE
// ─────────────────────────────────────────────────────────────────────────────
//
// Online payment:
//   eSewa / Khalti / Card / Other
//   paymentInfo.status = "Paid"
//
// COD:
//   paymentInfo.method = "COD"
//   orderStatus = "Delivered"
//
// Excluded:
//   - Deleted orders
//   - Cancelled orders
//   - Refunded orders
//
// NOTE:
// This assumes paymentInfo.status is updated by the SERVER only after
// successful payment verification.
// ─────────────────────────────────────────────────────────────────────────────

const REVENUE_MATCH = {
  isDeleted: false,

  orderStatus: {
    $ne: "Cancelled",
  },

  "paymentInfo.status": {
    $ne: "Refunded",
  },

  $or: [
    // Online payment
    {
      "paymentInfo.status": "Paid",
    },

    // Cash on Delivery
    {
      "paymentInfo.method": "COD",
      orderStatus: "Delivered",
    },
  ],
};

// Same business rule expressed as an aggregation expression.
// Used inside $cond because REVENUE_MATCH cannot be directly reused there.
const REVENUE_CONDITION = {
  $and: [
    {
      $ne: ["$orderStatus", "Cancelled"],
    },
    {
      $ne: ["$paymentInfo.status", "Refunded"],
    },
    {
      $or: [
        // Online payment successfully paid
        {
          $eq: ["$paymentInfo.status", "Paid"],
        },

        // COD revenue is recognized only after delivery
        {
          $and: [
            {
              $eq: ["$paymentInfo.method", "COD"],
            },
            {
              $eq: ["$orderStatus", "Delivered"],
            },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getMonths = (value) => {
  // If query parameter is missing
  if (value === undefined || value === null || value === "") {
    return DEFAULT_MONTHS;
  }

  const months = Number(value);

  // Invalid value -> default
  if (!Number.isFinite(months)) {
    return DEFAULT_MONTHS;
  }

  // Prevent decimals and values outside allowed range
  return Math.min(
    Math.max(Math.floor(months), 1),
    MAX_MONTHS
  );
};

// Returns first day of the first requested month in UTC.
//
// Example:
// months = 6
// Current month = August
// Start = March 1
const getStartDate = (months) => {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - (months - 1),
      1,
      0,
      0,
      0,
      0
    )
  );
};

const getMonthKey = (year, month) => {
  return `${year}-${month}`;
};

const formatMonth = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: TIMEZONE,
  }).format(date);
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — DASHBOARD OVERVIEW
// GET /api/v1/admin/dashboard
// ─────────────────────────────────────────────────────────────────────────────

export const getDashboardStats = handleAsyncError(async (req, res) => {
  const [counts, orderStats, categoryStats] = await Promise.all([
    // ───────────────────────────────────────────────────────────────────────
    // 1. QUICK COUNTS
    // ───────────────────────────────────────────────────────────────────────

    Promise.all([
      // All non-deleted orders
      Order.countDocuments({
        isDeleted: false,
      }),

      // Only normal customers
      User.countDocuments({
        role: "user",
        isDeleted: false,
      }),

      // All active products
      Product.countDocuments({
        isDeleted: {
          $ne: true,
        },
      }),
    ]),

    // ───────────────────────────────────────────────────────────────────────
    // 2. ORDER STATUS + TOTAL REVENUE
    // ───────────────────────────────────────────────────────────────────────

    Order.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },

      {
        $facet: {
          // Order status distribution
          statusCounts: [
            {
              $group: {
                _id: "$orderStatus",
                count: {
                  $sum: 1,
                },
              },
            },
          ],

          // Recognized revenue
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

    // ───────────────────────────────────────────────────────────────────────
    // 3. REVENUE BY CATEGORY
    // ───────────────────────────────────────────────────────────────────────
    //
    // Uses snapshot information stored in orderItems.
    //
    // category revenue here means:
    // item price × quantity
    //
    // It does NOT allocate order-level discounts/shipping/tax across
    // individual categories.
    // ───────────────────────────────────────────────────────────────────────

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
              $multiply: [
                "$orderItems.price",
                "$orderItems.quantity",
              ],
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

  // ─────────────────────────────────────────────────────────────────────────
  // COUNTS
  // ─────────────────────────────────────────────────────────────────────────

  const [
    totalOrders,
    totalCustomers,
    totalProducts,
  ] = counts;

  // ─────────────────────────────────────────────────────────────────────────
  // REVENUE
  // ─────────────────────────────────────────────────────────────────────────

  const revenueData = orderStats?.[0]?.revenue?.[0];

  const totalRevenue = revenueData?.totalRevenue || 0;

  const revenueOrderCount =
    revenueData?.revenueOrderCount || 0;

  const avgOrderValue =
    revenueOrderCount > 0
      ? Math.round(totalRevenue / revenueOrderCount)
      : 0;

  // ─────────────────────────────────────────────────────────────────────────
  // ORDER STATUS DISTRIBUTION
  // ─────────────────────────────────────────────────────────────────────────

  const statusDistribution = {
    Processing: 0,
    Confirmed: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  };

  const statusCounts =
    orderStats?.[0]?.statusCounts || [];

  statusCounts.forEach((item) => {
    if (
      item?._id &&
      Object.prototype.hasOwnProperty.call(
        statusDistribution,
        item._id
      )
    ) {
      statusDistribution[item._id] = item.count;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // REVENUE BY CATEGORY
  // ─────────────────────────────────────────────────────────────────────────

  const revenueByCategory = {};

  categoryStats.forEach((item) => {
    if (!item?._id) return;

    revenueByCategory[item._id] = {
      revenue: item.revenue || 0,
      quantity: item.quantity || 0,
    };
  });

  // ─────────────────────────────────────────────────────────────────────────
  // RESPONSE
  // ─────────────────────────────────────────────────────────────────────────

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

export const getAnalytics = handleAsyncError(async (req, res) => {
  const months = getMonths(req.query.months);

  const startDate = getStartDate(months);

  const endDate = new Date();

  // ─────────────────────────────────────────────────────────────────────────
  // RUN ALL ANALYTICS IN PARALLEL
  // ─────────────────────────────────────────────────────────────────────────

  const [
    monthlyStats,
    topProducts,
    categoryStats,
  ] = await Promise.all([
    // ───────────────────────────────────────────────────────────────────────
    // 1. MONTHLY ORDERS + REVENUE
    // ───────────────────────────────────────────────────────────────────────

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

          // All non-deleted orders placed during the month.
          orders: {
            $sum: 1,
          },

          // Revenue-generating orders.
          revenueOrderCount: {
            $sum: {
              $cond: [
                REVENUE_CONDITION,
                1,
                0,
              ],
            },
          },

          // Recognized revenue.
          revenue: {
            $sum: {
              $cond: [
                REVENUE_CONDITION,
                "$totalPrice",
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

    // ───────────────────────────────────────────────────────────────────────
    // 2. TOP 5 PRODUCTS
    // ───────────────────────────────────────────────────────────────────────

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
              $multiply: [
                "$orderItems.price",
                "$orderItems.quantity",
              ],
            },
          },
        },
      },

      // Primary ranking = quantity sold
      // Secondary ranking = revenue
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

    // ───────────────────────────────────────────────────────────────────────
    // 3. CATEGORY PERFORMANCE
    // ───────────────────────────────────────────────────────────────────────

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
              $multiply: [
                "$orderItems.price",
                "$orderItems.quantity",
              ],
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

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE MONTH MAP
  // ─────────────────────────────────────────────────────────────────────────

  const monthlyMap = new Map();

  monthlyStats.forEach((item) => {
    const key = getMonthKey(
      item._id.year,
      item._id.month
    );

    monthlyMap.set(key, item);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FILL MISSING MONTHS WITH ZERO
  // ─────────────────────────────────────────────────────────────────────────

  const monthlyRevenue = [];
  const monthlyOrders = [];
  const monthlyRevenueOrders = [];

  for (let i = 0; i < months; i++) {
    const date = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth() + i,
        1
      )
    );

    const year = date.getUTCFullYear();

    const monthNumber =
      date.getUTCMonth() + 1;

    const key = getMonthKey(
      year,
      monthNumber
    );

    const data = monthlyMap.get(key);

    const month = formatMonth(date);

    // ───────────────────────────────────────────────────────────────────────
    // TOTAL ORDERS
    // ───────────────────────────────────────────────────────────────────────

    monthlyOrders.push({
      month,

      orders: data?.orders || 0,
    });

    // ───────────────────────────────────────────────────────────────────────
    // REVENUE
    // ───────────────────────────────────────────────────────────────────────

    monthlyRevenue.push({
      month,

      revenue: data?.revenue || 0,
    });

    // ───────────────────────────────────────────────────────────────────────
    // REVENUE-GENERATING ORDERS
    // ───────────────────────────────────────────────────────────────────────

    monthlyRevenueOrders.push({
      month,

      orders: data?.revenueOrderCount || 0,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CATEGORY PERFORMANCE RESPONSE
  // ─────────────────────────────────────────────────────────────────────────

  const categoryPerformance = {};

  categoryStats.forEach((item) => {
    if (!item?._id) return;

    categoryPerformance[item._id] = {
      quantity: item.quantity || 0,

      revenue: item.revenue || 0,
    };
  });

  // ─────────────────────────────────────────────────────────────────────────
  // RESPONSE
  // ─────────────────────────────────────────────────────────────────────────

  res.status(200).json({
    success: true,

    period: {
      months,

      timezone: TIMEZONE,

      startDate,

      endDate,
    },

    // Total recognized revenue by month
    monthlyRevenue,

    // All orders placed by month
    monthlyOrders,

    // Orders that actually generated recognized revenue
    monthlyRevenueOrders,

    // Top 5 products
    topProducts,

    // Category performance
    categoryPerformance,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — TOP 10 CUSTOMERS BY SPEND
// GET /api/v1/admin/customers/top
// ─────────────────────────────────────────────────────────────────────────────

export const getTopCustomers = handleAsyncError(async (req, res) => {
  const topCustomers = await Order.aggregate([
    // ───────────────────────────────────────────────────────────────────────
    // ONLY REVENUE-GENERATING ORDERS
    // ───────────────────────────────────────────────────────────────────────

    {
      $match: REVENUE_MATCH,
    },

    // ───────────────────────────────────────────────────────────────────────
    // GROUP BY CUSTOMER
    // ───────────────────────────────────────────────────────────────────────

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

    // Highest spending first
    {
      $sort: {
        totalSpent: -1,
        orderCount: -1,
      },
    },

    {
      $limit: 10,
    },

    // ───────────────────────────────────────────────────────────────────────
    // GET USER INFORMATION
    // ───────────────────────────────────────────────────────────────────────

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

    // Exclude deleted users from customer leaderboard
    {
      $match: {
        "user.isDeleted": {
          $ne: true,
        },
      },
    },

    // ───────────────────────────────────────────────────────────────────────
    // RESPONSE SHAPE
    // ───────────────────────────────────────────────────────────────────────

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