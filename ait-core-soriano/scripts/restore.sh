#!/bin/bash

###############################################################################
# Restore Script
# Description: Restores database and files from backup
# Usage: ./restore.sh [backup_timestamp] [--db-only] [--files-only]
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"

BACKUP_TIMESTAMP="$1"
DB_ONLY=false
FILES_ONLY=false

for arg in "$@"; do
    case $arg in
        --db-only) DB_ONLY=true ;;
        --files-only) FILES_ONLY=true ;;
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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
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

# List available backups
list_backups() {
    log_info "Available backups:"
    echo ""

    printf "%-20s %-30s %-10s\n" "TIMESTAMP" "TYPE" "SIZE"
    echo "----------------------------------------------------------------"

    local timestamps=()

    for backup in "$BACKUP_DIR"/**/*.gz; do
        [ -e "$backup" ] || continue

        local filename=$(basename "$backup")
        local timestamp=$(echo "$filename" | grep -oP '\d{8}_\d{6}')
        local type="database"

        if [[ "$filename" == files_* ]]; then
            type="files"
        elif [[ "$filename" == configs_* ]]; then
            type="configs"
        fi

        local size=$(du -h "$backup" | cut -f1)

        printf "%-20s %-30s %-10s\n" "$timestamp" "$type" "$size"
        timestamps+=("$timestamp")
    done

    echo ""
    echo "Use: ./restore.sh <timestamp> [--db-only|--files-only]"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi

    if [ -f "$backup_file.meta" ]; then
        local stored_checksum=$(grep checksum "$backup_file.meta" | cut -d'"' -f4)
        local actual_checksum=$(sha256sum "$backup_file" | cut -d' ' -f1)

        if [ "$stored_checksum" != "$actual_checksum" ]; then
            log_error "Backup integrity check failed!"
            return 1
        fi

        log_success "Backup integrity verified"
    else
        log_warning "No metadata file found, skipping integrity check"
    fi
}

# Restore database
restore_database() {
    local db_backup="$BACKUP_DIR/database/db_${DB_NAME}_${BACKUP_TIMESTAMP}.sql.gz"

    if [ ! -f "$db_backup" ]; then
        log_error "Database backup not found: $db_backup"
        return 1
    fi

    log_warning "⚠️  This will REPLACE the current database: $DB_NAME"
    read -p "Are you sure you want to continue? (type 'yes'): " confirm

    if [ "$confirm" != "yes" ]; then
        log_info "Restore cancelled"
        return 1
    fi

    verify_backup "$db_backup"

    log_info "Restoring database from: $(basename $db_backup)"

    # Terminate existing connections
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
        "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$DB_NAME' AND pid <> pg_backend_pid();"

    # Drop and recreate database
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"

    # Restore from backup
    gunzip -c "$db_backup" | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"

    log_success "Database restored successfully"
}

# Restore files
restore_files() {
    local files_backup="$BACKUP_DIR/files/files_${BACKUP_TIMESTAMP}.tar.gz"

    if [ ! -f "$files_backup" ]; then
        log_error "Files backup not found: $files_backup"
        return 1
    fi

    log_warning "⚠️  This will REPLACE current application files"
    read -p "Are you sure you want to continue? (type 'yes'): " confirm

    if [ "$confirm" != "yes" ]; then
        log_info "Restore cancelled"
        return 1
    fi

    verify_backup "$files_backup"

    log_info "Restoring files from: $(basename $files_backup)"

    # Create temporary restore directory
    local temp_dir="/tmp/restore_${BACKUP_TIMESTAMP}"
    mkdir -p "$temp_dir"

    # Extract backup
    tar -xzf "$files_backup" -C "$temp_dir"

    # Backup current state
    local current_backup="/tmp/current_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$current_backup" \
        --exclude=node_modules \
        --exclude=backups \
        -C "$PROJECT_ROOT" \
        .

    log_info "Current state backed up to: $current_backup"

    # Restore files (preserve node_modules, backups, logs)
    rsync -av \
        --exclude=node_modules \
        --exclude=backups \
        --exclude=logs \
        "$temp_dir/" "$PROJECT_ROOT/"

    # Cleanup
    rm -rf "$temp_dir"

    log_success "Files restored successfully"

    log_info "Reinstalling dependencies..."
    cd "$PROJECT_ROOT"
    if [ -f "pnpm-lock.yaml" ]; then
        pnpm install --frozen-lockfile
    elif [ -f "package-lock.json" ]; then
        npm ci
    elif [ -f "yarn.lock" ]; then
        yarn install --frozen-lockfile
    fi

    log_success "Dependencies installed"
}

# Download from remote storage
download_from_remote() {
    if [ -z "$BACKUP_S3_BUCKET" ]; then
        return
    fi

    log_info "Downloading backup from S3: $BACKUP_S3_BUCKET"

    if command -v aws &> /dev/null; then
        aws s3 sync "s3://$BACKUP_S3_BUCKET/backups/" "$BACKUP_DIR" \
            --exclude "*" \
            --include "*${BACKUP_TIMESTAMP}*.gz"
        log_success "Downloaded from S3"
    else
        log_error "AWS CLI not found, skipping remote download"
    fi
}

# Main
main() {
    if [ -z "$BACKUP_TIMESTAMP" ]; then
        list_backups
        exit 0
    fi

    log_info "=========================================="
    log_info "AIT-CORE Restore Script"
    log_info "=========================================="
    log_info "Backup timestamp: $BACKUP_TIMESTAMP"
    log_info "Restore directory: $PROJECT_ROOT"
    log_info "=========================================="

    # Try to download from remote if not found locally
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        download_from_remote
    fi

    if [ "$DB_ONLY" = false ] && [ "$FILES_ONLY" = false ]; then
        restore_database
        restore_files
    elif [ "$DB_ONLY" = true ]; then
        restore_database
    elif [ "$FILES_ONLY" = true ]; then
        restore_files
    fi

    log_info "=========================================="
    log_success "Restore completed successfully!"
    log_info "=========================================="
    log_info "Please restart your application"
}

# Show usage
usage() {
    echo "Usage: $0 [backup_timestamp] [options]"
    echo ""
    echo "Options:"
    echo "  --db-only       - Restore database only"
    echo "  --files-only    - Restore files only"
    echo ""
    echo "Examples:"
    echo "  $0                          # List available backups"
    echo "  $0 20260128_143000          # Full restore"
    echo "  $0 20260128_143000 --db-only  # Database only"
}

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

main
