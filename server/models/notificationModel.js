import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // ── Notification type ──────────────────────────────────────────────
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: {
        values: ["ORDER", "RETURN", "MESSAGE", "USER", "SYSTEM"],
        message: "Invalid notification type: {VALUE}",
      },
      index: true,
    },

    // ── Title (short, for the bell tooltip / first line) ───────────────
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    // ── Message (detailed description) ───────────────────────────────────
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },

    // ── Flexible payload ───────────────────────────────────────────────
    // Stores IDs and context the frontend needs to build links.
    // Examples:
    //   ORDER:   { orderId, orderNumber, totalAmount }
    //   RETURN:  { returnId, returnNumber, orderId }
    //   MESSAGE: { messageId, senderName, subject }
    //   USER:    { userId, userName, email }
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ── Read tracking ──────────────────────────────────────────────────
    // Each admin's ObjectId is pushed here when they mark it as read.
    // readBy.includes(myId) → "I have read this notification".
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────────────────────────────────────────

// Default listing: newest first
notificationSchema.index({ createdAt: -1 });

// Filter by type + sort by date
notificationSchema.index({ type: 1, createdAt: -1 });

// Unread count queries: find notifications NOT read by a specific admin
notificationSchema.index({ readBy: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// MODEL
// ─────────────────────────────────────────────────────────────────────────────

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;
