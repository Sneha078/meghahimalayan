// src/api/productClient.js
//
// Talks to the real backend (server/) instead of the local mock
// src/data/products.js file. Set VITE_API_URL in a client/.env file,
// e.g.  VITE_API_URL=http://localhost:5000/api/v1

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Fetch all products, optionally filtered by category/gender/etc.
 * @param {Object} params - e.g. { category: "eyeglasses" }
 */
export async function getProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_URL}/products${query ? `?${query}` : ""}`;
  const res = await fetch(url);
  const data = await handleResponse(res);
  // Adjust this line if your backend wraps the array differently,
  // e.g. return data.products instead of data, depending on your controller.
  return data.products ?? data;
}

/**
 * Fetch a single product by its Mongo _id or slug.
 * Note: your backend route is singular — /product/:id (not /products/:id)
 */
export async function getProductById(id) {
  const res = await fetch(`${API_URL}/product/${id}`);
  const data = await handleResponse(res);
  return data.product ?? data;
}

/**
 * Fetch available filter options (distinct categories, brands, genders,
 * subcategories, price range) — used to build the Shop page's filter
 * sidebar from real data instead of a hardcoded list.
 */
export async function getFilterOptions() {
  const res = await fetch(`${API_URL}/filters`);
  return handleResponse(res);
}