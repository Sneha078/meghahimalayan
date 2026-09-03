import Payment from "../models/paymentModel.js";
import BankTransfer from "../models/bankTransferModel.js";
import Order from "../models/orderModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import { restoreStock } from "../utils/stockUtils.js";
import { ESEWA_CONFIG, BANK_ACCOUNT_INFO } from "../config/paymentConfig.js";
import { generateEsewaSignature, verifyEsewaSignature } from "../utils/esewaHelper.js";
import { initiateKhaltiPayment, lookupKhaltiPayment } from "../utils/khaltiHelper.js";

// ─── eSewa ────────────────────────────────────────────────────────────────

// POST /api/v1/payment/esewa/initiate   body: { orderId }
export const initiateEsewa = handleAsyncError(async (req, res, next) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return next(new HandleError("Order not found", 404));

  const transactionUuid = `${orderId}-${Date.now()}`;
  const amount = order.totalPrice;

  // Log as pending BEFORE redirecting — so a dropped connection or closed
  // tab doesn't leave you with no record of the attempt at all.
  await Payment.create({
    order: orderId,
    user: req.user._id,
    method: "esewa", // internal Payment ledger value — separate from orderModel's "eSewa" enum
    amount,
    status: "pending",
    referenceId: transactionUuid,
  });

  const signature = generateEsewaSignature(amount, transactionUuid, ESEWA_CONFIG.productCode, ESEWA_CONFIG.secretKey);

  res.status(200).json({
    success: true,
    url: ESEWA_CONFIG.formUrl,
    payload: {
      amount,
      tax_amount: "0",
      total_amount: amount,
      transaction_uuid: transactionUuid,
      product_code: ESEWA_CONFIG.productCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${process.env.BACKEND_URL}/api/v1/payment/esewa/verify`,
      failure_url: `${process.env.FRONTEND_URL}/order-failed`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    },
  });
});

// GET /api/v1/payment/esewa/verify   (eSewa redirects here with ?data=base64)
export const verifyEsewa = handleAsyncError(async (req, res, next) => {
  const encodedData = req.query.data;
  if (!encodedData) return res.redirect(`${process.env.FRONTEND_URL}/order-failed`);

  const decoded = JSON.parse(Buffer.from(encodedData, "base64").toString("utf-8"));

  // Never trust the redirect alone — verify the signature eSewa sent back.
  const isValid = verifyEsewaSignature(decoded, ESEWA_CONFIG.secretKey);
  if (!isValid) return res.redirect(`${process.env.FRONTEND_URL}/order-failed`);

  const payment = await Payment.findOne({ referenceId: decoded.transaction_uuid });
  if (!payment) return res.redirect(`${process.env.FRONTEND_URL}/order-failed`);

  if (decoded.status === "COMPLETE") {
    payment.status = "completed";
    payment.gatewayTransactionId = decoded.transaction_code;
    payment.gatewayResponse = decoded;
    await payment.save();

    await Order.findByIdAndUpdate(payment.order, {
      "paymentInfo.status": "Paid",
      "paymentInfo.method": "eSewa",
      "paymentInfo.id": decoded.transaction_code,
      paidAt: Date.now(),
      orderStatus: "Confirmed",
      $push: {
        statusHistory: { status: "Confirmed", changedAt: new Date(), note: "Payment verified via eSewa" },
      },
    });

    return res.redirect(`${process.env.FRONTEND_URL}/order-confirmation?orderId=${payment.order}`);
  }

  payment.status = "failed";
  payment.gatewayResponse = decoded;
  await payment.save();

  // Payment failed — don't leave stock silently deducted for good.
  const failedOrder = await Order.findById(payment.order);
  if (failedOrder && failedOrder.orderStatus !== "Cancelled") {
    await restoreStock(failedOrder.orderItems);
    failedOrder.orderStatus = "Cancelled";
    failedOrder.paymentInfo.status = "Failed";
    failedOrder.statusHistory.push({
      status: "Cancelled",
      changedAt: new Date(),
      note: "eSewa payment failed or was not completed",
    });
    await failedOrder.save();
  }

  res.redirect(`${process.env.FRONTEND_URL}/order-failed`);
});

// ─── Khalti ───────────────────────────────────────────────────────────────

// POST /api/v1/payment/khalti/initiate   body: { orderId }
export const initiateKhalti = handleAsyncError(async (req, res, next) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return next(new HandleError("Order not found", 404));

  const amountInPaisa = Math.round(order.totalPrice * 100); // Khalti expects paisa, not rupees

  const khaltiRes = await initiateKhaltiPayment({
    amount: amountInPaisa,
    purchaseOrderId: orderId,
    purchaseOrderName: `Order #${orderId}`,
    returnUrl: `${process.env.BACKEND_URL}/api/v1/payment/khalti/verify`,
    websiteUrl: process.env.FRONTEND_URL,
    customerInfo: {
      name: req.user.name,
      email: req.user.email,
    },
  });

  await Payment.create({
    order: orderId,
    user: req.user._id,
    method: "khalti",
    amount: order.totalPrice,
    status: "pending",
    referenceId: khaltiRes.pidx,
  });

  res.status(200).json({ success: true, paymentUrl: khaltiRes.payment_url, pidx: khaltiRes.pidx });
});

// GET /api/v1/payment/khalti/verify   (Khalti redirects here with ?pidx=...)
export const verifyKhalti = handleAsyncError(async (req, res) => {
  const { pidx } = req.query;
  if (!pidx) return res.redirect(`${process.env.FRONTEND_URL}/order-failed`);

  const lookupRes = await lookupKhaltiPayment(pidx);

  const payment = await Payment.findOne({ referenceId: pidx });
  if (!payment) return res.redirect(`${process.env.FRONTEND_URL}/order-failed`);

  if (lookupRes.status === "Completed") {
    payment.status = "completed";
    payment.gatewayTransactionId = lookupRes.transaction_id;
    payment.gatewayResponse = lookupRes;
    await payment.save();

    await Order.findByIdAndUpdate(payment.order, {
      "paymentInfo.status": "Paid",
      "paymentInfo.method": "Khalti",
      "paymentInfo.id": lookupRes.transaction_id,
      paidAt: Date.now(),
      orderStatus: "Confirmed",
      $push: {
        statusHistory: { status: "Confirmed", changedAt: new Date(), note: "Payment verified via Khalti" },
      },
    });

    return res.redirect(`${process.env.FRONTEND_URL}/order-confirmation?orderId=${payment.order}`);
  }

  payment.status = "failed";
  payment.gatewayResponse = lookupRes;
  await payment.save();

  const failedOrder = await Order.findById(payment.order);
  if (failedOrder && failedOrder.orderStatus !== "Cancelled") {
    await restoreStock(failedOrder.orderItems);
    failedOrder.orderStatus = "Cancelled";
    failedOrder.paymentInfo.status = "Failed";
    failedOrder.statusHistory.push({
      status: "Cancelled",
      changedAt: new Date(),
      note: "Khalti payment failed or was not completed",
    });
    await failedOrder.save();
  }

  res.redirect(`${process.env.FRONTEND_URL}/order-failed`);
});

// ─── Bank Transfer (manual) ─────────────────────────────────────────────────

// GET /api/v1/payment/bank-transfer/details
export const getBankDetails = handleAsyncError(async (req, res) => {
  res.status(200).json({ success: true, bank: BANK_ACCOUNT_INFO });
});

// POST /api/v1/payment/bank-transfer/submit
// body: { orderId, referenceNumber, screenshotUrl }
// (upload the screenshot to Cloudinary on the frontend first — you already
// have config/cloudinary.js — then send the resulting URL here)
export const submitBankTransfer = handleAsyncError(async (req, res, next) => {
  const { orderId, referenceNumber, screenshotUrl } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return next(new HandleError("Order not found", 404));

  const transfer = await BankTransfer.create({
    order: orderId,
    user: req.user._id,
    amount: order.totalPrice,
    referenceNumber,
    screenshotUrl,
    status: "pending_review",
  });

  await Order.findByIdAndUpdate(orderId, {
    "paymentInfo.method": "Bank Transfer",
    "paymentInfo.status": "Pending Verification",
  });

  res.status(201).json({ success: true, message: "Submitted — we'll confirm once verified.", transfer });
});

// PATCH /api/v1/payment/bank-transfer/:id/review   (admin only)
// body: { approve: boolean, note?: string }
export const reviewBankTransfer = handleAsyncError(async (req, res, next) => {
  const { approve, note } = req.body;
  const transfer = await BankTransfer.findById(req.params.id);
  if (!transfer) return next(new HandleError("Transfer record not found", 404));

  transfer.status = approve ? "approved" : "rejected";
  transfer.reviewedBy = req.user._id;
  transfer.reviewNote = note || "";
  await transfer.save();

  const order = await Order.findById(transfer.order);
  if (!order) return next(new HandleError("Linked order not found", 404));

  if (approve) {
    order.paymentInfo.status = "Paid";
    order.paidAt = Date.now();
    order.orderStatus = "Confirmed";
    order.statusHistory.push({
      status: "Confirmed",
      changedAt: new Date(),
      changedBy: req.user._id,
      note: "Bank transfer verified by admin",
    });
  } else {
    // Rejected — same stock leak risk as a failed gateway payment.
    // Restore stock rather than leaving it silently deducted.
    if (order.orderStatus !== "Cancelled") {
      await restoreStock(order.orderItems);
    }
    order.paymentInfo.status = "Failed";
    order.orderStatus = "Cancelled";
    order.statusHistory.push({
      status: "Cancelled",
      changedAt: new Date(),
      changedBy: req.user._id,
      note: `Bank transfer rejected: ${note || "no reason given"}`,
    });
  }

  await order.save();

  res.status(200).json({ success: true, transfer });
});