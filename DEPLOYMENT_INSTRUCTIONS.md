# 🚀 배포 가이드 - Railway & Vercel

## ✅ **현재 상태: 배포 준비 완료**

- ✅ GitHub 업로드 완료: `https://github.com/Leehanjun123/onetime`
- ✅ 빌드 성공: `npm run build` 작동
- ✅ 서버 실행: 포트 5001에서 정상 작동
- ✅ 환경변수 설정: `.env.example` 준비됨

---

## 🚂 **Railway 배포 (권장)**

### **1단계: Railway 준비**
```bash
# Railway CLI 설치 (선택사항)
npm install -g @railway/cli
railway login
```

### **2단계: 웹에서 배포**
1. [Railway 웹사이트](https://railway.app) 접속
2. **"Deploy from GitHub repo"** 선택
3. `Leehanjun123/onetime` 레포지토리 선택
4. 자동으로 배포 시작

### **3단계: 환경변수 설정**
Railway 대시보드에서 다음 환경변수 설정:

```env
NODE_ENV=production
PORT=$PORT
JWT_SECRET=your-super-secret-jwt-key-here
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

### **4단계: 서비스 추가**
- **PostgreSQL**: Railway에서 제공
- **Redis**: Railway에서 제공
- 자동으로 `DATABASE_URL`, `REDIS_URL` 생성됨

### **5단계: 배포 확인**
- 도메인 생성: `*.up.railway.app`  
- Health check: `https://your-app.up.railway.app/health`

---

## ⚡ **Vercel 배포**

### **1단계: Vercel 설정**
```bash
# Vercel CLI 설치 (선택사항)  
npm install -g vercel
vercel login
```

### **2단계: 웹에서 배포**
1. [Vercel 웹사이트](https://vercel.com) 접속
2. **"New Project"** → **"Import Git Repository"**
3. `Leehanjun123/onetime` 선택
4. **Framework Preset**: "Other" 선택

### **3단계: 설정 수정**
```json
// vercel.json 파일 필요 (이미 생성됨)
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ]
}
```

### **4단계: 환경변수 설정**
Vercel 대시보드에서:
```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL=your-postgres-connection-string
REDIS_URL=your-redis-connection-string
```

### **5단계: 외부 데이터베이스 연결**
- **PostgreSQL**: [Supabase](https://supabase.com), [Neon](https://neon.tech)
- **Redis**: [Upstash](https://upstash.com), [Redis Cloud](https://redis.com/cloud)

---

## 📊 **배포 후 확인사항**

### **필수 확인**
```bash
# Health Check
curl https://your-domain.com/health

# 기본 API  
curl https://your-domain.com/api/auth/login -X POST
curl https://your-domain.com/api/jobs
```

### **예상 응답**
```json
// Health check
{
  "status": "OK",
  "timestamp": "2024-09-10T...",
  "version": "2.0.0"
}

// Login endpoint
{
  "message": "Login endpoint - Coming soon"
}
```

---

## 🎯 **추천 배포 방식**

### **🥇 Railway (최고 권장)**
- **장점**: 
  - PostgreSQL/Redis 자동 제공
  - 간단한 설정
  - 자동 HTTPS
  - 실시간 로그
- **비용**: 월 $5 (Hobby Plan)

### **🥈 Vercel (프론트엔드 함께 배포 시)**  
- **장점**:
  - 무료 플랜 제공
  - 빠른 배포
  - 글로벌 CDN
- **단점**: 
  - 서버리스 함수 제한
  - 외부 DB 필요

---

## 🚨 **주의사항**

### **환경변수 보안**
```env
# ❌ 절대 하면 안 되는 것
JWT_SECRET=123456

# ✅ 안전한 설정
JWT_SECRET=gQ2$mK9#vL4@nP8*rT6&wE3!xZ7%yU5^
```

### **데이터베이스 연결**
- Railway: 자동으로 제공되는 `${{Postgres.DATABASE_URL}}` 사용
- Vercel: 외부 서비스 연결 필요

### **포트 설정**
```javascript
// src/index.js에서 이미 설정됨
const PORT = process.env.PORT || 3000;
```

---

## 🎉 **배포 성공 시 다음 단계**

1. **도메인 연결** (선택사항)
2. **모니터링 설정**
3. **로그 확인**
4. **성능 모니터링**

### **Week 2 계획**
- 데이터베이스 스키마 배포
- 실제 CRUD API 구현  
- 사용자 인증 시스템 구축

---

**🚀 배포 준비 완료! Railway 또는 Vercel 중 선택해서 배포하시면 됩니다.**

*가이드 작성일: 2024년 9월 10일*  
*GitHub 레포지토리: https://github.com/Leehanjun123/onetime*