import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// FONTS
// ─────────────────────────────────────────────────────────────────────────────

const REGULAR_FONT_PATH = path.resolve(
  __dirname,
  "../assets/fonts/Mukta-Regular.ttf"
);

const BOLD_FONT_PATH = path.resolve(
  __dirname,
  "../assets/fonts/Mukta-Bold.ttf"
);

const HAS_CUSTOM_FONTS =
  fs.existsSync(REGULAR_FONT_PATH) &&
  fs.existsSync(BOLD_FONT_PATH);

export const FONT = {
  regular: HAS_CUSTOM_FONTS ? "Mukta" : "Courier",
  bold: HAS_CUSTOM_FONTS ? "Mukta-Bold" : "Courier-Bold",
};

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS DETAILS
// ─────────────────────────────────────────────────────────────────────────────

const BIZ = {
  name:
    process.env.BUSINESS_NAME ||
    "MEGA HIMALAYA",

  tagline:
    process.env.BUSINESS_TAGLINE ||
    "Premium Eyewear, Watches & Perfumes",

  address:
    process.env.BUSINESS_ADDRESS ||
    "Mahendra Pool, Pokhara 33700, Nepal",

  phone:
    process.env.BUSINESS_PHONE ||
    "+977-9840604668",

  email:
    process.env.BUSINESS_EMAIL ||
    "mail@megahimalaya.com",

  website:
    process.env.BUSINESS_WEBSITE ||
    "www.megahimalaya.com",
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE GEOMETRY
// ─────────────────────────────────────────────────────────────────────────────

const PW = 595.28;
const PH = 841.89;

const CARD_PAD = 24;

const CARD_X = CARD_PAD;
const CARD_Y = CARD_PAD;

const CARD_W = PW - CARD_PAD * 2;
const CARD_H = PH - CARD_PAD * 2;

const INNER = 18;

const CON_X = CARD_X + INNER;
const CON_W = CARD_W - INNER * 2;
const CON_R = CON_X + CON_W;

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  navy: "#0B1F3A",
  navyDark: "#07172B",
  navyMid: "#17365D",
  navyLight: "#EAF0F7",
  navySoft: "#F4F7FB",

  black: "#111827",
  body: "#334155",
  secondary: "#64748B",
  muted: "#94A3B8",

  border: "#D9E2EC",
  borderDark: "#C4D0DD",

  white: "#FFFFFF",

  pageBg: "#EEF2F7",
  cardBg: "#FFFFFF",
  rowAlt: "#F7F9FC",

  success: "#047857",
  danger: "#B91C1C",

  totalBg: "#0B1F3A",
  totalText: "#FFFFFF",
};

const GOLD = "#C9A227";

const MAX_ITEMS = 500;

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────

const safe = (v, fb = "") =>
  v == null
    ? fb
    : String(v)
        .replace(/[\x00-\x1F\x7F]/g, "")
        .trim() || fb;

const num = (v, fb = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

const money = (v) =>
  "NPR " +
  num(v).toLocaleString("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDt = (v) => {
  const d = v ? new Date(v) : new Date();

  if (isNaN(d)) return "N/A";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kathmandu",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
};

const payMethodLabel = (m) =>
  ({
    COD: "Cash on Delivery",
    eSewa: "eSewa E-Payment",
    Khalti: "Khalti Digital Wallet",
    Card: "Credit / Debit Card",
    Other: "Other",
  })[m] || safe(m, "N/A");

const payStatusLabel = (s) =>
  ({
    Paid: "PAID",
    Pending: "PENDING",
    Failed: "FAILED",
    "Partially Refunded": "PARTIALLY REFUNDED",
    Refunded: "REFUNDED",
  })[s] ||
  safe(s, "PENDING").toUpperCase();

// ─────────────────────────────────────────────────────────────────────────────
// DRAWING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const roundedBox = (
  doc,
  x,
  y,
  w,
  h,
  radius = 8,
  fill = C.white,
  stroke = C.border
) => {
  doc
    .save()
    .roundedRect(x, y, w, h, radius)
    .fillAndStroke(fill, stroke)
    .restore();
};

const hRule = (
  doc,
  y,
  lw = 0.6,
  color = C.border
) => {
  doc
    .moveTo(CON_X, y)
    .lineTo(CON_R, y)
    .lineWidth(lw)
    .strokeColor(color)
    .stroke();
};

const fullRule = (
  doc,
  y,
  lw = 0.6,
  color = C.border
) => {
  doc
    .moveTo(CARD_X, y)
    .lineTo(CARD_X + CARD_W, y)
    .lineWidth(lw)
    .strokeColor(color)
    .stroke();
};

const drawCardBorder = (doc) => {
  doc
    .save()
    .roundedRect(
      CARD_X,
      CARD_Y,
      CARD_W,
      CARD_H,
      10
    )
    .lineWidth(0.8)
    .strokeColor(C.borderDark)
    .stroke()
    .restore();
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE BASE
// ─────────────────────────────────────────────────────────────────────────────

const drawPageBase = (doc) => {
  doc
    .rect(0, 0, PW, PH)
    .fill(C.pageBg);

  doc
    .roundedRect(
      CARD_X,
      CARD_Y,
      CARD_W,
      CARD_H,
      10
    )
    .fill(C.cardBg);

  drawCardBorder(doc);
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — HEADER
// ─────────────────────────────────────────────────────────────────────────────

function drawHeader(doc, order) {
  const Y = CARD_Y + 18;

  const HEADER_H = 92;

  const LEFT_W = 285;

  const RIGHT_X = CON_R - 190;
  const RIGHT_W = 190;

  // IMPORTANT:
  // No background fill is applied to this upper company-information area.
  // It remains completely white.

  // Top divider
  doc
    .save()
    .moveTo(CON_X, Y - 5)
    .lineTo(CON_R, Y - 5)
    .lineWidth(0.7)
    .strokeColor(C.border)
    .stroke()
    .restore();

  // Small navy accent
  doc
    .save()
    .roundedRect(
      CON_X,
      Y + 2,
      4,
      55,
      2
    )
    .fill(C.navy)
    .restore();

  // Small gold accent
  doc
    .save()
    .roundedRect(
      CON_X,
      Y + 61,
      4,
      10,
      2
    )
    .fill(GOLD)
    .restore();

  // Company name
  doc
    .font(FONT.bold)
    .fontSize(17)
    .fillColor(C.navy)
    .text(
      safe(BIZ.name),
      CON_X + 14,
      Y + 1,
      {
        width: LEFT_W,
        lineBreak: false,
      }
    );

  // Tagline
  doc
    .font(FONT.regular)
    .fontSize(8.5)
    .fillColor(C.navyMid)
    .text(
      safe(BIZ.tagline).toUpperCase(),
      CON_X + 14,
      Y + 23,
      {
        width: LEFT_W,
        lineBreak: false,
        characterSpacing: 0.3,
      }
    );

  // Address
  doc
    .font(FONT.regular)
    .fontSize(8)
    .fillColor(C.secondary)
    .text(
      safe(BIZ.address),
      CON_X + 14,
      Y + 42,
      {
        width: LEFT_W,
        lineBreak: false,
      }
    );

  // Phone + email
  doc
    .font(FONT.regular)
    .fontSize(7.8)
    .fillColor(C.secondary)
    .text(
      `${safe(BIZ.phone)}  •  ${safe(BIZ.email)}`,
      CON_X + 14,
      Y + 56,
      {
        width: LEFT_W,
        lineBreak: false,
      }
    );

  // ───────────────────────────────────────────────────────────────────────────
  // RIGHT SIDE
  // ───────────────────────────────────────────────────────────────────────────

  doc
    .font(FONT.bold)
    .fontSize(21)
    .fillColor(C.navy)
    .text(
      "INVOICE",
      RIGHT_X,
      Y,
      {
        width: RIGHT_W,
        align: "right",
        lineBreak: false,
      }
    );

  // Navy underline
  doc
    .save()
    .moveTo(
      RIGHT_X + 78,
      Y + 27
    )
    .lineTo(
      RIGHT_X + RIGHT_W,
      Y + 27
    )
    .lineWidth(1.4)
    .strokeColor(C.navy)
    .stroke()
    .restore();

  // Gold accent
  doc
    .save()
    .moveTo(
      RIGHT_X + 135,
      Y + 31
    )
    .lineTo(
      RIGHT_X + RIGHT_W,
      Y + 31
    )
    .lineWidth(0.9)
    .strokeColor(GOLD)
    .stroke()
    .restore();

  const invNo = safe(
    order.invoiceNumber ||
      order.orderNumber ||
      String(order._id),
    "N/A"
  );

  const ordNo = safe(
    order.orderNumber,
    "N/A"
  );

  const invDt = fmtDt(
    order.invoiceGeneratedAt ||
      order.createdAt
  );

  // Invoice number
  doc
    .font(FONT.regular)
    .fontSize(8)
    .fillColor(C.secondary)
    .text(
      "Invoice No:",
      RIGHT_X,
      Y + 42,
      {
        width: 70,
        lineBreak: false,
      }
    );

  doc
    .font(FONT.bold)
    .fontSize(8)
    .fillColor(C.black)
    .text(
      invNo,
      RIGHT_X + 70,
      Y + 42,
      {
        width: 120,
        align: "right",
        lineBreak: false,
      }
    );

  // Order number
  doc
    .font(FONT.regular)
    .fontSize(8)
    .fillColor(C.secondary)
    .text(
      "Order No:",
      RIGHT_X,
      Y + 56,
      {
        width: 70,
        lineBreak: false,
      }
    );

  doc
    .font(FONT.bold)
    .fontSize(8)
    .fillColor(C.black)
    .text(
      ordNo,
      RIGHT_X + 70,
      Y + 56,
      {
        width: 120,
        align: "right",
        lineBreak: false,
      }
    );

  // Date
  doc
    .font(FONT.regular)
    .fontSize(8)
    .fillColor(C.secondary)
    .text(
      "Date:",
      RIGHT_X,
      Y + 70,
      {
        width: 70,
        lineBreak: false,
      }
    );

  doc
    .font(FONT.bold)
    .fontSize(8)
    .fillColor(C.black)
    .text(
      invDt,
      RIGHT_X + 70,
      Y + 70,
      {
        width: 120,
        align: "right",
        lineBreak: false,
      }
    );

  // Header bottom divider
  doc
    .save()
    .moveTo(CON_X, Y + HEADER_H - 4)
    .lineTo(CON_R, Y + HEADER_H - 4)
    .lineWidth(0.8)
    .strokeColor(C.border)
    .stroke()
    .restore();

  return CARD_Y + HEADER_H + 14;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — CUSTOMER / SHIPPING
// ─────────────────────────────────────────────────────────────────────────────

function drawAddresses(
  doc,
  order,
  user,
  startY
) {
  const GAP = 12;

  const HALF =
    (CON_W - GAP) / 2;

  const LX = CON_X;
  const RX = CON_X + HALF + GAP;

  const CARD_H = 105;

  const si =
    order.shippingInfo || {};

  // ───────────────────────────────────────────────────────────────────────────
  // BILL TO
  // ───────────────────────────────────────────────────────────────────────────

  roundedBox(
    doc,
    LX,
    startY,
    HALF,
    CARD_H,
    8,
    C.navySoft,
    C.border
  );

  doc
    .save()
    .roundedRect(
      LX,
      startY,
      HALF,
      27,
      8
    )
    .fill(C.navy)
    .restore();

  doc
    .rect(
      LX,
      startY + 19,
      HALF,
      8
    )
    .fill(C.navy);

  doc
    .font(FONT.bold)
    .fontSize(9)
    .fillColor(C.white)
    .text(
      "BILL TO",
      LX + 12,
      startY + 8,
      {
        width: HALF - 24,
        lineBreak: false,
      }
    );

  const billLines = [
    safe(
      user?.name || si.name,
      "Customer"
    ),
    safe(user?.email, ""),
    safe(
      user?.phone || si.phoneNo,
      ""
    ),
    si.pan || user?.pan
      ? `PAN: ${safe(
          si.pan || user?.pan
        )}`
      : "",
  ].filter(Boolean);

  let ly = startY + 39;

  billLines.forEach(
    (line, index) => {
      doc
        .font(
          index === 0
            ? FONT.bold
            : FONT.regular
        )
        .fontSize(
          index === 0 ? 10 : 9
        )
        .fillColor(
          index === 0
            ? C.black
            : C.body
        )
        .text(
          line,
          LX + 12,
          ly,
          {
            width: HALF - 24,
            lineBreak: false,
          }
        );

      ly +=
        index === 0 ? 18 : 14;
    }
  );

  // ───────────────────────────────────────────────────────────────────────────
  // SHIPPING
  // ───────────────────────────────────────────────────────────────────────────

  roundedBox(
    doc,
    RX,
    startY,
    HALF,
    CARD_H,
    8,
    C.navySoft,
    C.border
  );

  doc
    .save()
    .roundedRect(
      RX,
      startY,
      HALF,
      27,
      8
    )
    .fill(C.navy)
    .restore();

  doc
    .rect(
      RX,
      startY + 19,
      HALF,
      8
    )
    .fill(C.navy);

  doc
    .font(FONT.bold)
    .fontSize(9)
    .fillColor(C.white)
    .text(
      "SHIPPING ADDRESS",
      RX + 12,
      startY + 8,
      {
        width: HALF - 24,
        lineBreak: false,
      }
    );

  const shipLines = [
    safe(
      si.name || user?.name,
      "Customer"
    ),

    safe(si.address, ""),

    [
      safe(si.city),
      safe(si.state),
    ]
      .filter(Boolean)
      .join(", "),

    si.pincode
      ? `Pincode: ${safe(
          si.pincode
        )}`
      : "",

    si.phoneNo
      ? safe(si.phoneNo)
      : "",
  ].filter(Boolean);

  let ry = startY + 39;

  shipLines.forEach(
    (line, index) => {
      doc
        .font(
          index === 0
            ? FONT.bold
            : FONT.regular
        )
        .fontSize(
          index === 0 ? 10 : 9
        )
        .fillColor(
          index === 0
            ? C.black
            : C.body
        )
        .text(
          line,
          RX + 12,
          ry,
          {
            width: HALF - 24,
            lineBreak: false,
          }
        );

      ry +=
        index === 0 ? 18 : 14;
    }
  );

  return startY + CARD_H + 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — ORDER & PAYMENT STATUS
// ─────────────────────────────────────────────────────────────────────────────

function drawOrderStatus(
  doc,
  order,
  startY
) {
  const STATUS_H = 78;

  roundedBox(
    doc,
    CON_X,
    startY,
    CON_W,
    STATUS_H,
    8,
    C.white,
    C.border
  );

  doc
    .font(FONT.bold)
    .fontSize(9)
    .fillColor(C.navy)
    .text(
      "ORDER & PAYMENT STATUS",
      CON_X + 12,
      startY + 10,
      {
        lineBreak: false,
      }
    );

  const COL =
    (CON_W - 24) / 4;

  const LABEL_Y =
    startY + 31;

  const VALUE_Y =
    startY + 47;

  const oStatus = safe(
    order.orderStatus,
    "Processing"
  );

  const pMethod =
    payMethodLabel(
      order.paymentInfo?.method
    );

  const pStatus =
    payStatusLabel(
      order.paymentInfo?.status
    );

  const dateTxt = order.paidAt
    ? fmtDt(order.paidAt)
    : fmtDt(order.createdAt);

  // ── DELIVERY STATUS ───────────────────────────────────────────────────────

  doc
    .font(FONT.bold)
    .fontSize(7.5)
    .fillColor(C.secondary)
    .text(
      "DELIVERY STATUS",
      CON_X + 12,
      LABEL_Y,
      {
        width: COL - 8,
        lineBreak: false,
      }
    );

  doc
    .font(FONT.bold)
    .fontSize(9)
    .fillColor(C.navy)
    .text(
      oStatus,
      CON_X + 12,
      VALUE_Y,
      {
        width: COL - 8,
        lineBreak: false,
      }
    );

  // ── PAYMENT METHOD ────────────────────────────────────────────────────────

  doc
    .font(FONT.bold)
    .fontSize(7.5)
    .fillColor(C.secondary)
    .text(
      "PAYMENT METHOD",
      CON_X + COL,
      LABEL_Y,
      {
        width: COL - 8,
        lineBreak: false,
      }
    );

  doc
    .font(FONT.regular)
    .fontSize(8.5)
    .fillColor(C.body)
    .text(
      pMethod,
      CON_X + COL,
      VALUE_Y,
      {
        width: COL - 8,
        lineBreak: false,
      }
    );

  // ── PAYMENT STATUS ────────────────────────────────────────────────────────

  doc
    .font(FONT.bold)
    .fontSize(7.5)
    .fillColor(C.secondary)
    .text(
      "PAYMENT STATUS",
      CON_X + COL * 2,
      LABEL_Y,
      {
        width: COL - 8,
        lineBreak: false,
      }
    );

  doc
    .font(FONT.bold)
    .fontSize(9)
    .fillColor(
      pStatus === "PAID"
        ? C.success
        : pStatus === "FAILED"
        ? C.danger
        : C.secondary
    )
    .text(
      pStatus,
      CON_X + COL * 2,
      VALUE_Y,
      {
        width: COL - 8,
        lineBreak: false,
      }
    );

  // ── PAYMENT DATE ──────────────────────────────────────────────────────────

  doc
    .font(FONT.bold)
    .fontSize(7.5)
    .fillColor(C.secondary)
    .text(
      "PAYMENT DATE",
      CON_X + COL * 3,
      LABEL_Y,
      {
        width: COL - 12,
        align: "right",
        lineBreak: false,
      }
    );

  doc
    .font(FONT.regular)
    .fontSize(8.5)
    .fillColor(C.body)
    .text(
      dateTxt,
      CON_X + COL * 3,
      VALUE_Y,
      {
        width: COL - 12,
        align: "right",
        lineBreak: false,
      }
    );

  return startY + STATUS_H + 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — PRODUCT TABLE
// ─────────────────────────────────────────────────────────────────────────────
//
// FIX (layout only):
// CON_W = CARD_W - INNER*2 = (PW - CARD_PAD*2) - INNER*2 = 511.28
//
// The previous widths (190 + 72 + 35 + 95 + 105 = 497) plus 4 gaps of 8pt
// (32pt) summed to 529pt — 17.7pt WIDER than CON_W (511.28). That overflow
// is what pushed the TOTAL column past the card's right edge and clipped it.
//
// New widths + gaps: 178 + 68 + 32 + 90 + 99 = 467, + 32 (gaps) = 499.
// 499 < 511.28, leaving a ~12pt safety margin so nothing clips, while
// keeping the same relative column proportions.
// ─────────────────────────────────────────────────────────────────────────────

const TABLE_COLS = () => {
  const GAP = 8;

  const PRODUCT_W = 178;
  const CATEGORY_W = 68;
  const QTY_W = 32;
  const PRICE_W = 90;
  const TOTAL_W = 99;

  let x = CON_X;

  const name = {
    x,
    w: PRODUCT_W,
  };

  x += PRODUCT_W + GAP;

  const cat = {
    x,
    w: CATEGORY_W,
  };

  x += CATEGORY_W + GAP;

  const qty = {
    x,
    w: QTY_W,
  };

  x += QTY_W + GAP;

  const price = {
    x,
    w: PRICE_W,
  };

  x += PRICE_W + GAP;

  const total = {
    x,
    w: TOTAL_W,
  };

  return {
    name,
    cat,
    qty,
    price,
    total,
  };
};

function drawTableHeader(
  doc,
  y
) {
  const C2 = TABLE_COLS();

  doc
    .save()
    .roundedRect(
      CON_X,
      y - 5,
      CON_W,
      29,
      5
    )
    .fill(C.navy)
    .restore();

  doc
    .font(FONT.bold)
    .fontSize(8)
    .fillColor(C.white);

  doc.text(
    "PRODUCT",
    C2.name.x + 8,
    y + 4,
    {
      width: C2.name.w - 8,
      lineBreak: false,
    }
  );

  doc.text(
    "CATEGORY",
    C2.cat.x,
    y + 4,
    {
      width: C2.cat.w,
      lineBreak: false,
    }
  );

  doc.text(
    "QTY",
    C2.qty.x,
    y + 4,
    {
      width: C2.qty.w,
      align: "center",
      lineBreak: false,
    }
  );

  doc.text(
    "UNIT PRICE",
    C2.price.x,
    y + 4,
    {
      width: C2.price.w,
      align: "right",
      lineBreak: false,
    }
  );

  doc.text(
    "TOTAL",
    C2.total.x,
    y + 4,
    {
      width: C2.total.w,
      align: "right",
      lineBreak: false,
    }
  );

  return y + 32;
}

function drawItemsTable(
  doc,
  order,
  startY
) {
  const items = Array.isArray(
    order.orderItems
  )
    ? order.orderItems.slice(
        0,
        MAX_ITEMS
      )
    : [];

  const C2 = TABLE_COLS();

  let y = drawTableHeader(
    doc,
    startY
  );

  items.forEach((item, i) => {
    const name = safe(
      item.name,
      "Product"
    );

    const cat = safe(
      item.category,
      ""
    );

    const qty = Math.max(
      0,
      Math.floor(
        num(item.quantity, 0)
      )
    );

    const price = Math.max(
      0,
      num(item.price, 0)
    );

    const lineAmt =
      price * qty;

    const nameH =
      doc.heightOfString(
        name,
        {
          width:
            C2.name.w - 14,
          font: FONT.regular,
          fontSize: 9,
        }
      );

    const ROW_H = Math.max(
      30,
      nameH + 12
    );

    if (
      y + ROW_H >
      PH - 220
    ) {
      hRule(
        doc,
        y + 4
      );

      doc.addPage();

      drawPageBase(doc);

      y = drawTableHeader(
        doc,
        CARD_Y + 40
      );
    }

    if (i % 2 === 1) {
      doc
        .rect(
          CARD_X + 1,
          y,
          CARD_W - 2,
          ROW_H
        )
        .fill(C.rowAlt);
    }

    doc
      .moveTo(
        CARD_X + 4,
        y + ROW_H
      )
      .lineTo(
        CARD_X + CARD_W - 4,
        y + ROW_H
      )
      .lineWidth(0.35)
      .strokeColor(C.border)
      .stroke();

    doc
      .font(FONT.bold)
      .fontSize(9)
      .fillColor(C.black)
      .text(
        name,
        C2.name.x + 8,
        y + 8,
        {
          width:
            C2.name.w - 14,
        }
      );

    doc
      .font(FONT.regular)
      .fontSize(8.5)
      .fillColor(C.secondary)
      .text(
        cat || "—",
        C2.cat.x,
        y + 8,
        {
          width:
            C2.cat.w,
          lineBreak: false,
        }
      );

    doc
      .font(FONT.bold)
      .fontSize(9)
      .fillColor(C.body)
      .text(
        String(qty),
        C2.qty.x,
        y + 8,
        {
          width:
            C2.qty.w,
          align: "center",
          lineBreak: false,
        }
      );

    doc
      .font(FONT.regular)
      .fontSize(8.5)
      .fillColor(C.body)
      .text(
        money(price),
        C2.price.x,
        y + 8,
        {
          width:
            C2.price.w,
          align: "right",
          lineBreak: false,
        }
      );

    doc
      .font(FONT.bold)
      .fontSize(8.5)
      .fillColor(C.navy)
      .text(
        money(lineAmt),
        C2.total.x,
        y + 8,
        {
          width:
            C2.total.w,
          align: "right",
          lineBreak: false,
        }
      );

    y += ROW_H;
  });

  hRule(
    doc,
    y + 5
  );

  return y + 8;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — ORDER SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

function drawTotals(
  doc,
  order,
  startY
) {
  if (startY > PH - 240) {
    doc.addPage();

    drawPageBase(doc);

    startY = CARD_Y + 20;
  }

  const BLOCK_W = 245;

  const BLOCK_X =
    CON_R - BLOCK_W;

  // FIX (layout only): header(12) + divider + 4 rows (19pt each, starting
  // at +43) + grand-total box (36pt) needs ~156pt of vertical room; 154
  // let the total box spill ~2pt past its own rounded background. 160
  // gives it a clean fit with a touch of bottom padding.
  const BLOCK_H = 160;

  const LABEL_W = 112;

  const VALUE_W =
    BLOCK_W - LABEL_W;

  const iPrice = Math.max(
    0,
    num(order.itemsPrice)
  );

  const disc = Math.max(
    0,
    num(order.discount)
  );

  const ship = Math.max(
    0,
    num(order.shippingPrice)
  );

  const tax = Math.max(
    0,
    num(order.taxPrice)
  );

  const total = Math.max(
    0,
    num(order.totalPrice)
  );

  const refunded = Math.max(
    0,
    num(order.refundedAmount)
  );

  const coupon = safe(
    order.couponCode
  );

  roundedBox(
    doc,
    BLOCK_X,
    startY,
    BLOCK_W,
    BLOCK_H,
    9,
    C.navySoft,
    C.border
  );

  doc
    .font(FONT.bold)
    .fontSize(9)
    .fillColor(C.navy)
    .text(
      "ORDER SUMMARY",
      BLOCK_X + 14,
      startY + 12,
      {
        lineBreak: false,
      }
    );

  doc
    .moveTo(
      BLOCK_X + 12,
      startY + 31
    )
    .lineTo(
      BLOCK_X + BLOCK_W - 12,
      startY + 31
    )
    .lineWidth(0.5)
    .strokeColor(C.border)
    .stroke();

  const rows = [
    {
      label: "Subtotal",
      value: money(iPrice),
      vc: C.body,
    },

    {
      label: coupon
        ? `Discount (${coupon})`
        : "Discount",

      value:
        disc > 0
          ? `- ${money(disc)}`
          : "NPR 0.00",

      vc:
        disc > 0
          ? C.danger
          : C.body,
    },

    {
      label: "Shipping",

      value:
        ship === 0
          ? "FREE"
          : money(ship),

      vc:
        ship === 0
          ? C.success
          : C.body,
    },

    {
      label:
        tax > 0
          ? "VAT / Tax (13%)"
          : "VAT / Tax",

      value:
        tax > 0
          ? money(tax)
          : "NPR 0.00 (Inclusive)",

      vc: C.body,
    },
  ];

  let y =
    startY + 43;

  rows.forEach((row) => {
    doc
      .font(FONT.regular)
      .fontSize(8.5)
      .fillColor(C.secondary)
      .text(
        row.label,
        BLOCK_X + 14,
        y,
        {
          width:
            LABEL_W - 10,
          lineBreak: false,
        }
      );

    doc
      .font(
        row.vc === C.danger
          ? FONT.bold
          : FONT.regular
      )
      .fontSize(8.5)
      .fillColor(row.vc)
      .text(
        row.value,
        BLOCK_X + LABEL_W,
        y,
        {
          width:
            VALUE_W - 14,
          align: "right",
          lineBreak: false,
        }
      );

    y += 19;
  });

  doc
    .roundedRect(
      BLOCK_X + 8,
      y + 1,
      BLOCK_W - 16,
      36,
      6
    )
    .fill(C.totalBg);

  doc
    .font(FONT.bold)
    .fontSize(9)
    .fillColor(C.white)
    .text(
      "TOTAL",
      BLOCK_X + 20,
      y + 12,
      {
        width:
          LABEL_W - 10,
        lineBreak: false,
      }
    );

  doc
    .font(FONT.bold)
    .fontSize(11)
    .fillColor(C.white)
    .text(
      money(total),
      BLOCK_X + LABEL_W,
      y + 10,
      {
        width:
          VALUE_W - 22,
        align: "right",
        lineBreak: false,
      }
    );

  y += 47;

  if (refunded > 0) {
    doc
      .font(FONT.regular)
      .fontSize(8)
      .fillColor(C.danger)
      .text(
        "Less: Refunded",
        BLOCK_X + 14,
        y,
        {
          width:
            LABEL_W - 10,
          lineBreak: false,
        }
      );

    doc
      .font(FONT.bold)
      .fontSize(8)
      .fillColor(C.danger)
      .text(
        `- ${money(refunded)}`,
        BLOCK_X + LABEL_W,
        y,
        {
          width:
            VALUE_W - 14,
          align: "right",
          lineBreak: false,
        }
      );

    y += 14;

    const net = Math.max(
      0,
      total - refunded
    );

    doc
      .font(FONT.bold)
      .fontSize(8)
      .fillColor(C.success)
      .text(
        "Net Settled",
        BLOCK_X + 14,
        y,
        {
          width:
            LABEL_W - 10,
          lineBreak: false,
        }
      );

    doc
      .font(FONT.bold)
      .fontSize(8)
      .fillColor(C.success)
      .text(
        money(net),
        BLOCK_X + LABEL_W,
        y,
        {
          width:
            VALUE_W - 14,
          align: "right",
          lineBreak: false,
        }
      );
  }

  return startY + BLOCK_H + 8;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — PAYMENT INFORMATION
// ─────────────────────────────────────────────────────────────────────────────

function drawPaymentInfo(
  doc,
  order,
  startY
) {
  if (startY > PH - 130) {
    doc.addPage();

    drawPageBase(doc);

    startY = CARD_Y + 20;
  }

  const BOX_H = 82;

  roundedBox(
    doc,
    CON_X,
    startY,
    CON_W,
    BOX_H,
    8,
    C.white,
    C.border
  );

  doc
    .save()
    .roundedRect(
      CON_X,
      startY,
      CON_W,
      27,
      8
    )
    .fill(C.navy)
    .restore();

  doc
    .rect(
      CON_X,
      startY + 18,
      CON_W,
      9
    )
    .fill(C.navy);

  doc
    .font(FONT.bold)
    .fontSize(9)
    .fillColor(C.white)
    .text(
      "PAYMENT INFORMATION",
      CON_X + 12,
      startY + 8,
      {
        lineBreak: false,
      }
    );

  const method =
    payMethodLabel(
      order.paymentInfo?.method
    );

  const status =
    payStatusLabel(
      order.paymentInfo?.status
    );

  const txnId = safe(
    order.paymentInfo?.id
  );

  const paidDt = fmtDt(
    order.paidAt ||
      order.createdAt
  );

  doc
    .font(FONT.regular)
    .fontSize(8.5)
    .fillColor(C.secondary)
    .text(
      "Method",
      CON_X + 12,
      startY + 39,
      {
        lineBreak: false,
      }
    );

  doc
    .font(FONT.bold)
    .fontSize(9)
    .fillColor(C.body)
    .text(
      method,
      CON_X + 55,
      startY + 39,
      {
        width: 190,
        lineBreak: false,
      }
    );

  doc
    .font(FONT.regular)
    .fontSize(8.5)
    .fillColor(C.secondary)
    .text(
      "Status",
      CON_X + 270,
      startY + 39,
      {
        lineBreak: false,
      }
    );

  doc
    .font(FONT.bold)
    .fontSize(9)
    .fillColor(
      status === "PAID"
        ? C.success
        : status === "FAILED"
        ? C.danger
        : C.secondary
    )
    .text(
      status,
      CON_X + 310,
      startY + 39,
      {
        lineBreak: false,
      }
    );

  doc
    .font(FONT.regular)
    .fontSize(8.5)
    .fillColor(C.secondary)
    .text(
      `Paid On: ${paidDt}`,
      CON_X + 12,
      startY + 59,
      {
        lineBreak: false,
      }
    );

  if (txnId) {
    // FIX (layout only): CON_X + 210 + 300 landed only ~1.3pt inside the
    // card's right edge — any slightly longer transaction ID would clip.
    // Narrowing the box to 260pt (still right-aligned) restores a safe
    // ~40pt margin without moving the label's starting position.
    doc
      .font(FONT.regular)
      .fontSize(8)
      .fillColor(C.secondary)
      .text(
        `Transaction ID: ${txnId}`,
        CON_X + 210,
        startY + 59,
        {
          width: 260,
          align: "right",
          lineBreak: false,
        }
      );
  }

  return startY + BOX_H + 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — TERMS
// ─────────────────────────────────────────────────────────────────────────────

function drawTerms(
  doc,
  startY
) {
  if (startY > PH - 110) {
    doc.addPage();

    drawPageBase(doc);

    startY = CARD_Y + 20;
  }

  const BOX_H = 91;

  roundedBox(
    doc,
    CON_X,
    startY,
    CON_W,
    BOX_H,
    8,
    C.navySoft,
    C.border
  );

  doc
    .font(FONT.bold)
    .fontSize(9)
    .fillColor(C.navy)
    .text(
      "TERMS & CONDITIONS",
      CON_X + 14,
      startY + 12,
      {
        lineBreak: false,
      }
    );

  doc
    .moveTo(
      CON_X + 12,
      startY + 30
    )
    .lineTo(
      CON_R - 12,
      startY + 30
    )
    .lineWidth(0.5)
    .strokeColor(C.border)
    .stroke();

  const terms = [
    "• Authentic products with official warranty",
    "• Returns accepted within 7 days in original packaging",
    "• Computer-generated invoice; no signature required.",
  ];

  let y =
    startY + 43;

  terms.forEach((t) => {
    doc
      .font(FONT.regular)
      .fontSize(8)
      .fillColor(C.body)
      .text(
        t,
        CON_X + 14,
        y,
        {
          width:
            CON_W - 28,
          lineBreak: false,
        }
      );

    y += 14;
  });

  return startY + BOX_H + 8;
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

function drawPageFooter(
  doc,
  pageNum,
  totalPages
) {
  const FY = PH - 50;

  doc
    .moveTo(
      CARD_X + 20,
      FY - 10
    )
    .lineTo(
      CARD_X + CARD_W - 20,
      FY - 10
    )
    .lineWidth(0.5)
    .strokeColor(C.border)
    .stroke();

  doc
    .font(FONT.bold)
    .fontSize(8)
    .fillColor(C.navy)
    .text(
      `Thank you for shopping with ${safe(
        BIZ.name,
        "Mega Himalaya"
      )}!`,
      CARD_X,
      FY,
      {
        width: CARD_W,
        align: "center",
        lineBreak: false,
      }
    );

  const footerInfo = [
    BIZ.website,
  ]
    .filter(Boolean)
    .join("  •  ");

  if (footerInfo) {
    doc
      .font(FONT.regular)
      .fontSize(7)
      .fillColor(C.muted)
      .text(
        footerInfo,
        CARD_X,
        FY + 13,
        {
          width: CARD_W,
          align: "center",
          lineBreak: false,
        }
      );
  }

  doc
    .font(FONT.regular)
    .fontSize(7)
    .fillColor(C.muted)
    .text(
      `Page ${pageNum} of ${totalPages}`,
      CARD_X,
      FY + 26,
      {
        width: CARD_W,
        align: "center",
        lineBreak: false,
      }
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export function generateInvoice(
  order,
  user = null
) {
  return new Promise(
    (resolve, reject) => {
      try {
        if (
          !order ||
          typeof order !== "object"
        ) {
          return reject(
            new Error(
              "Invalid order object"
            )
          );
        }

        if (
          !Array.isArray(
            order.orderItems
          ) ||
          order.orderItems.length === 0
        ) {
          return reject(
            new Error(
              "Order has no items — cannot generate invoice"
            )
          );
        }

        const doc =
          new PDFDocument({
            size: "A4",

            margins: {
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            },

            bufferPages: true,

            autoFirstPage: true,

            info: {
              Title: `Sales Invoice — ${safe(
                order.invoiceNumber ||
                  order.orderNumber ||
                  String(order._id),
                "MH"
              )}`,

              Author: safe(
                BIZ.name,
                "Mega Himalayan Pvt. Ltd."
              ),

              Subject:
                "Sales Invoice",

              Creator:
                "Mega Himalayan E-Commerce System",
            },
          });

        if (HAS_CUSTOM_FONTS) {
          doc.registerFont(
            "Mukta",
            REGULAR_FONT_PATH
          );

          doc.registerFont(
            "Mukta-Bold",
            BOLD_FONT_PATH
          );
        }

        const chunks = [];

        doc.on("data", (chunk) => {
          chunks.push(chunk);
        });

        doc.on("error", (error) => {
          reject(error);
        });

        doc.on("end", () => {
          try {
            const buffer =
              Buffer.concat(chunks);

            if (
              !Buffer.isBuffer(
                buffer
              ) ||
              buffer.length === 0
            ) {
              return reject(
                new Error(
                  "Empty PDF buffer"
                )
              );
            }

            resolve(buffer);
          } catch (error) {
            reject(error);
          }
        });

        drawPageBase(doc);

        let y =
          drawHeader(
            doc,
            order
          );

        y =
          drawAddresses(
            doc,
            order,
            user,
            y
          );

        y =
          drawOrderStatus(
            doc,
            order,
            y
          );

        y =
          drawItemsTable(
            doc,
            order,
            y
          );

        y =
          drawTotals(
            doc,
            order,
            y
          );

        y =
          drawPaymentInfo(
            doc,
            order,
            y
          );

        drawTerms(
          doc,
          y
        );

        drawCardBorder(doc);

        const range =
          doc.bufferedPageRange();

        const totalPages =
          range.count;

        for (
          let i = range.start;
          i <
          range.start + totalPages;
          i++
        ) {
          doc.switchToPage(i);

          drawPageFooter(
            doc,
            i + 1,
            totalPages
          );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    }
  );
}
