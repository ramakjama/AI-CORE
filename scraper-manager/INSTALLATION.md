# Complete Installation Guide

This guide will walk you through installing and running the Scraper Manager system from scratch.

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

1. **Node.js 18+**
   - Download: https://nodejs.org/
   - Verify: `node --version` (should be v18 or higher)

2. **PostgreSQL 14+**
   - Download: https://www.postgresql.org/download/
   - Verify: `psql --version`

3. **Git** (optional, for version control)
   - Download: https://git-scm.com/

### Optional (Recommended for easier setup)

4. **Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop
   - Includes Docker and Docker Compose
   - Makes Redis and Elasticsearch setup trivial

---

## Installation Method 1: Docker (Easiest - Recommended)

This method uses Docker to run all services (PostgreSQL, Redis, Elasticsearch, and the app).

### Step 1: Install Docker Desktop

Download and install Docker Desktop from https://www.docker.com/products/docker-desktop

### Step 2: Clone/Navigate to Project

```bash
cd C:\Users\rsori\codex\scraper-manager
```

### Step 3: Configure Environment

```bash
# Copy example env file
copy .env.example .env

# Edit .env with your credentials
notepad .env
```

**Required variables to set**:
```env
# Portal Credentials
PORTAL_URL="https://oficinavirtual.occident.es"
PORTAL_USERNAME="your_username"
PORTAL_PASSWORD="your_password"

# Microsoft Graph (for OneDrive scrapers)
MICROSOFT_CLIENT_ID="your_client_id"
MICROSOFT_CLIENT_SECRET="your_client_secret"
MICROSOFT_TENANT_ID="your_tenant_id"

# OpenAI (for AI scrapers)
OPENAI_API_KEY="sk-..."
```

### Step 4: Start Everything

```bash
docker-compose up -d
```

This single command will:
- Start PostgreSQL
- Start Redis
- Start Elasticsearch
- Build and start the application
- Create required volumes
- Setup networking

### Step 5: Initialize Database

```bash
# Wait 30 seconds for services to be ready, then:

# Push database schema
docker-compose exec app npx prisma db push

# Seed scrapers
docker-compose exec app npx ts-node scripts/seed-scrapers.ts
```

### Step 6: Access Dashboard

Open your browser: `http://localhost:3000`

You should see the Scraper Manager dashboard with 9 scrapers!

### Docker Management Commands

```bash
# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View running containers
docker-compose ps

# Access database
docker-compose exec postgres psql -U scraper_user scraper_manager
```

---

## Installation Method 2: Manual Setup

This method installs each service individually on your machine.

### Step 1: Install PostgreSQL

1. Download PostgreSQL 15 from https://www.postgresql.org/download/windows/
2. Run installer
3. Set password for postgres user
4. Note the port (default: 5432)

**Create Database**:
```bash
# Open pgAdmin or use psql
psql -U postgres

# In psql:
CREATE DATABASE scraper_manager;
CREATE USER scraper_user WITH PASSWORD 'scraper_password';
GRANT ALL PRIVILEGES ON DATABASE scraper_manager TO scraper_user;
\q
```

### Step 2: Install Redis

**Option A: Docker (Easier)**
```bash
docker run -d -p 6379:6379 --name scraper-redis redis:7-alpine
```

**Option B: Windows Installer**
1. Download from https://github.com/microsoftarchive/redis/releases
2. Run installer
3. Start Redis service

**Verify Redis**:
```bash
redis-cli ping
# Should return: PONG
```

### Step 3: Install Elasticsearch

**Option A: Docker (Easier)**
```bash
docker run -d -p 9200:9200 -e "discovery.type=single-node" -e "xpack.security.enabled=false" --name scraper-elasticsearch docker.elastic.co/elasticsearch/elasticsearch:8.13.0
```

**Option B: Manual Install**
1. Download from https://www.elastic.co/downloads/elasticsearch
2. Extract to a folder
3. Edit `config/elasticsearch.yml`:
   ```yaml
   xpack.security.enabled: false
   discovery.type: single-node
   ```
4. Run: `bin\elasticsearch.bat`

**Verify Elasticsearch**:
```bash
curl http://localhost:9200
# Should return cluster info JSON
```

### Step 4: Install Node.js Dependencies

```bash
cd C:\Users\rsori\codex\scraper-manager

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Step 5: Configure Environment

```bash
# Copy example
copy .env.example .env

# Edit .env
notepad .env
```

**Update these values in .env**:
```env
# Database (use your PostgreSQL settings)
DATABASE_URL="postgresql://scraper_user:scraper_password@localhost:5432/scraper_manager?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Elasticsearch
ELASTICSEARCH_NODE="http://localhost:9200"

# Portal Credentials
PORTAL_URL="https://oficinavirtual.occident.es"
PORTAL_USERNAME="your_username"
PORTAL_PASSWORD="your_password"

# Microsoft Graph
MICROSOFT_CLIENT_ID="your_client_id"
MICROSOFT_CLIENT_SECRET="your_client_secret"
MICROSOFT_TENANT_ID="your_tenant_id"

# OpenAI
OPENAI_API_KEY="sk-..."
```

### Step 6: Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed scrapers
npx ts-node scripts/seed-scrapers.ts
```

### Step 7: Start Development Server

```bash
npm run dev
```

### Step 8: Access Dashboard

Open browser: `http://localhost:3000`

---

## Post-Installation Setup

### 1. Verify Installation

**Check Dashboard**:
- Navigate to `http://localhost:3000`
- You should see 9 scraper cards
- Statistics should show: 9 total scrapers, 0 running

**Check Database**:
```bash
# Open Prisma Studio
npm run db:studio
```
Navigate to `http://localhost:5555` and verify:
- Scraper table has 9 records
- Module table has 5 records

**Check Services**:
```bash
# PostgreSQL
psql -U scraper_user -d scraper_manager -c "SELECT COUNT(*) FROM \"Scraper\";"
# Should return: 9

# Redis
redis-cli ping
# Should return: PONG

# Elasticsearch
curl http://localhost:9200
# Should return cluster info
```

### 2. Configure First Scraper

1. Click on "Ultimate Client Scraper" card
2. Navigate to "Configuration" tab
3. Verify settings:
   - Enabled: ✓
   - Max Retries: 3
   - Timeout: 300000ms

### 3. Test Run (Optional)

**Test the Ultimate Client Scraper**:

1. Ensure portal credentials are correct in `.env`
2. Click "Start" on the Ultimate Client Scraper card
3. Navigate to "Execution" tab to see progress
4. Navigate to "Logs" tab to see real-time logs

---

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution**:
1. Verify PostgreSQL is running:
   ```bash
   # Windows
   services.msc
   # Look for "postgresql-x64-15" service
   ```

2. Test connection manually:
   ```bash
   psql -U scraper_user -d scraper_manager
   ```

3. Verify DATABASE_URL in `.env` is correct

### Issue: "Redis connection failed"

**Solution**:
1. Check if Redis is running:
   ```bash
   redis-cli ping
   ```

2. If using Docker:
   ```bash
   docker ps | grep redis
   # If not running:
   docker start scraper-redis
   ```

3. Verify REDIS_URL in `.env`

### Issue: "Elasticsearch connection failed"

**Solution**:
1. Check if Elasticsearch is running:
   ```bash
   curl http://localhost:9200
   ```

2. If using Docker:
   ```bash
   docker ps | grep elasticsearch
   # If not running:
   docker start scraper-elasticsearch
   ```

3. Wait 30 seconds after starting (Elasticsearch takes time to initialize)

### Issue: "Port 3000 already in use"

**Solution**:
1. Find and kill the process:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. Or change the port:
   ```bash
   # In .env
   PORT=3001
   ```

### Issue: "Prisma Client not generated"

**Solution**:
```bash
npx prisma generate
```

### Issue: "Module not found" errors

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Issue: Playwright browser not found

**Solution**:
```bash
npx playwright install chromium --with-deps
```

---

## Microsoft Graph API Setup (For OneDrive Scrapers)

### Step 1: Register Azure AD App

1. Go to https://portal.azure.com
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Name: "Scraper Manager"
5. Supported account types: "Single tenant"
6. Click "Register"

### Step 2: Get Credentials

1. Copy "Application (client) ID" → `MICROSOFT_CLIENT_ID`
2. Copy "Directory (tenant) ID" → `MICROSOFT_TENANT_ID`

### Step 3: Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Description: "Scraper Manager Secret"
4. Expires: 24 months
5. Click "Add"
6. Copy the "Value" → `MICROSOFT_CLIENT_SECRET`

### Step 4: Set Permissions

1. Go to "API permissions"
2. Click "Add a permission"
3. Choose "Microsoft Graph"
4. Choose "Application permissions"
5. Add these permissions:
   - Files.ReadWrite.All
   - Sites.ReadWrite.All
   - User.Read.All
6. Click "Grant admin consent"

### Step 5: Update .env

```env
MICROSOFT_CLIENT_ID="your_client_id"
MICROSOFT_CLIENT_SECRET="your_client_secret"
MICROSOFT_TENANT_ID="your_tenant_id"
```

---

## OpenAI API Setup (For AI Scrapers)

### Step 1: Get API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name: "Scraper Manager"
4. Copy the key

### Step 2: Update .env

```env
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"
```

---

## Production Deployment

### Using Docker (Recommended)

```bash
# Build production image
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Environment Variables for Production

Update these in production `.env`:
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://scraper.yourdomain.com
DATABASE_URL=postgresql://user:pass@db-host:5432/scraper_manager
REDIS_URL=redis://redis-host:6379
ELASTICSEARCH_NODE=https://es-host:9200
```

### Security Hardening

1. **Change default passwords**
2. **Enable HTTPS** (use nginx or Cloudflare)
3. **Setup firewall** (only expose port 443)
4. **Enable Redis authentication**
5. **Enable Elasticsearch security**
6. **Use environment variable encryption**

---

## Maintenance

### Daily Tasks

```bash
# Check system health
docker-compose ps

# View recent logs
docker-compose logs --tail=100

# Check disk usage
docker system df
```

### Weekly Tasks

```bash
# Backup database
docker-compose exec postgres pg_dump -U scraper_user scraper_manager > backup.sql

# Clean up Docker
docker system prune -a
```

### Monthly Tasks

```bash
# Update dependencies
npm update

# Update Docker images
docker-compose pull
docker-compose up -d
```

---

## Next Steps

After successful installation:

1. ✅ Verify all services are running
2. ✅ Access dashboard at http://localhost:3000
3. ✅ Configure first scraper
4. ✅ Test scraper execution
5. ✅ Review logs and metrics
6. ✅ Configure additional scrapers as needed
7. ✅ Setup scheduled jobs (if needed)
8. ✅ Configure monitoring (if production)

---

## Getting Help

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Review `README.md` for detailed documentation
3. Check logs: `docker-compose logs` or `logs/` directory
4. Use Prisma Studio to inspect database: `npm run db:studio`
5. Check service health: `docker-compose ps`

---

**Installation Complete!** 🎉

Your Scraper Manager system is now ready to use. Navigate to `http://localhost:3000` to start managing your scrapers!
