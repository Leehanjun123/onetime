# User Service Dockerfile
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# Prisma CLI 설치
RUN npm install -g prisma

# 애플리케이션 코드 복사
COPY . .

# Prisma 클라이언트 생성
RUN npx prisma generate

# 로그 디렉토리 생성
RUN mkdir -p logs

# 업로드 디렉토리 생성
RUN mkdir -p uploads

# 포트 노출
EXPOSE 3001

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# 애플리케이션 시작
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]