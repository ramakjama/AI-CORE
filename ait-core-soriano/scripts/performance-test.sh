#!/bin/bash

###############################################################################
# Performance Testing Script
# Description: Load testing and performance benchmarking for AIT-CORE
# Usage: ./performance-test.sh [--quick] [--load] [--stress] [--report]
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
RESULTS_DIR="$PROJECT_ROOT/performance-results"

# Test modes
QUICK_TEST=false
LOAD_TEST=false
STRESS_TEST=false
GENERATE_REPORT=false

for arg in "$@"; do
    case $arg in
        --quick) QUICK_TEST=true ;;
        --load) LOAD_TEST=true ;;
        --stress) STRESS_TEST=true ;;
        --report) GENERATE_REPORT=true ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

log_section() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Load environment
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

APP_URL="${APP_URL:-http://localhost:3000}"
API_URL="${API_URL:-http://localhost:4000}"

# Create results directory
mkdir -p "$RESULTS_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."

    local missing=()

    if ! command -v curl &> /dev/null; then
        missing+=("curl")
    fi

    if ! command -v ab &> /dev/null && ! command -v wrk &> /dev/null; then
        missing+=("apache-bench or wrk")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        log_warning "Missing dependencies: ${missing[*]}"
        log_info "Install with: apt-get install apache2-utils wrk"
    fi
}

# Quick response time test
quick_test() {
    log_section "QUICK RESPONSE TIME TEST"

    local endpoints=(
        "$APP_URL/"
        "$API_URL/health"
        "$API_URL/api/status"
    )

    printf "%-50s %10s %10s\n" "ENDPOINT" "STATUS" "TIME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    for endpoint in "${endpoints[@]}"; do
        local result=$(curl -o /dev/null -s -w "%{http_code},%{time_total}" "$endpoint" 2>/dev/null || echo "000,0")
        local status=$(echo "$result" | cut -d',' -f1)
        local time=$(echo "$result" | cut -d',' -f2)
        local time_ms=$(echo "$time * 1000" | bc)

        local status_color=$GREEN
        [ "$status" != "200" ] && status_color=$RED

        local time_color=$GREEN
        (( $(echo "$time > 1.0" | bc -l) )) && time_color=$YELLOW
        (( $(echo "$time > 3.0" | bc -l) )) && time_color=$RED

        printf "%-50s ${status_color}%10s${NC} ${time_color}%8.0fms${NC}\n" "$endpoint" "$status" "$time_ms"
    done

    echo ""
}

# Load test with Apache Bench
load_test_ab() {
    log_section "LOAD TEST (Apache Bench)"

    local url="${1:-$API_URL/health}"
    local requests="${2:-1000}"
    local concurrency="${3:-10}"

    log_info "URL: $url"
    log_info "Requests: $requests"
    log_info "Concurrency: $concurrency"
    echo ""

    local output_file="$RESULTS_DIR/loadtest_ab_${TIMESTAMP}.txt"

    if command -v ab &> /dev/null; then
        ab -n "$requests" -c "$concurrency" -g "$output_file.data" "$url" | tee "$output_file"

        # Parse results
        echo ""
        log_info "Summary:"
        grep "Requests per second" "$output_file" || true
        grep "Time per request" "$output_file" || true
        grep "Failed requests" "$output_file" || true

        log_success "Results saved to: $output_file"
    else
        log_warning "Apache Bench (ab) not installed"
    fi
}

# Load test with wrk
load_test_wrk() {
    log_section "LOAD TEST (wrk)"

    local url="${1:-$API_URL/health}"
    local duration="${2:-30s}"
    local threads="${3:-4}"
    local connections="${4:-100}"

    log_info "URL: $url"
    log_info "Duration: $duration"
    log_info "Threads: $threads"
    log_info "Connections: $connections"
    echo ""

    local output_file="$RESULTS_DIR/loadtest_wrk_${TIMESTAMP}.txt"

    if command -v wrk &> /dev/null; then
        wrk -t"$threads" -c"$connections" -d"$duration" --latency "$url" | tee "$output_file"

        log_success "Results saved to: $output_file"
    else
        log_warning "wrk not installed"
    fi
}

# Stress test
stress_test() {
    log_section "STRESS TEST"

    log_warning "This will gradually increase load until failure"
    read -p "Continue? (y/N): " confirm

    if [ "$confirm" != "y" ]; then
        log_info "Stress test cancelled"
        return
    fi

    local url="${1:-$API_URL/health}"
    local max_concurrency=500
    local step=50

    for concurrency in $(seq $step $step $max_concurrency); do
        log_info "Testing with concurrency: $concurrency"

        local result=$(curl -o /dev/null -s -w "%{http_code}" "$url" 2>/dev/null || echo "000")

        if [ "$result" != "200" ]; then
            log_warning "System degraded at concurrency: $concurrency"
            break
        fi

        if command -v ab &> /dev/null; then
            ab -n $((concurrency * 10)) -c "$concurrency" "$url" > /dev/null 2>&1
        fi

        sleep 2
    done

    log_success "Stress test completed"
}

# Database performance test
db_performance_test() {
    log_section "DATABASE PERFORMANCE TEST"

    if [ -f "$PROJECT_ROOT/.env" ]; then
        export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
    fi

    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-ait_core}"
    DB_USER="${DB_USER:-postgres}"

    if ! command -v psql &> /dev/null; then
        log_warning "psql not available, skipping database test"
        return
    fi

    log_info "Testing database query performance..."

    local output_file="$RESULTS_DIR/db_performance_${TIMESTAMP}.txt"

    {
        echo "=== Database Performance Test ==="
        echo "Date: $(date)"
        echo "Database: $DB_NAME"
        echo ""

        # Test simple query
        echo "Simple SELECT (1000 iterations):"
        local start=$(date +%s%3N)
        for i in {1..1000}; do
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1
        done
        local end=$(date +%s%3N)
        local duration=$((end - start))
        echo "  Total time: ${duration}ms"
        echo "  Average: $((duration / 1000))ms per query"
        echo ""

        # Connection test
        echo "Connection overhead (100 connections):"
        start=$(date +%s%3N)
        for i in {1..100}; do
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1
        done
        end=$(date +%s%3N)
        duration=$((end - start))
        echo "  Total time: ${duration}ms"
        echo "  Average: $((duration / 100))ms per connection"

    } | tee "$output_file"

    log_success "Database test results saved to: $output_file"
}

# API endpoint benchmarking
benchmark_endpoints() {
    log_section "API ENDPOINT BENCHMARKING"

    local endpoints=(
        "$API_URL/health:GET"
        "$API_URL/api/status:GET"
    )

    local output_file="$RESULTS_DIR/benchmark_${TIMESTAMP}.csv"

    echo "endpoint,method,status,min_ms,max_ms,avg_ms,success_rate" > "$output_file"

    for endpoint_config in "${endpoints[@]}"; do
        local endpoint=$(echo "$endpoint_config" | cut -d: -f1)
        local method=$(echo "$endpoint_config" | cut -d: -f2)

        log_info "Benchmarking: $method $endpoint"

        local iterations=100
        local success=0
        local total_time=0
        local min_time=999999
        local max_time=0

        for i in $(seq 1 $iterations); do
            local start=$(date +%s%3N)
            local status=$(curl -X "$method" -o /dev/null -s -w "%{http_code}" "$endpoint" 2>/dev/null || echo "000")
            local end=$(date +%s%3N)
            local duration=$((end - start))

            [ "$status" = "200" ] && success=$((success + 1))

            total_time=$((total_time + duration))
            [ $duration -lt $min_time ] && min_time=$duration
            [ $duration -gt $max_time ] && max_time=$duration
        done

        local avg_time=$((total_time / iterations))
        local success_rate=$((success * 100 / iterations))

        echo "$endpoint,$method,200,$min_time,$max_time,$avg_time,$success_rate%" >> "$output_file"

        printf "  Min: %4dms  Max: %4dms  Avg: %4dms  Success: %3d%%\n" "$min_time" "$max_time" "$avg_time" "$success_rate"
    done

    echo ""
    log_success "Benchmark results saved to: $output_file"
}

# Memory usage test
memory_usage_test() {
    log_section "MEMORY USAGE TEST"

    log_info "Monitoring memory during load..."

    local output_file="$RESULTS_DIR/memory_${TIMESTAMP}.txt"

    {
        echo "=== Memory Usage Test ==="
        echo "Date: $(date)"
        echo ""

        if command -v docker &> /dev/null; then
            echo "Docker Container Memory:"
            docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep -E "NAME|ait-core"
        fi

        echo ""
        echo "System Memory:"
        free -h || vm_stat || true

    } | tee "$output_file"

    log_success "Memory test results saved to: $output_file"
}

# Generate performance report
generate_report() {
    log_section "GENERATING PERFORMANCE REPORT"

    local report_file="$RESULTS_DIR/report_${TIMESTAMP}.html"

    cat > "$report_file" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>AIT-CORE Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #4CAF50; color: white; }
        tr:hover { background: #f5f5f5; }
        .metric { display: inline-block; margin: 10px; padding: 20px; background: #e3f2fd; border-radius: 4px; }
        .good { color: #4CAF50; }
        .warning { color: #FF9800; }
        .bad { color: #F44336; }
    </style>
</head>
<body>
    <div class="container">
        <h1>AIT-CORE Performance Report</h1>
        <p>Generated: <strong>DATE_PLACEHOLDER</strong></p>

        <h2>Summary</h2>
        <div class="metric">
            <h3>Response Time</h3>
            <p>Average: <span class="good">RESPONSE_TIME_PLACEHOLDER ms</span></p>
        </div>
        <div class="metric">
            <h3>Throughput</h3>
            <p><span class="good">THROUGHPUT_PLACEHOLDER</span> req/sec</p>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <p><span class="good">SUCCESS_RATE_PLACEHOLDER%</span></p>
        </div>

        <h2>Test Results</h2>
        <p>Detailed results available in: <code>RESULTS_DIR_PLACEHOLDER</code></p>

        <h2>Recommendations</h2>
        <ul>
            <li>Monitor response times and set up alerts for degradation</li>
            <li>Implement caching for frequently accessed endpoints</li>
            <li>Optimize database queries identified as slow</li>
            <li>Consider horizontal scaling if load increases</li>
        </ul>
    </div>
</body>
</html>
EOF

    sed -i "s|DATE_PLACEHOLDER|$(date)|g" "$report_file"
    sed -i "s|RESULTS_DIR_PLACEHOLDER|$RESULTS_DIR|g" "$report_file"

    log_success "Report generated: $report_file"
    log_info "Open in browser: file://$report_file"
}

# Main
main() {
    log_info "=========================================="
    log_info "AIT-CORE Performance Testing"
    log_info "=========================================="
    log_info "Timestamp: $TIMESTAMP"
    log_info "Results directory: $RESULTS_DIR"
    log_info "=========================================="
    echo ""

    check_dependencies

    if [ "$QUICK_TEST" = true ]; then
        quick_test
    elif [ "$LOAD_TEST" = true ]; then
        load_test_ab "$API_URL/health" 1000 50
        load_test_wrk "$API_URL/health" "30s" 4 100
        memory_usage_test
    elif [ "$STRESS_TEST" = true ]; then
        stress_test
    elif [ "$GENERATE_REPORT" = true ]; then
        generate_report
    else
        # Full test suite
        quick_test
        echo ""
        benchmark_endpoints
        echo ""
        db_performance_test
        echo ""
        memory_usage_test
        echo ""
        generate_report
    fi

    echo ""
    log_info "=========================================="
    log_success "Performance testing completed!"
    log_info "=========================================="
}

# Show usage
usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --quick         - Quick response time test"
    echo "  --load          - Load testing with ab and wrk"
    echo "  --stress        - Stress test (gradual load increase)"
    echo "  --report        - Generate HTML report"
    echo ""
    echo "Examples:"
    echo "  $0                  # Full test suite"
    echo "  $0 --quick          # Quick test"
    echo "  $0 --load           # Load test only"
    echo "  $0 --stress         # Stress test"
}

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

main
