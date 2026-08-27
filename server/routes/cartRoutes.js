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

router.get("/cart", verifyUserAuth, getCart);
router.post("/cart", verifyUserAuth, addToCart);
router.put("/cart/:itemId", verifyUserAuth, updateCartItem);
// Specific route FIRST
router.delete("/cart/coupon", verifyUserAuth, removeCoupon);
// Dynamic route AFTER
router.delete("/cart/:itemId", verifyUserAuth, removeCartItem);
router.delete("/cart", verifyUserAuth, clearCart);
router.post("/cart/coupon", verifyUserAuth, applyCoupon); // DEL  remove coupon

export default router;
