import {
  baseTemplate,
  styles,
  formatMoney,
  escapeHtml,
  renderOrderItems,
  renderPriceSummary,
} from "./emailStyles.js";

export const adminNewOrderTemplate = ({
  order,
  customer,
  frontendUrl,
}) => {
  const orderNumber = escapeHtml(order?.orderNumber || "—");
  const customerName = escapeHtml(customer?.name || "—");
  const customerEmail = escapeHtml(customer?.email || "—");
  const customerPhone = escapeHtml(customer?.phone || "—");

  const paymentMethod = escapeHtml(
    order?.paymentInfo?.method || "COD"
  );

  const paymentStatus = escapeHtml(
    order?.paymentInfo?.status || "Pending"
  );

  const orderId = encodeURIComponent(String(order?._id || ""));

  const totalItems =
    order?.orderItems?.reduce(
      (sum, item) => sum + (Number(item?.quantity) || 0),
      0
    ) || 0;

  const content = `
    <h2 style="${styles.h2}">
      New Order Received
    </h2>

    <p style="${styles.p}">
      A new order <strong>${orderNumber}</strong>
      was just placed on the store.
    </p>

    <div style="${styles.box}">

      <div style="${styles.boxTitle}">
        Customer
      </div>

      <div style="${styles.p};margin:2px 0;">
        Name: <strong>${customerName}</strong>
      </div>

      <div style="${styles.p};margin:2px 0;">
        Email: ${customerEmail}
      </div>

      <div style="${styles.p};margin:2px 0;">
        Phone: ${customerPhone}
      </div>

    </div>

    <div style="${styles.box}">

      <div style="${styles.boxTitle}">
        Order Details
      </div>

      <div style="${styles.p};margin:2px 0;">
        Order #: <strong>${orderNumber}</strong>
      </div>

      <div style="${styles.p};margin:2px 0;">
        Total:
        <strong>${formatMoney(order?.totalPrice)}</strong>
      </div>

      <div style="${styles.p};margin:2px 0;">
        Payment:
        <strong>${paymentMethod}</strong>
      </div>

      <div style="${styles.p};margin:2px 0;">
        Payment Status:
        <strong>${paymentStatus}</strong>
      </div>

      <div style="${styles.p};margin:2px 0;">
        Items: ${totalItems}
      </div>

    </div>

    ${renderOrderItems(order?.orderItems)}

    ${renderPriceSummary(order)}

    <div style="text-align:center;">
      <a
        href="${frontendUrl}/admin/order/${orderId}"
        style="${styles.button}"
      >
        Review Order
      </a>
    </div>
  `;

  return baseTemplate(content, frontendUrl);
};