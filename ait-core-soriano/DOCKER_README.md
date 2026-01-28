# AIT-CORE Docker Setup

Complete Docker Compose configuration for the AIT-CORE ecosystem.

## Quick Start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit configuration (set passwords, API keys, etc.)
nano .env

# 3. Start all services
docker compose up -d

# 4. Check status
docker compose ps

# 5. View logs
docker compose logs -f
```

## What's Included

### Infrastructure (7 services)
- **PostgreSQL 17** with pgvector - 40 databases
- **Redis 7.4** - Cache and sessions
- **Kafka 7.5** + Zookeeper - Message broker
- **Elasticsearch 8.11** - Search and logs
- **MinIO** - S3-compatible object storage
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards

### FastAPI Microservices (21 services, ports 8000-8020)
1. **Auth Service** (8000) - Authentication & authorization
2. **Storage Service** (8001) - File storage management
3. **Documents Service** (8002) - Document processing & OCR
4. **Mail Service** (8003) - Email sending & receiving
5. **Calendar Service** (8004) - Event scheduling
6. **Tasks Service** (8005) - Task management
7. **CRM Service** (8006) - Customer relationship management
8. **Analytics Service** (8007) - Business intelligence
9. **HR Service** (8008) - Human resources
10. **Workflow Service** (8009) - Automation workflows
11. **Collaboration Service** (8010) - Team collaboration
12. **Spreadsheets Service** (8011) - Excel-like functionality
13. **Presentations Service** (8012) - PowerPoint-like functionality
14. **Forms Service** (8013) - Dynamic form builder
15. **Notes Service** (8014) - Note-taking
16. **Bookings Service** (8015) - Appointment scheduling
17. **Assistant Service** (8016) - AI-powered assistant
18. **Whiteboard Service** (8017) - Collaborative whiteboard
19. **Translator Service** (8018) - Multi-language translation
20. **Embedded Apps Service** (8019) - Third-party app integration
21. **Gateway Service** (8020) - API Gateway for all FastAPI services

### Node.js Services
- **API Gateway** (3002) - Main API entry point
- **AIT-PGC-Engine** (3001) - Spanish accounting engine
- **AIT-Accountant** (3003) - AI-powered accounting
- **Collaboration WebSocket** (1234) - Real-time collaboration

## System Requirements

**Minimum (Development):**
- CPU: 4 cores
- RAM: 16 GB
- Disk: 50 GB SSD

**Recommended (Production):**
- CPU: 16+ cores
- RAM: 64 GB
- Disk: 500 GB NVMe SSD

## Service Architecture

```
┌─────────────────────────────────────────┐
│         NGINX (Production Only)         │
│              80/443 (SSL)               │
└──────────────────┬──────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
┌──────▼───────┐      ┌───────▼────────┐
│ API Gateway  │      │ Gateway Service│
│  (Node.js)   │      │   (FastAPI)    │
│   :3002      │      │     :8020      │
└──────┬───────┘      └───────┬────────┘
       │                      │
       └──────────┬───────────┘
                  │
    ┌─────────────┴─────────────┐
    │   21 FastAPI Services     │
    │      (8000-8019)          │
    └─────────────┬─────────────┘
                  │
    ┌─────────────┴─────────────┐
    │    Infrastructure         │
    │  Postgres, Redis, Kafka   │
    │ Elasticsearch, MinIO      │
    └───────────────────────────┘
```

## Configuration

### Environment Variables

Critical variables in `.env`:

```bash
# Database
POSTGRES_PASSWORD=your-secure-password

# Redis
REDIS_PASSWORD=your-redis-password

# Security
JWT_SECRET=your-super-secret-jwt-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# AI Services
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

See `.env.example` for all available options.

## Common Commands

### Using Docker Compose directly

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f auth-service

# Restart a service
docker compose restart auth-service

# Rebuild a service
docker compose up -d --build auth-service

# Check service status
docker compose ps

# View resource usage
docker stats
```

### Using Helper Script

```bash
# Make script executable
chmod +x scripts/docker-helper.sh

# Start services
./scripts/docker-helper.sh start

# Check health
./scripts/docker-helper.sh health

# View logs
./scripts/docker-helper.sh logs auth-service

# Open shell in container
./scripts/docker-helper.sh shell api-gateway

# Scale service
./scripts/docker-helper.sh scale gateway-service 3

# Backup databases
./scripts/docker-helper.sh backup
```

## Accessing Services

### Web Interfaces

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3005 | admin / aitcore2024 |
| Kibana | http://localhost:5601 | - |
| MinIO Console | http://localhost:9001 | aitcore / aitcore2024 |
| Prometheus | http://localhost:9090 | - |
| Prisma Studio (dev) | http://localhost:5555 | - |

### API Endpoints

```bash
# Health checks
curl http://localhost:8000/health  # Auth Service
curl http://localhost:8020/health  # Gateway Service
curl http://localhost:3002/api/health  # API Gateway

# Get service info
curl http://localhost:8020/docs  # FastAPI docs (Gateway)
curl http://localhost:8000/docs  # FastAPI docs (Auth)
```

### Database Access

```bash
# PostgreSQL
docker exec -it ait-postgres psql -U aitcore -d soriano_core

# List databases
\l

# Connect to specific database
\c auth_db

# Redis
docker exec -it ait-redis redis-cli
AUTH aitcore2024
KEYS *
```

## Development Workflow

### Starting Development

```bash
# 1. Start infrastructure only
docker compose up -d postgres redis kafka elasticsearch minio

# 2. Start specific services you're working on
docker compose up -d auth-service storage-service

# 3. View logs
docker compose logs -f auth-service
```

### Making Changes

1. Edit code in `./services/<service-name>/`
2. Changes auto-reload (development mode)
3. If Dockerfile changes, rebuild:
   ```bash
   docker compose up -d --build auth-service
   ```

### Debugging

```bash
# View container logs
docker compose logs -f auth-service

# Open shell in container
docker compose exec auth-service /bin/bash

# Check environment variables
docker compose exec auth-service env

# Inspect container
docker inspect ait-auth-service
```

## Production Deployment

### Production Mode

```bash
# Start with production overrides
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or use helper script
./scripts/docker-helper.sh prod-start
```

### Production Features

- **No volume mounts** - Code baked into images
- **Gunicorn workers** - Multiple workers per service
- **Resource limits** - CPU and memory constraints
- **Log rotation** - Automatic log management
- **Service replication** - Multiple instances of critical services
- **NGINX reverse proxy** - SSL termination and load balancing
- **Enhanced security** - Production-grade configurations

### SSL Setup

```bash
# Create SSL directory
mkdir -p ssl

# Option 1: Let's Encrypt (recommended)
certbot certonly --standalone -d yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/aitcore.crt
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/aitcore.key

# Option 2: Self-signed (testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/aitcore.key -out ssl/aitcore.crt
```

## Monitoring

### Grafana Dashboards

1. Access Grafana: http://localhost:3005
2. Login: admin / aitcore2024
3. Import dashboards:
   - PostgreSQL: Dashboard ID 9628
   - Redis: Dashboard ID 763
   - Docker: Dashboard ID 893

### Prometheus Metrics

Access metrics at http://localhost:9090

Common queries:
```promql
# Container CPU usage
container_cpu_usage_seconds_total

# Container memory usage
container_memory_usage_bytes

# HTTP request rate
rate(http_requests_total[5m])
```

### Elasticsearch Logs

Access Kibana at http://localhost:5601

Create index pattern: `ait-core-*`

## Backup & Recovery

### Automated Backups

```bash
# Run backup
./scripts/docker-helper.sh backup

# Backups stored in ./backups/YYYYMMDD_HHMMSS/
```

### Manual Backup

```bash
# Backup PostgreSQL
docker exec ait-postgres pg_dumpall -U aitcore | gzip > backup.sql.gz

# Backup Redis
docker exec ait-redis redis-cli BGSAVE
docker cp ait-redis:/data/dump.rdb ./backup-redis.rdb

# Backup volumes
docker run --rm -v ait-core-soriano_postgres_data:/data \
  -v $(pwd):/backup alpine tar czf /backup/postgres-volume.tar.gz /data
```

### Restore

```bash
# Restore PostgreSQL
gunzip -c backup.sql.gz | docker exec -i ait-postgres psql -U aitcore

# Restore Redis
docker cp backup-redis.rdb ait-redis:/data/dump.rdb
docker restart ait-redis
```

## Troubleshooting

### Services won't start

```bash
# Check logs
docker compose logs <service-name>

# Check container status
docker compose ps

# Rebuild service
docker compose up -d --build <service-name>
```

### Port conflicts

```bash
# Find process using port
lsof -i :8000  # Linux/Mac
netstat -ano | findstr :8000  # Windows

# Change port in docker-compose.yml
ports:
  - "8100:8000"  # Map to different host port
```

### Database connection issues

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Test connection
docker exec ait-postgres pg_isready -U aitcore

# View PostgreSQL logs
docker compose logs postgres
```

### Out of memory

```bash
# Check memory usage
docker stats

# Increase Docker memory (Docker Desktop)
# Settings → Resources → Memory → 16GB+

# Or reduce service replicas
docker compose -f docker-compose.prod.yml up -d --scale auth-service=1
```

### Clean slate restart

```bash
# Stop everything and remove volumes
docker compose down -v

# Remove all Docker data
docker system prune -af --volumes

# Start fresh
docker compose up -d
```

## Performance Tuning

### PostgreSQL

Adjust in `docker-compose.prod.yml`:
```yaml
command:
  - "postgres"
  - "-c"
  - "shared_buffers=4GB"
  - "-c"
  - "effective_cache_size=12GB"
```

### Redis

```yaml
command: redis-server --maxmemory 4gb --maxmemory-policy allkeys-lru
```

### Service Scaling

```bash
# Scale critical services
docker compose up -d --scale gateway-service=3
docker compose up -d --scale auth-service=2
```

## Security Best Practices

1. **Change default passwords** in `.env`
2. **Use SSL certificates** in production
3. **Enable firewall** rules
4. **Regular updates**: `docker compose pull && docker compose up -d`
5. **Restrict network access** to sensitive services
6. **Enable audit logging**
7. **Regular backups**
8. **Monitor logs** for suspicious activity

## Additional Resources

- [Full Deployment Guide](docs/DOCKER_DEPLOYMENT.md)
- [Environment Variables](.env.example)
- [NGINX Configuration](nginx/nginx.conf)
- [Docker Compose Reference](https://docs.docker.com/compose/)

## Support

For issues and questions:
- Check logs: `docker compose logs -f`
- Run health checks: `./scripts/docker-helper.sh health`
- Review documentation: `docs/DOCKER_DEPLOYMENT.md`

## License

Copyright © 2024 AIT-CORE Team. All rights reserved.
