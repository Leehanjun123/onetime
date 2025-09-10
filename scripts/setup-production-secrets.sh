#!/bin/bash

# OneTime 플랫폼 프로덕션 시크릿 설정 스크립트
# 이 스크립트는 프로덕션 환경에서 안전하게 시크릿을 관리하기 위해 사용됩니다.

set -e

echo "🔐 OneTime 프로덕션 시크릿 설정 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 필수 도구 확인
check_dependencies() {
    log_info "필수 도구 확인 중..."
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl이 설치되지 않았습니다."
        exit 1
    fi
    
    if ! command -v openssl &> /dev/null; then
        log_error "openssl이 설치되지 않았습니다."
        exit 1
    fi
    
    if ! command -v base64 &> /dev/null; then
        log_error "base64가 설치되지 않았습니다."
        exit 1
    fi
    
    log_success "모든 필수 도구가 설치되어 있습니다."
}

# Kubernetes 연결 확인
check_k8s_connection() {
    log_info "Kubernetes 클러스터 연결 확인 중..."
    
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Kubernetes 클러스터에 연결할 수 없습니다."
        exit 1
    fi
    
    log_success "Kubernetes 클러스터에 성공적으로 연결되었습니다."
}

# 네임스페이스 생성
create_namespace() {
    local namespace="onetime"
    
    log_info "네임스페이스 '$namespace' 생성 중..."
    
    if kubectl get namespace "$namespace" &> /dev/null; then
        log_warning "네임스페이스 '$namespace'가 이미 존재합니다."
    else
        kubectl create namespace "$namespace"
        log_success "네임스페이스 '$namespace'가 생성되었습니다."
    fi
}

# 강력한 패스워드 생성
generate_secure_password() {
    openssl rand -base64 32 | tr -d "\n"
}

# JWT 시크릿 생성
generate_jwt_secret() {
    openssl rand -base64 32 | tr -d "\n"
}

# 사용자 입력 받기
get_user_inputs() {
    log_info "프로덕션 환경 설정값을 입력해주세요."
    echo
    
    # JWT 시크릿 자동 생성
    JWT_SECRET=$(generate_jwt_secret)
    log_success "JWT 시크릿이 자동으로 생성되었습니다."
    
    # 데이터베이스 설정
    read -p "데이터베이스 호스트 [postgres]: " DB_HOST
    DB_HOST=${DB_HOST:-postgres}
    
    read -p "데이터베이스 포트 [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    
    read -p "데이터베이스 이름 [onetime_production]: " DB_NAME
    DB_NAME=${DB_NAME:-onetime_production}
    
    read -p "데이터베이스 사용자명 [onetime_user]: " DB_USER
    DB_USER=${DB_USER:-onetime_user}
    
    DB_PASSWORD=$(generate_secure_password)
    log_success "데이터베이스 패스워드가 자동으로 생성되었습니다."
    
    # Redis 설정
    read -p "Redis 호스트 [redis]: " REDIS_HOST
    REDIS_HOST=${REDIS_HOST:-redis}
    
    read -p "Redis 포트 [6379]: " REDIS_PORT
    REDIS_PORT=${REDIS_PORT:-6379}
    
    REDIS_PASSWORD=$(generate_secure_password)
    log_success "Redis 패스워드가 자동으로 생성되었습니다."
    
    # 토스페이먼츠 설정
    read -p "토스페이먼츠 클라이언트 키: " TOSS_CLIENT_KEY
    read -p "토스페이먼츠 시크릿 키: " TOSS_SECRET_KEY
    
    # 이메일 서비스 설정
    read -p "이메일 서비스 API 키: " EMAIL_API_KEY
    
    # AWS 설정
    read -p "AWS Access Key ID: " AWS_ACCESS_KEY
    read -p "AWS Secret Access Key: " AWS_SECRET_KEY
    
    # Sentry 설정
    read -p "Sentry DSN: " SENTRY_DSN
    
    # 도메인 설정
    read -p "허용된 도메인 (쉼표로 구분) [https://onetime.co.kr,https://www.onetime.co.kr]: " ALLOWED_ORIGINS
    ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-"https://onetime.co.kr,https://www.onetime.co.kr"}
}

# 애플리케이션 시크릿 생성
create_app_secrets() {
    log_info "애플리케이션 시크릿 생성 중..."
    
    # 데이터베이스 URL 구성
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    REDIS_URL="redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/0"
    
    kubectl create secret generic onetime-app-secrets \
        --from-literal=JWT_SECRET="$JWT_SECRET" \
        --from-literal=DATABASE_URL="$DATABASE_URL" \
        --from-literal=REDIS_URL="$REDIS_URL" \
        --from-literal=TOSS_CLIENT_KEY="$TOSS_CLIENT_KEY" \
        --from-literal=TOSS_SECRET_KEY="$TOSS_SECRET_KEY" \
        --from-literal=EMAIL_SERVICE_API_KEY="$EMAIL_API_KEY" \
        --from-literal=AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY" \
        --from-literal=AWS_SECRET_ACCESS_KEY="$AWS_SECRET_KEY" \
        --from-literal=SENTRY_DSN="$SENTRY_DSN" \
        --namespace=onetime \
        --dry-run=client -o yaml | kubectl apply -f -
    
    log_success "애플리케이션 시크릿이 생성되었습니다."
}

# 데이터베이스 시크릿 생성
create_db_secrets() {
    log_info "데이터베이스 시크릿 생성 중..."
    
    kubectl create secret generic onetime-db-secrets \
        --from-literal=POSTGRES_USER="$DB_USER" \
        --from-literal=POSTGRES_PASSWORD="$DB_PASSWORD" \
        --from-literal=POSTGRES_DB="$DB_NAME" \
        --namespace=onetime \
        --dry-run=client -o yaml | kubectl apply -f -
    
    log_success "데이터베이스 시크릿이 생성되었습니다."
}

# Redis 시크릿 생성
create_redis_secrets() {
    log_info "Redis 시크릿 생성 중..."
    
    kubectl create secret generic onetime-redis-secrets \
        --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD" \
        --namespace=onetime \
        --dry-run=client -o yaml | kubectl apply -f -
    
    log_success "Redis 시크릿이 생성되었습니다."
}

# ConfigMap 생성
create_configmap() {
    log_info "ConfigMap 생성 중..."
    
    kubectl create configmap onetime-app-config \
        --from-literal=NODE_ENV="production" \
        --from-literal=PORT="5000" \
        --from-literal=LOG_LEVEL="info" \
        --from-literal=API_RATE_LIMIT="100" \
        --from-literal=SESSION_TIMEOUT="86400" \
        --from-literal=MAINTENANCE_MODE="false" \
        --from-literal=ALLOWED_ORIGINS="$ALLOWED_ORIGINS" \
        --from-literal=MAX_FILE_SIZE="10485760" \
        --from-literal=UPLOAD_DIR="/app/uploads" \
        --from-literal=ENABLE_SWAGGER="false" \
        --from-literal=ENABLE_METRICS="true" \
        --from-literal=AWS_REGION="ap-northeast-2" \
        --from-literal=AWS_S3_BUCKET="onetime-uploads-prod" \
        --from-literal=EMAIL_FROM="noreply@onetime.co.kr" \
        --namespace=onetime \
        --dry-run=client -o yaml | kubectl apply -f -
    
    log_success "ConfigMap이 생성되었습니다."
}

# 시크릿 로테이션 설정
setup_secret_rotation() {
    log_info "시크릿 로테이션 설정 중..."
    
    # ServiceAccount 생성
    kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: secret-rotator
  namespace: onetime
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: onetime
  name: secret-manager
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "patch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: secret-manager-binding
  namespace: onetime
subjects:
- kind: ServiceAccount
  name: secret-rotator
  namespace: onetime
roleRef:
  kind: Role
  name: secret-manager
  apiGroup: rbac.authorization.k8s.io
EOF
    
    log_success "시크릿 로테이션이 설정되었습니다."
}

# 시크릿 검증
verify_secrets() {
    log_info "시크릿 검증 중..."
    
    # 시크릿 존재 여부 확인
    if kubectl get secret onetime-app-secrets -n onetime &> /dev/null; then
        log_success "애플리케이션 시크릿이 존재합니다."
    else
        log_error "애플리케이션 시크릿이 존재하지 않습니다."
        return 1
    fi
    
    if kubectl get secret onetime-db-secrets -n onetime &> /dev/null; then
        log_success "데이터베이스 시크릿이 존재합니다."
    else
        log_error "데이터베이스 시크릿이 존재하지 않습니다."
        return 1
    fi
    
    if kubectl get secret onetime-redis-secrets -n onetime &> /dev/null; then
        log_success "Redis 시크릿이 존재합니다."
    else
        log_error "Redis 시크릿이 존재하지 않습니다."
        return 1
    fi
    
    # ConfigMap 확인
    if kubectl get configmap onetime-app-config -n onetime &> /dev/null; then
        log_success "ConfigMap이 존재합니다."
    else
        log_error "ConfigMap이 존재하지 않습니다."
        return 1
    fi
    
    log_success "모든 시크릿과 구성이 올바르게 생성되었습니다."
}

# 보안 정보 출력
print_security_info() {
    echo
    log_info "====== 중요 보안 정보 ======"
    echo
    echo "생성된 패스워드들:"
    echo "- 데이터베이스 패스워드: $DB_PASSWORD"
    echo "- Redis 패스워드: $REDIS_PASSWORD"
    echo "- JWT 시크릿: $JWT_SECRET"
    echo
    log_warning "위 정보를 안전한 곳에 저장하고 이 터미널을 닫기 전에 기록해두세요!"
    log_warning "이 정보는 복구가 불가능하며, 분실 시 새로 생성해야 합니다."
    echo
    echo "시크릿 확인 명령어:"
    echo "kubectl get secrets -n onetime"
    echo "kubectl describe secret onetime-app-secrets -n onetime"
    echo
    echo "시크릿 업데이트 명령어 예시:"
    echo "kubectl patch secret onetime-app-secrets -n onetime -p '{\"data\":{\"JWT_SECRET\":\"$(echo -n 'NEW_SECRET' | base64)\"}}'"
    echo
    log_info "=========================="
}

# 메인 함수
main() {
    echo "🚀 OneTime 프로덕션 시크릿 설정 스크립트"
    echo "이 스크립트는 프로덕션 환경의 보안 시크릿을 설정합니다."
    echo
    
    check_dependencies
    check_k8s_connection
    create_namespace
    
    echo
    log_warning "주의: 이 스크립트는 기존 시크릿을 덮어씁니다."
    read -p "계속하시겠습니까? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "스크립트가 취소되었습니다."
        exit 0
    fi
    
    get_user_inputs
    
    echo
    log_info "시크릿 생성을 시작합니다..."
    
    create_app_secrets
    create_db_secrets
    create_redis_secrets
    create_configmap
    setup_secret_rotation
    verify_secrets
    
    echo
    log_success "🎉 모든 시크릿이 성공적으로 생성되었습니다!"
    
    print_security_info
}

# 스크립트 실행
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi