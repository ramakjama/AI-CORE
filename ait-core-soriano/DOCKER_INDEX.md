# AIT-CORE Docker Documentation Index

Complete index of all Docker-related documentation and configuration files.

## Quick Navigation

| I Need To... | Go To... |
|--------------|----------|
| **Start quickly** | [DOCKER_QUICK_START.md](DOCKER_QUICK_START.md) |
| **Full deployment guide** | [docs/DOCKER_DEPLOYMENT.md](docs/DOCKER_DEPLOYMENT.md) |
| **Configuration reference** | [.env.example](.env.example) |
| **Architecture overview** | [DOCKER_ARCHITECTURE.md](DOCKER_ARCHITECTURE.md) |
| **Setup completion status** | [DOCKER_SETUP_COMPLETE.md](DOCKER_SETUP_COMPLETE.md) |
| **General Docker info** | [DOCKER_README.md](DOCKER_README.md) |
| **Helper commands** | [scripts/docker-helper.sh](scripts/docker-helper.sh) |

---

## Core Configuration Files

### Docker Compose Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **docker-compose.yml** | Main configuration with all 32 services | Development & base for production |
| **docker-compose.prod.yml** | Production overrides | Production deployment only |
| **docker-compose.services.yml** | Additional services | Optional extensions |
| **docker-compose.test.yml** | Testing configuration | Running tests |

**Usage Examples:**
```bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# With optional services
docker compose -f docker-compose.yml -f docker-compose.services.yml up -d
```

### Environment Files

| File | Purpose | Action Required |
|------|---------|-----------------|
| **.env.example** | Complete template with 400+ variables | Copy to `.env` and customize |
| **.env.performance** | Performance optimization settings | Optional - merge into `.env` |
| **.env.services.example** | Service-specific settings | Optional - for advanced config |

**Setup:**
```bash
# Basic setup
cp .env.example .env
nano .env  # Edit with your values

# With performance tuning
cat .env.example .env.performance > .env
```

---

## Documentation Files

### Getting Started (Read First)

#### 1. [DOCKER_QUICK_START.md](DOCKER_QUICK_START.md)
**5-minute quick start guide**
- Prerequisites
- Quick installation
- Service verification
- Common commands
- Port reference

**Start here if:** You want to get running ASAP

#### 2. [DOCKER_README.md](DOCKER_README.md)
**General overview and reference**
- What's included (32 services)
- System requirements
- Common commands
- Service access
- Development workflow
- Production basics
- Monitoring
- Troubleshooting

**Start here if:** You need a general overview

### Comprehensive Guides

#### 3. [docs/DOCKER_DEPLOYMENT.md](docs/DOCKER_DEPLOYMENT.md)
**Complete 25,000+ word deployment guide**

**Contents:**
- Overview & Architecture
- Prerequisites (detailed)
- Quick Start
- Configuration (comprehensive)
- Service Catalog (all 32 services)
- Development Deployment
- Production Deployment
  - SSL Setup
  - NGINX Configuration
  - Scaling
- Monitoring
  - Prometheus setup
  - Grafana dashboards
  - Elasticsearch/Kibana
- Backup & Recovery
  - Automated backups
  - Manual procedures
  - Restore process
- Troubleshooting
  - Common issues
  - Performance problems
  - Debugging tools
- Performance Tuning
  - Database optimization
  - Cache tuning
  - Application tuning
- Security Best Practices
- Maintenance procedures

**Start here if:** You need complete deployment documentation

#### 4. [DOCKER_ARCHITECTURE.md](DOCKER_ARCHITECTURE.md)
**Visual architecture documentation**

**Contents:**
- High-level architecture diagrams
- Layer-by-layer breakdown
  - Reverse proxy layer
  - API gateway layer
  - Microservices layer
  - Infrastructure layer
  - Monitoring layer
- Network architecture
- Data flow examples
- Resource allocation
- Security architecture
- Scalability patterns
- Deployment modes

**Start here if:** You need to understand system architecture

#### 5. [DOCKER_SETUP_COMPLETE.md](DOCKER_SETUP_COMPLETE.md)
**Setup completion summary**

**Contents:**
- What has been configured
- Complete service inventory
- All 40 databases listed
- File structure
- Deployment checklist
- Resource requirements
- Security features
- Next steps

**Start here if:** You want to verify what's been set up

---

## Configuration Reference

### NGINX Configuration

| File | Purpose |
|------|---------|
| **nginx/nginx.conf** | Base NGINX configuration |
| **nginx/conf.d/aitcore.conf** | Site-specific configuration |

**Features:**
- HTTP to HTTPS redirect
- SSL/TLS termination
- Load balancing
- Rate limiting
- WebSocket support
- Security headers
- Gzip compression
- Cache configuration

### Helper Scripts

#### scripts/docker-helper.sh
**Comprehensive management script**

**Available Commands:**
```bash
./scripts/docker-helper.sh <command>

start           # Start all services
stop            # Stop all services
restart         # Restart all services
status          # Show service status
logs [service]  # Show logs
health          # Run health checks
clean           # Clean up Docker
backup          # Backup databases
rebuild [svc]   # Rebuild service(s)
update          # Update images
shell <service> # Open container shell
psql            # PostgreSQL CLI
redis-cli       # Redis CLI
prod-start      # Start production
prod-stop       # Stop production
scale <svc> <n> # Scale service
stats           # Resource usage
version         # Version info
help            # Show help
```

#### scripts/init-multiple-dbs.sh
**Database initialization script**
- Creates 40 databases
- Enables extensions (pgvector, uuid-ossp, pg_trgm)
- Sets permissions

---

## Service Documentation

### Complete Service List (32 Services)

#### Infrastructure Services (7)

1. **PostgreSQL 17** (5432)
   - 40 databases with pgvector
   - Extensions: vector, uuid-ossp, pg_trgm

2. **Redis 7.4** (6379)
   - Cache and sessions
   - AOF persistence

3. **Kafka 7.5** (9092)
   - Event streaming
   - Message broker

4. **Elasticsearch 8.11** (9200)
   - Search engine
   - Log aggregation

5. **MinIO** (9000/9001)
   - S3-compatible storage
   - Object storage

6. **Prometheus** (9090)
   - Metrics collection
   - Time-series database

7. **Grafana** (3005)
   - Dashboards
   - Visualization

#### FastAPI Microservices (21 services, Ports 8000-8020)

| Port | Service | Database |
|------|---------|----------|
| 8000 | Auth Service | auth_db |
| 8001 | Storage Service | storage_db |
| 8002 | Documents Service | documents_db |
| 8003 | Mail Service | mail_db |
| 8004 | Calendar Service | calendar_db |
| 8005 | Tasks Service | tasks_db |
| 8006 | CRM Service | crm_db |
| 8007 | Analytics Service | analytics_db |
| 8008 | HR Service | hr_db |
| 8009 | Workflow Service | workflow_db |
| 8010 | Collaboration Service | collaboration_db |
| 8011 | Spreadsheets Service | spreadsheets_db |
| 8012 | Presentations Service | presentations_db |
| 8013 | Forms Service | forms_db |
| 8014 | Notes Service | notes_db |
| 8015 | Bookings Service | bookings_db |
| 8016 | Assistant Service | assistant_db |
| 8017 | Whiteboard Service | whiteboard_db |
| 8018 | Translator Service | translator_db |
| 8019 | Embedded Apps Service | embedded_apps_db |
| 8020 | Gateway Service | gateway_db |

#### Node.js Services (4)

| Port | Service | Database |
|------|---------|----------|
| 1234 | Collaboration WebSocket | - |
| 3001 | AIT-PGC-Engine | pgc_engine |
| 3002 | API Gateway | soriano_core |
| 3003 | AIT-Accountant | accounting_db |

---

## Common Tasks Quick Reference

### First Time Setup

```bash
# 1. Copy environment
cp .env.example .env

# 2. Edit configuration
nano .env

# 3. Start services
docker compose up -d

# 4. Verify
docker compose ps
./scripts/docker-helper.sh health
```

### Daily Operations

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Restart specific service
docker compose restart auth-service

# View logs
docker compose logs -f auth-service

# Check status
docker compose ps
```

### Development Workflow

```bash
# Start infrastructure only
docker compose up -d postgres redis kafka elasticsearch minio

# Start specific service
docker compose up -d auth-service

# Rebuild after code changes
docker compose up -d --build auth-service

# View real-time logs
docker compose logs -f auth-service
```

### Production Deployment

```bash
# Full production deployment
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale critical services
docker compose up -d --scale gateway-service=3

# Update services
docker compose pull
docker compose up -d
```

### Monitoring & Debugging

```bash
# Health checks
./scripts/docker-helper.sh health

# Resource usage
docker stats

# Service logs
docker compose logs -f

# Database access
./scripts/docker-helper.sh psql

# Container shell
./scripts/docker-helper.sh shell auth-service
```

### Backup & Maintenance

```bash
# Backup databases
./scripts/docker-helper.sh backup

# Clean up
docker system prune -f

# Update images
./scripts/docker-helper.sh update
```

---

## Web Interfaces

| Service | URL | Default Credentials |
|---------|-----|---------------------|
| **Grafana** | http://localhost:3005 | admin / aitcore2024 |
| **MinIO Console** | http://localhost:9001 | aitcore / aitcore2024 |
| **Kibana** | http://localhost:5601 | - |
| **Prometheus** | http://localhost:9090 | - |
| **Prisma Studio** | http://localhost:5555 | - (dev only) |

---

## Environment Variables

### Critical Variables (Must Set)

```bash
# Database
POSTGRES_PASSWORD=your-secure-password

# Redis
REDIS_PASSWORD=your-redis-password

# Security
JWT_SECRET=your-super-secret-jwt-key

# Email (if using mail service)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# AI Services (if using)
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

### Categories

See `.env.example` for complete list organized by category:
- PostgreSQL Configuration
- Redis Configuration
- MinIO Storage
- Elasticsearch
- Kafka
- JWT & Authentication
- API Keys & Secrets
- Email Configuration
- Application Settings
- CORS Configuration
- Rate Limiting
- File Upload Limits
- Feature Flags
- ML/AI Configuration
- OCR Configuration
- Backup Configuration
- Monitoring & Metrics
- Security Settings
- Session Configuration
- And 20+ more categories...

---

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| **Services won't start** | Check logs: `docker compose logs <service>` |
| **Port conflicts** | Edit ports in `docker-compose.yml` |
| **Database connection fails** | Verify `docker compose ps postgres` |
| **Out of memory** | Increase Docker memory to 16GB+ |
| **Permission denied** | Run with `sudo` or add user to docker group |
| **Slow performance** | See Performance Tuning in deployment guide |
| **SSL errors** | Check certificate paths in `.env` |

**Full troubleshooting guide:** [docs/DOCKER_DEPLOYMENT.md#troubleshooting](docs/DOCKER_DEPLOYMENT.md#troubleshooting)

---

## Additional Resources

### External Documentation
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [NGINX Documentation](https://nginx.org/en/docs/)

### Internal Documentation
- [Main README](README.md)
- [Module Registry](MODULE_REGISTRY.json)
- [API Documentation](docs/API.md) (if exists)
- [Development Guide](docs/DEVELOPMENT.md) (if exists)

---

## File Tree

```
ait-core-soriano/
│
├── docker-compose.yml              ← Main configuration
├── docker-compose.prod.yml         ← Production overrides
├── docker-compose.services.yml     ← Optional services
├── docker-compose.test.yml         ← Testing config
│
├── .env.example                    ← Environment template
├── .env.performance                ← Performance tuning
│
├── DOCKER_README.md                ← General overview
├── DOCKER_QUICK_START.md           ← 5-min quick start
├── DOCKER_ARCHITECTURE.md          ← Architecture diagrams
├── DOCKER_SETUP_COMPLETE.md        ← Setup summary
├── DOCKER_INDEX.md                 ← This file
│
├── docs/
│   └── DOCKER_DEPLOYMENT.md        ← Complete deployment guide
│
├── nginx/
│   ├── nginx.conf                  ← NGINX base config
│   └── conf.d/
│       └── aitcore.conf            ← Site configuration
│
├── scripts/
│   ├── docker-helper.sh            ← Management script
│   └── init-multiple-dbs.sh        ← Database init
│
└── services/                       ← Service source code
    ├── auth/
    ├── storage/
    ├── documents/
    └── ... (18 more)
```

---

## Version Information

| Item | Version |
|------|---------|
| **Docker Setup Version** | 1.0.0 |
| **Last Updated** | 2024-01-28 |
| **Docker Engine Required** | 24.0+ |
| **Docker Compose Required** | 2.20+ |
| **PostgreSQL** | 17 with pgvector |
| **Redis** | 7.4 |
| **Kafka** | 7.5 |
| **Elasticsearch** | 8.11 |
| **Python (FastAPI)** | 3.11 |
| **Node.js** | 18+ |

---

## Support

For issues, questions, or improvements:

1. **Check Documentation**
   - Start with [DOCKER_QUICK_START.md](DOCKER_QUICK_START.md)
   - Review [docs/DOCKER_DEPLOYMENT.md](docs/DOCKER_DEPLOYMENT.md)

2. **Run Health Checks**
   ```bash
   ./scripts/docker-helper.sh health
   docker compose ps
   docker compose logs
   ```

3. **Common Solutions**
   - Restart services: `docker compose restart`
   - Rebuild: `docker compose up -d --build`
   - Clean slate: `docker compose down -v && docker compose up -d`

4. **Get Help**
   - Check logs: `docker compose logs -f <service>`
   - Use helper: `./scripts/docker-helper.sh help`
   - Review troubleshooting guide

---

## Quick Commands Cheatsheet

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down

# View status
docker compose ps

# View logs
docker compose logs -f

# Health check
./scripts/docker-helper.sh health

# Database access
./scripts/docker-helper.sh psql

# Backup
./scripts/docker-helper.sh backup

# Production mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale service
docker compose up -d --scale gateway-service=3

# Restart service
docker compose restart auth-service

# Rebuild service
docker compose up -d --build auth-service

# Clean up
docker compose down -v && docker system prune -af
```

---

**Status**: ✅ Complete and Production Ready

**Total Services**: 32 (7 infrastructure + 21 FastAPI + 4 Node.js)

**Total Databases**: 40 with pgvector

**Documentation**: 100+ pages across 5 comprehensive guides

**Configuration**: 3,000+ lines of Docker Compose YAML

**Ready to deploy!** 🚀
