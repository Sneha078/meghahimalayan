// src/api/cachedClient.js
import apiCache from '../utils/apiCache.js';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

/**
 * Enhanced fetch with caching and request deduplication
 */
export async function cachedFetch(endpoint, options = {}, cacheOptions = {}) {
  const { 
    ttl = 5 * 60 * 1000, // 5 minutes default
    skipCache = false,
    credentials = 'include',
    ...fetchOptions 
  } = { ...options, ...cacheOptions };

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  const fullOptions = {
    credentials,
    ...fetchOptions,
  };

  // Skip cache for mutations or when explicitly requested
  if (skipCache || (fullOptions.method && fullOptions.method !== 'GET')) {
    const response = await fetch(url, fullOptions);
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`API error ${response.status}: ${text}`);
    }
    
    // Invalidate related cache entries on mutations
    if (fullOptions.method && fullOptions.method !== 'GET') {
      const pathParts = new URL(url).pathname.split('/');
      const resource = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
      apiCache.invalidate(resource);
    }
    
    return response.json();
  }

  // Use cached fetch for GET requests
  try {
    return await apiCache.fetch(url, fullOptions, ttl);
  } catch (response) {
    if (response instanceof Response) {
      const text = await response.text().catch(() => "");
      throw new Error(`API error ${response.status}: ${text}`);
    }
    throw response;
  }
}

/**
 * Specific cache configurations for different types of data
 */
export const CacheConfig = {
  // Long cache for relatively static data
  PRODUCTS: { ttl: 10 * 60 * 1000 }, // 10 minutes
  CATEGORIES: { ttl: 30 * 60 * 1000 }, // 30 minutes
  FILTERS: { ttl: 15 * 60 * 1000 }, // 15 minutes
  
  // Medium cache for semi-dynamic data
  PRODUCT_DETAILS: { ttl: 5 * 60 * 1000 }, // 5 minutes
  REVIEWS: { ttl: 2 * 60 * 1000 }, // 2 minutes
  
  // Short cache for dynamic data
  CART: { ttl: 30 * 1000 }, // 30 seconds
  ORDERS: { ttl: 1 * 60 * 1000 }, // 1 minute
  
  // No cache for real-time data
  NO_CACHE: { skipCache: true },
};

/**
 * Clear cache when user logs in/out to prevent data leakage
 */
export function clearUserCache() {
  apiCache.invalidate();
}

/**
 * Clear specific resource cache
 */
export function invalidateCache(resource) {
  apiCache.invalidate(resource);
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats() {
  return apiCache.getStats();
}