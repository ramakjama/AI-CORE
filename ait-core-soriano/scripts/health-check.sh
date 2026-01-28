#!/bin/bash

###############################################################################
# Health Check Script
# Description: Comprehensive health monitoring for AIT-CORE platform
# Usage: ./health-check.sh [--quick] [--detailed] [--services-only]
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Options
QUICK_CHECK=false
DETAILED_CHECK=false
SERVICES_ONLY=false

for arg in "$@"; do
    case $arg in
        --quick) QUICK_CHECK=true ;;
        --detailed) DETAILED_CHECK=true ;;
        --services-only) SERVICES_ONLY=true ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Status tracking
FAILED_CHECKS=0
TOTAL_CHECKS=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

log_failure() {
    echo -e "${RED}[✗]${NC} $1"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Load environment
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Configuration
APP_URL="${APP_URL:-http://localhost:3000}"
API_URL="${API_URL:-http://localhost:4000}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ait_core}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"

# Check HTTP endpoint
check_http_endpoint() {
    local name="$1"
    local url="$2"
    local timeout="${3:-5}"

    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $timeout "$url" 2>/dev/null || echo "000")

    if [ "$status_code" -eq 200 ] || [ "$status_code" -eq 301 ] || [ "$status_code" -eq 302 ]; then
        log_success "$name: HTTP $status_code"
        return 0
    else
        log_failure "$name: HTTP $status_code (URL: $url)"
        return 1
    fi
}

# Check service port
check_port() {
    local name="$1"
    local host="$2"
    local port="$3"

    if timeout 3 bash -c "cat < /dev/null > /dev/tcp/$host/$port" 2>/dev/null; then
        log_success "$name: Port $port is open"
        return 0
    else
        log_failure "$name: Port $port is not accessible"
        return 1
    fi
}

# Check database connection
check_database() {
    log_info "Checking database connection..."

    if command -v psql &> /dev/null; then
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
            log_success "Database: Connected to $DB_NAME"

            if [ "$DETAILED_CHECK" = true ]; then
                # Get database stats
                local db_size=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | tr -d ' ')
                local connection_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '$DB_NAME';" | tr -d ' ')

                echo "    Size: $db_size"
                echo "    Active connections: $connection_count"
            fi
        else
            log_failure "Database: Cannot connect to $DB_NAME"
        fi
    else
        log_warning "Database: psql not found, skipping check"
    fi
}

# Check Redis
check_redis() {
    log_info "Checking Redis connection..."

    if command -v redis-cli &> /dev/null; then
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping &>/dev/null; then
            log_success "Redis: Connected"

            if [ "$DETAILED_CHECK" = true ]; then
                local memory=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
                local keys=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" DBSIZE | cut -d: -f2 | tr -d ' ')

                echo "    Memory used: $memory"
                echo "    Total keys: $keys"
            fi
        else
            log_failure "Redis: Cannot connect"
        fi
    else
        log_warning "Redis: redis-cli not found, skipping check"
    fi
}

# Check Docker containers
check_docker() {
    log_info "Checking Docker containers..."

    if command -v docker &> /dev/null; then
        local running=$(docker ps --filter "status=running" --format "{{.Names}}" | grep -E "ait-core|postgres|redis" || true)

        if [ -n "$running" ]; then
            log_success "Docker: Running containers found"

            if [ "$DETAILED_CHECK" = true ]; then
                echo ""
                docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "NAME|ait-core|postgres|redis"
                echo ""
            fi
        else
            log_warning "Docker: No related containers running"
        fi
    else
        log_warning "Docker: Not installed, skipping check"
    fi
}

# Check disk space
check_disk_space() {
    log_info "Checking disk space..."

    local usage=$(df -h "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | tr -d '%')

    if [ "$usage" -lt 80 ]; then
        log_success "Disk space: ${usage}% used"
    elif [ "$usage" -lt 90 ]; then
        log_warning "Disk space: ${usage}% used (approaching limit)"
    else
        log_failure "Disk space: ${usage}% used (critical)"
    fi
}

# Check memory usage
check_memory() {
    log_info "Checking memory usage..."

    if [ -f /proc/meminfo ]; then
        local total=$(grep MemTotal /proc/meminfo | awk '{print $2}')
        local available=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
        local used=$((total - available))
        local usage=$((used * 100 / total))

        if [ "$usage" -lt 80 ]; then
            log_success "Memory: ${usage}% used"
        elif [ "$usage" -lt 90 ]; then
            log_warning "Memory: ${usage}% used (high usage)"
        else
            log_failure "Memory: ${usage}% used (critical)"
        fi
    else
        log_warning "Memory: Cannot read /proc/meminfo"
    fi
}

# Check CPU load
check_cpu_load() {
    log_info "Checking CPU load..."

    if [ -f /proc/loadavg ]; then
        local load=$(cat /proc/loadavg | awk '{print $1}')
        local cores=$(nproc)
        local load_per_core=$(echo "$load / $cores" | bc -l 2>/dev/null || echo "0")

        if (( $(echo "$load_per_core < 0.7" | bc -l) )); then
            log_success "CPU load: $load (${cores} cores)"
        elif (( $(echo "$load_per_core < 0.9" | bc -l) )); then
            log_warning "CPU load: $load (${cores} cores, high load)"
        else
            log_failure "CPU load: $load (${cores} cores, critical)"
        fi
    else
        log_warning "CPU: Cannot read load average"
    fi
}

# Check SSL certificate
check_ssl_certificate() {
    local domain="$1"

    if [ -z "$domain" ]; then
        return
    fi

    log_info "Checking SSL certificate for $domain..."

    local expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

    if [ -n "$expiry" ]; then
        local expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry" +%s 2>/dev/null)
        local now_epoch=$(date +%s)
        local days_left=$(( (expiry_epoch - now_epoch) / 86400 ))

        if [ "$days_left" -gt 30 ]; then
            log_success "SSL Certificate: Valid for $days_left days"
        elif [ "$days_left" -gt 7 ]; then
            log_warning "SSL Certificate: Expires in $days_left days"
        else
            log_failure "SSL Certificate: Expires in $days_left days (renewal needed)"
        fi
    else
        log_warning "SSL Certificate: Could not check"
    fi
}

# Check application logs for errors
check_logs() {
    log_info "Checking application logs for errors..."

    local log_dir="$PROJECT_ROOT/logs"
    if [ -d "$log_dir" ]; then
        local error_count=$(find "$log_dir" -name "*.log" -type f -mtime -1 -exec grep -i "error" {} \; 2>/dev/null | wc -l)

        if [ "$error_count" -eq 0 ]; then
            log_success "Logs: No errors in last 24 hours"
        elif [ "$error_count" -lt 10 ]; then
            log_warning "Logs: $error_count error(s) in last 24 hours"
        else
            log_failure "Logs: $error_count error(s) in last 24 hours"
        fi
    else
        log_warning "Logs: Directory not found"
    fi
}

# Check API health endpoint
check_api_health() {
    log_info "Checking API health endpoints..."

    check_http_endpoint "API Health" "$API_URL/health"
    check_http_endpoint "API Status" "$API_URL/api/status"
}

# Check web application
check_web_app() {
    log_info "Checking web application..."

    check_http_endpoint "Web App" "$APP_URL"
}

# Check required services
check_services() {
    log_info "Checking required services..."

    # Check PostgreSQL
    check_port "PostgreSQL" "$DB_HOST" "$DB_PORT"

    # Check Redis
    check_port "Redis" "$REDIS_HOST" "$REDIS_PORT"

    # Check API
    local api_host=$(echo "$API_URL" | sed -e 's|^http[s]*://||' -e 's|/.*||')
    local api_port=$(echo "$API_URL" | grep -oP ':\K\d+' || echo "80")
    check_port "API Service" "$api_host" "$api_port"
}

# Generate health report
generate_report() {
    echo ""
    log_info "=========================================="
    log_info "Health Check Summary"
    log_info "=========================================="

    local passed=$((TOTAL_CHECKS - FAILED_CHECKS))
    local pass_rate=$((passed * 100 / TOTAL_CHECKS))

    echo "Total checks: $TOTAL_CHECKS"
    echo "Passed: $passed"
    echo "Failed: $FAILED_CHECKS"
    echo "Pass rate: ${pass_rate}%"

    log_info "=========================================="

    if [ $FAILED_CHECKS -eq 0 ]; then
        log_success "All health checks passed!"
        return 0
    else
        log_failure "$FAILED_CHECKS check(s) failed"
        return 1
    fi
}

# Main
main() {
    log_info "=========================================="
    log_info "AIT-CORE Health Check"
    log_info "=========================================="
    log_info "Timestamp: $(date)"
    log_info "=========================================="
    echo ""

    if [ "$SERVICES_ONLY" = true ]; then
        check_services
    elif [ "$QUICK_CHECK" = true ]; then
        check_web_app
        check_api_health
        check_database
        check_disk_space
    else
        check_services
        check_database
        check_redis
        check_web_app
        check_api_health
        check_docker
        check_disk_space
        check_memory
        check_cpu_load
        check_logs

        if [ "$DETAILED_CHECK" = true ]; then
            check_ssl_certificate "$(echo $APP_URL | sed 's|https://||' | cut -d/ -f1)"
        fi
    fi

    generate_report
}

# Show usage
usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --quick         - Quick health check (basic services)"
    echo "  --detailed      - Detailed health check (all metrics)"
    echo "  --services-only - Check only service ports"
    echo ""
    echo "Examples:"
    echo "  $0                  # Standard health check"
    echo "  $0 --quick          # Quick check"
    echo "  $0 --detailed       # Detailed check"
}

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

main
