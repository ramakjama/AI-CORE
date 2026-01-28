# AIT-CORE SORIANO - API Reference

**Version:** 1.0.0
**Last Updated:** 2026-01-28
**Base URL:** `https://api.sorianomediadores.es` (Production)
**Base URL:** `http://localhost:3000` (Development)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Conventions](#api-conventions)
4. [Core APIs](#core-apis)
5. [Module APIs](#module-apis)
6. [Agent APIs](#agent-apis)
7. [WebSocket APIs](#websocket-apis)
8. [Rate Limiting](#rate-limiting)
9. [Error Handling](#error-handling)
10. [SDK & Client Libraries](#sdk--client-libraries)

---

## Overview

The AIT-CORE SORIANO API is a RESTful API that provides access to all 57 modules and 16 AI agents.

### API Design Principles

- **RESTful**: Standard HTTP methods (GET, POST, PUT, PATCH, DELETE)
- **JSON**: All requests and responses use JSON
- **Versioned**: API versioning via URL path (`/api/v1`, `/api/v2`)
- **Stateless**: Each request contains all necessary information
- **Secure**: HTTPS only, JWT authentication
- **Paginated**: Large result sets are paginated
- **Documented**: OpenAPI/Swagger documentation available

### API Features

- Comprehensive REST API for all modules
- Real-time WebSocket support
- GraphQL API (coming Q2 2026)
- Webhook support for async events
- Batch operations
- Bulk import/export
- API versioning without breaking changes

### Base URLs

| Environment | URL | Description |
|-------------|-----|-------------|
| Production | `https://api.sorianomediadores.es` | Live production API |
| Staging | `https://api-staging.sorianomediadores.es` | Staging environment |
| Development | `http://localhost:3000` | Local development |

### API Documentation

- **Swagger UI**: `{BASE_URL}/api/docs`
- **OpenAPI Spec**: `{BASE_URL}/api/docs/json`
- **Redoc**: `{BASE_URL}/api/redoc`

---

## Authentication

### Overview

All API requests (except public endpoints) require authentication using JSON Web Tokens (JWT).

### Authentication Flow

```
1. User Login → POST /api/v1/auth/login
   ↓
2. Server responds with access_token + refresh_token
   ↓
3. Client stores tokens securely
   ↓
4. Client includes access_token in Authorization header
   ↓
5. When access_token expires, use refresh_token
   ↓
6. Refresh → POST /api/v1/auth/refresh
```

### Login Request

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-secure-password"
}
```

### Login Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "admin",
      "permissions": ["read", "write", "delete"]
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 3600,
      "token_type": "Bearer"
    }
  }
}
```

### Using the Access Token

Include the access token in the `Authorization` header:

```http
GET /api/v1/modules
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Refresh Token

When the access token expires (1 hour), use the refresh token:

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Multi-Factor Authentication (MFA)

If MFA is enabled for the account:

```http
POST /api/v1/auth/mfa/verify
Content-Type: application/json
Authorization: Bearer {temp_token}

{
  "code": "123456"
}
```

### OAuth 2.0 / SSO

For OAuth 2.0 and enterprise SSO:

```http
GET /api/v1/auth/oauth/google
GET /api/v1/auth/oauth/microsoft
GET /api/v1/auth/saml/login
```

---

## API Conventions

### Request Format

All requests use JSON:

```http
POST /api/v1/resource
Content-Type: application/json
Authorization: Bearer {token}

{
  "field1": "value1",
  "field2": 123,
  "nested": {
    "field3": true
  }
}
```

### Response Format

All responses follow a consistent structure:

**Success Response**:
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "metadata": {
    "timestamp": "2026-01-28T10:00:00Z",
    "requestId": "req_abc123",
    "processingTime": 42
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "metadata": {
    "timestamp": "2026-01-28T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Pagination

For endpoints that return lists:

**Request**:
```http
GET /api/v1/resource?page=1&limit=20&sort=created_at&order=desc
```

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

### Filtering

Use query parameters for filtering:

```http
GET /api/v1/policies?status=active&type=vida&created_after=2026-01-01
```

### Sorting

```http
GET /api/v1/policies?sort=created_at&order=desc
GET /api/v1/policies?sort=premium&order=asc
```

### Field Selection

Request only specific fields:

```http
GET /api/v1/policies?fields=id,number,premium,status
```

### Date/Time Format

All dates use ISO 8601 format:

```
2026-01-28T10:00:00Z        # UTC
2026-01-28T11:00:00+01:00   # With timezone
```

---

## Core APIs

### Health Check

Check API health status:

```http
GET /api/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-28T10:00:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "kafka": "healthy"
  }
}
```

### System Information

```http
GET /api/info
```

**Response**:
```json
{
  "version": "1.0.0",
  "environment": "production",
  "region": "eu-west-1",
  "modules": 57,
  "agents": 16
}
```

---

## Module APIs

### List All Modules

```http
GET /api/v1/modules
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "modules": [
      {
        "id": "ai-accountant",
        "name": "AI Accountant",
        "category": "core-business",
        "enabled": true,
        "status": "healthy",
        "version": "1.0.0"
      },
      // ... more modules
    ]
  }
}
```

### Get Module Details

```http
GET /api/v1/modules/{moduleId}
Authorization: Bearer {token}
```

### Enable/Disable Module

```http
POST /api/v1/modules/{moduleId}/enable
POST /api/v1/modules/{moduleId}/disable
Authorization: Bearer {token}
```

### Module Health Check

```http
GET /api/v1/modules/{moduleId}/health
Authorization: Bearer {token}
```

---

## Module-Specific APIs

### AI-ACCOUNTANT

**Create Accounting Entry**:
```http
POST /api/v1/accounting/entries
Authorization: Bearer {token}
Content-Type: application/json

{
  "date": "2026-01-28",
  "description": "Payment to supplier",
  "entries": [
    { "account": "600", "debit": 1000, "credit": 0 },
    { "account": "572", "debit": 0, "credit": 1000 }
  ]
}
```

**Get Balance Sheet**:
```http
GET /api/v1/accounting/balance-sheet?date=2026-01-28
Authorization: Bearer {token}
```

### AI-CRM

**Create Contact**:
```http
POST /api/v1/crm/contacts
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+34 600 123 456",
  "company": "Acme Corp",
  "type": "prospect"
}
```

**List Contacts**:
```http
GET /api/v1/crm/contacts?page=1&limit=20&type=customer
Authorization: Bearer {token}
```

### Insurance Modules

**Create Quote (Generic Pattern)**:
```http
POST /api/v1/insurance/{type}/quotes
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "cust_abc123",
  "productId": "prod_vida_001",
  "coverageAmount": 100000,
  "term": 20,
  "applicantData": {
    "age": 35,
    "gender": "male",
    "smoker": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "quoteId": "quote_xyz789",
    "premium": {
      "annual": 450.00,
      "monthly": 37.50
    },
    "coverage": 100000,
    "validUntil": "2026-02-28",
    "terms": "..."
  }
}
```

**Create Policy**:
```http
POST /api/v1/insurance/{type}/policies
Authorization: Bearer {token}
Content-Type: application/json

{
  "quoteId": "quote_xyz789",
  "paymentMethod": "bank_transfer",
  "frequency": "monthly",
  "startDate": "2026-02-01"
}
```

### AI-MARKETING

**Create Campaign**:
```http
POST /api/v1/marketing/campaigns
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Summer Promotion",
  "type": "email",
  "segmentId": "seg_abc123",
  "schedule": "2026-06-01T09:00:00Z",
  "content": {
    "subject": "Special Summer Offer",
    "body": "...",
    "cta": "Learn More"
  }
}
```

**Get Campaign Analytics**:
```http
GET /api/v1/marketing/campaigns/{campaignId}/analytics
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sent": 10000,
    "delivered": 9800,
    "opened": 2450,
    "clicked": 490,
    "converted": 98,
    "openRate": 0.25,
    "clickRate": 0.20,
    "conversionRate": 0.20,
    "revenue": 24500.00,
    "roi": 4.9
  }
}
```

---

## Agent APIs

### List All Agents

```http
GET /api/v1/agents
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "insurance-specialist",
        "name": "Insurance Specialist",
        "type": "specialist",
        "status": "active",
        "capabilities": ["analysis", "recommendation", "validation"]
      },
      // ... more agents
    ]
  }
}
```

### Consult Specialist Agent

**Analyze**:
```http
POST /api/v1/agents/{agentId}/analyze
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "Analyze the risk profile of this client",
  "context": {
    "clientAge": 45,
    "occupation": "office worker",
    "healthStatus": "good",
    "lifestyle": "sedentary"
  },
  "options": {
    "depth": "deep",
    "includeReferences": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": "Client presents a low to medium risk profile...",
    "findings": [
      {
        "title": "Age Factor",
        "description": "At 45, client is in a moderate risk category",
        "importance": "medium"
      }
    ],
    "insights": [
      "Sedentary lifestyle increases cardiovascular risk",
      "Office work suggests stable income"
    ],
    "risks": [
      {
        "description": "Sedentary lifestyle health risks",
        "severity": "medium",
        "mitigation": "Recommend wellness program discount"
      }
    ]
  },
  "metadata": {
    "agentId": "insurance-specialist",
    "processingTime": 1200,
    "tokensUsed": 2341,
    "confidence": 0.87
  }
}
```

**Recommend**:
```http
POST /api/v1/agents/{agentId}/recommend
Authorization: Bearer {token}
Content-Type: application/json

{
  "situation": "Client needs life insurance for mortgage protection",
  "context": {
    "mortgageAmount": 200000,
    "mortgageTerm": 25,
    "age": 35,
    "income": 50000,
    "dependents": 2
  },
  "constraints": ["budget < 100/month"],
  "objectives": ["full mortgage coverage", "affordable premium"]
}
```

**Answer**:
```http
POST /api/v1/agents/{agentId}/answer
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "What is the difference between term and whole life insurance?"
}
```

**Validate**:
```http
POST /api/v1/agents/{agentId}/validate
Authorization: Bearer {token}
Content-Type: application/json

{
  "proposal": {
    "type": "term_life",
    "coverage": 500000,
    "term": 30,
    "premium": 45
  }
}
```

### Consult Executor Agent

**Execute Task**:
```http
POST /api/v1/agents/{agentId}/execute
Authorization: Bearer {token}
Content-Type: application/json

{
  "taskType": "approve_policy",
  "description": "Review and approve policy application",
  "params": {
    "applicationId": "app_abc123",
    "policyType": "vida",
    "amount": 100000
  },
  "priority": "high"
}
```

**Make Decision**:
```http
POST /api/v1/agents/{agentId}/decide
Authorization: Bearer {token}
Content-Type: application/json

{
  "situation": "Choose marketing automation platform",
  "options": [
    {
      "id": "option-1",
      "description": "HubSpot",
      "pros": ["All-in-one", "Scalable"],
      "cons": ["Expensive"],
      "estimatedImpact": { "cost": 100000 }
    },
    {
      "id": "option-2",
      "description": "Build custom",
      "pros": ["Tailored"],
      "cons": ["Time-consuming"],
      "estimatedImpact": { "cost": 80000 }
    }
  ],
  "context": { "budget": 150000, "timeline": "6 months" }
}
```

**Coordinate Agents**:
```http
POST /api/v1/agents/{agentId}/coordinate
Authorization: Bearer {token}
Content-Type: application/json

{
  "goal": "Launch cyber insurance product",
  "involvedAgents": ["insurance-specialist", "finance-specialist", "cfo-agent"],
  "timeline": {
    "start": "2026-02-01",
    "end": "2026-08-01"
  }
}
```

---

## WebSocket APIs

### Connect to WebSocket

```javascript
const ws = new WebSocket('wss://api.sorianomediadores.es/ws');

// Authenticate
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};

// Subscribe to events
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['module-events', 'agent-events', 'notifications']
}));

// Receive messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message);
};
```

### WebSocket Message Types

**Authentication**:
```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Subscribe**:
```json
{
  "type": "subscribe",
  "channels": ["module-events", "agent-events"]
}
```

**Real-time Notification**:
```json
{
  "type": "notification",
  "channel": "module-events",
  "event": "policy.created",
  "data": {
    "policyId": "pol_abc123",
    "type": "vida",
    "premium": 450.00
  },
  "timestamp": "2026-01-28T10:00:00Z"
}
```

---

## Rate Limiting

### Rate Limit Headers

All responses include rate limit headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1706436000
```

### Rate Limits by Plan

| Plan | Requests/Hour | Concurrent |
|------|---------------|------------|
| Free | 100 | 5 |
| Standard | 1,000 | 10 |
| Pro | 10,000 | 50 |
| Enterprise | Unlimited | Unlimited |

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retryAfter": 60
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 204 | No Content | Success, no content returned |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field": "email",
      "reason": "Invalid email format",
      "expected": "email format",
      "received": "plain text"
    }
  },
  "metadata": {
    "timestamp": "2026-01-28T10:00:00Z",
    "requestId": "req_abc123",
    "documentation": "https://docs.sorianomediadores.es/errors/VALIDATION_ERROR"
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| AUTH_001 | Invalid credentials |
| AUTH_002 | Token expired |
| AUTH_003 | Invalid token |
| AUTH_004 | MFA required |
| VALIDATION_001 | Missing required field |
| VALIDATION_002 | Invalid format |
| VALIDATION_003 | Value out of range |
| RESOURCE_001 | Resource not found |
| RESOURCE_002 | Resource already exists |
| PERMISSION_001 | Insufficient permissions |
| RATE_LIMIT_001 | Rate limit exceeded |
| SERVER_001 | Internal server error |
| SERVER_002 | Service unavailable |

---

## SDK & Client Libraries

### Official SDKs

**JavaScript/TypeScript**:
```bash
npm install @ait-core/sdk
```

```typescript
import { AITCoreClient } from '@ait-core/sdk';

const client = new AITCoreClient({
  baseUrl: 'https://api.sorianomediadores.es',
  apiKey: 'your-api-key'
});

// Use modules
const contacts = await client.crm.contacts.list();
const quote = await client.insurance.vida.createQuote({ ... });

// Use agents
const analysis = await client.agents.insuranceSpecialist.analyze({ ... });
```

**Python**:
```bash
pip install ait-core-sdk
```

```python
from ait_core import AITCoreClient

client = AITCoreClient(
    base_url='https://api.sorianomediadores.es',
    api_key='your-api-key'
)

# Use modules
contacts = client.crm.contacts.list()
quote = client.insurance.vida.create_quote(...)

# Use agents
analysis = client.agents.insurance_specialist.analyze(...)
```

### API Client Example (Raw HTTP)

```typescript
// Base client
class AITCoreAPI {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async request(method, path, data = null) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    return response.json();
  }

  get(path) {
    return this.request('GET', path);
  }

  post(path, data) {
    return this.request('POST', path, data);
  }

  put(path, data) {
    return this.request('PUT', path, data);
  }

  delete(path) {
    return this.request('DELETE', path);
  }
}

// Usage
const api = new AITCoreAPI('https://api.sorianomediadores.es', 'your-token');
const contacts = await api.get('/api/v1/crm/contacts');
```

---

## Webhooks

### Create Webhook

```http
POST /api/v1/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://yourapp.com/webhook",
  "events": ["policy.created", "policy.updated", "claim.submitted"],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload

```json
{
  "id": "evt_abc123",
  "type": "policy.created",
  "data": {
    "policyId": "pol_xyz789",
    "type": "vida",
    "premium": 450.00
  },
  "timestamp": "2026-01-28T10:00:00Z",
  "signature": "sha256=..."
}
```

### Verify Webhook Signature

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return `sha256=${expectedSignature}` === signature;
}
```

---

## Batch Operations

### Batch Create

```http
POST /api/v1/crm/contacts/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "contacts": [
    { "name": "John Doe", "email": "john@example.com" },
    { "name": "Jane Smith", "email": "jane@example.com" }
  ]
}
```

### Batch Update

```http
PUT /api/v1/policies/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "updates": [
    { "id": "pol_1", "status": "active" },
    { "id": "pol_2", "status": "cancelled" }
  ]
}
```

---

## Export/Import

### Export Data

```http
POST /api/v1/export
Authorization: Bearer {token}
Content-Type: application/json

{
  "resource": "policies",
  "format": "csv",
  "filters": {
    "status": "active",
    "created_after": "2026-01-01"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "exportId": "exp_abc123",
    "status": "processing",
    "downloadUrl": null
  }
}
```

### Check Export Status

```http
GET /api/v1/export/{exportId}
Authorization: Bearer {token}
```

### Import Data

```http
POST /api/v1/import
Authorization: Bearer {token}
Content-Type: multipart/form-data

file=@data.csv
```

---

**Document Version:** 1.0.0
**Author:** AIN TECH API Team
**Last Updated:** 2026-01-28
**Interactive Docs:** https://api.sorianomediadores.es/api/docs
