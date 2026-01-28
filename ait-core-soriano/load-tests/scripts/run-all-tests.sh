#!/bin/bash

################################################################################
# Run All Load Tests Script
# Purpose: Execute complete load testing suite with reporting
# Usage: ./scripts/run-all-tests.sh [environment]
################################################################################

set -e  # Exit on error

# Configuration
ENVIRONMENT="${1:-development}"
REPORTS_DIR="./reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SUMMARY_FILE="${REPORTS_DIR}/test-suite-summary-${TIMESTAMP}.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create reports directory
mkdir -p "${REPORTS_DIR}"

echo "======================================================================"
echo "AIT-CORE Load Testing Suite"
echo "======================================================================"
echo "Environment: ${ENVIRONMENT}"
echo "Timestamp: ${TIMESTAMP}"
echo "Reports: ${REPORTS_DIR}"
echo "======================================================================"
echo ""

# Test tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

declare -a TEST_RESULTS

# Function to run a test
run_test() {
    local test_name=$1
    local test_script=$2
    local duration=$3

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo ""
    echo "${BLUE}[${TOTAL_TESTS}] Running: ${test_name}${NC}"
    echo "Script: ${test_script}"
    echo "Estimated duration: ${duration}"
    echo "----------------------------------------------------------------------"

    local start_time=$(date +%s)

    if k6 run "${test_script}"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        local status="PASSED"
        local color="${GREEN}"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        local status="FAILED"
        local color="${RED}"
    fi

    local end_time=$(date +%s)
    local actual_duration=$((end_time - start_time))

    echo ""
    echo "${color}${status}${NC} - ${test_name} (${actual_duration}s)"

    TEST_RESULTS+=("{\"name\":\"${test_name}\",\"status\":\"${status}\",\"duration\":${actual_duration}}")
}

# Function to prompt for confirmation
confirm_test() {
    local test_name=$1
    local duration=$2

    echo ""
    echo "${YELLOW}Run ${test_name}? (${duration})${NC}"
    read -p "Continue? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
        return 1
    fi
}

# Test Suite Execution

# 1. Smoke Test (Always run)
run_test "Smoke Test" "tests/smoke-test.js" "1 minute"

# 2. Authentication API Test
if confirm_test "Authentication API Test" "10 minutes"; then
    run_test "Auth API Test" "tests/api/auth-api-test.js" "10 minutes"
fi

# 3. Gateway Test
if confirm_test "Gateway Test" "10 minutes"; then
    run_test "Gateway Test" "tests/api/gateway-test.js" "10 minutes"
fi

# 4. Load Test
if confirm_test "Load Test" "16 minutes"; then
    run_test "Load Test" "tests/load-test.js" "16 minutes"
fi

# 5. Stress Test
if confirm_test "Stress Test" "26 minutes"; then
    run_test "Stress Test" "tests/stress-test.js" "26 minutes"
fi

# 6. Spike Test
if confirm_test "Spike Test" "6 minutes"; then
    run_test "Spike Test" "tests/spike-test.js" "6 minutes"
fi

# 7. Comprehensive Test
if confirm_test "Comprehensive Test" "20 minutes"; then
    run_test "Comprehensive Test" "tests/comprehensive-test.js" "20 minutes"
fi

# 8. Soak Test (Optional - takes 2+ hours)
echo ""
echo "${YELLOW}Warning: Soak Test takes 2+ hours${NC}"
if confirm_test "Soak Test" "2+ hours"; then
    run_test "Soak Test" "tests/soak-test.js" "2+ hours"
fi

# Generate Summary Report
echo ""
echo "======================================================================"
echo "Generating Summary Report"
echo "======================================================================"

cat > "${SUMMARY_FILE}" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "environment": "${ENVIRONMENT}",
  "test_suite_version": "1.0.0",
  "summary": {
    "total_tests": ${TOTAL_TESTS},
    "passed": ${PASSED_TESTS},
    "failed": ${FAILED_TESTS},
    "skipped": ${SKIPPED_TESTS},
    "success_rate": $(awk "BEGIN {printf \"%.2f\", (${PASSED_TESTS}/${TOTAL_TESTS})*100}")
  },
  "test_results": [
    $(IFS=,; echo "${TEST_RESULTS[*]}")
  ]
}
EOF

echo ""
echo "======================================================================"
echo "Test Suite Completed"
echo "======================================================================"
echo "Total Tests:   ${TOTAL_TESTS}"
echo "${GREEN}Passed:        ${PASSED_TESTS}${NC}"
echo "${RED}Failed:        ${FAILED_TESTS}${NC}"
echo "${YELLOW}Skipped:       ${SKIPPED_TESTS}${NC}"
echo ""
echo "Summary Report: ${SUMMARY_FILE}"
echo "======================================================================"

# Run capacity planning if tests passed
if [ ${PASSED_TESTS} -gt 0 ]; then
    echo ""
    echo "${BLUE}Running Capacity Planning Analysis...${NC}"
    npm run capacity
fi

# Exit with appropriate code
if [ ${FAILED_TESTS} -eq 0 ]; then
    echo ""
    echo "${GREEN}✓ All tests passed successfully!${NC}"
    exit 0
else
    echo ""
    echo "${RED}✗ Some tests failed. Please review the reports.${NC}"
    exit 1
fi
