import Notification from "../models/notificationModel.js";
import { emitToAdmins } from "../socket/socket.js";

// This service:
//   1. Saves the notification to MongoDB (for history / unread counts)
//   2. Emits a real-time event to all connected admin sockets

// ─────────────────────────────────────────────────────────────────────────────
// EVENT NAME MAP
// ─────────────────────────────────────────────────────────────────────────────
// Clients listen for these event names on the socket.
const EVENT_MAP = {
  ORDER:   "notification:new-order",
  RETURN:  "notification:new-return",
  MESSAGE: "notification:new-message",
  USER:    "notification:new-user",
  SYSTEM:  "notification:new-system",
};


// ─────────────────────────────────────────────────────────────────────────────
// NOTIFY ADMINS
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Persists a notification and broadcasts it to all admin sockets.
 *
 * @param {object} params
 * @param {"ORDER"|"RETURN"|"MESSAGE"|"USER"|"SYSTEM"} params.type
 * @param {string} params.title   — Short title (shown in bell badge)
 * @param {string} params.message — Longer description
 * @param {object} [params.data]  — Flexible payload (IDs, amounts, etc.)
 * @returns {Promise<object|null>} The saved Notification document, or null on error
 */
export const notifyAdmins = async ({ type, title, message, data = {} }) => {
  try {
    // ── 1. Persist to MongoDB ──────────────────────────────────────────
    const notification = await Notification.create({
      type,
      title,
      message,
      data,
    });

    // ── 2. Emit via Socket.IO ──────────────────────────────────────────
    // The payload sent over the wire is a lightweight copy of what's
    // stored in the DB. The client can use this for the live bell badge.
    const event = EVENT_MAP[type] || "notification:new-system";

    emitToAdmins(event, {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (err) {
    // Notification failures must NEVER break the calling controller.
    // Log the error and move on — the order/return/etc. was already saved.
    console.error(
      `Notification service error (${type}):`,
      err?.message || err
    );
    return null;
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// GET NOTIFICATIONS (paginated, for REST API)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @returns {Promise<object>} { notifications, total, totalPages, currentPage }
 */
export const getNotifications = async ({
  page = 1,
  limit = 20,
} = {}) => {
  const p = Math.max(Number(page) || 1, 1);
  const l = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (p - 1) * l;

  const [notifications, total] = await Promise.all([
    Notification.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    Notification.countDocuments(),
  ]);

  return {
    notifications,
    total,
    totalPages: Math.ceil(total / l),
    currentPage: p,
    limit: l,
  };
};


// ─────────────────────────────────────────────────────────────────────────────
// GET UNREAD COUNT
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns the number of notifications the given admin has NOT yet read.
 * @param {string} userId — The admin's MongoDB ObjectId string
 * @returns {Promise<number>}
 */
export const getUnreadCount = async (userId) => {
  return Notification.countDocuments({
    readBy: { $ne: userId },
  });
};


// ─────────────────────────────────────────────────────────────────────────────
// MARK AS READ
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Adds the admin's userId to the notification's readBy array.
 * Uses $addToSet to avoid duplicates (idempotent).
 * @param {string} notificationId
 * @param {string} userId
 * @returns {Promise<object|null>} Updated notification or null
 */
export const markAsRead = async (notificationId, userId) => {
  return Notification.findByIdAndUpdate(
    notificationId,
    { $addToSet: { readBy: userId } },
    { new: true }
  ).lean();
};


// ─────────────────────────────────────────────────────────────────────────────
// MARK ALL AS READ
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Adds the admin's userId to every notification that they haven't read.
 * @param {string} userId
 * @returns {Promise<number>} Number of notifications updated
 */
export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );

  return result.modifiedCount;
};
