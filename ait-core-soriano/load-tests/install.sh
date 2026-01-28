#!/bin/bash

################################################################################
# Load Testing Suite - Installation Script
# Purpose: Quick setup for load testing environment
################################################################################

set -e

echo "======================================================================"
echo "AIT-CORE Load Testing Suite - Installation"
echo "======================================================================"
echo ""

# Check if K6 is installed
echo "Checking for K6..."
if command -v k6 &> /dev/null; then
    K6_VERSION=$(k6 version | head -n 1)
    echo "✓ K6 found: ${K6_VERSION}"
else
    echo "✗ K6 not found"
    echo ""
    echo "Please install K6:"
    echo ""
    echo "macOS:    brew install k6"
    echo "Linux:    See https://k6.io/docs/getting-started/installation/"
    echo "Windows:  choco install k6"
    echo ""
    exit 1
fi

# Check if Node.js is installed
echo "Checking for Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js found: ${NODE_VERSION}"
else
    echo "⚠ Node.js not found (optional, needed for scripts)"
fi

# Create .env file if it doesn't exist
echo ""
echo "Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created .env file from template"
    echo "  Please edit .env with your target URLs"
else
    echo "✓ .env file already exists"
fi

# Create reports directory
echo ""
echo "Creating reports directory..."
mkdir -p reports/benchmarks
echo "✓ Reports directory created"

# Install npm dependencies (if Node.js is available)
if command -v npm &> /dev/null; then
    echo ""
    echo "Installing Node.js dependencies..."
    npm install
    echo "✓ Dependencies installed"
fi

# Make scripts executable
echo ""
echo "Making scripts executable..."
chmod +x scripts/*.sh
echo "✓ Scripts are now executable"

# Run smoke test to verify setup
echo ""
echo "======================================================================"
echo "Running smoke test to verify installation..."
echo "======================================================================"
echo ""

if k6 run tests/smoke-test.js; then
    echo ""
    echo "======================================================================"
    echo "✓ Installation Complete!"
    echo "======================================================================"
    echo ""
    echo "Next steps:"
    echo "  1. Edit .env with your target URLs"
    echo "  2. Run: npm run test:smoke"
    echo "  3. See QUICKSTART.md for usage guide"
    echo ""
    echo "Available commands:"
    echo "  npm run test:smoke      - Quick smoke test"
    echo "  npm run test:load       - Load test"
    echo "  npm run test:stress     - Stress test"
    echo "  npm run test:all        - Comprehensive test"
    echo ""
else
    echo ""
    echo "======================================================================"
    echo "⚠ Installation complete, but smoke test failed"
    echo "======================================================================"
    echo ""
    echo "Please check:"
    echo "  1. Are all services running?"
    echo "  2. Is .env configured correctly?"
    echo "  3. Can you access: http://localhost:4003/health"
    echo ""
fi
