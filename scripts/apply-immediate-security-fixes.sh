#!/bin/bash
# OneTime 플랫폼 즉시 보안 수정 스크립트
# 생성일: 2025-09-10T16:51:39.942Z

set -e

echo "🔒 OneTime 플랫폼 보안 수정 시작..."

# 1. 보안 의존성 설치
echo "📦 보안 의존성 설치..."
npm install helmet express-rate-limit cors bcryptjs joi express-validator

# 2. 환경변수 보안 강화
echo "🔑 환경변수 보안 설정..."
if [ ! -f .env.example ]; then
  cat > .env.example << EOF
# 환경변수 템플릿 (실제 값은 Kubernetes Secret에서 관리)
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-chars
DATABASE_URL=postgresql://username:password@localhost:5432/onetime
REDIS_URL=redis://localhost:6379
TOSS_CLIENT_KEY=your-toss-client-key
TOSS_SECRET_KEY=your-toss-secret-key
NODE_ENV=production
EOF
fi

# 3. JWT 시크릿 강화 (32자 이상)
echo "🔐 JWT 시크릿 강화..."
NEW_JWT_SECRET=$(openssl rand -base64 32)
if grep -q "JWT_SECRET=" .env; then
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" .env
else
  echo "JWT_SECRET=$NEW_JWT_SECRET" >> .env
fi

# 4. 보안 미들웨어 적용
echo "🛡️ 보안 미들웨어 적용..."
# 이 부분은 수동으로 코드 수정 필요

# 5. 컨테이너 보안 설정
echo "🐳 컨테이너 보안 설정..."
if [ -f Dockerfile ]; then
  if ! grep -q "USER " Dockerfile; then
    echo "RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001" >> Dockerfile.tmp
    echo "USER nodejs" >> Dockerfile.tmp
    cat Dockerfile >> Dockerfile.tmp
    mv Dockerfile.tmp Dockerfile
  fi
fi

echo "✅ 즉시 보안 수정 완료!"
echo "⚠️  추가 수동 수정이 필요한 항목들은 위의 리포트를 확인하세요."
