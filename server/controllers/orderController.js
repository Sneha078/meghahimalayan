import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Generates a human-readable order reference like "MH-831924"
const generateOrderNumber = () => {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return ` MH-${digits}`;
};

// Deducts stock for every item in the order.
// Throws HandleError (caught by handleAsyncError) if stock is insufficient.
// Called ONCE — at order creation — not on status updates.
const deductStock = async (orderItems) => {
  for (const item of orderItems) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new HandleError(`Product not found: ${item.product}`, 404);
    }

    if (product.stock < item.quantity) {
      throw new HandleError(
        `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        400
      );
    }

    product.stock -= item.quantity;
    await product.save();
  }
};

// Restores stock when an order is cancelled.
const restoreStock = async (orderItems) => {
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.stock += item.quantity;
      await product.save();
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — CREATE ORDER
// POST /api/v1/order/new
// ─────────────────────────────────────────────────────────────────────────────
// Security rules:
//   - Item prices are looked up from the DATABASE, never trusted from the client.
//   - Coupon discount is calculated on the server.
//   - Shipping is free above NPR 3,000 (server rule, not client).
//   - Total is always server-computed.

export const createNewOrder = handleAsyncError(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    couponCode,
    taxPrice,        // client may send 0; we accept and store it
  } = req.body;

  // ── Basic validation ──────────────────────────────────────────────────────
  if (!shippingInfo) {
    return next(new HandleError("Shipping information is required", 400));
  }

  const requiredShipping = ["name", "address", "city", "state", "pinCode", "phoneNo"];
  for (const field of requiredShipping) {
    if (!shippingInfo[field]) {
      return next(new HandleError(`Shipping field '${field}' is required`, 400));
    }
  }

  if (!orderItems || orderItems.length === 0) {
    return next(new HandleError("Order must contain at least one item", 400));
  }

  // ── Verify products and compute item total from DB prices ─────────────────
  const verifiedItems = [];
  let itemsPrice = 0;

  for (const item of orderItems) {
    if (!item.product || !item.quantity || item.quantity < 1) {
      return next(new HandleError("Each order item must have a product ID and a valid quantity", 400));
    }

    const product = await Product.findById(item.product);

    if (!product) {
      return next(new HandleError(`Product not found: ${item.product}`, 404));
    }

    if (product.stock < item.quantity) {
      return next(
        new HandleError(
          `Insufficient stock for "${product.name}". Available: ${product.stock}`,
          400
        )
      );
    }

    // Always use the DB price — discountPrice if set and lower, else price
    const unitPrice =
      product.discountPrice !== null &&
      product.discountPrice !== undefined &&
      product.discountPrice < product.price
        ? product.discountPrice
        : product.price;

    itemsPrice += unitPrice * item.quantity;

    verifiedItems.push({
      name:     product.name,
      quantity: item.quantity,
      image:    product.image?.[0]?.url || "",
      product:  product._id,
      price:    unitPrice,
    });
  }

  // ── Coupon ────────────────────────────────────────────────────────────────
  let discount = 0;
  let appliedCoupon = "";

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return next(new HandleError("Invalid or inactive coupon code", 400));
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return next(new HandleError("This coupon has expired", 400));
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return next(new HandleError("This coupon has reached its usage limit", 400));
    }

    if (itemsPrice < coupon.minOrder) {
      return next(
        new HandleError(
          `This coupon requires a minimum order of NPR ${coupon.minOrder}`,
          400
        )
      );
    }

    if (coupon.type === "percentage") {
      discount = (itemsPrice * coupon.value) / 100;
    } else {
      discount = coupon.value;
    }

    if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    discount = Math.round(discount);
    appliedCoupon = coupon.code;

    // Increment usage counter
    coupon.usedCount += 1;
    await coupon.save();
  }

  // ── Shipping ──────────────────────────────────────────────────────────────
  // Free shipping on orders >= NPR 3,000 after item total
  const shippingPrice = itemsPrice >= 3000 ? 0 : 150;

  // ── Tax ───────────────────────────────────────────────────────────────────
  // Accept tax from client (e.g. 0 for COD) but cap it — never trust
  // a huge number. For now Nepal has 13% VAT; set to 0 if not applicable.
  const resolvedTax = Number(taxPrice) || 0;

  // ── Final total ───────────────────────────────────────────────────────────
  const totalPrice = Math.max(0, itemsPrice + resolvedTax + shippingPrice - discount);

  // ── Deduct stock ──────────────────────────────────────────────────────────
  await deductStock(verifiedItems);

  // ── Create order ──────────────────────────────────────────────────────────
  const order = await Order.create({
    orderNumber:   generateOrderNumber(),
    shippingInfo: {
      name:    shippingInfo.name,
      address: shippingInfo.address,
      city:    shippingInfo.city,
      state:   shippingInfo.state,
      country: shippingInfo.country || "Nepal",
      pinCode: shippingInfo.pinCode,
      phoneNo: shippingInfo.phoneNo,
    },
    orderItems:   verifiedItems,
    paymentInfo: {
      id:     paymentInfo?.id     || "",
      method: paymentInfo?.method || "COD",
      status: paymentInfo?.status === "Paid" ? "Paid" : "Pending",
    },
    paidAt:       paymentInfo?.status === "Paid" ? new Date() : null,
    itemsPrice,
    taxPrice:     resolvedTax,
    shippingPrice,
    discount,
    couponCode:   appliedCoupon,
    totalPrice,
    user: req.user._id,
  });

  res.status(201).json({ success: true, order });
});

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — VIEW OWN ORDERS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/orders/me
export const getMyOrders = handleAsyncError(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id }).sort("-createdAt");

  // Return empty array — NOT 404 — when the user has no orders yet
  res.status(200).json({ success: true, count: orders.length, orders });
});

// GET /api/v1/order/:id  — customer can view their own order
export const getMySingleOrder = handleAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new HandleError("Order not found", 404));
  }

  // Customers may only view their own orders
  if (order.user.toString() !== req.user._id.toString()) {
    return next(new HandleError("You are not authorised to view this order", 403));
  }

  res.status(200).json({ success: true, order });
});

// PUT /api/v1/order/:id/cancel  — customer cancels their own order
export const cancelMyOrder = handleAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new HandleError("Order not found", 404));
  }

  if (order.user.toString() !== req.user._id.toString()) {
    return next(new HandleError("You are not authorised to cancel this order", 403));
  }

  // Only allow cancellation while the order has not been shipped
  const nonCancellable = ["Shipped", "Delivered", "Cancelled"];
  if (nonCancellable.includes(order.orderStatus)) {
    return next(
      new HandleError(
        `Cannot cancel an order that is already ${order.orderStatus}`,
        400
      )
    );
  }

  order.orderStatus = "Cancelled";

  // Restore stock for all items
  await restoreStock(order.orderItems);

  await order.save();

  res.status(200).json({ success: true, message: "Order cancelled successfully", order });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — ORDER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/admin/orders
export const getAllOrders = handleAsyncError(async (req, res, next) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .sort("-createdAt");

  const totalRevenue = orders
    .filter(
      (o) =>
        o.orderStatus !== "Cancelled" &&
        o.paymentInfo?.status === "Paid"
    )
    .reduce((sum, o) => sum + o.totalPrice, 0);

  res.status(200).json({
    success: true,
    count: orders.length,
    totalRevenue,
    orders,
  });
});

// GET /api/v1/admin/order/:id
export const getAdminSingleOrder = handleAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("user", "name email phone");

  if (!order) {
    return next(new HandleError("Order not found", 404));
  }

  res.status(200).json({ success: true, order });
});

// PUT /api/v1/admin/order/:id   — update order status
// Valid transitions:
//   Processing → Confirmed → Shipped → Delivered
//   Any non-Delivered → Cancelled  (admin can always cancel)
export const updateOrderStatus = handleAsyncError(async (req, res, next) => {
  const { status } = req.body;

  const validStatuses = ["Processing", "Confirmed", "Shipped", "Delivered", "Cancelled"];
  if (!status || !validStatuses.includes(status)) {
    return next(
      new HandleError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400)
    );
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new HandleError("Order not found", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new HandleError("This order has already been delivered", 400));
  }

  // If admin is cancelling, restore stock (only if not already cancelled)
  if (status === "Cancelled" && order.orderStatus !== "Cancelled") {
    await restoreStock(order.orderItems);
  }

  order.orderStatus = status;

  if (status === "Delivered") {
    order.deliveredAt = new Date();
    // Mark as paid if payment was COD
    if (order.paymentInfo.status === "Pending" && order.paymentInfo.method === "COD") {
      order.paymentInfo.status = "Paid";
      order.paidAt = new Date();
    }
  }

  await order.save();

  res.status(200).json({ success: true, order });
});

// DELETE /api/v1/admin/order/:id
// Admin may delete any order that is Delivered or Cancelled.
export const deleteOrder = handleAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new HandleError("Order not found", 404));
  }

  const deletable = ["Delivered", "Cancelled"];
  if (!deletable.includes(order.orderStatus)) {
    return next(
      new HandleError(
        "Only Delivered or Cancelled orders can be deleted",
        400
      )
    );
  }

  await Order.deleteOne({ _id: req.params.id });

  res.status(200).json({ success: true, message: "Order deleted successfully" });
});
