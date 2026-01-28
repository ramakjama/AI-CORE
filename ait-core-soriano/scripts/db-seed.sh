#!/bin/bash

###############################################################################
# Database Seed Script
# Description: Seeds database with initial or test data
# Usage: ./db-seed.sh [development|staging|production|test]
###############################################################################

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SEEDS_DIR="$PROJECT_ROOT/seeds"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

ENV="${1:-development}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ait_core}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

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

execute_sql() {
    local sql="$1"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$sql"
}

execute_sql_file() {
    local file="$1"
    log_info "Executing: $(basename $file)"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
}

# Confirmation for production
confirm_production() {
    if [ "$ENV" = "production" ]; then
        log_warning "You are about to seed the PRODUCTION database!"
        read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Seeding cancelled"
            exit 0
        fi
    fi
}

# Create seed files
create_seed_structure() {
    mkdir -p "$SEEDS_DIR"/{common,development,staging,production,test}

    # Common seeds (run in all environments)
    cat > "$SEEDS_DIR/common/01_users.sql" << 'EOF'
-- Common user seeds
INSERT INTO users (email, name, role, status, created_at) VALUES
    ('admin@ait-core.com', 'System Admin', 'admin', 'active', NOW()),
    ('support@ait-core.com', 'Support Team', 'support', 'active', NOW())
ON CONFLICT (email) DO NOTHING;
EOF

    cat > "$SEEDS_DIR/common/02_settings.sql" << 'EOF'
-- System settings
INSERT INTO system_settings (key, value, description) VALUES
    ('maintenance_mode', 'false', 'System maintenance mode'),
    ('max_upload_size', '10485760', 'Maximum upload size in bytes'),
    ('session_timeout', '3600', 'Session timeout in seconds')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
EOF

    # Development seeds
    cat > "$SEEDS_DIR/development/01_test_users.sql" << 'EOF'
-- Development test users
INSERT INTO users (email, name, role, status, created_at) VALUES
    ('dev1@test.com', 'Developer 1', 'developer', 'active', NOW()),
    ('dev2@test.com', 'Developer 2', 'developer', 'active', NOW()),
    ('test@test.com', 'Test User', 'user', 'active', NOW())
ON CONFLICT (email) DO NOTHING;
EOF

    cat > "$SEEDS_DIR/development/02_sample_data.sql" << 'EOF'
-- Sample data for development
INSERT INTO organizations (name, slug, status, created_at) VALUES
    ('Test Organization', 'test-org', 'active', NOW()),
    ('Demo Company', 'demo-company', 'active', NOW())
ON CONFLICT (slug) DO NOTHING;
EOF

    # Test seeds (for automated testing)
    cat > "$SEEDS_DIR/test/01_test_fixtures.sql" << 'EOF'
-- Test fixtures
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE organizations CASCADE;

INSERT INTO users (id, email, name, role, status) VALUES
    (1, 'test@example.com', 'Test User', 'user', 'active'),
    (2, 'admin@example.com', 'Test Admin', 'admin', 'active');

INSERT INTO organizations (id, name, slug, status) VALUES
    (1, 'Test Org', 'test-org', 'active');
EOF

    log_success "Seed structure created at $SEEDS_DIR"
}

# Run seeds
run_seeds() {
    confirm_production

    mkdir -p "$SEEDS_DIR"

    log_info "Seeding database for environment: $ENV"
    log_info "Database: $DB_NAME@$DB_HOST:$DB_PORT"

    local seed_count=0

    # Run common seeds first
    if [ -d "$SEEDS_DIR/common" ]; then
        log_info "Running common seeds..."
        for seed_file in "$SEEDS_DIR/common"/*.sql; do
            [ -e "$seed_file" ] || continue
            execute_sql_file "$seed_file"
            seed_count=$((seed_count + 1))
        done
    fi

    # Run environment-specific seeds
    if [ -d "$SEEDS_DIR/$ENV" ]; then
        log_info "Running $ENV seeds..."
        for seed_file in "$SEEDS_DIR/$ENV"/*.sql; do
            [ -e "$seed_file" ] || continue
            execute_sql_file "$seed_file"
            seed_count=$((seed_count + 1))
        done
    else
        log_warning "No seeds found for environment: $ENV"
    fi

    if [ $seed_count -eq 0 ]; then
        log_warning "No seed files executed"
        log_info "Run with --init to create seed structure"
    else
        log_success "Executed $seed_count seed file(s)"
    fi
}

# Main
main() {
    case "${1:-seed}" in
        --init)
            create_seed_structure
            ;;
        development|staging|production|test)
            ENV="$1"
            run_seeds
            ;;
        seed)
            run_seeds
            ;;
        *)
            echo "Usage: $0 [development|staging|production|test|--init]"
            echo ""
            echo "Options:"
            echo "  --init              - Create seed directory structure"
            echo "  development         - Seed development database"
            echo "  staging             - Seed staging database"
            echo "  production          - Seed production database"
            echo "  test                - Seed test database"
            exit 1
            ;;
    esac
}

main "$@"
