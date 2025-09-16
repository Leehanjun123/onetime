module.exports = {
  // 테스트 환경 설정
  testEnvironment: 'node',
  
  // Test file patterns (focus on JS for now)
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
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
  
  // Coverage target files (focus on working JS files)
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/index.js',
    '!src/config/**',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  
  // Coverage thresholds (realistic targets for current state)
  coverageThreshold: {
    global: {
      branches: 10,    // Start low, increase gradually
      functions: 15,   
      lines: 15,       
      statements: 15   
    },
    // Focus on critical utilities
    './src/utils/': {
      branches: 30,
      functions: 40,
      lines: 40,
      statements: 40
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