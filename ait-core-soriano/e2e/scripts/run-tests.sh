#!/bin/bash

# E2E Tests Runner Script
# This script runs E2E tests with various options

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
HEADED=false
UI=false
DEBUG=false
BROWSER="all"
SUITE="all"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --headed)
            HEADED=true
            shift
            ;;
        --ui)
            UI=true
            shift
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        --browser)
            BROWSER="$2"
            shift 2
            ;;
        --suite)
            SUITE="$2"
            shift 2
            ;;
        --help)
            echo "E2E Tests Runner"
            echo ""
            echo "Usage: ./run-tests.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --headed          Run tests with browser visible"
            echo "  --ui              Run tests in UI mode"
            echo "  --debug           Run tests in debug mode"
            echo "  --browser <name>  Run tests on specific browser (chromium|firefox|webkit|mobile)"
            echo "  --suite <name>    Run specific test suite (auth|dashboard|clients|policies|claims)"
            echo "  --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./run-tests.sh                           # Run all tests"
            echo "  ./run-tests.sh --headed                  # Run with visible browser"
            echo "  ./run-tests.sh --browser firefox        # Run on Firefox only"
            echo "  ./run-tests.sh --suite auth             # Run auth tests only"
            echo "  ./run-tests.sh --ui                      # Run in UI mode"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Display configuration
echo -e "${BLUE}🧪 AIT-CORE E2E Test Runner${NC}"
echo ""
echo "Configuration:"
echo "  Headed mode: $HEADED"
echo "  UI mode: $UI"
echo "  Debug mode: $DEBUG"
echo "  Browser: $BROWSER"
echo "  Suite: $SUITE"
echo ""

# Check if application is running
echo "🔍 Checking if application is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is running${NC}"
else
    echo -e "${YELLOW}⚠️  Application is not running on http://localhost:3000${NC}"
    echo "Please start the application first:"
    echo "  cd ../apps/web && pnpm dev"
    exit 1
fi

# Build test command
CMD="pnpm exec playwright test"

if [ "$UI" = true ]; then
    CMD="$CMD --ui"
elif [ "$DEBUG" = true ]; then
    CMD="$CMD --debug"
elif [ "$HEADED" = true ]; then
    CMD="$CMD --headed"
fi

if [ "$BROWSER" != "all" ]; then
    CMD="$CMD --project=$BROWSER"
fi

if [ "$SUITE" != "all" ]; then
    CMD="$CMD tests/$SUITE"
fi

# Run tests
echo ""
echo -e "${BLUE}🚀 Running tests...${NC}"
echo "Command: $CMD"
echo ""

eval $CMD

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "View HTML report:"
    echo "  pnpm run report"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "View HTML report for details:"
    echo "  pnpm run report"
    exit 1
fi
