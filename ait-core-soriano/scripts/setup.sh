#!/bin/bash

###############################################################################
# Setup Script
# Description: Initial setup and dependency installation
# Usage: ./setup.sh
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Make all scripts executable
make_executable() {
    log_info "Making scripts executable..."
    chmod +x "$SCRIPT_DIR"/*.sh
    log_success "Scripts are now executable"
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."

    local dirs=(
        "$PROJECT_ROOT/logs"
        "$PROJECT_ROOT/backups/database"
        "$PROJECT_ROOT/backups/files"
        "$PROJECT_ROOT/backups/logs"
        "$PROJECT_ROOT/migrations"
        "$PROJECT_ROOT/seeds/common"
        "$PROJECT_ROOT/seeds/development"
        "$PROJECT_ROOT/seeds/staging"
        "$PROJECT_ROOT/seeds/production"
        "$PROJECT_ROOT/seeds/test"
        "$PROJECT_ROOT/performance-results"
    )

    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        echo "  Created: $dir"
    done

    log_success "Directories created"
}

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."

    local deps=(
        "curl:HTTP client"
        "git:Version control"
        "psql:PostgreSQL client"
        "redis-cli:Redis client"
        "docker:Container platform"
        "node:Node.js runtime"
        "pnpm:Package manager"
    )

    local missing=()

    for dep in "${deps[@]}"; do
        local cmd=$(echo "$dep" | cut -d: -f1)
        local name=$(echo "$dep" | cut -d: -f2)

        if command -v "$cmd" &> /dev/null; then
            echo -e "  ${GREEN}✓${NC} $name ($cmd)"
        else
            echo -e "  ${RED}✗${NC} $name ($cmd) - MISSING"
            missing+=("$cmd")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        log_warning "Missing dependencies: ${missing[*]}"
        log_info "Install with your package manager (apt, yum, brew, etc.)"
    else
        log_success "All dependencies installed"
    fi
}

# Create example .env file
create_env_example() {
    log_info "Creating .env.example..."

    cat > "$PROJECT_ROOT/.env.example" << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ait_core
DB_USER=postgres
DB_PASSWORD=your_password_here

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Application URLs
APP_URL=http://localhost:3000
API_URL=http://localhost:4000

# Application Settings
APP_NAME=ait-core
NODE_ENV=development

# Deployment Configuration
DEPLOY_USER=deploy
DEPLOY_HOST=
DEPLOY_PATH=/var/www/ait-core
PM2_APP_NAME=ait-core
DOCKER_COMPOSE_FILE=docker-compose.yml

# Backup Configuration
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30
MAX_BACKUPS=10
BACKUP_S3_BUCKET=

# Notification Webhooks
SLACK_WEBHOOK_URL=
DISCORD_WEBHOOK_URL=
ALERT_EMAIL=

# Logging
LOG_DIR=./logs
LOG_RETENTION_DAYS=30

# Performance
SLOW_REQUEST_MS=1000
EOF

    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        log_success "Created .env file (please configure)"
    else
        log_info ".env file already exists"
    fi

    log_success ".env.example created"
}

# Initialize git hooks (optional)
setup_git_hooks() {
    if [ ! -d "$PROJECT_ROOT/.git" ]; then
        log_info "Not a git repository, skipping hooks"
        return
    fi

    log_info "Setting up git hooks..."

    # Pre-commit hook
    cat > "$PROJECT_ROOT/.git/hooks/pre-commit" << 'EOF'
#!/bin/bash
# Pre-commit hook: Run health checks before commit

echo "Running health checks..."
./scripts/health-check.sh --quick

if [ $? -ne 0 ]; then
    echo "Health checks failed. Commit aborted."
    exit 1
fi
EOF

    chmod +x "$PROJECT_ROOT/.git/hooks/pre-commit"
    log_success "Git hooks configured"
}

# Initialize database
initialize_database() {
    read -p "Initialize database? (y/N): " confirm
    if [ "$confirm" != "y" ]; then
        log_info "Skipping database initialization"
        return
    fi

    log_info "Initializing database..."

    if [ -f "$SCRIPT_DIR/db-migrate.sh" ]; then
        bash "$SCRIPT_DIR/db-migrate.sh" up
        log_success "Database initialized"
    else
        log_warning "Migration script not found"
    fi
}

# Create sample migration
create_sample_migration() {
    log_info "Creating sample migration..."

    bash "$SCRIPT_DIR/db-migrate.sh" create initial_setup

    log_success "Sample migration created"
}

# Setup cron jobs
setup_cron() {
    read -p "Setup cron jobs? (y/N): " confirm
    if [ "$confirm" != "y" ]; then
        log_info "Skipping cron setup"
        return
    fi

    log_info "Recommended cron jobs:"
    echo ""
    cat << EOF
# Daily backup at 2 AM
0 2 * * * cd $PROJECT_ROOT && ./scripts/backup.sh --auto

# Health check every 5 minutes
*/5 * * * * cd $PROJECT_ROOT && ./scripts/health-check.sh --quick

# Log analysis daily at 6 AM
0 6 * * * cd $PROJECT_ROOT && ./scripts/log-analyzer.sh --export

# Log cleanup weekly on Sunday
0 3 * * 0 cd $PROJECT_ROOT && ./scripts/log-analyzer.sh --cleanup
EOF
    echo ""
    log_info "Add these to your crontab with: crontab -e"
}

# Print summary
print_summary() {
    echo ""
    log_info "=========================================="
    log_success "Setup completed successfully!"
    log_info "=========================================="
    echo ""
    echo "Next steps:"
    echo "  1. Configure .env file with your settings"
    echo "  2. Run: ./scripts/db-migrate.sh up"
    echo "  3. Run: ./scripts/health-check.sh"
    echo "  4. Review: ./scripts/README.md"
    echo ""
    echo "Available scripts:"
    echo "  ./scripts/db-migrate.sh      - Database migrations"
    echo "  ./scripts/db-seed.sh         - Seed database"
    echo "  ./scripts/deploy.sh          - Deploy application"
    echo "  ./scripts/backup.sh          - Create backups"
    echo "  ./scripts/restore.sh         - Restore from backup"
    echo "  ./scripts/health-check.sh    - Health monitoring"
    echo "  ./scripts/log-analyzer.sh    - Analyze logs"
    echo "  ./scripts/performance-test.sh - Performance testing"
    echo ""
    log_info "=========================================="
}

# Main
main() {
    log_info "=========================================="
    log_info "AIT-CORE Setup Script"
    log_info "=========================================="
    echo ""

    make_executable
    create_directories
    check_dependencies
    create_env_example
    setup_git_hooks
    create_sample_migration
    setup_cron

    print_summary
}

main
