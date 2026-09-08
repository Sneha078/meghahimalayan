// ─────────────────────────────────────────────────────────────────────────────
// SHARED EMAIL STYLES + BASE LAYOUT
// ─────────────────────────────────────────────────────────────────────────────

export const escapeHtml = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};


export const styles = {
  body:
    `margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;` +
    `background:#f4f4f4;`,

  container:
    `max-width:600px;margin:0 auto;background:#ffffff;`,

  header:
    `background:#172554;padding:20px;text-align:center;`,

  logo:
    `color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;`,

  tagline:
    `color:#cbd5e1;font-size:12px;margin-top:4px;`,

  content:
    `padding:30px;`,

  h2:
    `color:#172554;font-size:18px;margin:0 0 10px 0;`,

  p:
    `color:#475569;font-size:14px;line-height:1.6;margin:8px 0;`,

  small:
    `color:#94a3b8;font-size:12px;line-height:1.5;margin:4px 0;`,

  boldP:
    `color:#172554;font-size:15px;font-weight:bold;margin:6px 0;`,

  table:
    `width:100%;border-collapse:collapse;margin:15px 0;`,

  th:
    `background:#172554;color:#ffffff;padding:10px;` +
    `text-align:left;font-size:12px;text-transform:uppercase;`,

  td:
    `padding:10px;border-bottom:1px solid #e2e8f0;` +
    `font-size:13px;color:#334155;`,

  button:
    `display:inline-block;background:#f97316;color:#ffffff !important;` +
    `padding:12px 26px;text-decoration:none;border-radius:6px;` +
    `font-weight:bold;font-size:14px;margin:15px 0;`,

  box:
    `background:#f8fafc;border:1px solid #e2e8f0;` +
    `border-radius:6px;padding:15px 20px;margin:15px 0;`,

  boxTitle:
    `color:#475569;font-size:11px;text-transform:uppercase;` +
    `letter-spacing:1px;margin:0 0 6px 0;`,

  footer:
    `background:#f8fafc;padding:20px;text-align:center;` +
    `font-size:11px;color:#94a3b8;line-height:1.8;`,

  warning:
    `color:#b45309;font-size:14px;line-height:1.6;`,
};


export const formatMoney = (value) => {
  const num = Number(value);

  if (!Number.isFinite(num)) {
    return "NPR 0.00";
  }

  return `NPR ${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};


export const baseTemplate = (
  content,
  frontendUrl = ""
) => {
  const safeBaseUrl = String(frontendUrl || "").trim();

  const contactLine = safeBaseUrl
    ? `
      Need help?
      Visit our
      <a
        href="${safeBaseUrl}/contact"
        style="color:#f97316;"
      >
        contact page
      </a>.
    `
    : `
      Need help? Contact our support team.
    `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >
  <title>Mega Himalaya</title>
</head>

<body style="${styles.body}">

  <div style="${styles.container}">

    <div style="${styles.header}">
      <div style="${styles.logo}">
        MEGA HIMALAYA
      </div>

      <div style="${styles.tagline}">
        Eyewear · Watches · Perfumes
      </div>
    </div>

    <div style="${styles.content}">
      ${content}
    </div>

    <div style="${styles.footer}">
      Mega Himalaya Pvt. Ltd. — Kathmandu, Nepal
      <br>

      This is an automated email.
      Please do not reply to this message.

      <br>

      ${contactLine}
    </div>

  </div>

</body>
</html>
`;
};


export const renderOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  const rows = items
    .map((item) => {
      const name = escapeHtml(item?.name || "Product");
      const image = escapeHtml(item?.image || "");

      const quantity =
        Number.isFinite(Number(item?.quantity))
          ? Number(item.quantity)
          : 0;

      const price =
        Number.isFinite(Number(item?.price))
          ? Number(item.price)
          : 0;

      const total = price * quantity;

      return `
        <tr>

          <td style="${styles.td}">

            ${
              image
                ? `
                  <img
                    src="${image}"
                    alt=""
                    width="40"
                    height="40"
                    style="
                      border-radius:4px;
                      margin-right:8px;
                      vertical-align:middle;
                    "
                  >
                `
                : ""
            }

            ${name}

          </td>

          <td
            style="${styles.td};text-align:center;"
          >
            ${quantity}
          </td>

          <td
            style="${styles.td};text-align:right;"
          >
            ${formatMoney(total)}
          </td>

        </tr>
      `;
    })
    .join("");

  return `
    <table style="${styles.table}">

      <thead>
        <tr>
          <th style="${styles.th}">
            Item
          </th>

          <th
            style="${styles.th};text-align:center;"
          >
            Qty
          </th>

          <th
            style="${styles.th};text-align:right;"
          >
            Total
          </th>
        </tr>
      </thead>

      <tbody>
        ${rows}
      </tbody>

    </table>
  `;
};


export const renderPriceSummary = (order) => {
  const discount = Number(order?.discount) || 0;

  const discountLine =
    discount > 0
      ? `
        <tr>

          <td style="${styles.td}">
            Discount
            ${
              order?.couponCode
                ? ` (${escapeHtml(order.couponCode)})`
                : ""
            }
          </td>

          <td
            style="
              ${styles.td};
              text-align:right;
              color:#16a34a;
            "
          >
            -${formatMoney(discount)}
          </td>

        </tr>
      `
      : "";

  return `
    <table style="${styles.table}">

      <tbody>

        <tr>
          <td style="${styles.td}">
            Subtotal
          </td>

          <td
            style="${styles.td};text-align:right;"
          >
            ${formatMoney(order?.itemsPrice)}
          </td>
        </tr>

        ${discountLine}

        <tr>
          <td style="${styles.td}">
            Shipping
          </td>

          <td
            style="${styles.td};text-align:right;"
          >
            ${formatMoney(order?.shippingPrice)}
          </td>
        </tr>

        <tr>
          <td style="${styles.td}">
            Tax
          </td>

          <td
            style="${styles.td};text-align:right;"
          >
            ${formatMoney(order?.taxPrice)}
          </td>
        </tr>

        <tr>

          <td style="${styles.td}">
            <strong>Total</strong>
          </td>

          <td
            style="
              ${styles.td};
              text-align:right;
              font-size:16px;
              color:#172554;
              font-weight:bold;
            "
          >
            ${formatMoney(order?.totalPrice)}
          </td>

        </tr>

      </tbody>

    </table>
  `;
};


export const renderShippingAddress = (
  shippingInfo
) => {
  if (!shippingInfo) {
    return "";
  }

  const name =
    escapeHtml(shippingInfo.name || "—");

  const address =
    escapeHtml(shippingInfo.address || "—");

  const city =
    escapeHtml(shippingInfo.city || "");

  const state =
    escapeHtml(shippingInfo.state || "");

  const pincode =
    escapeHtml(shippingInfo.pincode || "");

  const phone =
    escapeHtml(shippingInfo.phoneNo || "—");

  return `
    <div style="${styles.box}">

      <div style="${styles.boxTitle}">
        Shipping To
      </div>

      <div style="${styles.p};margin:2px 0;">
        ${name}
      </div>

      <div style="${styles.small};margin:2px 0;">
        ${address}
      </div>

      <div style="${styles.small};margin:2px 0;">
        ${[city, state, pincode]
          .filter(Boolean)
          .join(", ")}
      </div>

      <div style="${styles.small};margin:2px 0;">
        Phone: ${phone}
      </div>

    </div>
  `;
};