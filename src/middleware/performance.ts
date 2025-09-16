import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

// Response time tracker
export const responseTimeTracker = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Log slow requests (over 1 second)
    if (responseTime > 1000) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.path} took ${responseTime}ms`);
    }
    
    // Log request info for monitoring
    console.log(`📊 ${req.method} ${req.path} - ${res.statusCode} - ${responseTime}ms`);
  });
  
  next();
};

// Request size limiter
export const requestSizeLimiter = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check Content-Length header
    const contentLength = req.headers['content-length'];
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeInMB = parseInt(maxSize.replace('mb', ''));
      
      if (sizeInMB > maxSizeInMB) {
        return res.status(413).json({
          error: 'Payload too large',
          maxSize: maxSize,
          receivedSize: `${sizeInMB.toFixed(2)}MB`
        });
      }
    }
    
    next();
  };
};

// Cache headers for static content
export const cacheHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Cache static assets for 1 year
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Cache API responses for 5 minutes
  else if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
  // No cache for dynamic content
  else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  
  next();
};

// Request timeout handler
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request timeout',
          timeout: `${timeoutMs}ms`
        });
      }
    }, timeoutMs);
    
    res.on('finish', () => {
      clearTimeout(timeout);
    });
    
    next();
  };
};

// Memory usage monitor
export const memoryMonitor = (req: Request, res: Response, next: NextFunction) => {
  const usage = process.memoryUsage();
  const usageInMB = {
    rss: Math.round(usage.rss / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024)
  };
  
  // Log memory usage for monitoring
  if (usageInMB.heapUsed > 500) { // Warn if heap usage > 500MB
    console.warn(`⚠️ High memory usage: ${JSON.stringify(usageInMB)}MB`);
  }
  
  // Add memory info to response headers (for debugging)
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('X-Memory-Usage', JSON.stringify(usageInMB));
  }
  
  next();
};

// CPU usage monitor (simplified)
export const cpuMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startCpuUsage = process.cpuUsage();
  
  res.on('finish', () => {
    const cpuUsage = process.cpuUsage(startCpuUsage);
    const cpuPercent = {
      user: Math.round(cpuUsage.user / 1000), // Convert to milliseconds
      system: Math.round(cpuUsage.system / 1000)
    };
    
    // Log high CPU usage
    if (cpuPercent.user + cpuPercent.system > 100) {
      console.warn(`⚠️ High CPU usage: User ${cpuPercent.user}ms, System ${cpuPercent.system}ms`);
    }
    
    if (process.env.NODE_ENV === 'development') {
      res.setHeader('X-CPU-Usage', JSON.stringify(cpuPercent));
    }
  });
  
  next();
};

// Compression middleware setup
export const compressionMiddleware = compression({
  // Only compress responses that are larger than 1kb
  threshold: 1024,
  // Compression level (1-9, 6 is default)
  level: 6,
  // Filter function to determine what to compress
  filter: (req: Request, res: Response) => {
    // Don't compress if the request has a 'no-compression' header
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Use compression for text-based content
    return compression.filter(req, res);
  }
});

// Request ID generator for tracing
export const requestIdGenerator = (req: Request, res: Response, next: NextFunction) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// Health check metrics
export const healthMetrics = {
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    avgResponseTime: 0
  },
  uptime: process.uptime(),
  startTime: new Date().toISOString(),
  version: process.env.npm_package_version || '1.0.0'
};

// Metrics collector
export const metricsCollector = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  healthMetrics.requests.total++;
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Update response time average
    const total = healthMetrics.requests.total;
    healthMetrics.requests.avgResponseTime = 
      (healthMetrics.requests.avgResponseTime * (total - 1) + responseTime) / total;
    
    // Update success/failure counts
    if (res.statusCode >= 200 && res.statusCode < 400) {
      healthMetrics.requests.successful++;
    } else {
      healthMetrics.requests.failed++;
    }
    
    // Update uptime
    healthMetrics.uptime = process.uptime();
  });
  
  next();
};