#!/bin/bash
################################################################################
# Backup Verification Script
# Verifies integrity and restorability of backups
################################################################################

set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/backup}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$BACKUP_ROOT/verification_report_${TIMESTAMP}.txt"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$REPORT_FILE"
}

log "=========================================="
log "BACKUP VERIFICATION REPORT"
log "=========================================="
log "Timestamp: $(date)"

# Verify PostgreSQL backups
log ""
log "=== PostgreSQL Backups ==="
POSTGRES_DIR="$BACKUP_ROOT/postgres"
if [ -d "$POSTGRES_DIR" ]; then
    LATEST_PG=$(find "$POSTGRES_DIR" -name "postgres_*.sql.gz" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)
    if [ -n "$LATEST_PG" ]; then
        log "Latest backup: $(basename "$LATEST_PG")"
        log "Size: $(du -h "$LATEST_PG" | cut -f1)"
        log "Date: $(stat -c %y "$LATEST_PG")"

        # Verify checksum
        if [ -f "${LATEST_PG}.md5" ]; then
            if md5sum -c "${LATEST_PG}.md5" > /dev/null 2>&1; then
                log "✓ Checksum verification: PASSED"
            else
                log "✗ Checksum verification: FAILED"
            fi
        else
            log "⚠ Checksum file not found"
        fi

        # Test gunzip
        if gunzip -t "$LATEST_PG" 2>/dev/null; then
            log "✓ Archive integrity: OK"
        else
            log "✗ Archive integrity: CORRUPTED"
        fi
    else
        log "✗ No PostgreSQL backups found"
    fi
else
    log "✗ PostgreSQL backup directory not found"
fi

# Verify Redis backups
log ""
log "=== Redis Backups ==="
REDIS_DIR="$BACKUP_ROOT/redis"
if [ -d "$REDIS_DIR" ]; then
    LATEST_REDIS=$(find "$REDIS_DIR" -name "redis_*.rdb.gz" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)
    if [ -n "$LATEST_REDIS" ]; then
        log "Latest backup: $(basename "$LATEST_REDIS")"
        log "Size: $(du -h "$LATEST_REDIS" | cut -f1)"
        log "Date: $(stat -c %y "$LATEST_REDIS")"

        if [ -f "${LATEST_REDIS}.md5" ]; then
            if md5sum -c "${LATEST_REDIS}.md5" > /dev/null 2>&1; then
                log "✓ Checksum verification: PASSED"
            else
                log "✗ Checksum verification: FAILED"
            fi
        fi

        if gunzip -t "$LATEST_REDIS" 2>/dev/null; then
            log "✓ Archive integrity: OK"
        else
            log "✗ Archive integrity: CORRUPTED"
        fi
    else
        log "✗ No Redis backups found"
    fi
else
    log "✗ Redis backup directory not found"
fi

# Verify MinIO backups
log ""
log "=== MinIO Backups ==="
MINIO_DIR="$BACKUP_ROOT/minio"
if [ -d "$MINIO_DIR" ]; then
    BACKUP_COUNT=$(find "$MINIO_DIR" -name "*.tar.gz" -type f | wc -l)
    log "Found $BACKUP_COUNT bucket backups"

    LATEST_MINIO=$(find "$MINIO_DIR" -name "*.tar.gz" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)
    if [ -n "$LATEST_MINIO" ]; then
        log "Latest backup: $(basename "$LATEST_MINIO")"
        log "Size: $(du -h "$LATEST_MINIO" | cut -f1)"
        log "Date: $(stat -c %y "$LATEST_MINIO")"

        if tar -tzf "$LATEST_MINIO" > /dev/null 2>&1; then
            log "✓ Archive integrity: OK"
        else
            log "✗ Archive integrity: CORRUPTED"
        fi
    fi
else
    log "✗ MinIO backup directory not found"
fi

# Verify Elasticsearch backups
log ""
log "=== Elasticsearch Backups ==="
ES_DIR="$BACKUP_ROOT/elasticsearch"
if [ -d "$ES_DIR" ]; then
    SNAPSHOT_COUNT=$(find "$ES_DIR" -name "snapshot_*_info.json" -type f | wc -l)
    log "Found $SNAPSHOT_COUNT snapshots"

    LATEST_ES=$(find "$ES_DIR" -name "snapshot_*_info.json" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)
    if [ -n "$LATEST_ES" ]; then
        log "Latest snapshot: $(basename "$LATEST_ES" .json)"
        log "Date: $(stat -c %y "$LATEST_ES")"

        if [ -s "$LATEST_ES" ] && cat "$LATEST_ES" | python3 -m json.tool > /dev/null 2>&1; then
            log "✓ Snapshot metadata: OK"
        else
            log "✗ Snapshot metadata: INVALID"
        fi
    fi
else
    log "✗ Elasticsearch backup directory not found"
fi

# Disk space analysis
log ""
log "=== Disk Space Analysis ==="
log "Backup directory size: $(du -sh "$BACKUP_ROOT" | cut -f1)"
df -h "$BACKUP_ROOT" | tail -1 | awk '{print "Available space: " $4 " (" $5 " used)"}'

# Check for old backups
log ""
log "=== Retention Check ==="
RETENTION_DAYS=${RETENTION_DAYS:-30}
OLD_BACKUPS=$(find "$BACKUP_ROOT" -type f \( -name "*.sql.gz" -o -name "*.rdb.gz" -o -name "*.tar.gz" \) -mtime +$RETENTION_DAYS | wc -l)
log "Backups older than $RETENTION_DAYS days: $OLD_BACKUPS"

# Summary
log ""
log "=========================================="
log "VERIFICATION SUMMARY"
log "=========================================="
log "Report saved to: $REPORT_FILE"
log "Next verification: $(date -d '+7 days' +'%Y-%m-%d %H:%M:%S')"

# Send notification if configured
if [ -n "${SLACK_WEBHOOK:-}" ]; then
    curl -X POST "$SLACK_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"Backup verification completed. Report: $REPORT_FILE\"}" \
        2>/dev/null || true
fi

exit 0
