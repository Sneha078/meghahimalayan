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
  });
}

export async function getProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_URL}/products${query ? `?${query}` : ""}`;
  const res = await fetch(url);
  const data = await handleResponse(res);
  const products = (data.products ?? data).map(normalizeProduct)
  return {
    products,
    // NOTE: this key was previously "ProductCount" (capital P), which never
    // matched data.productCount from the backend — productCount was silently
    // always falling back to products.length (the capped page size).
    productCount: data.productCount ?? products.length,
    totalPages: data.totalPages ?? 1,
    currentPage: data.currentPage ?? 1,
  }
}

export async function getProductById(id) {
  const res = await fetch(`${API_URL}/product/${id}`);
  const data = await handleResponse(res);
  return normalizeProduct(data.product ?? data);
}

// GET /api/v1/filters
// GET /api/v1/filters?category=eyeglasses  → brand/subcategory/gender scoped to that category
export async function getFilterOptions(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/filters${query ? `?${query}` : ""}`);
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
    body: JSON.stringify({ productId, rating, comment, images: imageBase64, videos: videoBase64 }),
  });
  return handleResponse(res);
}

// DELETE /api/v1/reviews?productId=<productId>&id=<reviewId>
// One review per user per product, but the backend still keys the delete
// off the review's own _id (not just productId) — it looks it up inside
// product.reviews via product.reviews.id(req.query.id). Both params are
// required or the backend 400s.
// Ownership is enforced server-side (user can only delete their own review;
// admins can delete any), so this is safe to call directly.
export async function deleteReview(productId, reviewId) {
  const res = await fetch(
    `${API_URL}/reviews?productId=${productId}&id=${reviewId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  )
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to delete review')
  }
  return res.json()
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

// GET /api/v1/order/:id  (single order for the logged-in user)
export async function getMySingleOrder(orderId) {
  const res = await fetch(`${API_URL}/order/${orderId}`, {
    credentials: 'include',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to fetch order')
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
// GET /api/v1/wishlist
export async function getWishlist() {
  const res = await fetch(`${API_URL}/wishlist`, {
    credentials: 'include',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to fetch wishlist')
  }
  return res.json()  // returns { success, wishlist: [...products] }
}


export async function addToWishlist(productId) {
  const res = await fetch(`${API_URL}/wishlist`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to add to wishlist')
  }
  return res.json()
}


export async function removeFromWishlist(productId) {
  const res = await fetch(`${API_URL}/wishlist/${productId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to remove from wishlist')
  }
  return res.json()
}

// POST /api/v1/returns
export async function submitReturnRequest(payload) {
  const res = await fetch(`${API_URL}/returns`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to submit return request')
  }
  return res.json()
}

// GET /api/v1/returns/me — customer's own return requests
export async function getMyReturns(params = {}) {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${API_URL}/returns/me${query ? `?${query}` : ''}`, {
    credentials: 'include',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to fetch returns')
  }
  return res.json()
}

// PUT /api/v1/returns/:id/cancel — cancel a pending return request
export async function cancelReturn(returnId) {
  const res = await fetch(`${API_URL}/returns/${returnId}/cancel`, {
    method: 'PUT',
    credentials: 'include',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to cancel return')
  }
  return res.json()
}

// GET /api/v1/invoice/order/:id/invoice — returns a PDF blob
export async function downloadInvoice(orderId){
  const res = await fetch(`${API_URL}/invoice/order/${orderId}/invoice`, {
    credentials: 'include',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to download invoice')
  }
  return res.blob()
}

// Get /api/v1/coupons/public - no auth required
export async function getPublicCoupons(){
  const res = await fetch(`${API_URL}/coupons/public`)
  const data = await handleResponse(res)
  return data.coupons ?? []
}