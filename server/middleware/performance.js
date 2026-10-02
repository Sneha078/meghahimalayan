import onHeaders from 'on-headers';

export const performanceLogger = (req, res, next) => {
  const start = Date.now();

  // Log slow queries (> 1 second)
  const SLOW_REQUEST_THRESHOLD = 1000;

  // Add response time header (must happen before headers are sent)
  onHeaders(res, () => {
    res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
  });

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Log all requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    }

    // Log slow requests in production
    if (duration > SLOW_REQUEST_THRESHOLD) {
      console.warn(`SLOW REQUEST: ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
  });

  next();
};

/**
 * Memory usage monitoring for development
 */
export const memoryMonitor = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    const memBefore = process.memoryUsage();
    
    res.on('finish', () => {
      const memAfter = process.memoryUsage();
      const heapUsedDiff = memAfter.heapUsed - memBefore.heapUsed;
      
      if (heapUsedDiff > 10 * 1024 * 1024) { // 10MB threshold
        console.warn(`HIGH MEMORY USAGE: ${req.method} ${req.originalUrl} - ${Math.round(heapUsedDiff / 1024 / 1024)}MB`);
      }
    });
  }
  
  next();
};