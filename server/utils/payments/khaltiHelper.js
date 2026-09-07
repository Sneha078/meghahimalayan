import axios from "axios";
import { KHALTI_CONFIG } from "../../config/paymentConfig.js";

export async function initiateKhaltiPayment({ amount, purchaseOrderId, purchaseOrderName, returnUrl, websiteUrl, customerInfo }) {
  const response = await axios.post(
    KHALTI_CONFIG.initiateUrl,
    {
      return_url: returnUrl,
      website_url: websiteUrl,
      amount, // must be in paisa: NPR * 100
      purchase_order_id: purchaseOrderId,
      purchase_order_name: purchaseOrderName,
      customer_info: customerInfo,
    },
    {
      headers: {
        Authorization: `Key ${KHALTI_CONFIG.secretKey}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data; // { pidx, payment_url, ... }
}

export async function lookupKhaltiPayment(pidx) {
  const response = await axios.post(
    KHALTI_CONFIG.lookupUrl,
    { pidx },
    {
      headers: {
        Authorization: `Key ${KHALTI_CONFIG.secretKey}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data; // { status: 'Completed' | 'Pending' | ..., transaction_id, ... }
}