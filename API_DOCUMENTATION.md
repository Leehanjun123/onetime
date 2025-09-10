# 원데이 (OneDay) API Documentation

## Overview
원데이는 한국의 단기 일자리 매칭 플랫폼을 위한 백엔드 API입니다. 이 문서는 모든 API 엔드포인트와 사용 방법을 설명합니다.

## Base URLs
- **Development**: `http://localhost:5000/api`
- **Production**: `https://onetime-production.up.railway.app/api`

## Authentication
Bearer Token을 사용하여 인증합니다.
```
Authorization: Bearer <JWT_TOKEN>
```

## API Documentation Access
Swagger UI를 통한 실시간 API 문서는 다음 URL에서 확인할 수 있습니다:
- Development: `http://localhost:5000/api/docs`
- Production: `https://onetime-production.up.railway.app/api/docs`

## Main API Categories

### 1. Authentication (`/auth`)
- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인
- `POST /auth/refresh` - 토큰 갱신
- `POST /auth/logout` - 로그아웃
- `POST /auth/forgot-password` - 비밀번호 재설정
- `GET /auth/verify-email/:token` - 이메일 인증

### 2. Users (`/users`)
- `GET /users/profile` - 프로필 조회
- `PUT /users/profile` - 프로필 수정
- `GET /users/:id` - 사용자 정보 조회
- `POST /users/upload-avatar` - 아바타 업로드
- `DELETE /users/account` - 계정 탈퇴

### 3. Jobs (`/jobs`)
- `GET /jobs` - 일자리 목록 조회
- `GET /jobs/:id` - 일자리 상세 조회
- `POST /jobs` - 일자리 등록 (고용주만)
- `PUT /jobs/:id` - 일자리 수정 (고용주만)
- `DELETE /jobs/:id` - 일자리 삭제 (고용주만)
- `POST /jobs/:id/apply` - 일자리 지원 (근로자만)
- `GET /jobs/:id/applications` - 지원자 목록 조회

### 4. Search (`/search`)
**ElasticSearch 기반 고급 검색**
- `GET /search/jobs` - 일자리 검색 (필터링, 정렬, 위치 기반)
- `GET /search/jobs/suggest` - 자동완성 검색
- `GET /search/users` - 사용자 검색 (관리자만)
- `GET /search/stats` - 검색 통계 (관리자만)
- `POST /search/reindex` - 전체 재인덱싱 (관리자만)
- `GET /search/popular-keywords` - 인기 검색어
- `GET /search/filter-options` - 검색 필터 옵션

### 5. Payments (`/payments`)
**Toss Payments 연동**
- `POST /payments/create` - 결제 생성
- `POST /payments/confirm` - 결제 확인
- `POST /payments/cancel` - 결제 취소
- `GET /payments/history` - 결제 내역
- `GET /payments/wallet` - 지갑 조회
- `POST /payments/wallet/withdraw` - 출금 요청

### 6. Settlements (`/settlements`)
**자동 정산 시스템**
- `GET /settlements` - 정산 내역 조회
- `GET /settlements/:id` - 정산 상세 조회
- `POST /settlements/manual` - 수동 정산 (관리자만)

### 7. Notifications (`/notifications`)
- `GET /notifications` - 알림 목록
- `PUT /notifications/:id/read` - 알림 읽음 처리
- `POST /notifications/test` - 테스트 알림 발송

### 8. Chat (`/chat`)
**실시간 채팅 (Socket.IO)**
- `GET /chat/rooms` - 채팅방 목록
- `GET /chat/rooms/:id/messages` - 채팅 메시지 조회
- `POST /chat/rooms/:id/messages` - 메시지 전송

### 9. Admin (`/admin`)
**관리자 전용 API**
- `GET /admin/dashboard` - 대시보드 데이터
- `GET /admin/users` - 사용자 관리
- `GET /admin/jobs` - 일자리 관리
- `GET /admin/payments` - 결제 관리
- `GET /admin/analytics` - 분석 데이터

## Key Features Implemented

### 🔍 Advanced Search (ElasticSearch)
- **Korean Language Support**: Nori tokenizer 사용
- **Geo-location Search**: 위치 기반 검색 및 거리 계산
- **Real-time Indexing**: 데이터 변경 시 자동 인덱싱
- **Advanced Filtering**: 카테고리, 위치, 급여, 날짜 등 다양한 필터
- **Auto-complete**: 실시간 검색 제안

### 💳 Payment System (Toss Payments)
- **Payment Gateway Integration**: Toss Payments API 연동
- **Digital Wallet**: 사용자별 지갑 및 잔액 관리
- **Automatic Fee Calculation**: 플랫폼 수수료 자동 계산 (5%)
- **Settlement Automation**: 완료된 작업에 대한 자동 정산

### 🏗️ System Architecture
- **Service Layer Pattern**: 비즈니스 로직 분리
- **Comprehensive Validation**: Express-validator 사용한 입력 검증
- **Security Middleware**: Rate limiting, CORS, XSS 방어
- **Real-time Features**: Socket.IO 기반 실시간 알림 및 채팅
- **Monitoring**: Sentry 연동 및 성능 모니터링

## API Request Examples

### Job Search with Filters
```javascript
GET /search/jobs?q=카페&category=DELIVERY&location=서울&minWage=15000&sortBy=wage_desc&page=1&limit=20

Response:
{
  "success": true,
  "message": "일자리 검색이 완료되었습니다",
  "data": {
    "jobs": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "totalPages": 8
    },
    "meta": {
      "maxScore": 2.4,
      "took": 12
    }
  }
}
```

### Payment Creation
```javascript
POST /payments/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "jobId": "job_123",
  "workerId": "worker_456",
  "amount": 50000,
  "orderName": "카페 알바 결제",
  "customerName": "홍길동",
  "customerEmail": "customer@example.com"
}

Response:
{
  "success": true,
  "message": "결제가 성공적으로 생성되었습니다",
  "data": {
    "payment": {...},
    "checkoutUrl": "https://checkout.tosspayments.com/..."
  }
}
```

### Real-time Search Suggestions
```javascript
GET /search/jobs/suggest?q=카&limit=5

Response:
{
  "success": true,
  "message": "자동완성 검색이 완료되었습니다",
  "data": {
    "suggestions": [
      {
        "id": "job_789",
        "title": "카페 바리스타",
        "location": "서울 강남구",
        "wage": 18000,
        "score": 1.8
      }
    ],
    "query": "카"
  }
}
```

## Error Handling
모든 API는 표준화된 에러 응답을 반환합니다:

```javascript
{
  "success": false,
  "message": "에러 메시지",
  "errors": [
    {
      "field": "email",
      "message": "유효한 이메일 주소를 입력해주세요"
    }
  ]
}
```

## Status Codes
- `200` - 성공
- `201` - 생성됨
- `400` - 잘못된 요청
- `401` - 인증 필요
- `403` - 권한 없음
- `404` - 리소스 없음
- `422` - 검증 실패
- `500` - 서버 에러

## Rate Limiting
API 호출 제한이 적용됩니다:
- **일반 API**: 100 requests/15분
- **인증 API**: 10 requests/15분
- **업로드 API**: 20 requests/15분
- **결제 API**: 50 requests/15분

## WebSocket Events (Socket.IO)
실시간 기능을 위한 WebSocket 이벤트:

### Client -> Server
- `join_room` - 채팅방 입장
- `send_message` - 메시지 전송
- `typing_start` - 타이핑 시작
- `typing_stop` - 타이핑 종료

### Server -> Client
- `new_message` - 새 메시지
- `user_joined` - 사용자 입장
- `user_left` - 사용자 퇴장
- `notification` - 실시간 알림
- `typing_indicator` - 타이핑 표시

## Environment Variables
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/onetime

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# ElasticSearch
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password

# Toss Payments
TOSS_PAYMENTS_SECRET_KEY=test_sk_xxx
TOSS_PAYMENTS_CLIENT_KEY=test_ck_xxx

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 📚 추가 문서
- Swagger UI: `/api/docs` 
- Postman Collection: 요청 시 제공
- GraphQL Playground (미래 계획): `/graphql`

이 문서는 지속적으로 업데이트되며, 최신 정보는 Swagger UI에서 확인하실 수 있습니다.