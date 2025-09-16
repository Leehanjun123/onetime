# OneTime - Simple Job Matching API

간단한 일자리 매칭 플랫폼 API

## 실제 기능

- ✅ 사용자 관리 (생성, 조회)
- ✅ 일자리 관리 (생성, 조회) 
- ✅ SQLite 데이터베이스
- ✅ 기본적인 API 엔드포인트

## 설치 및 실행

```bash
npm install
npm run db:push
npm start
```

## API 엔드포인트

- `GET /health` - 헬스 체크
- `GET /api` - API 정보
- `GET /api/users` - 사용자 목록
- `POST /api/users` - 사용자 생성
- `GET /api/jobs` - 일자리 목록  
- `POST /api/jobs` - 일자리 생성

## 테스트

```bash
npm test
```

## 기술 스택

- Node.js + Express
- SQLite + Prisma
- Jest (테스트)

## 배포

### Railway 배포
1. Railway에 연결
2. PostgreSQL 데이터베이스 추가
3. 환경변수 설정: `DATABASE_URL`
4. 자동 배포

### Docker 배포
```bash
docker build -t onetime-api .
docker run -p 3000:3000 onetime-api
```

## 수준

초급 개발자 포트폴리오 프로젝트 수준

## 배포 문제 해결

- ✅ PostgreSQL 지원
- ✅ 동적 포트 할당
- ✅ DB 연결 실패 시 Mock 모드로 동작
- ✅ 헬스체크 타임아웃 처리