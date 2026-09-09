import crypto from "crypto";

/**
 * eSewa ePay v2 requires an HMAC-SHA256 signature over specific fields,
 * in this exact order and format, base64-encoded.
 */
export function generateEsewaSignature(totalAmount, transactionUuid, productCode, secretKey) {
  const data = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac("sha256", secretKey).update(data).digest("base64");
}

/**
 * Verifies the signature eSewa sends back in its success callback,
 * so you're not just trusting whatever the browser redirected with.
 */
export function verifyEsewaSignature(payload, secretKey) {
  const expected = generateEsewaSignature(
    payload.total_amount,
    payload.transaction_uuid,
    payload.product_code,
    secretKey
  );
  return expected === payload.signature;
}