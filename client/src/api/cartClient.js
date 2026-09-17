const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function handleResponse(res) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `API error ${res.status}`);
  }
  return res.json();
}

export async function getCart() {
  const res = await fetch(`${API_URL}/cart`, {
    credentials: "include",
  });
  return handleResponse(res);
}

export async function addToCart(productId, quantity = 1) {
  const res = await fetch(`${API_URL}/cart`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });
  return handleResponse(res);
}

export async function updateCartItem(itemId, quantity) {
  const res = await fetch(`${API_URL}/cart/${itemId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });
  return handleResponse(res);
}

export async function removeCartItem(itemId) {
  const res = await fetch(`${API_URL}/cart/${itemId}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(res);
}

export async function clearCartApi() {
  const res = await fetch(`${API_URL}/cart`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(res);
}

export async function applyCoupon(couponCode) {
  const res = await fetch(`${API_URL}/cart/coupon`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ couponCode }),
  });
  return handleResponse(res);
}

export async function removeCoupon() {
  const res = await fetch(`${API_URL}/cart/coupon`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(res);
}

// Public "Available Offers" list for the Cart page — doesn't need
// credentials to READ (guests can see what's on offer), but included
// anyway for consistency with every other call here; harmless on an
// unauthenticated route.
export async function getActiveCoupons() {
  const res = await fetch(`${API_URL}/coupons/active`, {
    credentials: "include",
  });
  return handleResponse(res);
}