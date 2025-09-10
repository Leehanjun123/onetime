const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * JWT 토큰 생성
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'onetime-api',
    audience: 'onetime-client'
  });
};

/**
 * JWT 토큰 검증
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'onetime-api',
      audience: 'onetime-client'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * JWT 토큰 디코드 (검증 없이)
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * 토큰에서 사용자 정보 추출
 */
const getUserFromToken = (token) => {
  try {
    const decoded = verifyToken(token);
    return {
      id: decoded.id,
      email: decoded.email,
      userType: decoded.userType
    };
  } catch (error) {
    return null;
  }
};

/**
 * 토큰 갱신
 */
const refreshToken = (token) => {
  try {
    const decoded = verifyToken(token);
    // 새로운 토큰 생성 (기존 데이터 유지)
    const { iat, exp, ...payload } = decoded;
    return generateToken(payload);
  } catch (error) {
    throw new Error('Cannot refresh invalid token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  getUserFromToken,
  refreshToken
};