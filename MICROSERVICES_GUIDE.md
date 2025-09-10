# 원데이 마이크로서비스 마이그레이션 가이드

## 📋 개요

원데이 플랫폼을 모놀리식 구조에서 마이크로서비스 아키텍처로 전환하는 완전한 가이드입니다.

## 🏗️ 아키텍처 개요

### 서비스 분리 현황

```
기존 모놀리스 → 마이크로서비스
─────────────────────────────────
✅ API Gateway      (포트: 3000)
✅ User Service     (포트: 3001) 
🔄 Job Service      (포트: 3002) - 준비됨
🔄 Payment Service  (포트: 3003) - 준비됨  
🔄 Search Service   (포트: 3004) - 준비됨
🔄 Notification Svc (포트: 3005) - 준비됨
🔄 Chat Service     (포트: 3006) - 준비됨
```

### 데이터베이스 분리

```
기존: 단일 PostgreSQL
─────────────────────
새로운 구조:
├── onetime_users    (User Service)
├── onetime_jobs     (Job Service)  
├── onetime_payments (Payment Service)
├── ElasticSearch    (Search Service)
├── Redis            (캐시 & 세션)
└── MongoDB          (Chat Service)
```

## 🚀 빠른 시작

### 1. 개발 환경 설정

```bash
# 마이크로서비스 디렉토리로 이동
cd microservices

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정 후...

# 개발 환경 배포
./deploy.sh development deploy
```

### 2. 서비스 확인

```bash
# 헬스체크
./deploy.sh development health

# API Gateway: http://localhost:3000
# User Service: http://localhost:3001  
# API 문서: http://localhost:3001/docs
```

### 3. 프로덕션 배포

```bash
# 이미지 빌드 및 푸시
BUILD_IMAGES=true PUSH_IMAGES=true ./deploy.sh production deploy

# Kubernetes 배포 상태 확인
kubectl get pods -n onetime
```

## 📚 각 서비스 상세

### API Gateway (✅ 완료)

**역할**: 모든 클라이언트 요청의 단일 진입점

**주요 기능**:
- 라우팅 및 프록시
- JWT 토큰 검증
- Rate limiting
- CORS 처리
- 서비스 디스커버리

**엔드포인트**:
- `GET /health` - 헬스체크
- `/*` - 각 서비스로 프록시

**기술 스택**: Node.js, Express, http-proxy-middleware

### User Service (✅ 완료)

**역할**: 사용자 관리 및 인증

**주요 기능**:
- 회원가입/로그인
- 사용자 프로필 관리
- JWT 토큰 관리
- 이메일 인증
- 비밀번호 재설정

**API 엔드포인트**:
```
POST /auth/register      - 회원가입
POST /auth/login         - 로그인  
POST /auth/logout        - 로그아웃
POST /auth/refresh       - 토큰 갱신
GET  /users/profile      - 프로필 조회
PUT  /users/profile      - 프로필 수정
```

**데이터베이스**: PostgreSQL (onetime_users)

### Job Service (🔄 준비됨)

**역할**: 일자리 관리 및 매칭

**주요 기능**:
- 일자리 CRUD 
- 지원/매칭 관리
- 카테고리 관리
- 일자리 상태 관리

**API 엔드포인트**:
```
GET    /jobs           - 일자리 목록
POST   /jobs           - 일자리 등록
GET    /jobs/:id       - 일자리 상세
PUT    /jobs/:id       - 일자리 수정  
DELETE /jobs/:id       - 일자리 삭제
POST   /jobs/:id/apply - 일자리 지원
```

**이벤트 발행**:
- `job.created` → Search Service
- `job.updated` → Search Service
- `job.deleted` → Search Service
- `application.submitted` → Notification Service

### Payment Service (🔄 준비됨)

**역할**: 결제 및 정산 관리

**주요 기능**:
- Toss Payments 연동
- 디지털 지갑 관리
- 자동 정산 처리
- 수수료 계산

**API 엔드포인트**:
```
POST /payments/create   - 결제 생성
POST /payments/confirm  - 결제 확인
POST /payments/cancel   - 결제 취소
GET  /payments/wallet   - 지갑 조회
POST /payments/withdraw - 출금 요청
```

**이벤트 발행**:
- `payment.completed` → Job Service
- `settlement.created` → Notification Service

### Search Service (🔄 준비됨)

**역할**: 고급 검색 기능

**주요 기능**:
- ElasticSearch 기반 검색
- 한국어 검색 지원 (Nori)
- 위치 기반 검색
- 자동완성
- 실시간 인덱싱

**API 엔드포인트**:
```
GET  /search/jobs        - 일자리 검색
GET  /search/suggestions - 자동완성
POST /search/reindex     - 재인덱싱
```

**이벤트 구독**:
- `job.created` → 인덱스 추가
- `job.updated` → 인덱스 업데이트
- `job.deleted` → 인덱스 삭제

### Notification Service (🔄 준비됨)

**역할**: 알림 발송 관리

**주요 기능**:
- 실시간 WebSocket 알림
- 이메일 발송
- SMS 발송 (외부 API)
- 푸시 알림 (FCM)

**API 엔드포인트**:
```
GET  /notifications      - 알림 목록
PUT  /notifications/:id/read - 알림 읽음 처리
POST /notifications/send - 알림 발송
```

**이벤트 구독**:
- `application.submitted` → 알림 발송
- `payment.completed` → 알림 발송
- `user.verified` → 환영 이메일

### Chat Service (🔄 준비됨)

**역할**: 실시간 채팅

**주요 기능**:
- WebSocket 기반 실시간 채팅
- 채팅방 관리
- 메시지 저장
- 타이핑 표시기

**API 엔드포인트**:
```
GET     /chat/rooms              - 채팅방 목록
GET     /chat/rooms/:id/messages - 메시지 조회
POST    /chat/rooms/:id/messages - 메시지 전송
WebSocket /chat/socket           - 실시간 연결
```

**데이터베이스**: MongoDB

## 🔄 마이그레이션 단계별 가이드

### Phase 1: 기반 구조 구축 (✅ 완료)

1. **API Gateway 설정**
   - 모든 요청의 진입점 역할
   - 인증 및 라우팅 처리
   - Rate limiting 적용

2. **User Service 분리**
   - 사용자 관리 기능 독립
   - JWT 기반 인증 시스템
   - 이메일 서비스 통합

3. **Docker & K8s 설정**
   - 컨테이너화 환경 구축
   - 오케스트레이션 설정
   - 모니터링 도구 준비

### Phase 2: 핵심 서비스 분리 (🔄 준비 완료)

4. **Job Service 구현**
   ```bash
   # Job Service 개발 및 배포
   cd microservices/job-service
   npm install
   npm run dev
   ```

5. **Payment Service 구현**  
   ```bash
   # Payment Service 개발 및 배포
   cd microservices/payment-service  
   npm install
   npm run dev
   ```

6. **서비스 간 통신 설정**
   - Redis Pub/Sub 이벤트 시스템
   - HTTP 클라이언트 구성
   - 서비스 디스커버리 연동

### Phase 3: 고급 기능 분리 (🔄 준비 완료)

7. **Search Service 구현**
   - ElasticSearch 연동
   - 한국어 검색 최적화
   - 이벤트 기반 인덱싱

8. **Notification Service 구현**
   - 멀티채널 알림 시스템
   - 실시간 WebSocket 연결
   - 이메일/SMS 발송

9. **Chat Service 구현**
   - MongoDB 기반 메시지 저장
   - Socket.IO 실시간 통신
   - 채팅방 관리

### Phase 4: 운영 최적화 (🔄 준비 완료)

10. **모니터링 및 로깅**
    - Prometheus + Grafana
    - ELK Stack 로그 수집
    - 분산 추적 (Jaeger)

11. **보안 강화**
    - mTLS 서비스 간 통신
    - API Key 관리
    - 보안 스캔 자동화

12. **성능 최적화**
    - 캐싱 전략 개선
    - 로드 밸런싱 최적화
    - 데이터베이스 튜닝

## 🛠️ 개발 가이드

### 새 서비스 추가

1. **서비스 디렉토리 생성**
   ```bash
   mkdir microservices/new-service
   cd microservices/new-service
   ```

2. **기본 구조 설정**
   ```bash
   # package.json 생성
   npm init -y
   
   # 기본 의존성 설치
   npm install express winston prisma
   
   # 디렉토리 구조 생성
   mkdir -p src/{controllers,services,routes,middleware,utils}
   ```

3. **Docker 설정**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 3XXX
   CMD ["npm", "start"]
   ```

4. **Kubernetes 설정**
   ```yaml
   # k8s/base/new-service-deployment.yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: new-service
     namespace: onetime
   # ...
   ```

### 서비스 간 통신

1. **HTTP 클라이언트 (동기)**
   ```javascript
   const axios = require('axios');
   
   const userService = {
     baseURL: process.env.USER_SERVICE_URL,
     async getUserById(id) {
       const response = await axios.get(`${this.baseURL}/users/${id}`);
       return response.data;
     }
   };
   ```

2. **이벤트 시스템 (비동기)**
   ```javascript
   const eventPublisher = require('./services/eventPublisher');
   
   // 이벤트 발행
   await eventPublisher.publishEvent('user.created', {
     userId: user.id,
     timestamp: new Date()
   });
   
   // 이벤트 구독
   eventPublisher.subscribe('job.created', async (data) => {
     // 검색 인덱스 업데이트
     await updateSearchIndex(data);
   });
   ```

### 데이터베이스 마이그레이션

1. **기존 데이터 백업**
   ```bash
   pg_dump onetime > backup.sql
   ```

2. **서비스별 DB 생성**
   ```sql
   CREATE DATABASE onetime_users;
   CREATE DATABASE onetime_jobs;
   CREATE DATABASE onetime_payments;
   ```

3. **데이터 이동**
   ```bash
   # 사용자 관련 테이블 이동
   pg_dump -t users -t profiles onetime | psql onetime_users
   
   # 일자리 관련 테이블 이동  
   pg_dump -t jobs -t applications onetime | psql onetime_jobs
   ```

## 🔧 운영 가이드

### 배포

```bash
# 개발 환경
./deploy.sh development deploy

# 프로덕션 환경
./deploy.sh production deploy

# 특정 서비스만 재배포
kubectl rollout restart deployment/user-service -n onetime
```

### 모니터링

```bash
# 서비스 상태 확인
kubectl get pods -n onetime

# 로그 확인
kubectl logs -f deployment/api-gateway -n onetime

# 메트릭 확인 (Grafana)
open http://localhost:3030
```

### 트러블슈팅

1. **서비스 연결 문제**
   ```bash
   # 네트워크 연결 테스트
   kubectl exec -it api-gateway-xxx -n onetime -- curl user-service:3001/health
   ```

2. **데이터베이스 연결 문제**  
   ```bash
   # DB 연결 테스트
   kubectl exec -it postgres-xxx -n onetime -- pg_isready -U postgres
   ```

3. **로드 밸런싱 문제**
   ```bash
   # 서비스 엔드포인트 확인
   kubectl get endpoints -n onetime
   ```

## 📊 성능 및 모니터링

### 주요 메트릭

- **응답 시간**: 각 서비스별 평균 응답 시간
- **에러율**: HTTP 4xx, 5xx 에러 비율  
- **처리량**: 초당 요청 수 (RPS)
- **리소스 사용량**: CPU, 메모리, 디스크 사용률
- **데이터베이스 성능**: 쿼리 응답 시간, 연결 수

### 알람 설정

- API 응답 시간 > 2초
- 에러율 > 5%
- CPU 사용률 > 80%
- 메모리 사용률 > 85%
- 디스크 사용률 > 90%

## 🔐 보안 고려사항

1. **서비스 간 인증**: mTLS 또는 API Key
2. **시크릿 관리**: Kubernetes Secrets 사용
3. **네트워크 정책**: Pod 간 통신 제한
4. **이미지 보안**: 취약점 스캔 자동화
5. **액세스 로그**: 모든 요청 기록 및 모니터링

---

## 📞 지원 및 문의

- **개발 문의**: [GitHub Issues](https://github.com/onetime/backend/issues)
- **운영 문의**: ops@onetime.kr
- **보안 신고**: security@onetime.kr

마이크로서비스 전환으로 원데이 플랫폼의 확장성, 안정성, 개발 효율성이 크게 향상됩니다! 🚀