import express from "express";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";
import {
  getAllNotifications,
  getNotificationUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION ROUTES
// ─────────────────────────────────────────────────────────────────────────────
// All routes require admin authentication.
// Mounted at /api/v1 in index.js → full paths are /api/v1/notifications/...
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/notifications/unread
// Must be defined BEFORE /:id to avoid "unread" being matched as an ID
router.get(
  "/notifications/unread",
  verifyUserAuth,
  roleBasedAccess("admin"),
  getNotificationUnreadCount
);

// GET /api/v1/notifications?page=1&limit=20
router.get(
  "/notifications",
  verifyUserAuth,
  roleBasedAccess("admin"),
  getAllNotifications
);

// PUT /api/v1/notifications/read-all
router.put(
  "/notifications/read-all",
  verifyUserAuth,
  roleBasedAccess("admin"),
  markAllNotificationsAsRead
);

// PUT /api/v1/notifications/:id/read
router.put(
  "/notifications/:id/read",
  verifyUserAuth,
  roleBasedAccess("admin"),
  markNotificationAsRead
);

export default router;
