#!/bin/bash

###############################################################################
# Log Analyzer Script
# Description: Analyzes application logs for errors, patterns, and insights
# Usage: ./log-analyzer.sh [--errors] [--stats] [--tail] [--export]
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${LOG_DIR:-$PROJECT_ROOT/logs}"

# Options
SHOW_ERRORS=false
SHOW_STATS=false
TAIL_MODE=false
EXPORT_MODE=false
TIME_RANGE="24h"

for arg in "$@"; do
    case $arg in
        --errors) SHOW_ERRORS=true ;;
        --stats) SHOW_STATS=true ;;
        --tail) TAIL_MODE=true ;;
        --export) EXPORT_MODE=true ;;
        --1h) TIME_RANGE="1h" ;;
        --24h) TIME_RANGE="24h" ;;
        --7d) TIME_RANGE="7d" ;;
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

log_section() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Get time filter
get_time_filter() {
    case $TIME_RANGE in
        1h)
            echo "-mmin -60"
            ;;
        24h)
            echo "-mtime -1"
            ;;
        7d)
            echo "-mtime -7"
            ;;
        *)
            echo "-mtime -1"
            ;;
    esac
}

# Analyze errors
analyze_errors() {
    log_section "ERROR ANALYSIS (Last $TIME_RANGE)"

    if [ ! -d "$LOG_DIR" ]; then
        log_info "Log directory not found: $LOG_DIR"
        return
    fi

    local time_filter=$(get_time_filter)

    # Count errors by level
    echo ""
    echo "Error Levels:"
    find "$LOG_DIR" -name "*.log" -type f $time_filter -exec grep -i "error\|fatal\|critical" {} \; 2>/dev/null | \
        awk '{print $1}' | sort | uniq -c | sort -rn

    # Top error messages
    echo ""
    echo "Top 10 Error Messages:"
    find "$LOG_DIR" -name "*.log" -type f $time_filter -exec grep -iE "error|exception" {} \; 2>/dev/null | \
        sed 's/.*error[: ]*//' | sed 's/.*exception[: ]*//' | \
        sort | uniq -c | sort -rn | head -10

    # Errors by hour
    echo ""
    echo "Errors by Hour (Last 24h):"
    find "$LOG_DIR" -name "*.log" -type f -mtime -1 -exec grep -iE "error|exception" {} \; 2>/dev/null | \
        awk '{print substr($2,1,2)}' | sort | uniq -c | \
        awk '{printf "%02d:00 - %3d errors\n", $2, $1}'

    # Recent critical errors
    echo ""
    echo "Recent Critical Errors:"
    find "$LOG_DIR" -name "*.log" -type f -mtime -1 -exec grep -iE "critical|fatal" {} \; 2>/dev/null | tail -10
}

# Generate statistics
generate_stats() {
    log_section "LOG STATISTICS (Last $TIME_RANGE)"

    if [ ! -d "$LOG_DIR" ]; then
        log_info "Log directory not found: $LOG_DIR"
        return
    fi

    local time_filter=$(get_time_filter)

    # File statistics
    echo ""
    echo "Log Files:"
    printf "%-40s %10s %15s\n" "FILE" "SIZE" "LINES"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    find "$LOG_DIR" -name "*.log" -type f $time_filter | while read -r file; do
        local filename=$(basename "$file")
        local size=$(du -h "$file" | cut -f1)
        local lines=$(wc -l < "$file")

        printf "%-40s %10s %15s\n" "$filename" "$size" "$lines"
    done

    # Log level distribution
    echo ""
    echo "Log Level Distribution:"
    find "$LOG_DIR" -name "*.log" -type f $time_filter -exec grep -oE "INFO|WARN|ERROR|DEBUG|FATAL" {} \; 2>/dev/null | \
        sort | uniq -c | sort -rn | \
        awk '{printf "  %-10s: %6d\n", $2, $1}'

    # HTTP Status Codes (if present)
    echo ""
    echo "HTTP Status Codes:"
    find "$LOG_DIR" -name "*.log" -type f $time_filter -exec grep -oE "HTTP/[0-9.]+ [0-9]{3}" {} \; 2>/dev/null | \
        awk '{print $2}' | sort | uniq -c | sort -rn | head -10 | \
        awk '{printf "  %s: %6d\n", $2, $1}'

    # Response times (if present)
    echo ""
    echo "Average Response Times:"
    find "$LOG_DIR" -name "*.log" -type f $time_filter -exec grep -oE "response_time[=:] *[0-9]+" {} \; 2>/dev/null | \
        awk '{sum+=$2; count++} END {if(count>0) printf "  Average: %.2f ms\n  Count: %d\n", sum/count, count; else print "  No data available"}'

    # Most active endpoints
    echo ""
    echo "Top 10 Endpoints:"
    find "$LOG_DIR" -name "*.log" -type f $time_filter -exec grep -oE "(GET|POST|PUT|DELETE|PATCH) [^ ]+" {} \; 2>/dev/null | \
        sort | uniq -c | sort -rn | head -10 | \
        awk '{printf "  %-50s: %6d\n", $2" "$3, $1}'
}

# Tail logs in real-time
tail_logs() {
    log_section "REAL-TIME LOGS"

    if [ ! -d "$LOG_DIR" ]; then
        log_info "Log directory not found: $LOG_DIR"
        return
    fi

    log_info "Tailing all log files (Ctrl+C to stop)..."
    echo ""

    # Find and tail all log files
    find "$LOG_DIR" -name "*.log" -type f | xargs tail -f
}

# Search logs
search_logs() {
    local pattern="$1"
    local time_filter=$(get_time_filter)

    log_section "SEARCH RESULTS: '$pattern'"

    if [ ! -d "$LOG_DIR" ]; then
        log_info "Log directory not found: $LOG_DIR"
        return
    fi

    find "$LOG_DIR" -name "*.log" -type f $time_filter -exec grep -i "$pattern" {} + 2>/dev/null | \
        awk -F: '{print $1": "$2}' | \
        tail -50
}

# Analyze slow requests
analyze_slow_requests() {
    log_section "SLOW REQUESTS ANALYSIS"

    if [ ! -d "$LOG_DIR" ]; then
        log_info "Log directory not found: $LOG_DIR"
        return
    fi

    local time_filter=$(get_time_filter)
    local threshold="${SLOW_REQUEST_MS:-1000}"

    echo "Threshold: ${threshold}ms"
    echo ""

    find "$LOG_DIR" -name "*.log" -type f $time_filter -exec grep -E "response_time|duration" {} \; 2>/dev/null | \
        awk -v threshold="$threshold" '{
            if ($0 ~ /[0-9]+/) {
                match($0, /[0-9]+/);
                duration = substr($0, RSTART, RLENGTH);
                if (duration > threshold) print $0;
            }
        }' | tail -20
}

# Analyze database queries
analyze_db_queries() {
    log_section "DATABASE QUERY ANALYSIS"

    if [ ! -d "$LOG_DIR" ]; then
        log_info "Log directory not found: $LOG_DIR"
        return
    fi

    local time_filter=$(get_time_filter)

    echo "Slow Queries:"
    find "$LOG_DIR" -name "*.log" -type f $time_filter -exec grep -i "slow query\|query took" {} \; 2>/dev/null | tail -20

    echo ""
    echo "Query Types Distribution:"
    find "$LOG_DIR" -name "*.log" -type f $time_filter -exec grep -oiE "SELECT|INSERT|UPDATE|DELETE" {} \; 2>/dev/null | \
        sort | uniq -c | sort -rn
}

# Export analysis
export_analysis() {
    local export_file="$PROJECT_ROOT/logs/analysis_$(date +%Y%m%d_%H%M%S).txt"

    log_section "EXPORTING ANALYSIS"

    log_info "Generating report..."

    {
        echo "AIT-CORE Log Analysis Report"
        echo "Generated: $(date)"
        echo "Time Range: $TIME_RANGE"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""

        analyze_errors
        echo ""

        generate_stats
        echo ""

        analyze_slow_requests
        echo ""

        analyze_db_queries

    } > "$export_file"

    log_info "Report exported to: $export_file"
}

# Cleanup old logs
cleanup_logs() {
    log_section "LOG CLEANUP"

    if [ ! -d "$LOG_DIR" ]; then
        log_info "Log directory not found: $LOG_DIR"
        return
    fi

    local retention="${LOG_RETENTION_DAYS:-30}"

    log_info "Cleaning logs older than $retention days..."

    local count=$(find "$LOG_DIR" -name "*.log" -type f -mtime +$retention | wc -l)

    if [ "$count" -gt 0 ]; then
        find "$LOG_DIR" -name "*.log" -type f -mtime +$retention -delete
        log_info "Removed $count old log file(s)"
    else
        log_info "No old logs to clean"
    fi

    # Compress old logs
    log_info "Compressing logs older than 7 days..."
    find "$LOG_DIR" -name "*.log" -type f -mtime +7 ! -name "*.gz" -exec gzip {} \; 2>/dev/null || true
}

# Main dashboard
show_dashboard() {
    clear

    log_section "AIT-CORE LOG ANALYZER DASHBOARD"

    echo ""
    generate_stats
    echo ""

    if [ "$SHOW_ERRORS" = true ]; then
        analyze_errors
        echo ""
    fi

    analyze_slow_requests
    echo ""

    log_info "Last updated: $(date)"
}

# Main
main() {
    if [ "$TAIL_MODE" = true ]; then
        tail_logs
    elif [ "$EXPORT_MODE" = true ]; then
        export_analysis
    elif [ "$SHOW_ERRORS" = true ] && [ "$SHOW_STATS" = false ]; then
        analyze_errors
    elif [ "$SHOW_STATS" = true ] && [ "$SHOW_ERRORS" = false ]; then
        generate_stats
    else
        show_dashboard
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --errors        - Show error analysis only"
    echo "  --stats         - Show statistics only"
    echo "  --tail          - Tail logs in real-time"
    echo "  --export        - Export analysis to file"
    echo "  --1h            - Analyze last 1 hour"
    echo "  --24h           - Analyze last 24 hours (default)"
    echo "  --7d            - Analyze last 7 days"
    echo "  --cleanup       - Clean up old logs"
    echo ""
    echo "Examples:"
    echo "  $0                      # Show dashboard"
    echo "  $0 --errors --24h       # Show errors from last 24h"
    echo "  $0 --tail               # Tail logs in real-time"
    echo "  $0 --export             # Export analysis report"
}

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

if [ "$1" = "--cleanup" ]; then
    cleanup_logs
    exit 0
fi

main
