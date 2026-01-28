#!/bin/bash
################################################################################
# PostgreSQL Restore Script
# Restore PostgreSQL database from backup
################################################################################

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup/postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-aitcore}"
DB_NAME="${DB_NAME:-soriano_core}"
BACKUP_FILE="${1:-}"
S3_BUCKET="${S3_BUCKET:-}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# Usage information
usage() {
    cat <<EOF
Usage: $0 [BACKUP_FILE]

Restore PostgreSQL database from backup.

Arguments:
  BACKUP_FILE    Path to backup file (optional). If not provided, uses latest backup.

Environment Variables:
  BACKUP_DIR     Backup directory (default: /backup/postgres)
  DB_HOST        PostgreSQL host (default: localhost)
  DB_PORT        PostgreSQL port (default: 5432)
  DB_USER        PostgreSQL user (default: aitcore)
  DB_NAME        Database name (default: soriano_core)
  S3_BUCKET      S3 bucket for remote backups (optional)
  POSTGRES_PASSWORD  Database password (required)

Examples:
  # Restore from latest backup
  $0

  # Restore from specific backup
  $0 /backup/postgres/postgres_soriano_core_20260128_120000.sql.gz

  # Restore from S3
  S3_BUCKET=my-backup-bucket $0 postgres_soriano_core_20260128_120000.sql.gz
EOF
    exit 1
}

# Check for help flag
if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
    usage
fi

log "Starting PostgreSQL restore process"

# Determine backup file to restore
if [ -z "$BACKUP_FILE" ]; then
    # Use latest backup
    if [ -f "$BACKUP_DIR/latest.sql.gz" ]; then
        BACKUP_FILE="$BACKUP_DIR/latest.sql.gz"
        log "Using latest backup: $(readlink -f "$BACKUP_FILE")"
    else
        log "ERROR: No backup file specified and latest backup not found"
        exit 1
    fi
elif [ ! -f "$BACKUP_FILE" ]; then
    # Try to download from S3
    if [ -n "$S3_BUCKET" ]; then
        log "Downloading backup from S3: s3://$S3_BUCKET/postgres/$BACKUP_FILE"
        aws s3 cp "s3://$S3_BUCKET/postgres/$BACKUP_FILE" "$BACKUP_DIR/$BACKUP_FILE"
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    else
        log "ERROR: Backup file not found: $BACKUP_FILE"
        exit 1
    fi
fi

# Verify backup file exists and checksum if available
if [ ! -f "$BACKUP_FILE" ]; then
    log "ERROR: Backup file does not exist: $BACKUP_FILE"
    exit 1
fi

if [ -f "${BACKUP_FILE}.md5" ]; then
    log "Verifying backup checksum"
    if ! md5sum -c "${BACKUP_FILE}.md5"; then
        log "ERROR: Checksum verification failed"
        exit 1
    fi
    log "Checksum verification passed"
fi

# Confirm restore action
log "=========================================="
log "WARNING: This will DROP and restore database: $DB_NAME"
log "Backup file: $BACKUP_FILE"
log "Target: $DB_HOST:$DB_PORT"
log "=========================================="

if [ -t 0 ]; then
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "Restore cancelled by user"
        exit 0
    fi
fi

# Check PostgreSQL connectivity
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    log "ERROR: PostgreSQL is not accessible at $DB_HOST:$DB_PORT"
    exit 1
fi

# Create pre-restore backup
log "Creating pre-restore backup as safety measure"
PRE_RESTORE_BACKUP="$BACKUP_DIR/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=plain \
    | gzip > "$PRE_RESTORE_BACKUP"

log "Pre-restore backup saved: $PRE_RESTORE_BACKUP"

# Terminate existing connections to the database
log "Terminating existing connections to database: $DB_NAME"
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '$DB_NAME'
      AND pid <> pg_backend_pid();
" > /dev/null

# Restore database
log "Restoring database from: $BACKUP_FILE"
gunzip -c "$BACKUP_FILE" | PGPASSWORD="$POSTGRES_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --quiet

# Verify restore
log "Verifying restore"
TABLE_COUNT=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = 'public';
" | xargs)

log "Database contains $TABLE_COUNT tables"

# Run ANALYZE to update statistics
log "Running ANALYZE to update database statistics"
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "ANALYZE;" > /dev/null

log "=========================================="
log "PostgreSQL restore completed successfully"
log "Database: $DB_NAME"
log "Tables restored: $TABLE_COUNT"
log "=========================================="

exit 0
