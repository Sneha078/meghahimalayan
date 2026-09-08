import sendEmail from "../utils/sendEmail.js";
import User from "../models/userModel.js";

import {
  orderConfirmationTemplate,
} from "../templates/orderConfirmation.js";

import {
  adminNewOrderTemplate,
} from "../templates/adminNewOrder.js";

import {
  orderStatusTemplate,
} from "../templates/orderStatus.js";

import {
  paymentFailedTemplate,
} from "../templates/paymentFailed.js";

import {
  passwordResetTemplate,
} from "../templates/passwordReset.js";

import {
  welcomeTemplate,
} from "../templates/welcome.js";

import {
  orderCancelledTemplate,
} from "../templates/orderCancelled.js";

import {
  returnStatusTemplate,
} from "../templates/returnStatus.js";

import {
  adminNewReturnTemplate,
} from "../templates/adminNewReturn.js";

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN EMAILS
// ─────────────────────────────────────────────────────────────────────────────

const getAllActiveAdminEmails = async () => {
  const admins = await User.find({
    role: "admin",
    isActive: true,
    isDeleted: false,
  })
    .select("email")
    .lean();

  return admins
    .map((admin) => admin.email)
    .filter(Boolean);
};


// ─────────────────────────────────────────────────────────────────────────────
// ORDER CONFIRMATION
// ─────────────────────────────────────────────────────────────────────────────

export const sendOrderConfirmationEmail = async (
  order,
  user
) => {
  if (!user?.email) {
    throw new Error(
      "Cannot send order confirmation: customer email missing"
    );
  }

  const html = orderConfirmationTemplate({
    order,
    user,
    frontendUrl: FRONTEND_URL,
  });

  return sendEmail({
    email: user.email,

    subject:
      `Order Received — ${order.orderNumber} | Mega Himalaya`,

    text:
      `Thank you for your order ${order.orderNumber}. ` +
      `Your order has been received and is being processed. ` +
      `Total: NPR ${order.totalPrice}.`,

    html,
  });
};


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN NEW ORDER
// ─────────────────────────────────────────────────────────────────────────────

export const sendAdminNewOrderEmail = async (
  order,
  customer
) => {
  const adminEmails =
    await getAllActiveAdminEmails();

  if (adminEmails.length === 0) {
    return [];
  }

  const html = adminNewOrderTemplate({
    order,
    customer,
    frontendUrl: FRONTEND_URL,
  });

  const results = await Promise.allSettled(
    adminEmails.map((adminEmail) =>
      sendEmail({
        email: adminEmail,

        subject:
          `New Order ${order.orderNumber} — NPR ${order.totalPrice}`,

        text:
          `New order ${order.orderNumber} ` +
          `was placed by ${customer?.name || "customer"}. ` +
          `Total: NPR ${order.totalPrice}.`,

        html,
      })
    )
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Admin email failed: ${adminEmails[index]}`,
        result.reason?.message || result.reason
      );
    }
  });

  return results;
};


// ─────────────────────────────────────────────────────────────────────────────
// ORDER STATUS
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_ORDER_STATUSES = new Set([
  "Confirmed",
  "Shipped",
  "Delivered",
]);

export const sendOrderStatusEmail = async (
  order,
  user,
  status
) => {
  if (!EMAIL_ORDER_STATUSES.has(status)) {
    throw new Error(
      `Email notification not supported for order status: ${status}`
    );
  }

  if (!user?.email) {
    throw new Error(
      "Cannot send order status email: customer email missing"
    );
  }

  const html = orderStatusTemplate({
    order,
    user,
    status,
    frontendUrl: FRONTEND_URL,
  });

  const subjects = {
    Confirmed:
      `Order Confirmed — ${order.orderNumber} | Mega Himalaya`,

    Shipped:
      `Your Order Has Shipped — ${order.orderNumber} | Mega Himalaya`,

    Delivered:
      `Your Order Has Been Delivered — ${order.orderNumber} | Mega Himalaya`,
  };

  return sendEmail({
    email: user.email,
    subject: subjects[status],

    text:
      `Your order ${order.orderNumber} ` +
      `status has been updated to ${status}.`,

    html,
  });
};


// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT FAILED
// ─────────────────────────────────────────────────────────────────────────────

export const sendPaymentFailedEmail = async (
  order,
  user
) => {
  if (!user?.email) {
    throw new Error(
      "Cannot send payment failed email: customer email missing"
    );
  }

  const html = paymentFailedTemplate({
    order,
    user,
    frontendUrl: FRONTEND_URL,
  });

  return sendEmail({
    email: user.email,

    subject:
      `Payment Issue — ${order.orderNumber} | Mega Himalaya`,

    text:
      `We couldn't confirm the payment for your order ` +
      `${order.orderNumber}. Please review your order ` +
      `for more information.`,

    html,
  });
};


// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET
// ─────────────────────────────────────────────────────────────────────────────

export const sendPasswordResetEmail = async (
  user,
  resetURL
) => {
  if (!user?.email) {
    throw new Error(
      "Cannot send password reset email: customer email missing"
    );
  }

  if (!resetURL) {
    throw new Error(
      "Password reset URL is required"
    );
  }

  const html = passwordResetTemplate({
    user,
    resetURL,
  });

  return sendEmail({
    email: user.email,

    subject:
      "Password Reset Request — Mega Himalaya",

    text:
      `You requested a password reset for your Mega Himalaya account.\n\n` +
      `Reset link: ${resetURL}\n\n` +
      `This link expires in 30 minutes.\n\n` +
      `If you did not request this, you can safely ignore this email.`,

    html,
  });
};


// ─────────────────────────────────────────────────────────────────────────────
// WELCOME
// ─────────────────────────────────────────────────────────────────────────────

export const sendWelcomeEmail = async (user) => {
  if (!user?.email) {
    throw new Error(
      "Cannot send welcome email: customer email missing"
    );
  }

  const html = welcomeTemplate({
    user,
    frontendUrl: FRONTEND_URL,
  });

  return sendEmail({
    email: user.email,

    subject: "Welcome to Mega Himalaya",

    text:
      `Welcome to Mega Himalaya, ${user.name || "there"}!\n\n` +
      `Thank you for creating your account. ` +
      `Your account has been successfully created.\n\n` +
      `Visit Mega Himalaya: ${FRONTEND_URL}\n\n` +
      `If you did not create this account, please contact our support team.`,

    html,
  });
};


// ─────────────────────────────────────────────────────────────────────────────
// ORDER CANCELLED
// ─────────────────────────────────────────────────────────────────────────────

export const sendOrderCancelledEmail = async (
  order,
  user
) => {
  if (!user?.email) {
    throw new Error(
      "Cannot send order cancellation email: customer email missing"
    );
  }

  const html = orderCancelledTemplate({
    order,
    user,
    frontendUrl: FRONTEND_URL,
  });

  return sendEmail({
    email: user.email,

    subject:
      `Order Cancelled — ${order.orderNumber} | Mega Himalaya`,

    text:
      `Your order ${order.orderNumber} has been cancelled. ` +
      `If you had paid for this order, any refund will be ` +
      `issued back to your original payment method.`,

    html,
  });
};


// ─────────────────────────────────────────────────────────────────────────────
// RETURN STATUS (customer)
// Supported: Approved / Rejected / Item Received / Refunded
// ─────────────────────────────────────────────────────────────────────────────

const RETURN_EMAIL_STATUSES = new Set([
  "Approved",
  "Rejected",
  "Item Received",
  "Refunded",
  "Completed",
]);

const returnEmailSubjects = {
  Approved:
    (returnNumber) =>
      `Return Approved — ${returnNumber} | Mega Himalaya`,

  Rejected:
    (returnNumber) =>
      `Return Request Update — ${returnNumber} | Mega Himalaya`,

  "Item Received":
    (returnNumber) =>
      `Return Items Received — ${returnNumber} | Mega Himalaya`,

  Refunded:
    (returnNumber) =>
      `Refund Processed — ${returnNumber} | Mega Himalaya`,

  Completed:
    (returnNumber) =>
      `Return Completed — ${returnNumber} | Mega Himalaya`,
};

export const sendReturnStatusEmail = async (
  returnDoc,
  user,
  status
) => {
  if (!RETURN_EMAIL_STATUSES.has(status)) {
    throw new Error(
      `Email notification not supported for return status: ${status}`
    );
  }

  if (!user?.email) {
    throw new Error(
      "Cannot send return status email: customer email missing"
    );
  }

  const html = returnStatusTemplate({
    returnDoc,
    user,
    status,
    frontendUrl: FRONTEND_URL,
  });

  return sendEmail({
    email: user.email,
    subject: returnEmailSubjects[status](returnDoc.returnNumber),

    text:
      `Your return ${returnDoc.returnNumber} ` +
      `status has been updated to ${status}. ` +
      `Please check your return dashboard for full details.`,

    html,
  });
};


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — NEW RETURN REQUEST
// ─────────────────────────────────────────────────────────────────────────────

export const sendAdminNewReturnEmail = async (
  returnDoc,
  customer
) => {
  const adminEmails =
    await getAllActiveAdminEmails();

  if (adminEmails.length === 0) {
    return [];
  }

  const html = adminNewReturnTemplate({
    returnDoc,
    customer,
    frontendUrl: FRONTEND_URL,
  });

  const results = await Promise.allSettled(
    adminEmails.map((adminEmail) =>
      sendEmail({
        email: adminEmail,

        subject:
          `New Return Request — ${returnDoc.returnNumber}`,

        text:
          `New return request ${returnDoc.returnNumber} ` +
          `submitted by ${customer?.name || "customer"}. ` +
          `Requested refund: NPR ${returnDoc?.refund?.requestedAmount}.`,

        html,
      })
    )
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Admin return email failed: ${adminEmails[index]}`,
        result.reason?.message || result.reason
      );
    }
  });

  return results;
};