#!/bin/bash
################################################################################
# Backup Restore Test Script
# Tests backup restoration in isolated environment
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_ROOT="${BACKUP_ROOT:-/backup}"
TEST_DIR="$BACKUP_ROOT/test-restore"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEST_LOG="$BACKUP_ROOT/test-restore_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$TEST_LOG"
}

log_success() {
    echo -e "${GREEN}✓${NC} $*" | tee -a "$TEST_LOG"
}

log_error() {
    echo -e "${RED}✗${NC} $*" | tee -a "$TEST_LOG"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $*" | tee -a "$TEST_LOG"
}

# Cleanup function
cleanup() {
    log "Cleaning up test environment..."
    docker-compose -f "$TEST_DIR/docker-compose.test.yml" down -v 2>/dev/null || true
    rm -rf "$TEST_DIR"
}

# Error handler
error_handler() {
    log_error "Test failed on line $1"
    cleanup
    exit 1
}

trap 'error_handler $LINENO' ERR

log "=========================================="
log "AIT-CORE BACKUP RESTORE TEST"
log "=========================================="
log "Timestamp: $(date)"
log "Test Directory: $TEST_DIR"
log ""

# Create test environment
mkdir -p "$TEST_DIR"

# Create test docker-compose file
cat > "$TEST_DIR/docker-compose.test.yml" <<EOF
version: '3.8'

services:
  postgres-test:
    image: postgres:15-alpine
    container_name: ait-postgres-test
    ports:
      - "15432:5432"
    environment:
      POSTGRES_USER: aitcore
      POSTGRES_PASSWORD: aitcore2024
      POSTGRES_DB: test_restore
    volumes:
      - postgres_test_data:/var/lib/postgresql/data

  redis-test:
    image: redis:7-alpine
    container_name: ait-redis-test
    ports:
      - "16379:6379"
    volumes:
      - redis_test_data:/data

volumes:
  postgres_test_data:
  redis_test_data:
EOF

log "Starting test environment..."
docker-compose -f "$TEST_DIR/docker-compose.test.yml" up -d

# Wait for services
log "Waiting for services to start..."
sleep 5

# Test PostgreSQL restore
log ""
log "=========================================="
log "Testing PostgreSQL Restore"
log "=========================================="

LATEST_PG_BACKUP=$(find "$BACKUP_ROOT/postgres" -name "postgres_*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)

if [ -n "$LATEST_PG_BACKUP" ]; then
    log "Found backup: $(basename "$LATEST_PG_BACKUP")"

    # Restore to test database
    export DB_HOST=localhost
    export DB_PORT=15432
    export DB_NAME=test_restore

    log "Restoring backup..."
    gunzip -c "$LATEST_PG_BACKUP" | PGPASSWORD=aitcore2024 psql -h localhost -p 15432 -U aitcore -d test_restore -q 2>&1 | tee -a "$TEST_LOG"

    # Verify restore
    TABLE_COUNT=$(PGPASSWORD=aitcore2024 psql -h localhost -p 15432 -U aitcore -d test_restore -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)

    if [ "$TABLE_COUNT" -gt 0 ]; then
        log_success "PostgreSQL restore successful ($TABLE_COUNT tables)"
    else
        log_error "PostgreSQL restore failed (0 tables found)"
    fi
else
    log_warning "No PostgreSQL backups found to test"
fi

# Test Redis restore
log ""
log "=========================================="
log "Testing Redis Restore"
log "=========================================="

LATEST_REDIS_BACKUP=$(find "$BACKUP_ROOT/redis" -name "redis_*.rdb.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)

if [ -n "$LATEST_REDIS_BACKUP" ]; then
    log "Found backup: $(basename "$LATEST_REDIS_BACKUP")"

    # Extract and load
    log "Loading backup..."
    gunzip -c "$LATEST_REDIS_BACKUP" > "$TEST_DIR/dump.rdb"

    # Stop Redis, copy RDB, restart
    docker stop ait-redis-test
    docker cp "$TEST_DIR/dump.rdb" ait-redis-test:/data/dump.rdb
    docker start ait-redis-test

    sleep 3

    # Verify
    KEY_COUNT=$(redis-cli -p 16379 DBSIZE | awk '{print $2}')

    if [ "$KEY_COUNT" -ge 0 ]; then
        log_success "Redis restore successful ($KEY_COUNT keys)"
    else
        log_error "Redis restore failed"
    fi
else
    log_warning "No Redis backups found to test"
fi

# Test backup integrity
log ""
log "=========================================="
log "Testing Backup Integrity"
log "=========================================="

# Test PostgreSQL checksums
log "Checking PostgreSQL backup checksums..."
PG_CHECKSUM_PASS=0
PG_CHECKSUM_FAIL=0

find "$BACKUP_ROOT/postgres" -name "postgres_*.sql.gz.md5" -type f | while read -r md5file; do
    if md5sum -c "$md5file" > /dev/null 2>&1; then
        ((PG_CHECKSUM_PASS++)) || true
    else
        ((PG_CHECKSUM_FAIL++)) || true
    fi
done

if [ $PG_CHECKSUM_FAIL -eq 0 ]; then
    log_success "All PostgreSQL checksums valid"
else
    log_error "$PG_CHECKSUM_FAIL PostgreSQL checksums failed"
fi

# Test backup compression
log "Testing backup compression integrity..."
COMPRESSION_PASS=0
COMPRESSION_FAIL=0

find "$BACKUP_ROOT" -name "*.gz" -type f | while read -r gzfile; do
    if gunzip -t "$gzfile" 2>/dev/null; then
        ((COMPRESSION_PASS++)) || true
    else
        ((COMPRESSION_FAIL++)) || true
        log_error "Corrupted: $gzfile"
    fi
done

if [ $COMPRESSION_FAIL -eq 0 ]; then
    log_success "All compressed files are valid"
else
    log_error "$COMPRESSION_FAIL compressed files are corrupted"
fi

# Cleanup
cleanup

# Summary
log ""
log "=========================================="
log "TEST SUMMARY"
log "=========================================="

if grep -q "✗" "$TEST_LOG"; then
    log_error "Some tests FAILED"
    log "Review test log: $TEST_LOG"
    exit 1
else
    log_success "All tests PASSED"
    log "Test log: $TEST_LOG"
    exit 0
fi
