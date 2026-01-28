# 🏗️ ARQUITECTURA DEFINITIVA DEL ECOSISTEMA AINTECH

**Fecha:** 2026-01-28
**Versión:** 4.0.0-DEFINITIVA
**Estado:** Arquitectura Corregida y Consolidada

---

## 🎯 CLARIFICACIÓN FUNDAMENTAL

### ❌ Conceptos INCORRECTOS (Anteriores)

```
✗ ain-tech-web = Web de Soriano Mediadores
✗ ain-tech-web = Producto para crear webs de brokers
✗ Confusión entre tecnología y clientes
```

### ✅ Conceptos CORRECTOS (Definitivos)

```
AINTECH = Empresa tecnológica (Fundador: Ramón Soriano)
    ↓ desarrolla
PRODUCTOS TECNOLÓGICOS AIT
    ↓ vendidos a / usados por
CLIENTES (Soriano Mediadores = Cliente Piloto)
```

---

## 🏢 ESTRUCTURA DEL ECOSISTEMA

### Nivel 1: AINTECH (La Empresa)

```
AINTECH Solutions
├── Website Corporativo: ain-tech-web → www.aintech.com
│   Propósito: Presentar empresa, productos, captar clientes B2B
│   Stack: Next.js 14, TypeScript, Tailwind CSS
│   Target: Brokers que quieren comprar tecnología AIT
│
└── Productos B2B (AIT Suite)
    ├── AIT-CORE → ERP Vertical Seguros
    ├── AIT-WEB → CMS/Plataforma Web para Brokers
    ├── AIT-ECLIENTE → Portal Clientes White-Label
    ├── AIT-ENGINES → Motores IA/ML
    ├── AIT-DATAHUB → Gestión de Datos
    ├── AIT-AUTHENTICATOR → SSO/OAuth2
    ├── AIT-MULTISCRAPER → Web Scraping
    ├── AIT-QB → Quick Books Integration
    └── ... (más productos)
```

---

### Nivel 2: PRODUCTOS AINTECH (Vendibles, White-Label)

#### 1. AIT-CORE (ERP Vertical Seguros)

**Repo:** `ait-core-soriano`
**Descripción:** ERP modular de 57 módulos para gestión integral de mediadores de seguros
**Tecnología:** NestJS 11, Prisma, PostgreSQL 17, Redis, Kafka, Elasticsearch

**Arquitectura:**
```
ait-core-soriano/
├── modules/
│   ├── 01-core-business/
│   │   ├── ai-accountant
│   │   ├── ai-pgc-engine ✅ (integrado)
│   │   ├── ai-treasury
│   │   └── ... (8 módulos)
│   ├── 02-insurance-specialized/ (20 módulos)
│   ├── 03-marketing-sales/ (10 módulos)
│   ├── 04-analytics-intelligence/ (6 módulos)
│   ├── 05-security-compliance/ (4 módulos)
│   ├── 06-infrastructure/ (5 módulos)
│   └── 07-integration-automation/ (4 módulos)
├── apps/
│   ├── api/       # API Gateway (pendiente)
│   ├── admin/     # Admin dashboard
│   ├── web/       # Web app
│   └── mobile/    # Mobile app
├── agents/        # 16 AI Agents
├── libs/          # Shared libraries
└── docker-compose.yml
```

**Instancias:**
- `ait-core-soriano` → Configuración para Soriano Mediadores (cliente piloto)

---

#### 2. AIT-WEB (Plataforma Web para Brokers)

**Repo:** `soriano-web` (aka www.sorianomediadores.es-website)
**Descripción:** Plataforma insurtech premium con diseño Apple-style
**Tecnología:** Next.js 14, Prisma, PostgreSQL, NextAuth, Groq/Claude AI

**⭐ ELEMENTO CLAVE del Ecosistema**

**Características:**
```
✅ Diseño Premium Apple-Style
✅ Asistente IA "SORI" (Groq + Claude fallback)
✅ Gamificación "Soriano Club"
   ├── Bronce (0-999 puntos, 0% descuento)
   ├── Plata (1000-4999, 5% descuento)
   ├── Oro (5000-14999, 10% descuento)
   └── Platino (15000+, 15% descuento)
✅ Dashboard Premium (pólizas, recibos, siniestros)
✅ Dark Mode completo
✅ Backend robusto (NextAuth + Prisma)
```

**Estructura:**
```
soriano-web/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # Componentes React
│   │   ├── ui/           # Componentes base
│   │   ├── dashboard/    # Dashboard del usuario
│   │   ├── chat/         # Asistente SORI
│   │   └── gamification/ # Sistema de niveles
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilidades
│   └── types/            # TypeScript types
├── prisma/
│   └── schema.prisma     # DB schema
├── public/
│   ├── images/
│   └── logos/
└── package.json
```

**URLs:**
- Producción: https://www.sorianomediadores.es
- Dev: http://localhost:3000

**Instancias:**
- `soriano-web` → www.sorianomediadores.es (cliente piloto Soriano)

---

#### 3. AIT-ECLIENTE (Portal Clientes White-Label)

**Repo:** `soriano-ecliente`
**Descripción:** Portal self-service para clientes finales con gamificación progresiva
**Tecnología:** Next.js 14, Prisma, PostgreSQL, NextAuth

**Características:**
```
✅ Sistema de Permisos Progresivos (4 niveles)
✅ Gamificación (XP, COINS, SHIELDS)
✅ Gestión de Pólizas
✅ Gestión de Siniestros
✅ Documentos (almacenamiento por nivel)
✅ Mensajes (email, chat, videollamada según nivel)
🔴 Pagos (pendiente)
```

**Niveles de Acceso:**
```
Bronce (0-999 XP)
├── Funcionalidades básicas: 10
├── Storage: 50 MB
└── Soporte: Email

Plata (1000-4999 XP)
├── Funcionalidades: 20
├── Storage: 200 MB
└── Soporte: Email + Chat

Oro (5000-14999 XP)
├── Funcionalidades: 30
├── Storage: 1 GB
├── Cotizador Avanzado ✅
└── Soporte: Email + Chat + Prioridad

Platino (15000+ XP)
├── Funcionalidades: 40+
├── Storage: Ilimitado
├── Cotizador + Auto-renovación
└── Soporte: 24/7 + Videollamada
```

**Instancias:**
- `soriano-ecliente` → Portal de clientes de Soriano Mediadores

---

#### 4. AIT-ENGINES (Motores IA/ML Backend)

**Repo:** `ait-engines` (o dentro de ait-core-soriano)
**Descripción:** 23 motores computacionales especializados
**Tecnología:** Python FastAPI, scikit-learn, TensorFlow, PyTorch

**Motores:**
```
ML/DL Models:
├── Account Classification (OpenAI embeddings)
├── Churn Prediction (Random Forest)
├── Fraud Detection (Isolation Forest)
├── Pricing Optimization (XGBoost)
├── Risk Assessment (Neural Network)
└── Customer Segmentation (K-Means)

NLP/OCR:
├── Document OCR (Tesseract + GPT-4 Vision)
├── Contract Parsing (NLP)
├── Email Classification (BERT)
└── Sentiment Analysis (Transformers)

Business Intelligence:
├── Forecasting (Prophet)
├── Anomaly Detection (Autoencoders)
├── Recommendation Engine (Collaborative Filtering)
└── Cost Estimation (Regression Models)
```

---

#### 5. AIT-AUTHENTICATOR (SSO Centralizado)

**Repo:** `ait-authenticator` (pendiente creación)
**Descripción:** Single Sign-On para todo el ecosistema
**Tecnología:** NestJS 11, Passport.js, JWT, OAuth2

**Funcionalidades:**
```
✅ OAuth 2.0 / OpenID Connect
✅ Social Login (Google, Microsoft, Apple, LinkedIn)
✅ SAML 2.0 (enterprise)
✅ MFA (TOTP, SMS, Email, FIDO2)
✅ RBAC + ABAC
✅ Session Management (Redis)
✅ Password Policies
✅ Audit Trail
```

---

#### 6. AIT-DATAHUB (Gestión de Datos)

**Repo:** `ait-datahub`
**Descripción:** Data warehouse y ETL
**Tecnología:** Python, Apache Airflow, dbt, PostgreSQL

---

#### 7. AIT-MULTISCRAPER (Web Scraping)

**Repo:** `ait-multiscraper`
**Descripción:** Scraping de compañías de seguros (AXA, Mapfre, etc.)
**Tecnología:** Python, Scrapy, Selenium, Puppeteer

---

#### 8. AIT-QB (QuickBooks Integration)

**Repo:** `ait-qb`
**Descripción:** Integración con QuickBooks
**Tecnología:** NestJS, QuickBooks API

---

### Nivel 3: SORIANO MEDIADORES (Cliente Piloto)

```
SORIANO MEDIADORES DE SEGUROS S.L.
Dirección: Calle Constitución 5, 03570 Villajoyosa (Alicante)
Tel: +34 966 810 290
Email: info@sorianomediadores.es
Respaldo: Occident - Grupo Catalana Occidente

INSTANCIAS AIT UTILIZADAS:

1. Website Corporativo
   ├── Repo: soriano-web
   ├── URL: www.sorianomediadores.es
   └── Producto: AIT-WEB (instancia configurada)

2. Portal Clientes
   ├── Repo: soriano-ecliente
   ├── URL: clientes.sorianomediadores.es (o subdirectorio)
   └── Producto: AIT-ECLIENTE (instancia configurada)

3. ERP Interno
   ├── Repo: ait-core-soriano
   ├── URL: erp.sorianomediadores.es (o interno)
   └── Producto: AIT-CORE (instancia configurada)

4. Landings Especializadas
   ├── Repo: soriano-landing
   ├── URLs:
   │   ├── /seguros-hogar
   │   ├── /seguros-auto
   │   └── /seguros-empresas
   └── Producto: AIT-LANDINGS (HTML estático)
```

---

## 🔗 ARQUITECTURA DE INTEGRACIÓN

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                    ECOSISTEMA SORIANO MEDIADORES                 │
│                     (Cliente Piloto de AinTech)                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                         CAPA PRESENTACIÓN                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│  │ SORIANO-WEB  │   │ ECLIENTE     │   │ LANDINGS     │       │
│  │ (Next.js 14) │   │ (Next.js 14) │   │ (HTML)       │       │
│  │ www.soriano  │   │ Portal       │   │ SEO Pages    │       │
│  │ mediadores.es│   │ Clientes     │   │              │       │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘       │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │                  │                  │
          │                  │                  │
┌─────────┴──────────────────┴──────────────────┴────────────────┐
│                    CAPA AUTENTICACIÓN                            │
├─────────────────────────────────────────────────────────────────┤
│              AIT-AUTHENTICATOR (OAuth2/SSO/MFA)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ - JWT Tokens (15min access, 7d refresh)                  │  │
│  │ - Social Login (Google, Microsoft, Apple)                │  │
│  │ - MFA (TOTP, SMS, Email)                                 │  │
│  │ - RBAC + Fine-grained permissions                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                       CAPA INTEGRACIÓN                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│  │ API GATEWAY  │   │ AIT-CONNECTOR│   │ KAFKA EVENT  │       │
│  │ (NestJS)     │   │ (200+ APIs)  │   │ BUS          │       │
│  │ Port: 3002   │   │              │   │              │       │
│  └──────────────┘   └──────────────┘   └──────────────┘       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                       CAPA APLICACIÓN                            │
├─────────────────────────────────────────────────────────────────┤
│                    AIT-CORE-SORIANO (ERP)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 57 Módulos Especializados:                              │   │
│  │  ├── Core Business (8)                                  │   │
│  │  │   ├── ai-accountant                                  │   │
│  │  │   ├── ai-pgc-engine ✅ (Port: 3001)                 │   │
│  │  │   ├── ai-treasury                                    │   │
│  │  │   └── ...                                            │   │
│  │  ├── Insurance Specialized (20)                         │   │
│  │  ├── Marketing/Sales (10)                               │   │
│  │  ├── Analytics (6)                                      │   │
│  │  ├── Security (4)                                       │   │
│  │  ├── Infrastructure (5)                                 │   │
│  │  └── Integration (4)                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                      CAPA AGENTES IA (16)                        │
├─────────────────────────────────────────────────────────────────┤
│  8 ESPECIALISTAS                      8 EJECUTORES              │
│  ├── Insurance Specialist       →    ├── CEO Agent             │
│  ├── Finance Specialist         →    ├── CFO Agent             │
│  ├── Legal Specialist           →    ├── CTO Agent             │
│  ├── Marketing Specialist       →    ├── CMO Agent             │
│  ├── Data Specialist            →    ├── Sales Manager         │
│  ├── Security Specialist        →    ├── Operations Manager    │
│  ├── Customer Specialist        →    ├── HR Manager            │
│  └── Operations Specialist      →    └── Compliance Officer    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                      CAPA MOTORES (23)                           │
├─────────────────────────────────────────────────────────────────┤
│                  AIT-ENGINES (Python FastAPI)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ML/DL: Classification, Churn, Fraud, Pricing, Risk      │   │
│  │ NLP/OCR: Document OCR, Contract Parsing, Sentiment      │   │
│  │ BI: Forecasting, Anomaly, Recommendation, Cost Est.     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                         CAPA DATOS                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ PostgreSQL 17    │  │ Redis 7.4        │  │ Elasticsearch│ │
│  │ + pgvector       │  │ Cache/Sessions   │  │ Search/Logs  │ │
│  │ 40 Databases     │  │                  │  │              │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ MinIO            │  │ Kafka + Zookeeper│                    │
│  │ S3 Storage       │  │ Message Bus      │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 INTEGRACIONES CRÍTICAS

### 1. soriano-web ↔ ait-core-soriano

**Flujo:**
```
soriano-web (Frontend)
    ↓ API calls
API Gateway (Port 3002)
    ↓ route
ai-accountant / ai-billing / ai-claims
    ↓ use
ai-pgc-engine (Port 3001)
    ↓ store
PostgreSQL (pgc_engine, accounting_db)
```

**Endpoints a Conectar:**
```typescript
// soriano-web frontend calls
POST /api/cotizar           → API Gateway → AI-QUOTES
POST /api/contacto          → API Gateway → AI-CRM
POST /api/chat              → API Gateway → AIT-NERVE (SORI Assistant)
GET  /api/productos         → API Gateway → AI-PRODUCTS
POST /api/contratar-poliza  → API Gateway → AI-POLICY-MANAGER
```

---

### 2. soriano-ecliente ↔ ait-core-soriano

**Flujo:**
```
soriano-ecliente (Frontend)
    ↓ API calls
API Gateway (Port 3002)
    ↓ route
├── /polizas        → AI-POLICY-MANAGER
├── /siniestros     → AI-CLAIMS-PROCESSOR
├── /documentos     → AI-DOCUMENT-VAULT
├── /pagos          → AI-BILLING + AI-TREASURY
└── /mensajes       → AI-SUPPORT
```

**Autenticación:**
```
User logs in ecliente
    ↓
AIT-AUTHENTICATOR issues JWT
    ↓
JWT passed to all API calls
    ↓
API Gateway validates JWT
    ↓
Routes to appropriate module
```

---

### 3. ain-tech-web ↔ ait-core-soriano

**Propósito:** ain-tech-web es el sitio corporativo de AinTech
**NO tiene integración directa con ait-core-soriano**

ain-tech-web muestra:
- Productos AIT disponibles
- Casos de éxito (incluyendo Soriano)
- Demos de productos
- Formulario para solicitar prueba

---

## 📋 REPOSITORIOS Y UBICACIONES

| Componente | Repo | Ubicación | Puerto | Stack |
|------------|------|-----------|--------|-------|
| **AinTech Corporate Site** | ain-tech-web | `C:\Users\rsori\codex\ain-tech-web` | 3000 | Next.js 14 |
| **Soriano Website** | soriano-web | `C:\Users\rsori\codex\soriano-web` | 3000 | Next.js 14 |
| **Soriano eCliente** | soriano-ecliente | `C:\Users\rsori\codex\soriano-ecliente` | 3000 | Next.js 14 |
| **AIT-CORE ERP** | ait-core-soriano | `C:\Users\rsori\codex\ait-core-soriano` | - | NestJS 11 |
| **AI-PGC-ENGINE** | (dentro ait-core) | `ait-core-soriano/modules/.../ai-pgc-engine` | 3001 | NestJS 11 |
| **API Gateway** | (dentro ait-core) | `ait-core-soriano/apps/api` | 3002 | NestJS 11 |
| **AIT-ENGINES** | ait-engines | TBD | 8000 | Python FastAPI |
| **AIT-DATAHUB** | ait-datahub | `C:\Users\rsori\codex\ait-datahub` | - | Python |
| **AIT-MULTISCRAPER** | ait-multiscraper | `C:\Users\rsori\codex\ait-multiscraper` | - | Python |
| **AIT-AUTHENTICATOR** | ait-authenticator | `C:\Users\rsori\codex\ait-authenticator` | 3003 | NestJS 11 |
| **Soriano Landings** | soriano-landing | `C:\Users\rsori\codex\soriano-landing` | - | HTML |

---

## 🎯 PRÓXIMOS PASOS (FASE 0)

### ✅ Completado
1. ✅ Integrar AI-PGC-ENGINE en ait-core-soriano
2. ✅ Clarificar arquitectura del ecosistema

### 🔄 En Progreso
3. ⏳ **Crear API Gateway centralizado**
   - Ubicación: `ait-core-soriano/apps/api`
   - Puerto: 3002
   - Funcionalidad: Ruteo a todos los módulos
   - Autenticación: Validación JWT con AIT-AUTHENTICATOR

4. ⏳ **Conectar soriano-ecliente con ait-core-soriano**
   - Mapear endpoints
   - Configurar CORS
   - Testing E2E

5. ⏳ **Conectar soriano-web con ait-core-soriano**
   - Integrar asistente SORI con AIT-NERVE
   - Conectar cotizador con AI-QUOTES
   - Conectar contratación con AI-POLICY-MANAGER

---

## 📊 SUMMARY

### Productos AinTech (Tecnología White-Label)
1. AIT-CORE → ERP modular (57 módulos)
2. AIT-WEB → CMS/Plataforma web
3. AIT-ECLIENTE → Portal clientes
4. AIT-ENGINES → Motores IA/ML (23)
5. AIT-AUTHENTICATOR → SSO
6. AIT-DATAHUB → Data warehouse
7. AIT-MULTISCRAPER → Web scraping
8. AIT-QB → QuickBooks integration

### Instancias para Soriano Mediadores (Cliente Piloto)
1. soriano-web → www.sorianomediadores.es
2. soriano-ecliente → Portal clientes
3. ait-core-soriano → ERP configurado
4. soriano-landing → Landings SEO

### Repositorios de AinTech (Corporativo)
1. ain-tech-web → www.aintech.com

---

**Conclusión:** Arquitectura clarificada. Todos los componentes correctamente clasificados entre productos AinTech, instancias de cliente, y sitios corporativos.

**Estado:** ✅ DOCUMENTACIÓN COMPLETA
**Próximo:** Crear API Gateway para unificar acceso a todos los módulos
