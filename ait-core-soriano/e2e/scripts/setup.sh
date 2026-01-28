#!/bin/bash

# E2E Testing Setup Script
# This script sets up the E2E testing environment

set -e

echo "🚀 Setting up E2E testing environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 20 or higher.${NC}"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js version 20 or higher is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm is not installed. Installing...${NC}"
    npm install -g pnpm
fi

echo -e "${GREEN}✓ pnpm version: $(pnpm -v)${NC}"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
pnpm exec playwright install --with-deps

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created. Please update it with your configuration.${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists. Skipping...${NC}"
fi

# Create necessary directories
mkdir -p screenshots test-results playwright-report

echo ""
echo -e "${GREEN}✅ E2E testing environment setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Start the application: cd ../apps/web && pnpm dev"
echo "3. Run tests: pnpm test"
echo ""
echo "Available commands:"
echo "  pnpm test              - Run all tests"
echo "  pnpm test:headed       - Run tests with browser visible"
echo "  pnpm test:ui           - Run tests in UI mode"
echo "  pnpm test:debug        - Run tests in debug mode"
echo "  pnpm run report        - View test report"
echo ""
