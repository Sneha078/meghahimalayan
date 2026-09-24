import mongoose from "mongoose";
import crypto from "crypto";

import { awardOrderPoints, calculateDiscount, spendPointsForOrder, refundPointsForOrder, POINTS_TO_RUPEE_RATE } from "../services/pointsService.js";

import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";
import User from "../models/userModel.js";

import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

import {
  sendOrderConfirmationEmail,
  sendAdminNewOrderEmail,
  sendOrderStatusEmail,
  sendOrderCancelledEmail,
} from "../services/emailService.js";

import { notifyAdmins } from "../services/notificationService.js";


// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Generates a human-readable order reference.
// Example: MH-1750000000000-A1B2C3D4
// Exported so other flows that create real Order documents — like reward
// redemption in rewardsController.js — use the same numbering scheme
// instead of duplicating this logic.
export const generateOrderNumber = () => {
  const timestamp = Date.now().toString();

  const random = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `MH-${timestamp}-${random}`;
};


// Gets the actual selling price from the database product.
// Frontend price is NEVER trusted.
// variant is optional — when supplied, its priceDelta is added on top,
// same rule cartController.js uses.
const getEffectivePrice = (product, variant = null) => {
  const hasDiscountPrice =
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    Number.isFinite(Number(product.discountPrice)) &&
    Number(product.discountPrice) >= 0 &&
    Number(product.discountPrice) < Number(product.price);

  const base = hasDiscountPrice
    ? Number(product.discountPrice)
    : Number(product.price);

  const delta = variant?.priceDelta ? Number(variant.priceDelta) || 0 : 0;

  return base + delta;
};


// Finds a variant sub-document on a product by its _id. Returns null if
// the product has no variants array, or the id doesn't match any entry.
const findVariant = (product, variantId) => {
  if (!variantId || !Array.isArray(product.variants)) return null;
  return (
    product.variants.find(
      (v) => v._id.toString() === variantId.toString()
    ) || null
  );
};


// Effective stock for an order line: variant stock when a variant is
// selected, otherwise the product's flat stock.
const getEffectiveStock = (product, variant) =>
  variant ? Number(variant.stock) || 0 : product.stock;


// Checks whether a product can currently be purchased.
const isProductAvailable = (product) =>
  product &&
  product.isDeleted !== true &&
  product.isActive !== false;


// Calculates coupon discount on the server.
const calculateCouponDiscount = (
  coupon,
  itemsPrice
) => {
  if (!coupon) {
    return 0;
  }

  let discount = 0;

  if (coupon.type === "percentage") {
    discount =
      (itemsPrice * Number(coupon.value)) / 100;
  } else if (coupon.type === "flat") {
    discount = Number(coupon.value);
  }

  if (Number(coupon.maxDiscount)) {
    discount = Math.min(
      discount,
      Number(coupon.maxDiscount)
    );
  }

  return Math.round(
    Math.min(
      Math.max(discount, 0),
      itemsPrice
    )
  );
};


// Validates coupon before applying it to an order.
const validateCoupon = async (
  couponCode,
  itemsPrice,
  session
) => {
  if (!couponCode) {
    return {
      coupon: null,
      discount: 0,
    };
  }

  const normalizedCode = String(couponCode)
    .trim()
    .toUpperCase();

  const coupon = await Coupon.findOne({
    code: normalizedCode,
    isActive: true,
  }).session(session);

  if (!coupon) {
    throw new HandleError(
      "Invalid or inactive coupon code",
      400
    );
  }

  if (
    coupon.expiresAt &&
    coupon.expiresAt <= new Date()
  ) {
    throw new HandleError(
      "This coupon has expired",
      400
    );
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usageLimit !== undefined &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    throw new HandleError(
      "This coupon has reached its usage limit",
      400
    );
  }

  if (
    itemsPrice < 
    Number(coupon.minOrder || 0)
  ) {
    throw new HandleError(
      `This coupon requires a minimum order of NPR ${coupon.minOrder}`,
      400
    );
  }

  return {
    coupon,
    discount: calculateCouponDiscount(
      coupon,
      itemsPrice
    ),
  };
};


// Keep shipping rules centralized.
// Must match the storefront promise: free over Rs. 5,000, otherwise Rs. 200.
const FREE_SHIPPING_THRESHOLD = 5000;
const SHIPPING_FEE = 200;

const calculateShippingPrice = ({ itemsPrice } = {}) => {
  const subtotal = Number(itemsPrice) || 0;

  return subtotal >= FREE_SHIPPING_THRESHOLD
    ? 0
    : SHIPPING_FEE;
};


// Keep tax rules centralized.
// Do not trust tax values from frontend.
const calculateTaxPrice = () => 0;


// ─────────────────────────────────────────────────────────────────────────────
// SHIPPING VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

// Exported so reward redemption (rewardsController.js) validates shipping
// info the same way checkout does, instead of duplicating these rules.
export const validateShippingInfo = (
  shippingInfo
) => {
  if (!shippingInfo) {
    throw new HandleError(
      "Shipping information is required",
      400
    );
  }

  const requiredFields = [
    "name",
    "address",
    "city",
    "state",
    "pincode",
    "phoneNo",
  ];

  for (const field of requiredFields) {
    if (
      typeof shippingInfo[field] !== "string" ||
      !shippingInfo[field].trim()
    ) {
      throw new HandleError(
        `Shipping field '${field}' is required`,
        400
      );
    }
  }

  if (
    shippingInfo.name.trim().length > 100
  ) {
    throw new HandleError(
      "Shipping name is too long",
      400
    );
  }

  if (
    shippingInfo.address.trim().length > 300
  ) {
    throw new HandleError(
      "Shipping address is too long",
      400
    );
  }

  if (
    shippingInfo.city.trim().length > 100
  ) {
    throw new HandleError(
      "City name is too long",
      400
    );
  }

  if (
    shippingInfo.state.trim().length > 100
  ) {
    throw new HandleError(
      "State name is too long",
      400
    );
  }

  // Nepal phone number.
  // Accepts:
  // 9800000000
  // +9779800000000
  const phone = shippingInfo.phoneNo
    .trim()
    .replace(/\s|-/g, "");

  if (!/^(?:\+977)?9[678]\d{8}$/.test(phone)) {
    throw new HandleError(
      "Please provide a valid Nepal phone number",
      400
    );
  }

  if (
    !/^\d{5}$/.test(
      shippingInfo.pincode.trim()
    )
  ) {
    throw new HandleError(
      "Please provide a valid 5-digit pincode",
      400
    );
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// ORDER ITEM VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

// Two order lines can share a product ID only if they're different color
// variants of it — same rule cartController.js's line-merge logic follows.
// A plain product (no variant) still can't repeat.
const validateDuplicateProducts = (
  orderItems
) => {
  const seen = new Set();

  for (const item of orderItems) {
    if (!item.product) {
      throw new HandleError(
        "Product ID is required",
        400
      );
    }

    const variantKey = item.variant?.variantId
      ? String(item.variant.variantId)
      : "";

    const key = `${String(item.product)}::${variantKey}`;

    if (seen.has(key)) {
      throw new HandleError(
        "The same product cannot appear more than once in an order",
        400
      );
    }

    seen.add(key);
  }
};

//Add a status change to the order history.
const addStatusHistory = (order, status, changedBy = null, note = '') => {
  order.statusHistory.push({
    status,
    changedAt: new Date(),
    changedBy,
    note: note.trim().slice(0, 500),
  });
};


// Restores stock for one order item — variant stock (and the product's
// flat stock, kept in sync) when the item had a variant, otherwise just
// the flat stock. Used by both customer cancellation and admin
// cancellation, so the two paths can't drift apart.
const restoreStockForItem = async (item, session) => {
  if (item.variant?.variantId) {
    const updated = await Product.findOneAndUpdate(
      {
        _id: item.product,
        "variants._id": item.variant.variantId,
      },
      {
        $inc: {
          "variants.$[v].stock": item.quantity,
          stock: item.quantity,
        },
      },
      {
        arrayFilters: [{ "v._id": item.variant.variantId }],
        new: true,
        session,
      }
    );

    if (!updated) {
      throw new HandleError(
        `Unable to restore stock for "${item.name}"`,
        500
      );
    }

    return;
  }

  const product = await Product.findOneAndUpdate(
    { _id: item.product },
    { $inc: { stock: item.quantity } },
    { new: true, session }
  );

  if (!product) {
    throw new HandleError(
      `Unable to restore stock for "${item.name}"`,
      500
    );
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

const getPagination = (query) => {
  const page = Math.max(
    parseInt(query.page, 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      parseInt(query.limit, 10) || 100,
      1
    ),
    500
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};


// ─────────────────────────────────────────────────────────────────────────────
// EMAIL DISPATCH
// IMPORTANT:
// Emails are sent ONLY after the MongoDB transaction commits.
// Email failures NEVER fail the order/status request.
// ─────────────────────────────────────────────────────────────────────────────

const dispatchOrderEmails = async (
  order
) => {
  try {
    const userId = order.user?._id || order.user;
    let customer = null;
    if (userId) {
      customer = await User.findById(userId)
        .select("name email phone")
        .lean();
    }

    const recipientEmail = customer?.email || order.shippingInfo?.email;
    const recipientName = customer?.name || order.shippingInfo?.name || "Customer";

    if (!recipientEmail) {
      console.error(
        `Customer email missing for order ${order.orderNumber}`
      );
      return;
    }

    const recipientUser = {
      _id: userId,
      name: recipientName,
      email: recipientEmail,
    };

    // Customer confirmation email.
    void sendOrderConfirmationEmail(
      order,
      recipientUser
    ).catch((err) => {
      console.error(
        `Order confirmation email failed for ${order.orderNumber}:`,
        err?.message || err
      );
    });

    // Admin notification.
    if (
      process.env.EMAIL_ADMIN_NOTIFY !==
      "false"
    ) {
      void sendAdminNewOrderEmail(
        order,
        recipientUser
      ).catch((err) => {
        console.error(
          `Admin new-order email failed for ${order.orderNumber}:`,
          err?.message || err
        );
      });
    }
  } catch (err) {
    console.error(
      `Failed to prepare order emails for ${order.orderNumber}:`,
      err?.message || err
    );
  }
};


// Sends customer email for supported status changes.
export const dispatchOrderStatusEmail = async (
  order,
  status
) => {
  const emailStatuses = [
    "Confirmed",
    "Shipped",
    "Delivered",
  ];

  if (!emailStatuses.includes(status)) {
    return;
  }

  try {
    const userId = order.user?._id || order.user;
    let customer = null;
    if (userId) {
      customer = await User.findById(userId)
        .select("name email phone")
        .lean();
    }

    const recipientEmail = customer?.email || order.shippingInfo?.email;
    const recipientName = customer?.name || order.shippingInfo?.name || "Customer";

    if (!recipientEmail) {
      console.error(
        `Cannot send status email for order ${order.orderNumber}: recipient email missing`
      );
      return;
    }

    const recipientUser = {
      _id: userId,
      name: recipientName,
      email: recipientEmail,
    };

    await sendOrderStatusEmail(
      order,
      recipientUser,
      status
    );
  } catch (err) {
    console.error(
      `Order status email failed for ${order.orderNumber} (${status}):`,
      err?.message || err
    );
  }
};


// Sends the customer email when an order is cancelled
// (customer-initiated or admin-initiated).
const dispatchOrderCancelledEmail = async (
  order
) => {
  try {
    const customer = await User.findById(
      order.user
    )
      .select("name email phone")
      .lean();

    if (!customer) {
      console.error(
        `Customer not found for cancellation email: ${order.orderNumber}`
      );

      return;
    }

    await sendOrderCancelledEmail(
      order,
      customer
    );
  } catch (err) {
    console.error(
      `Order cancellation email failed for ${order.orderNumber}:`,
      err?.message || err
    );
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — CREATE ORDER
// POST /api/v1/order/new
// ─────────────────────────────────────────────────────────────────────────────

export const createNewOrder =
  handleAsyncError(
    async (req, res, next) => {
      const {
        shippingInfo,
        orderItems,
        paymentInfo,
        couponCode,
        pointsToRedeem,
      } = req.body;

      // Validate before starting transaction.
      validateShippingInfo(
        shippingInfo
      );

      if (
        !Array.isArray(orderItems) ||
        orderItems.length === 0
      ) {
        throw new HandleError(
          "Order must contain at least one item",
          400
        );
      }

      validateDuplicateProducts(
        orderItems
      );

      // Never trust frontend payment status.
      const allowedPaymentMethods = [
        "COD",
        "eSewa",
        "Khalti",
        "Card",
        "Other",
      ];

      const paymentMethod =
        paymentInfo?.method || "COD";

      if (
        !allowedPaymentMethods.includes(
          paymentMethod
        )
      ) {
        throw new HandleError(
          "Invalid payment method",
          400
        );
      }

      const session =
        await mongoose.startSession();

      try {
        let createdOrder;

        await session.withTransaction(
          async () => {
            const verifiedItems = [];

            let itemsPrice = 0;

            // ─────────────────────────────
            // VERIFY PRODUCTS
            // ─────────────────────────────

            for (const item of orderItems) {
              const quantity = Number(
                item.quantity
              );

              if (
                !item.product ||
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                quantity > 100
              ) {
                throw new HandleError(
                  "Each order item must have a valid product ID and quantity between 1 and 100",
                  400
                );
              }

              if (
                !mongoose.Types.ObjectId.isValid(
                  item.product
                )
              ) {
                throw new HandleError(
                  `Invalid product ID: ${item.product}`,
                  400
                );
              }

              const product =
                await Product.findById(
                  item.product
                ).session(session);

              if (!product) {
                throw new HandleError(
                  "Product not found",
                  404
                );
              }

              if (
                !isProductAvailable(product)
              ) {
                throw new HandleError(
                  `"${product.name}" is currently unavailable`,
                  400
                );
              }

              // ── Resolve variant (if the product has any) ──
              // Only variantId is trusted from the client — color,
              // colorHex, image are always re-read from the product so a
              // stale/tampered client value can't misrepresent what was
              // actually purchased.
              let variant = null;
              let variantSnapshot = null;

              if (
                Array.isArray(product.variants) &&
                product.variants.length > 0
              ) {
                const variantId = item.variant?.variantId;

                if (!variantId) {
                  throw new HandleError(
                    `Please select a color for "${product.name}"`,
                    400
                  );
                }

                if (
                  !mongoose.Types.ObjectId.isValid(variantId)
                ) {
                  throw new HandleError(
                    "Invalid variant selected",
                    400
                  );
                }

                variant = findVariant(product, variantId);

                if (!variant) {
                  throw new HandleError(
                    `Selected color is no longer available for "${product.name}"`,
                    400
                  );
                }

                variantSnapshot = {
                  variantId: variant._id,
                  color: variant.color,
                  colorHex: variant.colorHex || "",
                  image: variant.images?.[0]
                    ? {
                        public_id: variant.images[0].public_id,
                        url: variant.images[0].url,
                      }
                    : { public_id: "", url: "" },
                };
              }

              const effectiveStock = getEffectiveStock(
                product,
                variant
              );

              if (quantity > effectiveStock) {
                throw new HandleError(
                  `Insufficient stock for "${product.name}"${variant ? ` in ${variant.color}` : ""}`,
                  400
                );
              }

              const unitPrice =
                getEffectivePrice(product, variant);

              if (
                !Number.isFinite(unitPrice) ||
                unitPrice < 0
              ) {
                throw new HandleError(
                  `Invalid price for "${product.name}"`,
                  500
                );
              }

              itemsPrice +=
                unitPrice * quantity;

              verifiedItems.push({
                name: product.name,

                category:
                  product.category,

                quantity,

                image:
                  variant?.images?.[0]?.url ||
                  product.images?.[0]?.url ||
                  product.image?.[0]?.url ||
                  "",

                product: product._id,

                price: unitPrice,

                variant: variantSnapshot,

                prescription: item.prescription ?? null,
              });
            }

            if (
              !Number.isFinite(itemsPrice) ||
              itemsPrice < 0
            ) {
              throw new HandleError(
                "Invalid order price",
                400
              );
            }

            // ─────────────────────────────
            // COUPON
            // ─────────────────────────────

            let discount = 0;
            let appliedCoupon = "";

            if (couponCode) {
              const couponResult =
                await validateCoupon(
                  couponCode,
                  itemsPrice,
                  session
                );

              discount =
                couponResult.discount;

              appliedCoupon =
                couponResult.coupon.code;

              const couponFilter = {
                _id:
                  couponResult.coupon._id,

                isActive: true,
              };

              /*
               * Atomic usage-limit protection.
               */
              if (
                couponResult.coupon
                  .usageLimit !== null &&
                couponResult.coupon
                  .usageLimit !== undefined
              ) {
                couponFilter.usedCount = {
                  $lt:
                    couponResult.coupon
                      .usageLimit,
                };
              }

              const updatedCoupon =
                await Coupon.findOneAndUpdate(
                  couponFilter,
                  {
                    $inc: {
                      usedCount: 1,
                    },
                  },
                  {
                    new: true,
                    session,
                  }
                );

              if (!updatedCoupon) {
                throw new HandleError(
                  "This coupon has reached its usage limit",
                  400
                );
              }
            }

            // ─────────────────────────────
            // POINTS DISCOUNT
            // ─────────────────────────────
            //
            // Computed server-side only — never trust a discount amount
            // sent by the frontend. calculateDiscount() caps this at
            // MAX_DISCOUNT_PERCENT of itemsPrice (currently 20%), so a
            // customer can never zero out an order using only points.
            //
            // pointsUsed is derived FROM the (possibly capped) discount,
            // not the other way around — so if the requested points would
            // exceed the cap, we only spend the points that correspond to
            // the discount actually given, not all requested points.
            // ─────────────────────────────

            const requestedPoints = Math.max(
              0,
              Math.floor(Number(pointsToRedeem) || 0)
            );

            let pointsDiscount = 0;
            let pointsUsed = 0;

            if (requestedPoints > 0) {
              const rawDiscount = calculateDiscount(
                requestedPoints,
                itemsPrice
              );

              pointsUsed = Math.min(
                requestedPoints,
                Math.ceil(rawDiscount / POINTS_TO_RUPEE_RATE)
              );

              pointsDiscount = Math.round(
                pointsUsed * POINTS_TO_RUPEE_RATE
              );
            }

            // ─────────────────────────────
            // SHIPPING + TAX
            // ─────────────────────────────

            const shippingPrice =
              calculateShippingPrice({
                shippingInfo,
                itemsPrice,
              });

            const taxPrice =
              calculateTaxPrice({
                itemsPrice,
                discount,
                shippingInfo,
              });

            const totalPrice = Math.max(
              0,
              itemsPrice +
                taxPrice +
                shippingPrice -
                discount -
                pointsDiscount
            );

            if (
              !Number.isFinite(
                totalPrice
              )
            ) {
              throw new HandleError(
                "Unable to calculate order total",
                400
              );
            }

            // ─────────────────────────────
            // STOCK DEDUCTION
            // ─────────────────────────────

            for (const item of verifiedItems) {
              if (item.variant?.variantId) {
                const updatedProduct =
                  await Product.findOneAndUpdate(
                    {
                      _id: item.product,

                      isDeleted: {
                        $ne: true,
                      },

                      isActive: {
                        $ne: false,
                      },

                      variants: {
                        $elemMatch: {
                          _id: item.variant.variantId,
                          stock: { $gte: item.quantity },
                        },
                      },
                    },
                    {
                      $inc: {
                        "variants.$[v].stock": -item.quantity,
                        stock: -item.quantity,
                      },
                    },
                    {
                      arrayFilters: [
                        { "v._id": item.variant.variantId },
                      ],
                      new: true,
                      session,
                    }
                  );

                if (!updatedProduct) {
                  throw new HandleError(
                    `Insufficient stock for "${item.name}" in ${item.variant.color}`,
                    400
                  );
                }

                continue;
              }

              const updatedProduct =
                await Product.findOneAndUpdate(
                  {
                    _id: item.product,

                    isDeleted: {
                      $ne: true,
                    },

                    isActive: {
                      $ne: false,
                    },

                    stock: {
                      $gte: item.quantity,
                    },
                  },
                  {
                    $inc: {
                      stock:
                        -item.quantity,
                    },
                  },
                  {
                    new: true,
                    session,
                  }
                );

              if (!updatedProduct) {
                throw new HandleError(
                  `Insufficient stock for "${item.name}"`,
                  400
                );
              }
            }

            // ─────────────────────────────
            // PAYMENT
            // ─────────────────────────────

            /*
             * NEVER trust paymentInfo.status
             * from the frontend.
             *
             * Actual online payment verification
             * must happen through the payment gateway.
             */
            const paymentStatus =
              "Pending";

            // ─────────────────────────────
            // CREATE ORDER
            // ─────────────────────────────

            const order =
              new Order({
                orderNumber:
                  generateOrderNumber(),

                shippingInfo: {
                  name:
                    shippingInfo.name.trim(),

                  address:
                    shippingInfo.address.trim(),

                  city:
                    shippingInfo.city.trim(),

                  state:
                    shippingInfo.state.trim(),

                  pincode:
                    shippingInfo.pincode.trim(),

                  phoneNo:
                    shippingInfo.phoneNo
                      .trim()
                      .replace(
                        /\s|-/g,
                        ""
                      ),
                },

                orderItems:
                  verifiedItems,

                orderStatus:
                  "Processing",

                statusHistory: [
                  {
                    status:
                      "Processing",

                    changedAt:
                      new Date(),
                  },
                ],

                user:
                  req.user._id,

                paymentInfo: {
                  id: null,

                  method:
                    paymentMethod,

                  status:
                    paymentStatus,
                },

                paidAt: null,

                confirmedAt: null,

                shippedAt: null,

                cancelledAt: null,

                deliveredAt: null,

                refundedAt: null,

                itemsPrice,

                taxPrice,

                shippingPrice,

                discount,

                couponCode:
                  appliedCoupon,

                pointsRedeemed:
                  pointsUsed,

                pointsDiscount,

                totalPrice,

                isDeleted: false,
              });

            await order.save({
              session,
            });

            // Spend the points atomically as part of THIS transaction —
            // if anything above fails, this never runs; if this fails
            // (e.g. balance changed underneath us), everything above rolls
            // back too. See spendPointsForOrder() in pointsService.js.
            if (pointsUsed > 0) {
              try {
                await spendPointsForOrder(
                  req.user._id,
                  pointsUsed,
                  order._id,
                  session
                );
              } catch (err) {
                throw new HandleError(
                  err.message || "Unable to apply points discount",
                  err.status || 400
                );
              }
            }

            createdOrder = order;
          }
        );

        /*
         * IMPORTANT:
         *
         * The transaction has successfully
         * committed at this point.
         *
         * Emails cannot roll back the order,
         * so they are intentionally dispatched
         * after the transaction.
         *
         * NOTE: reward points are NOT awarded here.
         * A new order is always created with
         * orderStatus "Processing" — points are
         * only awarded once the order actually
         * reaches "Delivered", which is handled
         * in updateOrderStatus below.
         */
        void dispatchOrderEmails(
          createdOrder
        );

        void notifyAdmins({
          type: "ORDER",
          title: "New Order Received",
          message: `${createdOrder.orderNumber} — NPR ${createdOrder.totalPrice}`,
          data: {
            orderId: createdOrder._id,
            orderNumber: createdOrder.orderNumber,
            totalAmount: createdOrder.totalPrice,
          },
        });

        return res.status(201).json({
          success: true,
          order: createdOrder,
        });
      } finally {
        await session.endSession();
      }
    }
  );


// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — VIEW MY ORDERS
// GET /api/v1/orders/me?page=1&limit=10
// ─────────────────────────────────────────────────────────────────────────────

export const getMyOrders =
  handleAsyncError(
    async (req, res) => {
      const {
        page,
        limit,
        skip,
      } = getPagination(req.query);

      const filter = {
        user: req.user._id,
        isDeleted: false,
      };

      const [
        orders,
        totalOrders,
      ] = await Promise.all([
        Order.find(filter)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Order.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,

        count:
          orders.length,

        totalOrders,

        totalPages:
          Math.ceil(
            totalOrders / limit
          ),

        currentPage:
          page,

        limit,

        orders,
      });
    }
  );


// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — VIEW SINGLE ORDER
// GET /api/v1/order/:id
// ─────────────────────────────────────────────────────────────────────────────

export const getMySingleOrder =
  handleAsyncError(
    async (req, res, next) => {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return next(
          new HandleError(
            "Invalid order ID",
            400
          )
        );
      }

      const order =
        await Order.findOne({
          _id: req.params.id,

          user:
            req.user._id,

          isDeleted: false,
        }).lean();

      if (!order) {
        return next(
          new HandleError(
            "Order not found",
            404
          )
        );
      }

      return res.status(200).json({
        success: true,
        order,
      });
    }
  );


// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — CANCEL ORDER
// PUT /api/v1/order/:id/cancel
// ─────────────────────────────────────────────────────────────────────────────

export const cancelMyOrder =
  handleAsyncError(
    async (req, res, next) => {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return next(
          new HandleError(
            "Invalid order ID",
            400
          )
        );
      }

      const session =
        await mongoose.startSession();

      try {
        let cancelledOrder;

        await session.withTransaction(
          async () => {
            const order =
              await Order.findOne({
                _id: req.params.id,

                user:
                  req.user._id,

                isDeleted: false,
              }).session(session);

            if (!order) {
              throw new HandleError(
                "Order not found",
                404
              );
            }

            if (
              [
                "Shipped",
                "Delivered",
                "Cancelled",
              ].includes(
                order.orderStatus
              )
            ) {
              throw new HandleError(
                `Cannot cancel an order that is already ${order.orderStatus}`,
                400
              );
            }

            // ─────────────────────────
            // RESTORE STOCK
            // ─────────────────────────

            for (const item of order.orderItems) {
              await restoreStockForItem(item, session);
            }

            // ─────────────────────────
            // RELEASE COUPON
            // ─────────────────────────

            if (order.couponCode) {
              await Coupon.findOneAndUpdate(
                {
                  code:
                    order.couponCode,

                  usedCount: {
                    $gt: 0,
                  },
                },
                {
                  $inc: {
                    usedCount: -1,
                  },
                },
                {
                  session,
                }
              );
            }

            // ─────────────────────────
            // CANCEL ORDER
            // ─────────────────────────

            order.orderStatus =
              "Cancelled";

            order.cancelledAt =
              new Date();

          addStatusHistory(
            order,
            "Cancelled",
            req.user._id,
            'Order cancelled by customer'
          );

            /*
             * Do not mark online payments
             * as refunded here.
             *
             * Actual gateway refund must
             * happen separately.
             */

            await order.save({
              session,
            });

            // Return any points spent as a checkout discount on this
            // order — same transaction, so it rolls back together with
            // everything else above if anything fails.
            if (order.pointsRedeemed > 0) {
              await refundPointsForOrder(order._id, session);
            }

            cancelledOrder =
              order;
          }
        );

        /*
         * MongoDB transaction has committed.
         *
         * Send the customer cancellation
         * email. Actual gateway refund is
         * handled separately.
         */
        void dispatchOrderCancelledEmail(
          cancelledOrder
        );

        void notifyAdmins({
          type: "ORDER",
          title: "Order Cancelled by Customer",
          message: `${cancelledOrder.orderNumber} was cancelled by the customer`,
          data: {
            orderId: cancelledOrder._id,
            orderNumber: cancelledOrder.orderNumber,
          },
        });

        return res.status(200).json({
          success: true,

          message:
            "Order cancelled successfully",

          order:
            cancelledOrder,
        });
      } finally {
        await session.endSession();
      }
    }
  );


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — GET ALL ORDERS
// GET /api/v1/admin/orders?page=1&limit=10
// ─────────────────────────────────────────────────────────────────────────────

export const getAllOrders =
  handleAsyncError(
    async (req, res) => {
      const {
        page,
        limit,
        skip,
      } = getPagination(req.query);

      const filter = {
        isDeleted: false,
      };

      const [
        orders,
        totalOrders,
        revenueResult,
      ] = await Promise.all([
        Order.find(filter)
          .populate(
            "user",
            "name email"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Order.countDocuments(filter),

        Order.aggregate([
          {
            $match: {
              isDeleted: false,

              orderStatus: {
                $ne: "Cancelled",
              },

              "paymentInfo.status": {
                $ne: "Refunded",
              },

              $or: [
                {
                  "paymentInfo.status":
                    "Paid",
                },

                {
                  "paymentInfo.method":
                    "COD",

                  orderStatus:
                    "Delivered",
                },
              ],
            },
          },

          {
            $group: {
              _id: null,

              totalRevenue: {
                $sum: "$totalPrice",
              },
            },
          },
        ]),
      ]);

      const totalRevenue =
        revenueResult[0]
          ?.totalRevenue || 0;

      return res.status(200).json({
        success: true,

        count:
          orders.length,

        totalOrders,

        totalPages:
          Math.ceil(
            totalOrders / limit
          ),

        currentPage:
          page,

        limit,

        totalRevenue,

        orders,
      });
    }
  );


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — GET SINGLE ORDER
// GET /api/v1/admin/order/:id
// ─────────────────────────────────────────────────────────────────────────────

export const getAdminSingleOrder =
  handleAsyncError(
    async (req, res, next) => {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return next(
          new HandleError(
            "Invalid order ID",
            400
          )
        );
      }

      const order =
        await Order.findOne({
          _id: req.params.id,

          isDeleted: false,
        })
          .populate(
            "user",
            "name email phone"
          )
          .lean();

      if (!order) {
        return next(
          new HandleError(
            "Order not found",
            404
          )
        );
      }

      return res.status(200).json({
        success: true,
        order,
      });
    }
  );


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — UPDATE ORDER STATUS
// PUT /api/v1/admin/order/:id
// ─────────────────────────────────────────────────────────────────────────────

export const updateOrderStatus =
  handleAsyncError(async (req, res, next) => {
    const { status, note= '' } = req.body;

      const validStatuses = [
        "Processing",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ];

      if (
        !status ||
        !validStatuses.includes(status)
      ) {
        return next(
          new HandleError(
            `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
            400
          )
        );
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return next(
          new HandleError(
            "Invalid order ID",
            400
          )
        );
      }

      const session =
        await mongoose.startSession();

      try {
        let updatedOrder;
        let previousStatus;

        await session.withTransaction(
          async () => {
            const order =
              await Order.findOne({
                _id: req.params.id,

                isDeleted: false,
              }).session(session);

            if (!order) {
              throw new HandleError(
                "Order not found",
                404
              );
            }

            if (
              order.orderStatus ===
              "Delivered"
            ) {
              throw new HandleError(
                "This order has already been delivered",
                400
              );
            }

            if (
              order.orderStatus ===
              "Cancelled"
            ) {
              throw new HandleError(
                "This order has already been cancelled",
                400
              );
            }

            // ─────────────────────────
            // ALLOWED TRANSITIONS
            // ─────────────────────────

            const allowedTransitions = {
              Processing: [
                "Confirmed",
                "Cancelled",
              ],

              Confirmed: [
                "Shipped",
                "Cancelled",
              ],

              Shipped: [
                "Delivered",
              ],
            };

            if (
              !allowedTransitions[
                order.orderStatus
              ]?.includes(status)
            ) {
              throw new HandleError(
                `Cannot change order status from ${order.orderStatus} to ${status}`,
                400
              );
            }

            previousStatus =
              order.orderStatus;

            // ─────────────────────────
            // ADMIN CANCELLATION
            // ─────────────────────────

            if (
              status === "Cancelled"
            ) {
              // Restore stock.
              for (
                const item of
                  order.orderItems
              ) {
                await restoreStockForItem(item, session);
              }

              // Release coupon usage.
              if (
                order.couponCode
              ) {
                await Coupon.findOneAndUpdate(
                  {
                    code:
                      order.couponCode,

                    usedCount: {
                      $gt: 0,
                    },
                  },

                  {
                    $inc: {
                      usedCount: -1,
                    },
                  },

                  {
                    session,
                  }
                );
              }

              order.orderStatus =
                "Cancelled";

              order.cancelledAt =
                new Date();

            addStatusHistory(
              order,
              "Cancelled",
              req.user._id,
              'Order cancelled by admin'
            );
          } else {
            order.orderStatus = status;

            addStatusHistory(
              order,
              status,
              req.user?._id, note
            );
          }

            // ─────────────────────────
            // STATUS TIMESTAMPS
            // ─────────────────────────

            if (
              status === "Confirmed"
            ) {
              order.confirmedAt =
                new Date();
            }

            if (
              status === "Shipped"
            ) {
              order.shippedAt =
                new Date();
            }

            if (
              status === "Delivered"
            ) {
              order.deliveredAt =
                new Date();

              /*
               * COD payment becomes Paid
               * only after delivery.
               */
              if (
                order.paymentInfo?.method ===
                  "COD" &&
                order.paymentInfo?.status ===
                  "Pending"
              ) {
                order.paymentInfo.status =
                  "Paid";

                order.paidAt =
                  new Date();
              }
            }

            await order.save({
              session,
            });

            // Return any points spent as a checkout discount on this
            // order, if an admin is cancelling it — same transaction as
            // the stock/coupon restoration above.
            if (
              status === "Cancelled" &&
              order.pointsRedeemed > 0
            ) {
              await refundPointsForOrder(order._id, session);
            }

            updatedOrder =
              order;
          }
        );

        /*
         * MongoDB transaction has committed.
         *
         * Only send email when there was
         * actually a status transition.
         *
         * Cancelled is handled via the
         * dedicated cancellation email
         * dispatch because the order status
         * template does not support it.
         */
        if (
          previousStatus !==
            updatedOrder.orderStatus
        ) {
          if (
            updatedOrder.orderStatus ===
            "Cancelled"
          ) {
            void dispatchOrderCancelledEmail(
              updatedOrder
            );
          } else {
            void dispatchOrderStatusEmail(
              updatedOrder,
              updatedOrder.orderStatus
            );

            // ─────────────────────────
            // AWARD REWARD POINTS
            // ─────────────────────────
            //
            // Covers COD orders, which only become
            // "Paid" once delivered. Online orders
            // (eSewa/Khalti/Bank Transfer) are already
            // awarded earlier, at payment verification,
            // in paymentController.js.
            //
            // awardOrderPoints() is safe to call from
            // both places: it atomically checks the
            // order's pointsAwarded flag before writing,
            // so an order that was already credited at
            // payment time (in the rare case it also
            // passes through this branch) will not be
            // credited twice.
            //
            if (
              updatedOrder.orderStatus ===
              "Delivered"
            ) {
              awardOrderPoints(
                updatedOrder._id
              ).catch((err) => {
                console.error(
                  `Failed to award points for ${updatedOrder.orderNumber}:`,
                  err?.message || err
                );
              });
            }
          }

          void notifyAdmins({
            type: "ORDER",
            title: "Order Status Updated",
            message: `${updatedOrder.orderNumber} — ${previousStatus} → ${updatedOrder.orderStatus}`,
            data: {
              orderId: updatedOrder._id,
              orderNumber: updatedOrder.orderNumber,
              previousStatus,
              newStatus: updatedOrder.orderStatus,
            },
          });
        }

        return res.status(200).json({
          success: true,
          order: updatedOrder,
        });
      } finally {
        await session.endSession();
      }
    }
  );


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — SOFT DELETE ORDER
// DELETE /api/v1/admin/order/:id
// ─────────────────────────────────────────────────────────────────────────────

export const deleteOrder =
  handleAsyncError(
    async (req, res, next) => {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return next(
          new HandleError(
            "Invalid order ID",
            400
          )
        );
      }

      const order =
        await Order.findOne({
          _id: req.params.id,

          isDeleted: false,
        });

      if (!order) {
        return next(
          new HandleError(
            "Order not found",
            404
          )
        );
      }

      if (
        ![
          "Delivered",
          "Cancelled",
        ].includes(
          order.orderStatus
        )
      ) {
        return next(
          new HandleError(
            "Only Delivered or Cancelled orders can be deleted",
            400
          )
        );
      }

      order.isDeleted = true;

      await order.save();

      return res.status(200).json({
        success: true,

        message:
          "Order deleted successfully",
      });
    }
  );