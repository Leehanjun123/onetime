module.exports = {
  // 테스트 환경 설정
  testEnvironment: 'node',
  
  // TypeScript 지원 설정
  preset: 'ts-jest',
  
  // 테스트 파일 패턴 (JS와 TS 모두 지원)
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.js',
    '**/tests/**/*.spec.ts',
    '**/__tests__/**/*.js',
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).js',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // 커버리지 설정
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'cobertura'
  ],
  
  // 커버리지 대상 파일 (JS와 TS 모두 포함)
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/**/*.spec.{js,ts}',
    '!src/index.{js,ts}',
    '!src/config/**',
    '!src/types/**',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  
  // 커버리지 임계값 설정 (점진적 향상)
  coverageThreshold: {
    global: {
      branches: 20,    // 현실적 시작: 20% → 목표: 80%
      functions: 20,   // 현실적 시작: 20% → 목표: 80%
      lines: 20,       // 현실적 시작: 20% → 목표: 80%
      statements: 20   // 현실적 시작: 20% → 목표: 80%
    },
    // 주요 유틸리티는 높은 커버리지 요구
    './src/utils/': {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // 설정 및 정리 파일
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 테스트 실행 전 환경 변수 설정
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // 모듈 경로 매핑 (올바른 옵션명 사용)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // 테스트 실행 옵션
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  
  // 병렬 실행 설정
  maxWorkers: '50%',
  
  // 타임아웃 설정 (30초)
  testTimeout: 30000,
  
  // 무시할 경로
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/',
    '/build/'
  ],
  
  // 전역 설정
  clearMocks: true,
  restoreMocks: true,
  
  // 에러 출력 설정
  errorOnDeprecated: true
};