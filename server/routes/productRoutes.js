import express from "express";
import {
  getAllProducts,
  getSingleProduct,
  getFilterOptions,
  getProductReviews,
  createOrUpdateReview,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteReview,
} from "../controllers/productController.js";
import {
  verifyUserAuth,
  roleBasedAccess,
} from "../middleware/userAuth.js";
import { cacheMiddleware, clearCacheMiddleware } from "../middleware/cache.js";

const router = express.Router();

// Public product APIs - with caching
router.get("/products", cacheMiddleware('product'), getAllProducts);
router.get("/filters", cacheMiddleware('category', 600), getFilterOptions); // Cache filters for 10 minutes
router.get("/product/:id", cacheMiddleware('product'), getSingleProduct); // :id = ObjectId OR slug
router.get("/reviews", cacheMiddleware('product', 180), getProductReviews); // Cache reviews for 3 minutes

// Authenticated routes - clear cache after modifications
router.put("/review", verifyUserAuth, clearCacheMiddleware('product'), createOrUpdateReview);

// Users can delete their own review;
// admins can delete any review
// DELETE /api/v1/reviews?productId=<id>&id=<reviewId>
router.delete("/reviews", verifyUserAuth, clearCacheMiddleware('product'), deleteReview);

//Admin and Intern produts management routes
router.get(
  "/admin/products",
  verifyUserAuth,
  roleBasedAccess("admin", "intern"),
  getAdminProducts
);

router.post(
  "/admin/product/create",
  verifyUserAuth,
  roleBasedAccess("admin", "intern"),
  clearCacheMiddleware('product'),
  createProduct
);

router
  .route("/admin/product/:id")
  .put(
    verifyUserAuth,
    roleBasedAccess("admin", "intern"),
    clearCacheMiddleware('product'),
    updateProduct
  )
  .delete(
    verifyUserAuth,
    roleBasedAccess("admin", "intern"),
    clearCacheMiddleware('product'),
    deleteProduct
  );

export default router;