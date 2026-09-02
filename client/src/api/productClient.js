// src/api/productClient.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// Backend (Mongoose) sends _id, but the frontend (CartContext, ProductCard,
// ProductDetails, etc.) reads product.id everywhere. This copies _id -> id
// right at the API boundary so nothing downstream has to change.
function normalizeProduct(product) {
  if (!product) return product;
  return { ...product, id: product.id ?? product._id };
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function getProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_URL}/products${query ? `?${query}` : ""}`;
  const res = await fetch(url);
  const data = await handleResponse(res);
  const products = data.products ?? data;
  return products.map(normalizeProduct);
}

export async function getProductById(id) {
  const res = await fetch(`${API_URL}/product/${id}`);
  const data = await handleResponse(res);
  return normalizeProduct(data.product ?? data);
}

export async function getFilterOptions() {
  const res = await fetch(`${API_URL}/filters`);
  return handleResponse(res);
}

/**
 * Fetch all reviews for a product.
 */
export async function getProductReviews(productId) {
  const res = await fetch(`${API_URL}/reviews?id=${productId}`);
  const data = await handleResponse(res);
  return data.reviews ?? [];
}

/**
 * Submit (create or update) a review. Requires auth cookie.
 */
export async function submitReview({ productId, rating, comment, images = [], videos = [] }) {
  const imageBase64 = await Promise.all(images.map(fileToBase64))
  const videoBase64 = await Promise.all(videos.map(fileToBase64))
  const res = await fetch(`${API_URL}/review`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, rating, comment, images: imageBase64, video: videoBase64 }),
  });
  return handleResponse(res);
}

// POST /api/v1/order/new
export async function createOrder(orderData) {
  const res = await fetch(`${API_URL}/order/new`, {
    method: 'POST',
    credentials: 'include',         // sends the auth cookie
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to place order')
  }
  return res.json()
}

export async function getMyOrders() {
  const res = await fetch(`${API_URL}/orders/me`, {
    credentials: 'include',
  })
  if(!res.ok){
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to fetch orders')
  }
  return res.json()
}

// PUT /api/v1/order/:id/cancel
export async function cancelOrder(orderId) {
  const res = await fetch(`${API_URL}/order/${orderId}/cancel`, {
    method: 'PUT',
    credentials: 'include',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to cancel order')
  }
  return res.json()
}
