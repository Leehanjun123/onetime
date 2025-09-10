/**
 * Jest 테스트 설정 및 전역 설정
 * 모든 테스트 실행 전에 자동으로 로드됩니다.
 */

// 환경 변수 설정
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32chars';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

// 전역 테스트 설정
global.testTimeout = 30000;
jest.setTimeout(30000);

// 테스트 유틸리티 함수들
global.testUtils = {
  // 테스트용 사용자 데이터 생성
  createTestUser: (overrides = {}) => ({
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    password: 'TestPassword123!',
    userType: 'JOBSEEKER',
    verified: true,
    isActive: true,
    ...overrides
  }),

  // 테스트용 일자리 데이터 생성
  createTestJob: (userId, overrides = {}) => ({
    title: 'Test Job',
    description: 'This is a test job description',
    category: 'TEST',
    location: '서울특별시 강남구',
    wage: 15000,
    workDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 내일
    startTime: '09:00',
    endTime: '18:00',
    maxApplicants: 5,
    status: 'ACTIVE',
    employerId: userId,
    ...overrides
  }),

  // 테스트용 JWT 토큰 생성
  generateTestToken: (payload = {}) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        userId: 'test-user-id',
        email: 'test@example.com',
        userType: 'JOBSEEKER',
        ...payload
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },

  // 테스트용 API 요청 헬퍼
  createAuthenticatedRequest: (request, token = null) => {
    const authToken = token || global.testUtils.generateTestToken();
    return request.set('Authorization', `Bearer ${authToken}`);
  },

  // 시간 지연 유틸리티 (비동기 작업 테스트용)
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // 테스트용 무작위 문자열 생성
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  }
};

// 에러 핸들링
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 콘솔 모킹 (테스트 출력 정리)
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn()
  };
}

console.log('🧪 Test environment initialized successfully');