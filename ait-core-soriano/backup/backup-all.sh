#!/bin/bash
################################################################################
# Master Backup Script
# Orchestrates all backup operations for AIT-CORE system
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_ROOT="${BACKUP_ROOT:-/backup}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$BACKUP_ROOT/master_backup_${TIMESTAMP}.log"
FAILED_SERVICES=()

# Create backup root directory
mkdir -p "$BACKUP_ROOT"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Run backup script with error handling
run_backup() {
    local service=$1
    local script=$2

    log "=========================================="
    log "Starting backup for: $service"
    log "=========================================="

    if [ -f "$SCRIPT_DIR/$script" ]; then
        if bash "$SCRIPT_DIR/$script" 2>&1 | tee -a "$LOG_FILE"; then
            log "✓ $service backup completed successfully"
            return 0
        else
            log "✗ $service backup FAILED"
            FAILED_SERVICES+=("$service")
            return 1
        fi
    else
        log "WARNING: Backup script not found: $script"
        return 1
    fi
}

log "=========================================="
log "AIT-CORE MASTER BACKUP STARTED"
log "=========================================="
log "Timestamp: $(date)"
log "Backup Root: $BACKUP_ROOT"

# Run all backup scripts
run_backup "PostgreSQL" "backup-postgres.sh" || true
run_backup "Redis" "backup-redis.sh" || true
run_backup "MinIO/S3" "backup-minio.sh" || true
run_backup "Elasticsearch" "backup-elasticsearch.sh" || true

# Generate summary report
log "=========================================="
log "BACKUP SUMMARY"
log "=========================================="

if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
    log "✓ All backups completed successfully"
    EXIT_CODE=0
else
    log "✗ The following services failed:"
    for service in "${FAILED_SERVICES[@]}"; do
        log "  - $service"
    done
    EXIT_CODE=1
fi

log "Backup logs saved to: $LOG_FILE"
log "=========================================="
log "MASTER BACKUP COMPLETED"
log "=========================================="

# Send notification if webhook is configured
if [ -n "${SLACK_WEBHOOK:-}" ]; then
    if [ $EXIT_CODE -eq 0 ]; then
        STATUS="SUCCESS"
        MESSAGE="All AIT-CORE backups completed successfully"
    else
        STATUS="PARTIAL FAILURE"
        MESSAGE="Some backups failed: ${FAILED_SERVICES[*]}"
    fi

    curl -X POST "$SLACK_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"[$STATUS] AIT-CORE Master Backup: $MESSAGE\"}" \
        2>/dev/null || true
fi

exit $EXIT_CODE
