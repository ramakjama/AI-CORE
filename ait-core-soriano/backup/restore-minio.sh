#!/bin/bash
################################################################################
# MinIO Restore Script
# Restore MinIO buckets from backup
################################################################################

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup/minio}"
MINIO_ALIAS="${MINIO_ALIAS:-local}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://localhost:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-aitcore}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-aitcore2024}"
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

Restore MinIO buckets from backup.

Arguments:
  BACKUP_FILE    Path to backup tarball (optional). If not provided, restores all latest.

Environment Variables:
  BACKUP_DIR       Backup directory (default: /backup/minio)
  MINIO_ENDPOINT   MinIO endpoint (default: http://localhost:9000)
  MINIO_ACCESS_KEY MinIO access key
  MINIO_SECRET_KEY MinIO secret key
  S3_BUCKET        S3 bucket for remote backups (optional)

Examples:
  # Restore all buckets from latest backups
  $0

  # Restore specific bucket
  $0 /backup/minio/my-bucket_20260128_120000.tar.gz
EOF
    exit 1
}

if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
    usage
fi

log "Starting MinIO restore process"

# Configure MinIO client
log "Configuring MinIO client"
mc alias set "$MINIO_ALIAS" "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" > /dev/null

# Test connection
if ! mc admin info "$MINIO_ALIAS" > /dev/null 2>&1; then
    log "ERROR: Cannot connect to MinIO at $MINIO_ENDPOINT"
    exit 1
fi

# Restore specific file or all latest backups
if [ -n "$BACKUP_FILE" ]; then
    # Restore single backup
    if [ ! -f "$BACKUP_FILE" ]; then
        if [ -n "$S3_BUCKET" ]; then
            log "Downloading from S3: s3://$S3_BUCKET/minio/$BACKUP_FILE"
            aws s3 cp "s3://$S3_BUCKET/minio/$BACKUP_FILE" "$BACKUP_DIR/$BACKUP_FILE"
            BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
        else
            log "ERROR: Backup file not found: $BACKUP_FILE"
            exit 1
        fi
    fi

    # Extract bucket name from filename
    BUCKET_NAME=$(basename "$BACKUP_FILE" | sed 's/_[0-9]\{8\}_[0-9]\{6\}\.tar\.gz$//')

    log "Restoring bucket: $BUCKET_NAME from $BACKUP_FILE"

    # Extract to temporary directory
    TEMP_DIR="$BACKUP_DIR/restore_temp"
    mkdir -p "$TEMP_DIR"
    tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

    # Create bucket if not exists
    mc mb "$MINIO_ALIAS/$BUCKET_NAME" 2>/dev/null || true

    # Mirror to MinIO
    mc mirror "$TEMP_DIR/${BUCKET_NAME}_"* "$MINIO_ALIAS/$BUCKET_NAME" --overwrite

    # Cleanup
    rm -rf "$TEMP_DIR"

    log "Bucket $BUCKET_NAME restored successfully"
else
    # Restore all latest backups
    log "Restoring all buckets from latest backups"

    # Find all unique bucket names
    BUCKETS=$(find "$BACKUP_DIR" -name "*.tar.gz" -type f -printf '%f\n' | \
              sed 's/_[0-9]\{8\}_[0-9]\{6\}\.tar\.gz$//' | sort -u)

    for BUCKET in $BUCKETS; do
        # Find latest backup for this bucket
        LATEST=$(find "$BACKUP_DIR" -name "${BUCKET}_*.tar.gz" -type f -printf '%T@ %p\n' | \
                 sort -rn | head -1 | cut -d' ' -f2-)

        if [ -n "$LATEST" ]; then
            log "Restoring bucket: $BUCKET"

            TEMP_DIR="$BACKUP_DIR/restore_temp_${BUCKET}"
            mkdir -p "$TEMP_DIR"
            tar -xzf "$LATEST" -C "$TEMP_DIR"

            mc mb "$MINIO_ALIAS/$BUCKET" 2>/dev/null || true
            mc mirror "$TEMP_DIR/${BUCKET}_"* "$MINIO_ALIAS/$BUCKET" --overwrite

            rm -rf "$TEMP_DIR"

            log "✓ Bucket $BUCKET restored"
        fi
    done
fi

# Restore MinIO configuration if available
CONFIG_LATEST=$(find "$BACKUP_DIR" -name "minio_config_*.json" -type f -printf '%T@ %p\n' | \
                sort -rn | head -1 | cut -d' ' -f2-)

if [ -n "$CONFIG_LATEST" ]; then
    log "Restoring MinIO configuration from $CONFIG_LATEST"
    mc admin config import "$MINIO_ALIAS" < "$CONFIG_LATEST" || log "Warning: Config restore failed"
fi

log "=========================================="
log "MinIO restore completed successfully"
log "=========================================="

exit 0
