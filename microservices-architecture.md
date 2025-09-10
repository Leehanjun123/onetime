# 원데이 마이크로서비스 아키텍처 설계

## 📋 현재 모놀리식 구조 분석

### 기존 구조의 문제점
- 단일 코드베이스로 인한 배포 의존성
- 특정 기능 장애 시 전체 서비스 영향
- 팀별 독립 개발의 어려움
- 기술 스택 선택의 제약
- 스케일링의 비효율성

## 🏗️ 마이크로서비스 분리 전략

### 도메인 주도 설계 (DDD) 기반 서비스 분리

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                               │
│                  (Authentication, Rate Limiting)            │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼─────────┐  ┌───────▼─────────┐  ┌───────▼─────────┐
│   User Service  │  │   Job Service   │  │ Payment Service │
│                 │  │                 │  │                 │
│ - 사용자 관리    │  │ - 일자리 CRUD   │  │ - 결제 처리     │
│ - 인증/권한     │  │ - 지원/매칭     │  │ - 정산 관리     │
│ - 프로필 관리   │  │ - 카테고리 관리  │  │ - 지갑 관리     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        │                     │                     │
┌───────▼─────────┐  ┌───────▼─────────┐  ┌───────▼─────────┐
│ Search Service  │  │Notification Svc │  │  Chat Service   │
│                 │  │                 │  │                 │
│ - ElasticSearch │  │ - 실시간 알림    │  │ - 실시간 채팅   │
│ - 검색 인덱싱   │  │ - 이메일/SMS    │  │ - 메시지 관리   │
│ - 자동완성      │  │ - 푸시 알림     │  │ - 채팅방 관리   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## 🔧 각 서비스 상세 설계

### 1. API Gateway (포트: 3000)
**역할**: 모든 클라이언트 요청의 진입점
```javascript
// 주요 기능
- 라우팅 및 로드 밸런싱
- 인증 토큰 검증
- Rate limiting
- CORS 처리
- 요청/응답 로깅
- 서비스 디스커버리
```

### 2. User Service (포트: 3001)
**데이터베이스**: PostgreSQL (users, profiles, auth_tokens)
```javascript
// API 엔드포인트
POST   /users/register
POST   /users/login  
GET    /users/profile
PUT    /users/profile
DELETE /users/account
POST   /users/verify-email
POST   /users/reset-password

// 이벤트 발행
- UserCreated
- UserUpdated
- UserDeleted
- UserVerified
```

### 3. Job Service (포트: 3002)  
**데이터베이스**: PostgreSQL (jobs, applications, categories)
```javascript
// API 엔드포인트
GET    /jobs
POST   /jobs
GET    /jobs/:id
PUT    /jobs/:id
DELETE /jobs/:id
POST   /jobs/:id/apply
GET    /jobs/:id/applications

// 이벤트 발행/구독
- JobCreated → Search Service
- JobUpdated → Search Service  
- JobDeleted → Search Service
- ApplicationSubmitted → Notification Service
```

### 4. Payment Service (포트: 3003)
**데이터베이스**: PostgreSQL (payments, settlements, wallets, transactions)
```javascript
// API 엔드포인트
POST   /payments/create
POST   /payments/confirm
POST   /payments/cancel
GET    /payments/history
GET    /payments/wallet
POST   /payments/withdraw

// 이벤트 발행/구독
- PaymentCompleted → Job Service
- SettlementCreated → Notification Service
- WithdrawalRequested → Notification Service
```

### 5. Search Service (포트: 3004)
**데이터베이스**: ElasticSearch
```javascript
// API 엔드포인트
GET    /search/jobs
GET    /search/suggestions
GET    /search/popular-keywords
POST   /search/reindex

// 이벤트 구독
- JobCreated → 인덱스 업데이트
- JobUpdated → 인덱스 업데이트
- JobDeleted → 인덱스 삭제
```

### 6. Notification Service (포트: 3005)
**데이터베이스**: Redis + MongoDB
```javascript
// API 엔드포인트
GET    /notifications
PUT    /notifications/:id/read
POST   /notifications/send

// 이벤트 구독
- ApplicationSubmitted → 알림 발송
- PaymentCompleted → 알림 발송
- JobMatched → 알림 발송

// 알림 채널
- 실시간 WebSocket
- 이메일 (SMTP)
- SMS (외부 API)
- 푸시 알림 (FCM)
```

### 7. Chat Service (포트: 3006)
**데이터베이스**: MongoDB
```javascript
// API 엔드포인트 + WebSocket
GET    /chat/rooms
GET    /chat/rooms/:id/messages
POST   /chat/rooms/:id/messages
WebSocket /chat/socket

// 실시간 이벤트
- message_sent
- user_joined
- user_left
- typing_indicator
```

## 📡 서비스 간 통신

### 1. 동기 통신 (HTTP/REST)
```javascript
// 서비스 간 직접 API 호출
User Service → Job Service (사용자 검증)
Payment Service → Job Service (결제 상태 업데이트)  
API Gateway → All Services (프록시)
```

### 2. 비동기 통신 (Event-Driven)
```javascript
// Redis Pub/Sub 또는 RabbitMQ 사용
Job Service → Search Service (인덱싱)
Payment Service → Notification Service (알림)
User Service → Notification Service (회원가입 환영)
```

### 3. 서비스 디스커버리
```javascript
// Consul 또는 etcd 사용
const serviceRegistry = {
  'user-service': ['http://localhost:3001'],
  'job-service': ['http://localhost:3002'],
  'payment-service': ['http://localhost:3003'],
  // ...
}
```

## 📊 데이터 관리 전략

### Database per Service 패턴
```javascript
// 각 서비스별 전용 데이터베이스
User Service     → PostgreSQL (users DB)
Job Service      → PostgreSQL (jobs DB)  
Payment Service  → PostgreSQL (payments DB)
Search Service   → ElasticSearch
Notification Svc → Redis + MongoDB
Chat Service     → MongoDB
```

### 데이터 일관성 관리
```javascript
// Saga 패턴으로 분산 트랜잭션 관리
JobApplication Saga:
1. Job Service: 지원 접수
2. User Service: 사용자 확인  
3. Notification Service: 알림 발송
4. 실패 시: 보상 트랜잭션 실행
```

## 🔒 보안 설계

### JWT 기반 인증
```javascript
// API Gateway에서 토큰 검증 후 서비스 정보 전달
Authorization: Bearer <jwt_token>
X-User-ID: user_123
X-User-Role: WORKER
```

### 서비스 간 인증
```javascript
// 내부 서비스 간 API Key 또는 mTLS 사용
X-API-Key: service_internal_key
X-Service-Name: job-service
```

## 📈 모니터링 및 로깅

### 분산 추적 (Distributed Tracing)
```javascript
// Jaeger 또는 Zipkin 사용
Request ID를 통한 전체 요청 추적
서비스별 성능 및 에러 모니터링
```

### 중앙집중식 로깅
```javascript
// ELK Stack (Elasticsearch, Logstash, Kibana)
모든 서비스 로그 수집 및 분석
구조화된 로그 포맷 사용
```

### 헬스체크 및 메트릭
```javascript
// Prometheus + Grafana
각 서비스별 /health 엔드포인트
비즈니스 메트릭 수집 (매칭률, 결제 성공률 등)
```

## 🚀 배포 전략

### 컨테이너화 (Docker)
```dockerfile
# 각 서비스별 Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### 오케스트레이션 (Kubernetes)
```yaml
# 각 서비스별 Deployment, Service, Ingress
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
```

## 📋 마이그레이션 계획

### Phase 1: 기반 구조 구축
1. API Gateway 구현
2. 서비스 디스커버리 설정
3. 공통 라이브러리 개발

### Phase 2: 핵심 서비스 분리  
1. User Service 분리
2. Job Service 분리
3. 서비스 간 통신 구현

### Phase 3: 고급 서비스 분리
1. Payment Service 분리
2. Search Service 분리  
3. Notification Service 분리

### Phase 4: 실시간 서비스
1. Chat Service 분리
2. WebSocket Gateway 구현
3. 이벤트 스트리밍 최적화

---

이제 실제 구현을 시작하겠습니다. 먼저 API Gateway부터 구축하겠습니다!