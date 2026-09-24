import express from "express";
import {
  getBusinessSettings,
  updateBusinessSettings,
} from "../controllers/businessSettingsController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";

const router = express.Router();

// Public route to get business settings (for footer)
router.get("/business-settings", getBusinessSettings);

// Admin route to update business settings
router.put("/admin/business-settings", verifyUserAuth, roleBasedAccess("admin"), updateBusinessSettings);

export default router;