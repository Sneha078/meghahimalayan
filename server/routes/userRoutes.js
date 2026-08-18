import express from "express";
import {
  registerUser,
  loginUser,
  logout,
  forgotPassword,
  resetPassword,
  getUserDetails,
  updatePassword,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getUsersList,
  getSingleUser,
  updateUserRole,
  deleteUser,
} from "../controllers/userController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post("/register", registerUser);
router.post("/login",    loginUser);
router.post("/logout",   logout);

router.post("/password/forgot",          forgotPassword);
router.put("/password/reset/:token",     resetPassword);

// ── Authenticated ─────────────────────────────────────────────────────────────
router.get("/me",              verifyUserAuth, getUserDetails);
router.put("/me/update",       verifyUserAuth, updateProfile);
router.put("/password/update", verifyUserAuth, updatePassword);

// Addresses
router.post("/addresses",                      verifyUserAuth, addAddress);
router.put("/address/:addressId",              verifyUserAuth, updateAddress);
router.delete("/address/:addressId",           verifyUserAuth, deleteAddress);

// Wishlist
router.get("/wishlist",              verifyUserAuth, getWishlist);
router.post("/wishlist",             verifyUserAuth, addToWishlist);
router.delete("/wishlist/:productId", verifyUserAuth, removeFromWishlist);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get(
  "/admin/users",
  verifyUserAuth, roleBasedAccess("admin"),
  getUsersList
);
router
  .route("/admin/user/:id")
  .get(verifyUserAuth,    roleBasedAccess("admin"), getSingleUser)
  .put(verifyUserAuth,    roleBasedAccess("admin"), updateUserRole)
  .delete(verifyUserAuth, roleBasedAccess("admin"), deleteUser);

export default router;
