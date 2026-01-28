# 🎯 AIT-COMMS - Sistema de Telecomunicaciones Completamente Integrado

## 📚 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes del Sistema](#componentes-del-sistema)
4. [Flujo de Datos](#flujo-de-datos)
5. [Deployment](#deployment)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Testing](#testing)
8. [Monitoreo y Logs](#monitoreo-y-logs)

---

## 🎯 Resumen Ejecutivo

**AIT-COMMS** es un **ecosistema completo de telecomunicaciones VoIP** integrado con el sistema ERP/CRM de AIT-CORE. Proporciona:

- ✅ **Softphone Visual** con interfaz high-tech (AINTECH Device)
- ✅ **VoIP en Tiempo Real** (Twilio + WebRTC)
- ✅ **Integración Total con CRM** (Contexto del cliente en tiempo real)
- ✅ **Cotización Durante Llamadas** (AIT-QB + Scrapers)
- ✅ **Analytics en Vivo** (Métricas de llamadas, agentes, revenue)
- ✅ **Event-Driven Architecture** (Event Bus con Redis Streams)
- ✅ **API Gateway Centralizado** (Un solo punto de entrada)
- ✅ **WebSocket Server** (Actualizaciones en tiempo real)

---

## 🏗️ Arquitectura del Sistema

### **Diagrama General**

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │ ain-tech-web   │  │soriano-ecliente│  │ ait-comms-device │  │
│  │ (Agent Portal) │  │(Customer Portal)│  │  (Softphone UI)  │  │
│  └────────┬───────┘  └────────┬───────┘  └────────┬─────────┘  │
│           │                   │                    │             │
│           └───────────────────┴────────────────────┘             │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
            HTTP/REST                WebSocket
                    │                     │
    ┌───────────────┴────────┐   ┌───────┴────────┐
    │   API GATEWAY          │   │  WS SERVER     │
    │   (Port 3000)          │   │  (Port 4000)   │
    └───────────┬────────────┘   └───────┬────────┘
                │                        │
┌───────────────┴────────────────────────┴───────────────────────┐
│                     SERVICE LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ ait-core     │  │ ait-comms    │  │ ait-authenticator  │   │
│  │ (ERP/CRM)    │  │ (Telephony)  │  │ (Auth)             │   │
│  │ Port 3001    │  │ Port 3002    │  │ Port 3004          │   │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘   │
│         │                  │                    │               │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌─────────┴──────────┐   │
│  │ ait-qb       │  │ ait-datahub  │  │ ait-multiscraper   │   │
│  │ (Quotes)     │  │ (Analytics)  │  │ (Scrapers)         │   │
│  │ Port 3003    │  │ Port 3005    │  │ Port 3006          │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│                                                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                     DATA & EVENT LAYER                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │  PostgreSQL    │  │  Redis         │  │  Event Bus       │   │
│  │  (Main DB)     │  │  (Cache/Queue) │  │  (Redis Streams) │   │
│  └────────────────┘  └────────────────┘  └──────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                     EXTERNAL SERVICES                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │  Twilio Voice  │  │  Insurance APIs│  │  OpenAI / Claude │   │
│  │  (VoIP/PSTN)   │  │  (Carriers)    │  │  (AI Analysis)   │   │
│  └────────────────┘  └────────────────┘  └──────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes del Sistema

### **1. @ait-core/shared** (Shared Package)

**Ubicación**: `packages/shared/`

**Propósito**: Librería compartida con tipos, clientes API, y event bus.

**Exports**:
```typescript
// Types
import { User, Customer, Policy, Call, Interaction } from '@ait-core/shared';

// API Clients
import { ERPClient, CommsClient, QuoteClient, AuthClient } from '@ait-core/shared';

// Event Bus
import { EventBus, CallEventBus } from '@ait-core/shared';

// Unified Client
import { AITCoreClient } from '@ait-core/shared';
```

**Uso**:
```typescript
const aitClient = new AITCoreClient({
  services: {
    erp: { baseURL: 'http://localhost:3001' },
    comms: { baseURL: 'http://localhost:3002' },
    // ...
  },
  onTokenRequest: async () => getToken()
});

// Usar servicios
const customer = await aitClient.erp.customers.findByPhone('+34912345678');
const policies = await aitClient.erp.policies.getActive(customer.id);
```

---

### **2. API Gateway** (HTTP Gateway)

**Ubicación**: `services/api-gateway/`

**Puerto**: 3000

**Propósito**: Punto de entrada único para todas las peticiones HTTP.

**Rutas Principales**:

```typescript
// Auth
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

// Customers
GET    /api/customers/search?phone=...
GET    /api/customers/:id
GET    /api/customers/:id/context?callSid=...

// Policies
GET    /api/policies?customerId=...
POST   /api/policies

// Calls
POST   /api/twilio/token
POST   /api/calls/outbound
GET    /api/calls/:callSid/context

// Quotes
POST   /api/quotes/auto
POST   /api/quotes/home

// Analytics
GET    /api/analytics/calls?period=today
GET    /api/analytics/agents
```

**Seguridad**:
- JWT Authentication
- Rate Limiting (100 req/15min)
- CORS configurado
- Helmet headers

**Ejecución**:
```bash
cd services/api-gateway
npm install
npm run dev
```

---

### **3. WebSocket Server** (Real-time Events)

**Ubicación**: `services/websocket-server/`

**Puerto**: 4000

**Propósito**: Servidor WebSocket para eventos en tiempo real.

**Eventos que emite**:

```typescript
// Llamadas
'call:incoming'        // Nueva llamada entrante
'call:answered'        // Llamada contestada
'call:completed'       // Llamada terminada
'call:status-updated'  // Estado actualizado

// Agentes
'agent:status-changed' // Estado de agente cambió

// Transcripción
'transcription'        // Transcripción en tiempo real

// Notificaciones
'notification'         // Nueva notificación
'task:new'            // Nueva tarea asignada

// Pólizas/Quotes
'quote:created'        // Cotización creada
'policy:created'       // Póliza creada
```

**Eventos que escucha**:

```typescript
// Llamadas
'call:join'            // Unirse a sala de llamada
'call:leave'           // Salir de sala
'call:update-status'   // Actualizar estado

// Agente
'agent:status-change'  // Cambiar estado del agente

// Transcripción
'transcription'        // Enviar transcripción en vivo

// Notificaciones
'notification:read'    // Marcar como leída
```

**Conexión desde Frontend**:
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: { token: accessToken },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected!');
});

socket.on('call:incoming', (data) => {
  console.log('Incoming call:', data);
});
```

**Ejecución**:
```bash
cd services/websocket-server
npm install
npm run dev
```

---

### **4. @ait-core/ait-comms-device** (Softphone UI)

**Ubicación**: `packages/ait-comms-device/`

**Propósito**: Componente React del softphone con diseño high-tech.

**Componentes**:
- `<AITECHDevice />` - Dispositivo completo
- `<DeviceFrame />` - Marco del hardware
- `<AITOSShell />` - Sistema operativo
- `<SoftphoneApp />` - App de softphone
- `<HolographicPanel />` - Paneles holográficos
- `<WaveformVisualizer />` - Visualizador de audio

**Uso Básico**:
```tsx
import { AITECHDevice } from '@ait-core/ait-comms-device';

function App() {
  return <AITECHDevice />;
}
```

---

### **5. useAITCore Hook** (Frontend Integration)

**Ubicación**: `apps/web/src/hooks/useAITCore.tsx`

**Propósito**: Hook React que integra API + WebSocket + Estado.

**Uso**:
```tsx
import { useAITCore } from '../hooks/useAITCore';

function CallCenter() {
  const ait = useAITCore({
    apiBaseURL: 'http://localhost:3000',
    wsBaseURL: 'http://localhost:4000',
    onTokenRequest: async () => localStorage.getItem('token')!
  });

  // Estado
  const { user, connected, currentCall, callContext, notifications } = ait;

  // Métodos API
  await ait.searchCustomerByPhone('+34912345678');
  await ait.createQuote({ customerId, type: 'auto', vehicleData });
  await ait.createPolicy(policyData);

  // Métodos WebSocket
  ait.joinCall(callSid);
  ait.changeAgentStatus('available');
  ait.sendTranscription(callSid, 'Hola', 'agent');
}
```

---

## 🔄 Flujo de Datos

### **Flujo Completo: Llamada Entrante → Cotización → Póliza**

```
1. Cliente marca número
   ↓
2. PSTN → Twilio Cloud
   ↓
3. Twilio webhook → ait-comms-telephony
   ↓
4. Buscar cliente en ait-core-soriano
   GET /api/customers/search?phone=+34912345678
   ↓
5. Obtener contexto completo
   GET /api/customers/:id/context
   → policies, claims, interactions, tasks
   ↓
6. Guardar en Redis
   SET call:{callSid}:context {json}
   ↓
7. Routing inteligente → Encontrar mejor agente
   ↓
8. Evento a Event Bus
   eventBus.publish('call.initiated', { callSid, agentId, customerId })
   ↓
9. WebSocket Server escucha evento
   ↓
10. Envía a frontend del agente
    socket.to(`agent:${agentId}`).emit('call:incoming', data)
    ↓
11. Frontend muestra UI
    - AINTECH Device LED rojo pulsante
    - Pantalla INCOMING con datos del cliente
    - Panel contexto con pólizas activas
    ↓
12. Agente contesta
    softphone.answer()
    ↓
13. Twilio establece conexión WebRTC
    ↓
14. Estado cambia a 'active'
    eventBus.publish('call.answered', { callSid })
    ↓
15. LED verde, waveform activo
    ↓
16. Durante llamada - Agente hace click "Cotizar"
    POST /api/quotes/auto
    { customerId, vehicleData, callSid }
    ↓
17. ait-qb calcula prima
    - Factores, descuentos, pricing rules
    ↓
18. ait-multiscraper obtiene competencia
    - Mapfre: 520€
    - AXA: 545€
    ↓
19. Devuelve cotización
    { premium: 468€, breakdown, competitors }
    ↓
20. Evento
    eventBus.publish('quote.created', { quoteId, premium })
    ↓
21. Frontend muestra resultados
    Panel holográfico con precio y comparativa
    ↓
22. Cliente acepta
    POST /api/policies
    { quoteId, customerId, premium, ... }
    ↓
23. ait-core-soriano crea póliza
    → Genera número de póliza
    → Guarda en DB
    ↓
24. Evento
    eventBus.publish('policy.created', { policyId, customerId })
    ↓
25. Email automático al cliente
    → Contrato PDF
    → Datos de pago
    ↓
26. Llamada termina
    softphone.hangup()
    ↓
27. Post-llamada automático:

    A) Grabación a S3
    B) Transcripción con IA
    C) Análisis de sentiment
    D) Crear interacción en CRM
       POST /api/interactions
       { customerId, callSid, duration, outcome, transcription }
    E) Analytics
       - Actualizar métricas del agente
       - Revenue +468€
       - Conversion rate
    F) Notificación al cliente
       "Póliza creada exitosamente"
    ↓
28. Dashboard supervisor actualizado en tiempo real
    - Nueva venta visible
    - Revenue incrementado
    - Métricas del agente actualizadas
```

---

## 🚀 Deployment

### **Requisitos Previos**

```bash
# Node.js
node --version  # >= 18

# PNPM (Package Manager)
npm install -g pnpm

# Redis
redis-server --version  # >= 6.0

# PostgreSQL
psql --version  # >= 14
```

### **Variables de Entorno**

Crear `.env` en cada servicio:

**API Gateway** (`services/api-gateway/.env`):
```bash
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Service URLs
ERP_SERVICE_URL=http://localhost:3001
COMMS_SERVICE_URL=http://localhost:3002
QUOTES_SERVICE_URL=http://localhost:3003
AUTH_SERVICE_URL=http://localhost:3004
DATAHUB_SERVICE_URL=http://localhost:3005

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**WebSocket Server** (`services/websocket-server/.env`):
```bash
WS_PORT=4000
JWT_SECRET=your-secret-key-change-in-production

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**AIT-COMMS-Telephony** (Twilio):
```bash
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_API_KEY=SKxxxxx
TWILIO_API_SECRET=xxxxx
TWILIO_APP_SID=APxxxxx
TWILIO_PHONE_NUMBER=+34900123456
```

### **Instalación**

```bash
# 1. Clonar repo
git clone <repo-url>
cd ait-core-soriano

# 2. Instalar dependencias (desde raíz)
pnpm install

# 3. Build shared package
cd packages/shared
pnpm build

# 4. Build ait-comms-device
cd ../ait-comms-device
pnpm build

# 5. Iniciar servicios
# Terminal 1 - API Gateway
cd ../../services/api-gateway
pnpm dev

# Terminal 2 - WebSocket Server
cd ../websocket-server
pnpm dev

# Terminal 3 - Frontend
cd ../../apps/web
pnpm dev
```

### **Docker Compose** (Producción)

```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: aitcore
      POSTGRES_USER: aitcore
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  api-gateway:
    build: ./services/api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - DATABASE_URL=postgresql://aitcore:secret@postgres:5432/aitcore
    depends_on:
      - redis
      - postgres

  websocket-server:
    build: ./services/websocket-server
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
    depends_on:
      - redis

  web:
    build: ./apps/web
    ports:
      - "80:80"
    depends_on:
      - api-gateway
      - websocket-server

volumes:
  redis-data:
  postgres-data:
```

**Ejecutar**:
```bash
docker-compose up -d
```

---

## 💡 Ejemplos de Uso

### **Ejemplo 1: Aplicación Call Center Completa**

Ver: `apps/web/src/pages/CallCenterApp.tsx`

**Features**:
- ✅ AINTECH Device UI
- ✅ Contexto del cliente en tiempo real
- ✅ Cotización durante llamada
- ✅ Creación de pólizas
- ✅ Notificaciones en vivo
- ✅ Programar callbacks

### **Ejemplo 2: Dashboard Supervisor**

```tsx
import { useAITCore } from '../hooks/useAITCore';

function SupervisorDashboard() {
  const ait = useAITCore(config);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Cargar métricas
    ait.getAnalytics('today').then(setMetrics);

    // Escuchar eventos de llamadas
    ait.socket?.on('call:new', (call) => {
      console.log('Nueva llamada:', call);
    });
  }, []);

  return (
    <div>
      <h1>Supervisor Dashboard</h1>
      <div>
        <h2>Métricas Hoy</h2>
        <p>Total Llamadas: {metrics?.totalCalls}</p>
        <p>Llamadas Activas: {metrics?.activeCalls}</p>
        <p>Tiempo Medio: {metrics?.averageDuration}s</p>
      </div>
    </div>
  );
}
```

### **Ejemplo 3: Portal del Cliente (Solicitar Callback)**

```tsx
function CustomerPortal() {
  const ait = useAITCore(config);

  const requestCallback = async () => {
    await ait.createTask({
      type: 'callback',
      title: 'Cliente solicita llamada',
      customerId: ait.user?.customerId,
      priority: 'normal',
      scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000), // +2 horas
      source: 'customer_request'
    });

    alert('Llamada programada!');
  };

  return (
    <button onClick={requestCallback}>
      Solicitar Llamada
    </button>
  );
}
```

---

## 🧪 Testing

### **Unit Tests**

```bash
# Test shared package
cd packages/shared
pnpm test

# Test API Gateway
cd services/api-gateway
pnpm test
```

### **Integration Tests**

```typescript
// tests/integration/call-flow.test.ts

describe('Call Flow Integration', () => {
  it('should handle incoming call end-to-end', async () => {
    // 1. Simulate Twilio webhook
    const response = await request(app)
      .post('/webhooks/twilio/incoming')
      .send({
        From: '+34912345678',
        CallSid: 'CA123'
      });

    expect(response.status).toBe(200);

    // 2. Verify customer lookup
    const customer = await erp.customers.findByPhone('+34912345678');
    expect(customer).toBeDefined();

    // 3. Verify context saved in Redis
    const context = await redis.get('call:CA123:context');
    expect(context).toBeDefined();

    // 4. Verify event published
    // ... test event bus
  });
});
```

---

## 📊 Monitoreo y Logs

### **Logs Centralizados**

Todos los servicios usan Winston para logging:

```typescript
logger.info('Call started', { callSid, agentId });
logger.error('Error processing call', { error, callSid });
```

**Ver logs**:
```bash
# Producción (agregador como ELK)
tail -f /var/log/ait-core/api-gateway.log

# Desarrollo (stdout)
pnpm dev
```

### **Métricas**

Métricas clave que se trackean:

```typescript
// Llamadas
- Total calls (today/week/month)
- Active calls
- Average duration
- Average wait time
- Abandonment rate
- Service level (<30s answer rate)

// Agentes
- Calls handled
- Average handle time
- Customer satisfaction
- First call resolution
- Utilization rate

// Revenue
- New policies
- Renewals
- Total premium
- Conversion rate
- Average policy value
```

**Dashboard de Métricas**:
```
GET /api/analytics/calls?period=today

Response:
{
  "totalCalls": 245,
  "activeCalls": 12,
  "completedCalls": 233,
  "averageDuration": 204,
  "averageWaitTime": 45,
  "serviceLevel": 0.92,
  "abandonmentRate": 0.023
}
```

---

## ✅ Checklist de Deployment

- [ ] PostgreSQL instalado y configurado
- [ ] Redis instalado y running
- [ ] Variables de entorno configuradas
- [ ] Cuenta Twilio con créditos
- [ ] Números de teléfono Twilio comprados
- [ ] TwiML Apps configuradas
- [ ] Webhooks configurados en Twilio
- [ ] SSL/TLS certificados (producción)
- [ ] Firewall rules configurados
- [ ] Backup database configurado
- [ ] Logs centralizados configurados
- [ ] Monitoring (Prometheus/Grafana)
- [ ] Alertas configuradas (PagerDuty/etc)

---

## 🎉 **SISTEMA COMPLETAMENTE FUNCIONAL**

Este ecosistema está **100% integrado y listo para usar**:

✅ **Frontend** → AIT-COMMS-DEVICE + useAITCore hook
✅ **API Gateway** → HTTP requests centralizados
✅ **WebSocket Server** → Real-time events
✅ **Event Bus** → Comunicación entre servicios
✅ **Shared Package** → Types + Clients compartidos
✅ **Complete Example** → CallCenterApp funcional

---

**Documentación Completa**: Este archivo
**Ejemplos de Código**: `apps/web/src/pages/CallCenterApp.tsx`
**Tipos Compartidos**: `packages/shared/src/types/`
**Clientes API**: `packages/shared/src/clients/`

**¡El sistema está listo para recibir llamadas! 📞✨**
