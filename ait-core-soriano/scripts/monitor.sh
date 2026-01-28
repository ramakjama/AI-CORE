#!/bin/bash

###############################################################################
# Monitoring Script
# Description: Continuous monitoring with alerting
# Usage: ./monitor.sh [--interval seconds] [--alert]
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INTERVAL="${2:-60}"
ENABLE_ALERTS=false

for arg in "$@"; do
    case $arg in
        --interval) INTERVAL="${2:-60}" ;;
        --alert) ENABLE_ALERTS=true ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Send alert
send_alert() {
    local severity="$1"
    local message="$2"

    if [ "$ENABLE_ALERTS" = false ]; then
        return
    fi

    # Slack
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local emoji="⚠️"
        [ "$severity" = "critical" ] && emoji="🚨"
        [ "$severity" = "info" ] && emoji="ℹ️"

        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"$emoji $message\"}" \
            &> /dev/null
    fi

    # Email (if sendmail is available)
    if command -v sendmail &> /dev/null && [ -n "$ALERT_EMAIL" ]; then
        echo "Subject: [AIT-CORE] $severity: $message" | sendmail "$ALERT_EMAIL"
    fi
}

# Monitor metrics
monitor_metrics() {
    local health_script="$SCRIPT_DIR/health-check.sh"

    if [ ! -f "$health_script" ]; then
        log_error "Health check script not found"
        return 1
    fi

    log_info "Starting monitoring (interval: ${INTERVAL}s)"

    while true; do
        if ! bash "$health_script" --quick &>/dev/null; then
            log_error "Health check failed"
            send_alert "critical" "Health check failed on AIT-CORE"
        else
            log_info "Health check passed"
        fi

        sleep "$INTERVAL"
    done
}

log_info "=========================================="
log_info "AIT-CORE Continuous Monitoring"
log_info "=========================================="
log_info "Interval: ${INTERVAL}s"
log_info "Alerts: $ENABLE_ALERTS"
log_info "=========================================="

monitor_metrics
