import express from "express";
import rateLimit from "express-rate-limit";

import { downloadInvoice } from "../controllers/invoiceController.js";

import {
  verifyUserAuth,
  roleBasedAccess,
} from "../middleware/userAuth.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITER FOR INVOICE GENERATION
// ─────────────────────────────────────────────────────────────────────────────
// PDF generation is CPU-bound. Limit requests to protect the Node.js event loop
// against denial-of-service and runaway loops.
// ─────────────────────────────────────────────────────────────────────────────

const invoiceDownloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 invoice downloads per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many invoice download requests from this IP. Please try again after 15 minutes.",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER INVOICE
// ─────────────────────────────────────────────────────────────────────────────
// Authenticated customer can download their own invoice.
// Ownership is additionally checked inside the controller.
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/order/:id/invoice",
  invoiceDownloadLimiter,
  verifyUserAuth,
  downloadInvoice
);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN INVOICE
// ─────────────────────────────────────────────────────────────────────────────
// Only authenticated admins can access any order invoice.
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/admin/order/:id/invoice",
  invoiceDownloadLimiter,
  verifyUserAuth,
  roleBasedAccess("admin"),
  downloadInvoice
);

export default router;