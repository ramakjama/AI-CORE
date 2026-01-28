#!/bin/bash

###############################################################################
# Database Migration Script
# Description: Handles database schema migrations with rollback support
# Usage: ./db-migrate.sh [up|down|status|create] [migration_name]
###############################################################################

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_ROOT/migrations"
MIGRATION_TABLE="schema_migrations"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Database connection
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ait_core}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if psql is available
check_dependencies() {
    if ! command -v psql &> /dev/null; then
        log_error "psql command not found. Please install PostgreSQL client."
        exit 1
    fi
}

# Execute SQL query
execute_sql() {
    local sql="$1"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$sql"
}

# Execute SQL file
execute_sql_file() {
    local file="$1"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
}

# Initialize migration table
init_migration_table() {
    log_info "Initializing migration table..."
    execute_sql "
        CREATE TABLE IF NOT EXISTS $MIGRATION_TABLE (
            id SERIAL PRIMARY KEY,
            version VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            execution_time_ms INTEGER,
            checksum VARCHAR(64)
        );
    "
    log_success "Migration table initialized"
}

# Get applied migrations
get_applied_migrations() {
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version FROM $MIGRATION_TABLE ORDER BY version;" | tr -d ' '
}

# Create new migration
create_migration() {
    local name="$1"
    if [ -z "$name" ]; then
        log_error "Migration name is required"
        exit 1
    fi

    mkdir -p "$MIGRATIONS_DIR"

    local timestamp=$(date +%Y%m%d%H%M%S)
    local version="${timestamp}"
    local filename="${version}_${name}"

    cat > "$MIGRATIONS_DIR/${filename}.up.sql" << EOF
-- Migration: $name
-- Created: $(date)
-- Version: $version

BEGIN;

-- Add your migration SQL here

COMMIT;
EOF

    cat > "$MIGRATIONS_DIR/${filename}.down.sql" << EOF
-- Rollback: $name
-- Created: $(date)
-- Version: $version

BEGIN;

-- Add your rollback SQL here

COMMIT;
EOF

    log_success "Created migration files:"
    echo "  - $MIGRATIONS_DIR/${filename}.up.sql"
    echo "  - $MIGRATIONS_DIR/${filename}.down.sql"
}

# Run migrations
migrate_up() {
    init_migration_table

    if [ ! -d "$MIGRATIONS_DIR" ]; then
        log_warning "No migrations directory found at $MIGRATIONS_DIR"
        exit 0
    fi

    local applied_migrations=$(get_applied_migrations)
    local migration_count=0

    log_info "Checking for pending migrations..."

    for migration_file in "$MIGRATIONS_DIR"/*.up.sql; do
        [ -e "$migration_file" ] || continue

        local filename=$(basename "$migration_file")
        local version=$(echo "$filename" | cut -d'_' -f1)
        local name=$(echo "$filename" | sed "s/${version}_//" | sed 's/.up.sql$//')

        if echo "$applied_migrations" | grep -q "^${version}$"; then
            log_info "Skipping already applied migration: $version - $name"
            continue
        fi

        log_info "Applying migration: $version - $name"

        local start_time=$(date +%s%3N)

        if execute_sql_file "$migration_file"; then
            local end_time=$(date +%s%3N)
            local execution_time=$((end_time - start_time))

            # Calculate checksum
            local checksum=$(sha256sum "$migration_file" | cut -d' ' -f1)

            # Record migration
            execute_sql "INSERT INTO $MIGRATION_TABLE (version, name, execution_time_ms, checksum) VALUES ('$version', '$name', $execution_time, '$checksum');"

            log_success "Applied migration: $version - $name (${execution_time}ms)"
            migration_count=$((migration_count + 1))
        else
            log_error "Failed to apply migration: $version - $name"
            exit 1
        fi
    done

    if [ $migration_count -eq 0 ]; then
        log_info "No pending migrations"
    else
        log_success "Applied $migration_count migration(s)"
    fi
}

# Rollback migrations
migrate_down() {
    init_migration_table

    local count="${1:-1}"
    local applied_migrations=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version FROM $MIGRATION_TABLE ORDER BY version DESC LIMIT $count;")

    if [ -z "$applied_migrations" ]; then
        log_warning "No migrations to rollback"
        exit 0
    fi

    log_info "Rolling back $count migration(s)..."

    while IFS= read -r version; do
        version=$(echo "$version" | tr -d ' ')
        [ -z "$version" ] && continue

        # Find the down migration file
        local down_file=$(find "$MIGRATIONS_DIR" -name "${version}_*.down.sql" | head -1)

        if [ ! -f "$down_file" ]; then
            log_error "Rollback file not found for version: $version"
            exit 1
        fi

        local name=$(basename "$down_file" | sed "s/${version}_//" | sed 's/.down.sql$//')

        log_info "Rolling back: $version - $name"

        if execute_sql_file "$down_file"; then
            execute_sql "DELETE FROM $MIGRATION_TABLE WHERE version = '$version';"
            log_success "Rolled back: $version - $name"
        else
            log_error "Failed to rollback: $version - $name"
            exit 1
        fi
    done <<< "$applied_migrations"

    log_success "Rollback completed"
}

# Show migration status
migration_status() {
    init_migration_table

    log_info "Migration Status:"
    echo ""

    local applied_migrations=$(get_applied_migrations)

    if [ ! -d "$MIGRATIONS_DIR" ]; then
        log_warning "No migrations directory found"
        exit 0
    fi

    printf "%-20s %-40s %-10s %-20s\n" "VERSION" "NAME" "STATUS" "APPLIED_AT"
    printf "%s\n" "--------------------------------------------------------------------------------"

    for migration_file in "$MIGRATIONS_DIR"/*.up.sql; do
        [ -e "$migration_file" ] || continue

        local filename=$(basename "$migration_file")
        local version=$(echo "$filename" | cut -d'_' -f1)
        local name=$(echo "$filename" | sed "s/${version}_//" | sed 's/.up.sql$//')

        if echo "$applied_migrations" | grep -q "^${version}$"; then
            local applied_at=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT applied_at FROM $MIGRATION_TABLE WHERE version = '$version';" | tr -d ' ')
            printf "%-20s %-40s ${GREEN}%-10s${NC} %-20s\n" "$version" "$name" "APPLIED" "$applied_at"
        else
            printf "%-20s %-40s ${YELLOW}%-10s${NC} %-20s\n" "$version" "$name" "PENDING" "-"
        fi
    done
}

# Main
main() {
    check_dependencies

    local command="${1:-status}"

    case "$command" in
        up)
            migrate_up
            ;;
        down)
            migrate_down "${2:-1}"
            ;;
        status)
            migration_status
            ;;
        create)
            create_migration "$2"
            ;;
        *)
            echo "Usage: $0 {up|down|status|create} [args]"
            echo ""
            echo "Commands:"
            echo "  up              - Apply pending migrations"
            echo "  down [count]    - Rollback last N migrations (default: 1)"
            echo "  status          - Show migration status"
            echo "  create <name>   - Create new migration files"
            exit 1
            ;;
    esac
}

main "$@"
