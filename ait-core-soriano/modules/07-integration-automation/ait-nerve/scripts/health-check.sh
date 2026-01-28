#!/bin/bash

# AIT-NERVE Health Check Script
# Comprehensive health monitoring for deployment verification

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
API_URL=${1:-http://localhost:3000}
API_PREFIX="/api/v1"
TIMEOUT=10
MAX_RETRIES=5

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  AIT-NERVE Health Check${NC}"
echo -e "${GREEN}  URL: ${API_URL}${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if service is reachable
check_connectivity() {
    echo -n "Checking connectivity... "

    if curl -s -f -m ${TIMEOUT} "${API_URL}${API_PREFIX}/nerve/health" > /dev/null; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Check system health
check_system_health() {
    echo -n "Checking system health... "

    response=$(curl -s -m ${TIMEOUT} "${API_URL}${API_PREFIX}/nerve/health")

    if [ -z "$response" ]; then
        echo -e "${RED}✗ No response${NC}"
        return 1
    fi

    healthy=$(echo $response | jq -r '.healthy' 2>/dev/null)

    if [ "$healthy" = "true" ]; then
        echo -e "${GREEN}✓ HEALTHY${NC}"

        # Show details
        total_engines=$(echo $response | jq -r '.totalEngines')
        healthy_engines=$(echo $response | jq -r '.healthyEngines')
        unhealthy_engines=$(echo $response | jq -r '.unhealthyEngines')

        echo "  Total Engines: $total_engines"
        echo "  Healthy: $healthy_engines"
        echo "  Unhealthy: $unhealthy_engines"

        return 0
    else
        echo -e "${RED}✗ UNHEALTHY${NC}"
        echo "  Response: $response"
        return 1
    fi
}

# Check engines
check_engines() {
    echo -n "Checking engines... "

    response=$(curl -s -m ${TIMEOUT} "${API_URL}${API_PREFIX}/nerve/engines")

    if [ -z "$response" ]; then
        echo -e "${RED}✗ No response${NC}"
        return 1
    fi

    engine_count=$(echo $response | jq -r 'length' 2>/dev/null)

    if [ -n "$engine_count" ] && [ "$engine_count" -gt 0 ]; then
        echo -e "${GREEN}✓ $engine_count engines configured${NC}"

        # Show engine status
        enabled_count=$(echo $response | jq -r '[.[] | select(.enabled == true)] | length')
        echo "  Enabled engines: $enabled_count"

        return 0
    else
        echo -e "${RED}✗ No engines found${NC}"
        return 1
    fi
}

# Check metrics
check_metrics() {
    echo -n "Checking metrics... "

    response=$(curl -s -m ${TIMEOUT} "${API_URL}${API_PREFIX}/nerve/metrics/summary")

    if [ -z "$response" ]; then
        echo -e "${RED}✗ No response${NC}"
        return 1
    fi

    total_requests=$(echo $response | jq -r '.totalRequests' 2>/dev/null)

    if [ -n "$total_requests" ]; then
        echo -e "${GREEN}✓ OK${NC}"

        success_rate=$(echo $response | jq -r '.successRate')
        avg_response_time=$(echo $response | jq -r '.averageResponseTime')

        echo "  Total Requests: $total_requests"
        echo "  Success Rate: ${success_rate}%"
        echo "  Avg Response Time: ${avg_response_time}ms"

        return 0
    else
        echo -e "${YELLOW}⚠ Metrics not available${NC}"
        return 0
    fi
}

# Check WebSocket
check_websocket() {
    echo -n "Checking WebSocket... "

    # Simple check if WebSocket endpoint is accessible
    if curl -s -f -m ${TIMEOUT} "${API_URL}/nerve" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ WebSocket check inconclusive${NC}"
        return 0
    fi
}

# Check circuit breakers
check_circuit_breakers() {
    echo -n "Checking circuit breakers... "

    response=$(curl -s -m ${TIMEOUT} "${API_URL}${API_PREFIX}/nerve/circuit-breakers")

    if [ -z "$response" ]; then
        echo -e "${RED}✗ No response${NC}"
        return 1
    fi

    breakers=$(echo $response | jq -r 'length' 2>/dev/null)

    if [ -n "$breakers" ]; then
        open_count=$(echo $response | jq -r '[.[] | select(.state == "open")] | length')

        if [ "$open_count" -gt 0 ]; then
            echo -e "${YELLOW}⚠ $open_count circuit breakers open${NC}"
        else
            echo -e "${GREEN}✓ All closed${NC}"
        fi

        return 0
    else
        echo -e "${RED}✗ Unable to check${NC}"
        return 1
    fi
}

# Check documentation
check_docs() {
    echo -n "Checking API documentation... "

    if curl -s -f -m ${TIMEOUT} "${API_URL}${API_PREFIX}/docs" > /dev/null; then
        echo -e "${GREEN}✓ Available${NC}"
        echo "  URL: ${API_URL}${API_PREFIX}/docs"
        return 0
    else
        echo -e "${YELLOW}⚠ Not available${NC}"
        return 0
    fi
}

# Run all checks with retries
run_checks() {
    local retry=0
    local failed=0

    while [ $retry -lt $MAX_RETRIES ]; do
        if [ $retry -gt 0 ]; then
            echo ""
            echo -e "${YELLOW}Retry attempt $((retry + 1)) of ${MAX_RETRIES}...${NC}"
            sleep 5
        fi

        failed=0

        check_connectivity || ((failed++))
        check_system_health || ((failed++))
        check_engines || ((failed++))
        check_metrics || ((failed++))
        check_websocket || ((failed++))
        check_circuit_breakers || ((failed++))
        check_docs || ((failed++))

        if [ $failed -eq 0 ]; then
            break
        fi

        ((retry++))
    done

    echo ""
    echo -e "${GREEN}========================================${NC}"

    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}  ✓ All health checks passed!${NC}"
        echo -e "${GREEN}========================================${NC}"
        return 0
    else
        echo -e "${RED}  ✗ Health check failed!${NC}"
        echo -e "${RED}  Failed checks: $failed${NC}"
        echo -e "${RED}========================================${NC}"
        return 1
    fi
}

# Main execution
main() {
    run_checks
    exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo ""
        echo "Service is healthy and ready for traffic."
        echo ""
        echo "Quick Links:"
        echo "  - API: ${API_URL}${API_PREFIX}"
        echo "  - Health: ${API_URL}${API_PREFIX}/nerve/health"
        echo "  - Metrics: ${API_URL}${API_PREFIX}/nerve/metrics"
        echo "  - Docs: ${API_URL}${API_PREFIX}/docs"
        exit 0
    else
        echo ""
        echo "Service health check failed. Please investigate."
        exit 1
    fi
}

main
