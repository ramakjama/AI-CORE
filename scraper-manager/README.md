# Scraper Manager - Professional Multi-Scraper System

A complete, production-ready multi-scraper management system with real-time monitoring, AI capabilities, and enterprise-grade architecture.

## 🌟 Features

### Core Platform
- **Beautiful Modern Dashboard** - Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Real-time Monitoring** - WebSocket-based live logs and progress tracking
- **Professional UI/UX** - Card-based scraper management with detailed views
- **Comprehensive Analytics** - Performance metrics and visual reports
- **Configuration Management** - Per-scraper configuration with validation

### 9 Professional Scrapers

#### 1. Ultimate Client Scraper (5-Star Ultra)
- Complete database download
- Visual, text, audio, and transcription collection
- **Screen recording with mouse cursor** (FFmpeg + Playwright)
- Full live visualization
- NIF-based client search
- Maximum depth extraction (tabs, subtabs, windows, actions, buttons, documents)
- **Auto-add missing database fields**
- **Multiple client variants handling**
- Complete backup system

#### 2. Document Downloader & Organizer
- Download ALL client documents (certificates, policies, receipts, claims, communications)
- OneDrive structure mirroring
- Automatic organization by Client NIF / Document Type / Date
- Microsoft Graph API integration
- Database indexing

#### 3. Portfolio Surveillance (Vigilancia de Cartera)
- Portfolio monitoring database download
- Excel/CSV export processing
- Data normalization and insertion to Prisma
- Automated reporting

#### 4. Portfolio Defense (Defensa de Cartera)
- Portfolio defense database download
- Excel processing pipeline
- DataAdmin integration

#### 5. Main Database Downloader
- Portal database extraction (Candidates, Policies, Receipts, Claims)
- Prisma ORM integration
- DataAdmin module connectivity
- Connector-based module linking

#### 6. OneDrive Analyzer & Optimizer
- Complete OneDrive structure analysis
- Duplicate detection
- Large file identification
- Unused file detection (>1 year)
- Disorganization detection
- **AI-powered reorganization proposals**
- Visual reports
- Automated action execution

#### 7. Microsoft 365 Auto-Configurator
- M365 organization analysis
- Auto-configuration for:
  - Exchange Online (mail rules, retention)
  - SharePoint (sites, permissions)
  - Teams (channels, policies)
  - OneDrive (quotas, sharing)
  - Security & Compliance
  - Azure AD (users, groups, conditional access)
- Industry best practices application

#### 8. AI-Powered Data Enrichment
- Client pattern analysis
- Churn risk prediction
- Cross-sell opportunity identification
- Automatic client categorization
- GPT-4 document insight extraction
- Client summaries generation
- Vector database integration (Pinecone/pgvector)

#### 9. Competitor Intelligence
- Competitor website monitoring
- Pricing change tracking
- Product analysis
- Competitive analysis reports
- Market change alerts

## 🏗️ Architecture

### Tech Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Recharts (visualizations)
- Socket.IO Client (real-time)

**Backend**
- Node.js
- Prisma ORM
- PostgreSQL (main database)
- Redis (caching + pub/sub)
- Elasticsearch (search & indexing)
- WebSockets (real-time communication)
- BullMQ (job queue)

**Scraping**
- Playwright (browser automation)
- FFmpeg (screen recording)
- Tesseract + EasyOCR (OCR)
- Whisper (audio transcription)
- Sharp (image processing)

**AI/ML**
- OpenAI API (GPT-4)
- LangChain
- Pinecone (vector database)

**Cloud Integration**
- Microsoft Graph API
- Azure AD API
- OneDrive API

### Database Schema

Complete Prisma schema with models for:
- Scraper management (Scraper, ScraperConfig, ScraperExecution, ScraperLog, ScraperMetric)
- Client data (Client, ClientVariant)
- Insurance data (Policy, Receipt, Claim)
- Documents (Document)
- Portfolio (PortfolioSurveillance, PortfolioDefense)
- Cloud storage (OneDriveFile, M365Config)
- AI/ML (AIEnrichment, CompetitorData)
- Connector (Module, ModuleEvent)

### Connector Architecture

Universal connector system that:
- Connects DataHub with all vital modules
- Provides API for external/internal non-vital modules
- Implements event bus (Redis pub/sub)
- Handles data synchronization
- Manages module dependencies

## 📦 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Elasticsearch 8+
- FFmpeg (for recording)

### Quick Start

1. **Clone and install dependencies**
```bash
cd C:\Users\rsori\codex\scraper-manager
npm install
```

2. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Setup database**
```bash
npm run db:push
```

4. **Run development server**
```bash
npm run dev
```

5. **Access dashboard**
```
http://localhost:3000
```

## ⚙️ Configuration

### Environment Variables

See `.env.example` for all required variables:
- Database connections (PostgreSQL, Redis, Elasticsearch)
- Portal credentials
- Microsoft Graph API credentials
- OpenAI API key
- OneDrive paths
- Recording settings
- Security keys

### Scraper Configuration

Each scraper can be configured individually through:
1. Dashboard UI (Configuration tab)
2. Database (ScraperConfig model)
3. Environment variables

## 🚀 Usage

### Starting a Scraper

**Via Dashboard:**
1. Navigate to home page
2. Click "Start" on any scraper card
3. Monitor real-time progress in the detail view

**Via API:**
```typescript
POST /api/scrapers/:slug/start
```

### Monitoring Execution

1. Navigate to scraper detail page (`/scrapers/:slug`)
2. View tabs:
   - Overview: General info and recent executions
   - Execution: Real-time progress tracker
   - Logs: Live log viewer with filtering
   - Configuration: Scraper settings
   - Metrics: Performance analytics

### Real-time Features

- **Live Logs**: WebSocket connection for instant log streaming
- **Progress Updates**: Real-time progress bars and metrics
- **Status Indicators**: Live status changes (running/stopped/error)

## 📊 DataHub Integration

All scrapers automatically send data to DataHub:

```typescript
import { connector } from '@/connector';

// Data automatically flows to DataHub
await connector.publishEvent('scraper:completed', {
  scraperId: 'ultimate-client-scraper',
  data: clientData
});

// DataHub connector handles:
// - Data validation
// - Database insertion
// - Event broadcasting
// - Module synchronization
```

## 🔌 Module Connector

Register external modules:

```typescript
await connector.registerModule({
  name: 'My Custom Module',
  slug: 'custom-module',
  type: 'EXTERNAL',
  apiEndpoint: 'https://api.example.com/webhook',
  isVital: false
});
```

## 🎨 Adding New Scrapers

1. Create scraper directory:
```bash
mkdir scrapers/my-scraper
```

2. Create `package.json` and implementation
3. Register in database:
```typescript
await prisma.scraper.create({
  data: {
    name: 'My Scraper',
    slug: 'my-scraper',
    description: 'Description',
    category: 'CLIENT_DATA',
    techStack: ['Playwright', 'Node.js'],
    features: ['Feature 1', 'Feature 2'],
    version: '1.0.0',
    status: 'STOPPED'
  }
});
```

## 🔒 Security

- Encrypted credentials in database
- JWT authentication
- Rate limiting
- Input validation
- SQL injection protection (Prisma)
- XSS protection
- CSRF tokens

## 📈 Performance

- Redis caching for frequent queries
- Elasticsearch for fast search
- BullMQ for background jobs
- Connection pooling
- Optimized database queries
- CDN for static assets

## 🐛 Debugging

Enable debug mode:
```bash
LOG_LEVEL=debug npm run dev
```

View logs:
```bash
# Real-time logs in dashboard
/logs

# Or check log files
tail -f logs/scraper-manager.log
```

## 📝 API Reference

### Scrapers

- `GET /api/scrapers` - List all scrapers
- `GET /api/scrapers/:slug` - Get scraper details
- `POST /api/scrapers/:slug/start` - Start scraper
- `POST /api/scrapers/:slug/stop` - Stop scraper
- `PUT /api/scrapers/:slug/config` - Update configuration

### DataHub

- `POST /api/datahub/clients` - Insert client
- `GET /api/datahub/clients/:nif` - Get client
- `POST /api/datahub/policies` - Insert policy
- `POST /api/datahub/documents` - Insert document

### Modules

- `GET /api/modules` - List modules
- `POST /api/modules` - Register module
- `GET /api/modules/:slug/health` - Health check

## 🤝 Contributing

This is a private enterprise system. For internal contributions:
1. Create feature branch
2. Implement changes
3. Test thoroughly
4. Submit for review

## 📄 License

Proprietary - All Rights Reserved

## 👨‍💻 Author

**Soriano Mediadores**
- Insurance Brokerage Technology Division
- Contact: admin@sorianomediadores.com

## 🙏 Acknowledgments

- Playwright team for browser automation
- Prisma team for excellent ORM
- shadcn for beautiful UI components
- OpenAI for AI capabilities

---

**Version:** 1.0.0
**Last Updated:** 2026-01-28
**Status:** Production Ready ✅
