import mongoose from "mongoose";

import Return from "../models/returnModel.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";

import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";

import {
  sendReturnStatusEmail,
  sendAdminNewReturnEmail,
} from "../services/emailService.js";

import { notifyAdmins } from "../services/notificationService.js";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const RETURN_WINDOW_DAYS = 7;
const RETURN_SHIPPING_DEADLINE_DAYS = 7;
const MAX_IMAGES = 5;

const VALID_REASONS = [
  "Damaged Item",
  "Wrong Item Received",
  "Quality Issue",
  "Not As Described",
  "Changed Mind",
  "Missing Parts/Accessories",
  "Other",
];

const VALID_REFUND_METHODS = [
  "Bank Transfer",
  "eSewa/Khalti",
  "Store Credit",
  "Original Payment Method",
];

const VALID_REFUND_PROVIDERS = [
  "eSewa",
  "Khalti",
  "Card",
  "Bank",
  "Manual",
  "Store Credit",
];

const VALID_ITEM_CONDITIONS = [
  "Unopened",
  "Opened/Good",
  "Damaged/Defective",
  "Missing Parts",
  "Not Evaluated",
];

const VALID_STATUSES = [
  "Pending",
  "Approved",
  "Rejected",
  "Cancelled",
  "Item Received",
  "Completed",
  "Expired",
];

const ACTIVE_RETURN_STATUSES = [
  "Pending",
  "Approved",
  "Item Received",
];

const NON_REFUNDABLE_RETURN_STATUSES = [
  "Rejected",
  "Cancelled",
  "Expired",
];

const VALID_REFUND_STATUSES = [
  "Not Applicable",
  "Pending",
  "Processing",
  "Succeeded",
  "Failed",
  "Partially Refunded",
  "Cancelled",
];

const ALLOWED_TRANSITIONS = {
  Pending: ["Approved", "Rejected", "Cancelled"],
  Approved: ["Item Received", "Rejected", "Expired"],
  Rejected: [],
  Cancelled: [],
  "Item Received": ["Item Received", "Completed"],
  Completed: [],
  Expired: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL DISPATCH HELPERS
// Note: emails are fire-and-forget and must
// never block or fail the API response.
// ─────────────────────────────────────────────────────────────────────────────

// Statuses that trigger a customer email.
const RETURN_EMAIL_STATUSES = [
  "Approved",
  "Rejected",
  "Item Received",
  "Completed",
];

const getReturnCustomer = async (returnDoc) => {
  try {
    return await User.findById(
      returnDoc.user
    )
      .select("name email phone")
      .lean();
  } catch (err) {
    console.error(
      `Failed to load customer for return ${returnDoc.returnNumber}:`,
      err?.message || err
    );

    return null;
  }
};

// Sends the customer email for a status change.
const dispatchReturnStatusEmail = async (
  returnDoc,
  status
) => {
  if (!RETURN_EMAIL_STATUSES.includes(status)) {
    return;
  }

  const customer =
    await getReturnCustomer(returnDoc);

  if (!customer?.email) {
    console.error(
      `Customer email missing for return status: ${returnDoc.returnNumber}`
    );

    return;
  }

  try {
    await sendReturnStatusEmail(
      returnDoc,
      customer,
      status
    );
  } catch (err) {
    console.error(
      `Return status email failed for ${returnDoc.returnNumber} (${status}):`,
      err?.message || err
    );
  }
};

// Sends the customer refund-processed email.
const dispatchRefundProcessedEmail = async (
  returnDoc
) => {
  if (
    returnDoc.refundStatus !==
    "Succeeded"
  ) {
    return;
  }

  const customer =
    await getReturnCustomer(returnDoc);

  if (!customer?.email) {
    console.error(
      `Customer email missing for refund notification: ${returnDoc.returnNumber}`
    );

    return;
  }

  try {
    await sendReturnStatusEmail(
      returnDoc,
      customer,
      "Refunded"
    );
  } catch (err) {
    console.error(
      `Refund email failed for ${returnDoc.returnNumber}:`,
      err?.message || err
    );
  }
};

// Alerts all active admins about a new return request.
const dispatchAdminNewReturnEmail = async (
  returnDoc
) => {
  const customer =
    await getReturnCustomer(returnDoc);

  try {
    await sendAdminNewReturnEmail(
      returnDoc,
      customer
    );
  } catch (err) {
    console.error(
      `Admin new-return email failed for ${returnDoc.returnNumber}:`,
      err?.message || err
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || 10, 1),
    100
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const normalizeId = (id) =>
  id?.toString();

const roundMoney = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? Math.round(number * 100) / 100
    : 0;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Correct MongoDB regex escaping
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

//Check image URL valid or not 
const isValidUrl = (value) => {
  if (!value || typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REFUND DETAILS VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

const validateRefundDetails = (
  refundMethod,
  refundDetails = {}
) => {
  if (!refundMethod) {
    return;
  }

  if (!VALID_REFUND_METHODS.includes(refundMethod)) {
    throw new HandleError(
      `Invalid refund method. Options: ${VALID_REFUND_METHODS.join(", ")}`,
      400
    );
  }

  // Bank Transfer
  if (refundMethod === "Bank Transfer") {
    if (
      !refundDetails.accountHolderName?.trim() ||
      !refundDetails.accountNumber?.trim() ||
      !refundDetails.bankName?.trim()
    ) {
      throw new HandleError(
        "Account holder name, account number and bank name are required",
        400
      );
    }
  }

  // eSewa / Khalti
  if (refundMethod === "eSewa/Khalti") {
    if (
      !refundDetails.walletProvider ||
      !refundDetails.walletId?.trim()
    ) {
      throw new HandleError(
        "Wallet provider and wallet ID are required",
        400
      );
    }

    if (
      !["eSewa", "Khalti"].includes(
        refundDetails.walletProvider
      )
    ) {
      throw new HandleError(
        "Invalid wallet provider. Must be eSewa or Khalti",
        400
      );
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REFUND METHOD VS ORDER PAYMENT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

const validateRefundMethodAgainstOrder = (
  refundMethod,
  order
) => {
  if (!refundMethod || !order) {
    return;
  }

  if (
    refundMethod === "Original Payment Method" &&
    order.paymentInfo?.method === "COD"
  ) {
    throw new HandleError(
      "Original Payment Method is not available for COD orders",
      400
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REFUND PROVIDER VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

const validateRefundProvider = (provider) => {
  if (!provider) {
    return;
  }

  if (!VALID_REFUND_PROVIDERS.includes(provider)) {
    throw new HandleError(
      `Invalid refund provider. Options: ${VALID_REFUND_PROVIDERS.join(", ")}`,
      400
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

const validateImages = (images) => {
  if (images === undefined) {
    return [];
  }

  if (!Array.isArray(images)) {
    throw new HandleError(
      "Images must be an array",
      400
    );
  }

  if (images.length > MAX_IMAGES) {
    throw new HandleError(
      `Maximum ${MAX_IMAGES} images allowed`,
      400
    );
  }

  return images.map((image) => {
    if (!image?.url?.trim()) {
      throw new HandleError(
        "Each image must contain a valid URL",
        400
      );
    }

    if (!isValidUrl(image.url.trim())) {
      throw new HandleError(
        "Each image must contain a valid HTTP/HTTPS URL",
        400
      );
    }

    return {
      public_id: image.public_id?.trim() || "",
      url: image.url.trim(),
    };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// REFUND AMOUNT VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

const validateRefundAmount = (amount) => {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    throw new HandleError(
      "Refund amount must be greater than zero",
      400
    );
  }

  return roundMoney(value);
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER RESPONSE SANITIZATION
//Customer's sensitive refund details and internal refund transaction data hide garcha.
// ─────────────────────────────────────────────────────────────────────────────

const sanitizeCustomerReturn = (returnDoc) => {
  if (!returnDoc) {
    return returnDoc;
  }

  const result = { ...returnDoc };

  if (result.refund) {
    result.refund = {
      ...result.refund,
    };

    delete result.refund.details;
  }

  delete result.refundTransaction;

  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — CREATE RETURN
// POST /api/v1/returns
// ─────────────────────────────────────────────────────────────────────────────

export const createReturnRequest = handleAsyncError(
  async (req, res, next) => {
    const {
      orderId,
      items,
      reason,
      description,
      images,
      refundMethod,
      refundDetails,
    } = req.body;

    // Validate order ID
    if (!orderId || !isValidObjectId(orderId)) {
      return next(
        new HandleError(
          "A valid order ID is required",
          400
        )
      );
    }

    // Validate items
    if (!Array.isArray(items) || !items.length) {
      return next(
        new HandleError(
          "At least one item is required",
          400
        )
      );
    }

    // Validate main reason
    if (!VALID_REASONS.includes(reason)) {
      return next(
        new HandleError(
          `Invalid reason. Valid options: ${VALID_REASONS.join(", ")}`,
          400
        )
      );
    }

    // Validate description
    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return next(
        new HandleError(
          "Description must be a string",
          400
        )
      );
    }

    if (
      typeof description === "string" &&
      description.trim().length > 2000
    ) {
      return next(
        new HandleError(
          "Description cannot exceed 2000 characters",
          400
        )
      );
    }

    // Validate product IDs
    const productIds = items.map((item) =>
      normalizeId(item?.product)
    );

    if (
      productIds.some(
        (id) => !id || !isValidObjectId(id)
      )
    ) {
      return next(
        new HandleError(
          "Every return item must contain a valid product ID",
          400
        )
      );
    }

    // Prevent duplicate products
    if (
      new Set(productIds).size !==
      productIds.length
    ) {
      return next(
        new HandleError(
          "Each product can only appear once in a return request",
          400
        )
      );
    }

    // Validate refund method/details
    if (refundMethod) {
      validateRefundDetails(
        refundMethod,
        refundDetails || {}
      );
    }

    const returnImages = validateImages(images);

    const session = await mongoose.startSession();

    try {
      let returnDoc;

      await session.withTransaction(async () => {
        // FIND CUSTOMER ORDER
        const order = await Order.findOne({
          _id: orderId,
          user: req.user._id,
          isDeleted: { $ne: true },
        }).session(session);

        if (!order) {
          throw new HandleError(
            "Order not found",
            404
          );
        }

        // DELIVERY CHECK
        if (order.orderStatus !== "Delivered") {
          throw new HandleError(
            "Only delivered orders can be returned",
            400
          );
        }

        // DELIVERY DATE CHECK
        if (!order.deliveredAt) {
          throw new HandleError(
            "Order delivery date is unavailable",
            400
          );
        }

        const deliveredAt = new Date(
          order.deliveredAt
        );

        if (
          Number.isNaN(deliveredAt.getTime()) ||
          deliveredAt > new Date()
        ) {
          throw new HandleError(
            "Invalid order delivery date",
            400
          );
        }

        // RETURN WINDOW
        const eligibilityDeadline = addDays(
          deliveredAt,
          RETURN_WINDOW_DAYS
        );

        if (new Date() > eligibilityDeadline) {
          throw new HandleError(
            "Return window has expired",
            400
          );
        }

        // ACTIVE RETURN CHECK
        const existingActiveReturn =
          await Return.findOne({
            order: order._id,
            isDeleted: false,
            status: {
              $in: ACTIVE_RETURN_STATUSES,
            },
          }).session(session);

        if (existingActiveReturn) {
          throw new HandleError(
            "This order already has an active return request",
            409
          );
        }

        // PREVIOUSLY RETURNED QUANTITY
        const existingReturns = await Return.find({
          order: order._id,
          isDeleted: false,
          status: {
            $nin: NON_REFUNDABLE_RETURN_STATUSES,
          },
        }).session(session);

        const returnedQty = {};

        existingReturns.forEach((existingReturn) => {
          existingReturn.items.forEach((item) => {
            const id = normalizeId(item.product);

            returnedQty[id] =
              (returnedQty[id] || 0) +
              Number(item.quantity);
          });
        });

        // DISCOUNT CALCULATION
        const itemsPrice =
          Number(order.itemsPrice) || 0;

        const discount =
          Number(order.discount) || 0;

        const discountRatio =
          itemsPrice > 0
            ? Math.min(
                Math.max(
                  discount / itemsPrice,
                  0
                ),
                1
              )
            : 0;

        const returnItems = [];

        let refundAmount = 0;

        // VALIDATE RETURN ITEMS
        for (const item of items) {
          if (
            !item?.product ||
            !item.quantity ||
            !item.reason
          ) {
            throw new HandleError(
              "Each return item requires product, quantity and reason",
              400
            );
          }

          if (
            !VALID_REASONS.includes(item.reason)
          ) {
            throw new HandleError(
              `Invalid item return reason for product ${item.product}`,
              400
            );
          }

          const originalItem =
            order.orderItems.find(
              (orderItem) =>
                normalizeId(orderItem.product) ===
                normalizeId(item.product)
            );

          if (!originalItem) {
            throw new HandleError(
              "Product is not part of the original order",
              400
            );
          }

          const quantity = Number(item.quantity);

          if (
            !Number.isInteger(quantity) ||
            quantity < 1
          ) {
            throw new HandleError(
              "Quantity must be a positive integer",
              400
            );
          }

          const productId =
            normalizeId(item.product);

          const alreadyReturned =
            returnedQty[productId] || 0;

          const originalQuantity =
            Number(originalItem.quantity);

          const remaining =
            originalQuantity -
            alreadyReturned;

          if (remaining <= 0) {
            throw new HandleError(
              `No returnable quantity remains for ${originalItem.name}`,
              400
            );
          }

          if (quantity > remaining) {
            throw new HandleError(
              `Only ${remaining} unit(s) of ${originalItem.name} can be returned`,
              400
            );
          }

          // Historical order price
          const price =
            Number(originalItem.price);

          if (
            !Number.isFinite(price) ||
            price < 0
          ) {
            throw new HandleError(
              `Invalid historical price for ${originalItem.name}`,
              500
            );
          }

          // Calculate refund
          const netPrice = Math.max(
            0,
            price * (1 - discountRatio)
          );

          const itemRefund = roundMoney(
            netPrice * quantity
          );

          refundAmount += itemRefund;

          // Return item snapshot
          returnItems.push({
            product: originalItem.product,
            name: originalItem.name,
            image: originalItem.image || "",
            quantity,
            itemPrice: roundMoney(price),
            refundUnitPrice: roundMoney(netPrice),
            reason: item.reason,
            itemCondition: "Not Evaluated",
            restockable: false,
          });
        }

        refundAmount =
          roundMoney(refundAmount);

        // REFUND LIMIT
        const orderTotal =
          roundMoney(order.totalPrice || 0);

        const alreadyRefunded =
          roundMoney(
            order.refundedAmount || 0
          );

        const remainingRefundable =
          roundMoney(
            Math.max(
              orderTotal - alreadyRefunded,
              0
            )
          );

        if (refundAmount <= 0) {
          throw new HandleError(
            "Refund amount must be greater than zero",
            400
          );
        }

        if (
          refundAmount >
          remainingRefundable
        ) {
          throw new HandleError(
            "Calculated refund exceeds the remaining refundable order amount",
            400
          );
        }

        validateRefundMethodAgainstOrder(
          refundMethod,
          order
        );

        // CREATE RETURN
        const created = await Return.create(
          [
            {
              order: order._id,
              user: req.user._id,
              items: returnItems,
              reason,
              description:
                description?.trim() || "",
              images: returnImages,

              status: "Pending",

              refundStatus: "Pending",

              refund: {
                requestedAmount:
                  refundAmount,
                approvedAmount: 0,
                currency: "NPR",
                method: refundMethod,
                details:
                  refundDetails || {},
              },

              returnEligibilityDeadline:
                eligibilityDeadline,

              statusHistory: [
                {
                  status: "Pending",
                  changedBy:
                    req.user._id,
                  changedAt:
                    new Date(),
                  note:
                    "Return request submitted by customer",
                },
              ],

              refundHistory: [
                {
                  status: "Pending",
                  amount: refundAmount,
                  changedBy:
                    req.user._id,
                  changedAt:
                    new Date(),
                  note:
                    "Refund request created",
                },
              ],
            },
          ],
          { session }
        );

        returnDoc = created[0];
      });

      /*
       * MongoDB transaction has committed.
       *
       * Alert active admin accounts about
       * the new return request.
       */
      void dispatchAdminNewReturnEmail(
        returnDoc
      );

      void notifyAdmins({
        type: "RETURN",
        title: "New Return Request",
        message: `${returnDoc.returnNumber} — NPR ${returnDoc.refund.requestedAmount}`,
        data: {
          returnId: returnDoc._id,
          returnNumber: returnDoc.returnNumber,
          requestedAmount: returnDoc.refund.requestedAmount,
        },
      });

      return res.status(201).json({
        success: true,
        message:
          "Return request submitted successfully",
        return: sanitizeCustomerReturn(
          returnDoc.toObject()
        ),
      });
    } catch (error) {
      if (
        error?.code === 11000 &&
        error?.keyPattern?.order
      ) {
        return next(
          new HandleError(
            "This order already has an active return request",
            409
          )
        );
      }

      return next(error);
    } finally {
      await session.endSession();
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — CANCEL RETURN
// PUT /api/v1/returns/:id/cancel
// ─────────────────────────────────────────────────────────────────────────────

export const cancelMyReturn = handleAsyncError(
  async (req, res, next) => {
    if (
      !isValidObjectId(req.params.id)
    ) {
      return next(
        new HandleError(
          "Invalid return ID",
          400
        )
      );
    }

    const returnDoc =
      await Return.findOne({
        _id: req.params.id,
        user: req.user._id,
        isDeleted: { $ne: true },
      });

    if (!returnDoc) {
      return next(
        new HandleError(
          "Return request not found",
          404
        )
      );
    }

    if (returnDoc.status !== "Pending") {
      return next(
        new HandleError(
          `Cannot cancel a ${returnDoc.status} return`,
          400
        )
      );
    }

    returnDoc.addStatusHistory(
      "Cancelled",
      req.user._id,
      "Cancelled by customer"
    );

    returnDoc.addRefundHistory(
      "Cancelled",
      0,
      req.user._id,
      "Refund cancelled because return was cancelled"
    );

    returnDoc.status = "Cancelled";
    returnDoc.refundStatus = "Cancelled";
    returnDoc.refund.approvedAmount = 0;
    returnDoc.cancelledAt = new Date();

    await returnDoc.save();

    return res.status(200).json({
      success: true,
      message:
        "Return request cancelled successfully",
      return: sanitizeCustomerReturn(
        returnDoc.toObject()
      ),
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — GET MY RETURNS
// GET /api/v1/returns/me
// ─────────────────────────────────────────────────────────────────────────────

export const getMyReturns = handleAsyncError(
  async (req, res) => {
    const {
      page,
      limit,
      skip,
    } = getPagination(req.query);

    const filter = {
      user: req.user._id,
      isDeleted: { $ne: true },
    };

    const [returns, total] =
      await Promise.all([
        Return.find(filter)
          .select(
            "-refund.details -refundTransaction"
          )
          .populate(
            "order",
            "orderNumber totalPrice orderStatus deliveredAt paymentInfo refundedAmount"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Return.countDocuments(filter),
      ]);

    return res.status(200).json({
      success: true,
      count: returns.length,
      total,
      totalPages: Math.ceil(
        total / limit
      ),
      currentPage: page,
      returns: returns.map(
        sanitizeCustomerReturn
      ),
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — GET SINGLE RETURN
// GET /api/v1/returns/:id
// ─────────────────────────────────────────────────────────────────────────────

export const getMySingleReturn =
  handleAsyncError(
    async (req, res, next) => {
      if (
        !isValidObjectId(req.params.id)
      ) {
        return next(
          new HandleError(
            "Invalid return ID",
            400
          )
        );
      }

      const returnDoc =
        await Return.findOne({
          _id: req.params.id,
          user: req.user._id,
          isDeleted: { $ne: true },
        })
          .select(
            "-refund.details -refundTransaction"
          )
          .populate(
            "order",
            "orderNumber totalPrice itemsPrice discount taxPrice shippingPrice orderStatus deliveredAt paymentInfo refundedAmount refundedAt"
          )
          .lean();

      if (!returnDoc) {
        return next(
          new HandleError(
            "Return request not found",
            404
          )
        );
      }

      return res.status(200).json({
        success: true,
        return:
          sanitizeCustomerReturn(
            returnDoc
          ),
      });
    }
  );

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — GET ALL RETURNS
// GET /api/v1/admin/returns
// ─────────────────────────────────────────────────────────────────────────────

export const getAllReturns =
  handleAsyncError(
    async (req, res) => {
      const {
        page,
        limit,
        skip,
      } = getPagination(req.query);

      const filter = {
        isDeleted: { $ne: true },
      };

      // Status filter
      if (req.query.status) {
        if (
          !VALID_STATUSES.includes(
            req.query.status
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid return status",
          });
        }

        filter.status =
          req.query.status;
      }

      // Refund status filter
      if (req.query.refundStatus) {
        if (
          !VALID_REFUND_STATUSES.includes(
            req.query.refundStatus
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid refund status",
          });
        }

        filter.refundStatus =
          req.query.refundStatus;
      }

      // Search return number
      if (req.query.search?.trim()) {
        const search = escapeRegex(
          req.query.search.trim()
        );

        filter.returnNumber = {
          $regex: search,
          $options: "i",
        };
      }

      const [returns, total] =
        await Promise.all([
          Return.find(filter)
            .select(
              "-refund.details -refundTransaction"
            )
            .populate(
              "user",
              "name email phone"
            )
            .populate(
              "order",
              "orderNumber totalPrice itemsPrice discount taxPrice shippingPrice orderStatus paymentInfo refundedAmount refundedAt deliveredAt"
            )
            .populate(
              "handledBy",
              "name email"
            )
            .sort({
              createdAt: -1,
            })
            .skip(skip)
            .limit(limit)
            .lean(),

          Return.countDocuments(filter),
        ]);

      return res.status(200).json({
        success: true,
        count: returns.length,
        total,
        totalPages: Math.ceil(
          total / limit
        ),
        currentPage: page,
        returns,
      });
    }
  );

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — GET SINGLE RETURN
// GET /api/v1/admin/returns/:id
// ─────────────────────────────────────────────────────────────────────────────

export const getAdminSingleReturn =
  handleAsyncError(
    async (req, res, next) => {
      if (
        !isValidObjectId(req.params.id)
      ) {
        return next(
          new HandleError(
            "Invalid return ID",
            400
          )
        );
      }

      const returnDoc =
        await Return.findOne({
          _id: req.params.id,
          isDeleted: { $ne: true },
        })
          .populate(
            "user",
            "name email phone"
          )
          .populate(
            "order",
            "orderNumber totalPrice itemsPrice discount taxPrice shippingPrice orderStatus paymentInfo refundedAmount refundedAt deliveredAt"
          )
          .populate(
            "handledBy",
            "name email"
          )
          .populate(
            "stockRestoredBy",
            "name email"
          )
          .populate(
            "deletedBy",
            "name email"
          )
          .populate(
            "refundTransaction.processedBy",
            "name email"
          )
          .lean();

      if (!returnDoc) {
        return next(
          new HandleError(
            "Return request not found",
            404
          )
        );
      }

      return res.status(200).json({
        success: true,
        return: returnDoc,
      });
    }
  );

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — UPDATE RETURN STATUS & INSPECTION
// PUT /api/v1/admin/returns/:id
// ─────────────────────────────────────────────────────────────────────────────

export const updateReturn =
  handleAsyncError(
    async (req, res, next) => {
      const {
        status,
        adminRemarks,
        refundMethod,
        refundDetails,
        refundAmount,
        itemInspections,
      } = req.body;

      if (
        !isValidObjectId(req.params.id)
      ) {
        return next(
          new HandleError(
            "Invalid return ID",
            400
          )
        );
      }

      if (
        !status ||
        !VALID_STATUSES.includes(status)
      ) {
        return next(
          new HandleError(
            "Valid target status is required",
            400
          )
        );
      }

      if (
        adminRemarks !== undefined &&
        typeof adminRemarks !== "string"
      ) {
        return next(
          new HandleError(
            "Admin remarks must be a string",
            400
          )
        );
      }

      if (
        adminRemarks?.trim().length > 500
      ) {
        return next(
          new HandleError(
            "Admin remarks cannot exceed 500 characters",
            400
          )
        );
      }

      if (
        status === "Rejected" &&
        !adminRemarks?.trim()
      ) {
        return next(
          new HandleError(
            "Admin remarks are required when rejecting",
            400
          )
        );
      }

      if (
        itemInspections !== undefined &&
        !Array.isArray(itemInspections)
      ) {
        return next(
          new HandleError(
            "itemInspections must be an array",
            400
          )
        );
      }

      if (
        refundMethod !== undefined &&
        !VALID_REFUND_METHODS.includes(
          refundMethod
        )
      ) {
        return next(
          new HandleError(
            "Invalid refund method",
            400
          )
        );
      }

      if (
        refundDetails !== undefined &&
        (
          typeof refundDetails !== "object" ||
          Array.isArray(refundDetails) ||
          refundDetails === null
        )
      ) {
        return next(
          new HandleError(
            "refundDetails must be an object",
            400
          )
        );
      }

      const session =
        await mongoose.startSession();

      try {
        let updatedReturn;
        let previousReturnStatus;

        await session.withTransaction(
          async () => {
            const returnDoc =
              await Return.findOne({
                _id: req.params.id,
                isDeleted: {
                  $ne: true,
                },
              }).session(session);

            if (!returnDoc) {
              throw new HandleError(
                "Return request not found",
                404
              );
            }

            const currentStatus =
              returnDoc.status;

            previousReturnStatus =
              currentStatus;

            const allowed =
              ALLOWED_TRANSITIONS[
                currentStatus
              ] || [];

            if (
              !allowed.includes(status)
            ) {
              throw new HandleError(
                `Cannot change status from "${currentStatus}" to "${status}"`,
                400
              );
            }

            // ───────────────────────────────────
            // SHIPPING DEADLINE
            // ───────────────────────────────────

            if (
              status === "Item Received" &&
              returnDoc.returnShippingDeadline &&
              new Date() >
                new Date(
                  returnDoc.returnShippingDeadline
                )
            ) {
              throw new HandleError(
                "Return shipping deadline has expired. This return cannot be received. Please update status to Expired or Rejected.",
                400
              );
            }

            // ───────────────────────────────────
            // ITEM INSPECTION
            // ───────────────────────────────────

            if (status === "Item Received") {
              if (
                !Array.isArray(
                  itemInspections
                ) ||
                itemInspections.length === 0
              ) {
                throw new HandleError(
                  "Item inspections are required when receiving the return",
                  400
                );
              }

              const inspected = new Set();

              for (
                const inspection
                of itemInspections
              ) {
                if (
                  !inspection.productId ||
                  !isValidObjectId(
                    inspection.productId
                  )
                ) {
                  throw new HandleError(
                    "Every inspection requires a valid productId",
                    400
                  );
                }

                const productId =
                  normalizeId(
                    inspection.productId
                  );

                if (
                  inspected.has(productId)
                ) {
                  throw new HandleError(
                    "Duplicate product inspection",
                    400
                  );
                }

                inspected.add(productId);

                const item =
                  returnDoc.items.find(
                    (returnItem) =>
                      normalizeId(
                        returnItem.product
                      ) === productId
                  );

                if (!item) {
                  throw new HandleError(
                    "Inspection product does not belong to this return",
                    400
                  );
                }

                if (
                  !inspection.itemCondition ||
                  !VALID_ITEM_CONDITIONS.includes(
                    inspection.itemCondition
                  )
                ) {
                  throw new HandleError(
                    "Every inspection requires a valid item condition",
                    400
                  );
                }

                if (
                  inspection.restockable !==
                    undefined &&
                  typeof inspection.restockable !==
                    "boolean"
                ) {
                  throw new HandleError(
                    "restockable must be boolean",
                    400
                  );
                }

                const condition =
                  inspection.itemCondition;

                if (
                  inspection.restockable ===
                    true &&
                  [
                    "Damaged/Defective",
                    "Missing Parts",
                  ].includes(condition)
                ) {
                  throw new HandleError(
                    "Damaged or incomplete items cannot be marked as restockable",
                    400
                  );
                }

                item.itemCondition =
                  condition;

                item.restockable =
                  inspection.restockable ===
                  true;
              }

              // Every return item must be inspected
              if (
                inspected.size !==
                returnDoc.items.length
              ) {
                throw new HandleError(
                  "Every returned item must be inspected before marking the return as received",
                  400
                );
              }

              for (
                const item of returnDoc.items
              ) {
                if (
                  item.itemCondition ===
                  "Not Evaluated"
                ) {
                  throw new HandleError(
                    "Every returned item must have an item condition",
                    400
                  );
                }

                if (
                  item.itemCondition ===
                    "Damaged/Defective" ||
                  item.itemCondition ===
                    "Missing Parts"
                ) {
                  item.restockable = false;
                }
              }
            }

            // ───────────────────────────────────
            // ADMIN REMARKS
            // ───────────────────────────────────

            if (
              adminRemarks !== undefined
            ) {
              returnDoc.adminRemarks =
                adminRemarks.trim();
            }

            // ───────────────────────────────────
            // APPROVE RETURN
            // ───────────────────────────────────

            if (
              currentStatus === "Pending" &&
              status === "Approved"
            ) {
              returnDoc.returnShippingDeadline =
                addDays(
                  new Date(),
                  RETURN_SHIPPING_DEADLINE_DAYS
                );

              returnDoc.approvedAt =
                new Date();

              returnDoc.handledBy =
                req.user._id;
            }

            // ───────────────────────────────────
            // REJECT RETURN
            // ───────────────────────────────────

            if (status === "Rejected") {
              returnDoc.rejectedAt =
                new Date();

              returnDoc.handledBy =
                req.user._id;

              returnDoc.refundStatus =
                "Not Applicable";

              returnDoc.refund.approvedAmount =
                0;

              returnDoc.addRefundHistory(
                "Not Applicable",
                0,
                req.user._id,
                "Refund not applicable because return was rejected"
              );
            }

            // ───────────────────────────────────
            // EXPIRE RETURN
            // ───────────────────────────────────

            if (status === "Expired") {
              returnDoc.handledBy =
                req.user._id;

              returnDoc.refundStatus =
                "Cancelled";

              returnDoc.refund.approvedAmount =
                0;

              returnDoc.addRefundHistory(
                "Cancelled",
                0,
                req.user._id,
                "Refund cancelled because return shipping deadline expired"
              );
            }

            // ───────────────────────────────────
            // ITEM RECEIVED + STOCK RESTORATION
            // ───────────────────────────────────

            if (
              status === "Item Received"
            ) {
              returnDoc.receivedAt =
                new Date();

              returnDoc.handledBy =
                req.user._id;

              if (!returnDoc.stockRestored) {
                let stockWasRestored = false;

                for (
                  const item of returnDoc.items
                ) {
                  if (
                    item.restockable === true
                  ) {
                    const updatedProduct =
                      await Product.findByIdAndUpdate(
                        item.product,
                        {
                          $inc: {
                            stock:
                              item.quantity,
                          },
                        },
                        {
                          session,
                          new: true,
                        }
                      );

                    if (!updatedProduct) {
                      throw new HandleError(
                        `Product "${item.name}" no longer exists. Inventory could not be restored.`,
                        404
                      );
                    }

                    stockWasRestored = true;
                  }
                }

                if (stockWasRestored) {
                  returnDoc.stockRestored =
                    true;

                  returnDoc.stockRestoredAt =
                    new Date();

                  returnDoc.stockRestoredBy =
                    req.user._id;
                }
              }
            }

            // ───────────────────────────────────
            // REFUND METHOD / DETAILS
            // ───────────────────────────────────

            if (refundMethod) {
              returnDoc.refund.method =
                refundMethod;
            }

            const effectiveRefundMethod =
              returnDoc.refund?.method;

            if (
              refundMethod ||
              refundDetails !== undefined
            ) {
              const mergedRefundDetails =
                refundDetails !== undefined
                  ? {
                      ...(returnDoc.refund
                        ?.details || {}),
                      ...refundDetails,
                    }
                  : returnDoc.refund
                      ?.details || {};

              validateRefundDetails(
                effectiveRefundMethod,
                mergedRefundDetails
              );

              const order =
                await Order.findById(
                  returnDoc.order
                ).session(session);

              if (!order) {
                throw new HandleError(
                  "Original order not found",
                  404
                );
              }

              validateRefundMethodAgainstOrder(
                effectiveRefundMethod,
                order
              );

              if (
                refundDetails !== undefined
              ) {
                returnDoc.refund.details =
                  {
                    ...(returnDoc.refund
                      ?.details || {}),
                    ...refundDetails,
                  };
              }
            }

            // ───────────────────────────────────
            // REFUND AMOUNT APPROVAL
            // ───────────────────────────────────

            if (
              refundAmount !== undefined
            ) {
              if (
                currentStatus !== "Item Received" &&
                status !== "Item Received"
              ) {
                throw new HandleError(
                  "Refund amount can only be approved after the returned item has been received and inspected",
                  400
                );
              }

              const amount =
                validateRefundAmount(
                  refundAmount
                );

              const requestedAmount =
                roundMoney(
                  returnDoc.refund
                    .requestedAmount
                );

              if (
                amount >
                requestedAmount
              ) {
                throw new HandleError(
                  "Approved refund cannot exceed the requested refund amount",
                  400
                );
              }

              const order =
                await Order.findById(
                  returnDoc.order
                ).session(session);

              if (!order) {
                throw new HandleError(
                  "Original order not found",
                  404
                );
              }

              const previousRefund =
                roundMoney(
                  order.refundedAmount || 0
                );

              const orderTotal =
                roundMoney(
                  order.totalPrice || 0
                );

              if (
                previousRefund + amount >
                orderTotal
              ) {
                throw new HandleError(
                  "Refund exceeds the remaining refundable order amount",
                  400
                );
              }

              returnDoc.refund.approvedAmount =
                amount;

              returnDoc.refundStatus =
                "Pending";

              returnDoc.addRefundHistory(
                "Pending",
                amount,
                req.user._id,
                "Refund amount approved after item inspection"
              );
            }

            // ───────────────────────────────────
            // ITEM RECEIVED
            // ───────────────────────────────────

            if (
              status === "Item Received"
            ) {
              returnDoc.refundStatus =
                "Pending";
            }

            // ───────────────────────────────────
            // COMPLETION
            // ───────────────────────────────────

            if (status === "Completed") {
              if (
                returnDoc.refundStatus !==
                "Succeeded"
              ) {
                throw new HandleError(
                  "Return cannot be completed until the refund succeeds",
                  400
                );
              }

              returnDoc.completedAt =
                new Date();

              returnDoc.handledBy =
                req.user._id;
            }

            // ───────────────────────────────────
            // STATUS HISTORY
            // ───────────────────────────────────

            returnDoc.addStatusHistory(
              status,
              req.user._id,
              adminRemarks?.trim() ||
                `Return status changed to ${status}`
            );

            returnDoc.status = status;

            updatedReturn = returnDoc;

            await returnDoc.save({
              session,
            });
          }
        );

        /*
         * MongoDB transaction has committed.
         *
         * Only send the customer email when
         * there was actually a status
         * transition.
         */
        if (
          previousReturnStatus !==
          updatedReturn.status
        ) {
          void dispatchReturnStatusEmail(
            updatedReturn,
            updatedReturn.status
          );
        }

        return res.status(200).json({
          success: true,
          message:
            "Return request updated successfully",
          return:
            updatedReturn.toObject(),
        });
      } finally {
        await session.endSession();
      }
    }
  );

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — PROCESS / RECORD REFUND PAYOUT
// PUT /api/v1/admin/returns/:id/refund
// ─────────────────────────────────────────────────────────────────────────────
//
// CURRENT BEHAVIOR:
// This endpoint RECORDS the refund payout.
//
// FUTURE BEHAVIOR:
// A payment service should perform the actual eSewa/Khalti/Card API call.
// The controller should then record the verified provider result.
// ─────────────────────────────────────────────────────────────────────────────

export const processRefund =
  handleAsyncError(
    async (req, res, next) => {
      const {
        amount,
        transactionId,
        provider,
        receiptUrl,
        note,
        markCompleted = true,
      } = req.body;

      if (
        !isValidObjectId(req.params.id)
      ) {
        return next(
          new HandleError(
            "Invalid return ID",
            400
          )
        );
      }

      // Validate markCompleted
      if (
        typeof markCompleted !==
        "boolean"
      ) {
        return next(
          new HandleError(
            "markCompleted must be boolean",
            400
          )
        );
      }

      // Validate provider
      if (provider !== undefined) {
        validateRefundProvider(provider);
      }

      // Validate receipt URL
      if (
        receiptUrl !== undefined &&
        receiptUrl !== ""
      ) {
        if (
          typeof receiptUrl !==
            "string" ||
          !isValidUrl(
            receiptUrl.trim()
          )
        ) {
          return next(
            new HandleError(
              "receiptUrl must be a valid HTTP/HTTPS URL",
              400
            )
          );
        }
      }

      // Validate transaction ID
      if (
        transactionId !== undefined &&
        typeof transactionId !==
          "string"
      ) {
        return next(
          new HandleError(
            "transactionId must be a string",
            400
          )
        );
      }

      const session =
        await mongoose.startSession();

      try {
        let updatedReturn;

        await session.withTransaction(
          async () => {
            const returnDoc =
              await Return.findOne({
                _id: req.params.id,
                isDeleted: {
                  $ne: true,
                },
              }).session(session);

            if (!returnDoc) {
              throw new HandleError(
                "Return request not found",
                404
              );
            }

            // Refund only after item received
            if (
              returnDoc.status !==
              "Item Received"
            ) {
              throw new HandleError(
                `Refund can only be processed when item is received (current status: "${returnDoc.status}")`,
                400
              );
            }

            // Do not process twice
            if (
              returnDoc.refundStatus ===
              "Succeeded"
            ) {
              throw new HandleError(
                "Refund has already succeeded for this return",
                400
              );
            }

            // IMPORTANT:
            // Admin must approve a refund amount first.
            const approvedAmount =
              roundMoney(
                returnDoc.refund
                  ?.approvedAmount || 0
              );

            if (approvedAmount <= 0) {
              throw new HandleError(
                "A refund amount must be approved before processing the refund",
                400
              );
            }

            // FIND ORDER
            const order =
              await Order.findById(
                returnDoc.order
              ).session(session);

            if (!order) {
              throw new HandleError(
                "Original order not found",
                404
              );
            }

            // VALIDATE REFUND METHOD
            const refundMethod =
              returnDoc.refund?.method;

            if (!refundMethod) {
              throw new HandleError(
                "A refund method is required before processing the refund",
                400
              );
            }

            validateRefundMethodAgainstOrder(
              refundMethod,
              order
            );

            validateRefundDetails(
              refundMethod,
              returnDoc.refund
                ?.details || {}
            );

            // ───────────────────────────────────
            // DETERMINE REFUND AMOUNT
            // ───────────────────────────────────

            let refundAmountToProcess;

            if (amount !== undefined) {
              refundAmountToProcess =
                validateRefundAmount(
                  amount
                );
            } else {
              refundAmountToProcess =
                approvedAmount;
            }

            // Must be approved amount
            if (
              refundAmountToProcess >
              approvedAmount
            ) {
              throw new HandleError(
                "Refund amount cannot exceed the approved refund amount",
                400
              );
            }

            // ───────────────────────────────────
            // REQUESTED AMOUNT LIMIT
            // ───────────────────────────────────

            const requestedAmount =
              roundMoney(
                returnDoc.refund
                  .requestedAmount
              );

            if (
              refundAmountToProcess >
              requestedAmount
            ) {
              throw new HandleError(
                "Refund amount cannot exceed the requested refund amount",
                400
              );
            }

            // ───────────────────────────────────
            // ORDER REFUND LIMIT
            // ───────────────────────────────────

            const currentOrderRefunded =
              roundMoney(
                order.refundedAmount || 0
              );

            const orderTotal =
              roundMoney(
                order.totalPrice || 0
              );

            const remainingRefundable =
              roundMoney(
                Math.max(
                  orderTotal -
                    currentOrderRefunded,
                  0
                )
              );

            if (
              refundAmountToProcess >
              remainingRefundable
            ) {
              throw new HandleError(
                "Refund amount exceeds the remaining refundable order amount",
                400
              );
            }

            // Keep approved amount equal to actual payout
            returnDoc.refund.approvedAmount =
              refundAmountToProcess;

            // ───────────────────────────────────
            // PAYMENT ARCHITECTURE
            // ───────────────────────────────────
            //
            // DO NOT put eSewa/Khalti/Card API
            // calls here.
            //
            // Future payment service will:
            //
            // 1. Call payment provider
            // 2. Verify provider response
            // 3. Return verified transaction data
            // 4. Controller records the result
            //
            // Current implementation only records
            // a manually verified payout.
            // ───────────────────────────────────

            const processedAt =
              new Date();

            const generatedTransactionId =
              transactionId?.trim() ||
              `REF-${Date.now()}-${Math.floor(
                Math.random() * 1000000
              )}`;

            const finalProvider =
              provider ||
              (
                refundMethod === "eSewa/Khalti"
                  ? returnDoc.refund?.details?.walletProvider || "eSewa"
                  : refundMethod === "Original Payment Method"
                  ? (["eSewa", "Khalti", "Card"].includes(order.paymentInfo?.method)
                      ? order.paymentInfo.method
                      : "Manual")
                  : refundMethod === "Bank Transfer"
                  ? "Bank"
                  : refundMethod === "Store Credit"
                  ? "Store Credit"
                  : "Manual"
              );

            validateRefundProvider(
              finalProvider
            );

            // ───────────────────────────────────
            // RECORD REFUND SUCCESS
            // ───────────────────────────────────

            returnDoc.refundStatus =
              "Succeeded";

            returnDoc.refundedAt =
              processedAt;

            returnDoc.refundTransaction = {
              transactionId:
                generatedTransactionId,

              provider:
                finalProvider,

              status: "Succeeded",

              amount:
                refundAmountToProcess,

              currency: "NPR",

              requestedAt:
                returnDoc.createdAt ||
                processedAt,

              processedAt,

              processedBy:
                req.user._id,

              receiptUrl:
                receiptUrl?.trim() || "",
            };

            returnDoc.addRefundHistory(
              "Succeeded",
              refundAmountToProcess,
              req.user._id,
              note?.trim() ||
                `Refund of NPR ${refundAmountToProcess} processed successfully via ${finalProvider}`
            );

            // ───────────────────────────────────
            // SYNC PARENT ORDER
            // ───────────────────────────────────

            const updatedOrder =
              await Order.findOneAndUpdate(
                {
                  _id: returnDoc.order,

                  // Prevent over-refunding
                  $expr: {
                    $lte: [
                      {
                        $add: [
                          {
                            $ifNull: [
                              "$refundedAmount",
                              0,
                            ],
                          },
                          refundAmountToProcess,
                        ],
                      },
                      {
                        $ifNull: [
                          "$totalPrice",
                          0,
                        ],
                      },
                    ],
                  },
                },
                {
                  $inc: {
                    refundedAmount:
                      refundAmountToProcess,
                  },

                  $set: {
                    refundedAt:
                      processedAt,
                  },
                },
                {
                  session,
                  new: true,
                }
              );

            if (!updatedOrder) {
              throw new HandleError(
                "Refund exceeds the remaining refundable order amount",
                400
              );
            }

            // ───────────────────────────────────
            // COMPLETE RETURN
            // ───────────────────────────────────

            if (markCompleted === true) {
              returnDoc.status =
                "Completed";

              returnDoc.completedAt =
                processedAt;

              returnDoc.handledBy =
                req.user._id;

              returnDoc.addStatusHistory(
                "Completed",
                req.user._id,
                "Return completed after successful refund payout"
              );
            }

            updatedReturn =
              returnDoc;

            await returnDoc.save({
              session,
            });
          }
        );

        /*
         * MongoDB transaction has committed.
         *
         * Notify the customer that their
         * refund has been processed.
         */
        if (
          updatedReturn.refundStatus ===
          "Succeeded"
        ) {
          void dispatchRefundProcessedEmail(
            updatedReturn
          );
        }

        return res.status(200).json({
          success: true,
          message:
            "Refund processed and return updated successfully",
          return:
            updatedReturn.toObject(),
        });
      } finally {
        await session.endSession();
      }
    }
  );

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — SOFT DELETE
// DELETE /api/v1/admin/returns/:id
// ─────────────────────────────────────────────────────────────────────────────

export const deleteReturn =
  handleAsyncError(
    async (req, res, next) => {
      if (
        !isValidObjectId(req.params.id)
      ) {
        return next(
          new HandleError(
            "Invalid return ID",
            400
          )
        );
      }

      const returnDoc =
        await Return.findOne({
          _id: req.params.id,
          isDeleted: {
            $ne: true,
          },
        });

      if (!returnDoc) {
        return next(
          new HandleError(
            "Return request not found",
            404
          )
        );
      }

      const deletableStatuses = [
        "Completed",
        "Rejected",
        "Cancelled",
        "Expired",
      ];

      if (
        !deletableStatuses.includes(
          returnDoc.status
        )
      ) {
        return next(
          new HandleError(
            `Cannot delete a return request with active status: "${returnDoc.status}"`,
            400
          )
        );
      }

      returnDoc.isDeleted = true;
      returnDoc.deletedAt = new Date();
      returnDoc.deletedBy =
        req.user._id;

      await returnDoc.save();

      return res.status(200).json({
        success: true,
        message:
          "Return request archived successfully",
      });
    }
  );