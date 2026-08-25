import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon,
} from "../controllers/cartController.js";
import { verifyUserAuth } from "../middleware/userAuth.js";

const router = express.Router();

// All cart routes require authentication
// A cart belongs to a user — guests use localStorage on the frontend

router.get("/cart",             verifyUserAuth, getCart);         // GET  full cart with totals
router.post("/cart",            verifyUserAuth, addToCart);       // POST add item
router.put("/cart/:itemId",     verifyUserAuth, updateCartItem);  // PUT  change quantity
router.delete("/cart/:itemId",  verifyUserAuth, removeCartItem);  // DEL  remove one item
router.delete("/cart",          verifyUserAuth, clearCart);       // DEL  clear entire cart

router.post("/cart/coupon",     verifyUserAuth, applyCoupon);     // POST apply coupon
router.delete("/cart/coupon",   verifyUserAuth, removeCoupon);    // DEL  remove coupon

export default router;
