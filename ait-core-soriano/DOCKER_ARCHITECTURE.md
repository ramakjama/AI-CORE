# AIT-CORE Docker Architecture

Complete architecture overview of the AIT-CORE Docker infrastructure.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET / USERS                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  NGINX (80/443) │
                    │  SSL/TLS Proxy  │
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
    ┌───────▼────────┐              ┌────────▼────────┐
    │  API Gateway   │              │ Gateway Service │
    │   (Node.js)    │              │    (FastAPI)    │
    │   Port: 3002   │              │   Port: 8020    │
    └───────┬────────┘              └────────┬────────┘
            │                                 │
            └─────────┬──────────────────────┘
                      │
         ┌────────────┴───────────────┐
         │                            │
    ┌────▼─────┐              ┌──────▼──────┐
    │ Node.js  │              │   FastAPI   │
    │ Services │              │  Services   │
    │  (3)     │              │    (21)     │
    └────┬─────┘              └──────┬──────┘
         │                           │
         └───────────┬───────────────┘
                     │
    ┌────────────────┴───────────────────┐
    │         Infrastructure Layer        │
    │  PostgreSQL │ Redis │ Kafka │ ES   │
    │    MinIO   │ Prometheus │ Grafana  │
    └─────────────────────────────────────┘
```

## Detailed Service Architecture

### Layer 1: Reverse Proxy & Load Balancing

```
┌─────────────────────────────────────────────────────────┐
│                    NGINX (Production)                   │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ SSL/TLS      │  │ Rate Limiting│  │ Load Balancer│ │
│  │ Termination  │  │ & Throttling │  │ Round Robin  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Gzip Compress│  │ Caching Layer│  │ Security Hdrs│ │
│  │ Static Files │  │ Proxy Cache  │  │ HSTS, CSP    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
         │               │               │
         ▼               ▼               ▼
    /api/          /services/         /ws/
```

### Layer 2: API Gateways

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway (Node.js)                │
│                      Port: 3002                         │
│                                                         │
│  Features:                                              │
│  • Unified API Entry Point                             │
│  • Service Routing & Orchestration                     │
│  • Request/Response Transformation                     │
│  • Rate Limiting (100 req/min)                         │
│  • JWT Validation                                       │
│  • CORS Handling                                        │
│  • Error Handling & Logging                            │
│                                                         │
│  Upstreams:                                             │
│  ├─ PGC Engine (3001)                                  │
│  ├─ Accountant (3003)                                  │
│  └─ All FastAPI Services                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Gateway Service (FastAPI)                  │
│                   Port: 8020                            │
│                                                         │
│  Features:                                              │
│  • FastAPI Service Gateway                             │
│  • Microservice Orchestration                          │
│  • Request Validation (Pydantic)                       │
│  • Async Request Handling                              │
│  • Auto-generated OpenAPI Docs                         │
│  • WebSocket Support                                    │
│                                                         │
│  Routes to:                                             │
│  ├─ Auth Service (8000)                                │
│  ├─ Storage Service (8001)                             │
│  ├─ Documents Service (8002)                           │
│  └─ ... (18 more services)                             │
└─────────────────────────────────────────────────────────┘
```

### Layer 3: Microservices

#### FastAPI Services (21 Services, Ports 8000-8020)

```
┌───────────────────────────────────────────────────────────────┐
│                   FASTAPI MICROSERVICES                       │
└───────────────────────────────────────────────────────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Auth      │  │  Storage    │  │ Documents   │
│   :8000     │  │   :8001     │  │   :8002     │
│             │  │             │  │             │
│ • JWT Auth  │  │ • S3 Files  │  │ • OCR       │
│ • OAuth2    │  │ • Upload    │  │ • PDF Gen   │
│ • 2FA       │  │ • Download  │  │ • Convert   │
│ • Roles     │  │ • MinIO     │  │ • Extract   │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
                   ┌────▼────┐
                   │ auth_db │
                   │store_db │
                   │ docs_db │
                   └─────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    Mail     │  │  Calendar   │  │   Tasks     │
│   :8003     │  │   :8004     │  │   :8005     │
│             │  │             │  │             │
│ • SMTP/IMAP │  │ • Events    │  │ • Kanban    │
│ • Templates │  │ • Reminders │  │ • Assign    │
│ • Queue     │  │ • Invites   │  │ • Workflow  │
│ • Tracking  │  │ • Timezone  │  │ • Priority  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
                   ┌────▼────┐
                   │ mail_db │
                   │ cal_db  │
                   │task_db  │
                   └─────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    CRM      │  │ Analytics   │  │     HR      │
│   :8006     │  │   :8007     │  │   :8008     │
│             │  │             │  │             │
│ • Leads     │  │ • Reports   │  │ • Employees │
│ • Contacts  │  │ • Dashboards│  │ • Payroll   │
│ • Pipeline  │  │ • Metrics   │  │ • Time Off  │
│ • Follow-up │  │ • Export    │  │ • Documents │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
                   ┌────▼────┐
                   │ crm_db  │
                   │anal_db  │
                   │ hr_db   │
                   └─────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Workflow   │  │Collaboration│  │Spreadsheets │
│   :8009     │  │   :8010     │  │   :8011     │
│             │  │             │  │             │
│ • Automate  │  │ • Real-time │  │ • Formulas  │
│ • Triggers  │  │ • Comments  │  │ • Charts    │
│ • Actions   │  │ • Mentions  │  │ • Import    │
│ • Schedule  │  │ • Sharing   │  │ • Export    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
                   ┌────▼────┐
                   │work_db  │
                   │coll_db  │
                   │sheet_db │
                   └─────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│Presentations│  │   Forms     │  │   Notes     │
│   :8012     │  │   :8013     │  │   :8014     │
│             │  │             │  │             │
│ • Slides    │  │ • Builder   │  │ • Rich Text │
│ • Templates │  │ • Validation│  │ • Markdown  │
│ • Themes    │  │ • Responses │  │ • Tags      │
│ • Export    │  │ • Analytics │  │ • Search    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
                   ┌────▼────┐
                   │pres_db  │
                   │form_db  │
                   │note_db  │
                   └─────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Bookings   │  │ Assistant   │  │ Whiteboard  │
│   :8015     │  │   :8016     │  │   :8017     │
│             │  │             │  │             │
│ • Calendar  │  │ • AI Chat   │  │ • Drawing   │
│ • Slots     │  │ • GPT-4     │  │ • Shapes    │
│ • Confirm   │  │ • Claude    │  │ • Real-time │
│ • Reminders │  │ • Context   │  │ • Export    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
                   ┌────▼────┐
                   │book_db  │
                   │asst_db  │
                   │white_db │
                   └─────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Translator  │  │Embedded Apps│  │   Gateway   │
│   :8018     │  │   :8019     │  │   :8020     │
│             │  │             │  │             │
│ • DeepL     │  │ • iFrames   │  │ • Routing   │
│ • Google    │  │ • Sandbox   │  │ • Auth      │
│ • Cache     │  │ • Security  │  │ • Metrics   │
│ • Detect    │  │ • Integrat. │  │ • Health    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
                   ┌────▼────┐
                   │trans_db │
                   │embed_db │
                   │gate_db  │
                   └─────────┘
```

#### Node.js Services (4 Services)

```
┌───────────────────────────────────────────────────────┐
│                  NODE.JS SERVICES                     │
└───────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐
│  AIT-PGC-Engine  │  │ AIT-Accountant   │
│    Port: 3001    │  │   Port: 3003     │
│                  │  │                  │
│ • Spanish PGC    │  │ • AI Accounting  │
│ • Chart Accounts │  │ • Auto-classify  │
│ • Entries        │  │ • Reconciliation │
│ • Balance Sheet  │  │ • Anomaly Detect │
│ • P&L            │  │ • ML Models      │
│ • Tax Reports    │  │ • Integration    │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         └──────────┬──────────┘
                    │
               ┌────▼────┐
               │ pgc_db  │
               │acct_db  │
               └─────────┘

┌──────────────────┐  ┌──────────────────┐
│   API Gateway    │  │ Collaboration WS │
│   Port: 3002     │  │   Port: 1234     │
│                  │  │                  │
│ • NestJS         │  │ • WebSocket      │
│ • GraphQL        │  │ • Real-time      │
│ • REST API       │  │ • Broadcasting   │
│ • Validation     │  │ • Presence       │
│ • Logging        │  │ • Cursors        │
│ • Metrics        │  │ • Events         │
└──────────────────┘  └──────────────────┘
```

### Layer 4: Infrastructure & Data Layer

```
┌───────────────────────────────────────────────────────────┐
│                   DATA & STORAGE LAYER                    │
└───────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│         PostgreSQL 17 with pgvector        │
│              Port: 5432                    │
│                                            │
│  40 Databases:                             │
│  ┌──────────────────────────────────────┐ │
│  │ soriano_core      │ auth_db          │ │
│  │ pgc_engine        │ storage_db       │ │
│  │ accounting_db     │ documents_db     │ │
│  │ treasury_db       │ mail_db          │ │
│  │ calendar_db       │ tasks_db         │ │
│  │ crm_db            │ analytics_db     │ │
│  │ hr_db             │ workflow_db      │ │
│  │ collaboration_db  │ spreadsheets_db  │ │
│  │ presentations_db  │ forms_db         │ │
│  │ notes_db          │ bookings_db      │ │
│  │ assistant_db      │ whiteboard_db    │ │
│  │ translator_db     │ embedded_apps_db │ │
│  │ gateway_db        │ billing_db       │ │
│  │ policy_manager_db │ claims_proc_db   │ │
│  │ contracts_db      │ incidents_db     │ │
│  │ agents_db         │ clients_db       │ │
│  │ reports_db        │ audit_db         │ │
│  │ notifications_db  │ files_db         │ │
│  │ chat_db           │ metrics_db       │ │
│  │ logs_db           │ (1 reserved)     │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Extensions:                               │
│  • pgvector (ML embeddings)               │
│  • uuid-ossp (UUID generation)            │
│  • pg_trgm (Fuzzy text search)            │
│                                            │
│  Configuration:                            │
│  • Max Connections: 200                   │
│  • Shared Buffers: 4GB                    │
│  • Effective Cache: 12GB                  │
│  • Work Mem: 20MB                         │
└────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐
│   Redis 7.4     │  │   Kafka 7.5     │
│   Port: 6379    │  │   Port: 9092    │
│                 │  │                 │
│ • Cache Layer   │  │ • Event Stream  │
│ • Session Store │  │ • Pub/Sub       │
│ • Queue         │  │ • Log Aggregate │
│ • Rate Limit    │  │ • Audit Trail   │
│ • Real-time     │  │ • Integration   │
│ • AOF Persist   │  │ • Replication   │
└─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐
│Elasticsearch 8.11│  │  MinIO S3 API  │
│  Port: 9200     │  │ Ports: 9000/01  │
│                 │  │                 │
│ • Full-text     │  │ • Object Store  │
│ • Search        │  │ • File Storage  │
│ • Aggregations  │  │ • Backups       │
│ • Logging       │  │ • Versioning    │
│ • Analytics     │  │ • Encryption    │
│ • Kibana UI     │  │ • Web Console   │
└─────────────────┘  └─────────────────┘
```

### Layer 5: Monitoring & Observability

```
┌───────────────────────────────────────────────────────┐
│              MONITORING & OBSERVABILITY               │
└───────────────────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│           Prometheus (Port: 9090)        │
│                                          │
│  Metrics Collection:                     │
│  ├─ Infrastructure metrics              │
│  ├─ Application metrics                 │
│  ├─ Custom business metrics             │
│  ├─ Health status                       │
│  └─ Resource usage                      │
│                                          │
│  Features:                               │
│  • Time-series database                 │
│  • PromQL query language                │
│  • Alert manager                        │
│  • Service discovery                    │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│            Grafana (Port: 3005)          │
│                                          │
│  Visualization:                          │
│  ├─ Real-time dashboards                │
│  ├─ Alert visualization                 │
│  ├─ Custom panels                       │
│  ├─ Multi-source data                   │
│  └─ User management                     │
│                                          │
│  Dashboards:                             │
│  • System Overview                      │
│  • Service Health                       │
│  • Database Performance                 │
│  • API Metrics                          │
│  • Business KPIs                        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│            Kibana (Port: 5601)           │
│                                          │
│  Log Management:                         │
│  ├─ Log search & filtering              │
│  ├─ Log visualization                   │
│  ├─ Pattern detection                   │
│  ├─ Error tracking                      │
│  └─ Audit trails                        │
└──────────────────────────────────────────┘
```

## Network Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   ait-network (bridge)                  │
│                                                         │
│  All services communicate via this isolated network     │
│  Services reference each other by service name         │
│  External access only through exposed ports            │
│                                                         │
│  Network Features:                                      │
│  • DNS resolution (service discovery)                  │
│  • Isolation from host network                         │
│  • Internal communication only                         │
│  • MTU: 1500                                           │
│  • IPv4 enabled                                        │
│  • IPv6 optional                                       │
└─────────────────────────────────────────────────────────┘

Service Communication Examples:
┌──────────────┐        ┌──────────────┐
│ auth-service │───────▶│   postgres   │
│   :8000      │  5432  │   :5432      │
└──────────────┘        └──────────────┘

┌──────────────┐        ┌──────────────┐
│gateway-svc   │───────▶│     redis    │
│   :8020      │  6379  │   :6379      │
└──────────────┘        └──────────────┘
```

## Data Flow Examples

### Authentication Flow

```
User Request
    │
    ▼
┌─────────┐     ┌─────────────┐     ┌─────────────┐
│  NGINX  │────▶│ API Gateway │────▶│Auth Service │
│  :443   │     │   :3002     │     │   :8000     │
└─────────┘     └─────────────┘     └──────┬──────┘
                                           │
                      ┌────────────────────┤
                      │                    │
                      ▼                    ▼
                 ┌─────────┐         ┌─────────┐
                 │  Redis  │         │   PG    │
                 │  Cache  │         │ auth_db │
                 └─────────┘         └─────────┘
                      │                    │
                      └────────┬───────────┘
                               ▼
                         JWT Token
                               │
                               ▼
                          User Response
```

### File Upload Flow

```
User File Upload
    │
    ▼
┌─────────┐     ┌─────────────┐     ┌─────────────┐
│  NGINX  │────▶│  Gateway    │────▶│  Storage    │
│100MB max│     │   Service   │     │  Service    │
└─────────┘     └─────────────┘     └──────┬──────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │    MinIO     │
                                    │ Object Store │
                                    └──────┬───────┘
                                           │
                      ┌────────────────────┤
                      │                    │
                      ▼                    ▼
                 ┌─────────┐         ┌─────────┐
                 │   PG    │         │  Kafka  │
                 │storage_ │         │  Event  │
                 │   db    │         │ Stream  │
                 └─────────┘         └─────────┘
```

### Real-time Collaboration Flow

```
User Action (Edit Document)
    │
    ▼
┌─────────┐     ┌─────────────┐     ┌─────────────┐
│ Browser │────▶│ WebSocket   │────▶│Collaboration│
│   WS    │     │   Server    │     │  Service    │
│         │     │   :1234     │     │   :8010     │
└─────────┘     └─────────────┘     └──────┬──────┘
    ▲                                      │
    │                                      ▼
    │                               ┌──────────────┐
    │                               │    Redis     │
    │                               │   Pub/Sub    │
    │                               └──────┬───────┘
    │                                      │
    └──────────────────────────────────────┘
           Broadcast to all users
```

## Resource Allocation

### Development Environment

```
Total Resources:
├─ CPU: 4-8 cores
├─ RAM: 16-32 GB
└─ Disk: 50-100 GB

Service Allocation:
├─ PostgreSQL:    2 CPU,  4 GB RAM,  20 GB Disk
├─ Elasticsearch: 2 CPU,  3 GB RAM,  10 GB Disk
├─ Redis:         1 CPU,  1 GB RAM,   1 GB Disk
├─ Kafka:         1 CPU,  2 GB RAM,   5 GB Disk
├─ MinIO:         1 CPU,  2 GB RAM,  10 GB Disk
├─ FastAPI (21):  0.5 CPU, 256 MB each
├─ Node.js (4):   0.5 CPU, 512 MB each
└─ Monitoring:    1 CPU,  2 GB RAM,   5 GB Disk
```

### Production Environment

```
Total Resources:
├─ CPU: 16-32 cores
├─ RAM: 64-128 GB
└─ Disk: 500-1000 GB NVMe

Service Allocation:
├─ PostgreSQL:    8 CPU,  16 GB RAM, 200 GB Disk
├─ Elasticsearch: 4 CPU,  8 GB RAM,  100 GB Disk
├─ Redis:         2 CPU,  4 GB RAM,   10 GB Disk
├─ Kafka:         4 CPU,  8 GB RAM,   50 GB Disk
├─ MinIO:         4 CPU,  8 GB RAM,  200 GB Disk
├─ FastAPI (21):  2 CPU,  1 GB each (replicated)
├─ Node.js (4):   2 CPU,  2 GB each (replicated)
└─ Monitoring:    2 CPU,  4 GB RAM,   50 GB Disk
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                      │
└─────────────────────────────────────────────────────────┘

Layer 1: Network Security
┌─────────────────────────────────────────┐
│ • Firewall rules                        │
│ • Port restrictions                     │
│ • VPN access (database)                 │
│ • DDoS protection                       │
└─────────────────────────────────────────┘

Layer 2: SSL/TLS
┌─────────────────────────────────────────┐
│ • TLS 1.2+ only                         │
│ • Strong ciphers                        │
│ • Certificate management                │
│ • HSTS headers                          │
└─────────────────────────────────────────┘

Layer 3: Authentication & Authorization
┌─────────────────────────────────────────┐
│ • JWT tokens                            │
│ • OAuth2 / OIDC                         │
│ • Role-based access (RBAC)              │
│ • 2FA support                           │
└─────────────────────────────────────────┘

Layer 4: Application Security
┌─────────────────────────────────────────┐
│ • Input validation                      │
│ • SQL injection prevention              │
│ • XSS protection                        │
│ • CSRF tokens                           │
│ • Rate limiting                         │
└─────────────────────────────────────────┘

Layer 5: Data Security
┌─────────────────────────────────────────┐
│ • Encryption at rest                    │
│ • Encryption in transit                 │
│ • Secure password hashing               │
│ • PII data protection                   │
│ • GDPR compliance                       │
└─────────────────────────────────────────┘

Layer 6: Monitoring & Auditing
┌─────────────────────────────────────────┐
│ • Security event logging                │
│ • Intrusion detection                   │
│ • Audit trails                          │
│ • Anomaly detection                     │
└─────────────────────────────────────────┘
```

## Scalability Architecture

### Horizontal Scaling

```
┌─────────────────────────────────────────────────────────┐
│                  LOAD BALANCER (NGINX)                  │
└───────┬─────────────────┬─────────────────┬─────────────┘
        │                 │                 │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │Gateway-1│       │Gateway-2│       │Gateway-3│
   │  :8020  │       │  :8020  │       │  :8020  │
   └────┬────┘       └────┬────┘       └────┬────┘
        │                 │                 │
        └─────────────────┴─────────────────┘
                          │
               ┌──────────┴──────────┐
               │                     │
          ┌────▼────┐           ┌────▼────┐
          │ Auth-1  │           │ Auth-2  │
          │  :8000  │           │  :8000  │
          └────┬────┘           └────┬────┘
               │                     │
               └──────────┬──────────┘
                          │
                     ┌────▼────┐
                     │   PG    │
                     │ Primary │
                     └────┬────┘
                          │
                     ┌────▼────┐
                     │   PG    │
                     │ Replica │
                     └─────────┘
```

## Deployment Modes

### Development Mode
- Volume mounts for hot reload
- Debug ports exposed
- Relaxed security
- Single instance per service
- Full logging

### Production Mode
- No volume mounts
- Gunicorn/PM2 workers
- Enhanced security
- Multiple replicas
- Optimized logging
- SSL required
- Resource limits enforced

---

**Architecture Version**: 1.0.0
**Last Updated**: 2024-01-28
**Status**: Production Ready ✅
