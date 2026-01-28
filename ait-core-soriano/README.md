# AIT-CORE SORIANO MEDIADORES

<div align="center">

![AIN TECH](https://img.shields.io/badge/AIN_TECH-ION_Skin-00d4ff?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-PROPRIETARY-red?style=for-the-badge)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue?style=for-the-badge)

**Next-Generation Intelligent ERP-OS Platform**

Complete enterprise system with 57 specialized modules + 16 AI agents + 23 computational engines

[Quick Start](#-quick-start-5-minutes) • [Documentation](#-documentation) • [Architecture](#-architecture) • [Modules](#-modules) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Quick Start (5 Minutes)](#-quick-start-5-minutes)
- [Modules](#-modules)
- [AI Agents](#-ai-agents)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**AIT-CORE Soriano Mediadores** is a cutting-edge, AI-powered enterprise resource planning operating system designed specifically for insurance brokerage firms. It combines traditional ERP functionality with advanced artificial intelligence, providing an all-in-one platform for managing every aspect of an insurance business.

### What Makes It Unique?

- **57 Specialized Modules**: Modular architecture allows you to enable only what you need
- **16 AI Agents**: Autonomous intelligent agents that analyze, recommend, and execute
- **23 Python Engines**: High-performance computational engines for complex calculations
- **Real-time Intelligence**: AI-driven insights, predictions, and automated decision-making
- **Enterprise-Grade**: Built for scale with microservices architecture and event-driven design
- **Full Stack**: From frontend to backend, from auth to analytics - everything included

---

## ✨ Key Features

### Modular Architecture

- **Dynamic Module Loading**: Load/unload modules without system restart
- **Hot Reload**: Development-friendly with instant code updates
- **Dependency Management**: Automatic resolution with cycle detection
- **License Tiers**: Standard/Pro/Enterprise licensing per module
- **Health Monitoring**: Real-time module health checks and auto-recovery

### AI-Powered Intelligence

- **8 Specialist Agents**: Analyze and provide expert recommendations
  - Insurance Specialist, Finance Specialist, Legal Specialist, Marketing Specialist
  - Data Specialist, Security Specialist, Customer Specialist, Operations Specialist

- **8 Executive Agents**: Execute decisions and coordinate operations
  - CEO, CFO, CTO, CMO Agents
  - Sales Manager, Operations Manager, HR Manager, Compliance Officer Agents

- **23 Computational Engines**: Python FastAPI services
  - Statistical, Economic, Financial, Insurance Engines
  - Machine Learning, Multi-Scraper, Risk Assessment, Pricing Optimization

### Enterprise Infrastructure

- **Authentication & Security**
  - OAuth2/SSO with AIT-AUTHENTICATOR
  - Multi-factor authentication (MFA)
  - Role-based access control (RBAC)
  - JWT token management

- **Event-Driven Architecture**
  - Kafka/RabbitMQ event bus
  - Real-time event streaming
  - Event sourcing capabilities
  - CQRS pattern implementation

- **API Gateway**
  - Centralized API management
  - Rate limiting & throttling
  - Request/response caching
  - Load balancing

- **Observability**
  - Prometheus metrics collection
  - Grafana dashboards
  - ELK Stack (Elasticsearch, Logstash, Kibana)
  - Distributed tracing (Jaeger)
  - Error tracking (Sentry)

- **Compliance & Audit**
  - 23-field audit trail
  - GDPR/LOPD compliance
  - SOC2, ISO27001 ready
  - Automatic compliance reporting

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Web App   │  │Admin Panel  │  │ Mobile App  │  │Suite Portal │   │
│  │  (Next.js)  │  │  (Next.js)  │  │(React Nat.) │  │  (Next.js)  │   │
│  │  Port 3001  │  │  Port 3002  │  │  Port 3003  │  │  Port 3004  │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────────────┐
│                         SECURITY LAYER                                  │
│                    AIT-AUTHENTICATOR (OAuth2/SSO)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │   JWT Auth   │  │     MFA      │  │     RBAC     │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────────────┐
│                       INTEGRATION LAYER                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │  API Gateway    │  │ AIT-CONNECTOR   │  │   Event Bus     │        │
│  │    (NestJS)     │  │   (200+ APIs)   │  │  (Kafka/RMQ)    │        │
│  │ Rate Limiting   │  │ Internal+Extern │  │  Event Stream   │        │
│  │ Load Balancing  │  │ Module Registry │  │  CQRS/ES        │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────────────┐
│                        AI AGENTS LAYER                                  │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐│
│  │    8 SPECIALIST AGENTS         │  │    8 EXECUTIVE AGENTS          ││
│  │  (Analyze & Recommend)         │  │  (Execute & Coordinate)        ││
│  │ ┌──────────────────────────┐   │  │ ┌──────────────────────────┐  ││
│  │ │ Insurance    │ Finance   │   │  │ │ CEO Agent   │ CFO Agent  │  ││
│  │ │ Legal        │ Marketing │   │  │ │ CTO Agent   │ CMO Agent  │  ││
│  │ │ Data         │ Security  │   │  │ │ Sales Mgr   │ Ops Mgr    │  ││
│  │ │ Customer     │ Operations│   │  │ │ HR Mgr      │ Compliance │  ││
│  │ └──────────────────────────┘   │  │ └──────────────────────────┘  ││
│  └────────────────────────────────┘  └────────────────────────────────┘│
│           │                                      │                      │
│           └──────────────────┬───────────────────┘                      │
└──────────────────────────────┴──────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────────┐
│                      APPLICATION LAYER                                  │
│                   57 SPECIALIZED MODULES                                │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐         │
│  │ CORE         │ INSURANCE    │ MARKETING    │ ANALYTICS    │         │
│  │ BUSINESS (8) │ SPECIAL (20) │ & SALES (10) │ & BI (6)     │         │
│  ├──────────────┼──────────────┼──────────────┼──────────────┤         │
│  │ Accountant   │ Vida         │ Marketing    │ Data Analyst │         │
│  │ Treasury     │ Salud        │ Lead Gen     │ BI Platform  │         │
│  │ PGC Engine   │ Hogar        │ CRM          │ Predictive   │         │
│  │ Encashment   │ Autos        │ Campaigns    │ Risk         │         │
│  │ Sales        │ Empresas     │ Conversion   │ Customer     │         │
│  │ Ops          │ + 15 more    │ + 5 more     │ Operational  │         │
│  │ HR           │              │              │              │         │
│  │ Policy Mgr   │              │              │              │         │
│  └──────────────┴──────────────┴──────────────┴──────────────┘         │
│  ┌──────────────┬──────────────┬──────────────┐                        │
│  │ SECURITY &   │INFRASTRUCTURE│ INTEGRATION  │                        │
│  │ COMPLIANCE(4)│     (5)      │ & AUTO (4)   │                        │
│  ├──────────────┼──────────────┼──────────────┤                        │
│  │ Defender     │Authenticator │ Connector    │                        │
│  │ Compliance   │ DataHub      │ Engines      │                        │
│  │ Fraud Detect │ API Gateway  │ Workflow     │                        │
│  │ Audit Trail  │ Notification │ Event Bus    │                        │
│  │              │ Documents    │              │                        │
│  └──────────────┴──────────────┴──────────────┘                        │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────────┐
│                        ENGINE LAYER                                     │
│                   AIT-ENGINES (Python FastAPI)                          │
│                        23 Computational Engines                         │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐             │
│  │Statistical  │ Economic    │ Financial   │ Insurance   │             │
│  │Engine       │ Engine      │ Engine      │ Engine      │             │
│  └─────────────┴─────────────┴─────────────┴─────────────┘             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐             │
│  │ML/AI        │Multi-       │ Risk        │ Pricing     │             │
│  │Engine       │Scraper      │ Assessment  │ Optimizer   │             │
│  └─────────────┴─────────────┴─────────────┴─────────────┘             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐             │
│  │Claims       │Underwriting │ Fraud       │ Portfolio   │             │
│  │Processing   │Engine       │ Detection   │ Optimizer   │             │
│  └─────────────┴─────────────┴─────────────┴─────────────┘             │
│                         + 11 more engines                               │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────────┐
│                         DATA LAYER                                      │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐         │
│  │ PostgreSQL   │    Redis     │Elasticsearch │  MinIO/S3    │         │
│  │ (40 schemas) │   (Cache)    │  (Search)    │   (Files)    │         │
│  │ TimescaleDB  │  Rate Limit  │   Logging    │  Documents   │         │
│  │ ACID Trans.  │  Sessions    │   Metrics    │   Backups    │         │
│  └──────────────┴──────────────┴──────────────┴──────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘

                        MONITORING & OBSERVABILITY
  ┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
  │ Prometheus  │   Grafana   │  ELK Stack  │   Jaeger    │   Sentry    │
  │  (Metrics)  │ (Dashboards)│   (Logs)    │  (Tracing)  │  (Errors)   │
  └─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript 5.3**: Type-safe development
- **TailwindCSS 3**: Utility-first CSS framework
- **Shadcn/ui**: Beautiful, accessible component library
- **React Query**: Server state management
- **Zustand**: Client state management
- **React Hook Form**: Form management
- **Zod**: Schema validation

### Backend
- **NestJS 10**: Progressive Node.js framework
- **TypeScript 5.3**: Type-safe backend
- **Prisma**: Next-generation ORM
- **Passport.js**: Authentication middleware
- **Bull**: Queue management
- **Socket.io**: WebSocket connections

### Python Engines
- **FastAPI**: High-performance async API framework
- **Pydantic**: Data validation
- **SQLAlchemy**: Python SQL toolkit
- **NumPy/Pandas**: Data processing
- **Scikit-learn**: Machine learning
- **TensorFlow**: Deep learning

### Infrastructure
- **PostgreSQL 15**: Primary database
- **Redis 7**: Caching & session store
- **Elasticsearch 8**: Search & analytics
- **Kafka/RabbitMQ**: Message broker
- **MinIO/S3**: Object storage
- **Docker**: Containerization
- **Kubernetes**: Orchestration

### DevOps & Monitoring
- **GitHub Actions**: CI/CD
- **Docker Compose**: Local development
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **ELK Stack**: Log management
- **Jaeger**: Distributed tracing
- **Sentry**: Error tracking

---

## ⚡ Quick Start (5 Minutes)

### Prerequisites

Ensure you have the following installed:
- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Docker >= 24.0.0
- Docker Compose >= 2.20.0

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/aintech/ait-core-soriano.git
cd ait-core-soriano

# 2. Install dependencies (takes ~2 minutes)
pnpm install

# 3. Copy environment variables
cp .env.example .env

# 4. Start infrastructure services (PostgreSQL, Redis, Kafka, etc.)
pnpm docker:up

# 5. Generate Prisma client
pnpm db:generate

# 6. Run database migrations
pnpm db:migrate

# 7. Start all applications in development mode
pnpm dev
```

### Access Applications

Once everything is running, you can access:

- **API Server**: http://localhost:3000
  - API Documentation: http://localhost:3000/api/docs
  - Health Check: http://localhost:3000/health

- **Web Application**: http://localhost:3001
  - Main insurance management interface

- **Admin Panel**: http://localhost:3002
  - System administration and monitoring

- **Suite Portal**: http://localhost:3004
  - AI-powered productivity suite

### Default Credentials

```
Email: admin@sorianomediadores.es
Password: Admin123!
```

### Verify Installation

```bash
# Check all services are running
pnpm modules:health

# Run tests
pnpm test

# Check module status
pnpm modules:list
```

---

## 📦 Modules

### Category 1: Core Business (8 modules)

| Module | Description | Status | License |
|--------|-------------|--------|----------|
| **ait-accountant** | Automated accounting with AI-driven reconciliation | ✅ Active | Standard |
| **ait-treasury** | Treasury and liquidity management | 🔴 Pending | Standard |
| **ait-pgc-engine** | Spanish General Accounting Plan (PGC) | ✅ Active | Standard |
| **ait-encashment** | Collections and portfolio management | 🔴 Pending | Pro |
| **ait-sales** | Sales automation and pipeline management | 🔴 Pending | Standard |
| **ait-ops** | Operations management | 🔴 Pending | Standard |
| **ait-policy-manager** | Policy lifecycle management | 🔴 Pending | Standard |
| **ait-claim-processor** | Claims processing automation | 🔴 Pending | Pro |

### Category 2: Insurance Specialized (20 modules)

Complete coverage for all insurance types:

**Personal Lines**
- `seguros-vida`: Life insurance
- `seguros-salud`: Health insurance
- `seguros-hogar`: Home insurance
- `seguros-autos`: Auto insurance
- `seguros-decesos`: Funeral insurance
- `seguros-mascotas`: Pet insurance

**Financial Lines**
- `seguros-ahorro`: Savings insurance
- `seguros-pensiones`: Pension plans
- `seguros-unit-linked`: Investment-linked insurance

**Business Lines**
- `seguros-empresas`: Business insurance
- `seguros-rc`: Liability insurance
- `seguros-multirriesgo`: Multi-risk insurance
- `seguros-ciber`: Cyber insurance
- `seguros-transporte`: Transport insurance
- `seguros-comunidades`: Community insurance
- `seguros-agrario`: Agricultural insurance
- `seguros-credito`: Credit insurance
- `seguros-caucion`: Surety bonds
- `seguros-ingenieria`: Engineering insurance
- `seguros-industrial`: Industrial insurance

### Category 3: Marketing & Sales (10 modules)

| Module | Description |
|--------|-------------|
| **ai-marketing** | Complete marketing suite (SEO/SEM, Social, Ads, Analytics) |
| **ai-lead-generation** | AI-powered lead generation |
| **ait-crm** | Customer relationship management |
| **ai-campaign-manager** | Campaign orchestration |
| **ai-conversion-optimizer** | Conversion rate optimization |
| **ai-brand-manager** | Brand management |
| **ai-influencer-manager** | Influencer relationship management |
| **ai-loyalty-programs** | Customer loyalty programs |
| **ai-referral-engine** | Referral program automation |
| **ai-pricing-optimizer** | Dynamic pricing optimization |

### Category 4: Analytics & Intelligence (6 modules)

| Module | Description |
|--------|-------------|
| **ai-data-analyst** | AI-powered data analysis |
| **ait-bi-platform** | Business intelligence platform |
| **ai-predictive-analytics** | Predictive modeling and forecasting |
| **ai-risk-analytics** | Risk assessment and management |
| **ai-customer-analytics** | Customer behavior analysis |
| **ai-operational-analytics** | Operational efficiency analysis |

### Category 5: Security & Compliance (4 modules)

| Module | Description |
|--------|-------------|
| **ai-defender** | Cybersecurity and threat detection |
| **ait-compliance** | GDPR, LOPD, SOC2, ISO27001 compliance |
| **ai-fraud-detection** | AI-powered fraud detection |
| **ait-audit-trail** | 23-field comprehensive audit logging |

### Category 6: Infrastructure (5 modules)

| Module | Description |
|--------|-------------|
| **ait-authenticator** | OAuth2/SSO authentication |
| **ait-datahub** | Database administration |
| **ait-api-gateway** | Centralized API gateway |
| **ait-notification-service** | Email, SMS, push notifications |
| **ait-document-service** | Document management and storage |

### Category 7: Integration & Automation (4 modules)

| Module | Description |
|--------|-------------|
| **ait-connector** | Universal connector (internal modules + 200+ external APIs) |
| **ait-nerve** | Neural network engine orchestrator |
| **ait-workflow-orchestrator** | Workflow automation |
| **ait-event-bus** | Event-driven architecture backbone |

---

## 🤖 AI Agents

### Specialist Agents (8 agents)

These agents **analyze, recommend, and provide expertise**:

1. **Insurance Specialist**
   - Expertise: Actuarial science, risk assessment, coverage optimization
   - Use cases: Policy recommendations, risk evaluation, pricing analysis

2. **Finance Specialist**
   - Expertise: Accounting, treasury, financial planning, investments
   - Use cases: Financial reporting, cash flow optimization, investment advice

3. **Legal Specialist**
   - Expertise: Insurance law, contracts, regulatory compliance
   - Use cases: Contract review, legal risk assessment, compliance checking

4. **Marketing Specialist**
   - Expertise: SEO/SEM, social media, content marketing, advertising
   - Use cases: Campaign optimization, content creation, market analysis

5. **Data Specialist**
   - Expertise: Data analysis, visualization, machine learning, predictions
   - Use cases: Data insights, predictive modeling, trend analysis

6. **Security Specialist**
   - Expertise: Cybersecurity, fraud detection, vulnerability assessment
   - Use cases: Security audits, threat detection, fraud prevention

7. **Customer Specialist**
   - Expertise: Customer experience, journey mapping, retention strategies
   - Use cases: Customer satisfaction, loyalty programs, churn prevention

8. **Operations Specialist**
   - Expertise: Process optimization, workflow automation, efficiency
   - Use cases: Process improvement, automation opportunities, KPI optimization

### Executive Agents (8 agents)

These agents **execute decisions and coordinate operations**:

1. **CEO Agent**: Strategic decision-making and overall coordination
2. **CFO Agent**: Financial management and treasury operations
3. **CTO Agent**: Technology infrastructure and development oversight
4. **CMO Agent**: Marketing campaigns and brand management
5. **Sales Manager Agent**: Sales pipeline and opportunity management
6. **Operations Manager Agent**: Operational efficiency and process management
7. **HR Manager Agent**: Human resources and team management
8. **Compliance Officer Agent**: Regulatory compliance and audit management

---

## 📁 Project Structure

```
ait-core-soriano/
│
├── apps/                              # Applications
│   ├── api/                           # NestJS API Server (Port 3000)
│   │   ├── src/
│   │   │   ├── modules/              # Feature modules
│   │   │   ├── common/               # Shared code
│   │   │   ├── config/               # Configuration
│   │   │   └── main.ts               # Entry point
│   │   ├── test/                     # E2E tests
│   │   └── package.json
│   │
│   ├── web/                           # Next.js Web App (Port 3001)
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages
│   │   │   ├── components/           # React components
│   │   │   ├── lib/                  # Utilities
│   │   │   └── store/                # State management
│   │   └── package.json
│   │
│   ├── admin/                         # Next.js Admin Panel (Port 3002)
│   │   ├── src/
│   │   │   ├── app/                  # Admin pages
│   │   │   ├── components/           # Admin components
│   │   │   └── lib/                  # Admin utilities
│   │   └── package.json
│   │
│   ├── mobile/                        # React Native Mobile App (Port 3003)
│   │   ├── src/
│   │   │   ├── screens/              # Mobile screens
│   │   │   ├── components/           # Mobile components
│   │   │   └── navigation/           # Navigation
│   │   └── package.json
│   │
│   └── suite-portal/                  # AI Suite Portal (Port 3004)
│       ├── src/
│       │   ├── app/                  # Suite applications
│       │   └── components/           # Suite components
│       └── package.json
│
├── modules/                           # 57 Specialized Modules
│   ├── 01-core-business/              # Core business modules (8)
│   │   ├── ait-accountant/
│   │   ├── ait-treasury/
│   │   ├── ait-pgc-engine/
│   │   ├── ait-encashment/
│   │   ├── ait-sales/
│   │   ├── ait-ops/
│   │   ├── ait-policy-manager/
│   │   └── ait-claim-processor/
│   │
│   ├── 02-insurance-specialized/      # Insurance modules (20)
│   │   ├── vida/
│   │   ├── salud/
│   │   ├── hogar/
│   │   ├── autos/
│   │   └── ... (16 more)
│   │
│   ├── 03-marketing-sales/            # Marketing modules (10)
│   │   ├── ai-marketing/
│   │   ├── ai-lead-generation/
│   │   ├── ait-crm/
│   │   └── ... (7 more)
│   │
│   ├── 04-analytics-intelligence/     # Analytics modules (6)
│   │   ├── ai-data-analyst/
│   │   ├── ait-bi-platform/
│   │   └── ... (4 more)
│   │
│   ├── 05-security-compliance/        # Security modules (4)
│   │   ├── ai-defender/
│   │   ├── ait-compliance/
│   │   ├── ai-fraud-detection/
│   │   └── ait-audit-trail/
│   │
│   ├── 06-infrastructure/             # Infrastructure modules (5)
│   │   ├── ait-authenticator/
│   │   ├── ait-datahub/
│   │   ├── ait-api-gateway/
│   │   ├── ait-notification-service/
│   │   └── ait-document-service/
│   │
│   └── 07-integration-automation/     # Integration modules (4)
│       ├── ait-connector/
│       ├── ait-nerve/
│       ├── ait-workflow-orchestrator/
│       └── ait-event-bus/
│
├── libs/                              # Shared Libraries
│   ├── shared/                        # Common utilities
│   │   ├── src/
│   │   │   ├── utils/
│   │   │   ├── constants/
│   │   │   └── types/
│   │   └── package.json
│   │
│   ├── database/                      # Database layer
│   │   ├── prisma/                   # Prisma schemas
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   └── repositories/
│   │   └── package.json
│   │
│   ├── kafka/                         # Kafka integration
│   │   ├── src/
│   │   │   ├── producer.ts
│   │   │   └── consumer.ts
│   │   └── package.json
│   │
│   └── auth/                          # Authentication utilities
│       ├── src/
│       │   ├── jwt.ts
│       │   └── guards/
│       └── package.json
│
├── agents/                            # 16 AI Agents
│   ├── specialists/                   # 8 Specialist Agents
│   │   ├── insurance-specialist/
│   │   ├── finance-specialist/
│   │   ├── legal-specialist/
│   │   ├── marketing-specialist/
│   │   ├── data-specialist/
│   │   ├── security-specialist/
│   │   ├── customer-specialist/
│   │   └── operations-specialist/
│   │
│   └── executors/                     # 8 Executive Agents
│       ├── ceo-agent/
│       ├── cfo-agent/
│       ├── cto-agent/
│       ├── cmo-agent/
│       ├── sales-manager-agent/
│       ├── operations-manager-agent/
│       ├── hr-manager-agent/
│       └── compliance-officer-agent/
│
├── engines/                           # Python Computational Engines
│   ├── statistical-engine/
│   ├── economic-engine/
│   ├── financial-engine/
│   ├── insurance-engine/
│   └── ... (19 more)
│
├── docs/                              # Documentation
│   ├── USER_MANUAL.md                # Complete user guide
│   ├── API_DOCUMENTATION.md          # API reference
│   ├── DEPLOYMENT_GUIDE.md           # Production deployment
│   ├── ARCHITECTURE.md               # Architecture documentation
│   ├── CONTRIBUTING.md               # Contribution guidelines
│   └── FAQ.md                        # Frequently asked questions
│
├── k8s/                               # Kubernetes Manifests
│   ├── deployments/
│   ├── services/
│   ├── ingress/
│   └── configmaps/
│
├── scripts/                           # Utility Scripts
│   ├── modules-list.js
│   ├── modules-enable.js
│   ├── modules-disable.js
│   └── modules-health.js
│
├── monitoring/                        # Monitoring Configuration
│   ├── prometheus/
│   ├── grafana/
│   └── elk/
│
├── .github/                           # GitHub Configuration
│   └── workflows/                    # CI/CD pipelines
│       ├── ci.yml
│       └── cd.yml
│
├── MODULE_REGISTRY.json               # Global module registry
├── package.json                       # Root package configuration
├── turbo.json                         # Turborepo configuration
├── docker-compose.yml                 # Infrastructure services
├── .env.example                       # Environment variables template
└── README.md                          # This file
```

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[User Manual](docs/USER_MANUAL.md)**: Complete guide for all 16 applications with step-by-step tutorials
- **[API Documentation](docs/API_DOCUMENTATION.md)**: All API endpoints with request/response examples
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)**: Production deployment with Docker, Kubernetes, and monitoring
- **[Architecture Documentation](docs/ARCHITECTURE.md)**: System architecture with component diagrams and data flows
- **[Contributing Guide](docs/CONTRIBUTING.md)**: How to contribute to the project
- **[FAQ](docs/FAQ.md)**: Frequently asked questions and troubleshooting

Additional resources:

- **[Modules Guide](docs/MODULES.md)**: Detailed module documentation
- **[Agents Guide](docs/AGENTS.md)**: AI agents documentation
- **[Security Guide](docs/SECURITY.md)**: Security best practices
- **[Development Guide](docs/DEVELOPMENT.md)**: Development workflow

---

## 👨‍💻 Development

### Module Management

```bash
# List all modules
pnpm modules:list

# List by category
pnpm modules:list --category=core-business

# Enable a module
pnpm modules:enable ait-accountant

# Disable a module
pnpm modules:disable seguros-ciber

# Check module health
pnpm modules:health

# View module dependencies
pnpm modules:deps ait-accountant
```

### Creating a New Module

```bash
# Generate module from template
pnpm create-module --name=ai-new-module --category=core-business

# This creates:
# modules/01-core-business/ai-new-module/
# ├── package.json
# ├── module.config.json
# ├── src/
# │   ├── index.ts
# │   ├── controllers/
# │   ├── services/
# │   └── models/
# ├── tests/
# └── README.md
```

### Development Workflow

```bash
# Start all apps in dev mode
pnpm dev

# Start specific app
pnpm dev --filter=@ait-core/web

# Build all apps
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm type-check
```

### Testing

```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage

# Watch mode
pnpm test:watch
```

---

## 🚢 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t ait-core-soriano:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  ait-core-soriano:latest

# Using docker-compose
docker-compose up -d
```

### Kubernetes Deployment

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n ait-core

# View logs
kubectl logs -f deployment/ait-core-api -n ait-core

# Scale deployment
kubectl scale deployment ait-core-api --replicas=3 -n ait-core
```

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/aitcore"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
OAUTH_GOOGLE_CLIENT_ID="..."
OAUTH_GOOGLE_CLIENT_SECRET="..."

# API Keys
CLAUDE_API_KEY="..."
OPENAI_API_KEY="..."

# Services
KAFKA_BROKERS="localhost:9092"
ELASTICSEARCH_URL="http://localhost:9200"
MINIO_ENDPOINT="localhost:9000"

# Monitoring
SENTRY_DSN="..."
PROMETHEUS_PORT="9090"
```

### CI/CD

GitHub Actions automatically handles:
- **Push to `develop`**: Deploy to staging
- **Push to `main`**: Deploy to production (requires approval)
- **Pull Requests**: Run tests, linting, type-checking

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Run linting: `pnpm lint`
6. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
7. Push to your fork: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code of Conduct

- Be respectful and inclusive
- Follow the code style guidelines
- Write tests for new features
- Update documentation as needed
- Keep pull requests focused and small

---

## 📄 License

This project is **PROPRIETARY** software owned by **AIN TECH** for **Soriano Mediadores**.

### License Tiers

- **Standard**: Basic modules for small businesses
- **Pro**: Advanced modules for medium businesses
- **Enterprise**: All modules + 24/7 support + custom development

For licensing inquiries, contact: licensing@aintech.es

---

## 🌟 Key Highlights

- 57 specialized modules covering every aspect of insurance brokerage
- 16 AI agents providing intelligent analysis and automation
- 23 Python computational engines for complex calculations
- Enterprise-grade security and compliance (GDPR, LOPD, SOC2, ISO27001)
- Real-time event-driven architecture with Kafka
- Complete observability with Prometheus, Grafana, ELK, Jaeger, Sentry
- Modern tech stack: Next.js, NestJS, PostgreSQL, Redis, TypeScript
- Production-ready with Docker and Kubernetes support

---

## 📧 Contact & Support

**AIN TECH - Soriano Mediadores**

- **Website**: https://sorianomediadores.es
- **Technical Support**: tech@aintech.es
- **Customer Support**: support@sorianomediadores.es
- **Sales Inquiries**: sales@aintech.es
- **Documentation**: https://docs.aintech.es
- **Status Page**: https://status.sorianomediadores.es

### Support Hours

- **Standard**: Monday-Friday, 9:00-18:00 CET
- **Pro**: Monday-Friday, 8:00-20:00 CET
- **Enterprise**: 24/7/365

---

<div align="center">

**Built with 💙 by AIN TECH**

![AIN TECH ION](https://img.shields.io/badge/ION-Powered_by_AI-00d4ff?style=for-the-badge)

</div>
