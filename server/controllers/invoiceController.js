import mongoose from "mongoose";

import Order from "../models/orderModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import { generateInvoice } from "../utils/generateInvoice.js";

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD ORDER INVOICE
// ─────────────────────────────────────────────────────────────────────────────
//
// CUSTOMER:
// GET /api/v1/invoice/order/:id/invoice
//
// ADMIN:
// GET /api/v1/invoice/admin/order/:id/invoice
//
// Security:
// - Requires authentication.
// - Customer can download only their own invoice.
// - Admin can download any non-deleted eligible order.
// - Cancelled orders are blocked.
// - Invoice eligibility is verified server-side.
// - PDF is generated before response headers are committed.
// ─────────────────────────────────────────────────────────────────────────────

export const downloadInvoice = handleAsyncError(
  async (req, res, next) => {
    const { id } = req.params;

    // ───────────────────────────────────────────────────────────────────────
    // VALIDATE ORDER ID
    // ───────────────────────────────────────────────────────────────────────

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(
        new HandleError("Invalid order ID", 400)
      );
    }

    // ───────────────────────────────────────────────────────────────────────
    // FIND ORDER
    // ───────────────────────────────────────────────────────────────────────

    const order = await Order.findById(id)
      .populate("user", "name email phone pan")
      .lean();

    if (!order || order.isDeleted) {
      return next(
        new HandleError("Order not found", 404)
      );
    }

    // ───────────────────────────────────────────────────────────────────────
    // AUTHORIZATION
    // ───────────────────────────────────────────────────────────────────────

    const loggedInUserId = req.user?._id?.toString();

    const orderUserId = order.user?._id?.toString();

    const isAdmin =
      req.user?.role === "admin";

    const isOwner =
      Boolean(loggedInUserId) &&
      Boolean(orderUserId) &&
      loggedInUserId === orderUserId;

    // Customer must own the order.
    // Admin can access any order.
    if (!isAdmin && !isOwner) {
      return next(
        new HandleError(
          "You are not authorised to download this invoice",
          403
        )
      );
    }

    // ───────────────────────────────────────────────────────────────────────
    // CANCELLED ORDERS
    // ───────────────────────────────────────────────────────────────────────

    if (order.orderStatus === "Cancelled") {
      return next(
        new HandleError(
          "Invoice is not available for cancelled orders",
          400
        )
      );
    }

    // ───────────────────────────────────────────────────────────────────────
    // PAYMENT INFORMATION
    // ───────────────────────────────────────────────────────────────────────

    const paymentMethod =
      order.paymentInfo?.method || "COD";

    const paymentStatus =
      order.paymentInfo?.status || "Pending";

    const isCOD =
      paymentMethod === "COD";

    const isOnlinePayment =
      !isCOD;

    // ───────────────────────────────────────────────────────────────────────
    // PAYMENT STATUS
    // ───────────────────────────────────────────────────────────────────────
    //
    // Paid:
    //   Normal successful payment.
    //
    // Partially Refunded:
    //   Original invoice can still be downloaded.
    //
    // Refunded:
    //   Original invoice can still be downloaded as a record of purchase.
    //
    // Failed/Pending:
    //   Invoice is not yet available.
    // ───────────────────────────────────────────────────────────────────────

    const isPaidOrRefunded =
      paymentStatus === "Paid" ||
      paymentStatus === "Partially Refunded" ||
      paymentStatus === "Refunded";

    // ───────────────────────────────────────────────────────────────────────
    // COD INVOICE
    // ───────────────────────────────────────────────────────────────────────
    //
    // COD is considered completed only after delivery.
    // ───────────────────────────────────────────────────────────────────────

    const isDeliveredCOD =
      isCOD &&
      order.orderStatus === "Delivered";

    // ───────────────────────────────────────────────────────────────────────
    // ONLINE PAYMENT INVOICE
    // ───────────────────────────────────────────────────────────────────────

    const isSuccessfulOnlinePayment =
      isOnlinePayment &&
      isPaidOrRefunded;

    // ───────────────────────────────────────────────────────────────────────
    // FINAL ELIGIBILITY
    // ───────────────────────────────────────────────────────────────────────

    const invoiceEligible =
      isDeliveredCOD ||
      isSuccessfulOnlinePayment;

    if (!invoiceEligible) {
      return next(
        new HandleError(
          "Invoice is not available until the order has been successfully paid or delivered",
          400
        )
      );
    }

    // ───────────────────────────────────────────────────────────────────────
    // BASIC FINANCIAL VALIDATION
    // ───────────────────────────────────────────────────────────────────────

    if (
      !Array.isArray(order.orderItems) ||
      order.orderItems.length === 0
    ) {
      return next(
        new HandleError(
          "Order has no invoiceable items",
          400
        )
      );
    }

    if (
      !Number.isFinite(Number(order.totalPrice)) ||
      Number(order.totalPrice) < 0
    ) {
      return next(
        new HandleError(
          "Order contains invalid financial information",
          500
        )
      );
    }

    // ───────────────────────────────────────────────────────────────────────
    // GENERATE AND SEND PDF
    // ───────────────────────────────────────────────────────────────────────
    //
    // generateInvoice() returns a Buffer.
    //
    // This is safer than piping PDFKit directly to res because:
    // - PDF generation can fail before headers are sent.
    // - We can return a clean error response.
    // - The client never receives a partially generated PDF.
    // ───────────────────────────────────────────────────────────────────────

    try {
      // ───────────────────────────────────────────────────────────────────
      // PERSIST IMMUTABLE INVOICE NUMBER
      // ───────────────────────────────────────────────────────────────────
      let invoiceNumber = order.invoiceNumber;

      if (!invoiceNumber) {
        const orderDate = new Date(order.createdAt || Date.now());
        const year = Number.isNaN(orderDate.getTime())
          ? new Date().getFullYear()
          : orderDate.getFullYear();

        const rawCode = String(order.orderNumber || order._id)
          .replace(/^MH-/, "")
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(-8)
          .toUpperCase() || "0001";

        invoiceNumber = `INV-${year}-${rawCode}`;

        await Order.findByIdAndUpdate(order._id, {
          invoiceNumber,
          invoiceGeneratedAt: new Date(),
        });

        order.invoiceNumber = invoiceNumber;
        order.invoiceGeneratedAt = new Date();
      }

      const pdfBuffer = await generateInvoice(
        order,
        order.user
      );

      if (
        !Buffer.isBuffer(pdfBuffer) ||
        pdfBuffer.length === 0
      ) {
        throw new Error(
          "Invoice PDF buffer is empty"
        );
      }

      const safeInvoiceName =
        String(invoiceNumber)
          .replace(/[^a-zA-Z0-9_-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "") || "invoice";

      const filename =
        `Invoice-${safeInvoiceName}.pdf`;

      // ───────────────────────────────────────────────────────────────────
      // RESPONSE HEADERS
      // ───────────────────────────────────────────────────────────────────

      res.status(200);

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      res.setHeader(
        "Content-Length",
        pdfBuffer.length
      );

      // Invoice contains customer/order information.
      // Prevent browser/proxy caching.
      res.setHeader(
        "Cache-Control",
        "private, no-store, max-age=0, must-revalidate"
      );

      res.setHeader(
        "Pragma",
        "no-cache"
      );

      res.setHeader(
        "Expires",
        "0"
      );

      // ───────────────────────────────────────────────────────────────────
      // SEND PDF
      // ───────────────────────────────────────────────────────────────────

      return res.end(pdfBuffer);
    } catch (error) {
      console.error(
        "Invoice generation failed:",
        error
      );

      if (res.headersSent) {
        return;
      }

      return next(
        new HandleError(
          "Failed to generate invoice. Please try again.",
          500
        )
      );
    }
  }
);