import express from "express";

import {
  createReturnRequest,
  cancelMyReturn,
  getMyReturns,
  getMySingleReturn,
  getAllReturns,
  getAdminSingleReturn,
  updateReturn,
  processRefund,
  deleteReturn,
} from "../controllers/returnController.js";

import {
  verifyUserAuth,
  roleBasedAccess,
} from "../middleware/userAuth.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMER RETURN ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Create return request
router.post(
  "/returns",
  verifyUserAuth,
  createReturnRequest
);

// Cancel own return
router.put(
  "/returns/:id/cancel",
  verifyUserAuth,
  cancelMyReturn
);

// Get logged-in customer's returns
router.get(
  "/returns/me",
  verifyUserAuth,
  getMyReturns
);

// Get logged-in customer's single return
router.get(
  "/returns/:id",
  verifyUserAuth,
  getMySingleReturn
);

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN RETURN ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Get all returns
router.get(
  "/admin/returns",
  verifyUserAuth,
  roleBasedAccess("admin"),
  getAllReturns
);

// Get single return
router.get(
  "/admin/returns/:id",
  verifyUserAuth,
  roleBasedAccess("admin"),
  getAdminSingleReturn
);

// Update return status / inspection / refund approval
router.put(
  "/admin/returns/:id",
  verifyUserAuth,
  roleBasedAccess("admin"),
  updateReturn
);

// Process / record refund payout
router.put(
  "/admin/returns/:id/refund",
  verifyUserAuth,
  roleBasedAccess("admin"),
  processRefund
);


// ═══════════════════════════════════════════════════════════════════════════
// ADMIN SOFT DELETE
// ═══════════════════════════════════════════════════════════════════════════

router.delete(
  "/admin/returns/:id",
  verifyUserAuth,
  roleBasedAccess("admin"),
  deleteReturn
);

export default router;