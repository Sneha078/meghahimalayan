// for gateway urls, constants(tests vs live)
// Centralizes gateway URLs so switching test → live is a one-line change per gateway.
const isProd = process.env.NODE_ENV === "production";

export const ESEWA_CONFIG = {
  formUrl: isProd
    ? "https://epay.esewa.com.np/api/epay/main/v2/form"
    : "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  statusCheckUrl: isProd
    ? "https://epay.esewa.com.np/api/epay/transaction/status/"
    : "https://rc.esewa.com.np/api/epay/transaction/status/",
  productCode: process.env.ESEWA_PRODUCT_CODE, // e.g. EPAYTEST in sandbox
  secretKey: process.env.ESEWA_SECRET_KEY,
};

export const KHALTI_CONFIG = {
  initiateUrl: "https://a.khalti.com/api/v2/epayment/initiate/",
  lookupUrl: "https://a.khalti.com/api/v2/epayment/lookup/",
  secretKey: process.env.KHALTI_SECRET_KEY,
};

export const BANK_ACCOUNT_INFO = {
  bankName: process.env.BANK_NAME || "Nabil Bank",
  accountName: process.env.BANK_ACCOUNT_NAME || "Mega Himalaya Optical House",
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || "",
  branch: process.env.BANK_BRANCH || "Pokhara",
};