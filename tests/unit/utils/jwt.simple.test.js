/**
 * @jest-environment node
 */

const jwt = require('jsonwebtoken');

describe('JWT Utils - Simple Tests', () => {
  let jwtUtils;
  const testPayload = {
    id: 'test-user-id',
    email: 'test@example.com',
    userType: 'JOBSEEKER'
  };

  beforeEach(() => {
    // 환경 변수 설정
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing';
    process.env.JWT_EXPIRES_IN = '1h';
    
    // 모듈 캐시 클리어하고 다시 로드
    delete require.cache[require.resolve('../../../src/utils/jwt')];
    jwtUtils = require('../../../src/utils/jwt');
  });

  describe('Basic Token Operations', () => {
    test('should generate and verify token', () => {
      const token = jwtUtils.generateToken(testPayload);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
      
      const decoded = jwtUtils.verifyToken(token);
      expect(decoded.id).toBe(testPayload.id);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.userType).toBe(testPayload.userType);
    });

    test('should decode token without verification', () => {
      const token = jwtUtils.generateToken(testPayload);
      const decoded = jwtUtils.decodeToken(token);
      
      expect(decoded.id).toBe(testPayload.id);
      expect(decoded.email).toBe(testPayload.email);
    });

    test('should extract user from token', () => {
      const token = jwtUtils.generateToken(testPayload);
      const user = jwtUtils.getUserFromToken(token);
      
      expect(user).toEqual({
        id: testPayload.id,
        email: testPayload.email,
        userType: testPayload.userType
      });
    });

    test('should handle invalid tokens', () => {
      expect(() => jwtUtils.verifyToken('invalid-token')).toThrow('Invalid token');
      expect(jwtUtils.getUserFromToken('invalid-token')).toBeNull();
      expect(jwtUtils.decodeToken('invalid-token')).toBeNull();
    });

    test('should handle null/undefined tokens', () => {
      expect(() => jwtUtils.verifyToken(null)).toThrow('Invalid token');
      expect(() => jwtUtils.verifyToken(undefined)).toThrow('Invalid token');
      expect(jwtUtils.getUserFromToken(null)).toBeNull();
      expect(jwtUtils.getUserFromToken(undefined)).toBeNull();
    });
  });

  describe('Password Validation', () => {
    const passwordUtils = require('../../../src/utils/password');
    
    test('should validate strong password', () => {
      const result = passwordUtils.validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject weak password', () => {
      const result = passwordUtils.validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should hash and compare passwords', async () => {
      const password = 'TestPassword123!';
      const hashed = await passwordUtils.hashPassword(password);
      
      expect(typeof hashed).toBe('string');
      expect(hashed).not.toBe(password);
      
      const isMatch = await passwordUtils.comparePassword(password, hashed);
      expect(isMatch).toBe(true);
      
      const wrongMatch = await passwordUtils.comparePassword('WrongPassword', hashed);
      expect(wrongMatch).toBe(false);
    });

    test('should generate valid temporary password', () => {
      const tempPassword = passwordUtils.generateTempPassword();
      
      expect(tempPassword).toHaveLength(8);
      
      const validation = passwordUtils.validatePassword(tempPassword);
      expect(validation.isValid).toBe(true);
      
      // 다양한 문자 타입 포함 확인
      expect(/[A-Z]/.test(tempPassword)).toBe(true);
      expect(/[a-z]/.test(tempPassword)).toBe(true);
      expect(/[0-9]/.test(tempPassword)).toBe(true);
      expect(/[!@#$%&*]/.test(tempPassword)).toBe(true);
    });
  });
});