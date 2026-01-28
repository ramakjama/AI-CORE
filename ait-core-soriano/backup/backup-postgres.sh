#!/bin/bash
################################################################################
# PostgreSQL Backup Script
# Automated backup for AIT-CORE PostgreSQL database
################################################################################

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup/postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-aitcore}"
DB_NAME="${DB_NAME:-soriano_core}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="postgres_${DB_NAME}_${TIMESTAMP}.sql.gz"
S3_BUCKET="${S3_BUCKET:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$BACKUP_DIR/backup.log"
}

# Notification function
notify() {
    local status="$1"
    local message="$2"

    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"[$status] PostgreSQL Backup: $message\"}" \
            2>/dev/null || true
    fi
}

# Error handler
error_handler() {
    log "ERROR: Backup failed on line $1"
    notify "FAILED" "PostgreSQL backup failed at $(date)"
    exit 1
}

trap 'error_handler $LINENO' ERR

log "Starting PostgreSQL backup for database: $DB_NAME"

# Check if PostgreSQL is accessible
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    log "ERROR: PostgreSQL is not accessible at $DB_HOST:$DB_PORT"
    notify "FAILED" "PostgreSQL is not accessible"
    exit 1
fi

# Create backup
log "Creating backup: $BACKUP_FILE"
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Verify backup file exists and is not empty
if [ ! -s "$BACKUP_DIR/$BACKUP_FILE" ]; then
    log "ERROR: Backup file is empty or does not exist"
    notify "FAILED" "Backup file is empty"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
log "Backup completed successfully. Size: $BACKUP_SIZE"

# Create checksums
md5sum "$BACKUP_DIR/$BACKUP_FILE" > "$BACKUP_DIR/$BACKUP_FILE.md5"
log "Checksum created: $BACKUP_FILE.md5"

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ]; then
    log "Uploading to S3: s3://$S3_BUCKET/postgres/"
    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$S3_BUCKET/postgres/$BACKUP_FILE" \
        --storage-class STANDARD_IA
    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE.md5" "s3://$S3_BUCKET/postgres/$BACKUP_FILE.md5"
    log "S3 upload completed"
fi

# Create symlink to latest backup
ln -sf "$BACKUP_FILE" "$BACKUP_DIR/latest.sql.gz"

# Cleanup old backups
log "Cleaning up backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name "postgres_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "postgres_*.sql.gz.md5" -type f -mtime +$RETENTION_DAYS -delete

# Cleanup S3 old backups if configured
if [ -n "$S3_BUCKET" ]; then
    CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
    aws s3 ls "s3://$S3_BUCKET/postgres/" | while read -r line; do
        FILE=$(echo "$line" | awk '{print $4}')
        if [[ $FILE =~ postgres_([0-9]{8})_ ]]; then
            FILE_DATE="${BASH_REMATCH[1]}"
            if [ "$FILE_DATE" -lt "$CUTOFF_DATE" ]; then
                log "Deleting old S3 backup: $FILE"
                aws s3 rm "s3://$S3_BUCKET/postgres/$FILE"
            fi
        fi
    done
fi

# Generate backup report
cat > "$BACKUP_DIR/backup_report_${TIMESTAMP}.txt" <<EOF
PostgreSQL Backup Report
========================
Date: $(date)
Database: $DB_NAME
Host: $DB_HOST:$DB_PORT
Backup File: $BACKUP_FILE
Size: $BACKUP_SIZE
Status: SUCCESS
Retention: $RETENTION_DAYS days
S3 Upload: $([ -n "$S3_BUCKET" ] && echo "Enabled" || echo "Disabled")
EOF

log "Backup process completed successfully"
notify "SUCCESS" "PostgreSQL backup completed. Size: $BACKUP_SIZE"

exit 0
