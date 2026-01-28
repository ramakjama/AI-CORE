#!/bin/bash

##############################################################################
# ELK Stack Startup Script
# Inicia Elasticsearch, Logstash, Kibana y Filebeat
##############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================="
echo "🚀 Starting ELK Stack for AinTech"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
echo "🔍 Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  docker-compose not found, using 'docker compose'${NC}"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Stop any existing containers
echo "🛑 Stopping existing ELK containers..."
$DOCKER_COMPOSE -f docker-compose.elk.yml down > /dev/null 2>&1 || true
echo ""

# Start ELK Stack
echo "🚀 Starting ELK Stack..."
$DOCKER_COMPOSE -f docker-compose.elk.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
echo ""

# Wait for Elasticsearch
echo "🔄 Waiting for Elasticsearch..."
for i in {1..60}; do
    if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Elasticsearch is ready${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}❌ Elasticsearch failed to start${NC}"
        exit 1
    fi
    echo -n "."
    sleep 2
done
echo ""

# Wait for Logstash
echo "🔄 Waiting for Logstash..."
for i in {1..60}; do
    if curl -s http://localhost:9600 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Logstash is ready${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}❌ Logstash failed to start${NC}"
        exit 1
    fi
    echo -n "."
    sleep 2
done
echo ""

# Wait for Kibana
echo "🔄 Waiting for Kibana..."
for i in {1..60}; do
    if curl -s http://localhost:5601/api/status > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Kibana is ready${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}❌ Kibana failed to start${NC}"
        exit 1
    fi
    echo -n "."
    sleep 2
done
echo ""

# Display service status
echo ""
echo "========================================="
echo "✅ ELK Stack is running!"
echo "========================================="
echo ""
echo "Services:"
echo "  📊 Elasticsearch: http://localhost:9200"
echo "  🔧 Logstash:"
echo "     - TCP:  localhost:5000"
echo "     - HTTP: localhost:8080"
echo "     - API:  http://localhost:9600"
echo "  📈 Kibana:        http://localhost:5601"
echo ""
echo "Logs input endpoints:"
echo "  - TCP (JSON):  localhost:5000"
echo "  - HTTP (JSON): localhost:8080"
echo "  - Beats:       localhost:5044"
echo ""

# Check cluster health
echo "🏥 Elasticsearch Cluster Health:"
curl -s http://localhost:9200/_cluster/health?pretty | grep -E "(status|number_of_nodes|active_shards)" || true
echo ""

# Check Logstash stats
echo "📊 Logstash Pipeline Stats:"
curl -s http://localhost:9600/_node/stats/pipelines?pretty | grep -E "(events)" || true
echo ""

echo "========================================="
echo "Next steps:"
echo "1. Open Kibana: http://localhost:5601"
echo "2. Configure index patterns (see setup-kibana.sh)"
echo "3. Start sending logs from applications"
echo "========================================="
echo ""

# Save PID for stop script
echo $$ > /tmp/elk-stack.pid
