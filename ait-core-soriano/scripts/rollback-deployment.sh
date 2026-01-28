#!/bin/bash

###############################################################################
# Deployment Rollback Script
# Description: Rolls back to previous deployment
# Usage: ./rollback-deployment.sh [environment]
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV="${1:-staging}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Load environment
if [ -f "$PROJECT_ROOT/.env.$ENV" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env.$ENV" | xargs)
fi

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/ait-core}"

rollback_docker() {
    log_info "Rolling back Docker deployment..."

    cd "$PROJECT_ROOT"

    # Get previous image version
    local previous_version=$(git describe --tags --abbrev=0 HEAD^)

    if [ -z "$previous_version" ]; then
        log_error "No previous version found"
        exit 1
    fi

    log_info "Rolling back to version: $previous_version"

    # Checkout previous version
    git checkout "$previous_version"

    # Rebuild and restart
    docker-compose down
    docker-compose up -d --build

    log_success "Docker rollback completed"
}

rollback_pm2() {
    log_info "Rolling back PM2 deployment..."

    # Find latest backup
    local latest_backup=$(ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -1)

    if [ -z "$latest_backup" ]; then
        log_error "No backup found"
        exit 1
    fi

    log_info "Restoring from: $(basename $latest_backup)"

    # Extract backup
    cd "$PROJECT_ROOT"
    tar -xzf "$latest_backup"

    # Reload PM2
    pm2 reload all

    log_success "PM2 rollback completed"
}

rollback_database() {
    log_warning "Rolling back database migrations..."

    local migrate_script="$SCRIPT_DIR/db-migrate.sh"
    if [ -f "$migrate_script" ]; then
        bash "$migrate_script" down 1
        log_success "Database rolled back"
    else
        log_warning "Migration script not found"
    fi
}

main() {
    log_warning "⚠️  DEPLOYMENT ROLLBACK ⚠️"
    log_info "Environment: $ENV"

    read -p "Are you sure you want to rollback? (type 'yes'): " confirm
    if [ "$confirm" != "yes" ]; then
        log_info "Rollback cancelled"
        exit 0
    fi

    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        rollback_docker
    else
        rollback_pm2
    fi

    read -p "Rollback database migrations? (y/N): " db_confirm
    if [ "$db_confirm" = "y" ]; then
        rollback_database
    fi

    log_success "Rollback completed!"
    log_info "Please verify the application is working correctly"
}

main
