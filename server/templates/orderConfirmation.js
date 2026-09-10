import {
  baseTemplate,
  styles,
  formatMoney,
  escapeHtml,
  renderOrderItems,
  renderPriceSummary,
  renderShippingAddress,
} from "./emailStyles.js";

export const orderConfirmationTemplate = ({
  order,
  user,
  frontendUrl,
}) => {
  const userName = escapeHtml(user?.name || "customer");
  const orderNumber = escapeHtml(order?.orderNumber || "—");

  const paymentMethod = escapeHtml(
    order?.paymentInfo?.method || "COD"
  );

  const orderId = encodeURIComponent(String(order?._id || ""));

  const totalItems =
    order?.orderItems?.reduce(
      (sum, item) => sum + (Number(item?.quantity) || 0),
      0
    ) || 0;

  const createdAt = order?.createdAt
    ? new Date(order.createdAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

  const content = `
    <h2 style="${styles.h2}">
      Thank you for your order, ${userName}!
    </h2>

    <p style="${styles.p}">
      Your order <strong>${orderNumber}</strong> has been received
      and is now <strong>Processing</strong>.
    </p>

    <p style="${styles.p}">
      We will notify you by email as soon as your order ships.
    </p>

    <div style="${styles.box}">

      <div style="${styles.boxTitle}">
        Order Summary
      </div>

      <div style="${styles.p};margin:2px 0;">
        Order #: <strong>${orderNumber}</strong>
      </div>

      <div style="${styles.p};margin:2px 0;">
        Placed: ${escapeHtml(createdAt)}
      </div>

      <div style="${styles.p};margin:2px 0;">
        Payment: <strong>${paymentMethod}</strong>
      </div>

      <div style="${styles.p};margin:2px 0;">
        Items: ${totalItems}
      </div>

    </div>

    ${renderOrderItems(order?.orderItems)}

    ${renderPriceSummary(order)}

    ${renderShippingAddress(order?.shippingInfo)}

    <div style="text-align:center;">
      <a
        href="${frontendUrl}/orders"
        style="${styles.button}"
      >
        View My Order
      </a>
    </div>

    <p style="${styles.small}">
      For security, never share your order details or payment
      information with anyone.
    </p>
  `;

  return baseTemplate(content, frontendUrl);
};