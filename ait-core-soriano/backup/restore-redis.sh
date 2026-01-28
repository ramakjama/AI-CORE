#!/bin/bash
################################################################################
# Redis Restore Script
# Restore Redis from RDB backup
################################################################################

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup/redis}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD:-}"
BACKUP_FILE="${1:-}"
S3_BUCKET="${S3_BUCKET:-}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# Usage
usage() {
    cat <<EOF
Usage: $0 [BACKUP_FILE]

Restore Redis from RDB backup.

Arguments:
  BACKUP_FILE    Path to backup file (optional). If not provided, uses latest.

Environment Variables:
  BACKUP_DIR     Backup directory (default: /backup/redis)
  REDIS_HOST     Redis host (default: localhost)
  REDIS_PORT     Redis port (default: 6379)
  REDIS_PASSWORD Redis password (optional)
  S3_BUCKET      S3 bucket for remote backups (optional)

Examples:
  # Restore from latest backup
  $0

  # Restore from specific backup
  $0 /backup/redis/redis_20260128_120000.rdb.gz
EOF
    exit 1
}

if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
    usage
fi

log "Starting Redis restore process"

# Determine backup file
if [ -z "$BACKUP_FILE" ]; then
    if [ -f "$BACKUP_DIR/latest.rdb.gz" ]; then
        BACKUP_FILE="$BACKUP_DIR/latest.rdb.gz"
        log "Using latest backup: $(readlink -f "$BACKUP_FILE")"
    else
        log "ERROR: No backup file specified and latest backup not found"
        exit 1
    fi
elif [ ! -f "$BACKUP_FILE" ]; then
    if [ -n "$S3_BUCKET" ]; then
        log "Downloading from S3: s3://$S3_BUCKET/redis/$BACKUP_FILE"
        aws s3 cp "s3://$S3_BUCKET/redis/$BACKUP_FILE" "$BACKUP_DIR/$BACKUP_FILE"
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    else
        log "ERROR: Backup file not found: $BACKUP_FILE"
        exit 1
    fi
fi

# Verify checksum if available
if [ -f "${BACKUP_FILE}.md5" ]; then
    log "Verifying checksum"
    if ! md5sum -c "${BACKUP_FILE}.md5"; then
        log "ERROR: Checksum verification failed"
        exit 1
    fi
fi

# Build redis-cli command
REDIS_CLI="redis-cli -h $REDIS_HOST -p $REDIS_PORT"
if [ -n "$REDIS_PASSWORD" ]; then
    REDIS_CLI="$REDIS_CLI -a $REDIS_PASSWORD"
fi

# Check Redis connectivity
if ! $REDIS_CLI ping > /dev/null 2>&1; then
    log "ERROR: Cannot connect to Redis at $REDIS_HOST:$REDIS_PORT"
    exit 1
fi

# Get Redis data directory
REDIS_DIR=$($REDIS_CLI CONFIG GET dir | tail -n 1)
REDIS_FILE=$($REDIS_CLI CONFIG GET dbfilename | tail -n 1)
RDB_PATH="$REDIS_DIR/$REDIS_FILE"

log "Redis data directory: $REDIS_DIR"
log "Redis RDB file: $REDIS_FILE"

# Confirm restore
log "=========================================="
log "WARNING: This will flush all data in Redis"
log "Backup file: $BACKUP_FILE"
log "Target: $REDIS_HOST:$REDIS_PORT"
log "=========================================="

if [ -t 0 ]; then
    read -p "Continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "Restore cancelled"
        exit 0
    fi
fi

# Stop Redis to restore RDB file
log "Stopping Redis"
$REDIS_CLI SHUTDOWN SAVE || true

# Wait for Redis to stop
sleep 2

# Extract backup to Redis data directory
log "Extracting backup to $RDB_PATH"
gunzip -c "$BACKUP_FILE" > "$RDB_PATH"

# Start Redis
log "Starting Redis"
redis-server --dir "$REDIS_DIR" --dbfilename "$REDIS_FILE" --daemonize yes

# Wait for Redis to start
sleep 2

# Verify Redis is running
if ! $REDIS_CLI ping > /dev/null 2>&1; then
    log "ERROR: Redis failed to start"
    exit 1
fi

# Verify data
KEY_COUNT=$($REDIS_CLI DBSIZE | awk '{print $2}')
log "Redis restored with $KEY_COUNT keys"

log "=========================================="
log "Redis restore completed successfully"
log "=========================================="

exit 0
