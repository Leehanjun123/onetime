# 원데이 (OneTime) - 일자리 매칭 플랫폼

> 단순하고 효율적인 일자리 매칭 서비스

## 🚀 현재 상태

✅ **빌드 성공** - TypeScript 컴파일 완료  
✅ **서버 실행** - Express 서버 정상 작동  
✅ **기본 API** - Health check 및 기본 엔드포인트 구현  
✅ **배포 준비** - Railway/Vercel 배포 가능  

**현재 점수**: 5.0/10 (안정적 기본 플랫폼)

## 🛠️ 기술 스택

- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Prisma
- **Cache**: Redis
- **Auth**: JWT
- **Deployment**: Railway/Vercel

## 📦 설치 및 실행

```bash
# 설치
npm install

# 환경변수 설정
cp .env.example .env

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 서버 시작
npm start
```

## 🌐 API 엔드포인트

### Health Check
```
GET /health
Response: {"status":"OK","timestamp":"2025-09-10T18:40:25.717Z","version":"2.0.0"}
```

### 인증
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
```

### 작업 관리
```
GET /api/jobs
POST /api/jobs
GET /api/jobs/:id
```

### 사용자
```
GET /api/users/profile
PUT /api/users/profile
```

## 🌍 배포

### Railway 배포
1. Railway 계정 연결
2. GitHub 레포지토리 선택
3. 환경변수 설정
4. 자동 배포

### Vercel 배포
1. Vercel 계정 연결  
2. GitHub 레포지토리 선택
3. 환경변수 설정
4. 자동 배포

## 📝 환경변수

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key
PORT=3000
NODE_ENV=production
```

## 📊 로드맵

- [x] **Phase 1**: 기본 서버 구축 (완료)
- [ ] **Phase 2**: 데이터베이스 연결 및 CRUD
- [ ] **Phase 3**: 인증 시스템 구현
- [ ] **Phase 4**: 작업 매칭 시스템
- [ ] **Phase 5**: 결제 연동

## 🎯 목표

6개월 내 **7.5/10점** 달성하여 실제 사용 가능한 플랫폼 완성

---

**License**: MIT  
**Author**: Leehanjun123  
**Repository**: https://github.com/Leehanjun123/onetime