#!/bin/bash
################################################################################
# MinIO/S3 Backup Script
# Sync MinIO data to external S3 bucket for disaster recovery
################################################################################

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup/minio}"
MINIO_ALIAS="${MINIO_ALIAS:-local}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://localhost:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-aitcore}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-aitcore2024}"
S3_BUCKET="${S3_BUCKET:-}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$BACKUP_DIR/backup.log"
}

log "Starting MinIO backup"

# Configure MinIO client
log "Configuring MinIO client"
mc alias set "$MINIO_ALIAS" "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" > /dev/null

# Test connection
if ! mc admin info "$MINIO_ALIAS" > /dev/null 2>&1; then
    log "ERROR: Cannot connect to MinIO at $MINIO_ENDPOINT"
    exit 1
fi

# List all buckets
BUCKETS=$(mc ls "$MINIO_ALIAS" | awk '{print $NF}' | tr -d '/')

log "Found buckets: $BUCKETS"

# Backup each bucket
for BUCKET in $BUCKETS; do
    log "Backing up bucket: $BUCKET"

    BUCKET_BACKUP_DIR="$BACKUP_DIR/${BUCKET}_${TIMESTAMP}"
    mkdir -p "$BUCKET_BACKUP_DIR"

    # Mirror bucket to local directory
    mc mirror "$MINIO_ALIAS/$BUCKET" "$BUCKET_BACKUP_DIR" --remove > /dev/null

    # Create tarball
    TARBALL="${BUCKET}_${TIMESTAMP}.tar.gz"
    log "Creating tarball: $TARBALL"
    tar -czf "$BACKUP_DIR/$TARBALL" -C "$BACKUP_DIR" "${BUCKET}_${TIMESTAMP}"

    # Remove temporary directory
    rm -rf "$BUCKET_BACKUP_DIR"

    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$TARBALL" | cut -f1)
    log "Bucket $BUCKET backup completed. Size: $BACKUP_SIZE"

    # Create checksum
    md5sum "$BACKUP_DIR/$TARBALL" > "$BACKUP_DIR/$TARBALL.md5"

    # Upload to S3 if configured
    if [ -n "$S3_BUCKET" ]; then
        log "Uploading to S3: s3://$S3_BUCKET/minio/"
        aws s3 cp "$BACKUP_DIR/$TARBALL" "s3://$S3_BUCKET/minio/$TARBALL" \
            --storage-class STANDARD_IA
        aws s3 cp "$BACKUP_DIR/$TARBALL.md5" "s3://$S3_BUCKET/minio/$TARBALL.md5"
        log "S3 upload completed for bucket: $BUCKET"
    fi
done

# Export MinIO configuration
log "Exporting MinIO configuration"
mc admin config export "$MINIO_ALIAS" > "$BACKUP_DIR/minio_config_${TIMESTAMP}.json"

if [ -n "$S3_BUCKET" ]; then
    aws s3 cp "$BACKUP_DIR/minio_config_${TIMESTAMP}.json" \
        "s3://$S3_BUCKET/minio/configs/minio_config_${TIMESTAMP}.json"
fi

# Cleanup old backups
log "Cleaning up backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.tar.gz.md5" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "minio_config_*.json" -type f -mtime +$RETENTION_DAYS -delete

log "MinIO backup completed successfully"

exit 0
