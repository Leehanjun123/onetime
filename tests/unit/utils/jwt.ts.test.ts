/**
 * @jest-environment node
 */

import { generateToken, verifyToken, decodeToken, getUserFromToken } from '../../../src/utils/jwt';
import { JWTPayload } from '../../../src/types/user';

describe('JWT Utils - TypeScript Tests', () => {
  const testPayload: Omit<JWTPayload, 'iat' | 'exp' | 'aud' | 'iss'> = {
    id: 'test-user-id',
    email: 'test@example.com',
    userType: 'WORKER'
  };

  beforeEach(() => {
    // 환경 변수 설정
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  describe('Basic Token Operations', () => {
    test('should generate and verify token', () => {
      const token = generateToken(testPayload);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
      
      const decoded = verifyToken(token);
      expect(decoded.id).toBe(testPayload.id);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.userType).toBe(testPayload.userType);
    });

    test('should decode token without verification', () => {
      const token = generateToken(testPayload);
      const decoded = decodeToken(token);
      
      expect(decoded?.id).toBe(testPayload.id);
      expect(decoded?.email).toBe(testPayload.email);
    });

    test('should extract user from token', () => {
      const token = generateToken(testPayload);
      const user = getUserFromToken(token);
      
      expect(user).toEqual({
        id: testPayload.id,
        email: testPayload.email,
        userType: testPayload.userType
      });
    });

    test('should handle invalid tokens', () => {
      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
      expect(getUserFromToken('invalid-token')).toBeNull();
      expect(decodeToken('invalid-token')).toBeNull();
    });

    test('should handle null/undefined tokens', () => {
      expect(() => verifyToken('')).toThrow('Invalid token');
      expect(getUserFromToken('')).toBeNull();
      expect(decodeToken('')).toBeNull();
    });
  });
});