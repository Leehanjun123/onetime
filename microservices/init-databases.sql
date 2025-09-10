-- 마이크로서비스별 데이터베이스 초기화 스크립트

-- User Service용 데이터베이스
CREATE DATABASE onetime_users;
GRANT ALL PRIVILEGES ON DATABASE onetime_users TO postgres;

-- Job Service용 데이터베이스  
CREATE DATABASE onetime_jobs;
GRANT ALL PRIVILEGES ON DATABASE onetime_jobs TO postgres;

-- Payment Service용 데이터베이스
CREATE DATABASE onetime_payments;
GRANT ALL PRIVILEGES ON DATABASE onetime_payments TO postgres;

-- 개발용 통합 데이터베이스 (기존 유지)
-- CREATE DATABASE onetime_dev;
-- GRANT ALL PRIVILEGES ON DATABASE onetime_dev TO postgres;