#!/bin/bash
################################################################################
# Redis Backup Script
# Automated backup for AIT-CORE Redis instance
################################################################################

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup/redis}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD:-}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="redis_${TIMESTAMP}.rdb.gz"
S3_BUCKET="${S3_BUCKET:-}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$BACKUP_DIR/backup.log"
}

log "Starting Redis backup"

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

# Trigger Redis BGSAVE
log "Triggering Redis BGSAVE"
$REDIS_CLI BGSAVE > /dev/null

# Wait for BGSAVE to complete
while true; do
    STATUS=$($REDIS_CLI LASTSAVE)
    sleep 2
    NEW_STATUS=$($REDIS_CLI LASTSAVE)
    if [ "$STATUS" != "$NEW_STATUS" ]; then
        break
    fi
    log "Waiting for BGSAVE to complete..."
    sleep 3
done

log "BGSAVE completed"

# Get Redis data directory
REDIS_DIR=$($REDIS_CLI CONFIG GET dir | tail -n 1)
REDIS_FILE=$($REDIS_CLI CONFIG GET dbfilename | tail -n 1)
RDB_PATH="$REDIS_DIR/$REDIS_FILE"

# Copy and compress RDB file
if [ -f "$RDB_PATH" ]; then
    log "Copying RDB file from $RDB_PATH"
    cat "$RDB_PATH" | gzip > "$BACKUP_DIR/$BACKUP_FILE"

    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    log "Backup completed. Size: $BACKUP_SIZE"

    # Create checksum
    md5sum "$BACKUP_DIR/$BACKUP_FILE" > "$BACKUP_DIR/$BACKUP_FILE.md5"

    # Upload to S3 if configured
    if [ -n "$S3_BUCKET" ]; then
        log "Uploading to S3: s3://$S3_BUCKET/redis/"
        aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$S3_BUCKET/redis/$BACKUP_FILE"
        aws s3 cp "$BACKUP_DIR/$BACKUP_FILE.md5" "s3://$S3_BUCKET/redis/$BACKUP_FILE.md5"
        log "S3 upload completed"
    fi

    # Create symlink to latest backup
    ln -sf "$BACKUP_FILE" "$BACKUP_DIR/latest.rdb.gz"

    # Cleanup old backups
    log "Cleaning up backups older than $RETENTION_DAYS days"
    find "$BACKUP_DIR" -name "redis_*.rdb.gz" -type f -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "redis_*.rdb.gz.md5" -type f -mtime +$RETENTION_DAYS -delete

    log "Redis backup completed successfully"
else
    log "ERROR: RDB file not found at $RDB_PATH"
    exit 1
fi

exit 0
