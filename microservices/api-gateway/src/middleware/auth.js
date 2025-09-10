const jwt = require('jsonwebtoken');
const redis = require('redis');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const redisClient = redis.createClient(process.env.REDIS_URL);

// Redis 연결
redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.connect().catch(console.error);

/**
 * JWT 토큰 검증 미들웨어
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다'
      });
    }

    const token = authHeader.substring(7);
    
    // 블랙리스트 확인
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: '만료된 토큰입니다'
      });
    }

    // JWT 검증
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 토큰 정보를 요청에 추가
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      userType: decoded.userType,
      verified: decoded.verified
    };
    
    req.token = token;
    
    logger.info(`[${req.requestId}] User authenticated: ${decoded.userId}`);
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다'
      });
    }
    
    logger.error(`[${req.requestId}] Token verification error:`, error);
    return res.status(401).json({
      success: false,
      message: '토큰 검증 실패'
    });
  }
};

/**
 * 선택적 인증 미들웨어
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // 토큰이 없어도 계속 진행
  }
  
  try {
    await verifyToken(req, res, next);
  } catch (error) {
    // 인증 실패해도 계속 진행
    next();
  }
};

/**
 * 관리자 권한 확인 미들웨어
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.userType !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다'
    });
  }
  next();
};

/**
 * 고용주 권한 확인 미들웨어
 */
const requireEmployer = (req, res, next) => {
  if (!req.user || (req.user.userType !== 'EMPLOYER' && req.user.userType !== 'ADMIN')) {
    return res.status(403).json({
      success: false,
      message: '고용주 권한이 필요합니다'
    });
  }
  next();
};

/**
 * 근로자 권한 확인 미들웨어
 */
const requireWorker = (req, res, next) => {
  if (!req.user || (req.user.userType !== 'WORKER' && req.user.userType !== 'ADMIN')) {
    return res.status(403).json({
      success: false,
      message: '근로자 권한이 필요합니다'
    });
  }
  next();
};

/**
 * 인증된 사용자만 허용 (역할 무관)
 */
const requireAuth = verifyToken;

/**
 * 이메일 인증된 사용자만 허용
 */
const requireVerified = (req, res, next) => {
  if (!req.user || !req.user.verified) {
    return res.status(403).json({
      success: false,
      message: '이메일 인증이 필요합니다'
    });
  }
  next();
};

/**
 * 토큰 블랙리스트 추가 (로그아웃 시 사용)
 */
const blacklistToken = async (token, expiresIn = 24 * 60 * 60) => {
  try {
    await redisClient.setEx(`blacklist:${token}`, expiresIn, 'true');
    logger.info('Token added to blacklist');
  } catch (error) {
    logger.error('Failed to blacklist token:', error);
    throw error;
  }
};

/**
 * Rate limiting (사용자별)
 */
const createUserRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next();
    }
    
    const key = `rate_limit:user:${req.user.id}`;
    const requests = await redisClient.incr(key);
    
    if (requests === 1) {
      await redisClient.expire(key, Math.floor(windowMs / 1000));
    }
    
    if (requests > maxRequests) {
      return res.status(429).json({
        success: false,
        message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
      });
    }
    
    // 남은 요청 수를 헤더에 추가
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - requests),
      'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
    });
    
    next();
  };
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireAdmin,
  requireEmployer,
  requireWorker,
  requireAuth,
  requireVerified,
  blacklistToken,
  createUserRateLimit
};