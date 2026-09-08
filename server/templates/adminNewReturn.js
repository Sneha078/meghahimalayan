import {
  baseTemplate,
  styles,
  escapeHtml,
  formatMoney,
} from "./emailStyles.js";

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — NEW RETURN REQUEST ALERT
// ─────────────────────────────────────────────────────────────────────────────

export const adminNewReturnTemplate = ({
  returnDoc,
  customer,
  frontendUrl,
}) => {
  const returnNumber = escapeHtml(
    returnDoc?.returnNumber || "—"
  );

  const customerName = escapeHtml(customer?.name || "—");
  const customerEmail = escapeHtml(customer?.email || "—");
  const customerPhone = escapeHtml(customer?.phone || "—");

  const reason = escapeHtml(returnDoc?.reason || "—");

  const returnId = encodeURIComponent(
    String(returnDoc?._id || "")
  );

  const totalItems =
    returnDoc?.items?.reduce(
      (sum, item) => sum + (Number(item?.quantity) || 0),
      0
    ) || 0;

  const rows =
    returnDoc?.items
      ?.map((item) => {
        const name = escapeHtml(item?.name || "Product");
        const qty = Number(item?.quantity) || 0;
        const amount = formatMoney(
          (Number(item?.refundUnitPrice) || 0) * qty
        );

        return `
          <tr>
            <td style="${styles.td}">${name}</td>
            <td style="${styles.td};text-align:center;">${qty}</td>
            <td style="${styles.td};text-align:right;">${amount}</td>
          </tr>
        `;
      })
      .join("") || "";

  const content = `
    <h2 style="${styles.h2}">New Return Request</h2>

    <p style="${styles.p}">
      A new return request <strong>${returnNumber}</strong>
      has been submitted.
    </p>

    <div style="${styles.box}">

      <div style="${styles.boxTitle}">Customer</div>

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

      <div style="${styles.boxTitle}">Return Details</div>

      <div style="${styles.p};margin:2px 0;">
        Return #: <strong>${returnNumber}</strong>
      </div>

      <div style="${styles.p};margin:2px 0;">
        Reason: ${reason}
      </div>

      <div style="${styles.p};margin:2px 0;">
        Requested Refund:
        <strong>${formatMoney(returnDoc?.refund?.requestedAmount)}</strong>
      </div>

      <div style="${styles.p};margin:2px 0;">
        Items: ${totalItems}
      </div>

    </div>

    ${rows ? `
      <table style="${styles.table}">
        <thead>
          <tr>
            <th style="${styles.th}">Item</th>
            <th style="${styles.th};text-align:center;">Qty</th>
            <th style="${styles.th};text-align:right;">Refund Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    ` : ""}

    <div style="text-align:center;">
      <a
        href="${frontendUrl}/admin/returns/${returnId}"
        style="${styles.button}"
      >
        Review Return
      </a>
    </div>
  `;

  return baseTemplate(content, frontendUrl);
};