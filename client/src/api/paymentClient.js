// src/api/paymentClient.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function handleResponse(res) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `API error ${res.status}`);
  }
  return res.json();
}

// POST /api/v1/payment/esewa/initiate
// body: { orderId }
// Returns { success, url, payload } — url is eSewa's form endpoint, payload
// is the full set of signed fields eSewa expects as a POST'd HTML form
// (not a GET redirect — see redirectToEsewa below).
export async function initiateEsewaPayment(orderId) {
  const res = await fetch(`${API_URL}/payment/esewa/initiate`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });
  return handleResponse(res);
}

// POST /api/v1/payment/khalti/initiate
// body: { orderId }
// Returns { success, paymentUrl, pidx } — paymentUrl is a plain redirect target.
export async function initiateKhaltiPayment(orderId) {
  const res = await fetch(`${API_URL}/payment/khalti/initiate`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });
  return handleResponse(res);
}

// GET /api/v1/payment/bank-transfer/details
export async function getBankTransferDetails() {
  const res = await fetch(`${API_URL}/payment/bank-transfer/details`, {
    credentials: "include",
  });
  return handleResponse(res);
}

// POST /api/v1/payment/bank-transfer/submit
// body: { orderId, referenceNumber, screenshotUrl }
export async function submitBankTransfer(payload) {
  const res = await fetch(`${API_URL}/payment/bank-transfer/submit`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/**
 * eSewa's v2 integration expects a real browser form POST with the signed
 * fields as form fields — not a fetch/redirect and not a query string GET.
 * This builds a throwaway <form>, fills it with the payload eSewa gave us,
 * and submits it, which navigates the whole tab to eSewa's payment page.
 *
 * Call this with the { url, payload } you got back from initiateEsewaPayment.
 */
export function redirectToEsewa(url, payload) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;

  Object.entries(payload).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

/**
 * Khalti's flow is a plain redirect — no form needed, just send the browser
 * to the paymentUrl from initiateKhaltiPayment.
 */
export function redirectToKhalti(paymentUrl) {
  window.location.href = paymentUrl;
}