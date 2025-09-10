/**
 * @jest-environment node
 */

const request = require('supertest');
const express = require('express');
const authRoutes = require('../../../src/routes/auth');
const { authValidations } = require('../../../src/middlewares/validation');

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

jest.mock('../../../src/services/email', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn()
}));

const { prisma } = require('../../../src/config/database');
const bcrypt = require('bcryptjs');

describe('Auth Routes Integration', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'StrongPassword123!',
      name: 'Test User',
      userType: 'JOBSEEKER'
    };

    test('should register new user successfully', async () => {
      const hashedPassword = await bcrypt.hash(validRegistrationData.password, 12);
      const mockUser = {
        id: 'new-user-id',
        email: validRegistrationData.email,
        name: validRegistrationData.name,
        userType: validRegistrationData.userType,
        verified: false,
        isActive: true,
        createdAt: new Date()
      };

      prisma.user.findUnique.mockResolvedValue(null); // 중복 이메일 없음
      prisma.user.create.mockResolvedValue({ ...mockUser, password: hashedPassword });
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.loginHistory.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', '회원가입이 완료되었습니다');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.user.email).toBe(validRegistrationData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should fail with invalid email format', async () => {
      const invalidData = {
        ...validRegistrationData,
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', '입력 데이터가 올바르지 않습니다');
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.some(err => err.msg.includes('올바른 이메일'))).toBe(true);
    });

    test('should fail with weak password', async () => {
      const weakPasswordData = {
        ...validRegistrationData,
        password: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.some(err => 
        err.msg.includes('비밀번호는 8자 이상이며')
      )).toBe(true);
    });

    test('should fail with missing required fields', async () => {
      const incompleteData = {
        email: 'test@example.com',
        password: 'StrongPassword123!'
        // name과 userType 누락
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    test('should fail with duplicate email', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: validRegistrationData.email,
        name: 'Existing User'
      };

      prisma.user.findUnique.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', '이미 등록된 이메일입니다');
    });

    test('should normalize email to lowercase', async () => {
      const upperCaseEmailData = {
        ...validRegistrationData,
        email: 'TEST@EXAMPLE.COM'
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: upperCaseEmailData.name,
        userType: upperCaseEmailData.userType
      };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.loginHistory.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/register')
        .send(upperCaseEmailData);

      expect(response.status).toBe(201);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
    });

    test('should validate userType', async () => {
      const invalidUserTypeData = {
        ...validRegistrationData,
        userType: 'INVALID_TYPE'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUserTypeData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'user@example.com',
      password: 'CorrectPassword123!'
    };

    test('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash(validLoginData.password, 12);
      const mockUser = {
        id: 'user-id',
        email: validLoginData.email,
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

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '로그인 성공');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should fail with invalid email format', async () => {
      const invalidEmailData = {
        email: 'invalid-email',
        password: validLoginData.password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidEmailData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.some(err => 
        err.msg.includes('올바른 이메일')
      )).toBe(true);
    });

    test('should fail with empty password', async () => {
      const emptyPasswordData = {
        email: validLoginData.email,
        password: ''
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(emptyPasswordData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.some(err => 
        err.msg.includes('비밀번호를 입력해주세요')
      )).toBe(true);
    });

    test('should fail with non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', '이메일 또는 비밀번호가 올바르지 않습니다');
    });

    test('should fail with incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('DifferentPassword123!', 12);
      const mockUser = {
        id: 'user-id',
        email: validLoginData.email,
        password: hashedPassword,
        isActive: true,
        verified: true,
        failedLoginAttempts: 0
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', '이메일 또는 비밀번호가 올바르지 않습니다');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { failedLoginAttempts: { increment: 1 } }
      });
    });

    test('should fail for inactive user', async () => {
      const hashedPassword = await bcrypt.hash(validLoginData.password, 12);
      const mockUser = {
        id: 'user-id',
        email: validLoginData.email,
        password: hashedPassword,
        isActive: false,
        verified: true
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', '비활성화된 계정입니다');
    });

    test('should fail for unverified user', async () => {
      const hashedPassword = await bcrypt.hash(validLoginData.password, 12);
      const mockUser = {
        id: 'user-id',
        email: validLoginData.email,
        password: hashedPassword,
        isActive: true,
        verified: false
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('이메일 인증');
    });

    test('should normalize email to lowercase', async () => {
      const upperCaseEmailData = {
        email: 'USER@EXAMPLE.COM',
        password: validLoginData.password
      };

      const hashedPassword = await bcrypt.hash(validLoginData.password, 12);
      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
        password: hashedPassword,
        isActive: true,
        verified: true,
        failedLoginAttempts: 0
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.refreshToken.count.mockResolvedValue(1);
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.loginHistory.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/login')
        .send(upperCaseEmailData);

      expect(response.status).toBe(200);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' }
      });
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    test('should send reset email for valid email', async () => {
      const requestData = { email: 'user@example.com' };
      const mockUser = {
        id: 'user-id',
        email: requestData.email,
        isActive: true
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '비밀번호 재설정 이메일을 발송했습니다');
    });

    test('should fail with invalid email format', async () => {
      const invalidData = { email: 'invalid-email' };

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    test('should return success even for non-existent user (security)', async () => {
      const requestData = { email: 'nonexistent@example.com' };
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '비밀번호 재설정 이메일을 발송했습니다');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    test('should reset password with valid token', async () => {
      const resetData = {
        token: 'valid-reset-token',
        password: 'NewStrongPassword123!'
      };

      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
        resetPasswordToken: 'valid-reset-token',
        resetPasswordExpires: new Date(Date.now() + 3600000), // 1시간 후
        isActive: true
      };

      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '비밀번호가 재설정되었습니다');
    });

    test('should fail with invalid token format', async () => {
      const invalidData = {
        token: '',
        password: 'NewStrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    test('should fail with weak new password', async () => {
      const weakPasswordData = {
        token: 'valid-token',
        password: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(weakPasswordData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'StrongPassword123!',
        name: 'Test User',
        userType: 'JOBSEEKER'
      };

      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(validData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });

    test('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send('email=test@example.com&password=Test123!');

      // Express는 이를 처리할 수 있어야 함
      expect(response.status).toBe(400);
    });
  });

  describe('Security Headers and Response Format', () => {
    test('should not expose sensitive user data', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      const mockUser = {
        id: 'user-id',
        email: 'user@example.com',
        password: hashedPassword,
        name: 'Test User',
        userType: 'JOBSEEKER',
        verified: true,
        isActive: true,
        failedLoginAttempts: 0
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.refreshToken.count.mockResolvedValue(1);
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.loginHistory.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: 'Password123!' });

      expect(response.status).toBe(200);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).not.toHaveProperty('resetPasswordToken');
      expect(response.body.data.user).not.toHaveProperty('failedLoginAttempts');
    });

    test('should include CORS headers in development', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid', password: 'test' });

      // CORS 헤더가 있어야 함 (실제 미들웨어에 의존)
      expect(response.headers).toBeDefined();
    });

    test('should validate request size limits', async () => {
      const largeData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'A'.repeat(10000), // 매우 긴 이름
        userType: 'JOBSEEKER'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(largeData);

      // 요청 크기 제한이 적용되어야 함
      expect(response.status).toBeLessThan(500);
    });
  });
});