// src/utils/apiCache.js

class APICache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Generate a cache key from URL and options
   */
  generateKey(url, options = {}) {
    // Include relevant parts of options that affect the response
    const keyData = {
      url,
      method: options.method || 'GET',
      body: options.body,
      // Don't include headers in cache key as they rarely affect response content
    };
    return JSON.stringify(keyData);
  }

  /**
   * Check if cache entry is still valid
   */
  isValid(entry) {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get cached response if available and valid
   */
  get(key) {
    const entry = this.cache.get(key);
    if (entry && this.isValid(entry)) {
      return entry.data;
    }
    if (entry) {
      // Remove expired entry
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Set cache entry with TTL
   */
  set(key, data, ttl = this.cacheExpiry) {
    // Limit cache size to prevent memory bloat
    if (this.cache.size > 100) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.slice(0, 10).forEach(([key]) => this.cache.delete(key));
    }

    this.cache.set(key, {
      data: structuredClone(data), // Deep clone to prevent mutations
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Cached fetch with request deduplication
   */
  async fetch(url, options = {}, ttl = this.cacheExpiry) {
    const key = this.generateKey(url, options);

    // Return cached response if available
    const cached = this.get(key);
    if (cached) {
      return cached;
    }

    // If request is already pending, return the same promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Make the request
    const requestPromise = fetch(url, options)
      .then(async (response) => {
        // Only cache successful responses
        if (response.ok) {
          const data = await response.json();
          this.set(key, data, ttl);
          return data;
        } else {
          // For error responses, don't cache but still return the response
          throw response;
        }
      })
      .finally(() => {
        // Remove from pending requests when done
        this.pendingRequests.delete(key);
      });

    // Store the promise to prevent duplicate requests
    this.pendingRequests.set(key, requestPromise);

    return requestPromise;
  }

  /**
   * Clear cache for specific patterns or all
   */
  invalidate(pattern) {
    if (!pattern) {
      this.cache.clear();
      this.pendingRequests.clear();
      return;
    }

    // Remove entries matching pattern
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Create global instance
const apiCache = new APICache();

export default apiCache;