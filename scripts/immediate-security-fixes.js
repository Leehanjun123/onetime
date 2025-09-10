#!/usr/bin/env node

/**
 * 즉시 보안 수정 스크립트
 * OneTime 플랫폼의 치명적 보안 취약점 해결
 */

const fs = require('fs');
const path = require('path');

class ImmediateSecurityFixer {
  constructor() {
    this.fixes = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '✓',
      'warn': '⚠️',
      'error': '❌',
      'success': '✅'
    }[type] || 'ℹ️';
    
    console.log(`${timestamp} [${prefix}] ${message}`);
  }

  /**
   * 1. 환경변수 검증 및 보안 설정
   */
  async validateEnvironmentSecurity() {
    this.log('환경변수 보안 검증 시작', 'info');
    
    const requiredEnvVars = [
      'JWT_SECRET',
      'DATABASE_URL',
      'REDIS_URL',
      'TOSS_CLIENT_KEY',
      'TOSS_SECRET_KEY'
    ];

    const envFiles = ['.env', '.env.local', '.env.production'];
    
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        
        // 하드코딩된 시크릿 검사
        const secrets = content.match(/(?:password|secret|key|token)=.+/gi);
        if (secrets) {
          this.log(`⚠️ ${envFile}에서 하드코딩된 시크릿 발견: ${secrets.length}개`, 'warn');
          this.fixes.push(`${envFile} 파일의 시크릿을 Kubernetes Secret으로 마이그레이션 필요`);
        }

        // 약한 JWT 시크릿 검사
        const jwtMatch = content.match(/JWT_SECRET=(.+)/);
        if (jwtMatch && jwtMatch[1].length < 32) {
          this.log('약한 JWT_SECRET 발견', 'error');
          this.fixes.push('JWT_SECRET을 32자 이상의 강력한 키로 변경 필요');
        }
      }
    }
  }

  /**
   * 2. API 보안 헤더 검증
   */
  async validateSecurityHeaders() {
    this.log('보안 헤더 검증 시작', 'info');
    
    const serverFiles = [
      'src/index.js',
      'microservices/api-gateway/src/index.js',
      'microservices/user-service/src/index.js'
    ];

    for (const file of serverFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        const securityChecks = {
          'helmet': content.includes('helmet'),
          'cors': content.includes('cors'),
          'rateLimit': content.includes('rateLimit') || content.includes('express-rate-limit'),
          'https': content.includes('https') || content.includes('secure: true')
        };

        Object.entries(securityChecks).forEach(([check, exists]) => {
          if (!exists) {
            this.log(`${file}에 ${check} 보안 설정 누락`, 'warn');
            this.fixes.push(`${file}에 ${check} 보안 미들웨어 추가 필요`);
          }
        });
      }
    }
  }

  /**
   * 3. 데이터베이스 보안 검증
   */
  async validateDatabaseSecurity() {
    this.log('데이터베이스 보안 검증 시작', 'info');
    
    const schemaFiles = [
      'prisma/schema.prisma',
      'microservices/user-service/prisma/schema.prisma',
      'microservices/job-service/prisma/schema.prisma'
    ];

    for (const schemaFile of schemaFiles) {
      if (fs.existsSync(schemaFile)) {
        const content = fs.readFileSync(schemaFile, 'utf8');
        
        // 패스워드 암호화 검사
        if (content.includes('password') && !content.includes('@map')) {
          this.log(`${schemaFile}에서 패스워드 필드 암호화 검증 필요`, 'warn');
          this.fixes.push(`${schemaFile}의 패스워드 필드에 해싱 설정 확인 필요`);
        }

        // 민감 데이터 인덱싱 검사
        const sensitiveFields = ['email', 'phone', 'ssn', 'card_number'];
        sensitiveFields.forEach(field => {
          if (content.includes(field) && content.includes('@@index')) {
            this.log(`${schemaFile}에서 민감 데이터 인덱싱 발견: ${field}`, 'warn');
            this.fixes.push(`${field} 필드의 인덱싱 보안 검토 필요`);
          }
        });
      }
    }
  }

  /**
   * 4. 입력 검증 보안 검사
   */
  async validateInputSecurity() {
    this.log('입력 검증 보안 검사 시작', 'info');
    
    const routeFiles = [
      'src/routes',
      'microservices/*/src/routes'
    ];

    // 라우트 파일에서 입력 검증 검사
    const findJSFiles = (dir) => {
      if (!fs.existsSync(dir)) return [];
      
      const files = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          files.push(...findJSFiles(fullPath));
        } else if (item.endsWith('.js')) {
          files.push(fullPath);
        }
      }
      return files;
    };

    const routeFileList = [];
    routeFiles.forEach(pattern => {
      if (pattern.includes('*')) {
        // 와일드카드 처리는 추후 구현
        return;
      }
      if (fs.existsSync(pattern)) {
        routeFileList.push(...findJSFiles(pattern));
      }
    });

    routeFileList.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // SQL 인젝션 취약점 검사
      if (content.includes('${') && content.includes('prisma')) {
        this.log(`${file}에서 잠재적 SQL 인젝션 위험 발견`, 'error');
        this.fixes.push(`${file}에서 동적 쿼리 구성 방식 보안 검토 필요`);
      }

      // XSS 방지 검사
      if (content.includes('req.body') && !content.includes('validator')) {
        this.log(`${file}에서 입력 검증 누락`, 'warn');
        this.fixes.push(`${file}에 입력 검증 미들웨어 추가 필요`);
      }
    });
  }

  /**
   * 5. Docker 및 Kubernetes 보안 검사
   */
  async validateContainerSecurity() {
    this.log('컨테이너 보안 검사 시작', 'info');
    
    // Dockerfile 보안 검사
    const dockerfiles = ['Dockerfile', 'microservices/*/Dockerfile'];
    
    dockerfiles.forEach(pattern => {
      if (pattern.includes('*')) return; // 와일드카드는 추후 처리
      
      if (fs.existsSync(pattern)) {
        const content = fs.readFileSync(pattern, 'utf8');
        
        if (content.includes('USER root')) {
          this.log(`${pattern}에서 root 사용자 실행 발견`, 'error');
          this.fixes.push(`${pattern}에서 non-root 사용자로 변경 필요`);
        }

        if (!content.includes('USER ') && content.includes('FROM')) {
          this.log(`${pattern}에서 사용자 지정 누락`, 'warn');
          this.fixes.push(`${pattern}에 non-root 사용자 설정 추가 필요`);
        }
      }
    });

    // Kubernetes 매니페스트 보안 검사
    const k8sFiles = ['k8s', 'microservices/k8s'];
    
    k8sFiles.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
        
        files.forEach(file => {
          const fullPath = path.join(dir, file);
          const content = fs.readFileSync(fullPath, 'utf8');
          
          if (content.includes('privileged: true')) {
            this.log(`${fullPath}에서 권한 상승 설정 발견`, 'error');
            this.fixes.push(`${fullPath}에서 privileged 모드 제거 필요`);
          }

          if (!content.includes('runAsNonRoot')) {
            this.log(`${fullPath}에서 non-root 보안 설정 누락`, 'warn');
            this.fixes.push(`${fullPath}에 runAsNonRoot: true 설정 추가 필요`);
          }
        });
      }
    });
  }

  /**
   * 보안 수정 실행
   */
  async runSecurityFixes() {
    this.log('즉시 보안 수정 시작', 'info');
    
    await this.validateEnvironmentSecurity();
    await this.validateSecurityHeaders();
    await this.validateDatabaseSecurity();
    await this.validateInputSecurity();
    await this.validateContainerSecurity();

    // 결과 리포트
    this.log(`보안 검사 완료`, 'success');
    this.log(`발견된 수정사항: ${this.fixes.length}개`, 'info');
    
    if (this.fixes.length > 0) {
      this.log('\n=== 즉시 수정 필요 사항 ===', 'warn');
      this.fixes.forEach((fix, index) => {
        console.log(`${index + 1}. ${fix}`);
      });
    }

    if (this.errors.length > 0) {
      this.log('\n=== 치명적 보안 위험 ===', 'error');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // 수정 스크립트 생성
    await this.generateFixScript();
  }

  /**
   * 자동 수정 스크립트 생성
   */
  async generateFixScript() {
    const fixScript = `#!/bin/bash
# OneTime 플랫폼 즉시 보안 수정 스크립트
# 생성일: ${new Date().toISOString()}

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
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=\$NEW_JWT_SECRET/" .env
else
  echo "JWT_SECRET=\$NEW_JWT_SECRET" >> .env
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
`;

    fs.writeFileSync('scripts/apply-immediate-security-fixes.sh', fixScript, { mode: 0o755 });
    this.log('자동 수정 스크립트 생성: scripts/apply-immediate-security-fixes.sh', 'success');
  }
}

// 실행
if (require.main === module) {
  const fixer = new ImmediateSecurityFixer();
  fixer.runSecurityFixes().catch(console.error);
}

module.exports = ImmediateSecurityFixer;