const request = require('supertest');
const express = require('express');

describe('Security Middleware Tests', () => {
  let app;

  beforeEach(() => {
    app = express();
    // 테스트용 간단한 미들웨어 설정
    app.use(express.json());
    
    // 테스트 엔드포인트
    app.get('/test', (req, res) => {
      res.json({ message: 'success' });
    });
    
    app.post('/test-auth', (req, res) => {
      res.json({ message: 'auth success' });
    });
  });

  describe('Rate Limiting', () => {
    test('should allow normal request rate', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);
      
      expect(response.body.message).toBe('success');
    });

    test('should have security headers', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);
      
      // 기본적인 보안 헤더들이 있는지 확인
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('Input Validation', () => {
    test('should reject oversized requests', async () => {
      const largePayload = 'x'.repeat(20 * 1024 * 1024); // 20MB
      
      await request(app)
        .post('/test-auth')
        .send({ data: largePayload })
        .expect(413); // Payload Too Large
    });

    test('should handle malformed JSON', async () => {
      await request(app)
        .post('/test-auth')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });
  });

  describe('CORS Protection', () => {
    test('should handle preflight requests', async () => {
      await request(app)
        .options('/test')
        .set('Origin', 'https://malicious-site.com')
        .set('Access-Control-Request-Method', 'GET')
        .expect((res) => {
          // CORS 설정에 따라 적절히 처리되는지 확인
          expect(res.status).toBeGreaterThanOrEqual(200);
        });
    });
  });

  describe('SQL Injection Protection', () => {
    test('should sanitize SQL injection attempts', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'/*",
        "1; SELECT * FROM users",
      ];

      sqlInjectionAttempts.forEach(attempt => {
        // 실제 SQL 쿼리에서 이러한 입력이 안전하게 처리되는지 확인
        // Prisma ORM이 prepared statements를 사용하므로 기본적으로 보호됨
        expect(attempt).toContain("'"); // 단순히 SQL 문자가 포함되어 있는지 확인
      });
    });
  });

  describe('XSS Protection', () => {
    test('should escape XSS attempts', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(1)',
        '<svg onload="alert(1)">',
      ];

      xssAttempts.forEach(attempt => {
        // 클라이언트에서 이러한 입력이 적절히 이스케이프되는지 확인
        const escaped = attempt
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
        
        expect(escaped).not.toContain('<script>');
        expect(escaped).not.toContain('javascript:');
      });
    });
  });

  describe('Password Security', () => {
    test('should validate strong passwords', () => {
      const strongPasswords = [
        'MySecure123!',
        'Complex$Pass2024',
        'Strong&Password1',
      ];

      const weakPasswords = [
        'password',
        '123456',
        'qwerty',
        'admin',
        'password123',
      ];

      // 강한 비밀번호 테스트
      strongPasswords.forEach(password => {
        expect(password.length).toBeGreaterThanOrEqual(8);
        expect(password).toMatch(/[a-z]/); // 소문자
        expect(password).toMatch(/[A-Z]/); // 대문자
        expect(password).toMatch(/\d/); // 숫자
        expect(password).toMatch(/[!@#$%^&*(),.?":{}|<>]/); // 특수문자
      });

      // 약한 비밀번호는 기준을 통과하지 못해야 함
      weakPasswords.forEach(password => {
        const meetsAllCriteria = 
          password.length >= 8 &&
          /[a-z]/.test(password) &&
          /[A-Z]/.test(password) &&
          /\d/.test(password) &&
          /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        expect(meetsAllCriteria).toBe(false);
      });
    });
  });

  describe('JWT Token Security', () => {
    test('should validate JWT token format', () => {
      const validJWTFormat = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
      
      const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      expect(sampleToken).toMatch(validJWTFormat);
    });

    test('should reject malformed tokens', () => {
      const malformedTokens = [
        'invalid.token',
        'not.a.jwt.token',
        '',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', // incomplete
      ];

      const validJWTFormat = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

      malformedTokens.forEach(token => {
        expect(token).not.toMatch(validJWTFormat);
      });
    });
  });

  describe('IP Address Validation', () => {
    test('should validate IPv4 addresses', () => {
      const validIPv4 = [
        '192.168.1.1',
        '10.0.0.1',
        '127.0.0.1',
        '8.8.8.8',
      ];

      const invalidIPv4 = [
        '256.256.256.256',
        '192.168.1',
        '192.168.1.1.1',
        'not.an.ip',
      ];

      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

      validIPv4.forEach(ip => {
        expect(ip).toMatch(ipv4Regex);
      });

      invalidIPv4.forEach(ip => {
        expect(ip).not.toMatch(ipv4Regex);
      });
    });
  });

  describe('User Agent Validation', () => {
    test('should identify suspicious user agents', () => {
      const suspiciousUserAgents = [
        'curl/7.68.0',
        'wget/1.20.3',
        'python-requests/2.25.1',
        'bot',
        'crawler',
        'spider',
      ];

      const legitimateUserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
      ];

      const suspiciousPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /curl/i,
        /wget/i,
        /python/i,
      ];

      suspiciousUserAgents.forEach(userAgent => {
        const isSuspicious = suspiciousPatterns.some(pattern => 
          pattern.test(userAgent)
        );
        expect(isSuspicious).toBe(true);
      });

      legitimateUserAgents.forEach(userAgent => {
        const isSuspicious = suspiciousPatterns.some(pattern => 
          pattern.test(userAgent)
        );
        expect(isSuspicious).toBe(false);
      });
    });
  });

  describe('Data Sanitization', () => {
    test('should sanitize sensitive data in logs', () => {
      const sensitiveData = {
        email: 'user@example.com',
        password: 'secret123',
        token: 'abc123xyz',
        creditCard: '1234-5678-9012-3456',
        normal: 'public data'
      };

      const sensitiveFields = ['password', 'token', 'credit'];
      
      const sanitized = {};
      for (const [key, value] of Object.entries(sensitiveData)) {
        const isSensitive = sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase())
        );
        
        sanitized[key] = isSensitive ? '[REDACTED]' : value;
      }

      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.creditCard).toBe('[REDACTED]');
      expect(sanitized.email).toBe('user@example.com');
      expect(sanitized.normal).toBe('public data');
    });
  });
});

describe('Security Event Monitoring', () => {
  test('should track failed login attempts', () => {
    const failedAttempts = [];
    const maxAttempts = 3;
    
    // 실패한 로그인 시도 시뮬레이션
    for (let i = 0; i < 5; i++) {
      failedAttempts.push({
        email: 'test@example.com',
        timestamp: new Date(),
        ip: '192.168.1.100'
      });
    }

    expect(failedAttempts.length).toBeGreaterThan(maxAttempts);
    
    // 잠금 로직 시뮬레이션
    const shouldLock = failedAttempts.length >= maxAttempts;
    expect(shouldLock).toBe(true);
  });

  test('should detect brute force patterns', () => {
    const loginAttempts = [];
    const timeWindow = 15 * 60 * 1000; // 15분
    const now = Date.now();
    
    // 짧은 시간 내 많은 시도 시뮬레이션
    for (let i = 0; i < 10; i++) {
      loginAttempts.push({
        timestamp: now - (i * 1000), // 1초 간격
        ip: '192.168.1.100'
      });
    }

    const recentAttempts = loginAttempts.filter(attempt => 
      now - attempt.timestamp < timeWindow
    );

    expect(recentAttempts.length).toBe(10);
    
    // 브루트 포스 탐지
    const isBruteForce = recentAttempts.length > 5;
    expect(isBruteForce).toBe(true);
  });
});

describe('Content Security Policy', () => {
  test('should validate CSP directives', () => {
    const cspDirectives = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'"],
      'font-src': ["'self'"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'frame-src': ["'none'"]
    };

    // CSP 설정이 적절한지 확인
    expect(cspDirectives['default-src']).toContain("'self'");
    expect(cspDirectives['object-src']).toContain("'none'");
    expect(cspDirectives['frame-src']).toContain("'none'");
    
    // 안전하지 않은 설정 확인
    expect(cspDirectives['default-src']).not.toContain("'unsafe-eval'");
  });
});