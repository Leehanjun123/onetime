/**
 * @jest-environment node
 */

const bcrypt = require('bcryptjs');
const passwordUtils = require('../../../src/utils/password');

describe('Password Utils', () => {
  describe('hashPassword', () => {
    test('should hash password successfully', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await passwordUtils.hashPassword(password);
      
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt 해시는 보통 60자
      expect(hashedPassword.startsWith('$2b$12$') || hashedPassword.startsWith('$2a$12$')).toBe(true); // bcrypt 형식 확인
    });

    test('should generate different hashes for same password', async () => {
      const password = 'SamePassword123!';
      const hash1 = await passwordUtils.hashPassword(password);
      const hash2 = await passwordUtils.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
      // 하지만 둘 다 원본 비밀번호와 매치되어야 함
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });

    test('should handle empty password', async () => {
      const emptyPassword = '';
      const hashedPassword = await passwordUtils.hashPassword(emptyPassword);
      
      expect(typeof hashedPassword).toBe('string');
      expect(await bcrypt.compare(emptyPassword, hashedPassword)).toBe(true);
    });

    test('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+{}|:<>?[];,./~`';
      const hashedPassword = await passwordUtils.hashPassword(specialPassword);
      
      expect(await bcrypt.compare(specialPassword, hashedPassword)).toBe(true);
    });

    test('should handle unicode characters', async () => {
      const unicodePassword = '한글비밀번호123!';
      const hashedPassword = await passwordUtils.hashPassword(unicodePassword);
      
      expect(await bcrypt.compare(unicodePassword, hashedPassword)).toBe(true);
    });

    test('should handle very long password', async () => {
      const longPassword = 'A'.repeat(200) + '123!';
      const hashedPassword = await passwordUtils.hashPassword(longPassword);
      
      expect(await bcrypt.compare(longPassword, hashedPassword)).toBe(true);
    });
  });

  describe('comparePassword', () => {
    test('should return true for correct password', async () => {
      const password = 'CorrectPassword123!';
      const hashedPassword = await passwordUtils.hashPassword(password);
      
      const isMatch = await passwordUtils.comparePassword(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      const correctPassword = 'CorrectPassword123!';
      const incorrectPassword = 'WrongPassword123!';
      const hashedPassword = await passwordUtils.hashPassword(correctPassword);
      
      const isMatch = await passwordUtils.comparePassword(incorrectPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });

    test('should return false for empty password against hash', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await passwordUtils.hashPassword(password);
      
      const isMatch = await passwordUtils.comparePassword('', hashedPassword);
      expect(isMatch).toBe(false);
    });

    test('should return false for password against invalid hash', async () => {
      const password = 'TestPassword123!';
      const invalidHash = 'invalid-hash-format';
      
      const result = await passwordUtils.comparePassword(password, invalidHash);
      expect(result).toBe(false);
    });

    test('should be case sensitive', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await passwordUtils.hashPassword(password);
      
      const isMatch = await passwordUtils.comparePassword('testpassword123!', hashedPassword);
      expect(isMatch).toBe(false);
    });

    test('should handle special characters correctly', async () => {
      const password = 'Special!@#$%^&*()_+';
      const hashedPassword = await passwordUtils.hashPassword(password);
      
      const isMatch = await passwordUtils.comparePassword(password, hashedPassword);
      expect(isMatch).toBe(true);
    });
  });

  describe('validatePassword', () => {
    test('should validate strong password', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure@Password456',
        'Complex#Pass789',
        'Valid$Password123'
      ];

      strongPasswords.forEach(password => {
        const result = passwordUtils.validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should reject password that is too short', () => {
      const shortPassword = 'Short1!';
      const result = passwordUtils.validatePassword(shortPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('비밀번호는 최소 8자 이상이어야 합니다');
    });

    test('should reject password that is too long', () => {
      const longPassword = 'A'.repeat(101) + '123!';
      const result = passwordUtils.validatePassword(longPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('비밀번호는 100자를 초과할 수 없습니다');
    });

    test('should reject password without letters', () => {
      const noLettersPassword = '12345678!@#$';
      const result = passwordUtils.validatePassword(noLettersPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('비밀번호에 영문자가 포함되어야 합니다');
    });

    test('should reject password without numbers', () => {
      const noNumbersPassword = 'NoNumbers!@#$';
      const result = passwordUtils.validatePassword(noNumbersPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('비밀번호에 숫자가 포함되어야 합니다');
    });

    test('should reject password without special characters', () => {
      const noSpecialPassword = 'NoSpecial123ABC';
      const result = passwordUtils.validatePassword(noSpecialPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('비밀번호에 특수문자가 포함되어야 합니다');
    });

    test('should reject password with sequential characters', () => {
      const sequentialPasswords = [
        'Password111!',
        'Test@@@123',
        'Valid123aaa!',
        'MyPPPass123!'
      ];

      sequentialPasswords.forEach(password => {
        const result = passwordUtils.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('같은 문자를 3번 이상 연속 사용할 수 없습니다');
      });
    });

    test('should handle null or undefined password', () => {
      const nullResult = passwordUtils.validatePassword(null);
      const undefinedResult = passwordUtils.validatePassword(undefined);
      const emptyResult = passwordUtils.validatePassword('');
      
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.errors).toContain('비밀번호는 필수입니다');
      
      expect(undefinedResult.isValid).toBe(false);
      expect(undefinedResult.errors).toContain('비밀번호는 필수입니다');
      
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors).toContain('비밀번호는 필수입니다');
    });

    test('should return multiple errors for invalid password', () => {
      const badPassword = 'weak'; // 짧고, 숫자없고, 특수문자없음
      const result = passwordUtils.validatePassword(badPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('비밀번호는 최소 8자 이상이어야 합니다');
      expect(result.errors).toContain('비밀번호에 숫자가 포함되어야 합니다');
      expect(result.errors).toContain('비밀번호에 특수문자가 포함되어야 합니다');
    });

    test('should accept various special characters', () => {
      const specialChars = '!@#$%^&*(),.?":{}|<>';
      for (const char of specialChars) {
        const password = `TestPass123${char}`;
        const result = passwordUtils.validatePassword(password);
        expect(result.isValid).toBe(true);
      }
    });

    test('should handle unicode characters', () => {
      const unicodePassword = '한글Password123!';
      const result = passwordUtils.validatePassword(unicodePassword);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('generateTempPassword', () => {
    test('should generate password with correct length', () => {
      const tempPassword = passwordUtils.generateTempPassword();
      expect(tempPassword.length).toBe(8);
    });

    test('should generate valid password according to rules', () => {
      const tempPassword = passwordUtils.generateTempPassword();
      const validation = passwordUtils.validatePassword(tempPassword);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should generate different passwords each time', () => {
      const passwords = new Set();
      for (let i = 0; i < 100; i++) {
        passwords.add(passwordUtils.generateTempPassword());
      }
      
      // 100개 중 최소 95개는 달라야 함 (매우 낮은 확률로 중복 가능)
      expect(passwords.size).toBeGreaterThan(95);
    });

    test('should contain uppercase letter', () => {
      for (let i = 0; i < 10; i++) {
        const tempPassword = passwordUtils.generateTempPassword();
        expect(/[A-Z]/.test(tempPassword)).toBe(true);
      }
    });

    test('should contain lowercase letter', () => {
      for (let i = 0; i < 10; i++) {
        const tempPassword = passwordUtils.generateTempPassword();
        expect(/[a-z]/.test(tempPassword)).toBe(true);
      }
    });

    test('should contain number', () => {
      for (let i = 0; i < 10; i++) {
        const tempPassword = passwordUtils.generateTempPassword();
        expect(/\d/.test(tempPassword)).toBe(true);
      }
    });

    test('should contain special character', () => {
      for (let i = 0; i < 10; i++) {
        const tempPassword = passwordUtils.generateTempPassword();
        expect(/[!@#$%&*]/.test(tempPassword)).toBe(true);
      }
    });

    test('should not contain ambiguous characters', () => {
      // 혼동하기 쉬운 문자들이 없어야 함: I, l, 1, O, 0
      for (let i = 0; i < 20; i++) {
        const tempPassword = passwordUtils.generateTempPassword();
        expect(tempPassword).not.toMatch(/[Il1O0]/);
      }
    });

    test('should be hashable', async () => {
      const tempPassword = passwordUtils.generateTempPassword();
      const hashedPassword = await passwordUtils.hashPassword(tempPassword);
      const isMatch = await passwordUtils.comparePassword(tempPassword, hashedPassword);
      
      expect(isMatch).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle bcrypt errors in hashPassword', async () => {
      // bcrypt.genSalt을 모킹해서 에러를 발생시킴
      const originalGenSalt = bcrypt.genSalt;
      bcrypt.genSalt = jest.fn().mockRejectedValue(new Error('Salt generation failed'));
      
      await expect(passwordUtils.hashPassword('test')).rejects.toThrow('Password hashing failed');
      
      // 원상복구
      bcrypt.genSalt = originalGenSalt;
    });

    test('should handle bcrypt errors in comparePassword', async () => {
      // bcrypt.compare를 모킹해서 에러를 발생시킴
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockRejectedValue(new Error('Comparison failed'));
      
      await expect(passwordUtils.comparePassword('test', 'hash')).rejects.toThrow('Password comparison failed');
      
      // 원상복구
      bcrypt.compare = originalCompare;
    });
  });

  describe('Performance', () => {
    test('should hash password within reasonable time', async () => {
      const password = 'TestPassword123!';
      const startTime = Date.now();
      
      await passwordUtils.hashPassword(password);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 해싱은 보안을 위해 시간이 걸리지만 5초는 넘지 않아야 함
      expect(duration).toBeLessThan(5000);
    });

    test('should compare password within reasonable time', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await passwordUtils.hashPassword(password);
      
      const startTime = Date.now();
      await passwordUtils.comparePassword(password, hashedPassword);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(2000);
    });

    test('should validate password quickly', () => {
      const password = 'TestPassword123!';
      
      const startTime = Date.now();
      passwordUtils.validatePassword(password);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100); // 검증은 매우 빨라야 함
    });

    test('should generate temp password quickly', () => {
      const startTime = Date.now();
      passwordUtils.generateTempPassword();
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100);
    });
  });
});