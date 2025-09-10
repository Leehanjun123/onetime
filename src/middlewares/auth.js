const { verifyToken, getUserFromToken } = require('../utils/jwt');
const { prisma } = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * JWT 토큰 검증 미들웨어
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({ 
        message: '접근 권한이 없습니다. 로그인이 필요합니다.' 
      });
    }

    // 토큰 검증
    const decoded = verifyToken(token);
    
    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        verified: true,
        rating: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        message: '유효하지 않은 사용자입니다.' 
      });
    }

    // 요청 객체에 사용자 정보 첨부
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: '토큰이 만료되었습니다. 다시 로그인해주세요.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: '유효하지 않은 토큰입니다.',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(500).json({ 
      message: '인증 처리 중 오류가 발생했습니다.' 
    });
  }
};

/**
 * 사용자 타입 검증 미들웨어
 */
const requireUserType = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: '인증이 필요합니다.' 
      });
    }

    const userTypes = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
    
    if (!userTypes.includes(req.user.userType)) {
      return res.status(403).json({ 
        message: '권한이 없습니다.',
        requiredUserType: userTypes,
        currentUserType: req.user.userType
      });
    }

    next();
  };
};

/**
 * 인증 선택적 미들웨어 (토큰이 있으면 검증, 없어도 통과)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (token) {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          verified: true,
          rating: true
        }
      });

      if (user) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // 선택적 인증이므로 에러가 나도 통과
    next();
  }
};

/**
 * 사용자 본인 확인 미들웨어
 */
const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: '인증이 필요합니다.' 
    });
  }

  const targetUserId = req.params.id || req.params.userId;
  
  // 관리자이거나 본인인 경우 허용
  if (req.user.userType === 'ADMIN' || req.user.id === targetUserId) {
    next();
  } else {
    return res.status(403).json({ 
      message: '본인의 정보만 접근할 수 있습니다.' 
    });
  }
};

/**
 * 검증된 사용자만 허용하는 미들웨어
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: '인증이 필요합니다.' 
    });
  }

  if (!req.user.verified) {
    return res.status(403).json({ 
      message: '이메일 인증이 필요합니다.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireUserType,
  optionalAuth,
  requireSelfOrAdmin,
  requireVerified
};