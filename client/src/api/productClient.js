// src/api/productClient.js
import { cachedFetch, CacheConfig } from './cachedClient.js';

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

// Use cached fetch for product listings (can be cached longer)
export async function getProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/products${query ? `?${query}` : ""}`;
  
  const data = await cachedFetch(endpoint, {}, CacheConfig.PRODUCTS);
  const products = (data.products ?? data).map(normalizeProduct)
  
  return {
    products,
    productCount: data.productCount ?? products.length,
    totalPages: data.totalPages ?? 1,
    currentPage: data.currentPage ?? 1,
  }
}

// Use cached fetch for individual products
export async function getProductById(id) {
  const data = await cachedFetch(`/product/${id}`, {}, CacheConfig.PRODUCT_DETAILS);
  return normalizeProduct(data.product ?? data);
}

// Use cached fetch for filter options (rarely change)
export async function getFilterOptions(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/filters${query ? `?${query}` : ""}`;
  return cachedFetch(endpoint, {}, CacheConfig.FILTERS);
}

// Use cached fetch for reviews (change infrequently)
export async function getProductReviews(productId) {
  const data = await cachedFetch(`/reviews?id=${productId}`, {}, CacheConfig.REVIEWS);
  return data.reviews ?? [];
}

// No cache for review submission (mutation)
export async function submitReview({ productId, rating, comment, images = [], videos = [] }) {
  const imageBase64 = await Promise.all(images.map(fileToBase64))
  const videoBase64 = await Promise.all(videos.map(fileToBase64))
  
  return cachedFetch('/review', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, rating, comment, images: imageBase64, videos: videoBase64 }),
  }, CacheConfig.NO_CACHE);
}

// No cache for review deletion (mutation)
export async function deleteReview(productId, reviewId) {
  return cachedFetch(
    `/reviews?productId=${productId}&id=${reviewId}`,
    { method: 'DELETE' },
    CacheConfig.NO_CACHE
  );
}

// No cache for order creation (mutation)
export async function createOrder(orderData, idempotencyKey) {
  const headers = {
    'Content-Type': 'application/json',
    ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
  };

  try {
    return await cachedFetch('/order/new', {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    }, CacheConfig.NO_CACHE);
  } catch (error) {
    const err = new Error(error.message || 'Failed to place order');
    err.status = error.status || 500;
    throw err;
  }
}

// Short cache for user orders (semi-dynamic)
export async function getMyOrders() {
  return cachedFetch('/orders/me', {}, CacheConfig.ORDERS);
}

// Short cache for individual orders
export async function getMySingleOrder(orderId) {
  return cachedFetch(`/order/${orderId}`, {}, CacheConfig.ORDERS);
}

// No cache for order cancellation (mutation)
export async function cancelOrder(orderId) {
  return cachedFetch(`/order/${orderId}/cancel`, {
    method: 'PUT',
  }, CacheConfig.NO_CACHE);
}

// Short cache for wishlist (user-specific)
export async function getWishlist() {
  return cachedFetch('/wishlist', {}, CacheConfig.ORDERS);
}

// No cache for wishlist mutations
export async function addToWishlist(productId) {
  return cachedFetch('/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  }, CacheConfig.NO_CACHE);
}

export async function removeFromWishlist(productId) {
  return cachedFetch(`/wishlist/${productId}`, {
    method: 'DELETE',
  }, CacheConfig.NO_CACHE);
}

// No cache for return submissions (mutation)
export async function submitReturnRequest(payload) {
  console.log('Submitting return request:', payload)
  
  try {
    const data = await cachedFetch('/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, CacheConfig.NO_CACHE);
    
    console.log('Return request success:', data)
    return data
  } catch (error) {
    console.error('Return request error:', error)
    throw error
  }
}

// No cache for file uploads (always fresh)
export async function uploadReturnImages(files) {
  if (!files || files.length === 0) {
    return []
  }
  
  const formData = new FormData()
  Array.from(files).forEach((file, index) => {
    console.log(`Uploading file ${index}:`, file.name, file.type, file.size)
    formData.append('images', file)
  })

  // Use regular fetch for FormData uploads
  try {
    const res = await fetch(`${API_URL}/returns/upload-images`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `Upload failed: ${res.status} ${res.statusText}`)
    }
    
    const data = await res.json()
    console.log('Upload response:', data)
    return data.images
  } catch (error) {
    console.error('Image upload error:', error)
    throw error
  }
}

// Short cache for user returns
export async function getMyReturns(params = {}) {
  const query = new URLSearchParams(params).toString()
  const endpoint = `/returns/me${query ? `?${query}` : ''}`
  return cachedFetch(endpoint, {}, CacheConfig.ORDERS);
}

// No cache for return cancellation (mutation)
export async function cancelReturn(returnId) {
  return cachedFetch(`/returns/${returnId}/cancel`, {
    method: 'PUT',
  }, CacheConfig.NO_CACHE);
}

// No cache for invoice downloads (always fresh)
export async function downloadInvoice(orderId) {
  const res = await fetch(`${API_URL}/invoice/order/${orderId}/invoice`, {
    credentials: 'include',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to download invoice')
  }
  return res.blob()
}

// Medium cache for public coupons (change occasionally)
export async function getPublicCoupons() {
  const data = await cachedFetch('/coupons/public', {}, CacheConfig.FILTERS);
  return data.coupons ?? [];
}