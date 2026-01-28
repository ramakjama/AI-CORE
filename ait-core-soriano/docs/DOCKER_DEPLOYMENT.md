# AIT-CORE Docker Deployment Guide

Complete guide for deploying the AIT-CORE ecosystem using Docker Compose.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Service Catalog](#service-catalog)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Monitoring](#monitoring)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)
- [Performance Tuning](#performance-tuning)
- [Security Best Practices](#security-best-practices)

---

## Overview

AIT-CORE is a comprehensive enterprise platform consisting of:
- **40 PostgreSQL databases** with pgvector support
- **21 FastAPI microservices** (ports 8000-8020)
- **Node.js services** (API Gateway, PGC Engine, Accountant)
- **Infrastructure** (Redis, Kafka, Elasticsearch, MinIO)
- **Monitoring** (Prometheus, Grafana, Kibana)
- **Real-time collaboration** (WebSocket server)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NGINX (80/443)                          │
│                  SSL Termination & Load Balancing            │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼────────┐            ┌────────▼────────┐
│  API Gateway    │            │ Gateway Service │
│  (Node.js)      │            │  (FastAPI)      │
│  Port: 3002     │            │  Port: 8020     │
└────────┬────────┘            └────────┬────────┘
         │                               │
    ┌────┴──────────────────────────────┴────┐
    │      21 FastAPI Microservices          │
    │   (Auth, Storage, Docs, Mail, etc.)    │
    │         Ports: 8000-8019                │
    └─────────────────┬──────────────────────┘
                      │
    ┌─────────────────┴──────────────────────┐
    │                                         │
┌───▼───┐  ┌──────┐  ┌───────┐  ┌──────────┐
│ PG 17 │  │Redis │  │ Kafka │  │   MinIO  │
│  40DB │  │ 7.4  │  │ 7.5   │  │  S3-API  │
└───────┘  └──────┘  └───────┘  └──────────┘
```

---

## Prerequisites

### System Requirements

**Minimum (Development):**
- CPU: 4 cores
- RAM: 16 GB
- Disk: 50 GB SSD
- OS: Linux, macOS, Windows 10/11 with WSL2

**Recommended (Production):**
- CPU: 16+ cores
- RAM: 64 GB
- Disk: 500 GB NVMe SSD
- OS: Ubuntu 22.04 LTS or Rocky Linux 9

### Software Requirements

1. **Docker Engine 24.0+**
   ```bash
   docker --version
   ```

2. **Docker Compose 2.20+**
   ```bash
   docker compose version
   ```

3. **Git**
   ```bash
   git --version
   ```

### Installation

#### Ubuntu/Debian
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

#### macOS
```bash
# Install Docker Desktop
brew install --cask docker

# Start Docker Desktop from Applications
```

#### Windows (WSL2)
1. Install WSL2: `wsl --install`
2. Install Docker Desktop for Windows
3. Enable WSL2 backend in Docker Desktop settings

---

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd ait-core-soriano
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env
```

**Critical variables to set:**
```bash
# Database
POSTGRES_PASSWORD=your-strong-password

# Redis
REDIS_PASSWORD=your-redis-password

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Email (optional for dev)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# AI Services (optional)
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

### 3. Initialize Database Script

Ensure the init script is executable:
```bash
chmod +x scripts/init-multiple-dbs.sh
```

### 4. Start Services

**Development:**
```bash
docker compose up -d
```

**Production:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 5. Verify Deployment

```bash
# Check all services are running
docker compose ps

# Check logs
docker compose logs -f

# Health check
curl http://localhost:8020/health
```

---

## Configuration

### Environment Variables

The `.env` file contains all configuration. Key sections:

#### Database Configuration
```bash
POSTGRES_USER=aitcore
POSTGRES_PASSWORD=change-this-in-production
POSTGRES_DB=soriano_core
```

#### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Main database |
| Redis | 6379 | Cache & sessions |
| Kafka | 9092 | Message broker |
| Elasticsearch | 9200 | Search & logs |
| MinIO API | 9000 | Object storage |
| MinIO Console | 9001 | Web UI |
| Prometheus | 9090 | Metrics |
| Grafana | 3005 | Dashboards |
| Kibana | 5601 | Log viewer |
| Auth Service | 8000 | Authentication |
| Storage Service | 8001 | File storage |
| Documents Service | 8002 | Document processing |
| Mail Service | 8003 | Email |
| Calendar Service | 8004 | Calendar |
| Tasks Service | 8005 | Task management |
| CRM Service | 8006 | CRM |
| Analytics Service | 8007 | Analytics |
| HR Service | 8008 | HR management |
| Workflow Service | 8009 | Workflows |
| Collaboration Service | 8010 | Collaboration |
| Spreadsheets Service | 8011 | Spreadsheets |
| Presentations Service | 8012 | Presentations |
| Forms Service | 8013 | Forms |
| Notes Service | 8014 | Notes |
| Bookings Service | 8015 | Appointments |
| Assistant Service | 8016 | AI Assistant |
| Whiteboard Service | 8017 | Whiteboard |
| Translator Service | 8018 | Translation |
| Embedded Apps Service | 8019 | Embedded apps |
| Gateway Service | 8020 | API Gateway |
| Collaboration WS | 1234 | WebSocket |
| API Gateway (Node) | 3002 | Main API |
| PGC Engine | 3001 | Accounting |
| Accountant | 3003 | AI Accountant |

---

## Service Catalog

### Infrastructure Services

#### PostgreSQL 17
- **Image**: `pgvector/pgvector:pg17`
- **Features**:
  - 40 databases automatically created
  - pgvector extension for ML
  - uuid-ossp and pg_trgm extensions
- **Resource Limits**: 4 CPU, 4 GB RAM (dev) / 8 CPU, 8 GB RAM (prod)
- **Health Check**: `pg_isready -U aitcore -d soriano_core`

#### Redis 7.4
- **Image**: `redis:7.4-alpine`
- **Features**:
  - Persistence with AOF
  - Password authentication
  - LRU eviction policy (production)
- **Resource Limits**: 1 CPU, 1 GB RAM
- **Health Check**: `redis-cli ping`

#### Elasticsearch 8.11
- **Image**: `docker.elastic.co/elasticsearch/elasticsearch:8.11.0`
- **Features**:
  - Single-node mode (dev)
  - Security disabled (dev) / enabled (prod)
  - Optimized JVM settings
- **Resource Limits**: 2 CPU, 3 GB RAM (dev) / 4 CPU, 6 GB RAM (prod)
- **Health Check**: `curl http://localhost:9200/_cluster/health`

#### MinIO
- **Image**: `minio/minio:latest`
- **Features**:
  - S3-compatible API
  - Web console
  - Bucket auto-creation
- **Resource Limits**: 2 CPU, 2 GB RAM
- **Health Check**: `curl http://localhost:9000/minio/health/live`

#### Kafka 7.5
- **Image**: `confluentinc/cp-kafka:7.5.0`
- **Features**:
  - Auto-create topics
  - LZ4 compression
  - 7-day retention
- **Resource Limits**: 2 CPU, 2 GB RAM (dev) / 4 CPU, 4 GB RAM (prod)

### FastAPI Microservices

All FastAPI services share common characteristics:
- **Base Image**: `python:3.11-slim`
- **Framework**: FastAPI + Uvicorn
- **Health Checks**: `GET /health` endpoint
- **Logging**: JSON structured logs
- **Production**: Gunicorn with 4 workers per service

#### Key Services

**Auth Service (8000)**
- Authentication & authorization
- JWT token management
- 2FA support

**Storage Service (8001)**
- File upload/download
- MinIO integration
- Virus scanning

**Documents Service (8002)**
- OCR processing
- PDF generation
- Document conversion

**Assistant Service (8016)**
- OpenAI GPT-4 integration
- Claude integration
- Context-aware responses

### Node.js Services

**API Gateway (3002)**
- Unified API entry point
- Rate limiting
- Request routing

**AIT-PGC-Engine (3001)**
- Spanish accounting engine
- Chart of accounts management

**AIT-Accountant (3003)**
- AI-powered accounting
- Anomaly detection
- Auto-reconciliation

---

## Development Deployment

### Standard Development Setup

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

### Individual Service Development

```bash
# Start only infrastructure
docker compose up -d postgres redis kafka elasticsearch minio

# Start specific service
docker compose up -d auth-service

# View service logs
docker compose logs -f auth-service

# Restart service
docker compose restart auth-service

# Rebuild service
docker compose up -d --build auth-service
```

### Development Tools

**Prisma Studio (port 5555)**
```bash
# Start Prisma Studio for PGC Engine
docker compose --profile tools up -d pgc-prisma-studio

# Access at http://localhost:5555
```

**Database Access**
```bash
# Connect to PostgreSQL
docker exec -it ait-postgres psql -U aitcore -d soriano_core

# List all databases
\l

# Connect to specific database
\c auth_db
```

**Redis CLI**
```bash
# Connect to Redis
docker exec -it ait-redis redis-cli

# Authenticate
AUTH aitcore2024

# List keys
KEYS *
```

### Hot Reload

All services in development mode support hot reload through volume mounts:
```yaml
volumes:
  - ./services/auth:/app
```

Changes to code will automatically trigger reloads.

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Update all passwords in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Configure SSL certificates
- [ ] Set up backup schedule
- [ ] Configure monitoring alerts
- [ ] Review resource limits
- [ ] Set up log rotation
- [ ] Configure firewall rules
- [ ] Set up DNS records
- [ ] Test disaster recovery

### Production Environment Setup

```bash
# Copy production env template
cp .env.example .env.production

# Edit production values
nano .env.production
```

**Critical production settings:**
```bash
# Strong passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Production mode
NODE_ENV=production
LOG_LEVEL=warning

# SSL
ENABLE_HTTPS=true
SSL_CERT_PATH=/etc/ssl/certs/aitcore.crt
SSL_KEY_PATH=/etc/ssl/private/aitcore.key

# External URLs
CORS_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com
```

### SSL Certificate Setup

#### Option 1: Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy to project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/aitcore.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/aitcore.key
sudo chown $USER:$USER ./ssl/*
```

#### Option 2: Self-Signed (Development/Testing)

```bash
# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/aitcore.key \
  -out ssl/aitcore.crt \
  -subj "/C=ES/ST=Madrid/L=Madrid/O=AIT-CORE/CN=localhost"
```

### NGINX Configuration

Create `nginx/nginx.conf`:
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req_status 429;

    # Include additional configs
    include /etc/nginx/conf.d/*.conf;
}
```

Create `nginx/conf.d/aitcore.conf`:
```nginx
# Upstream definitions
upstream api_gateway {
    least_conn;
    server api-gateway:3002 max_fails=3 fail_timeout=30s;
}

upstream gateway_service {
    least_conn;
    server gateway-service:8020 max_fails=3 fail_timeout=30s;
}

upstream websocket {
    least_conn;
    server collaboration-ws:1234 max_fails=3 fail_timeout=30s;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/aitcore.crt;
    ssl_certificate_key /etc/nginx/ssl/aitcore.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API Gateway (Node.js)
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Gateway Service (FastAPI)
    location /services/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://gateway_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Deploy to Production

```bash
# Load production environment
export $(cat .env.production | xargs)

# Pull latest images
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Production Scaling

Scale specific services:
```bash
# Scale API gateways
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale gateway-service=5

# Scale auth service
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale auth-service=3
```

---

## Monitoring

### Access Monitoring Tools

| Tool | URL | Credentials |
|------|-----|-------------|
| Grafana | http://localhost:3005 | admin / aitcore2024 |
| Prometheus | http://localhost:9090 | - |
| Kibana | http://localhost:5601 | - |
| MinIO Console | http://localhost:9001 | aitcore / aitcore2024 |

### Prometheus Metrics

Edit `prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'fastapi-services'
    static_configs:
      - targets:
        - 'auth-service:8000'
        - 'storage-service:8001'
        - 'gateway-service:8020'

  - job_name: 'nodejs-services'
    static_configs:
      - targets:
        - 'api-gateway:3002'
        - 'ait-pgc-engine:3001'
```

### Health Monitoring Script

Create `scripts/health-check.sh`:
```bash
#!/bin/bash

SERVICES=(
    "http://localhost:8000/health:Auth"
    "http://localhost:8001/health:Storage"
    "http://localhost:8020/health:Gateway"
    "http://localhost:3002/api/health:API-Gateway"
)

echo "AIT-CORE Health Check - $(date)"
echo "================================"

for service in "${SERVICES[@]}"; do
    IFS=':' read -r url name <<< "$service"
    if curl -sf "$url" > /dev/null; then
        echo "✓ $name - OK"
    else
        echo "✗ $name - FAIL"
    fi
done
```

Run health check:
```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

### Grafana Dashboards

Import pre-built dashboards:
1. Access Grafana at http://localhost:3005
2. Go to Dashboards → Import
3. Import by ID:
   - PostgreSQL: 9628
   - Redis: 763
   - Node.js: 11159
   - Docker: 893

---

## Backup & Recovery

### Automated Backup Script

Create `scripts/backup.sh`:
```bash
#!/bin/bash

BACKUP_DIR="/backups/ait-core"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo "Backing up PostgreSQL..."
docker exec ait-postgres pg_dumpall -U aitcore | gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# Backup Redis
echo "Backing up Redis..."
docker exec ait-redis redis-cli --rdb /data/dump.rdb
docker cp ait-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Backup MinIO
echo "Backing up MinIO..."
docker exec ait-minio mc mirror /data $BACKUP_DIR/minio_$DATE

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR"
```

### Schedule Backups

```bash
# Add to crontab
crontab -e

# Run daily at 2 AM
0 2 * * * /path/to/scripts/backup.sh >> /var/log/ait-backup.log 2>&1
```

### Restore from Backup

```bash
# Restore PostgreSQL
gunzip -c /backups/ait-core/postgres_20240101_020000.sql.gz | \
  docker exec -i ait-postgres psql -U aitcore

# Restore Redis
docker cp /backups/ait-core/redis_20240101_020000.rdb ait-redis:/data/dump.rdb
docker restart ait-redis

# Restore MinIO
docker exec ait-minio mc mirror /backups/ait-core/minio_20240101_020000 /data
```

---

## Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check logs
docker compose logs <service-name>

# Check container status
docker compose ps

# Restart service
docker compose restart <service-name>

# Rebuild service
docker compose up -d --build <service-name>
```

#### Database Connection Issues

```bash
# Test PostgreSQL connection
docker exec -it ait-postgres psql -U aitcore -d soriano_core -c "SELECT 1;"

# Check PostgreSQL logs
docker compose logs postgres

# Verify environment variables
docker compose config
```

#### Out of Memory

```bash
# Check Docker memory
docker stats

# Increase Docker memory limit (Docker Desktop)
# Settings → Resources → Memory → Increase to 16GB+

# Or modify service limits in docker-compose.prod.yml
```

#### Port Already in Use

```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Performance Issues

#### Slow Database Queries

```bash
# Enable query logging
docker exec ait-postgres psql -U aitcore -c "ALTER SYSTEM SET log_statement = 'all';"
docker restart ait-postgres

# View slow queries
docker compose logs postgres | grep "duration:"
```

#### High CPU Usage

```bash
# Check resource usage
docker stats

# Limit CPU for specific service
docker update --cpus="2.0" ait-analytics-service
```

### Debugging Tools

```bash
# Enter container shell
docker exec -it <container-name> /bin/bash

# View container logs
docker compose logs -f --tail=100 <service-name>

# Inspect container
docker inspect <container-name>

# View container processes
docker top <container-name>
```

---

## Performance Tuning

### PostgreSQL Optimization

Edit PostgreSQL configuration in production:
```yaml
postgres:
  command:
    - "postgres"
    - "-c"
    - "max_connections=200"
    - "-c"
    - "shared_buffers=4GB"
    - "-c"
    - "effective_cache_size=12GB"
    - "-c"
    - "maintenance_work_mem=1GB"
    - "-c"
    - "checkpoint_completion_target=0.9"
    - "-c"
    - "wal_buffers=16MB"
    - "-c"
    - "work_mem=20MB"
```

### Redis Optimization

```yaml
redis:
  command: >
    redis-server
    --appendonly yes
    --requirepass ${REDIS_PASSWORD}
    --maxmemory 4gb
    --maxmemory-policy allkeys-lru
    --tcp-backlog 511
    --tcp-keepalive 300
```

### Elasticsearch Optimization

```yaml
elasticsearch:
  environment:
    - "ES_JAVA_OPTS=-Xms4g -Xmx4g"
    - indices.memory.index_buffer_size=30%
    - thread_pool.write.queue_size=1000
```

### Application Tuning

**FastAPI Services:**
```yaml
command:
  - "gunicorn"
  - "src.main:app"
  - "--workers=8"  # 2x CPU cores
  - "--worker-class=uvicorn.workers.UvicornWorker"
  - "--max-requests=1000"
  - "--max-requests-jitter=100"
  - "--timeout=300"
```

**Node.js Services:**
```yaml
environment:
  - NODE_OPTIONS=--max-old-space-size=4096
  - UV_THREADPOOL_SIZE=128
```

---

## Security Best Practices

### 1. Secrets Management

Never commit `.env` file:
```bash
echo ".env" >> .gitignore
```

Use Docker secrets in production:
```yaml
secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt

services:
  postgres:
    secrets:
      - postgres_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
```

### 2. Network Security

Create isolated networks:
```yaml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access
```

### 3. Container Security

Run as non-root:
```yaml
services:
  auth-service:
    user: "1000:1000"
    read_only: true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

### 4. Rate Limiting

Implement rate limiting in NGINX and application level.

### 5. SSL/TLS

Always use HTTPS in production with valid certificates.

### 6. Regular Updates

```bash
# Update images
docker compose pull

# Update and restart
docker compose up -d
```

### 7. Vulnerability Scanning

```bash
# Scan images
docker scan ait-auth-service

# Use Trivy
trivy image ait-auth-service:latest
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Check service health
- Review error logs
- Monitor disk space

**Weekly:**
- Review performance metrics
- Check backup integrity
- Update security patches

**Monthly:**
- Update Docker images
- Review and rotate logs
- Audit user access
- Performance optimization

### Log Management

```bash
# View logs
docker compose logs -f

# Save logs to file
docker compose logs > logs/app-$(date +%Y%m%d).log

# Clean up old logs
docker system prune -af --volumes
```

### Database Maintenance

```bash
# Vacuum databases
docker exec ait-postgres vacuumdb -U aitcore --all --analyze

# Reindex
docker exec ait-postgres reindexdb -U aitcore --all

# Check database sizes
docker exec ait-postgres psql -U aitcore -c "
  SELECT pg_database.datname,
         pg_size_pretty(pg_database_size(pg_database.datname)) AS size
  FROM pg_database
  ORDER BY pg_database_size(pg_database.datname) DESC;
"
```

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [NGINX Documentation](https://nginx.org/en/docs/)

---

## Support

For issues and questions:
- GitHub Issues: [Repository URL]
- Documentation: [Docs URL]
- Email: support@aitcore.com

---

**Last Updated:** 2024-01-28
**Version:** 1.0.0
**Maintainer:** AIT-CORE Team
