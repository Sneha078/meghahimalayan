import {
  baseTemplate,
  styles,
  escapeHtml,
  formatMoney,
} from "./emailStyles.js";

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — RETURN STATUS UPDATE
// Supports: Approved / Rejected / Item Received / Refunded
// ─────────────────────────────────────────────────────────────────────────────

const RETURN_EMAIL_STATUSES = new Set([
  "Approved",
  "Rejected",
  "Item Received",
  "Refunded",
  "Completed",
]);

const statusMessages = {
  Approved: (returnNumber) => ({
    heading: "Your return request has been approved",
    body: `Great news! Your return <strong>${returnNumber}</strong> has been approved. Please ship the item(s) back to us before the shipping deadline shown below.`,
  }),

  Rejected: (returnNumber, remarks) => ({
    heading: "Your return request was not approved",
    body: `We're sorry, but your return request <strong>${returnNumber}</strong> could not be approved.${
      remarks
        ? `<br><br>Reason: <strong>${remarks}</strong>`
        : ""
    }`,
  }),

  "Item Received": (returnNumber) => ({
    heading: "We've received your returned items",
    body: `Your returned item(s) for <strong>${returnNumber}</strong> have been received and are being inspected. Once the refund is processed, we'll email you immediately.`,
  }),

  Refunded: (returnNumber, returnDoc) => {
    const amount = formatMoney(
      returnDoc?.refundTransaction?.amount ||
        returnDoc?.refund?.approvedAmount ||
        0
    );

    const method = escapeHtml(
      returnDoc?.refundTransaction?.provider ||
        returnDoc?.refund?.method ||
        "original payment method"
    );

    const transactionId = escapeHtml(
      returnDoc?.refundTransaction?.transactionId || ""
    );

    return {
      heading: "Your refund has been processed",
      body: `Your refund for return <strong>${returnNumber}</strong> of <strong>${amount}</strong> has been processed via ${method}.${
        transactionId
          ? `<br><br>Transaction reference: <strong>${transactionId}</strong>`
          : ""
      }`,
    };
  },

  Completed: (returnNumber) => ({
    heading: "Your return has been completed",
    body: `Your return <strong>${returnNumber}</strong> has been completed. Thank you for your patience throughout the process.`,
  }),
};

const renderReturnItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  const rows = items
    .map((item) => {
      const name = escapeHtml(item?.name || "Product");
      const quantity = Number(item?.quantity) || 0;
      const price = Number(item?.refundUnitPrice) || 0;

      return `
        <tr>
          <td style="${styles.td}">${name}</td>
          <td style="${styles.td};text-align:center;">${quantity}</td>
          <td style="${styles.td};text-align:right;">${formatMoney(
            price * quantity
          )}</td>
        </tr>
      `;
    })
    .join("");

  return `
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
  `;
};

export const returnStatusTemplate = ({
  returnDoc,
  user,
  status,
  frontendUrl,
}) => {
  if (!RETURN_EMAIL_STATUSES.has(status)) {
    throw new Error(
      `Email notification not supported for return status: ${status}`
    );
  }

  const userName = escapeHtml(user?.name || "there");
  const returnNumber = escapeHtml(
    returnDoc?.returnNumber || "—"
  );
  const reason = escapeHtml(returnDoc?.reason || "");

  const remarks = escapeHtml(
    returnDoc?.adminRemarks || ""
  );

  const msg = statusMessages[status](
    returnNumber,
    remarks
  );

  const returnId = encodeURIComponent(
    String(returnDoc?._id || "")
  );

  const shippingDeadline = returnDoc?.returnShippingDeadline
    ? new Date(
        returnDoc.returnShippingDeadline
      ).toLocaleDateString("en-US", {
        dateStyle: "medium",
      })
    : "—";

  const content = `
    <h2 style="${styles.h2}">
      ${msg.heading}
    </h2>

    <p style="${styles.p}">
      Hi ${userName},
    </p>

    <p style="${styles.p}">
      ${msg.body}
    </p>

    <div style="${styles.box}">

      <div style="${styles.boxTitle}">
        Return Reference
      </div>

      <div style="${styles.p};margin:2px 0;">
        Return #: <strong>${returnNumber}</strong>
      </div>

      ${
        reason
          ? `<div style="${styles.p};margin:2px 0;">Reason: ${reason}</div>`
          : ""
      }

      ${
        status === "Approved"
          ? `<div style="${styles.p};margin:2px 0;">Ship back by: <strong>${shippingDeadline}</strong></div>`
          : ""
      }

      ${
        status === "Refunded"
          ? `<div style="${styles.p};margin:2px 0;">Status: <strong>Refunded</strong></div>`
          : ""
      }

    </div>

    ${renderReturnItems(returnDoc?.items)}

    <div style="text-align:center;">
      <a
        href="${frontendUrl}/orders"
        style="${styles.button}"
      >
        View Return Details
      </a>
    </div>

    <p style="${styles.small}">
      Questions about your return? Our support team is happy to help.
    </p>
  `;

  return baseTemplate(content, frontendUrl);
};