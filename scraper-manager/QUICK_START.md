# Quick Start Guide

Get up and running with Scraper Manager in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ PostgreSQL 14+ installed and running
- ✅ Redis 7+ installed (or Docker)
- ✅ Elasticsearch 8+ installed (or Docker)

## Installation Methods

### Method 1: Docker (Recommended - Easiest)

1. **Install Docker Desktop**
   - Download from https://www.docker.com/products/docker-desktop

2. **Clone and run**
   ```bash
   cd C:\Users\rsori\codex\scraper-manager
   docker-compose up -d
   ```

3. **Access the dashboard**
   ```
   http://localhost:3000
   ```

That's it! Everything is configured and running.

### Method 2: Manual Setup

1. **Run setup script**
   ```bash
   cd C:\Users\rsori\codex\scraper-manager
   scripts\setup.bat
   ```

2. **Start required services**

   **PostgreSQL**: Already installed and running

   **Redis** (Option A - Docker):
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

   **Elasticsearch** (Option A - Docker):
   ```bash
   docker run -d -p 9200:9200 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:8.13.0
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

4. **Access dashboard**
   ```
   http://localhost:3000
   ```

## First Time Setup

### 1. Configure Environment

Edit `.env` file with your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/scraper_manager"

# Portal Credentials
PORTAL_URL="https://oficinavirtual.occident.es"
PORTAL_USERNAME="your_username"
PORTAL_PASSWORD="your_password"

# Microsoft Graph API (for OneDrive scrapers)
MICROSOFT_CLIENT_ID="your_client_id"
MICROSOFT_CLIENT_SECRET="your_client_secret"
MICROSOFT_TENANT_ID="your_tenant_id"

# OpenAI (for AI scrapers)
OPENAI_API_KEY="sk-..."
```

### 2. Initialize Database

```bash
npm run db:push
```

### 3. Seed Scrapers

```bash
npx ts-node scripts/seed-scrapers.ts
```

## Using the Dashboard

### Home Page
- View all scrapers in card format
- See statistics (total scrapers, running, completed, failed)
- Quick start/stop buttons on each card

### Scraper Detail Page
Click any scraper to see:
- **Overview**: Tech stack, features, recent executions
- **Execution**: Real-time progress tracking
- **Logs**: Live log viewer with filtering
- **Configuration**: Scraper settings
- **Metrics**: Performance analytics

### Starting a Scraper

1. Click on scraper card
2. Click "Start" button
3. Monitor real-time progress
4. View logs in real-time
5. Check execution results

## Testing Your Setup

### Test 1: Check Dashboard
```bash
npm run dev
# Open http://localhost:3000
# You should see 9 scrapers
```

### Test 2: Check Database Connection
```bash
npx prisma studio
# Opens database GUI at http://localhost:5555
```

### Test 3: Check Redis Connection
```bash
# In Node.js REPL
node
> const redis = require('ioredis')
> const client = new redis('redis://localhost:6379')
> client.ping().then(console.log) // Should print 'PONG'
```

### Test 4: Check Elasticsearch
```bash
curl http://localhost:9200
# Should return cluster info
```

## Running Your First Scraper

### Example: Ultimate Client Scraper

1. **Configure scraper**
   - Go to scraper detail page
   - Click "Configuration" tab
   - Set portal credentials
   - Enable recording if desired

2. **Start scraping**
   - Click "Execution" tab
   - Click "Start" button
   - Watch real-time progress

3. **Monitor logs**
   - Switch to "Logs" tab
   - Filter by level (INFO, WARN, ERROR)
   - Auto-scrolls with new logs

4. **View results**
   - Check "Metrics" tab for performance
   - Data automatically goes to DataHub
   - Check database with Prisma Studio

## Common Issues & Solutions

### Issue: Database connection failed
**Solution**: Check PostgreSQL is running and credentials in .env are correct
```bash
psql -U postgres -c "SELECT 1"
```

### Issue: Redis connection failed
**Solution**: Start Redis
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### Issue: Elasticsearch connection failed
**Solution**: Start Elasticsearch
```bash
docker run -d -p 9200:9200 -e "discovery.type=single-node" elasticsearch:8.13.0
```

### Issue: Port 3000 already in use
**Solution**: Kill the process or change port
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in .env
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Issue: Playwright browser not found
**Solution**: Install browsers
```bash
npx playwright install chromium
```

## Project Structure

```
scraper-manager/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Dashboard home
│   ├── scrapers/          # Scraper pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── ScraperCard.tsx   # Scraper card
│   ├── LogViewer.tsx     # Log viewer
│   └── ProgressTracker.tsx # Progress tracker
├── lib/                   # Utilities
│   ├── prisma.ts         # Prisma client
│   ├── redis.ts          # Redis client
│   ├── elasticsearch.ts  # Elasticsearch client
│   └── websocket.ts      # WebSocket server
├── connector/             # Module connector
│   ├── index.ts          # Main connector
│   ├── module-registry.ts # Module registry
│   └── datahub-connector.ts # DataHub connector
├── scrapers/              # Scraper modules
│   ├── ultimate-client-scraper/
│   ├── document-scraper/
│   └── ... (7 more)
├── prisma/
│   └── schema.prisma     # Database schema
└── scripts/
    ├── seed-scrapers.ts  # Seed script
    └── setup.bat         # Setup script
```

## Next Steps

1. **Explore scrapers**: Check each scraper's capabilities
2. **Configure credentials**: Add your portal and API credentials
3. **Test scrapers**: Run scrapers on test data
4. **Monitor performance**: Use analytics dashboard
5. **Customize**: Add new scrapers or modify existing ones

## Support

For issues or questions:
- Check `README.md` for detailed documentation
- Review scraper-specific documentation in each scraper folder
- Check logs in `logs/` directory
- Use Prisma Studio to inspect database

## Production Deployment

See `README.md` section on deployment for:
- Docker production setup
- Environment configuration
- Security hardening
- Performance optimization
- Monitoring setup

---

**Ready to scrape!** 🚀

Your dashboard should now be running at http://localhost:3000
