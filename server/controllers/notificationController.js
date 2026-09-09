import mongoose from "mongoose";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../services/notificationService.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL NOTIFICATIONS (paginated)
// Fetch all the notifiacation list requested by controller
// GET /api/v1/notifications?page=1&limit=20
// ─────────────────────────────────────────────────────────────────────────────

export const getAllNotifications = handleAsyncError(
  async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await getNotifications({ page, limit });

    // Annotate each notification with whether the current admin has read it
    const userId = req.user._id.toString();

    const notifications = result.notifications.map((n) => ({
      ...n,
      isRead: n.readBy.some(
        (id) => id.toString() === userId
      ),
    }));

    return res.status(200).json({
      success: true,
      count: notifications.length,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      limit: result.limit,
      notifications,
    });
  }
);


// ─────────────────────────────────────────────────────────────────────────────
// GET UNREAD COUNT
// gets unread notification count by admin 
// GET /api/v1/notifications/unread
// ─────────────────────────────────────────────────────────────────────────────

export const getNotificationUnreadCount = handleAsyncError(
  async (req, res) => {
    const count = await getUnreadCount(
      req.user._id.toString()
    );

    return res.status(200).json({
      success: true,
      unreadCount: count,
    });
  }
);


// ─────────────────────────────────────────────────────────────────────────────
// MARK SINGLE NOTIFICATION AS READ
// PUT /api/v1/notifications/:id/read
// ─────────────────────────────────────────────────────────────────────────────

export const markNotificationAsRead = handleAsyncError(
  async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(
        new HandleError("Invalid notification ID", 400)
      );
    }

    const notification = await markAsRead(
      id,
      req.user._id.toString()
    );

    if (!notification) {
      return next(
        new HandleError("Notification not found", 404)
      );
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  }
);


// ─────────────────────────────────────────────────────────────────────────────
// MARK ALL NOTIFICATIONS AS READ
// PUT /api/v1/notifications/read-all
// ─────────────────────────────────────────────────────────────────────────────

export const markAllNotificationsAsRead = handleAsyncError(
  async (req, res) => {
    const modifiedCount = await markAllAsRead(
      req.user._id.toString()
    );

    return res.status(200).json({
      success: true,
      message: `${modifiedCount} notification(s) marked as read`,
      modifiedCount,
    });
  }
);
