const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logger } = require('../utils/logger');

// JWT 토큰 검증 미들웨어
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        userType: true, 
        verified: true,
        phone: true,
        rating: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: '유효하지 않은 사용자입니다' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '토큰이 만료되었습니다' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다' });
    }
    
    logger.error('Authentication error', error);
    return res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다' });
  }
};

// 선택적 인증 (로그인하지 않아도 접근 가능, 로그인시 사용자 정보 추가)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    if (!token) {
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        userType: true, 
        verified: true,
        phone: true,
        rating: true
      }
    });
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // 토큰이 유효하지 않아도 계속 진행
    next();
  }
};

// 특정 사용자 타입만 허용
const requireUserType = (...allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다' });
    }
    
    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({ 
        error: '접근 권한이 없습니다',
        required: allowedTypes,
        current: req.user.userType
      });
    }
    
    next();
  };
};

// 이메일 인증 확인
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '인증이 필요합니다' });
  }
  
  if (!req.user.verified) {
    return res.status(403).json({ 
      error: '이메일 인증이 필요합니다',
      message: '이메일 인증을 완료한 후 이용해주세요'
    });
  }
  
  next();
};

// 관리자 권한 확인
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '인증이 필요합니다' });
  }
  
  if (req.user.userType !== 'ADMIN') {
    logger.warn('Unauthorized admin access attempt', {
      userId: req.user.id,
      path: req.path,
      ip: req.ip
    });
    
    return res.status(403).json({ error: '관리자 권한이 필요합니다' });
  }
  
  next();
};

// API 키 인증 (외부 서비스용)
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API 키가 필요합니다' });
  }
  
  // API 키 검증 (실제로는 DB에서 조회)
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key attempt', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip
    });
    
    return res.status(403).json({ error: '유효하지 않은 API 키입니다' });
  }
  
  next();
};

// 토큰 생성 헬퍼
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      userType: user.userType 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
    }
  );
};

// 리프레시 토큰 생성
const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    { 
      expiresIn: '30d' 
    }
  );
};

// 리프레시 토큰 검증
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
    );
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireUserType,
  requireVerified,
  requireAdmin,
  authenticateApiKey,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
};