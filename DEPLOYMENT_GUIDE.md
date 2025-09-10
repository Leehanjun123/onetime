# 🚀 원데이 마이크로서비스 배포 가이드

## 📋 개요
이 가이드는 원데이 플랫폼의 엔터프라이즈 마이크로서비스 아키텍처를 프로덕션 환경에 배포하는 방법을 설명합니다.

---

## ⚙️ 시스템 요구사항

### 최소 하드웨어 사양
```
CPU: 4 코어 이상
RAM: 16GB 이상  
Storage: 100GB SSD 이상
Network: 1Gbps 이상
```

### 권장 하드웨어 사양
```
CPU: 8 코어 이상
RAM: 32GB 이상
Storage: 500GB NVMe SSD 이상  
Network: 10Gbps 이상
```

### 소프트웨어 요구사항
```
- Docker 24.0+
- Docker Compose 2.20+
- Node.js 18.0+ (개발 시)
- PostgreSQL 16+ (외부 DB 사용 시)
- Redis 7.0+ (외부 Redis 사용 시)
- Consul 1.17+ (외부 서비스 디스커버리 사용 시)
```

---

## 🔧 환경 설정

### 1. 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# 필수 환경 변수 설정
nano .env
```

```env
# 데이터베이스
DATABASE_URL=postgresql://onetime:secure_password@postgres:5432/onetime
POSTGRES_USER=onetime
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=onetime

# Redis
REDIS_URL=redis://redis:6379

# JWT 및 암호화
JWT_SECRET=your_super_secret_jwt_key_here
ENCRYPTION_MASTER_KEY=your_32_character_encryption_key

# 서비스 디스커버리
CONSUL_HOST=consul
CONSUL_PORT=8500

# 외부 서비스
TOSS_SECRET_KEY=your_toss_secret_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# 모니터링
GRAFANA_PASSWORD=admin
SENTRY_DSN=your_sentry_dsn

# 환경 설정
NODE_ENV=production
ENABLE_SERVICE_DISCOVERY=true
ENABLE_EVENT_BUS=true
ENABLE_HEALTH_CHECKS=true
ENABLE_METRICS=true
```

### 2. SSL/TLS 인증서 설정
```bash
# Let's Encrypt 인증서 (권장)
certbot --nginx -d yourdomain.com -d api.yourdomain.com

# 또는 자체 서명 인증서 (개발용)
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private.key -out ssl/certificate.crt
```

---

## 🐳 Docker 배포

### 1. 기본 서비스 배포
```bash
# 이미지 빌드
npm run docker:build

# 기본 서비스 시작 (API Gateway + Core Services)
npm run docker:up

# 로그 확인
npm run docker:logs
```

### 2. 전체 스택 배포 (모든 서비스 포함)
```bash
# 전체 마이크로서비스 스택 시작
npm run full-stack:start

# 상태 확인
docker-compose -f docker-compose.microservices.yml ps
```

### 3. 프로덕션 배포 (로드밸런서 포함)
```bash
# 프로덕션 환경 시작
npm run production:start

# HAProxy 상태 확인
curl http://localhost:8404/stats
```

### 4. 모니터링 스택 배포
```bash
# Prometheus + Grafana 시작
npm run monitoring:start

# Grafana 접속: http://localhost:3001 (admin/admin)
```

---

## 🌐 수동 배포 (서버별)

### 1. 데이터베이스 서버 설정
```bash
# PostgreSQL 설치 및 설정
sudo apt update
sudo apt install postgresql-16 postgresql-contrib

# 데이터베이스 생성
sudo -u postgres createdb onetime
sudo -u postgres createuser --interactive onetime

# 마이그레이션 실행
npm run db:setup
```

### 2. Redis 서버 설정
```bash
# Redis 설치
sudo apt install redis-server

# Redis 설정
sudo nano /etc/redis/redis.conf
# bind 127.0.0.1 → bind 0.0.0.0
# requirepass your_redis_password

sudo systemctl restart redis-server
```

### 3. 애플리케이션 서버 설정
```bash
# Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 설치 (프로세스 매니저)
sudo npm install -g pm2

# 애플리케이션 배포
git clone https://github.com/your-org/onetime-backend.git
cd onetime-backend
npm install
npm run build

# 서비스 시작
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Nginx 리버스 프록시 설정
```bash
# Nginx 설치
sudo apt install nginx

# 설정 파일 생성
sudo nano /etc/nginx/sites-available/onetime
```

```nginx
upstream api_gateway {
    server localhost:3000;
}

upstream user_service {
    server localhost:3001;
}

upstream job_service {
    server localhost:3002;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # API Gateway로 프록시
    location / {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check
    location /health {
        proxy_pass http://api_gateway/health;
    }

    # Direct service access (optional)
    location /api/users {
        proxy_pass http://user_service;
    }

    location /api/jobs {
        proxy_pass http://job_service;
    }
}
```

```bash
# 설정 활성화
sudo ln -s /etc/nginx/sites-available/onetime /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📊 모니터링 설정

### 1. 로그 수집 설정
```bash
# Fluentd 설치 (로그 수집)
curl -L https://toolbelt.treasuredata.com/sh/install-ubuntu-focal-td-agent4.sh | sh

# 설정 파일
sudo nano /etc/td-agent/td-agent.conf
```

### 2. 메트릭 수집 설정
```bash
# Node Exporter 설치 (시스템 메트릭)
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz
sudo cp node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/

# 서비스 등록
sudo nano /etc/systemd/system/node_exporter.service
```

### 3. 알림 설정
```bash
# Alertmanager 설정
nano monitoring/alertmanager.yml
```

```yaml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@yourdomain.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    email_configs:
      - to: 'admin@yourdomain.com'
        subject: 'OneTime Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
```

---

## 🔒 보안 설정

### 1. 방화벽 설정
```bash
# UFW 방화벽 설정
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # API Gateway (내부)
sudo ufw deny 5432/tcp   # PostgreSQL (외부 접근 차단)
sudo ufw deny 6379/tcp   # Redis (외부 접근 차단)
```

### 2. SSL/TLS 보안 강화
```nginx
# Nginx SSL 설정 강화
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# HSTS 헤더
add_header Strict-Transport-Security "max-age=63072000" always;
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

### 3. 데이터베이스 보안
```sql
-- PostgreSQL 보안 설정
ALTER USER onetime WITH PASSWORD 'very_secure_password';
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO onetime;

-- SSL 연결 강제
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/server.crt';
ALTER SYSTEM SET ssl_key_file = '/path/to/server.key';
```

---

## 🚀 성능 최적화

### 1. 데이터베이스 최적화
```sql
-- PostgreSQL 성능 튜닝
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

SELECT pg_reload_conf();
```

### 2. Redis 최적화
```bash
# Redis 메모리 최적화
redis-cli CONFIG SET maxmemory 512mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli CONFIG SET save "900 1 300 10 60 10000"
```

### 3. Node.js 최적화
```bash
# PM2 클러스터 모드
pm2 start ecosystem.config.js --env production

# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'onetime-api',
    script: 'src/microservices/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

---

## 📋 운영 체크리스트

### 배포 전 확인사항
- [ ] 환경 변수 모든 값 설정 완료
- [ ] 데이터베이스 마이그레이션 완료
- [ ] SSL 인증서 설치 및 검증
- [ ] 방화벽 규칙 설정 완료
- [ ] 모니터링 대시보드 설정 완료
- [ ] 백업 시스템 구축 완료
- [ ] 로그 로테이션 설정 완료

### 배포 후 확인사항
- [ ] 모든 서비스 정상 시작 확인
- [ ] 헬스체크 엔드포인트 정상 응답
- [ ] API 문서 접근 가능
- [ ] 데이터베이스 연결 정상
- [ ] Redis 연결 정상
- [ ] 로그 정상 생성
- [ ] 메트릭 수집 정상
- [ ] SSL 인증서 정상 작동

### 일일 운영 체크리스트
- [ ] 서비스 상태 확인
- [ ] 리소스 사용량 모니터링
- [ ] 에러 로그 확인
- [ ] 성능 메트릭 검토
- [ ] 보안 알림 확인
- [ ] 백업 상태 확인

---

## 🆘 트러블슈팅

### 일반적인 문제들

#### 서비스 시작 실패
```bash
# 로그 확인
docker-compose -f docker-compose.microservices.yml logs [service-name]

# 컨테이너 상태 확인
docker ps -a

# 리소스 사용량 확인
docker stats
```

#### 데이터베이스 연결 실패
```bash
# PostgreSQL 연결 테스트
psql -h localhost -U onetime -d onetime -c "SELECT 1;"

# 연결 풀 상태 확인
docker exec -it onetime-postgres psql -U onetime -c "SELECT * FROM pg_stat_activity;"
```

#### Redis 연결 실패
```bash
# Redis 연결 테스트
redis-cli -h localhost -p 6379 ping

# Redis 메모리 사용량 확인
redis-cli info memory
```

#### 높은 메모리 사용량
```bash
# Node.js 메모리 사용량 분석
node --inspect=0.0.0.0:9229 src/microservices/main.js

# PM2 메모리 모니터링
pm2 monit
```

### 긴급 상황 대응

#### 서비스 전체 장애
```bash
# 1. 모든 서비스 재시작
docker-compose -f docker-compose.microservices.yml restart

# 2. 개별 서비스 재시작
docker-compose -f docker-compose.microservices.yml restart api-gateway

# 3. 최종 수단: 전체 재배포
docker-compose -f docker-compose.microservices.yml down
docker-compose -f docker-compose.microservices.yml up -d
```

#### 데이터베이스 장애
```bash
# 1. 백업에서 복구
pg_restore -h localhost -U onetime -d onetime backup.sql

# 2. 읽기 전용 모드 활성화
# 애플리케이션에서 읽기 전용 데이터베이스로 전환
```

---

## 📞 지원 및 문의

### 기술 지원
- **이메일**: tech-support@onetime.co.kr
- **슬랙**: #onetime-tech-support
- **문서**: https://docs.onetime.co.kr

### 긴급 상황
- **24시간 핫라인**: 1588-1234
- **긴급 이메일**: emergency@onetime.co.kr
- **Incident Response Team**: incident@onetime.co.kr

---

*배포 가이드 버전: 2.0.0*  
*최종 업데이트: 2025년 9월 10일*