#!/bin/bash
################################################################################
# Elasticsearch Backup Script
# Automated snapshot backup for AIT-CORE Elasticsearch
################################################################################

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup/elasticsearch}"
ES_HOST="${ES_HOST:-localhost}"
ES_PORT="${ES_PORT:-9200}"
REPO_NAME="${ES_REPO_NAME:-ait_backup}"
SNAPSHOT_PREFIX="${SNAPSHOT_PREFIX:-snapshot}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SNAPSHOT_NAME="${SNAPSHOT_PREFIX}_${TIMESTAMP}"
S3_BUCKET="${S3_BUCKET:-}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$BACKUP_DIR/backup.log"
}

ES_URL="http://${ES_HOST}:${ES_PORT}"

log "Starting Elasticsearch backup"

# Check Elasticsearch connectivity
if ! curl -sf "$ES_URL/_cluster/health" > /dev/null; then
    log "ERROR: Cannot connect to Elasticsearch at $ES_URL"
    exit 1
fi

# Register snapshot repository if not exists
log "Checking snapshot repository: $REPO_NAME"
if ! curl -sf "$ES_URL/_snapshot/$REPO_NAME" > /dev/null 2>&1; then
    log "Creating snapshot repository: $REPO_NAME"
    curl -X PUT "$ES_URL/_snapshot/$REPO_NAME" \
        -H 'Content-Type: application/json' \
        -d "{
            \"type\": \"fs\",
            \"settings\": {
                \"location\": \"$BACKUP_DIR\",
                \"compress\": true
            }
        }"
fi

# Create snapshot
log "Creating snapshot: $SNAPSHOT_NAME"
curl -X PUT "$ES_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME?wait_for_completion=true" \
    -H 'Content-Type: application/json' \
    -d '{
        "indices": "*",
        "ignore_unavailable": true,
        "include_global_state": true
    }' | tee -a "$BACKUP_DIR/backup.log"

# Verify snapshot
log "Verifying snapshot"
SNAPSHOT_INFO=$(curl -sf "$ES_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME")
SNAPSHOT_STATE=$(echo "$SNAPSHOT_INFO" | grep -o '"state":"[^"]*"' | cut -d'"' -f4)

if [ "$SNAPSHOT_STATE" == "SUCCESS" ]; then
    log "Snapshot created successfully: $SNAPSHOT_NAME"
else
    log "ERROR: Snapshot failed with state: $SNAPSHOT_STATE"
    exit 1
fi

# Export snapshot info
echo "$SNAPSHOT_INFO" > "$BACKUP_DIR/${SNAPSHOT_NAME}_info.json"

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ]; then
    log "Uploading to S3: s3://$S3_BUCKET/elasticsearch/"

    # Create tarball of snapshot
    TARBALL="${SNAPSHOT_NAME}.tar.gz"
    tar -czf "$BACKUP_DIR/$TARBALL" -C "$BACKUP_DIR" indices

    aws s3 cp "$BACKUP_DIR/$TARBALL" "s3://$S3_BUCKET/elasticsearch/$TARBALL"
    aws s3 cp "$BACKUP_DIR/${SNAPSHOT_NAME}_info.json" \
        "s3://$S3_BUCKET/elasticsearch/${SNAPSHOT_NAME}_info.json"

    rm "$BACKUP_DIR/$TARBALL"
    log "S3 upload completed"
fi

# Cleanup old snapshots
log "Cleaning up snapshots older than $RETENTION_DAYS days"
CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)

curl -sf "$ES_URL/_snapshot/$REPO_NAME/_all" | \
    grep -o '"snapshot":"[^"]*"' | cut -d'"' -f4 | \
    while read -r snapshot; do
        if [[ $snapshot =~ ${SNAPSHOT_PREFIX}_([0-9]{8})_ ]]; then
            SNAPSHOT_DATE="${BASH_REMATCH[1]}"
            if [ "$SNAPSHOT_DATE" -lt "$CUTOFF_DATE" ]; then
                log "Deleting old snapshot: $snapshot"
                curl -X DELETE "$ES_URL/_snapshot/$REPO_NAME/$snapshot"
            fi
        fi
    done

log "Elasticsearch backup completed successfully"

exit 0
