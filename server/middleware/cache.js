import NodeCache from "node-cache";

// Create cache instances with different TTL for different data types
const productCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minutes
const categoryCache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // 10 minutes
const statsCache = new NodeCache({ stdTTL: 180, checkperiod: 60 }); // 3 minutes

/**
 * Cache middleware factory
 * @param {string} cacheType - Type of cache (product, category, stats)
 * @param {number} ttl - Time to live in seconds (optional, uses default)
 */
export const cacheMiddleware = (cacheType = 'product', ttl = null) => {
  let cache;
  
  switch (cacheType) {
    case 'category':
      cache = categoryCache;
      break;
    case 'stats':
      cache = statsCache;
      break;
    default:
      cache = productCache;
  }

  return (req, res, next) => {
    // Skip caching for authenticated requests (user-specific data)
    if (req.user || req.cookies.token) {
      return next();
    }

    // Skip caching for POST, PUT, PATCH, DELETE requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from route and query parameters
    const cacheKey = `${req.originalUrl}`;

    try {
      const cachedResponse = cache.get(cacheKey);
      
      if (cachedResponse) {
        // Set cache headers
        res.set('X-Cache', 'HIT');
        res.set('Cache-Control', 'public, max-age=300');
        return res.status(cachedResponse.status).json(cachedResponse.data);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseData = {
            status: res.statusCode,
            data: data
          };
          
          if (ttl) {
            cache.set(cacheKey, responseData, ttl);
          } else {
            cache.set(cacheKey, responseData);
          }
        }
        
        // Set cache headers
        res.set('X-Cache', 'MISS');
        res.set('Cache-Control', 'public, max-age=300');
        
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      // If cache fails, continue without caching
      console.warn('Cache middleware error:', error.message);
      next();
    }
  };
};

/**
 * Clear cache for specific type or key
 * @param {string} type - Cache type to clear
 * @param {string} key - Specific key to clear (optional)
 */
export const clearCache = (type = 'product', key = null) => {
  let cache;
  
  switch (type) {
    case 'category':
      cache = categoryCache;
      break;
    case 'stats':
      cache = statsCache;
      break;
    default:
      cache = productCache;
  }

  if (key) {
    cache.del(key);
  } else {
    cache.flushAll();
  }
};

/**
 * Middleware to clear cache after write operations
 */
export const clearCacheMiddleware = (cacheType = 'product') => {
  return (req, res, next) => {
    // Store original end function
    const originalEnd = res.end;
    
    res.end = function(...args) {
      // Clear cache only if operation was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        clearCache(cacheType);
      }
      
      // Call original end function
      originalEnd.apply(this, args);
    };
    
    next();
  };
};

export { productCache, categoryCache, statsCache };