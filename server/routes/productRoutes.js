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

const router = express.Router();

// Public product APIs
router.get("/products", getAllProducts);
router.get("/filters", getFilterOptions);
router.get("/product/:id", getSingleProduct); // :id = ObjectId OR slug
router.get("/reviews", getProductReviews); // ?id=<productId>

// Authenticated routes
router.put("/review", verifyUserAuth, createOrUpdateReview);

// Users can delete their own review;
// admins can delete any review
// DELETE /api/v1/reviews?productId=<id>&id=<reviewId>
router.delete("/reviews", verifyUserAuth, deleteReview);

//Admin produts routes
router.get(
  "/admin/products",
  verifyUserAuth,
  roleBasedAccess("admin"),
  getAdminProducts
);

router.post(
  "/admin/product/create",
  verifyUserAuth,
  roleBasedAccess("admin"),
  createProduct
);

router
  .route("/admin/product/:id")
  .put(
    verifyUserAuth,
    roleBasedAccess("admin"),
    updateProduct
  )
  .delete(
    verifyUserAuth,
    roleBasedAccess("admin"),
    deleteProduct
  );

export default router;