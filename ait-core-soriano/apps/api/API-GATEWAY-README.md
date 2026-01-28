# 🚪 AIT-API-GATEWAY - Unified Entry Point

**Version:** 1.0.0
**Port:** 3002
**Status:** ✅ READY

---

## 🎯 Purpose

The AIT-API-Gateway is the unified entry point for all microservices in the AIT-CORE ecosystem. It acts as a reverse proxy with intelligent routing, circuit breakers, health monitoring, and load balancing capabilities.

### Key Features

✅ **Intelligent Routing** - Routes requests to appropriate microservices based on path prefixes
✅ **Circuit Breaker** - Protects against cascading failures with automatic circuit breaking
✅ **Health Monitoring** - Continuous health checks of all downstream services
✅ **Request Forwarding** - Forwards headers, query params, and body seamlessly
✅ **Rate Limiting** - Prevents API abuse with configurable rate limits
✅ **CORS Handling** - Centralized CORS configuration for all services
✅ **Retry Logic** - Automatic retries with exponential backoff
✅ **Timeout Management** - Configurable timeouts per service
✅ **Observability** - Detailed logging and metrics collection

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    External Clients                         │
│   (soriano-web, soriano-ecliente, ain-tech-web, mobile)    │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/HTTPS
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                  AIT-API-GATEWAY (Port 3002)                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Features:                                           │  │
│  │  • CORS handling                                     │  │
│  │  • JWT validation                                    │  │
│  │  • Rate limiting                                     │  │
│  │  • Request routing                                   │  │
│  │  • Circuit breaker                                   │  │
│  │  • Health checks                                     │  │
│  │  • Logging & metrics                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Internal Network (ait-network)
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ↓               ↓               ↓
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ AI-PGC-     │ │ AI-         │ │ AI-         │
│ ENGINE      │ │ ACCOUNTANT  │ │ TREASURY    │
│ :3001       │ │ :3010       │ │ :3011       │
└─────────────┘ └─────────────┘ └─────────────┘

       ↓               ↓               ↓
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ AI-         │ │ AI-POLICY   │ │ AI-CLAIMS   │
│ BILLING     │ │ MANAGER     │ │ PROCESSOR   │
│ :3012       │ │ :3013       │ │ :3014       │
└─────────────┘ └─────────────┘ └─────────────┘
```

---

## 🔌 Service Routing

The gateway routes requests based on path prefixes:

| Path Prefix | Target Service | Port | Status |
|-------------|----------------|------|--------|
| `/api/v1/pgc-engine/*` | AI-PGC-ENGINE | 3001 | ✅ Active |
| `/api/v1/accountant/*` | AI-ACCOUNTANT | 3010 | 🔴 Pending |
| `/api/v1/treasury/*` | AI-TREASURY | 3011 | 🔴 Pending |
| `/api/v1/billing/*` | AI-BILLING | 3012 | 🔴 Pending |
| `/api/v1/policies/*` | AI-POLICY-MANAGER | 3013 | 🔴 Pending |
| `/api/v1/claims/*` | AI-CLAIMS-PROCESSOR | 3014 | 🔴 Pending |

### Routing Example

```
External Request:
GET http://localhost:3002/api/v1/pgc-engine/accounts/570

Gateway processes:
1. Validates JWT token (if present)
2. Checks rate limit
3. Identifies service: AI-PGC-ENGINE
4. Checks circuit breaker status
5. Forwards to: http://ai-pgc-engine:3001/api/v1/pgc-engine/accounts/570
6. Receives response
7. Returns to client with custom headers

Response Headers:
X-Gateway-Time: 45ms
X-Proxied-By: AIT-API-Gateway
```

---

## 🚀 Quick Start

### With Docker Compose

```bash
# Start all services including gateway
docker-compose up -d

# Check gateway status
curl http://localhost:3002/api/gateway/health

# View logs
docker-compose logs -f api-gateway
```

### Local Development

```bash
# Navigate to API directory
cd apps/api

# Install dependencies
npm install

# Copy environment file
cp .env.gateway .env

# Generate Prisma Client
npx prisma generate

# Start in dev mode
npm run start:dev
```

---

## 📡 API Endpoints

### Gateway Management

#### Health Check
```bash
GET /api/gateway/health

Response:
{
  "status": "healthy",
  "gateway": "AIT-API-Gateway",
  "version": "1.0.0",
  "timestamp": "2026-01-28T12:45:00Z",
  "services": [
    {
      "name": "AI-PGC-ENGINE",
      "healthy": true,
      "baseUrl": "http://ai-pgc-engine:3001"
    }
  ],
  "circuitBreakers": {
    "AI-PGC-ENGINE": {
      "failures": 0,
      "lastFailure": 0,
      "state": "CLOSED"
    }
  }
}
```

#### List Services
```bash
GET /api/gateway/services

Response:
{
  "services": [
    {
      "key": "pgc-engine",
      "name": "AI-PGC-ENGINE",
      "baseUrl": "http://ai-pgc-engine:3001",
      "enabled": true,
      "timeout": 30000,
      "circuitBreaker": {
        "enabled": true,
        "threshold": 5,
        "timeout": 60000
      }
    }
  ],
  "enabled": 1,
  "total": 6
}
```

### Proxied Endpoints

All requests to registered services are automatically proxied:

```bash
# AI-PGC-ENGINE
GET  /api/v1/pgc-engine/accounts
POST /api/v1/pgc-engine/classify
GET  /api/v1/pgc-engine/reports/balance

# AI-ACCOUNTANT (when implemented)
POST /api/v1/accountant/entries
GET  /api/v1/accountant/ledger

# AI-TREASURY (when implemented)
GET  /api/v1/treasury/cash-position
POST /api/v1/treasury/payment-batch

# AI-BILLING (when implemented)
POST /api/v1/billing/invoices
GET  /api/v1/billing/invoices/:id

# AI-POLICY-MANAGER (when implemented)
GET  /api/v1/policies
POST /api/v1/policies

# AI-CLAIMS-PROCESSOR (when implemented)
GET  /api/v1/claims
POST /api/v1/claims
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Server
PORT=3002
NODE_ENV=development
API_PREFIX=api

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,https://www.sorianomediadores.es

# JWT (if gateway-level auth is needed)
JWT_SECRET=ait-gateway-secret-2024
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Microservices URLs (Docker internal network)
PGC_ENGINE_URL=http://ai-pgc-engine:3001
ACCOUNTANT_URL=http://ai-accountant:3010
TREASURY_URL=http://ai-treasury:3011
BILLING_URL=http://ai-billing:3012
POLICY_MANAGER_URL=http://ai-policy-manager:3013
CLAIMS_PROCESSOR_URL=http://ai-claims-processor:3014

# Database
DATABASE_URL=postgresql://aitcore:aitcore2024@postgres:5432/soriano_core?schema=public

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Kafka
KAFKA_BROKERS=kafka:9092
KAFKA_CLIENT_ID=ait-api-gateway
KAFKA_GROUP_ID=ait-gateway-group

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/gateway.log
```

### Service Configuration

Edit `src/modules/proxy/proxy.config.ts` to add or modify services:

```typescript
export const PROXY_CONFIG: Record<string, ServiceConfig> = {
  'new-service': {
    name: 'NEW-SERVICE',
    baseUrl: process.env.NEW_SERVICE_URL || 'http://new-service:3015',
    enabled: true,
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
    },
    healthCheck: {
      enabled: true,
      endpoint: '/health',
      interval: 30000,
    },
  },
};

export const ROUTE_MAPPING: Record<string, string> = {
  '/new-service': 'new-service',
};
```

---

## 🔐 Security

### CORS Configuration

The gateway handles CORS centrally for all services:

```typescript
Allowed Origins:
- http://localhost:3000 (soriano-web dev)
- http://localhost:3001 (ai-pgc-engine dev)
- https://www.sorianomediadores.es (production)

Allowed Methods:
- GET, POST, PUT, PATCH, DELETE, OPTIONS

Allowed Headers:
- Authorization, Content-Type, X-API-Key, X-Request-ID, etc.

Credentials: true
Max Age: 24 hours
```

### JWT Validation

The gateway can optionally validate JWT tokens before forwarding requests:

```typescript
// If JWT validation is enabled at gateway level
Authorization: Bearer <token>

// Token is validated and forwarded to downstream services
```

### Rate Limiting

Default rate limiting:
- 100 requests per 60 seconds per IP
- Configurable per route
- Returns 429 Too Many Requests when exceeded

---

## 🛡️ Circuit Breaker

The gateway implements circuit breaker pattern to protect against cascading failures:

### States

**CLOSED** (Normal operation)
- All requests are forwarded
- Failures are counted
- Threshold: 5 failures

**OPEN** (Service unavailable)
- All requests fail immediately with 503
- No requests are forwarded
- Timeout: 60 seconds

**HALF_OPEN** (Testing recovery)
- Single test request is forwarded
- If successful → CLOSED
- If failed → OPEN

### Configuration

```typescript
circuitBreaker: {
  enabled: true,
  threshold: 5,      // Failures before opening
  timeout: 60000,    // ms to wait before retrying
}
```

---

## 📊 Monitoring

### Health Checks

The gateway continuously monitors downstream services:

```bash
# Check all services health
curl http://localhost:3002/api/gateway/health

# Response includes:
# - Gateway status
# - Individual service health
# - Circuit breaker states
# - Timestamp
```

### Metrics

Available metrics (Prometheus format):

```
http_requests_total
http_request_duration_seconds
http_errors_total
circuit_breaker_state
service_health_status
```

### Logging

All requests are logged with:
- Request ID
- Method and path
- Target service
- Duration
- Status code
- Error details (if any)

---

## 🧪 Testing

### Test Gateway Health

```bash
curl http://localhost:3002/api/gateway/health
```

### Test Service Routing

```bash
# Test AI-PGC-ENGINE routing
curl http://localhost:3002/api/v1/pgc-engine/accounts/570
```

### Test Circuit Breaker

```bash
# Stop AI-PGC-ENGINE
docker-compose stop ai-pgc-engine

# Make requests to trigger circuit breaker
for i in {1..6}; do
  curl http://localhost:3002/api/v1/pgc-engine/accounts/570
done

# Check circuit breaker state
curl http://localhost:3002/api/gateway/health
# Should show state: "OPEN"

# Wait 60 seconds and try again
sleep 60
curl http://localhost:3002/api/v1/pgc-engine/accounts/570
# Circuit breaker enters HALF_OPEN state

# Restart service
docker-compose start ai-pgc-engine

# Circuit breaker should close after successful request
```

---

## 📝 Adding New Services

To add a new microservice to the gateway:

1. **Add service configuration** in `proxy.config.ts`:
```typescript
'new-service': {
  name: 'NEW-SERVICE',
  baseUrl: process.env.NEW_SERVICE_URL || 'http://new-service:3015',
  enabled: true,
  timeout: 30000,
  retries: 3,
  circuitBreaker: {
    enabled: true,
    threshold: 5,
    timeout: 60000,
  },
  healthCheck: {
    enabled: true,
    endpoint: '/health',
    interval: 30000,
  },
},
```

2. **Add route mapping**:
```typescript
'/new-service': 'new-service',
```

3. **Add proxy handler** in `proxy.controller.ts`:
```typescript
@All('new-service/*')
@ApiOperation({ summary: 'Proxy to NEW-SERVICE' })
async proxyNewService(@Req() req: Request, @Res() res: Response) {
  return this.proxyRequest(req, res);
}
```

4. **Add environment variable**:
```bash
NEW_SERVICE_URL=http://new-service:3015
```

5. **Update docker-compose.yml**:
```yaml
environment:
  NEW_SERVICE_URL: http://new-service:3015
depends_on:
  - new-service
```

6. **Restart gateway**:
```bash
docker-compose restart api-gateway
```

---

## 🔧 Troubleshooting

### Gateway not starting

**Check:**
```bash
docker-compose logs api-gateway
```

**Common issues:**
- PostgreSQL not ready → Wait for healthy status
- Port 3002 already in use → Change port in docker-compose.yml
- Missing dependencies → Run `npm install` in apps/api

### Service routing not working

**Check:**
1. Service is running: `docker-compose ps`
2. Service is healthy: `curl http://localhost:3002/api/gateway/health`
3. Route mapping is correct in `proxy.config.ts`
4. CORS is configured: Check `CORS_ORIGIN` environment variable

### Circuit breaker stuck OPEN

**Solution:**
```bash
# Restart the downstream service
docker-compose restart ai-pgc-engine

# Wait for circuit breaker timeout (60 seconds)
# Gateway will automatically retry
```

---

## 📚 Related Documentation

- [AI-PGC-ENGINE Integration](../modules/01-core-business/ai-pgc-engine/INTEGRATION.md)
- [Arquitectura del Ecosistema](../../ARQUITECTURA-ECOSISTEMA-DEFINITIVA.md)
- [Master Plan](../../MASTER-PLAN-DEFINITIVO-ECOSISTEMA-AIT.md)

---

## 🎉 Summary

**AIT-API-Gateway is the central nervous system of the AIT-CORE ecosystem.**

It provides:
- ✅ Single entry point for all services
- ✅ Intelligent routing and load balancing
- ✅ Circuit breaker for resilience
- ✅ Health monitoring
- ✅ Security (CORS, rate limiting, JWT validation)
- ✅ Observability (logging, metrics)

**Next Steps:**
1. ✅ API Gateway created
2. ⏳ Connect soriano-ecliente frontend
3. ⏳ Implement remaining microservices

---

**Status:** ✅ PRODUCTION READY
**Port:** 3002
**Swagger Docs:** http://localhost:3002/api-docs
**Health Check:** http://localhost:3002/api/gateway/health
