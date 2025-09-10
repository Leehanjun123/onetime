/**
 * @jest-environment node
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AuthService = require('../../../src/services/auth');
const { PrismaClient } = require('@prisma/client');

// Mock dependencies
jest.mock('../../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn()
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn()
    },
    loginHistory: {
      create: jest.fn()
    },
    suspiciousActivity: {
      create: jest.fn()
    }
  }
}));

jest.mock('../../../src/config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn()
}));

const { prisma } = require('../../../src/config/database');
const redis = require('../../../src/config/redis');

describe('AuthService', () => {
  let authService;
  
  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('Token Generation', () => {
    test('should generate valid access and refresh tokens', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        userType: 'JOBSEEKER'
      };

      const tokens = authService.generateTokens(payload);

      // Token 구조 검증
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('tokenId');
      expect(tokens).toHaveProperty('expiresIn', 900);
      expect(tokens).toHaveProperty('refreshExpiresIn', 604800);

      // Access Token 내용 검증
      const decodedAccess = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
      expect(decodedAccess.userId).toBe(payload.userId);
      expect(decodedAccess.email).toBe(payload.email);
      expect(decodedAccess.userType).toBe(payload.userType);
      expect(decodedAccess.iss).toBe('onetime');
      expect(decodedAccess.aud).toBe('onetime-app');

      // Refresh Token 내용 검증
      const decodedRefresh = jwt.verify(
        tokens.refreshToken, 
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
      expect(decodedRefresh.userId).toBe(payload.userId);
      expect(decodedRefresh.type).toBe('refresh');
    });

    test('should generate unique token IDs', () => {
      const payload = { userId: 'test', email: 'test@test.com' };
      const tokens1 = authService.generateTokens(payload);
      const tokens2 = authService.generateTokens(payload);

      expect(tokens1.tokenId).not.toBe(tokens2.tokenId);
      expect(tokens1.tokenId).toHaveLength(32);
      expect(tokens2.tokenId).toHaveLength(32);
    });
  });

  describe('User Registration', () => {
    test('should successfully register a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'StrongPassword123!',
        name: 'New User',
        userType: 'JOBSEEKER'
      };

      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const mockUser = {
        id: 'new-user-id',
        email: userData.email,
        name: userData.name,
        userType: userData.userType,
        verified: false,
        isActive: true,
        createdAt: new Date()
      };

      prisma.user.findUnique.mockResolvedValue(null); // 이메일 중복 없음
      prisma.user.create.mockResolvedValue({ ...mockUser, password: hashedPassword });
      
      const result = await authService.register(userData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email.toLowerCase() }
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: userData.email.toLowerCase(),
          name: userData.name,
          userType: userData.userType,
          password: expect.any(String)
        })
      });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(userData.email.toLowerCase());
    });

    test('should throw error for duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Test User',
        userType: 'JOBSEEKER'
      };

      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: userData.email
      });

      await expect(authService.register(userData)).rejects.toThrow('이미 등록된 이메일입니다');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    test('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123!',
        name: 'Test User',
        userType: 'JOBSEEKER'
      };

      await expect(authService.register(userData)).rejects.toThrow('유효한 이메일 주소를 입력해주세요');
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    test('should validate password strength', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
        userType: 'JOBSEEKER'
      };

      await expect(authService.register(userData)).rejects.toThrow();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('User Login', () => {
    test('should successfully login with valid credentials', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'CorrectPassword123!'
      };

      const hashedPassword = await bcrypt.hash(loginData.password, 12);
      const mockUser = {
        id: 'user-id',
        email: loginData.email,
        password: hashedPassword,
        name: 'Test User',
        userType: 'JOBSEEKER',
        verified: true,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.refreshToken.count.mockResolvedValue(2);
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.loginHistory.create.mockResolvedValue({});

      const result = await authService.login(loginData, {
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.id).toBe(mockUser.id);
      expect(prisma.loginHistory.create).toHaveBeenCalled();
    });

    test('should fail login with incorrect password', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'WrongPassword123!'
      };

      const mockUser = {
        id: 'user-id',
        email: loginData.email,
        password: await bcrypt.hash('CorrectPassword123!', 12),
        isActive: true,
        verified: true,
        failedLoginAttempts: 0
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});

      await expect(authService.login(loginData, { ip: '127.0.0.1' }))
        .rejects.toThrow('이메일 또는 비밀번호가 올바르지 않습니다');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { failedLoginAttempts: { increment: 1 } }
      });
    });

    test('should fail login for inactive user', async () => {
      const loginData = {
        email: 'inactive@example.com',
        password: 'Password123!'
      };

      const mockUser = {
        id: 'inactive-user',
        email: loginData.email,
        isActive: false,
        verified: true
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.login(loginData, { ip: '127.0.0.1' }))
        .rejects.toThrow('비활성화된 계정입니다');
    });

    test('should handle account lockout after failed attempts', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'WrongPassword123!'
      };

      const mockUser = {
        id: 'user-id',
        email: loginData.email,
        password: await bcrypt.hash('CorrectPassword123!', 12),
        isActive: true,
        verified: true,
        failedLoginAttempts: 4 // 이미 4번 실패
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});

      await expect(authService.login(loginData, { ip: '127.0.0.1' }))
        .rejects.toThrow('계정이 잠겼습니다');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date)
        }
      });
    });
  });

  describe('Token Refresh', () => {
    test('should successfully refresh valid token', async () => {
      const payload = { userId: 'user-id', email: 'user@example.com' };
      const oldRefreshToken = jwt.sign(
        { ...payload, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const mockRefreshToken = {
        id: 'refresh-token-id',
        userId: 'user-id',
        token: oldRefreshToken,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
        userType: 'JOBSEEKER',
        isActive: true,
        verified: true
      };

      prisma.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.refreshToken.delete.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.refreshToken(oldRefreshToken, {
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      });

      expect(result).toHaveProperty('tokens');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
      expect(prisma.refreshToken.delete).toHaveBeenCalled();
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    test('should fail refresh with invalid token', async () => {
      const invalidToken = 'invalid.refresh.token';

      await expect(authService.refreshToken(invalidToken, { ip: '127.0.0.1' }))
        .rejects.toThrow('유효하지 않은 토큰입니다');

      expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
    });

    test('should fail refresh with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user-id', type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '-1d' } // 만료된 토큰
      );

      await expect(authService.refreshToken(expiredToken, { ip: '127.0.0.1' }))
        .rejects.toThrow('만료된 토큰입니다');
    });
  });

  describe('Logout', () => {
    test('should successfully logout user', async () => {
      const refreshToken = 'valid.refresh.token';
      
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await authService.logout('user-id', refreshToken);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', '로그아웃되었습니다');
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-id',
          token: refreshToken
        }
      });
    });

    test('should logout all sessions', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      const result = await authService.logoutAll('user-id');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('sessionsTerminated', 3);
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-id' }
      });
    });
  });

  describe('Rate Limiting', () => {
    test('should track and enforce rate limiting', async () => {
      const ip = '127.0.0.1';
      const key = `rate_limit:auth:${ip}`;

      redis.get.mockResolvedValue('4'); // 이미 4번 시도
      redis.incr.mockResolvedValue(5);
      redis.expire.mockResolvedValue(1);

      const result = await authService.checkRateLimit(ip);

      expect(result).toHaveProperty('allowed', false);
      expect(result).toHaveProperty('remaining', 0);
      expect(redis.get).toHaveBeenCalledWith(key);
      expect(redis.incr).toHaveBeenCalledWith(key);
    });

    test('should allow requests within rate limit', async () => {
      const ip = '127.0.0.1';
      const key = `rate_limit:auth:${ip}`;

      redis.get.mockResolvedValue('2'); // 2번 시도
      redis.incr.mockResolvedValue(3);
      redis.expire.mockResolvedValue(1);

      const result = await authService.checkRateLimit(ip);

      expect(result).toHaveProperty('allowed', true);
      expect(result).toHaveProperty('remaining', 2);
    });
  });

  describe('Password Validation', () => {
    test('should validate strong passwords', () => {
      const strongPasswords = [
        'StrongPassword123!',
        'MySecure@Pass456',
        'Complex#Password789'
      ];

      strongPasswords.forEach(password => {
        expect(authService.validatePassword(password)).toBe(true);
      });
    });

    test('should reject weak passwords', () => {
      const weakPasswords = [
        'short',           // 너무 짧음
        'nospecialchar123', // 특수문자 없음
        'NOUPPER123!',     // 소문자 없음
        'nolower123!',     // 대문자 없음
        'NoNumbers!',      // 숫자 없음
        '12345678!'        // 일반적인 패턴
      ];

      weakPasswords.forEach(password => {
        expect(authService.validatePassword(password)).toBe(false);
      });
    });
  });
});

describe('AuthService Error Handling', () => {
  let authService;
  
  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  test('should handle database connection errors during registration', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'StrongPassword123!',
      name: 'Test User',
      userType: 'JOBSEEKER'
    };

    prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

    await expect(authService.register(userData))
      .rejects.toThrow('서비스 오류가 발생했습니다');
  });

  test('should handle Redis connection errors gracefully', async () => {
    redis.get.mockRejectedValue(new Error('Redis connection failed'));
    redis.incr.mockRejectedValue(new Error('Redis connection failed'));

    // Rate limiting should still work without Redis
    const result = await authService.checkRateLimit('127.0.0.1');
    
    expect(result).toHaveProperty('allowed', true);
    expect(result).toHaveProperty('remaining', 5);
  });
});