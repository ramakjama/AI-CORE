# AI-CORE Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AI-CORE PLATFORM                                    │
│                         "SOBI - Sistema Operativo BI"                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  AI-SUITE   │  │  AI-BROWSER │  │  PORTALES   │  │ MOBILE APP  │            │
│  │ Mail/Cal/   │  │  Search +   │  │ Cliente/    │  │  PWA +      │            │
│  │ Drive/Docs  │  │  AI Assist  │  │ Empleado    │  │  Native     │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         └────────────────┴────────────────┴────────────────┘                    │
│                                    │                                             │
│                         ┌──────────▼──────────┐                                 │
│                         │   API GATEWAY       │                                 │
│                         │  GraphQL Federation │                                 │
│                         └──────────┬──────────┘                                 │
│                                    │                                             │
│  ┌─────────────────────────────────┼─────────────────────────────────┐          │
│  │                     AI PLATFORM LAYER                              │          │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │          │
│  │  │ Multi-Model  │  │    Agent     │  │  RAG Engine  │            │          │
│  │  │   Router     │  │ Orchestrator │  │  (pgvector)  │            │          │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │          │
│  └───────────────────────────────────────────────────────────────────┘          │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    COMMUNICATIONS FABRIC                                 │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │    │
│  │  │  VOICE   │  │ WHATSAPP │  │  EMAIL   │  │   SMS    │  │  INBOX   │  │    │
│  │  │  (PBX)   │  │  Cloud   │  │  IMAP/   │  │  Twilio  │  │ Unified  │  │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         CORE SERVICES                                    │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │    │
│  │  │AI-IAM  │ │AI-MDM  │ │WORKFLOW│ │ RULES  │ │  DOCS  │ │ AUDIT  │    │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                          ERP MODULES                                     │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │    │
│  │  │FINANCE │ │TREASURY│ │   HR   │ │PROJECTS│ │PURCHASE│ │INSURANC│    │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│                           ┌──────────────────┐                                  │
│                           │   EVENT BUS      │                                  │
│                           │  NATS JetStream  │                                  │
│                           └────────┬─────────┘                                  │
│                                    │                                             │
│  ┌─────────────────────────────────┼─────────────────────────────────────────┐  │
│  │                      DATA LAYER (36 Databases)                             │  │
│  │  SM_GLOBAL │ SS_INSURANCE │ SM_ANALYTICS │ SM_HR │ SM_AI_AGENTS │ ...     │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 36 Databases Organization

### Core (MDM + Identity)
- **SM_GLOBAL** - Party, User, Role, Permission, Household, Relationships

### Insurance Vertical
- **SS_INSURANCE** - Policy, Receipt, Claim
- **SS_COMMISSIONS** - Commission calculation
- **SS_ENDORSEMENTS** - Policy amendments
- **SS_RETENTION** - Retention scoring
- **SS_VIGILANCE** - Monitoring & alerts

### Utilities Vertical
- **SE_ENERGY** - Energy contracts
- **ST_TELECOM** - Telecom contracts
- **SF_FINANCE** - Loans, mortgages

### Services Vertical
- **SR_REPAIRS** - Home repairs
- **SW_WORKSHOPS** - Vehicle workshops

### Business Operations (20+ databases)
- SM_ANALYTICS, SM_COMMUNICATIONS, SM_DOCUMENTS, SM_COMPLIANCE
- SM_LEADS, SM_MARKETING, SM_HR, SM_INVENTORY, SM_INTEGRATIONS
- SM_PROJECTS, SM_STRATEGY, SM_AI_AGENTS, SM_ACCOUNTING
- SM_TECHTEAM, SM_COMMERCIAL, SM_PRODUCTS, SM_OBJECTIVES
- SM_NOTIFICATIONS, SM_SCHEDULING, SM_AUDIT, SM_WORKFLOWS
- SM_DATA_QUALITY, SM_TICKETS, SM_QUALITY, SM_LEGAL

## Module Catalog (55+ AI-* Modules)

### AI-SUITE (Productivity)
AI-MAIL, AI-CALENDAR, AI-DRIVE, AI-DOCS, AI-SHEETS, AI-SLIDES, AI-TASKS, AI-CHAT, AI-MEET

### AI-COMMUNICATIONS
AI-VOICE, AI-WHATSAPP, AI-SMS, AI-EMAIL-ENGINE, AI-INBOX

### AI-CRM
AI-LEADS, AI-PIPELINE, AI-CONTACTS, AI-CAMPAIGNS

### AI-ERP
AI-FINANCE, AI-TREASURY, AI-PURCHASING, AI-INVENTORY, AI-HR, AI-PAYROLL, AI-PROJECTS

### AI-INSURANCE
AI-PORTFOLIO, AI-CLAIMS, AI-RECEIPTS, AI-COMMISSIONS, AI-RETENTION

### AI-ANALYTICS
AI-BI, AI-FORECASTING, AI-REPORTS, AI-DASHBOARDS

### AI-PLATFORM
AI-IAM, AI-MDM, AI-WORKFLOW, AI-RULES, AI-DOCS-ENGINE, AI-AGENTS, AI-RAG, AI-ML

### AI-PORTAL
AI-CUSTOMER-PORTAL, AI-EMPLOYEE-PORTAL, AI-PARTNER-PORTAL

### AI-STUDIO
AI-BUILDER, AI-INTEGRATIONS, AI-AUTOMATION

### AI-SECURITY (AI-Defender)
AI-DEFENDER-CORE, AI-DEFENDER-SCANNER, AI-DEFENDER-QUARANTINE
