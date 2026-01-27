# 🚀 AI-CORE - Enterprise ERP Platform

**Sistema integral de gestión empresarial potenciado con Inteligencia Artificial**

[![License](https://img.shields.io/badge/license-PROPRIETARY-red.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9.0.0-orange.svg)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características Principales](#-características-principales)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Agentes de IA](#-agentes-de-ia)
- [Base de Datos](#-base-de-datos)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 📖 Descripción

**AI-CORE** es una plataforma ERP empresarial de última generación que integra Inteligencia Artificial para automatizar y optimizar procesos de negocio. Diseñada específicamente para empresas de seguros y mediación, ofrece una solución completa que abarca desde la gestión de clientes hasta análisis predictivo avanzado.

### 🎯 Objetivos

- **Automatización Inteligente**: Reducir tareas manuales mediante agentes de IA
- **Decisiones Basadas en Datos**: Analytics y predicciones en tiempo real
- **Experiencia Unificada**: Interfaz coherente en web, desktop y mobile
- **Escalabilidad**: Arquitectura de microservicios preparada para crecer
- **Seguridad**: Cumplimiento con normativas de protección de datos

---

## ✨ Características Principales

### 🤖 Inteligencia Artificial

- **CFO Copilot**: Asistente financiero con análisis predictivo
- **Sales Agent**: Automatización de ventas y seguimiento de leads
- **Customer Support**: Atención al cliente 24/7 con IA
- **Document Processor**: Extracción y análisis automático de documentos
- **Risk Analyzer**: Evaluación de riesgos en tiempo real

### 💼 Gestión Empresarial

- **CRM Completo**: Gestión de clientes, leads y oportunidades
- **Pólizas de Seguros**: Emisión, renovación y gestión de pólizas
- **Siniestros**: Tramitación y seguimiento de reclamaciones
- **Finanzas**: Facturación, comisiones y contabilidad
- **RRHH**: Gestión de empleados, nóminas y formación

### 📊 Analytics & Reporting

- **Dashboards Interactivos**: Visualización en tiempo real
- **Reportes Personalizados**: Generación automática de informes
- **Predicciones**: Machine Learning para forecasting
- **KPIs**: Métricas clave del negocio
- **Alertas Inteligentes**: Notificaciones proactivas

### 🔗 Integraciones

- **Aseguradoras**: Conexión con principales compañías
- **Pasarelas de Pago**: Stripe, PayPal, Redsys
- **Comunicaciones**: Email, SMS, WhatsApp, VoIP
- **Almacenamiento**: AWS S3, Google Cloud Storage
- **ERP Externos**: SAP, Oracle, Microsoft Dynamics

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     AI-CORE ECOSYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Web    │  │  Admin   │  │ Desktop  │  │  Mobile  │   │
│  │ (Next.js)│  │(Next.js) │  │(Electron)│  │  (RN)    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │             │          │
│       └─────────────┴─────────────┴─────────────┘          │
│                          │                                  │
│              ┌───────────┴───────────┐                     │
│              │     API Gateway       │                     │
│              │   (NestJS + GraphQL)  │                     │
│              └───────────┬───────────┘                     │
│                          │                                  │
│       ┌──────────────────┼──────────────────┐              │
│       │                  │                  │              │
│  ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐        │
│  │   AI    │      │  Business │     │   Data    │        │
│  │ Agents  │      │  Services │     │  Services │        │
│  └────┬────┘      └─────┬─────┘     └─────┬─────┘        │
│       │                 │                  │              │
│       └─────────────────┴──────────────────┘              │
│                         │                                  │
│              ┌──────────┴──────────┐                      │
│              │   PostgreSQL (81)   │                      │
│              │   Redis + Kafka     │                      │
│              └─────────────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Principales

1. **Frontend Layer**
   - Web App (Next.js 14)
   - Admin Panel (Next.js 14)
   - Desktop App (Electron + Vite)
   - Mobile App (React Native)

2. **API Layer**
   - REST API (NestJS)
   - GraphQL API (Apollo Server)
   - WebSocket (Real-time)
   - gRPC (Microservices)

3. **Business Logic**
   - AI Agents (LangChain + OpenAI/Anthropic)
   - Workflows (Temporal)
   - Event Bus (Kafka)
   - Scheduler (Bull)

4. **Data Layer**
   - PostgreSQL (81 databases)
   - Redis (Cache + Sessions)
   - Elasticsearch (Search)
   - S3 (File Storage)

---

## 🛠️ Tecnologías

### Frontend
- **Framework**: Next.js 14, React 18
- **UI**: Tailwind CSS, shadcn/ui
- **State**: Zustand, TanStack Query
- **Forms**: React Hook Form, Zod
- **Charts**: Recharts, D3.js

### Backend
- **Framework**: NestJS 10
- **API**: GraphQL (Apollo), REST
- **ORM**: Prisma
- **Validation**: class-validator, Zod
- **Auth**: Passport, JWT

### AI & ML
- **LLMs**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **Framework**: LangChain
- **Vector DB**: Pinecone, Weaviate
- **ML**: TensorFlow.js

### Database
- **Primary**: PostgreSQL 16
- **Cache**: Redis 7
- **Search**: Elasticsearch 8
- **Queue**: Kafka, Bull

### DevOps
- **Container**: Docker, Docker Compose
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana
- **Logging**: ELK Stack

---

## 📦 Requisitos Previos

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0
- **PostgreSQL**: >= 16.0
- **Redis**: >= 7.0
- **Docker**: >= 24.0 (opcional)

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/your-org/ai-core.git
cd ai-core
```

### 2. Instalar Dependencias

```bash
# Instalar pnpm si no lo tienes
npm install -g pnpm@9

# Instalar dependencias del proyecto
pnpm install
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus credenciales
nano .env
```

### 4. Crear Bases de Datos

```bash
# Opción 1: Script automatizado
pnpm run db:create-all

# Opción 2: Docker Compose
docker-compose up -d postgres redis

# Opción 3: Manual
node scripts/create-databases.js
```

### 5. Ejecutar Migraciones

```bash
pnpm run db:migrate
pnpm run db:seed
```

### 6. Iniciar Desarrollo

```bash
# Iniciar todos los servicios
pnpm run dev

# O iniciar servicios individuales
pnpm run dev:api      # API en puerto 4000
pnpm run dev:web      # Web en puerto 3000
pnpm run dev:admin    # Admin en puerto 3001
pnpm run dev:desktop  # Desktop app
```

---

## ⚙️ Configuración

### Variables de Entorno Principales

```env
# Application
NODE_ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:4000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_core
SM_GLOBAL_DATABASE_URL=postgresql://user:pass@localhost:5432/sm_global
# ... (81 database URLs)

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...

# Authentication
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret

# External Services
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
SMTP_HOST=smtp.gmail.com
SMTP_USER=...
SMTP_PASS=...

# Feature Flags
FEATURE_AI_AGENTS=true
FEATURE_VOICE_CALLS=true
FEATURE_WHATSAPP=true
FEATURE_ANALYTICS=true
```

---

## 💻 Uso

### Desarrollo

```bash
# Iniciar modo desarrollo
pnpm run dev

# Linting
pnpm run lint
pnpm run lint:fix

# Type checking
pnpm run typecheck

# Tests
pnpm run test
pnpm run test:watch
pnpm run test:e2e
```

### Producción

```bash
# Build
pnpm run build

# Start production
pnpm run start

# Con Docker
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📁 Estructura del Proyecto

```
ai-core/
├── apps/                      # Aplicaciones
│   ├── api/                   # Backend API (NestJS)
│   │   └── src/
│   │       ├── modules/       # Módulos de negocio
│   │       │   ├── auth/
│   │       │   ├── users/
│   │       │   ├── clients/
│   │       │   ├── policies/
│   │       │   ├── claims/
│   │       │   ├── finance/
│   │       │   ├── analytics/
│   │       │   └── ai-agents/
│   │       ├── app.module.ts
│   │       └── main.ts
│   ├── web/                   # Web App (Next.js)
│   ├── admin/                 # Admin Panel (Next.js)
│   ├── desktop/               # Desktop App (Electron)
│   ├── mobile/                # Mobile App (React Native)
│   ├── portal-customer/       # Customer Portal
│   └── portal-employee/       # Employee Portal
│
├── libs/                      # Librerías compartidas
│   ├── ai-agents/             # Agentes de IA
│   ├── ai-llm/                # Servicios LLM
│   ├── ai-analytics/          # Analytics
│   ├── ai-communications/     # Comunicaciones
│   ├── ai-documents/          # Gestión documentos
│   ├── ai-finance/            # Finanzas
│   ├── ai-hr/                 # RRHH
│   ├── ai-insurance/          # Seguros
│   ├── ai-integrations/       # Integraciones
│   ├── ai-workflows/          # Workflows
│   ├── database/              # Database & Prisma
│   ├── shared/                # Utilidades compartidas
│   └── ui/                    # Componentes UI
│
├── services/                  # Microservicios
│   ├── event-bus/             # Event Bus (Kafka)
│   ├── scheduler/             # Scheduler (Bull)
│   ├── notification/          # Notificaciones
│   └── import-export/         # Import/Export
│
├── infrastructure/            # Infraestructura
│   ├── docker/                # Docker configs
│   ├── kubernetes/            # K8s manifests
│   └── terraform/             # IaC
│
├── docs/                      # Documentación
│   ├── api/                   # API docs
│   ├── architecture/          # Arquitectura
│   ├── guides/                # Guías
│   └── database/              # DB schemas
│
├── scripts/                   # Scripts utilidad
│   ├── setup.sh
│   ├── setup.bat
│   └── create-databases.js
│
├── config/                    # Configuraciones
├── tools/                     # Herramientas CLI
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login          # Login
POST   /api/auth/register       # Register
POST   /api/auth/refresh        # Refresh token
POST   /api/auth/logout         # Logout
GET    /api/auth/me             # Current user
```

### Users
```
GET    /api/users               # List users
GET    /api/users/:id           # Get user
POST   /api/users               # Create user
PUT    /api/users/:id           # Update user
DELETE /api/users/:id           # Delete user
```

### Clients
```
GET    /api/clients             # List clients
GET    /api/clients/stats       # Client statistics
GET    /api/clients/:id         # Get client
POST   /api/clients             # Create client
PUT    /api/clients/:id         # Update client
DELETE /api/clients/:id         # Delete client
```

### Policies
```
GET    /api/policies            # List policies
GET    /api/policies/stats      # Policy statistics
GET    /api/policies/:id        # Get policy
POST   /api/policies            # Create policy
PUT    /api/policies/:id        # Update policy
DELETE /api/policies/:id        # Delete policy
```

### Claims
```
GET    /api/claims              # List claims
GET    /api/claims/stats        # Claim statistics
GET    /api/claims/:id          # Get claim
POST   /api/claims              # Create claim
PUT    /api/claims/:id          # Update claim
```

### Finance
```
GET    /api/finance/dashboard   # Financial dashboard
GET    /api/finance/invoices    # List invoices
GET    /api/finance/commissions # List commissions
GET    /api/finance/cashflow    # Cash flow data
```

### Analytics
```
GET    /api/analytics/overview  # Business overview
GET    /api/analytics/sales     # Sales metrics
GET    /api/analytics/agents    # Agent performance
GET    /api/analytics/customers # Customer insights
GET    /api/analytics/predictions # AI predictions
```

### AI Agents
```
GET    /api/agents              # List agents
GET    /api/agents/:id          # Get agent
POST   /api/agents/:id/execute  # Execute agent
POST   /api/agents/:id/toggle   # Enable/disable agent
```

### GraphQL
```
POST   /graphql                 # GraphQL endpoint
GET    /graphql                 # GraphQL Playground
```

---

## 🤖 Agentes de IA

### CFO Copilot
**Asistente financiero inteligente**

```typescript
// Ejemplo de uso
const result = await cfoAgent.execute({
  task: 'analyze_cashflow',
  params: { period: 'Q1-2024' }
});
```

**Capacidades:**
- Análisis de flujo de caja
- Predicción de ingresos
- Optimización de gastos
- Alertas de riesgos financieros
- Recomendaciones de inversión

### Sales Agent
**Automatización de ventas**

**Capacidades:**
- Calificación automática de leads
- Seguimiento de oportunidades
- Generación de propuestas
- Predicción de cierre
- Recomendaciones de cross-selling

### Customer Support Agent
**Atención al cliente 24/7**

**Capacidades:**
- Respuestas automáticas
- Resolución de consultas
- Escalado inteligente
- Análisis de sentimiento
- Base de conocimiento

### Document Processor
**Procesamiento de documentos**

**Capacidades:**
- OCR y extracción de datos
- Clasificación automática
- Validación de información
- Generación de resúmenes
- Detección de fraude

---

## 🗄️ Base de Datos

### Esquema de 81 Bases de Datos

#### Core (13 DBs)
- `sm_global` - Configuración global
- `sm_system` - Sistema y configuración
- `sm_audit` - Auditoría
- `sm_logs` - Logs del sistema
- ...

#### Insurance (12 DBs)
- `ss_insurance` - Seguros principal
- `ss_policies` - Pólizas
- `ss_claims` - Siniestros
- `ss_commissions` - Comisiones
- ...

#### HR (9 DBs)
- `sm_hr` - RRHH principal
- `sm_hr_payroll` - Nóminas
- `sm_hr_recruitment` - Reclutamiento
- ...

#### Analytics (9 DBs)
- `sm_analytics` - Analytics principal
- `sm_analytics_reports` - Reportes
- `sm_analytics_dashboards` - Dashboards
- ...

[Ver esquema completo en DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md)

---

## 🧪 Testing

```bash
# Unit tests
pnpm run test

# Watch mode
pnpm run test:watch

# Coverage
pnpm run test:coverage

# E2E tests
pnpm run test:e2e

# Integration tests
pnpm run test:integration
```

### Cobertura Objetivo
- **Unit Tests**: > 80%
- **Integration Tests**: > 70%
- **E2E Tests**: Critical paths

---

## 🚢 Deployment

### Docker

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d

# Con perfiles
docker-compose --profile full up -d
docker-compose --profile monitoring up -d
docker-compose --profile ai up -d
```

### Kubernetes

```bash
# Apply manifests
kubectl apply -f infrastructure/kubernetes/

# Con Kustomize
kubectl apply -k infrastructure/kubernetes/overlays/production/
```

### Manual

```bash
# Build
pnpm run build

# Start
NODE_ENV=production pnpm run start
```

---

## 📊 Monitorización

- **Prometheus**: Métricas del sistema
- **Grafana**: Dashboards visuales
- **Sentry**: Error tracking
- **ELK Stack**: Logs centralizados
- **Uptime Robot**: Monitoring externo

---

## 🤝 Contribución

Este es un proyecto propietario. Para contribuir:

1. Contacta con el equipo de desarrollo
2. Firma el NDA correspondiente
3. Sigue las guías de estilo del proyecto
4. Crea un branch desde `develop`
5. Envía un Pull Request

---

## 📄 Licencia

**PROPRIETARY** - © 2024 SOBI - AI Innovation Technologies

Todos los derechos reservados. Este software es propiedad de SOBI y está protegido por leyes de propiedad intelectual.

---

## 📞 Soporte

- **Email**: support@ai-core.io
- **Docs**: https://docs.ai-core.io
- **Status**: https://status.ai-core.io

---

## 🙏 Agradecimientos

Desarrollado con ❤️ por el equipo de SOBI - AI Innovation Technologies

---

**Versión**: 1.0.0  
**Última actualización**: 2024-01-25
