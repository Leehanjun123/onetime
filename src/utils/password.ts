import bcrypt from 'bcryptjs';
import { PasswordValidationResult } from '@/types/services';

const SALT_ROUNDS: number = 12;

/**
 * 비밀번호 해싱
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch {
    throw new Error('Password hashing failed');
  }
};

/**
 * 비밀번호 검증
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch {
    return false;
  }
};

/**
 * 비밀번호 강도 검증
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  if (!password) {
    errors.push('비밀번호는 필수입니다');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다');
  }

  if (password.length > 100) {
    errors.push('비밀번호는 100자를 초과할 수 없습니다');
  }

  // 영문, 숫자, 특수문자 포함 검증
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasLetter) {
    errors.push('비밀번호에 영문자가 포함되어야 합니다');
  }

  if (!hasNumber) {
    errors.push('비밀번호에 숫자가 포함되어야 합니다');
  }

  if (!hasSpecial) {
    errors.push('비밀번호에 특수문자가 포함되어야 합니다');
  }

  // 연속된 문자 검증
  const hasSequential = /(.)\1{2,}/.test(password);
  if (hasSequential) {
    errors.push('같은 문자를 3번 이상 연속 사용할 수 없습니다');
  }

  // 패스워드 강도 점수 계산
  let score = 0;
  if (hasLetter) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;

  return {
    isValid: errors.length === 0,
    errors,
    score
  };
};

/**
 * 임시 비밀번호 생성
 */
export const generateTempPassword = (length: number = 8): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';
  
  // 각 조건을 만족하도록 최소 1개씩 포함
  password += 'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]; // 대문자
  password += 'abcdefghkmnpqrstuvwxyz'[Math.floor(Math.random() * 23)]; // 소문자
  password += '23456789'[Math.floor(Math.random() * 8)]; // 숫자
  password += '!@#$%&*'[Math.floor(Math.random() * 7)]; // 특수문자
  
  // 나머지 자릿수 랜덤 생성
  for (let i = 0; i < length - 4; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // 순서 섞기
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// CommonJS 호환성을 위한 default export
export default {
  hashPassword,
  comparePassword,
  validatePassword,
  generateTempPassword
};