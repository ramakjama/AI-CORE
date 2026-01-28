# 🗺️ ROADMAP AIT-COMMS - Siguientes Pasos y Fases

## 📋 Estado Actual

### ✅ **COMPLETADO (100%)**

- [x] AINTECH Device UI (Softphone visual)
- [x] Paquete compartido (@ait-core/shared)
- [x] Event Bus (Redis Streams)
- [x] API Gateway centralizado
- [x] WebSocket Server (tiempo real)
- [x] Hook React (useAITCore)
- [x] Ejemplo completo (CallCenterApp)
- [x] Documentación arquitectura
- [x] Tipos TypeScript completos
- [x] Clientes API tipados

### 🟡 **EN PROGRESO (0%)**

Los servicios backend aún necesitan implementación completa:
- [ ] ait-core-soriano (ERP/CRM backend)
- [ ] ait-comms-telephony (Twilio integration backend)
- [ ] ait-authenticator (Auth service)
- [ ] ait-qb (Quote Engine)
- [ ] ait-datahub (Analytics)
- [ ] ait-multiscraper (Scrapers)

---

## 🎯 FASES DEL PROYECTO

---

## 📍 **FASE 0: Setup Inicial** (1-2 días)

### **Objetivo**: Preparar el entorno de desarrollo

### **Tareas**

#### 0.1. Infraestructura Local

```bash
# 1. Instalar PostgreSQL
# Windows:
choco install postgresql
# Mac:
brew install postgresql

# 2. Crear base de datos
psql -U postgres
CREATE DATABASE aitcore_dev;
CREATE USER aitcore WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE aitcore_dev TO aitcore;
\q

# 3. Instalar Redis
# Windows:
# Descargar de https://github.com/microsoftarchive/redis/releases
# Mac:
brew install redis
redis-server

# 4. Verificar Node.js y PNPM
node --version  # >= 18
pnpm --version  # >= 8
```

#### 0.2. Cuenta Twilio

```bash
1. Crear cuenta en https://www.twilio.com/try-twilio
2. Comprar número de teléfono (España: +34)
3. Crear TwiML App
4. Obtener credenciales:
   - Account SID
   - Auth Token
   - API Key + Secret
5. Configurar webhook URLs (localhost con ngrok para dev)
```

#### 0.3. Variables de Entorno

Crear archivos `.env`:

**`services/api-gateway/.env`**:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=change-me-in-production-use-long-random-string

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

DATABASE_URL=postgresql://aitcore:dev_password@localhost:5432/aitcore_dev

ERP_SERVICE_URL=http://localhost:3001
COMMS_SERVICE_URL=http://localhost:3002
QUOTES_SERVICE_URL=http://localhost:3003
AUTH_SERVICE_URL=http://localhost:3004
DATAHUB_SERVICE_URL=http://localhost:3005

CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**`services/websocket-server/.env`**:
```env
WS_PORT=4000
JWT_SECRET=change-me-in-production-use-long-random-string

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### 0.4. Instalación de Dependencias

```bash
# Desde la raíz del proyecto
cd ait-core-soriano
pnpm install

# Build shared package
cd packages/shared
pnpm build

# Build ait-comms-device
cd ../ait-comms-device
pnpm build
```

**✅ Entregable**: Entorno de desarrollo funcionando

---

## 📍 **FASE 1: Backend Core - Auth y ERP** (1 semana)

### **Objetivo**: Implementar servicios backend fundamentales

### **1.1. ait-authenticator (Auth Service)** ⏱️ 2 días

**Ubicación**: `services/ait-authenticator/`

**Stack**:
- Express.js
- JWT (jsonwebtoken)
- PostgreSQL (pg)
- bcrypt (passwords)

**Tareas**:

```typescript
// 1. Crear estructura
services/ait-authenticator/
├── src/
│   ├── index.ts                 // Server
│   ├── routes/
│   │   └── auth.routes.ts       // POST /login, /refresh, /logout
│   ├── controllers/
│   │   └── auth.controller.ts   // Lógica de auth
│   ├── middleware/
│   │   └── auth.middleware.ts   // Verify JWT
│   ├── models/
│   │   └── user.model.ts        // User DB model
│   └── utils/
│       ├── jwt.ts               // Generate/verify tokens
│       └── password.ts          // Hash/compare passwords
├── package.json
└── tsconfig.json

// 2. Implementar endpoints
POST /auth/login
  Body: { email, password }
  Response: { user, accessToken, refreshToken }

POST /auth/refresh
  Body: { refreshToken }
  Response: { accessToken }

POST /auth/logout
  Body: { refreshToken }
  Response: { success: true }

GET /auth/me
  Headers: { Authorization: Bearer <token> }
  Response: { user }

POST /auth/verify
  Body: { token }
  Response: { user }

// 3. Schema de base de datos
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  agent_id VARCHAR(50),
  customer_id UUID,
  permissions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

**Testing**:
```bash
# Test login
curl -X POST http://localhost:3004/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@example.com","password":"password123"}'

# Test verify
curl http://localhost:3004/auth/me \
  -H "Authorization: Bearer <token>"
```

**✅ Entregable**: Servicio de autenticación funcionando

---

### **1.2. ait-core-soriano (ERP/CRM Backend)** ⏱️ 3 días

**Ubicación**: `services/ait-core-soriano/`

**Stack**:
- Express.js
- PostgreSQL (pg)
- @ait-core/shared

**Tareas**:

```typescript
// 1. Estructura
services/ait-core-soriano/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── customers.routes.ts
│   │   ├── policies.routes.ts
│   │   ├── interactions.routes.ts
│   │   ├── tasks.routes.ts
│   │   ├── quotes.routes.ts
│   │   └── claims.routes.ts
│   ├── controllers/
│   ├── models/
│   ├── services/
│   └── middleware/
├── migrations/
│   └── 001_initial_schema.sql
└── package.json

// 2. Endpoints a implementar

// Customers
GET    /customers?phone=...&q=...
GET    /customers/:id
GET    /customers/:id/context?callSid=...
POST   /customers
PATCH  /customers/:id

// Policies
GET    /policies?customerId=...&status=...
GET    /policies/:id
GET    /policies/number/:policyNumber
POST   /policies
PATCH  /policies/:id
POST   /policies/:id/renew
POST   /policies/:id/cancel

// Interactions
GET    /interactions?customerId=...&callSid=...
POST   /interactions
PATCH  /interactions/:id

// Tasks
GET    /tasks?customerId=...&assignedTo=...&status=...
POST   /tasks
PATCH  /tasks/:id
POST   /tasks/:id/complete

// Quotes
GET    /quotes/:id
POST   /quotes
POST   /quotes/:id/accept
POST   /quotes/:id/reject

// Claims
GET    /claims?customerId=...&status=...
GET    /claims/:id
POST   /claims
PATCH  /claims/:id
POST   /claims/:id/approve

// 3. Schema de base de datos
-- Ver archivo separado: migrations/001_initial_schema.sql
```

**Schema Principal**:
```sql
-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50) NOT NULL,
  phone_secondary VARCHAR(50),
  dni VARCHAR(20) UNIQUE NOT NULL,
  date_of_birth DATE,
  language VARCHAR(10) DEFAULT 'es',
  segment VARCHAR(50) DEFAULT 'regular',
  status VARCHAR(50) DEFAULT 'active',
  preferred_contact VARCHAR(50) DEFAULT 'phone',
  last_contact_date TIMESTAMP,
  last_contact_type VARCHAR(50),
  last_agent_id VARCHAR(50),
  years_as_customer INTEGER DEFAULT 0,
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  satisfaction_score DECIMAL(3,2),
  churn_risk VARCHAR(20),
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  address JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Policies
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  carrier VARCHAR(100),
  status VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE,
  premium DECIMAL(10,2) NOT NULL,
  payment_frequency VARCHAR(50) DEFAULT 'annual',
  coverage JSONB,
  vehicle_data JSONB,
  property_data JSONB,
  life_data JSONB,
  deductible DECIMAL(10,2) DEFAULT 0,
  created_during_call_sid VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Interactions
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  agent_id VARCHAR(50),
  type VARCHAR(50) NOT NULL,
  direction VARCHAR(20) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  duration INTEGER,
  outcome VARCHAR(100),
  summary TEXT,
  transcription TEXT,
  sentiment_score DECIMAL(3,2),
  sentiment_label VARCHAR(20),
  recording_url TEXT,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  call_sid VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  customer_id UUID REFERENCES customers(id),
  policy_id UUID REFERENCES policies(id),
  claim_id UUID,
  assigned_to VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'pending',
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  scheduled_for TIMESTAMP,
  callback_phone VARCHAR(50),
  source VARCHAR(50) DEFAULT 'manual',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  agent_id VARCHAR(50),
  call_sid VARCHAR(100),
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  calculated_premium DECIMAL(10,2) NOT NULL,
  breakdown JSONB,
  vehicle_data JSONB,
  property_data JSONB,
  life_data JSONB,
  valid_until TIMESTAMP,
  accepted_at TIMESTAMP,
  policy_id UUID REFERENCES policies(id),
  competitor_prices JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Claims
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number VARCHAR(50) UNIQUE NOT NULL,
  policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  reported_date TIMESTAMP NOT NULL,
  incident_date TIMESTAMP NOT NULL,
  location TEXT,
  description TEXT,
  estimated_amount DECIMAL(10,2),
  approved_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2),
  deductible DECIMAL(10,2) DEFAULT 0,
  assigned_adjuster_id VARCHAR(50),
  call_sid VARCHAR(100),
  documents JSONB DEFAULT '[]',
  timeline JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_dni ON customers(dni);
CREATE INDEX idx_policies_customer_id ON policies(customer_id);
CREATE INDEX idx_policies_policy_number ON policies(policy_number);
CREATE INDEX idx_interactions_customer_id ON interactions(customer_id);
CREATE INDEX idx_interactions_call_sid ON interactions(call_sid);
CREATE INDEX idx_tasks_customer_id ON tasks(customer_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_claims_policy_id ON claims(policy_id);
```

**Testing**:
```bash
# Test customer lookup
curl "http://localhost:3001/customers?phone=%2B34912345678"

# Test create policy
curl -X POST http://localhost:3001/policies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "customerId": "...",
    "type": "auto",
    "premium": 450,
    ...
  }'
```

**✅ Entregable**: ERP/CRM backend funcionando con CRUD completo

---

### **1.3. Datos de Prueba (Seed)** ⏱️ 1 día

```sql
-- services/ait-core-soriano/seeds/dev_data.sql

-- Usuarios de prueba
INSERT INTO users (email, password_hash, name, role, agent_id, permissions) VALUES
('admin@soriano.com', '$2b$10$...', 'Admin User', 'admin', NULL, '["admin:*"]'),
('juan.garcia@soriano.com', '$2b$10$...', 'Juan García', 'agent', 'agent-001', '["call:make","call:receive","customer:read","customer:write","policy:read","policy:write","quote:create"]'),
('maria.lopez@soriano.com', '$2b$10$...', 'María López', 'agent', 'agent-002', '["call:make","call:receive","customer:read","policy:read"]'),
('supervisor@soriano.com', '$2b$10$...', 'Carlos Supervisor', 'supervisor', NULL, '["call:monitor","analytics:view","customer:read","policy:read"]');

-- Clientes de prueba
INSERT INTO customers (name, email, phone, dni, date_of_birth, segment, address) VALUES
('María Rodríguez', 'maria.rodriguez@email.com', '+34912345678', '12345678A', '1985-03-15', 'vip',
  '{"street":"Calle Mayor","number":"123","postalCode":"28001","city":"Madrid","province":"Madrid","country":"ES"}'::jsonb),
('Pedro Martínez', 'pedro.martinez@email.com', '+34923456789', '23456789B', '1990-07-20', 'regular',
  '{"street":"Gran Vía","number":"45","postalCode":"28013","city":"Madrid","province":"Madrid","country":"ES"}'::jsonb),
('Ana Sánchez', 'ana.sanchez@email.com', '+34934567890', '34567890C', '1978-11-30', 'premium',
  '{"street":"Paseo de la Castellana","number":"200","postalCode":"28046","city":"Madrid","province":"Madrid","country":"ES"}'::jsonb);

-- Pólizas de prueba
INSERT INTO policies (policy_number, customer_id, type, carrier, status, start_date, end_date, renewal_date, premium, coverage, vehicle_data)
SELECT
  'POL-AUTO-2026-' || LPAD(generate_series::text, 5, '0'),
  (SELECT id FROM customers WHERE name = 'María Rodríguez'),
  'auto',
  'Soriano Mediadores',
  'active',
  '2026-01-01',
  '2027-01-01',
  '2026-12-01',
  450.00,
  '{"liability":50000,"collision":true,"comprehensive":true}'::jsonb,
  '{"licensePlate":"1234ABC","make":"Toyota","model":"Corolla","year":2020}'::jsonb
FROM generate_series(1, 1);
```

**Script de seed**:
```bash
# services/ait-core-soriano/scripts/seed.sh
psql $DATABASE_URL -f seeds/dev_data.sql
```

**✅ Entregable**: Base de datos con datos de prueba

---

## 📍 **FASE 2: Backend Telephony** (1 semana)

### **Objetivo**: Implementar integración con Twilio

### **2.1. ait-comms-telephony** ⏱️ 4 días

**Ubicación**: `services/ait-comms-telephony/`

**Stack**:
- Express.js
- Twilio SDK
- PostgreSQL
- Redis
- @ait-core/shared

**Tareas**:

```typescript
// 1. Estructura
services/ait-comms-telephony/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── twilio.routes.ts      // Tokens, TwiML
│   │   ├── calls.routes.ts       // Call management
│   │   ├── agents.routes.ts      // Agent status
│   │   ├── queue.routes.ts       // Queue management
│   │   └── webhooks.routes.ts    // Twilio webhooks
│   ├── services/
│   │   ├── twilio.service.ts     // Twilio client wrapper
│   │   ├── routing.service.ts    // Call routing logic
│   │   └── recording.service.ts  // Recording management
│   └── utils/
│       ├── twiml.ts              // TwiML generation
│       └── quality.ts            // Call quality analysis
└── package.json

// 2. Endpoints principales

// Twilio Tokens
POST /twilio/token
  Body: { agentId }
  Response: { token, identity, expiresAt }

// Calls
POST /calls/outbound
  Body: { to, agentId, customerId, taskId }
  Response: { call }

GET /calls/:callSid
GET /calls/:callSid/context
PATCH /calls/:callSid/context
POST /calls/:callSid/transfer
POST /calls/:callSid/hangup
GET /calls?agentId=...&status=...

// Agent Status
POST /agents/:agentId/status
  Body: { status: 'available' | 'busy' | ... }
GET /agents/:agentId/status
GET /agents

// Queue
GET /queue/stats
GET /queue/waiting

// Recordings
GET /recordings/:callSid
POST /recordings/:callSid/transcribe

// Webhooks (llamados por Twilio)
POST /webhooks/twilio/voice          // Incoming calls
POST /webhooks/twilio/dial-status    // Dial result
POST /webhooks/twilio/call-status    // Call status updates
POST /webhooks/twilio/recording      // Recording ready

// 3. Implementación clave

// Generar Twilio Token
import twilio from 'twilio';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

async function generateToken(agentId: string) {
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY!,
    process.env.TWILIO_API_SECRET!,
    { identity: `agent-${agentId}` }
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_APP_SID!,
    incomingAllow: true
  });

  token.addGrant(voiceGrant);

  return {
    token: token.toJwt(),
    identity: `agent-${agentId}`,
    expiresAt: Date.now() + 3600000 // 1 hora
  };
}

// TwiML para llamada entrante
import { VoiceResponse } from 'twilio/lib/twiml/VoiceResponse';

async function handleIncomingCall(req, res) {
  const { From, CallSid } = req.body;

  // 1. Buscar cliente
  const customer = await erpClient.customers.findByPhone(From);

  // 2. Obtener contexto
  let context = {};
  if (customer) {
    context = await erpClient.customers.getContext(customer.id, CallSid);
  }

  // 3. Guardar en Redis
  await redis.set(`call:${CallSid}:context`, JSON.stringify(context), 'EX', 600);

  // 4. Encontrar agente disponible
  const agent = await findAvailableAgent({
    language: customer?.language || 'es',
    skills: inferSkills(context)
  });

  const twiml = new VoiceResponse();

  if (agent) {
    // Enrutar a agente
    const dial = twiml.dial({
      callerId: From,
      timeout: 30,
      action: '/webhooks/twilio/dial-status'
    });

    dial.client(`agent-${agent.id}`, {
      statusCallback: '/webhooks/twilio/call-status',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    });

    // Publicar evento
    await eventBus.publish('call.initiated', {
      callSid: CallSid,
      from: From,
      to: agent.id,
      customerId: customer?.id,
      direction: 'inbound'
    });
  } else {
    // Cola de espera
    twiml.say({
      voice: 'Polly.Conchita',
      language: 'es-ES'
    }, 'Todos nuestros agentes están ocupados. Por favor espere.');

    twiml.enqueue({
      waitUrl: '/webhooks/twilio/wait-music',
      action: '/webhooks/twilio/queue-action'
    }, 'support-queue');
  }

  res.type('text/xml');
  res.send(twiml.toString());
}

// Routing inteligente
async function findAvailableAgent(criteria: {
  language?: string;
  skills?: string[];
  previousAgentId?: string;
}) {
  // 1. Obtener agentes disponibles de Redis
  const agentKeys = await redis.keys('agent:*:status');
  const agents = [];

  for (const key of agentKeys) {
    const status = await redis.hgetall(key);
    if (status.status === 'available') {
      const agentId = key.split(':')[1];
      agents.push({ id: agentId, ...status });
    }
  }

  if (agents.length === 0) return null;

  // 2. Scoring
  let bestAgent = agents[0];
  let bestScore = 0;

  for (const agent of agents) {
    let score = 100;

    // Preferir agente anterior
    if (agent.id === criteria.previousAgentId) {
      score += 50;
    }

    // Idioma
    if (criteria.language && agent.languages?.includes(criteria.language)) {
      score += 20;
    }

    // Skills
    if (criteria.skills) {
      const matchingSkills = criteria.skills.filter(s => agent.skills?.includes(s));
      score += matchingSkills.length * 10;
    }

    // Carga de trabajo
    const callsToday = parseInt(agent.callsToday || '0');
    score -= callsToday * 2;

    if (score > bestScore) {
      bestScore = score;
      bestAgent = agent;
    }
  }

  return bestAgent;
}
```

**Schema BD**:
```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid VARCHAR(100) UNIQUE NOT NULL,
  direction VARCHAR(20) NOT NULL,
  from_number VARCHAR(50) NOT NULL,
  to_number VARCHAR(50) NOT NULL,
  agent_id VARCHAR(50),
  customer_id UUID REFERENCES customers(id),
  status VARCHAR(50) NOT NULL,
  state VARCHAR(50),
  started_at TIMESTAMP NOT NULL,
  answered_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration INTEGER,
  queue_time INTEGER,
  recording_url TEXT,
  recording_sid VARCHAR(100),
  quality_mos DECIMAL(3,2),
  quality_jitter INTEGER,
  quality_latency INTEGER,
  quality_packet_loss DECIMAL(5,2),
  outcome VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calls_call_sid ON calls(call_sid);
CREATE INDEX idx_calls_agent_id ON calls(agent_id);
CREATE INDEX idx_calls_customer_id ON calls(customer_id);
CREATE INDEX idx_calls_started_at ON calls(started_at);
```

**Testing**:
```bash
# Test token generation
curl -X POST http://localhost:3002/twilio/token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"agentId":"agent-001"}'

# Test outbound call
curl -X POST http://localhost:3002/calls/outbound \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "to": "+34912345678",
    "agentId": "agent-001",
    "customerId": "..."
  }'
```

### **2.2. Configurar Twilio Webhooks** ⏱️ 1 día

```bash
# Usar ngrok para desarrollo local
ngrok http 3002

# En Twilio Console:
# 1. TwiML Apps → Create New
# 2. Voice Request URL: https://<ngrok-url>/webhooks/twilio/voice
# 3. Voice Status Callback: https://<ngrok-url>/webhooks/twilio/call-status
# 4. Números → Configure
# 5. Voice Webhook: https://<ngrok-url>/webhooks/twilio/voice
```

### **2.3. Testing End-to-End** ⏱️ 2 días

```bash
# 1. Iniciar todos los servicios
# Terminal 1 - Auth
cd services/ait-authenticator && npm run dev

# Terminal 2 - ERP
cd services/ait-core-soriano && npm run dev

# Terminal 3 - Telephony
cd services/ait-comms-telephony && npm run dev

# Terminal 4 - API Gateway
cd services/api-gateway && npm run dev

# Terminal 5 - WebSocket
cd services/websocket-server && npm run dev

# Terminal 6 - Frontend
cd apps/web && npm run dev

# 2. Test flujo completo
# - Login en frontend
# - Marcar número Twilio desde teléfono real
# - Verificar que suena en frontend
# - Contestar llamada
# - Verificar WebRTC connection
# - Colgar
# - Verificar que se guardó en DB
```

**✅ Entregable**: Sistema de telefonía funcionando end-to-end

---

## 📍 **FASE 3: Quote Engine y Scrapers** (1 semana)

### **3.1. ait-qb (Quote Engine)** ⏱️ 3 días

**Ubicación**: `services/ait-qb/`

**Features**:
- Cálculo de primas
- Pricing rules
- Descuentos
- Factores de riesgo

```typescript
// Ejemplo simplificado
async function calculateAutoPremium(params: {
  vehicleData: VehicleData;
  customerId: string;
}) {
  let premium = BASE_PREMIUM_AUTO; // 400€

  // Factores de vehículo
  premium *= getVehicleAgeFactor(params.vehicleData.year);
  premium *= getMakeFactor(params.vehicleData.make);

  // Factores del conductor
  const driver = params.vehicleData.drivers[0];
  premium *= getAgeFactor(driver.age);
  premium *= getExperienceFactor(driver.experience);
  premium *= getClaimsFactor(driver.claims);

  // Descuentos
  const customer = await erpClient.customers.findById(params.customerId);

  if (customer.yearsAsCustomer > 5) {
    premium *= 0.85; // 15% descuento fidelidad
  }

  if (driver.claims === 0) {
    premium *= 0.90; // 10% sin siniestros
  }

  return {
    premium: Math.round(premium * 100) / 100,
    breakdown: {
      base: BASE_PREMIUM_AUTO,
      factors: {...},
      discounts: {...},
      final: premium
    }
  };
}
```

### **3.2. ait-multiscraper (Scrapers)** ⏱️ 4 días

**Ubicación**: `services/ait-multiscraper/`

**Features**:
- Scrapers de aseguradoras
- Precios competencia
- Jobs async con Bull

```typescript
// Ejemplo con Puppeteer
import puppeteer from 'puppeteer';

async function scrapeMapfre(vehicleData: VehicleData) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://www.mapfre.es/seguros/particulares/coches/');

  // Fill form
  await page.type('#matricula', vehicleData.licensePlate);
  await page.click('#calcular');

  // Wait for result
  await page.waitForSelector('.precio');

  const price = await page.$eval('.precio', el => {
    return parseFloat(el.textContent.replace('€', '').trim());
  });

  await browser.close();

  return {
    carrier: 'Mapfre',
    price,
    scrapedAt: new Date(),
    source: 'web'
  };
}
```

**✅ Entregable**: Cotización funcionando con precios competencia

---

## 📍 **FASE 4: Analytics y IA** (1 semana)

### **4.1. ait-datahub (Analytics)** ⏱️ 3 días

**Features**:
- Métricas en tiempo real
- Dashboards
- Reportes
- KPIs

```typescript
// Ejemplo de métricas
async function getCallMetrics(period: 'today' | 'week' | 'month') {
  const startDate = getStartDate(period);

  const metrics = await db.query(`
    SELECT
      COUNT(*) as total_calls,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_calls,
      COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned_calls,
      AVG(duration) as avg_duration,
      AVG(queue_time) as avg_wait_time,
      AVG(quality_mos) as avg_quality,
      COUNT(CASE WHEN queue_time < 30 THEN 1 END)::float / COUNT(*) as service_level
    FROM calls
    WHERE started_at >= $1
  `, [startDate]);

  return metrics.rows[0];
}
```

### **4.2. Integración IA (OpenAI/Claude)** ⏱️ 4 días

**Features**:
- Transcripción automática
- Análisis de sentiment
- Resumen de llamadas
- Extracción de tareas
- Sugerencias al agente

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Transcripción
async function transcribeCall(audioUrl: string) {
  const response = await openai.audio.transcriptions.create({
    file: await fetch(audioUrl),
    model: 'whisper-1',
    language: 'es'
  });

  return response.text;
}

// Análisis
async function analyzeCall(transcription: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Analiza esta llamada de seguros y extrae:
        1. Resumen (2-3 frases)
        2. Sentiment (positive/neutral/negative)
        3. Tareas pendientes
        4. Categoría (renovación, siniestro, consulta, venta)`
      },
      {
        role: 'user',
        content: transcription
      }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

**✅ Entregable**: Analytics y IA funcionando

---

## 📍 **FASE 5: Testing y QA** (3-5 días)

### **5.1. Unit Tests**

```bash
# Cada servicio necesita tests
services/ait-authenticator/tests/
services/ait-core-soriano/tests/
services/ait-comms-telephony/tests/
services/ait-qb/tests/
```

### **5.2. Integration Tests**

```typescript
// tests/integration/call-flow.test.ts
describe('Complete Call Flow', () => {
  it('should handle incoming call end-to-end', async () => {
    // Test completo
  });
});
```

### **5.3. Load Testing**

```bash
# Usar Artillery o k6
artillery quick --count 100 --num 10 http://localhost:3000/api/customers/search
```

**✅ Entregable**: Suite de tests completa

---

## 📍 **FASE 6: Optimización y Performance** (1 semana)

### **6.1. Caching**

```typescript
// Redis caching
async function getCustomerWithCache(id: string) {
  const cached = await redis.get(`customer:${id}`);
  if (cached) return JSON.parse(cached);

  const customer = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
  await redis.set(`customer:${id}`, JSON.stringify(customer), 'EX', 300);

  return customer;
}
```

### **6.2. Database Optimization**

```sql
-- Indexes adicionales
CREATE INDEX CONCURRENTLY idx_calls_composite ON calls(agent_id, started_at DESC);
CREATE INDEX CONCURRENTLY idx_policies_renewal ON policies(renewal_date) WHERE status = 'active';

-- Partitioning por fecha
CREATE TABLE calls_2026_01 PARTITION OF calls
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

### **6.3. Query Optimization**

```typescript
// Eager loading
const customers = await db.query(`
  SELECT
    c.*,
    json_agg(DISTINCT p.*) as policies,
    json_agg(DISTINCT i.*) FILTER (WHERE i.id IS NOT NULL) as interactions
  FROM customers c
  LEFT JOIN policies p ON p.customer_id = c.id AND p.status = 'active'
  LEFT JOIN interactions i ON i.customer_id = c.id AND i.created_at > NOW() - INTERVAL '30 days'
  WHERE c.id = $1
  GROUP BY c.id
`, [customerId]);
```

**✅ Entregable**: Sistema optimizado para producción

---

## 📍 **FASE 7: Deployment a Producción** (1 semana)

### **7.1. Containerización**

```dockerfile
# Dockerfile para cada servicio
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### **7.2. Kubernetes / Docker Swarm**

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: aitcore/api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

### **7.3. CI/CD**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build Docker images
        run: docker-compose build

      - name: Run tests
        run: npm test

      - name: Deploy to production
        run: |
          docker-compose push
          kubectl apply -f k8s/
```

### **7.4. Monitoring**

```bash
# Prometheus + Grafana
docker-compose up -d prometheus grafana

# Sentry para errores
npm install @sentry/node

# Logs con ELK
docker-compose up -d elasticsearch logstash kibana
```

**✅ Entregable**: Sistema en producción

---

## 📍 **FASE 8: Features Avanzadas** (Ongoing)

### **8.1. Video Calls**

- Twilio Video
- Screen sharing
- Recording

### **8.2. Omnichannel**

- WhatsApp Business API
- Email integration
- Live Chat
- SMS

### **8.3. Advanced AI**

- Real-time agent assist
- Sentiment analysis en vivo
- Automatic summarization
- Predictive analytics

### **8.4. Mobile Apps**

- React Native para agentes
- Cliente móvil

---

## 📊 **TIMELINE TOTAL**

```
┌─────────────────────────────────────────────────────────┐
│  FASE  │  DURACIÓN  │  ACUMULADO  │  ENTREGABLE         │
├─────────────────────────────────────────────────────────┤
│  0     │  2 días    │  2 días     │  Setup completo     │
│  1     │  1 semana  │  9 días     │  Auth + ERP         │
│  2     │  1 semana  │  16 días    │  Telephony          │
│  3     │  1 semana  │  23 días    │  Quotes + Scrapers  │
│  4     │  1 semana  │  30 días    │  Analytics + IA     │
│  5     │  5 días    │  35 días    │  Testing            │
│  6     │  1 semana  │  42 días    │  Optimización       │
│  7     │  1 semana  │  49 días    │  Producción         │
└─────────────────────────────────────────────────────────┘

TOTAL: ~7 semanas (1.5 - 2 meses)
```

---

## ✅ **CHECKLIST GENERAL**

### Setup (Fase 0)
- [ ] PostgreSQL instalado y configurado
- [ ] Redis instalado y running
- [ ] Cuenta Twilio creada
- [ ] Números de teléfono comprados
- [ ] Variables de entorno configuradas
- [ ] Dependencies instaladas

### Backend Core (Fase 1)
- [ ] ait-authenticator funcionando
- [ ] JWT tokens generándose
- [ ] ait-core-soriano con CRUD completo
- [ ] Database schema migrado
- [ ] Datos de prueba cargados

### Telephony (Fase 2)
- [ ] ait-comms-telephony funcionando
- [ ] Twilio webhooks configurados
- [ ] Llamadas entrantes funcionando
- [ ] Llamadas salientes funcionando
- [ ] WebRTC connection establecida
- [ ] Recording funcionando

### Quotes & Scrapers (Fase 3)
- [ ] ait-qb calculando primas
- [ ] Pricing rules implementadas
- [ ] ait-multiscraper funcionando
- [ ] Scrapers de 3+ aseguradoras

### Analytics & IA (Fase 4)
- [ ] ait-datahub con métricas
- [ ] Dashboards funcionando
- [ ] Transcripción automática
- [ ] Análisis de sentiment
- [ ] Resúmenes de llamadas

### Testing (Fase 5)
- [ ] Unit tests >80% coverage
- [ ] Integration tests pasando
- [ ] Load testing completado
- [ ] Security audit

### Optimización (Fase 6)
- [ ] Redis caching implementado
- [ ] Database indexes optimizados
- [ ] Queries optimizadas
- [ ] Performance acceptable (<200ms)

### Producción (Fase 7)
- [ ] Docker images creados
- [ ] CI/CD pipeline configurado
- [ ] Monitoring setup (Prometheus)
- [ ] Logging setup (ELK)
- [ ] Error tracking (Sentry)
- [ ] Backups configurados
- [ ] SSL certificates
- [ ] Domain configurado

---

## 🎯 **PRIORIZACIÓN**

### **MVP (Mínimo Viable Product)** - 4 semanas

```
✅ MUST HAVE (Crítico):
- Auth service
- ERP básico (Customers, Policies)
- Telephony básico (recibir/hacer llamadas)
- WebSocket para tiempo real
- Frontend funcionando

🟡 SHOULD HAVE (Importante):
- Quote engine básico
- Analytics básicos
- Transcripción manual

⚪ NICE TO HAVE (Futuro):
- Scrapers
- IA avanzada
- Video calls
```

### **V1.0 (Producción)** - 7 semanas

```
Todo lo anterior +
- Scrapers funcionando
- IA para transcripción y análisis
- Analytics completos
- Testing completo
- Deployment automatizado
```

### **V2.0 (Avanzado)** - 3-6 meses

```
- Video calls
- WhatsApp integration
- Advanced AI
- Mobile apps
- Omnichannel completo
```

---

## 📝 **NOTAS IMPORTANTES**

1. **Paralelización**: Las Fases 3 y 4 pueden hacerse en paralelo
2. **Equipo**: Timeline asume 1-2 desarrolladores
3. **Twilio Costs**: Presupuestar ~50€/mes en dev, más en producción
4. **OpenAI Costs**: ~100€/mes para transcripción y análisis
5. **Infrastructure**: ~200-300€/mes (servers, DB, Redis)

---

**¿Quieres que empiece con alguna fase específica?**

Puedo implementar:
1. Setup completo (Fase 0)
2. Auth service (Fase 1.1)
3. ERP backend (Fase 1.2)
4. Telephony service (Fase 2)

O seguir con el orden del roadmap.
