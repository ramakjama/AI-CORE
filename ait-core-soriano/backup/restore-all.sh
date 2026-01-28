#!/bin/bash
################################################################################
# Master Restore Script
# Complete system restore for disaster recovery
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_ROOT="${BACKUP_ROOT:-/backup}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$BACKUP_ROOT/restore_${TIMESTAMP}.log"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Usage
usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Complete system restore for AIT-CORE disaster recovery.

Options:
  -p    Restore PostgreSQL
  -r    Restore Redis
  -m    Restore MinIO/S3
  -e    Restore Elasticsearch
  -a    Restore all services (default)
  -h    Show this help message

Environment Variables:
  BACKUP_ROOT    Root backup directory (default: /backup)

Examples:
  # Restore all services
  $0 -a

  # Restore only PostgreSQL and Redis
  $0 -p -r

  # Full disaster recovery
  ./restore-all.sh -a
EOF
    exit 1
}

# Parse options
RESTORE_ALL=true
RESTORE_POSTGRES=false
RESTORE_REDIS=false
RESTORE_MINIO=false
RESTORE_ELASTICSEARCH=false

while getopts "prmeath" opt; do
    case $opt in
        p) RESTORE_POSTGRES=true; RESTORE_ALL=false ;;
        r) RESTORE_REDIS=true; RESTORE_ALL=false ;;
        m) RESTORE_MINIO=true; RESTORE_ALL=false ;;
        e) RESTORE_ELASTICSEARCH=true; RESTORE_ALL=false ;;
        a) RESTORE_ALL=true ;;
        h) usage ;;
        *) usage ;;
    esac
done

if [ "$RESTORE_ALL" = true ]; then
    RESTORE_POSTGRES=true
    RESTORE_REDIS=true
    RESTORE_MINIO=true
    RESTORE_ELASTICSEARCH=true
fi

log "=========================================="
log "AIT-CORE DISASTER RECOVERY RESTORE"
log "=========================================="
log "Timestamp: $(date)"
log "Backup Root: $BACKUP_ROOT"

# Confirmation
log "WARNING: This will restore the entire AIT-CORE system"
log "Services to restore:"
[ "$RESTORE_POSTGRES" = true ] && log "  - PostgreSQL"
[ "$RESTORE_REDIS" = true ] && log "  - Redis"
[ "$RESTORE_MINIO" = true ] && log "  - MinIO/S3"
[ "$RESTORE_ELASTICSEARCH" = true ] && log "  - Elasticsearch"

if [ -t 0 ]; then
    read -p "Do you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "Restore cancelled by user"
        exit 0
    fi
fi

# Stop all services
log "Stopping AIT-CORE services"
docker-compose down || log "Warning: Could not stop docker services"

# Restore services
FAILED_SERVICES=()

if [ "$RESTORE_POSTGRES" = true ]; then
    log "=========================================="
    log "Restoring PostgreSQL"
    log "=========================================="
    if bash "$SCRIPT_DIR/restore-postgres.sh"; then
        log "✓ PostgreSQL restore completed"
    else
        log "✗ PostgreSQL restore FAILED"
        FAILED_SERVICES+=("PostgreSQL")
    fi
fi

if [ "$RESTORE_REDIS" = true ]; then
    log "=========================================="
    log "Restoring Redis"
    log "=========================================="
    if bash "$SCRIPT_DIR/restore-redis.sh"; then
        log "✓ Redis restore completed"
    else
        log "✗ Redis restore FAILED"
        FAILED_SERVICES+=("Redis")
    fi
fi

if [ "$RESTORE_MINIO" = true ]; then
    log "=========================================="
    log "Restoring MinIO/S3"
    log "=========================================="
    if bash "$SCRIPT_DIR/restore-minio.sh"; then
        log "✓ MinIO restore completed"
    else
        log "✗ MinIO restore FAILED"
        FAILED_SERVICES+=("MinIO")
    fi
fi

if [ "$RESTORE_ELASTICSEARCH" = true ]; then
    log "=========================================="
    log "Restoring Elasticsearch"
    log "=========================================="
    if bash "$SCRIPT_DIR/restore-elasticsearch.sh"; then
        log "✓ Elasticsearch restore completed"
    else
        log "✗ Elasticsearch restore FAILED"
        FAILED_SERVICES+=("Elasticsearch")
    fi
fi

# Restart services
log "=========================================="
log "Restarting AIT-CORE services"
log "=========================================="
docker-compose up -d

# Wait for services to be healthy
log "Waiting for services to become healthy..."
sleep 10

# Verify services
log "Verifying services..."
docker-compose ps

# Summary
log "=========================================="
log "RESTORE SUMMARY"
log "=========================================="

if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
    log "✓ All services restored successfully"
    log "System is ready for operation"
    EXIT_CODE=0
else
    log "✗ The following services failed to restore:"
    for service in "${FAILED_SERVICES[@]}"; do
        log "  - $service"
    done
    log "Please check the logs and restore manually if needed"
    EXIT_CODE=1
fi

log "Restore logs saved to: $LOG_FILE"
log "=========================================="
log "DISASTER RECOVERY COMPLETED"
log "=========================================="

exit $EXIT_CODE
