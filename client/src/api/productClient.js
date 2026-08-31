// src/api/productClient.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
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
  return data.products ?? data;
}

export async function getProductById(id) {
  const res = await fetch(`${API_URL}/product/${id}`);
  const data = await handleResponse(res);
  return data.product ?? data;
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
