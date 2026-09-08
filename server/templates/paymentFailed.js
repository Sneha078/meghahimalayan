import {
  baseTemplate,
  styles,
  formatMoney,
  escapeHtml,
} from "./emailStyles.js";

export const paymentFailedTemplate = ({
  order,
  user,
  frontendUrl,
}) => {
  const userName = escapeHtml(user?.name || "there");

  const orderNumber = escapeHtml(
    order?.orderNumber || "—"
  );

  const paymentMethod = escapeHtml(
    order?.paymentInfo?.method || "—"
  );

  const orderId = encodeURIComponent(
    String(order?._id || "")
  );

  const content = `
    <h2 style="${styles.h2}">
      We couldn't confirm your payment
    </h2>

    <p style="${styles.p}">
      Hi ${userName},
    </p>

    <p style="${styles.p}">
      Unfortunately, we couldn't confirm the payment for
      your order <strong>${orderNumber}</strong>.
    </p>

    <div style="${styles.box}">

      <div style="${styles.boxTitle}">
        Payment Details
      </div>

      <div style="${styles.p};margin:2px 0;">
        Order #: <strong>${orderNumber}</strong>
      </div>

      <div style="${styles.p};margin:2px 0;">
        Amount:
        <strong>${formatMoney(order?.totalPrice)}</strong>
      </div>

      <div style="${styles.p};margin:2px 0;">
        Payment Method: ${paymentMethod}
      </div>

    </div>

    <p style="${styles.p}">
      If your account was charged, please do not make
      another payment. Our team will verify the transaction
      and assist you.
    </p>

    <div style="text-align:center;">
      <a
        href="${frontendUrl}/orders/${orderId}"
        style="${styles.button}"
      >
        View My Order
      </a>
    </div>

    <p style="${styles.small}">
      If you did not attempt this payment, please contact
      our support team immediately.
    </p>
  `;

  return baseTemplate(content, frontendUrl);
};