import {
  baseTemplate,
  styles,
  escapeHtml,
  formatMoney,
  renderOrderItems,
  renderPriceSummary,
} from "./emailStyles.js";

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — ORDER CANCELLED
// (customer-initiated or admin-initiated cancellation)
// ─────────────────────────────────────────────────────────────────────────────

export const orderCancelledTemplate = ({
  order,
  user,
  frontendUrl,
}) => {
  const userName = escapeHtml(user?.name || "there");
  const orderNumber = escapeHtml(order?.orderNumber || "—");

  const orderId = encodeURIComponent(
    String(order?._id || "")
  );

  const paymentMethod = escapeHtml(
    order?.paymentInfo?.method || "—"
  );

  const paymentStatus = escapeHtml(
    order?.paymentInfo?.status || "Pending"
  );

  const refundedAmount = Number(order?.refundedAmount) || 0;

  const refundNote =
    paymentMethod !== "COD" &&
    (paymentStatus === "Paid" ||
      paymentStatus === "Refunded" ||
      paymentStatus === "Partially Refunded")
      ? `
        <p style="${styles.p}">
          Since payment for this order was already collected
          ${
            refundedAmount > 0
              ? `, <strong>${formatMoney(
                  refundedAmount
                )}</strong> has been refunded to you.`
              : ", a refund will be issued to your original payment method shortly."
          }
        </p>
      `
      : `
        <p style="${styles.p}">
          No payment was collected for this order (${
            paymentMethod === "COD"
              ? "Cash on Delivery"
              : paymentMethod
          }), so no refund is required.
        </p>
      `;

  const content = `
    <h2 style="${styles.h2}">
      Your order has been cancelled, ${userName}
    </h2>

    <p style="${styles.p}">
      Order <strong>${orderNumber}</strong> has been cancelled.
      Any reserved stock has been released back to our inventory.
    </p>

    ${refundNote}

    ${renderOrderItems(order?.orderItems)}

    ${renderPriceSummary(order)}

    <div style="text-align:center;">
      <a
        href="${frontendUrl}/orders/${orderId}"
        style="${styles.button}"
      >
        View Order Details
      </a>
    </div>

    <p style="${styles.small}">
      Placed another order and need help? Our support team is
      here for you.
    </p>
  `;

  return baseTemplate(content, frontendUrl);
};