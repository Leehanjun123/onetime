const { body, param, query, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');

/**
 * 검증 결과 처리 미들웨어
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed:', {
      url: req.url,
      method: req.method,
      errors: errors.array()
    });
    
    return res.status(400).json({
      message: '입력 데이터가 올바르지 않습니다',
      errors: errors.array()
    });
  }
  next();
};

/**
 * 공통 검증 규칙
 */
const commonValidations = {
  // ID 검증 (UUID)
  id: param('*Id').isUUID().withMessage('올바른 ID 형식이 아닙니다'),
  
  // 페이지네이션 검증
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상의 정수여야 합니다'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('제한은 1-100 사이의 정수여야 합니다')
  ],
  
  // 정렬 검증
  sorting: [
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'title', 'email']).withMessage('지원하지 않는 정렬 필드입니다'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('정렬 순서는 asc 또는 desc여야 합니다')
  ],
  
  // 검색어 검증
  search: query('search').optional().trim().isLength({ max: 200 }).withMessage('검색어는 200자를 초과할 수 없습니다'),
  
  // 날짜 검증
  dateRange: [
    query('startDate').optional().isISO8601().withMessage('시작일은 올바른 날짜 형식이어야 합니다'),
    query('endDate').optional().isISO8601().withMessage('종료일은 올바른 날짜 형식이어야 합니다')
  ]
};

/**
 * 관리자 라우트 검증
 */
const adminValidations = {
  // 대시보드 통계
  dashboard: [
    query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('지원하지 않는 기간입니다'),
    handleValidationErrors
  ],
  
  // 사용자 목록 조회
  users: [
    ...commonValidations.pagination,
    ...commonValidations.sorting,
    commonValidations.search,
    query('userType').optional().isIn(['JOBSEEKER', 'EMPLOYER', 'ADMIN']).withMessage('지원하지 않는 사용자 타입입니다'),
    query('verified').optional().isBoolean().withMessage('인증 상태는 불린 값이어야 합니다'),
    handleValidationErrors
  ],
  
  // 사용자 상세 조회
  userDetail: [
    commonValidations.id,
    handleValidationErrors
  ],
  
  // 사용자 상태 변경
  userStatusUpdate: [
    commonValidations.id,
    body('verified').optional().isBoolean().withMessage('인증 상태는 불린 값이어야 합니다'),
    body('isActive').optional().isBoolean().withMessage('활성 상태는 불린 값이어야 합니다'),
    handleValidationErrors
  ],
  
  // 일자리 목록 조회
  jobs: [
    ...commonValidations.pagination,
    ...commonValidations.sorting,
    commonValidations.search,
    query('status').optional().isIn(['ACTIVE', 'COMPLETED', 'CANCELLED', 'DRAFT']).withMessage('지원하지 않는 상태입니다'),
    query('category').optional().trim().isLength({ max: 50 }).withMessage('카테고리는 50자를 초과할 수 없습니다'),
    query('urgent').optional().isBoolean().withMessage('긴급 여부는 불린 값이어야 합니다'),
    handleValidationErrors
  ],
  
  // 일자리 상태 변경
  jobStatusUpdate: [
    commonValidations.id,
    body('status').isIn(['ACTIVE', 'COMPLETED', 'CANCELLED', 'DRAFT']).withMessage('지원하지 않는 상태입니다'),
    handleValidationErrors
  ],
  
  // 결제 목록 조회
  payments: [
    ...commonValidations.pagination,
    ...commonValidations.sorting,
    ...commonValidations.dateRange,
    query('status').optional().isIn(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']).withMessage('지원하지 않는 결제 상태입니다'),
    handleValidationErrors
  ],
  
  // 정산 목록 조회
  settlements: [
    ...commonValidations.pagination,
    ...commonValidations.sorting,
    query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).withMessage('지원하지 않는 정산 상태입니다'),
    handleValidationErrors
  ],
  
  // 정산 처리
  settlementProcess: [
    commonValidations.id,
    handleValidationErrors
  ],
  
  // 시스템 공지 발송
  broadcastNotification: [
    body('title').trim().notEmpty().isLength({ max: 100 }).withMessage('제목은 1-100자여야 합니다'),
    body('message').trim().notEmpty().isLength({ max: 1000 }).withMessage('메시지는 1-1000자여야 합니다'),
    body('userFilter').optional().isObject().withMessage('사용자 필터는 객체여야 합니다'),
    handleValidationErrors
  ],
  
  // 데이터 내보내기
  export: [
    param('type').isIn(['users', 'jobs', 'payments']).withMessage('지원하지 않는 내보내기 타입입니다'),
    ...commonValidations.dateRange,
    handleValidationErrors
  ]
};

/**
 * 인증 관련 검증
 */
const authValidations = {
  // 회원가입
  register: [
    body('email').isEmail().normalizeEmail().withMessage('올바른 이메일 주소를 입력해주세요'),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).withMessage('비밀번호는 8자 이상이며 대소문자, 숫자, 특수문자를 포함해야 합니다'),
    body('name').trim().notEmpty().isLength({ max: 50 }).withMessage('이름은 1-50자여야 합니다'),
    body('phone').optional().isMobilePhone('ko-KR').withMessage('올바른 전화번호를 입력해주세요'),
    body('userType').isIn(['JOBSEEKER', 'EMPLOYER']).withMessage('지원하지 않는 사용자 타입입니다'),
    handleValidationErrors
  ],
  
  // 로그인
  login: [
    body('email').isEmail().normalizeEmail().withMessage('올바른 이메일 주소를 입력해주세요'),
    body('password').notEmpty().withMessage('비밀번호를 입력해주세요'),
    handleValidationErrors
  ],
  
  // 비밀번호 재설정 요청
  forgotPassword: [
    body('email').isEmail().normalizeEmail().withMessage('올바른 이메일 주소를 입력해주세요'),
    handleValidationErrors
  ],
  
  // 비밀번호 재설정
  resetPassword: [
    body('token').notEmpty().withMessage('토큰이 필요합니다'),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).withMessage('비밀번호는 8자 이상이며 대소문자, 숫자, 특수문자를 포함해야 합니다'),
    handleValidationErrors
  ]
};

/**
 * 일자리 관련 검증
 */
const jobValidations = {
  // 일자리 생성
  create: [
    body('title').trim().notEmpty().isLength({ max: 100 }).withMessage('제목은 1-100자여야 합니다'),
    body('description').trim().notEmpty().isLength({ max: 5000 }).withMessage('설명은 1-5000자여야 합니다'),
    body('category').trim().notEmpty().isLength({ max: 50 }).withMessage('카테고리는 1-50자여야 합니다'),
    body('location').trim().notEmpty().isLength({ max: 100 }).withMessage('위치는 1-100자여야 합니다'),
    body('wage').isNumeric().isFloat({ min: 0 }).withMessage('시급은 0 이상의 숫자여야 합니다'),
    body('startDate').isISO8601().withMessage('시작일은 올바른 날짜 형식이어야 합니다'),
    body('endDate').optional().isISO8601().withMessage('종료일은 올바른 날짜 형식이어야 합니다'),
    body('urgent').optional().isBoolean().withMessage('긴급 여부는 불린 값이어야 합니다'),
    handleValidationErrors
  ],
  
  // 일자리 수정
  update: [
    commonValidations.id,
    body('title').optional().trim().isLength({ max: 100 }).withMessage('제목은 100자를 초과할 수 없습니다'),
    body('description').optional().trim().isLength({ max: 5000 }).withMessage('설명은 5000자를 초과할 수 없습니다'),
    body('category').optional().trim().isLength({ max: 50 }).withMessage('카테고리는 50자를 초과할 수 없습니다'),
    body('location').optional().trim().isLength({ max: 100 }).withMessage('위치는 100자를 초과할 수 없습니다'),
    body('wage').optional().isNumeric().isFloat({ min: 0 }).withMessage('시급은 0 이상의 숫자여야 합니다'),
    body('startDate').optional().isISO8601().withMessage('시작일은 올바른 날짜 형식이어야 합니다'),
    body('endDate').optional().isISO8601().withMessage('종료일은 올바른 날짜 형식이어야 합니다'),
    body('urgent').optional().isBoolean().withMessage('긴급 여부는 불린 값이어야 합니다'),
    handleValidationErrors
  ],
  
  // 일자리 목록 조회
  list: [
    ...commonValidations.pagination,
    ...commonValidations.sorting,
    commonValidations.search,
    query('category').optional().trim().isLength({ max: 50 }).withMessage('카테고리는 50자를 초과할 수 없습니다'),
    query('location').optional().trim().isLength({ max: 100 }).withMessage('위치는 100자를 초과할 수 없습니다'),
    query('minWage').optional().isNumeric().withMessage('최소 시급은 숫자여야 합니다'),
    query('maxWage').optional().isNumeric().withMessage('최대 시급은 숫자여야 합니다'),
    query('urgent').optional().isBoolean().withMessage('긴급 여부는 불린 값이어야 합니다'),
    handleValidationErrors
  ]
};

/**
 * 채팅 관련 검증
 */
const chatValidations = {
  // 채팅방 생성
  createRoom: [
    body('jobId').isUUID().withMessage('올바른 일자리 ID가 필요합니다'),
    body('participantId').isUUID().withMessage('올바른 참가자 ID가 필요합니다'),
    handleValidationErrors
  ],
  
  // 메시지 전송
  sendMessage: [
    commonValidations.id,
    body('message').trim().notEmpty().isLength({ max: 1000 }).withMessage('메시지는 1-1000자여야 합니다'),
    body('type').optional().isIn(['text', 'image', 'file']).withMessage('지원하지 않는 메시지 타입입니다'),
    handleValidationErrors
  ],
  
  // 채팅방 목록 조회
  listRooms: [
    ...commonValidations.pagination,
    query('status').optional().isIn(['active', 'archived']).withMessage('지원하지 않는 상태입니다'),
    handleValidationErrors
  ],
  
  // 채팅 히스토리 조회
  getHistory: [
    commonValidations.id,
    ...commonValidations.pagination,
    handleValidationErrors
  ]
};

/**
 * 사용자 관련 검증
 */
const userValidations = {
  // 프로필 업데이트
  updateProfile: [
    body('name').optional().trim().isLength({ max: 50 }).withMessage('이름은 50자를 초과할 수 없습니다'),
    body('phone').optional().isMobilePhone('ko-KR').withMessage('올바른 전화번호를 입력해주세요'),
    body('bio').optional().trim().isLength({ max: 500 }).withMessage('자기소개는 500자를 초과할 수 없습니다'),
    body('skills').optional().isArray().withMessage('기술은 배열이어야 합니다'),
    body('experience').optional().isNumeric().withMessage('경력은 숫자여야 합니다'),
    handleValidationErrors
  ],
  
  // 비밀번호 변경
  changePassword: [
    body('currentPassword').notEmpty().withMessage('현재 비밀번호를 입력해주세요'),
    body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).withMessage('새 비밀번호는 8자 이상이며 대소문자, 숫자, 특수문자를 포함해야 합니다'),
    handleValidationErrors
  ]
};

/**
 * 알림 관련 검증
 */
const notificationValidations = {
  // 알림 목록 조회
  list: [
    ...commonValidations.pagination,
    query('read').optional().isBoolean().withMessage('읽음 상태는 불린 값이어야 합니다'),
    query('type').optional().isIn(['job_match', 'application', 'message', 'system']).withMessage('지원하지 않는 알림 타입입니다'),
    handleValidationErrors
  ],
  
  // 알림 읽음 처리
  markAsRead: [
    body('notificationIds').isArray({ min: 1 }).withMessage('알림 ID 배열이 필요합니다'),
    body('notificationIds.*').isUUID().withMessage('올바른 알림 ID가 필요합니다'),
    handleValidationErrors
  ]
};

/**
 * 지원서 관련 검증
 */
const applicationValidations = {
  // 지원서 제출
  create: [
    body('jobId').isUUID().withMessage('올바른 일자리 ID가 필요합니다'),
    body('coverLetter').optional().trim().isLength({ max: 2000 }).withMessage('자기소개서는 2000자를 초과할 수 없습니다'),
    handleValidationErrors
  ],
  
  // 지원서 목록 조회
  list: [
    ...commonValidations.pagination,
    ...commonValidations.sorting,
    query('status').optional().isIn(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED']).withMessage('지원하지 않는 지원 상태입니다'),
    query('jobId').optional().isUUID().withMessage('올바른 일자리 ID가 필요합니다'),
    handleValidationErrors
  ],
  
  // 지원서 상태 변경
  updateStatus: [
    commonValidations.id,
    body('status').isIn(['ACCEPTED', 'REJECTED']).withMessage('승인 또는 거절만 가능합니다'),
    body('message').optional().trim().isLength({ max: 500 }).withMessage('메시지는 500자를 초과할 수 없습니다'),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  commonValidations,
  adminValidations,
  authValidations,
  jobValidations,
  chatValidations,
  userValidations,
  notificationValidations,
  applicationValidations
};