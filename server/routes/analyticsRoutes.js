import express from "express";
import {
  getDashboardStats,
  getAnalytics,
  getTopCustomers,
} from "../controllers/analyticsController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";

const router = express.Router();

// All analytics routes are admin-only
router.get("/admin/dashboard",      verifyUserAuth, roleBasedAccess("admin"), getDashboardStats);
router.get("/admin/analytics",      verifyUserAuth, roleBasedAccess("admin"), getAnalytics);
router.get("/admin/customers/top",  verifyUserAuth, roleBasedAccess("admin"), getTopCustomers);

export default router;
