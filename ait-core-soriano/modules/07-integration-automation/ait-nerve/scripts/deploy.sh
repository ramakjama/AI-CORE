#!/bin/bash

# AIT-NERVE Deployment Script
# Production deployment automation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="ait-nerve"
DOCKER_IMAGE="ait-nerve:latest"
DOCKER_REGISTRY=""
DEPLOYMENT_ENV=${1:-production}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  AIT-NERVE Deployment Script${NC}"
echo -e "${GREEN}  Environment: ${DEPLOYMENT_ENV}${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to print colored messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required commands exist
check_requirements() {
    log_info "Checking requirements..."

    commands=("docker" "docker-compose" "git" "node" "npm")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is required but not installed."
            exit 1
        fi
    done

    log_info "All requirements met."
}

# Pull latest code
pull_code() {
    log_info "Pulling latest code..."
    git pull origin main
    log_info "Code updated successfully."
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    npm ci --only=production
    log_info "Dependencies installed."
}

# Run tests
run_tests() {
    log_info "Running tests..."
    npm run test || {
        log_error "Tests failed!"
        exit 1
    }
    log_info "All tests passed."
}

# Build application
build_app() {
    log_info "Building application..."
    npm run build
    log_info "Build completed successfully."
}

# Build Docker image
build_docker() {
    log_info "Building Docker image..."
    docker build -t ${DOCKER_IMAGE} .

    if [ ! -z "$DOCKER_REGISTRY" ]; then
        log_info "Tagging image for registry..."
        docker tag ${DOCKER_IMAGE} ${DOCKER_REGISTRY}/${DOCKER_IMAGE}

        log_info "Pushing to registry..."
        docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE}
    fi

    log_info "Docker image built successfully."
}

# Deploy with Docker Compose
deploy_docker_compose() {
    log_info "Deploying with Docker Compose..."

    # Stop existing containers
    docker-compose down

    # Start new containers
    docker-compose up -d

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 10

    # Check health
    if curl -f http://localhost:3000/api/v1/nerve/health &> /dev/null; then
        log_info "Deployment successful! Service is healthy."
    else
        log_error "Health check failed!"
        docker-compose logs ait-nerve
        exit 1
    fi
}

# Deploy to Kubernetes
deploy_kubernetes() {
    log_info "Deploying to Kubernetes..."

    # Apply configurations
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secret.yaml
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    kubectl apply -f k8s/ingress.yaml
    kubectl apply -f k8s/hpa.yaml

    # Wait for rollout
    log_info "Waiting for rollout to complete..."
    kubectl rollout status deployment/ait-nerve -n ait-core --timeout=300s

    # Verify deployment
    log_info "Verifying deployment..."
    kubectl get pods -n ait-core -l app=ait-nerve

    log_info "Kubernetes deployment successful!"
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."

    if [ "$DEPLOYMENT_TYPE" = "docker" ]; then
        docker-compose down
        git checkout HEAD~1
        docker-compose up -d
    elif [ "$DEPLOYMENT_TYPE" = "kubernetes" ]; then
        kubectl rollout undo deployment/ait-nerve -n ait-core
        kubectl rollout status deployment/ait-nerve -n ait-core
    fi

    log_info "Rollback completed."
}

# Create backup before deployment
backup() {
    log_info "Creating backup..."

    BACKUP_DIR="./backups"
    mkdir -p ${BACKUP_DIR}

    DATE=$(date +%Y%m%d_%H%M%S)

    # Backup environment
    cp .env ${BACKUP_DIR}/env_${DATE}

    # Backup database if exists
    if [ -f "database.db" ]; then
        cp database.db ${BACKUP_DIR}/database_${DATE}.db
    fi

    log_info "Backup created: ${BACKUP_DIR}/backup_${DATE}"
}

# Post-deployment tasks
post_deploy() {
    log_info "Running post-deployment tasks..."

    # Clear cache
    log_info "Clearing cache..."
    # Add cache clearing logic here

    # Run migrations if needed
    # npm run migrate

    # Warm up cache
    log_info "Warming up cache..."
    curl -s http://localhost:3000/api/v1/nerve/engines > /dev/null || true

    log_info "Post-deployment tasks completed."
}

# Main deployment flow
main() {
    # Parse deployment type
    DEPLOYMENT_TYPE=${2:-docker}

    # Pre-deployment
    check_requirements
    backup

    # Build
    if [ "$DEPLOYMENT_ENV" != "production" ]; then
        pull_code
        install_dependencies
        run_tests
    fi

    build_app
    build_docker

    # Deploy
    if [ "$DEPLOYMENT_TYPE" = "kubernetes" ]; then
        deploy_kubernetes
    else
        deploy_docker_compose
    fi

    # Post-deployment
    post_deploy

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Deployment Completed Successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Service URL: http://localhost:3000/api/v1"
    echo "Health Check: http://localhost:3000/api/v1/nerve/health"
    echo "Swagger Docs: http://localhost:3000/api/v1/docs"
    echo "Metrics: http://localhost:3000/api/v1/nerve/metrics"
    echo ""
    echo "View logs:"
    if [ "$DEPLOYMENT_TYPE" = "kubernetes" ]; then
        echo "  kubectl logs -f deployment/ait-nerve -n ait-core"
    else
        echo "  docker-compose logs -f ait-nerve"
    fi
}

# Trap errors
trap 'log_error "Deployment failed! Running rollback..."; rollback; exit 1' ERR

# Run main deployment
main

exit 0
