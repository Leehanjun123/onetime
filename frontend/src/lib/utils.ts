import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS 클래스를 병합하는 유틸리티 함수
 * clsx와 tailwind-merge를 결합하여 조건부 클래스와 중복 제거를 동시에 처리
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 숫자에 천 단위 구분자를 추가하는 함수
 * @param num - 포매팅할 숫자
 * @returns 천 단위 구분자가 추가된 문자열
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num);
}

/**
 * 금액을 한국 원화 형식으로 포매팅
 * @param amount - 금액
 * @returns 원화 형식의 문자열
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
}

/**
 * 날짜를 한국어 형식으로 포매팅
 * @param date - 포매팅할 날짜
 * @param options - 포매팅 옵션
 * @returns 포매팅된 날짜 문자열
 */
export function formatDate(
  date: Date | string, 
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ko-KR', options).format(dateObj);
}

/**
 * 상대적 시간을 반환 (예: "3분 전", "2시간 전")
 * @param date - 기준 날짜
 * @returns 상대적 시간 문자열
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
  return `${Math.floor(diffInSeconds / 31536000)}년 전`;
}

/**
 * 디바운스 함수 - 연속된 호출을 방지
 * @param func - 실행할 함수
 * @param wait - 대기 시간 (밀리초)
 * @returns 디바운스된 함수
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 스로틀 함수 - 일정 시간마다 한 번만 실행
 * @param func - 실행할 함수
 * @param limit - 제한 시간 (밀리초)
 * @returns 스로틀된 함수
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 로컬 스토리지에서 안전하게 데이터를 가져오는 함수
 * @param key - 스토리지 키
 * @param defaultValue - 기본값
 * @returns 파싱된 데이터 또는 기본값
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * 로컬 스토리지에 안전하게 데이터를 저장하는 함수
 * @param key - 스토리지 키
 * @param value - 저장할 값
 */
export function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
}

/**
 * 문자열을 슬러그로 변환 (URL에 사용 가능한 형태)
 * @param text - 변환할 문자열
 * @returns 슬러그 문자열
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 특수문자 제거
    .replace(/[\s_-]+/g, '-') // 공백을 하이픈으로
    .replace(/^-+|-+$/g, ''); // 앞뒤 하이픈 제거
}

/**
 * 배열을 청크 단위로 나누는 함수
 * @param array - 나눌 배열
 * @param size - 청크 크기
 * @returns 청크로 나뉜 2차원 배열
 */
export function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
    array.slice(index * size, index * size + size)
  );
}

/**
 * 객체의 키를 snake_case에서 camelCase로 변환
 * @param obj - 변환할 객체
 * @returns camelCase 키를 가진 객체
 */
export function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

/**
 * 객체의 키를 camelCase에서 snake_case로 변환
 * @param obj - 변환할 객체
 * @returns snake_case 키를 가진 객체
 */
export function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

/**
 * 색상이 밝은지 어두운지 판단
 * @param color - HEX 색상 코드
 * @returns 밝으면 true, 어두우면 false
 */
export function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // YIQ 공식을 사용하여 밝기 계산
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128;
}

/**
 * 깊은 객체 복사
 * @param obj - 복사할 객체
 * @returns 깊은 복사된 객체
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * 파일 크기를 읽기 쉬운 형태로 변환
 * @param bytes - 바이트 크기
 * @returns 읽기 쉬운 파일 크기 문자열
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 전화번호 포매팅
 * @param phoneNumber - 전화번호 문자열
 * @returns 포매팅된 전화번호
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  
  return phoneNumber;
}

/**
 * 이메일 주소 유효성 검사
 * @param email - 이메일 주소
 * @returns 유효하면 true, 아니면 false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 랜덤 ID 생성
 * @param length - ID 길이 (기본값: 10)
 * @returns 랜덤 ID 문자열
 */
export function generateId(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}