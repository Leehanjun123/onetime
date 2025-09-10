#!/bin/bash

# OneTime 마이크로서비스 배포 스크립트
set -e

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
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

# 환경 변수 설정
ENVIRONMENT=${1:-development}
BUILD_IMAGES=${BUILD_IMAGES:-true}
PUSH_IMAGES=${PUSH_IMAGES:-false}
REGISTRY=${REGISTRY:-localhost:5000}

log_info "🚀 OneTime 마이크로서비스 배포 시작 - 환경: $ENVIRONMENT"

# 1. 환경 확인
check_requirements() {
    log_info "🔍 배포 환경 확인 중..."
    
    # Docker 확인
    if ! command -v docker &> /dev/null; then
        log_error "Docker가 설치되지 않았습니다"
        exit 1
    fi
    
    # Docker Compose 확인
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose가 설치되지 않았습니다"
        exit 1
    fi
    
    # Kubernetes 확인 (production 환경)
    if [ "$ENVIRONMENT" = "production" ]; then
        if ! command -v kubectl &> /dev/null; then
            log_error "kubectl이 설치되지 않았습니다"
            exit 1
        fi
        
        if ! kubectl cluster-info &> /dev/null; then
            log_error "Kubernetes 클러스터에 연결할 수 없습니다"
            exit 1
        fi
    fi
    
    log_success "환경 확인 완료"
}

# 2. 이미지 빌드
build_images() {
    if [ "$BUILD_IMAGES" = "true" ]; then
        log_info "🏗️ Docker 이미지 빌드 중..."
        
        # API Gateway 빌드
        log_info "API Gateway 빌드 중..."
        docker build -t $REGISTRY/onetime/api-gateway:latest ./api-gateway
        
        # User Service 빌드
        log_info "User Service 빌드 중..."
        docker build -t $REGISTRY/onetime/user-service:latest ./user-service
        
        # TODO: 다른 서비스들도 구현되면 추가
        # docker build -t $REGISTRY/onetime/job-service:latest ./job-service
        # docker build -t $REGISTRY/onetime/payment-service:latest ./payment-service
        # docker build -t $REGISTRY/onetime/search-service:latest ./search-service
        # docker build -t $REGISTRY/onetime/notification-service:latest ./notification-service
        # docker build -t $REGISTRY/onetime/chat-service:latest ./chat-service
        
        log_success "이미지 빌드 완료"
        
        # 이미지 푸시 (선택적)
        if [ "$PUSH_IMAGES" = "true" ]; then
            log_info "📤 Docker 이미지 푸시 중..."
            docker push $REGISTRY/onetime/api-gateway:latest
            docker push $REGISTRY/onetime/user-service:latest
            log_success "이미지 푸시 완료"
        fi
    else
        log_info "이미지 빌드 건너뜀 (BUILD_IMAGES=false)"
    fi
}

# 3. 개발 환경 배포 (Docker Compose)
deploy_development() {
    log_info "🔧 개발 환경 배포 중..."
    
    # .env 파일 확인
    if [ ! -f .env ]; then
        log_warning ".env 파일이 없습니다. .env.example을 복사합니다"
        cp .env.example .env
        log_warning ".env 파일을 수정하고 다시 실행하세요"
        exit 1
    fi
    
    # Docker Compose로 배포
    if command -v docker-compose &> /dev/null; then
        docker-compose down --volumes || true
        docker-compose up -d --build
    else
        docker compose down --volumes || true
        docker compose up -d --build
    fi
    
    log_info "서비스 시작 대기 중..."
    sleep 30
    
    # 헬스체크
    check_services_health
    
    log_success "개발 환경 배포 완료"
    log_info "접근 URL:"
    log_info "  - API Gateway: http://localhost:3000"
    log_info "  - User Service: http://localhost:3001"
    log_info "  - PostgreSQL: localhost:5432"
    log_info "  - Redis: localhost:6379"
    log_info "  - Elasticsearch: http://localhost:9200"
    log_info "  - Consul: http://localhost:8500"
}

# 4. 프로덕션 환경 배포 (Kubernetes)
deploy_production() {
    log_info "🚀 프로덕션 환경 배포 중..."
    
    # Kustomization 적용
    kubectl apply -k k8s/overlays/production
    
    # 롤아웃 상태 확인
    log_info "배포 상태 확인 중..."
    kubectl rollout status deployment/api-gateway -n onetime
    kubectl rollout status deployment/user-service -n onetime
    
    # 서비스 정보 출력
    log_success "프로덕션 환경 배포 완료"
    kubectl get services -n onetime
}

# 5. 헬스체크
check_services_health() {
    log_info "🏥 서비스 상태 확인 중..."
    
    # API Gateway 헬스체크
    if curl -f http://localhost:3000/health &> /dev/null; then
        log_success "API Gateway 정상"
    else
        log_error "API Gateway 비정상"
    fi
    
    # User Service 헬스체크
    if curl -f http://localhost:3001/health &> /dev/null; then
        log_success "User Service 정상"
    else
        log_error "User Service 비정상"
    fi
    
    # Database 연결 확인
    if docker-compose exec postgres pg_isready -U postgres &> /dev/null; then
        log_success "PostgreSQL 정상"
    else
        log_error "PostgreSQL 비정상"
    fi
    
    # Redis 연결 확인
    if docker-compose exec redis redis-cli ping | grep -q PONG; then
        log_success "Redis 정상"
    else
        log_error "Redis 비정상"
    fi
}

# 6. 로그 수집
collect_logs() {
    log_info "📋 서비스 로그 수집 중..."
    
    if [ "$ENVIRONMENT" = "development" ]; then
        docker-compose logs --tail=100 > deployment-logs-$(date +%Y%m%d-%H%M%S).log
    else
        kubectl logs -l app=api-gateway -n onetime --tail=100 > api-gateway-logs-$(date +%Y%m%d-%H%M%S).log
        kubectl logs -l app=user-service -n onetime --tail=100 > user-service-logs-$(date +%Y%m%d-%H%M%S).log
    fi
    
    log_success "로그 수집 완료"
}

# 7. 정리 함수
cleanup() {
    log_info "🧹 정리 작업 수행 중..."
    
    if [ "$ENVIRONMENT" = "development" ]; then
        # 개발 환경 정리
        if command -v docker-compose &> /dev/null; then
            docker-compose down --volumes --remove-orphans
        else
            docker compose down --volumes --remove-orphans
        fi
        
        # 사용하지 않는 이미지 정리
        docker image prune -f
        docker volume prune -f
        
    else
        # 프로덕션 환경 정리
        kubectl delete namespace onetime --ignore-not-found=true
    fi
    
    log_success "정리 완료"
}

# 메인 배포 함수
main() {
    case "${2:-deploy}" in
        "deploy")
            check_requirements
            build_images
            
            if [ "$ENVIRONMENT" = "production" ]; then
                deploy_production
            else
                deploy_development
            fi
            ;;
        "logs")
            collect_logs
            ;;
        "health")
            check_services_health
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            echo "사용법: $0 <environment> [deploy|logs|health|cleanup]"
            echo "  environment: development | production"
            echo "  action:"
            echo "    deploy  - 서비스 배포 (기본값)"
            echo "    logs    - 로그 수집"
            echo "    health  - 헬스체크"
            echo "    cleanup - 정리"
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"