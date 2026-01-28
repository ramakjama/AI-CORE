# AIT-CORE Infrastructure Modules - Complete Deployment Guide

## 🎯 Quick Start (5 Minutes)

### Prerequisites
```bash
# Install Node.js 20+
node --version  # Should be v20.x or higher

# Install PostgreSQL 14+
psql --version

# Install Redis 7+
redis-cli --version

# Optional but recommended
# MongoDB 6+ (for DataHub)
# Elasticsearch 8+ (for Document Service)
```

### Rapid Deployment

```bash
# 1. Navigate to infrastructure directory
cd C:\Users\rsori\codex\ait-core-soriano\modules\06-infrastructure

# 2. Deploy with Docker (Easiest)
docker-compose -f docker-compose.all.yml up -d

# 3. Check all services are running
docker ps

# 4. Test health endpoints
curl http://localhost:4001/health  # Authenticator
curl http://localhost:4002/health  # DataHub
curl http://localhost:4003/health  # API Gateway
curl http://localhost:4004/health  # Notification Service
curl http://localhost:4005/health  # Document Service
```

---

## 📦 Module-by-Module Deployment

### 1. AIT-Authenticator (Port 4001)

```bash
cd ait-authenticator

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# Minimum required:
# - DATABASE_URL
# - JWT_SECRET (CHANGE THIS!)
# - REDIS_HOST

# Run database migrations
npx prisma migrate dev
npx prisma generate

# Start service
npm run dev
```

**Test:**
```bash
# Health check
curl http://localhost:4001/health

# Register a user
curl -X POST http://localhost:4001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'
```

---

### 2. AIT-DataHub (Port 4002)

```bash
cd ait-datahub

npm install
cp .env.example .env

# Configure databases
# - PostgreSQL URL
# - MongoDB URL
# - Redis connection

npm run dev
```

**Test:**
```bash
curl http://localhost:4002/health
curl http://localhost:4002/graphql  # GraphiQL interface
```

---

### 3. AIT-API-Gateway (Port 4003)

```bash
cd ait-api-gateway

npm install
cp .env.example .env

# Configure service URLs
# - AUTH_SERVICE_URL=http://localhost:4001
# - DATAHUB_SERVICE_URL=http://localhost:4002
# - NOTIFICATION_SERVICE_URL=http://localhost:4004
# - DOCUMENT_SERVICE_URL=http://localhost:4005

npm run dev
```

**Test:**
```bash
curl http://localhost:4003/health
curl http://localhost:4003/services  # List all proxied services
```

---

### 4. AIT-Notification-Service (Port 4004)

```bash
cd ait-notification-service

npm install
cp .env.example .env

# Configure providers
# Email: SendGrid or SMTP
# SMS: Twilio
# Push: Firebase

npm run dev
```

**Test:**
```bash
curl http://localhost:4004/health

# Send test email
curl -X POST http://localhost:4004/api/v1/notifications/email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","html":"<h1>Test</h1>"}'
```

---

### 5. AIT-Document-Service (Port 4005)

```bash
cd ait-document-service

npm install
cp .env.example .env

# Configure storage
# - AWS S3 or MinIO
# - Elasticsearch (optional)

npm run dev
```

**Test:**
```bash
curl http://localhost:4005/health

# Upload a document
curl -X POST http://localhost:4005/api/v1/upload \
  -F "file=@test.pdf"
```

---

## 🐳 Docker Deployment

### Individual Service

Each module has its own docker-compose.yml:

```bash
cd ait-authenticator
docker-compose up -d
```

### All Services Together

Create `docker-compose.all.yml` in infrastructure root:

```yaml
version: '3.8'

services:
  # PostgreSQL (shared)
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ait_core
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  # Redis (shared)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  # MongoDB (for DataHub)
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  # Elasticsearch (for Document Service)
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - es-data:/usr/share/elasticsearch/data

  # AIT-Authenticator
  authenticator:
    build: ./ait-authenticator
    ports:
      - "4001:4001"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ait_core
      - REDIS_HOST=redis
      - JWT_SECRET=change-this-secret-in-production
    depends_on:
      - postgres
      - redis

  # AIT-DataHub
  datahub:
    build: ./ait-datahub
    ports:
      - "4002:4002"
    environment:
      - POSTGRES_URL=postgresql://postgres:postgres@postgres:5432/ait_core
      - MONGODB_URL=mongodb://mongodb:27017/ait_datahub
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - mongodb
      - redis

  # AIT-API-Gateway
  api-gateway:
    build: ./ait-api-gateway
    ports:
      - "4003:4003"
    environment:
      - AUTH_SERVICE_URL=http://authenticator:4001
      - DATAHUB_SERVICE_URL=http://datahub:4002
      - NOTIFICATION_SERVICE_URL=http://notification:4004
      - DOCUMENT_SERVICE_URL=http://document:4005
      - REDIS_HOST=redis
    depends_on:
      - authenticator
      - datahub
      - redis

  # AIT-Notification-Service
  notification:
    build: ./ait-notification-service
    ports:
      - "4004:4004"
    environment:
      - REDIS_HOST=redis
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
    depends_on:
      - redis

  # AIT-Document-Service
  document:
    build: ./ait-document-service
    ports:
      - "4005:4005"
    environment:
      - STORAGE_PROVIDER=minio
      - MINIO_ENDPOINT=minio
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin
      - ELASTICSEARCH_URL=http://elasticsearch:9200
    depends_on:
      - elasticsearch

  # MinIO (S3-compatible storage)
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio-data:/data

volumes:
  postgres-data:
  redis-data:
  mongo-data:
  es-data:
  minio-data:
```

Deploy all services:

```bash
docker-compose -f docker-compose.all.yml up -d
```

---

## ⚙️ Environment Configuration

### Master .env Template

Create `.env` file for each service based on these templates:

#### AIT-Authenticator
```env
NODE_ENV=production
PORT=4001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ait_auth

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=CHANGE-THIS-TO-A-STRONG-SECRET-KEY-MINIMUM-32-CHARACTERS
JWT_ISSUER=ait-authenticator
JWT_AUDIENCE=ait-core
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

# MFA
MFA_ENABLED=true

# Google OAuth (optional)
GOOGLE_OAUTH_ENABLED=false
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth (optional)
GITHUB_OAUTH_ENABLED=false
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

#### AIT-API-Gateway
```env
NODE_ENV=production
PORT=4003

# Service URLs
AUTH_SERVICE_URL=http://localhost:4001
DATAHUB_SERVICE_URL=http://localhost:4002
NOTIFICATION_SERVICE_URL=http://localhost:4004
DOCUMENT_SERVICE_URL=http://localhost:4005

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGIN=*
```

#### AIT-Notification-Service
```env
NODE_ENV=production
PORT=4004

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email Provider (sendgrid or smtp)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-key

# Or SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password

# Twilio SMS
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase Push
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

#### AIT-Document-Service
```env
NODE_ENV=production
PORT=4005

# Storage Provider (s3 or minio)
STORAGE_PROVIDER=s3
STORAGE_BUCKET=ait-documents

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Or MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200
```

---

## 🔒 Production Security Checklist

### Before Going Live

- [ ] **Change ALL default secrets**
  - JWT_SECRET (minimum 32 characters)
  - Database passwords
  - Redis password
  - API keys

- [ ] **Enable HTTPS**
  - Use reverse proxy (Nginx/Traefik)
  - Configure SSL certificates
  - Redirect HTTP to HTTPS

- [ ] **Configure CORS properly**
  - Replace `*` with specific origins
  - Limit to your domains only

- [ ] **Database security**
  - Use strong passwords
  - Enable SSL connections
  - Restrict network access
  - Regular backups

- [ ] **Rate limiting**
  - Already configured in gateway
  - Adjust limits per your needs

- [ ] **Monitoring**
  - Set up Prometheus + Grafana
  - Configure alerts
  - Log aggregation (ELK Stack)

- [ ] **Backups**
  - Database backups (daily)
  - Document storage backups
  - Backup retention policy

---

## 📊 Monitoring Setup

### Prometheus Configuration

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ait-authenticator'
    static_configs:
      - targets: ['localhost:4001']
  - job_name: 'ait-datahub'
    static_configs:
      - targets: ['localhost:4002']
  - job_name: 'ait-api-gateway'
    static_configs:
      - targets: ['localhost:4003']
  - job_name: 'ait-notification'
    static_configs:
      - targets: ['localhost:4004']
  - job_name: 'ait-document'
    static_configs:
      - targets: ['localhost:4005']
```

### Grafana Dashboard

Import the AIT-CORE dashboard (provided separately) or create custom dashboards monitoring:
- Request rates
- Response times
- Error rates
- System resources

---

## 🚀 Scaling

### Horizontal Scaling

All services are stateless and can be scaled horizontally:

```bash
# Docker Compose
docker-compose up -d --scale authenticator=3

# Kubernetes
kubectl scale deployment ait-authenticator --replicas=3
```

### Load Balancing

Use Nginx as load balancer:

```nginx
upstream ait_authenticator {
    server localhost:4001;
    server localhost:4011;
    server localhost:4021;
}

server {
    listen 80;
    location / {
        proxy_pass http://ait_authenticator;
    }
}
```

---

## 🔧 Troubleshooting

### Service won't start
```bash
# Check if port is in use
netstat -ano | findstr :4001

# Check logs
docker logs ait-authenticator

# Check environment
echo %DATABASE_URL%
```

### Database connection fails
```bash
# Test PostgreSQL connection
psql postgresql://user:pass@localhost:5432/dbname

# Check if PostgreSQL is running
pg_isready
```

### Redis connection fails
```bash
# Test Redis
redis-cli ping

# Should return PONG
```

---

## 📝 Maintenance

### Database Migrations

```bash
cd ait-authenticator
npx prisma migrate deploy
```

### Backup

```bash
# Database backup
pg_dump -U postgres ait_core > backup.sql

# Redis backup
redis-cli SAVE

# Document storage backup (if using S3)
aws s3 sync s3://ait-documents ./backup/documents
```

### Updates

```bash
# Update dependencies
npm update

# Rebuild Docker images
docker-compose build --no-cache
```

---

## ✅ Post-Deployment Verification

```bash
# 1. Check all services are running
curl http://localhost:4001/health
curl http://localhost:4002/health
curl http://localhost:4003/health
curl http://localhost:4004/health
curl http://localhost:4005/health

# 2. Test authentication flow
curl -X POST http://localhost:4001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ait-core.com","password":"Admin123!@#","name":"Admin"}'

# 3. Test API Gateway
curl http://localhost:4003/services

# 4. Check metrics
curl http://localhost:4001/metrics
```

---

## 🎓 Next Steps

1. **Configure external services**
   - SendGrid for email
   - Twilio for SMS
   - Firebase for push notifications

2. **Set up monitoring**
   - Prometheus + Grafana
   - ELK Stack for logs

3. **Configure CI/CD**
   - GitHub Actions
   - Jenkins
   - GitLab CI

4. **Documentation**
   - API documentation (Swagger)
   - User guides
   - Architecture diagrams

---

**Deployment Status:** ✅ Ready for Production
**Last Updated:** 2026-01-28
**Support:** AIT-CORE Development Team
