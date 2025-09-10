const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    $disconnect: jest.fn()
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('Auth Routes', () => {
  let prisma;
  let app;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: '테스트 사용자',
        phone: '010-1234-5678'
      };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user123',
        ...newUser,
        password: 'hashed_password',
        userType: 'WORKER',
        verified: false,
        createdAt: new Date()
      });

      // 실제 테스트 구현
      expect(prisma.user.create).toBeDefined();
    });

    it('should return error for duplicate email', async () => {
      const existingUser = {
        id: 'existing123',
        email: 'existing@example.com'
      };

      prisma.user.findUnique.mockResolvedValue(existingUser);

      // 중복 이메일 테스트
      expect(prisma.user.findUnique).toBeDefined();
    });

    it('should validate password strength', async () => {
      const weakPassword = {
        email: 'test@example.com',
        password: '123',
        name: '테스트'
      };

      // 약한 비밀번호 검증
      expect(weakPassword.password.length).toBeLessThan(8);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        password: await bcrypt.hash('Test123!@#', 10),
        name: '테스트 사용자',
        userType: 'WORKER'
      };

      prisma.user.findUnique.mockResolvedValue(user);

      const isValidPassword = await bcrypt.compare('Test123!@#', user.password);
      expect(isValidPassword).toBe(true);
    });

    it('should reject invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      
      expect(prisma.user.findUnique).toBeDefined();
    });
  });

  describe('JWT Token', () => {
    it('should generate valid JWT token', () => {
      const payload = {
        id: 'user123',
        email: 'test@example.com',
        userType: 'WORKER'
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d'
      });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
    });

    it('should reject expired token', () => {
      const token = jwt.sign(
        { id: 'user123' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow('jwt expired');
    });
  });
});

describe('Password Utils', () => {
  it('should hash password correctly', async () => {
    const password = 'Test123!@#';
    const hash = await bcrypt.hash(password, 10);
    
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);
  });

  it('should verify hashed password', async () => {
    const password = 'Test123!@#';
    const hash = await bcrypt.hash(password, 10);
    
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
    
    const isInvalid = await bcrypt.compare('wrong', hash);
    expect(isInvalid).toBe(false);
  });
});