# AIT-CORE Docker Quick Start Guide

Get AIT-CORE running in 5 minutes!

## Prerequisites

- Docker 24.0+ installed
- Docker Compose 2.20+ installed
- 16GB RAM minimum
- 50GB free disk space

## Quick Start (Development)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start all services
docker compose up -d

# 3. Wait for services to start (2-3 minutes)
docker compose logs -f

# 4. Verify everything is running
docker compose ps
```

## Verify Installation

### Check Service Health

```bash
# Auth Service
curl http://localhost:8000/health

# Gateway Service
curl http://localhost:8020/health

# API Gateway
curl http://localhost:3002/api/health
```

### Access Web Interfaces

| Service | URL | Login |
|---------|-----|-------|
| Grafana | http://localhost:3005 | admin / aitcore2024 |
| MinIO Console | http://localhost:9001 | aitcore / aitcore2024 |
| Kibana | http://localhost:5601 | - |
| Prometheus | http://localhost:9090 | - |

## What's Running?

### Infrastructure (7 services)
- **PostgreSQL 17** (5432) - 40 databases
- **Redis 7.4** (6379) - Cache
- **Kafka** (9092) - Events
- **Elasticsearch** (9200) - Search
- **MinIO** (9000/9001) - Storage
- **Prometheus** (9090) - Metrics
- **Grafana** (3005) - Dashboards

### FastAPI Services (21 microservices)
Ports 8000-8020:
- Auth, Storage, Documents, Mail, Calendar
- Tasks, CRM, Analytics, HR, Workflow
- Collaboration, Spreadsheets, Presentations
- Forms, Notes, Bookings, Assistant
- Whiteboard, Translator, Embedded Apps
- Gateway

### Node.js Services (4 services)
- API Gateway (3002)
- PGC Engine (3001)
- Accountant (3003)
- WebSocket (1234)

## Common Commands

```bash
# View all services
docker compose ps

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Restart a service
docker compose restart auth-service

# Clean everything
docker compose down -v
```

## Database Access

```bash
# PostgreSQL
docker exec -it ait-postgres psql -U aitcore -d soriano_core

# Redis
docker exec -it ait-redis redis-cli
# Then: AUTH aitcore2024
```

## Troubleshooting

### Services won't start?

```bash
# Check logs
docker compose logs postgres
docker compose logs redis

# Rebuild
docker compose down -v
docker compose up -d
```

### Port already in use?

Edit `docker-compose.yml` and change the host port:
```yaml
ports:
  - "8100:8000"  # Changed from 8000:8000
```

### Out of memory?

Increase Docker memory to 16GB in Docker Desktop settings.

## Next Steps

1. **Configure Environment**: Edit `.env` with your settings
2. **Setup SSL**: For production deployment
3. **Read Full Docs**: See `docs/DOCKER_DEPLOYMENT.md`
4. **Monitor**: Access Grafana at http://localhost:3005

## Production Deployment

```bash
# 1. Configure production environment
cp .env.example .env.production
nano .env.production

# 2. Setup SSL certificates
mkdir -p ssl
# Add your certificates to ssl/aitcore.crt and ssl/aitcore.key

# 3. Start production mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Need Help?

- **Full Documentation**: `docs/DOCKER_DEPLOYMENT.md`
- **Configuration Guide**: `.env.example`
- **Helper Script**: `scripts/docker-helper.sh`
- **Main README**: `DOCKER_README.md`

## Service Ports Reference

### Infrastructure
| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| Kafka | 9092 | Events |
| Elasticsearch | 9200 | Search |
| MinIO API | 9000 | Storage |
| MinIO Console | 9001 | UI |
| Prometheus | 9090 | Metrics |
| Grafana | 3005 | Dashboards |
| Kibana | 5601 | Logs |

### FastAPI Services (8000-8020)
```
8000 - Auth Service         8011 - Spreadsheets Service
8001 - Storage Service      8012 - Presentations Service
8002 - Documents Service    8013 - Forms Service
8003 - Mail Service         8014 - Notes Service
8004 - Calendar Service     8015 - Bookings Service
8005 - Tasks Service        8016 - Assistant Service
8006 - CRM Service          8017 - Whiteboard Service
8007 - Analytics Service    8018 - Translator Service
8008 - HR Service           8019 - Embedded Apps Service
8009 - Workflow Service     8020 - Gateway Service
8010 - Collaboration Service
```

### Node.js Services
```
1234 - Collaboration WebSocket
3001 - AIT-PGC-Engine
3002 - API Gateway
3003 - AIT-Accountant
```

## Health Check

```bash
# Quick health check script
for port in 8000 8001 8020 3002; do
  echo -n "Port $port: "
  curl -sf http://localhost:$port/health > /dev/null && echo "✓ OK" || echo "✗ FAIL"
done
```

---

**Ready to start building!** 🚀

For detailed documentation, see `docs/DOCKER_DEPLOYMENT.md`
