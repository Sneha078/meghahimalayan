import mongoose from "mongoose";
import crypto from "crypto";//generate secure random number
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

// HELPERS

// Generates a human-readable order reference like "MH-XXXXXXXXXXXX"
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = crypto.randomInt(1000, 10000);
  return `MH-${timestamp}${random}`;
};

// Gets the actual selling price from the product.
// Frontend price is never trusted.
const getEffectivePrice = (product) =>
  product.discountPrice !== null &&
  product.discountPrice !== undefined &&
  product.discountPrice >= 0 &&
  product.discountPrice < product.price
    ? product.discountPrice
    : product.price;

// Checks whether a product can currently be purchased.
const isProductAvailable = (product) =>
  product && product.isDeleted !== true && product.isActive !== false;

// Calculates coupon discount on the server.
const calculateCouponDiscount = (coupon, itemsPrice) => {
  if (!coupon) return 0;

  let discount =
    coupon.type === "percentage"
      ? (itemsPrice * coupon.value) / 100
      : coupon.type === "flat"
        ? coupon.value
        : 0;

  if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined)
    discount = Math.min(discount, coupon.maxDiscount);

  return Math.round(Math.min(discount, itemsPrice));
};

// Validates coupon before applying it to an order.
const validateCoupon = async (couponCode, itemsPrice, session) => {
  if (!couponCode) return { coupon: null, discount: 0 };

  const normalizedCode = String(couponCode).trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true }).session(session);

  if (!coupon) throw new HandleError("Invalid or inactive coupon code", 400);

  if (coupon.expiresAt && coupon.expiresAt <= new Date())
    throw new HandleError("This coupon has expired", 400);

  if (
    coupon.usageLimit !== null &&
    coupon.usageLimit !== undefined &&
    coupon.usedCount >= coupon.usageLimit
  )
    throw new HandleError("This coupon has reached its usage limit", 400);

  if (itemsPrice < coupon.minOrder)
    throw new HandleError(
      `This coupon requires a minimum order of NPR ${coupon.minOrder}`,
      400
    );

  return {
    coupon,
    discount: calculateCouponDiscount(coupon, itemsPrice),
  };
};

// Shipping rules are intentionally not hard-coded.
// Add the client's actual shipping rules here when provided.
const calculateShippingPrice = () => 0;

// Tax rules are intentionally not taken from the client.
// Add the client's actual tax/VAT rules here when provided.
const calculateTaxPrice = () => 0;

// Validate shipping information before starting the database transaction.
const validateShippingInfo = (shippingInfo) => {
  if (!shippingInfo)
    throw new HandleError("Shipping information is required", 400);

  const requiredFields = ["name", "address", "city", "state", "pincode", "phoneNo"];

  for (const field of requiredFields) {
    if (
      typeof shippingInfo[field] !== "string" ||
      !shippingInfo[field].trim()
    )
      throw new HandleError(`Shipping field '${field}' is required`, 400);
  }

  if (shippingInfo.name.trim().length > 100)
    throw new HandleError("Shipping name is too long", 400);

  if (shippingInfo.address.trim().length > 300)
    throw new HandleError("Shipping address is too long", 400);

  if (shippingInfo.city.trim().length > 100)
    throw new HandleError("City name is too long", 400);

  if (shippingInfo.state.trim().length > 100)
    throw new HandleError("State name is too long", 400);

  // Nepal phone number validation.
  // Accepts numbers such as 9800000000 or +9779800000000.
  const phone = shippingInfo.phoneNo.trim().replace(/\s|-/g, "");

  if (!/^(?:\+977)?9[678]\d{8}$/.test(phone))
    throw new HandleError("Please provide a valid Nepal phone number", 400);

  // Nepal postal codes are generally numeric.
  if (!/^\d{5}$/.test(shippingInfo.pincode.trim()))
    throw new HandleError("Please provide a valid 5-digit pincode", 400);
};

// Check that the same product does not appear more than once
// in a single order.
const validateDuplicateProducts = (orderItems) => {
  const productIds = new Set();

  for (const item of orderItems) {
    if (!item.product) continue;

    const productId = String(item.product);

    if (productIds.has(productId))
      throw new HandleError(
        "The same product cannot appear more than once in an order",
        400
      );

    productIds.add(productId);
  }
};

// Add a status change to the order history.
const addStatusHistory = (order, status) => {
  order.statusHistory.push({ status, changedAt: new Date() });
};

// Pagination helper for large order collections.
const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

// CUSTOMER — CREATE ORDER
// POST /api/v1/order/new
export const createNewOrder = handleAsyncError(async (req, res, next) => {
  const { shippingInfo, orderItems, paymentInfo, couponCode } = req.body;

  try {
    validateShippingInfo(shippingInfo);

    if (!Array.isArray(orderItems) || orderItems.length === 0)
      throw new HandleError("Order must contain at least one item", 400);

    validateDuplicateProducts(orderItems);
  } catch (error) {
    return next(error);
  }

  const session = await mongoose.startSession();

  try {
    let createdOrder;

    await session.withTransaction(async () => {
      const verifiedItems = [];
      let itemsPrice = 0;

      for (const item of orderItems) {
        const quantity = Number(item.quantity);

        if (!item.product || !Number.isInteger(quantity) || quantity < 1)
          throw new HandleError(
            "Each order item must have a product ID and a valid quantity",
            400
          );

        if (!mongoose.Types.ObjectId.isValid(item.product))
          throw new HandleError(`Invalid product ID: ${item.product}`, 400);

        const product = await Product.findById(item.product).session(session);

        if (!product)
          throw new HandleError(`Product not found: ${item.product}`, 404);

        if (!isProductAvailable(product))
          throw new HandleError(
            `"${product.name}" is currently unavailable`,
            400
          );

        const unitPrice = getEffectivePrice(product);

        if (!Number.isFinite(unitPrice) || unitPrice < 0)
          throw new HandleError(`Invalid price for "${product.name}"`, 500);

        itemsPrice += unitPrice * quantity;

        verifiedItems.push({
          name: product.name,
          quantity,
          image: product.images?.[0]?.url || product.image?.[0]?.url || "",
          product: product._id,
          price: unitPrice,
        });
      }

      if (!Number.isFinite(itemsPrice) || itemsPrice < 0)
        throw new HandleError("Invalid order price", 400);

      let discount = 0;
      let appliedCoupon = "";

      if (couponCode) {
        const couponResult = await validateCoupon(couponCode, itemsPrice, session);

        discount = couponResult.discount;
        appliedCoupon = couponResult.coupon.code;

        // Increment coupon usage atomically.
        // This prevents usageLimit from being exceeded
        // when multiple customers use the same coupon.
        const couponFilter = {
          _id: couponResult.coupon._id,
          isActive: true,
        };

        if (
          couponResult.coupon.usageLimit !== null &&
          couponResult.coupon.usageLimit !== undefined
        ) {
          couponFilter.usedCount = {
            $lt: couponResult.coupon.usageLimit,
          };
        }

        const updatedCoupon = await Coupon.findOneAndUpdate(
          couponFilter,
          { $inc: { usedCount: 1 } },
          { new: true, session }
        );

        if (!updatedCoupon)
          throw new HandleError(
            "This coupon has reached its usage limit",
            400
          );
      }

      const shippingPrice = calculateShippingPrice({
        shippingInfo,
        itemsPrice,
      });

      const taxPrice = calculateTaxPrice({
        itemsPrice,
        discount,
        shippingInfo,
      });

      const totalPrice = Math.max(
        0,
        itemsPrice + taxPrice + shippingPrice - discount
      );

      if (!Number.isFinite(totalPrice))
        throw new HandleError("Unable to calculate order total", 400);

      // Payment status is NEVER trusted from the client.
      // Online payment must be verified by the backend
      // through the payment gateway before becoming "Paid".
      const paymentMethod = paymentInfo?.method || "COD";

      const allowedPaymentMethods = [
        "COD",
        "eSewa",
        "Khalti",
        "Card",
        "Other",
      ];

      if (!allowedPaymentMethods.includes(paymentMethod))
        throw new HandleError("Invalid payment method", 400);

      // Payment remains Pending until backend verification
      // is completed by the payment gateway integration.
      const paymentStatus = "Pending";

      // Deduct stock atomically.
      for (const item of verifiedItems) {
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );

        if (!updatedProduct)
          throw new HandleError(
            `Insufficient stock for "${item.name}"`,
            400
          );
      }

      // Generate a unique order number.
      // The unique index in MongoDB provides the final protection
      // against duplicate order numbers.
      let created = false;
      let attempts = 0;

      while (!created && attempts < 5) {
        attempts++;

        try {
          const order = await Order.create(
            [
              {
                orderNumber: generateOrderNumber(),

                shippingInfo: {
                  name: shippingInfo.name.trim(),
                  address: shippingInfo.address.trim(),
                  city: shippingInfo.city.trim(),
                  state: shippingInfo.state.trim(),
                  country: shippingInfo.country?.trim() || "Nepal",
                  pincode: shippingInfo.pincode.trim(),
                  phoneNo: shippingInfo.phoneNo.trim().replace(/\s|-/g, ""),
                },

                orderItems: verifiedItems,
                orderStatus: "Processing",

                statusHistory: [
                  { status: "Processing", changedAt: new Date() },
                ],

                paymentInfo: {
                  id: null,
                  method: paymentMethod,
                  status: paymentStatus,
                },

                paidAt: null,
                confirmedAt: null,
                shippedAt: null,
                cancelledAt: null,

                itemsPrice,
                taxPrice,
                shippingPrice,
                discount,
                couponCode: appliedCoupon,
                totalPrice,

                user: req.user._id,
                isDeleted: false,
              },
            ],
            { session }
          );

          createdOrder = order[0];
          created = true;
        } catch (error) {
          // Retry only if MongoDB reports a duplicate order number.
          if (error?.code === 11000 && attempts < 5) continue;
          throw error;
        }
      }

      if (!created)
        throw new HandleError(
          "Unable to generate a unique order number. Please try again.",
          500
        );
    });

    return res.status(201).json({
      success: true,
      order: createdOrder,
    });
  } finally {
    await session.endSession();
  }
});

// CUSTOMER — VIEW OWN ORDERS
// GET /api/v1/orders/me?page=1&limit=10
export const getMyOrders = handleAsyncError(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = {
    user: req.user._id,
    isDeleted: false,
  };

  const [orders, totalOrders] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    count: orders.length,
    totalOrders,
    totalPages: Math.ceil(totalOrders / limit),
    currentPage: page,
    limit,
    orders,
  });
});

// CUSTOMER — VIEW SINGLE ORDER
// GET /api/v1/order/:id
export const getMySingleOrder = handleAsyncError(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return next(new HandleError("Invalid order ID", 400));

  const order = await Order.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  if (!order)
    return next(new HandleError("Order not found", 404));

  if (order.user.toString() !== req.user._id.toString())
    return next(
      new HandleError("You are not authorised to view this order", 403)
    );

  return res.status(200).json({
    success: true,
    order,
  });
});

// CUSTOMER — CANCEL ORDER
// PUT /api/v1/order/:id/cancel
export const cancelMyOrder = handleAsyncError(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return next(new HandleError("Invalid order ID", 400));

  const session = await mongoose.startSession();

  try {
    let cancelledOrder;

    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: req.params.id,
        isDeleted: false,
      }).session(session);

      if (!order)
        throw new HandleError("Order not found", 404);

      if (order.user.toString() !== req.user._id.toString())
        throw new HandleError(
          "You are not authorised to cancel this order",
          403
        );

      if (["Shipped", "Delivered", "Cancelled"].includes(order.orderStatus))
        throw new HandleError(
          `Cannot cancel an order that is already ${order.orderStatus}`,
          400
        );

      // Restore stock atomically when an order is cancelled.
      for (const item of order.orderItems) {
        const restoredProduct = await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { session, new: true }
        );

        if (!restoredProduct)
          throw new HandleError(
            `Unable to restore stock for "${item.name}"`,
            500
          );
      }

      // Release coupon usage because the order was cancelled.
      if (order.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: order.couponCode,
            usedCount: { $gt: 0 },
          },
          { $inc: { usedCount: -1 } },
          { session }
        );
      }

      order.orderStatus = "Cancelled";
      order.cancelledAt = new Date();
      addStatusHistory(order, "Cancelled");

      // Do not mark a paid online order as refunded
      // until the payment gateway refund is actually completed.
      await order.save({ session });

      cancelledOrder = order;
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: cancelledOrder,
    });
  } finally {
    await session.endSession();
  }
});

// ADMIN — GET ALL ORDERS
// GET /api/v1/admin/orders?page=1&limit=10
export const getAllOrders = handleAsyncError(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = { isDeleted: false };

  const [orders, totalOrders, revenueResult] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
    Order.aggregate([
      {
        $match: {
          isDeleted: false,
          orderStatus: { $ne: "Cancelled" },
          "paymentInfo.status": "Paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]),
  ]);

  const totalRevenue = revenueResult[0]?.totalRevenue || 0;

  return res.status(200).json({
    success: true,
    count: orders.length,
    totalOrders,
    totalPages: Math.ceil(totalOrders / limit),
    currentPage: page,
    limit,
    totalRevenue,
    orders,
  });
});

// ADMIN — GET SINGLE ORDER
// GET /api/v1/admin/order/:id
export const getAdminSingleOrder = handleAsyncError(
  async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return next(new HandleError("Invalid order ID", 400));

    const order = await Order.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate("user", "name email phone");

    if (!order)
      return next(new HandleError("Order not found", 404));

    return res.status(200).json({
      success: true,
      order,
    });
  }
);

// ADMIN — UPDATE ORDER STATUS
// PUT /api/v1/admin/order/:id
export const updateOrderStatus = handleAsyncError(
  async (req, res, next) => {
    const { status } = req.body;

    const validStatuses = [
      "Processing",
      "Confirmed",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!status || !validStatuses.includes(status))
      return next(
        new HandleError(
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          400
        )
      );

    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return next(new HandleError("Invalid order ID", 400));

    const session = await mongoose.startSession();

    try {
      let updatedOrder;

      await session.withTransaction(async () => {
        const order = await Order.findOne({
          _id: req.params.id,
          isDeleted: false,
        }).session(session);

        if (!order)
          throw new HandleError("Order not found", 404);

        if (order.orderStatus === "Delivered")
          throw new HandleError(
            "This order has already been delivered",
            400
          );

        if (order.orderStatus === "Cancelled")
          throw new HandleError(
            "This order has already been cancelled",
            400
          );

        const allowedTransitions = {
          Processing: ["Confirmed", "Cancelled"],
          Confirmed: ["Shipped", "Cancelled"],
          Shipped: ["Delivered"],
        };

        if (!allowedTransitions[order.orderStatus]?.includes(status))
          throw new HandleError(
            `Cannot change order status from ${order.orderStatus} to ${status}`,
            400
          );

        if (status === "Cancelled") {
          // Restore stock atomically when admin cancels an order.
          for (const item of order.orderItems) {
            const restoredProduct = await Product.findByIdAndUpdate(
              item.product,
              { $inc: { stock: item.quantity } },
              { session, new: true }
            );

            if (!restoredProduct)
              throw new HandleError(
                `Unable to restore stock for "${item.name}"`,
                500
              );
          }

          // Release coupon usage for the cancelled order.
          if (order.couponCode) {
            await Coupon.findOneAndUpdate(
              {
                code: order.couponCode,
                usedCount: { $gt: 0 },
              },
              { $inc: { usedCount: -1 } },
              { session }
            );
          }

          order.orderStatus = "Cancelled";
          order.cancelledAt = new Date();
          addStatusHistory(order, "Cancelled");
        } else {
          order.orderStatus = status;
          addStatusHistory(order, status);
        }

        if (status === "Confirmed")
          order.confirmedAt = new Date();

        if (status === "Shipped")
          order.shippedAt = new Date();

        if (status === "Delivered") {
          order.deliveredAt = new Date();

          // COD becomes paid only when the order is delivered.
          if (
            order.paymentInfo.method === "COD" &&
            order.paymentInfo.status === "Pending"
          ) {
            order.paymentInfo.status = "Paid";
            order.paidAt = new Date();
          }
        }

        await order.save({ session });
        updatedOrder = order;
      });

      return res.status(200).json({
        success: true,
        order: updatedOrder,
      });
    } finally {
      await session.endSession();
    }
  }
);

// ADMIN — DELETE ORDER
// DELETE /api/v1/admin/order/:id
export const deleteOrder = handleAsyncError(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return next(new HandleError("Invalid order ID", 400));

  const order = await Order.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  if (!order)
    return next(new HandleError("Order not found", 404));

  if (!["Delivered", "Cancelled"].includes(order.orderStatus))
    return next(
      new HandleError(
        "Only Delivered or Cancelled orders can be deleted",
        400
      )
    );

  // Orders are business records.
  // Use soft delete instead of permanently removing the
  // order from the database for audit and reporting purposes.
  order.isDeleted = true;

  await order.save();

  return res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});