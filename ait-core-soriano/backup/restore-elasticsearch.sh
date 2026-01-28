#!/bin/bash
################################################################################
# Elasticsearch Restore Script
# Restore Elasticsearch from snapshot
################################################################################

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup/elasticsearch}"
ES_HOST="${ES_HOST:-localhost}"
ES_PORT="${ES_PORT:-9200}"
REPO_NAME="${ES_REPO_NAME:-ait_backup}"
SNAPSHOT_NAME="${1:-}"
S3_BUCKET="${S3_BUCKET:-}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# Usage
usage() {
    cat <<EOF
Usage: $0 [SNAPSHOT_NAME]

Restore Elasticsearch from snapshot.

Arguments:
  SNAPSHOT_NAME  Name of snapshot to restore (optional). If not provided, uses latest.

Environment Variables:
  BACKUP_DIR    Backup directory (default: /backup/elasticsearch)
  ES_HOST       Elasticsearch host (default: localhost)
  ES_PORT       Elasticsearch port (default: 9200)
  ES_REPO_NAME  Repository name (default: ait_backup)
  S3_BUCKET     S3 bucket for remote backups (optional)

Examples:
  # Restore from latest snapshot
  $0

  # Restore specific snapshot
  $0 snapshot_20260128_120000
EOF
    exit 1
}

if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
    usage
fi

ES_URL="http://${ES_HOST}:${ES_PORT}"

log "Starting Elasticsearch restore process"

# Check Elasticsearch connectivity
if ! curl -sf "$ES_URL/_cluster/health" > /dev/null; then
    log "ERROR: Cannot connect to Elasticsearch at $ES_URL"
    exit 1
fi

# Determine snapshot to restore
if [ -z "$SNAPSHOT_NAME" ]; then
    # Find latest snapshot
    SNAPSHOT_NAME=$(curl -sf "$ES_URL/_snapshot/$REPO_NAME/_all" | \
                    grep -o '"snapshot":"[^"]*"' | cut -d'"' -f4 | sort -r | head -1)

    if [ -z "$SNAPSHOT_NAME" ]; then
        log "ERROR: No snapshots found in repository: $REPO_NAME"
        exit 1
    fi

    log "Using latest snapshot: $SNAPSHOT_NAME"
fi

# Verify snapshot exists
if ! curl -sf "$ES_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME" > /dev/null; then
    log "ERROR: Snapshot not found: $SNAPSHOT_NAME"

    if [ -n "$S3_BUCKET" ]; then
        log "Attempting to download from S3"
        aws s3 sync "s3://$S3_BUCKET/elasticsearch/" "$BACKUP_DIR/"
    else
        exit 1
    fi
fi

# Get snapshot info
SNAPSHOT_INFO=$(curl -sf "$ES_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME")
SNAPSHOT_STATE=$(echo "$SNAPSHOT_INFO" | grep -o '"state":"[^"]*"' | cut -d'"' -f4)

if [ "$SNAPSHOT_STATE" != "SUCCESS" ]; then
    log "ERROR: Snapshot is not in SUCCESS state: $SNAPSHOT_STATE"
    exit 1
fi

# Confirm restore
log "=========================================="
log "WARNING: This will close and restore all indices"
log "Snapshot: $SNAPSHOT_NAME"
log "Target: $ES_URL"
log "=========================================="

if [ -t 0 ]; then
    read -p "Continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "Restore cancelled"
        exit 0
    fi
fi

# Close all indices
log "Closing all indices"
curl -X POST "$ES_URL/_all/_close"

# Restore snapshot
log "Restoring snapshot: $SNAPSHOT_NAME"
curl -X POST "$ES_URL/_snapshot/$REPO_NAME/$SNAPSHOT_NAME/_restore?wait_for_completion=true" \
    -H 'Content-Type: application/json' \
    -d '{
        "indices": "*",
        "ignore_unavailable": true,
        "include_global_state": true
    }' | tee -a "$BACKUP_DIR/restore.log"

# Wait for cluster to be green
log "Waiting for cluster to become healthy"
for i in {1..30}; do
    HEALTH=$(curl -sf "$ES_URL/_cluster/health" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$HEALTH" == "green" ] || [ "$HEALTH" == "yellow" ]; then
        log "Cluster is $HEALTH"
        break
    fi
    log "Cluster status: $HEALTH (waiting...)"
    sleep 10
done

# Verify restore
log "Verifying restore"
INDEX_COUNT=$(curl -sf "$ES_URL/_cat/indices?h=index" | wc -l)
DOC_COUNT=$(curl -sf "$ES_URL/_cat/count?h=count")

log "Restored $INDEX_COUNT indices with $DOC_COUNT documents"

log "=========================================="
log "Elasticsearch restore completed successfully"
log "=========================================="

exit 0
