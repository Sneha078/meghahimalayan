import express from "express";
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";

const router = express.Router();

// ── Customer — preview discount before checkout ───────────────────────────────
router.post("/coupon/validate", verifyUserAuth, validateCoupon);

// ── Admin ─────────────────────────────────────────────────────────────────────
router
  .route("/admin/coupons")
  .get(verifyUserAuth,  roleBasedAccess("admin"), getCoupons)
  .post(verifyUserAuth, roleBasedAccess("admin"), createCoupon);

router
  .route("/admin/coupon/:id")
  .put(verifyUserAuth,    roleBasedAccess("admin"), updateCoupon)
  .delete(verifyUserAuth, roleBasedAccess("admin"), deleteCoupon);

export default router;
