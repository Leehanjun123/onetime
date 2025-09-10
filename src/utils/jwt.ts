import jwt from 'jsonwebtoken';
import { JWTPayload } from '@/types/user';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-fallback-secret-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

/**
 * JWT 토큰 생성
 */
export const generateToken = (payload: any): string => {
  return (jwt.sign as any)(
    payload,
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN
    }
  );
};

/**
 * JWT 토큰 검증
 */
export const verifyToken = (token: string): any => {
  if (!token) {
    throw new Error('Invalid token');
  }
  
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * JWT 토큰 디코드 (검증 없이)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  if (!token) {
    return null;
  }
  
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};

/**
 * 토큰에서 사용자 정보 추출
 */
export const getUserFromToken = (token: string): Pick<JWTPayload, 'id' | 'email' | 'userType'> | null => {
  if (!token) {
    return null;
  }
  
  try {
    const decoded = verifyToken(token);
    return {
      id: decoded.id,
      email: decoded.email,
      userType: decoded.userType
    };
  } catch {
    return null;
  }
};

/**
 * 토큰 갱신
 */
export const refreshToken = (token: string): string => {
  try {
    const decoded = verifyToken(token);
    // 새로운 토큰 생성 (기존 데이터 유지)
    const { iat, exp, aud, iss, ...payload } = decoded;
    return generateToken(payload);
  } catch {
    throw new Error('Cannot refresh invalid token');
  }
};

// CommonJS 호환성을 위한 default export
export default {
  generateToken,
  verifyToken,
  decodeToken,
  getUserFromToken,
  refreshToken
};