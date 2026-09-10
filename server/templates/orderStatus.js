import {
  baseTemplate,
  styles,
  escapeHtml,
  renderOrderItems,
  renderPriceSummary,
  renderShippingAddress,
} from "./emailStyles.js";

const statusMessages = {
  Confirmed: {
    heading: "Your order has been confirmed",
    cta: "View My Order",
    body: (orderNumber) =>
      `Great news! Your order <strong>${orderNumber}</strong> has been confirmed and is being prepared for shipment.`,
  },

  Shipped: {
    heading: "Your order is on the way",
    cta: "Track My Order",
    body: (orderNumber) =>
      `Your order <strong>${orderNumber}</strong> has been shipped and is on its way to you.`,
  },

  Delivered: {
    heading: "Your order has been delivered",
    cta: "Leave a Review",
    body: (orderNumber) =>
      `Your order <strong>${orderNumber}</strong> has been delivered. We hope you love it!`,
  },
};

const ALLOWED_STATUSES = new Set([
  "Confirmed",
  "Shipped",
  "Delivered",
]);

export const orderStatusTemplate = ({
  order,
  user,
  status,
  frontendUrl,
}) => {
  if (!ALLOWED_STATUSES.has(status)) {
    throw new Error(`Unsupported email order status: ${status}`);
  }

  const msg = statusMessages[status];

  const orderNumber = escapeHtml(
    order?.orderNumber || "—"
  );

  const orderId = encodeURIComponent(
    String(order?._id || "")
  );

  const content = `
    <h2 style="${styles.h2}">
      ${msg.heading}
    </h2>

    <p style="${styles.p}">
      ${msg.body(orderNumber)}
    </p>

    ${renderOrderItems(order?.orderItems)}

    ${renderPriceSummary(order)}

    ${renderShippingAddress(order?.shippingInfo)}

    <div style="text-align:center;">
      <a
        href="${frontendUrl}/orders"
        style="${styles.button}"
      >
        ${msg.cta}
      </a>
    </div>

    ${
      status === "Delivered"
        ? `
          <p style="${styles.small}">
            Need help with your order?
            <a
              href="${frontendUrl}/contact"
              style="color:#f97316;"
            >
              Contact Us
            </a>.
          </p>
        `
        : ""
    }
  `;

  return baseTemplate(content, frontendUrl);
};