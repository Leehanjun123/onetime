const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const validator = require('validator');
const crypto = require('crypto');

// Advanced Helmet configuration
const helmetConfig = () => helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https://api.tosspayments.com', 'wss://'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", 'https://www.tosspayments.com'],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
});

// Enhanced rate limiting with multiple strategies
const createRateLimiter = (options = {}) => {
  const defaults = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
      // Use combination of IP and user ID for better tracking
      return req.ip + ':' + (req.user?.id || 'anonymous');
    },
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: req.rateLimit.resetTime
      });
    }
  };
  
  return rateLimit({ ...defaults, ...options });
};

// Specific rate limiters for different endpoints
const rateLimiters = {
  general: createRateLimiter(),
  
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: 'Too many authentication attempts'
  }),
  
  api: createRateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: 'API rate limit exceeded'
  }),
  
  payment: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Payment rate limit exceeded'
  }),
  
  upload: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Upload rate limit exceeded'
  })
};

// CSRF Token generation and validation
class CSRFProtection {
  constructor() {
    this.tokens = new Map();
  }
  
  generateToken(sessionId) {
    const token = crypto.randomBytes(32).toString('hex');
    this.tokens.set(sessionId, {
      token,
      createdAt: Date.now(),
      used: false
    });
    
    // Clean old tokens
    this.cleanOldTokens();
    
    return token;
  }
  
  validateToken(sessionId, token) {
    const stored = this.tokens.get(sessionId);
    
    if (!stored) return false;
    if (stored.used) return false;
    if (stored.token !== token) return false;
    if (Date.now() - stored.createdAt > 3600000) return false; // 1 hour expiry
    
    stored.used = true;
    return true;
  }
  
  cleanOldTokens() {
    const now = Date.now();
    for (const [key, value] of this.tokens.entries()) {
      if (now - value.createdAt > 3600000 || value.used) {
        this.tokens.delete(key);
      }
    }
  }
}

const csrfProtection = new CSRFProtection();

// CSRF Middleware
const csrfMiddleware = (req, res, next) => {
  // Skip for GET requests
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  const sessionId = req.session?.id || req.ip;
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  
  if (!token || !csrfProtection.validateToken(sessionId, token)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
};

// Generate CSRF token endpoint
const generateCSRFToken = (req, res) => {
  const sessionId = req.session?.id || req.ip;
  const token = csrfProtection.generateToken(sessionId);
  
  res.json({ csrfToken: token });
};

// SQL Injection Prevention
const sanitizeSQL = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove dangerous SQL keywords and characters
  const dangerous = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION',
    'ALTER', 'CREATE', 'EXEC', 'EXECUTE', '--', '/*', '*/',
    'xp_', 'sp_', 'OR 1=1', 'OR true', ';--', '\'--'
  ];
  
  let sanitized = input;
  dangerous.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  // Escape special characters
  sanitized = sanitized
    .replace(/'/g, "''")
    .replace(/"/g, '""')
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
    
  return sanitized;
};

// Input validation middleware
const validateInput = (rules) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body[field] || req.query[field] || req.params[field];
      
      // Required check
      if (rule.required && !value) {
        errors.push(`${field} is required`);
        continue;
      }
      
      if (!value) continue;
      
      // Type validation
      if (rule.type) {
        switch (rule.type) {
          case 'email':
            if (!validator.isEmail(value)) {
              errors.push(`${field} must be a valid email`);
            }
            break;
          case 'url':
            if (!validator.isURL(value)) {
              errors.push(`${field} must be a valid URL`);
            }
            break;
          case 'phone':
            if (!validator.isMobilePhone(value, 'ko-KR')) {
              errors.push(`${field} must be a valid Korean phone number`);
            }
            break;
          case 'number':
            if (!validator.isNumeric(value)) {
              errors.push(`${field} must be a number`);
            }
            break;
          case 'date':
            if (!validator.isISO8601(value)) {
              errors.push(`${field} must be a valid date`);
            }
            break;
          case 'uuid':
            if (!validator.isUUID(value)) {
              errors.push(`${field} must be a valid UUID`);
            }
            break;
        }
      }
      
      // Length validation
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${field} must be at most ${rule.maxLength} characters`);
      }
      
      // Range validation
      if (rule.min !== undefined && Number(value) < rule.min) {
        errors.push(`${field} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && Number(value) > rule.max) {
        errors.push(`${field} must be at most ${rule.max}`);
      }
      
      // Pattern validation
      if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
        errors.push(`${field} has invalid format`);
      }
      
      // Custom validation
      if (rule.custom && !rule.custom(value)) {
        errors.push(`${field} is invalid`);
      }
      
      // Sanitize the input
      if (rule.sanitize !== false) {
        const sanitized = sanitizeSQL(validator.escape(value));
        if (req.body[field]) req.body[field] = sanitized;
        if (req.query[field]) req.query[field] = sanitized;
        if (req.params[field]) req.params[field] = sanitized;
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    
    next();
  };
};

// XSS Prevention for responses
const sanitizeResponse = (data) => {
  if (typeof data === 'string') {
    return validator.escape(data);
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeResponse);
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeResponse(value);
    }
    return sanitized;
  }
  return data;
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Expect-CT', 'max-age=86400, enforce');
  
  next();
};

// IP-based blocking for suspicious activity
class IPBlocker {
  constructor() {
    this.blockedIPs = new Set();
    this.suspiciousActivity = new Map();
  }
  
  recordActivity(ip, type) {
    if (!this.suspiciousActivity.has(ip)) {
      this.suspiciousActivity.set(ip, []);
    }
    
    const activities = this.suspiciousActivity.get(ip);
    activities.push({ type, timestamp: Date.now() });
    
    // Keep only recent activities (last hour)
    const oneHourAgo = Date.now() - 3600000;
    const recentActivities = activities.filter(a => a.timestamp > oneHourAgo);
    this.suspiciousActivity.set(ip, recentActivities);
    
    // Block if too many suspicious activities
    if (recentActivities.length > 10) {
      this.blockIP(ip);
      return true;
    }
    
    return false;
  }
  
  blockIP(ip) {
    this.blockedIPs.add(ip);
    setTimeout(() => this.unblockIP(ip), 24 * 60 * 60 * 1000); // Auto-unblock after 24 hours
  }
  
  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    this.suspiciousActivity.delete(ip);
  }
  
  isBlocked(ip) {
    return this.blockedIPs.has(ip);
  }
}

const ipBlocker = new IPBlocker();

// IP blocking middleware
const ipBlockingMiddleware = (req, res, next) => {
  const ip = req.ip;
  
  if (ipBlocker.isBlocked(ip)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Check for suspicious patterns
  const suspicious = [
    req.path.includes('../'),
    req.path.includes('..\\'),
    req.path.includes('%2e%2e'),
    req.path.includes('eval('),
    req.path.includes('<script'),
    Object.values(req.query).some(v => v && v.toString().includes('SELECT')),
    Object.values(req.body).some(v => v && v.toString().includes('DROP')),
  ];
  
  if (suspicious.some(s => s)) {
    if (ipBlocker.recordActivity(ip, 'suspicious_request')) {
      return res.status(403).json({ error: 'Access denied due to suspicious activity' });
    }
  }
  
  next();
};

module.exports = {
  helmetConfig,
  rateLimiters,
  csrfMiddleware,
  generateCSRFToken,
  sanitizeSQL,
  validateInput,
  sanitizeResponse,
  securityHeaders,
  ipBlockingMiddleware,
  xss: xss(),
  hpp: hpp(),
  mongoSanitize: mongoSanitize(),
};