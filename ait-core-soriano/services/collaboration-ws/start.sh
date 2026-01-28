#!/bin/bash

# Collaboration WebSocket Server Start Script

set -e

echo "========================================"
echo "  AIT-CORE Collaboration WebSocket"
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo ""
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Get port from env or use default
PORT=${WS_PORT:-1234}

echo "🚀 Starting server..."
echo "   Port: $PORT"
echo "   Environment: ${NODE_ENV:-development}"
echo "   Debug: ${DEBUG:-false}"
echo ""

# Start server
node server.js
