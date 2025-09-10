const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

/**
 * 보안 헤더 설정
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.tosspayments.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // 일부 API와의 호환성을 위해 비활성화
});

/**
 * API 요청 제한
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: {
    error: 'Too many requests',
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    retryAfter: 900 // 15분 후 재시도
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      error: 'Too many requests',
      message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      retryAfter: 900
    });
  },
  skip: (req) => {
    // 헬스체크는 제한에서 제외
    return req.path === '/health' || req.path === '/api/health';
  }
});

/**
 * 인증 관련 요청 제한 (더 엄격)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5 요청
  message: {
    error: 'Too many authentication attempts',
    message: '인증 시도가 너무 많습니다. 15분 후 다시 시도해주세요.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      email: req.body?.email,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: '인증 시도가 너무 많습니다. 15분 후 다시 시도해주세요.',
      retryAfter: 900
    });
  }
});

/**
 * 관리자 작업 요청 제한
 */
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 10, // 최대 10 요청
  message: {
    error: 'Too many admin requests',
    message: '관리자 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * IP 기반 보안 검사
 */
const ipSecurity = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // IP 차단 목록 (추후 Redis나 DB에서 관리 가능)
  const blockedIPs = process.env.BLOCKED_IPS ? process.env.BLOCKED_IPS.split(',') : [];
  
  if (blockedIPs.includes(clientIP)) {
    logger.warn('Blocked IP attempted access', {
      ip: clientIP,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(403).json({
      error: 'Access denied',
      message: '접근이 거부되었습니다.'
    });
  }
  
  next();
};

/**
 * 보안 이벤트 로깅
 */
const securityLogger = (req, res, next) => {
  // 의심스러운 패턴 감지
  const suspiciousPatterns = [
    /(?:union|select|insert|delete|update|drop|create|alter)/i,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /on\w+\s*=/i
  ];
  
  const requestBody = JSON.stringify(req.body || {});
  const queryString = JSON.stringify(req.query || {});
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestBody) || pattern.test(queryString)) {
      logger.warn('Suspicious request detected', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        userAgent: req.get('User-Agent'),
        pattern: pattern.toString()
      });
      
      return res.status(400).json({
        error: 'Invalid request',
        message: '유효하지 않은 요청입니다.'
      });
    }
  }
  
  next();
};

/**
 * HTTPS 강제 적용 (프로덕션에서)
 */
const forceHTTPS = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.header('host')}${req.url}`);
  }
  next();
};

/**
 * CORS 보안 설정
 */
const corsOptions = {
  origin: (origin, callback) => {
    // 환경변수에서 허용된 도메인 목록 가져오기
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    // 개발 환경에서는 origin이 없을 수 있음 (Postman 등)
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS policy violation', {
        origin,
        allowedOrigins
      });
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

/**
 * 파일 업로드 보안
 */
const fileUploadSecurity = {
  // 허용된 파일 타입
  allowedTypes: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  
  // 최대 파일 크기 (10MB)
  maxSize: 10 * 1024 * 1024,
  
  // 파일 검증
  validateFile: (file) => {
    if (!file) return { valid: false, error: '파일이 없습니다.' };
    
    if (!fileUploadSecurity.allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: '허용되지 않는 파일 형식입니다.' };
    }
    
    if (file.size > fileUploadSecurity.maxSize) {
      return { valid: false, error: '파일 크기가 너무 큽니다.' };
    }
    
    // 파일명 검증 (특수문자 제한)
    const filename = file.originalname;
    if (!/^[\w\-_\.\(\)\[\]]+$/.test(filename)) {
      return { valid: false, error: '파일명에 허용되지 않는 문자가 포함되어 있습니다.' };
    }
    
    return { valid: true };
  }
};

module.exports = {
  securityHeaders,
  apiLimiter,
  authLimiter,
  adminLimiter,
  ipSecurity,
  securityLogger,
  forceHTTPS,
  corsOptions,
  fileUploadSecurity
};