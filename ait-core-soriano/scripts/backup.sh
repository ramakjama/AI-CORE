#!/bin/bash

###############################################################################
# Backup Script
# Description: Creates backups of database, files, and configurations
# Usage: ./backup.sh [--db-only] [--files-only] [--auto]
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"

# Options
DB_ONLY=false
FILES_ONLY=false
AUTO_MODE=false

for arg in "$@"; do
    case $arg in
        --db-only) DB_ONLY=true ;;
        --files-only) FILES_ONLY=true ;;
        --auto) AUTO_MODE=true ;;
    esac
done

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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load environment
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ait_core}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Retention settings
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
MAX_BACKUPS="${MAX_BACKUPS:-10}"

# Create backup directory
mkdir -p "$BACKUP_DIR"/{database,files,logs}

# Database backup
backup_database() {
    log_info "Backing up database: $DB_NAME"

    local backup_file="$BACKUP_DIR/database/db_${DB_NAME}_${TIMESTAMP}.sql.gz"

    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --clean \
        --if-exists \
        --create \
        --no-owner \
        --verbose \
        | gzip > "$backup_file"

    local size=$(du -h "$backup_file" | cut -f1)
    log_success "Database backup created: $backup_file ($size)"

    # Create metadata
    cat > "$backup_file.meta" << EOF
{
  "timestamp": "$TIMESTAMP",
  "database": "$DB_NAME",
  "host": "$DB_HOST",
  "size": "$size",
  "checksum": "$(sha256sum "$backup_file" | cut -d' ' -f1)"
}
EOF
}

# Files backup
backup_files() {
    log_info "Backing up application files..."

    local backup_file="$BACKUP_DIR/files/files_${TIMESTAMP}.tar.gz"

    tar -czf "$backup_file" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=backups \
        --exclude=logs \
        --exclude=.env \
        --exclude=dist \
        --exclude=build \
        -C "$PROJECT_ROOT" \
        .

    local size=$(du -h "$backup_file" | cut -f1)
    log_success "Files backup created: $backup_file ($size)"

    # Create metadata
    local git_commit=$(git -C "$PROJECT_ROOT" rev-parse HEAD 2>/dev/null || echo "unknown")
    local git_branch=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

    cat > "$backup_file.meta" << EOF
{
  "timestamp": "$TIMESTAMP",
  "git_commit": "$git_commit",
  "git_branch": "$git_branch",
  "size": "$size",
  "checksum": "$(sha256sum "$backup_file" | cut -d' ' -f1)"
}
EOF
}

# Configuration backup
backup_configs() {
    log_info "Backing up configurations..."

    local config_backup="$BACKUP_DIR/files/configs_${TIMESTAMP}.tar.gz"

    tar -czf "$config_backup" \
        -C "$PROJECT_ROOT" \
        --exclude=.env.local \
        .env.example \
        docker-compose.yml \
        ecosystem.config.js \
        package.json \
        pnpm-lock.yaml \
        turbo.json \
        2>/dev/null || true

    local size=$(du -h "$config_backup" | cut -f1)
    log_success "Configs backup created: $config_backup ($size)"
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups (retention: $RETENTION_DAYS days)..."

    # Remove backups older than retention period
    find "$BACKUP_DIR" -type f -name "*.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -type f -name "*.meta" -mtime +$RETENTION_DAYS -delete

    # Keep only last MAX_BACKUPS
    for dir in "$BACKUP_DIR"/*/; do
        local count=$(ls -1 "$dir"*.gz 2>/dev/null | wc -l)
        if [ $count -gt $MAX_BACKUPS ]; then
            local to_delete=$((count - MAX_BACKUPS))
            ls -1t "$dir"*.gz | tail -$to_delete | xargs rm -f
            ls -1t "$dir"*.meta 2>/dev/null | tail -$to_delete | xargs rm -f || true
        fi
    done

    log_success "Cleanup completed"
}

# Upload to remote storage (S3, etc.)
upload_to_remote() {
    if [ -z "$BACKUP_S3_BUCKET" ]; then
        return
    fi

    log_info "Uploading backups to S3: $BACKUP_S3_BUCKET"

    if command -v aws &> /dev/null; then
        aws s3 sync "$BACKUP_DIR" "s3://$BACKUP_S3_BUCKET/backups/" \
            --exclude "*" \
            --include "database/*.gz" \
            --include "files/*.gz"
        log_success "Uploaded to S3"
    else
        log_error "AWS CLI not found, skipping remote upload"
    fi
}

# Verify backup integrity
verify_backups() {
    log_info "Verifying backup integrity..."

    local failed=0

    for backup in "$BACKUP_DIR"/**/*.gz; do
        [ -e "$backup" ] || continue

        if [ -f "$backup.meta" ]; then
            local stored_checksum=$(grep checksum "$backup.meta" | cut -d'"' -f4)
            local actual_checksum=$(sha256sum "$backup" | cut -d' ' -f1)

            if [ "$stored_checksum" != "$actual_checksum" ]; then
                log_error "Checksum mismatch: $(basename $backup)"
                failed=$((failed + 1))
            fi
        fi
    done

    if [ $failed -eq 0 ]; then
        log_success "All backups verified successfully"
    else
        log_error "$failed backup(s) failed verification"
        return 1
    fi
}

# List backups
list_backups() {
    log_info "Available backups:"
    echo ""

    printf "%-30s %-15s %-10s\n" "BACKUP FILE" "DATE" "SIZE"
    echo "----------------------------------------------------------------"

    for backup in "$BACKUP_DIR"/**/*.gz; do
        [ -e "$backup" ] || continue

        local filename=$(basename "$backup")
        local date=$(stat -c %y "$backup" 2>/dev/null || stat -f %Sm "$backup" 2>/dev/null)
        local size=$(du -h "$backup" | cut -f1)

        printf "%-30s %-15s %-10s\n" "$filename" "${date:0:10}" "$size"
    done
}

# Send notification
send_notification() {
    local status="$1"

    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"📦 Backup $status: AIT-CORE ($TIMESTAMP)\"}" \
            &> /dev/null || true
    fi
}

# Main
main() {
    log_info "=========================================="
    log_info "AIT-CORE Backup Script"
    log_info "=========================================="
    log_info "Timestamp: $TIMESTAMP"
    log_info "Backup directory: $BACKUP_DIR"
    log_info "=========================================="

    if [ "$DB_ONLY" = false ] && [ "$FILES_ONLY" = false ]; then
        backup_database
        backup_files
        backup_configs
    elif [ "$DB_ONLY" = true ]; then
        backup_database
    elif [ "$FILES_ONLY" = true ]; then
        backup_files
        backup_configs
    fi

    verify_backups
    cleanup_old_backups
    upload_to_remote

    log_info "=========================================="
    log_success "Backup completed successfully!"
    log_info "=========================================="

    send_notification "COMPLETED"

    if [ "$AUTO_MODE" = false ]; then
        list_backups
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --db-only       - Backup database only"
    echo "  --files-only    - Backup files only"
    echo "  --auto          - Auto mode (no interactive output)"
    echo "  --list          - List available backups"
    echo ""
    echo "Examples:"
    echo "  $0                  # Full backup"
    echo "  $0 --db-only        # Database only"
    echo "  $0 --list           # List backups"
}

if [ "$1" = "--list" ]; then
    list_backups
    exit 0
fi

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

main
