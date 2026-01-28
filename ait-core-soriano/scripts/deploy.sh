#!/bin/bash

###############################################################################
# Deployment Script
# Description: Deploys AIT-CORE to production/staging environments
# Usage: ./deploy.sh [environment] [--no-backup] [--skip-tests]
###############################################################################

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_LOG="$PROJECT_ROOT/logs/deploy_$(date +%Y%m%d_%H%M%S).log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Default options
ENV="${1:-staging}"
SKIP_BACKUP=false
SKIP_TESTS=false
SKIP_MIGRATIONS=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --no-backup)
            SKIP_BACKUP=true
            ;;
        --skip-tests)
            SKIP_TESTS=true
            ;;
        --skip-migrations)
            SKIP_MIGRATIONS=true
            ;;
    esac
done

# Load environment-specific config
if [ -f "$PROJECT_ROOT/.env.$ENV" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env.$ENV" | xargs)
elif [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Deployment configuration
APP_NAME="${APP_NAME:-ait-core}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/$APP_NAME}"
PM2_APP_NAME="${PM2_APP_NAME:-$APP_NAME}"
DOCKER_COMPOSE_FILE="${DOCKER_COMPOSE_FILE:-docker-compose.yml}"

# Logging
mkdir -p "$(dirname "$DEPLOY_LOG")"

log() {
    echo -e "$1" | tee -a "$DEPLOY_LOG"
}

log_info() {
    log "${BLUE}[INFO]${NC} $1"
}

log_success() {
    log "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    log "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    log "${RED}[ERROR]${NC} $1"
}

log_step() {
    log "${CYAN}[STEP]${NC} $1"
}

# Error handler
handle_error() {
    log_error "Deployment failed at line $1"
    log_error "Check log file: $DEPLOY_LOG"
    exit 1
}

trap 'handle_error $LINENO' ERR

# Pre-deployment checks
pre_deployment_checks() {
    log_step "Running pre-deployment checks..."

    # Check if git is clean
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Working directory is not clean"
        read -p "Continue anyway? (y/N): " confirm
        if [ "$confirm" != "y" ]; then
            exit 1
        fi
    fi

    # Check if on correct branch
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    log_info "Current branch: $current_branch"

    if [ "$ENV" = "production" ] && [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
        log_error "Production deployments must be from main/master branch"
        exit 1
    fi

    # Check dependencies
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        log_error "package.json not found"
        exit 1
    fi

    log_success "Pre-deployment checks passed"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_warning "Skipping tests"
        return
    fi

    log_step "Running tests..."

    cd "$PROJECT_ROOT"

    if [ -f "pnpm-lock.yaml" ]; then
        pnpm test
    elif [ -f "package-lock.json" ]; then
        npm test
    elif [ -f "yarn.lock" ]; then
        yarn test
    else
        log_warning "No lock file found, skipping tests"
    fi

    log_success "Tests passed"
}

# Build application
build_application() {
    log_step "Building application..."

    cd "$PROJECT_ROOT"

    if [ -f "pnpm-lock.yaml" ]; then
        pnpm install --frozen-lockfile
        pnpm build
    elif [ -f "package-lock.json" ]; then
        npm ci
        npm run build
    elif [ -f "yarn.lock" ]; then
        yarn install --frozen-lockfile
        yarn build
    fi

    log_success "Build completed"
}

# Create backup
create_backup() {
    if [ "$SKIP_BACKUP" = true ]; then
        log_warning "Skipping backup"
        return
    fi

    log_step "Creating backup..."

    local backup_script="$SCRIPT_DIR/backup.sh"
    if [ -f "$backup_script" ]; then
        bash "$backup_script" --auto
    else
        log_warning "Backup script not found, skipping backup"
    fi

    log_success "Backup created"
}

# Run database migrations
run_migrations() {
    if [ "$SKIP_MIGRATIONS" = true ]; then
        log_warning "Skipping migrations"
        return
    fi

    log_step "Running database migrations..."

    local migration_script="$SCRIPT_DIR/db-migrate.sh"
    if [ -f "$migration_script" ]; then
        bash "$migration_script" up
    else
        log_warning "Migration script not found, skipping migrations"
    fi

    log_success "Migrations completed"
}

# Deploy with Docker
deploy_docker() {
    log_step "Deploying with Docker..."

    cd "$PROJECT_ROOT"

    # Pull latest images
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull

    # Build if needed
    docker-compose -f "$DOCKER_COMPOSE_FILE" build

    # Stop old containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" down

    # Start new containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d

    # Wait for containers to be healthy
    log_info "Waiting for containers to be healthy..."
    sleep 10

    log_success "Docker deployment completed"
}

# Deploy with PM2
deploy_pm2() {
    log_step "Deploying with PM2..."

    cd "$PROJECT_ROOT"

    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 not found. Please install PM2: npm install -g pm2"
        exit 1
    fi

    # Reload or start application
    if pm2 list | grep -q "$PM2_APP_NAME"; then
        pm2 reload "$PM2_APP_NAME" --update-env
    else
        pm2 start ecosystem.config.js --env "$ENV"
    fi

    pm2 save

    log_success "PM2 deployment completed"
}

# Deploy to remote server
deploy_remote() {
    log_step "Deploying to remote server: $DEPLOY_HOST..."

    if [ -z "$DEPLOY_HOST" ]; then
        log_error "DEPLOY_HOST not set"
        exit 1
    fi

    # Create deployment package
    local deploy_package="/tmp/${APP_NAME}_deploy_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$deploy_package" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=logs \
        --exclude=.env.local \
        -C "$PROJECT_ROOT" .

    # Upload to remote server
    scp "$deploy_package" "${DEPLOY_USER}@${DEPLOY_HOST}:/tmp/"

    # Deploy on remote server
    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
        set -e

        # Backup current deployment
        if [ -d "$DEPLOY_PATH" ]; then
            tar -czf "${DEPLOY_PATH}_backup_$(date +%Y%m%d_%H%M%S).tar.gz" -C "$DEPLOY_PATH" .
        fi

        # Extract new version
        mkdir -p "$DEPLOY_PATH"
        tar -xzf "$deploy_package" -C "$DEPLOY_PATH"

        # Install dependencies
        cd "$DEPLOY_PATH"
        pnpm install --frozen-lockfile --prod

        # Restart services
        pm2 reload "$PM2_APP_NAME" || pm2 start ecosystem.config.js

        # Cleanup
        rm "$deploy_package"
EOF

    # Cleanup local package
    rm "$deploy_package"

    log_success "Remote deployment completed"
}

# Health check
health_check() {
    log_step "Running health checks..."

    local health_script="$SCRIPT_DIR/health-check.sh"
    if [ -f "$health_script" ]; then
        if bash "$health_script" --quick; then
            log_success "Health checks passed"
        else
            log_error "Health checks failed"
            return 1
        fi
    else
        log_warning "Health check script not found, skipping health checks"
    fi
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"

    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"🚀 Deployment $status: $APP_NAME to $ENV\n$message\"}" \
            &> /dev/null || true
    fi

    # Discord notification
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        curl -X POST "$DISCORD_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"content\":\"🚀 Deployment $status: $APP_NAME to $ENV\n$message\"}" \
            &> /dev/null || true
    fi
}

# Main deployment flow
main() {
    local start_time=$(date +%s)

    log_info "=========================================="
    log_info "AIT-CORE Deployment Script"
    log_info "=========================================="
    log_info "Environment: $ENV"
    log_info "Started at: $(date)"
    log_info "=========================================="

    # Confirm production deployment
    if [ "$ENV" = "production" ]; then
        log_warning "⚠️  PRODUCTION DEPLOYMENT ⚠️"
        read -p "Are you sure you want to deploy to PRODUCTION? (type 'yes'): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi

    # Deployment steps
    pre_deployment_checks
    run_tests
    build_application
    create_backup
    run_migrations

    # Choose deployment method
    if [ -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" ]; then
        deploy_docker
    elif [ -n "$DEPLOY_HOST" ]; then
        deploy_remote
    else
        deploy_pm2
    fi

    # Post-deployment
    health_check

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_info "=========================================="
    log_success "Deployment completed successfully!"
    log_info "Duration: ${duration}s"
    log_info "Finished at: $(date)"
    log_info "Log file: $DEPLOY_LOG"
    log_info "=========================================="

    send_notification "SUCCESS" "Deployment completed in ${duration}s"
}

# Show usage
usage() {
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  development     - Deploy to development"
    echo "  staging         - Deploy to staging (default)"
    echo "  production      - Deploy to production"
    echo ""
    echo "Options:"
    echo "  --no-backup         - Skip backup creation"
    echo "  --skip-tests        - Skip running tests"
    echo "  --skip-migrations   - Skip database migrations"
    echo ""
    echo "Examples:"
    echo "  $0 staging"
    echo "  $0 production --no-backup"
    exit 1
}

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
fi

main
