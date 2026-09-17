import express from "express";
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getActiveCoupons,
} from "../controllers/couponController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";

const router = express.Router();

// Public routes (no auth required)
router.get("/coupons/active", getActiveCoupons);
router.get("/coupons/public", getActiveCoupons); // Alias for frontend compatibility

//  Customer — preview discount before checkout 
router.post("/coupon/validate", verifyUserAuth, validateCoupon);

//  Admin 
router
  .route("/admin/coupons")
  .get(verifyUserAuth,  roleBasedAccess("admin"), getCoupons)
  .post(verifyUserAuth, roleBasedAccess("admin"), createCoupon);

router
  .route("/admin/coupon/:id")
  .put(verifyUserAuth,    roleBasedAccess("admin"), updateCoupon)
  .delete(verifyUserAuth, roleBasedAccess("admin"), deleteCoupon);

export default router;
