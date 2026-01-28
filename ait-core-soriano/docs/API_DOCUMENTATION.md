# AIT-CORE API Documentation

**Version 1.0.0** | **Base URL:** `https://api.sorianomediadores.es/api/v1`

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Authentication](#2-authentication)
3. [Rate Limiting](#3-rate-limiting)
4. [Pagination](#4-pagination)
5. [Error Handling](#5-error-handling)
6. [API Endpoints](#6-api-endpoints)
   - [Authentication](#authentication-endpoints)
   - [Users](#user-endpoints)
   - [Policies](#policy-endpoints)
   - [Claims](#claim-endpoints)
   - [Clients](#client-endpoints)
   - [Payments](#payment-endpoints)
   - [Documents](#document-endpoints)
   - [Reports](#report-endpoints)
   - [Modules](#module-endpoints)
   - [AI Agents](#ai-agent-endpoints)
7. [Webhooks](#7-webhooks)
8. [SDKs](#8-sdks)
9. [Postman Collection](#9-postman-collection)

---

## 1. Introduction

The AIT-CORE API is a RESTful API that allows you to programmatically access and manage all aspects of the insurance management platform.

### Base URL

```
Production: https://api.sorianomediadores.es/api/v1
Staging:    https://staging-api.sorianomediadores.es/api/v1
```

### API Versioning

The API version is specified in the URL path (e.g., `/api/v1/`). When breaking changes are introduced, a new version will be released.

### Content Type

All requests must include:
```
Content-Type: application/json
Accept: application/json
```

### Date Format

All dates follow ISO 8601 format:
```
2024-01-28T14:30:00Z
```

---

## 2. Authentication

### Overview

AIT-CORE API uses JWT (JSON Web Tokens) for authentication. OAuth2 is also supported for third-party integrations.

### Authentication Flow

#### 1. Obtain Access Token

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "YourSecurePassword123!",
  "mfa_code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "agent"
    }
  }
}
```

#### 2. Use Access Token

Include the token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 3. Refresh Token

**Endpoint:** `POST /auth/refresh`

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

### OAuth2 Authentication

For third-party integrations:

**Authorization URL:**
```
https://api.sorianomediadores.es/oauth/authorize
```

**Token URL:**
```
https://api.sorianomediadores.es/oauth/token
```

**Supported Grant Types:**
- Authorization Code
- Client Credentials
- Refresh Token

**Scopes:**
```
read:policies     - Read policy data
write:policies    - Create/update policies
read:claims       - Read claim data
write:claims      - Create/update claims
read:clients      - Read client data
write:clients     - Create/update clients
read:reports      - Access reports
admin            - Full administrative access
```

---

## 3. Rate Limiting

### Rate Limits

| Tier | Requests per Hour | Burst |
|------|-------------------|-------|
| **Free** | 100 | 10 |
| **Standard** | 1,000 | 50 |
| **Pro** | 10,000 | 200 |
| **Enterprise** | 100,000 | 1,000 |

### Rate Limit Headers

Every API response includes rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1643040000
```

### Rate Limit Exceeded

**Status Code:** `429 Too Many Requests`

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again in 3600 seconds.",
    "retry_after": 3600
  }
}
```

### Best Practices

1. **Cache responses** when possible
2. **Implement exponential backoff** for retries
3. **Monitor rate limit headers** to avoid hitting limits
4. **Use webhooks** instead of polling for real-time updates

---

## 4. Pagination

### Query Parameters

```
?page=1              # Page number (default: 1)
&limit=50            # Items per page (default: 50, max: 100)
&sort=created_at     # Sort field
&order=desc          # Sort order (asc/desc)
```

### Example Request

```bash
GET /api/v1/policies?page=2&limit=25&sort=premium&order=desc
```

### Response Format

```json
{
  "success": true,
  "data": [
    { /* policy object */ },
    { /* policy object */ }
  ],
  "pagination": {
    "page": 2,
    "limit": 25,
    "total_items": 1234,
    "total_pages": 50,
    "has_next": true,
    "has_prev": true,
    "next_page": 3,
    "prev_page": 1
  },
  "links": {
    "first": "/api/v1/policies?page=1&limit=25",
    "prev": "/api/v1/policies?page=1&limit=25",
    "next": "/api/v1/policies?page=3&limit=25",
    "last": "/api/v1/policies?page=50&limit=25"
  }
}
```

### Cursor-Based Pagination

For large datasets, use cursor-based pagination:

```bash
GET /api/v1/policies?cursor=eyJpZCI6MTIzNH0&limit=50
```

```json
{
  "success": true,
  "data": [ /* items */ ],
  "cursor": {
    "next": "eyJpZCI6MTI4NH0",
    "has_more": true
  }
}
```

---

## 5. Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "request_id": "req_abc123xyz",
    "documentation_url": "https://docs.aintech.es/errors/validation-error"
  }
}
```

### HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| **200** | OK | Request successful |
| **201** | Created | Resource created successfully |
| **204** | No Content | Request successful, no content to return |
| **400** | Bad Request | Invalid request parameters |
| **401** | Unauthorized | Authentication required or failed |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource not found |
| **409** | Conflict | Resource conflict (e.g., duplicate) |
| **422** | Unprocessable Entity | Validation error |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server error |
| **503** | Service Unavailable | Service temporarily unavailable |

### Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_REQUIRED` | Authentication token missing |
| `INVALID_TOKEN` | Token is invalid or expired |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `VALIDATION_ERROR` | Input validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Unexpected server error |
| `SERVICE_UNAVAILABLE` | Service temporarily down |
| `PAYMENT_FAILED` | Payment processing failed |
| `EXTERNAL_API_ERROR` | Third-party API error |

---

## 6. API Endpoints

### Authentication Endpoints

#### Login

```http
POST /auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "mfa_code": "123456"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

#### Logout

```http
POST /auth/logout
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:** `204 No Content`

#### Refresh Token

```http
POST /auth/refresh
```

**Request:**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "expires_in": 3600
  }
}
```

#### Request Password Reset

```http
POST /auth/password/reset-request
```

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### Reset Password

```http
POST /auth/password/reset
```

**Request:**
```json
{
  "token": "reset_token_from_email",
  "new_password": "NewSecurePassword123!"
}
```

**Response:** `200 OK`

---

### User Endpoints

#### Get Current User

```http
GET /users/me
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "role": "agent",
    "department": "sales",
    "phone": "+34600123456",
    "avatar_url": "https://cdn.example.com/avatars/abc123.jpg",
    "created_at": "2024-01-15T10:30:00Z",
    "last_login": "2024-01-28T14:30:00Z",
    "preferences": {
      "language": "es",
      "timezone": "Europe/Madrid",
      "theme": "light",
      "notifications": {
        "email": true,
        "push": true,
        "sms": false
      }
    }
  }
}
```

#### Update Current User

```http
PATCH /users/me
```

**Request:**
```json
{
  "name": "John Doe",
  "phone": "+34600123456",
  "preferences": {
    "language": "es",
    "theme": "dark"
  }
}
```

**Response:** `200 OK`

#### List Users (Admin)

```http
GET /users
```

**Query Parameters:**
```
?role=agent
&department=sales
&status=active
&search=john
&page=1
&limit=50
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "usr_abc123",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "role": "agent",
      "department": "sales",
      "status": "active"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

#### Create User (Admin)

```http
POST /users
```

**Request:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "role": "agent",
  "department": "sales",
  "password": "TempPassword123!",
  "force_password_change": true
}
```

**Response:** `201 Created`

---

### Policy Endpoints

#### List Policies

```http
GET /policies
```

**Query Parameters:**
```
?status=active|pending|cancelled|expired
&type=auto|home|life|health
&client_id=clt_abc123
&agent_id=usr_abc123
&expiring_within_days=30
&created_after=2024-01-01
&created_before=2024-12-31
&min_premium=100
&max_premium=1000
&search=ABC123
&page=1
&limit=50
&sort=created_at
&order=desc
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "pol_abc123",
      "policy_number": "AUT-2024-001234",
      "type": "auto",
      "status": "active",
      "client": {
        "id": "clt_xyz789",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "coverage": {
        "liability": 50000,
        "collision": 30000,
        "comprehensive": 20000,
        "deductible": 500
      },
      "premium": {
        "amount": 450.00,
        "currency": "EUR",
        "frequency": "annual"
      },
      "effective_date": "2024-01-01T00:00:00Z",
      "expiration_date": "2024-12-31T23:59:59Z",
      "agent": {
        "id": "usr_agent1",
        "name": "Maria Garcia"
      },
      "created_at": "2023-12-15T10:30:00Z",
      "updated_at": "2024-01-28T14:30:00Z"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

#### Get Policy

```http
GET /policies/{policy_id}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "pol_abc123",
    "policy_number": "AUT-2024-001234",
    "type": "auto",
    "status": "active",
    "client": {
      "id": "clt_xyz789",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+34600123456"
    },
    "vehicle": {
      "make": "Toyota",
      "model": "Camry",
      "year": 2022,
      "vin": "1HGCM82633A123456",
      "license_plate": "ABC1234"
    },
    "coverage": {
      "liability": 50000,
      "collision": 30000,
      "comprehensive": 20000,
      "deductible": 500,
      "coverages": [
        {
          "type": "liability",
          "limit": 50000,
          "description": "Third party liability coverage"
        }
      ]
    },
    "premium": {
      "amount": 450.00,
      "currency": "EUR",
      "frequency": "annual",
      "payment_plan": "annual",
      "next_payment_date": "2025-01-01T00:00:00Z",
      "payment_method": "direct_debit"
    },
    "effective_date": "2024-01-01T00:00:00Z",
    "expiration_date": "2024-12-31T23:59:59Z",
    "agent": {
      "id": "usr_agent1",
      "name": "Maria Garcia",
      "email": "maria@soriano.es"
    },
    "documents": [
      {
        "id": "doc_123",
        "type": "policy_document",
        "name": "Policy Certificate.pdf",
        "url": "https://cdn.example.com/docs/policy_123.pdf",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "history": [
      {
        "id": "hist_1",
        "action": "created",
        "timestamp": "2024-01-01T00:00:00Z",
        "user": "usr_agent1"
      },
      {
        "id": "hist_2",
        "action": "payment_received",
        "timestamp": "2024-01-02T10:00:00Z",
        "user": "system"
      }
    ],
    "created_at": "2023-12-15T10:30:00Z",
    "updated_at": "2024-01-28T14:30:00Z"
  }
}
```

#### Create Policy

```http
POST /policies
```

**Request:**
```json
{
  "type": "auto",
  "client_id": "clt_xyz789",
  "vehicle": {
    "make": "Toyota",
    "model": "Camry",
    "year": 2022,
    "vin": "1HGCM82633A123456",
    "license_plate": "ABC1234"
  },
  "coverage": {
    "liability": 50000,
    "collision": 30000,
    "comprehensive": 20000,
    "deductible": 500
  },
  "premium": {
    "amount": 450.00,
    "frequency": "annual"
  },
  "effective_date": "2024-02-01T00:00:00Z",
  "expiration_date": "2025-01-31T23:59:59Z",
  "payment_method": "direct_debit"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "pol_new123",
    "policy_number": "AUT-2024-001235",
    /* full policy object */
  }
}
```

#### Update Policy

```http
PATCH /policies/{policy_id}
```

**Request:**
```json
{
  "coverage": {
    "deductible": 1000
  },
  "premium": {
    "amount": 400.00
  }
}
```

**Response:** `200 OK`

**Note:** Updates create a new policy version for audit purposes.

#### Cancel Policy

```http
POST /policies/{policy_id}/cancel
```

**Request:**
```json
{
  "reason": "client_request",
  "effective_date": "2024-02-01T00:00:00Z",
  "refund_amount": 225.00,
  "notes": "Client sold vehicle"
}
```

**Response:** `200 OK`

#### Renew Policy

```http
POST /policies/{policy_id}/renew
```

**Request:**
```json
{
  "premium": {
    "amount": 475.00
  },
  "effective_date": "2025-01-01T00:00:00Z",
  "changes": {
    "coverage": {
      "deductible": 750
    }
  }
}
```

**Response:** `201 Created`

#### Calculate Premium

```http
POST /policies/calculate-premium
```

**Request:**
```json
{
  "type": "auto",
  "client": {
    "age": 35,
    "driving_history": "clean",
    "claims_history": 0
  },
  "vehicle": {
    "make": "Toyota",
    "model": "Camry",
    "year": 2022,
    "value": 25000
  },
  "coverage": {
    "liability": 50000,
    "collision": 30000,
    "comprehensive": 20000,
    "deductible": 500
  },
  "location": {
    "zip_code": "28013",
    "city": "Madrid"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "premium": {
      "base_premium": 420.00,
      "risk_adjustment": 15.00,
      "discounts": -10.00,
      "taxes": 25.00,
      "total": 450.00,
      "currency": "EUR"
    },
    "breakdown": [
      {
        "component": "base_premium",
        "amount": 420.00,
        "description": "Base coverage cost"
      },
      {
        "component": "risk_factor",
        "amount": 15.00,
        "description": "Location risk adjustment"
      },
      {
        "component": "safe_driver_discount",
        "amount": -10.00,
        "description": "Clean driving record discount"
      },
      {
        "component": "tax",
        "amount": 25.00,
        "description": "Insurance tax"
      }
    ],
    "risk_score": 45,
    "recommendation": "approved",
    "confidence": 0.92
  }
}
```

---

### Claim Endpoints

#### List Claims

```http
GET /claims
```

**Query Parameters:**
```
?status=new|review|investigation|approved|denied|paid|closed
&type=accident|theft|damage|injury
&policy_id=pol_abc123
&client_id=clt_xyz789
&date_from=2024-01-01
&date_to=2024-12-31
&min_amount=100
&max_amount=10000
&page=1
&limit=50
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "clm_abc123",
      "claim_number": "CLM-2024-001234",
      "status": "under_review",
      "type": "accident",
      "policy": {
        "id": "pol_xyz789",
        "policy_number": "AUT-2024-001234"
      },
      "client": {
        "id": "clt_def456",
        "name": "John Doe"
      },
      "incident_date": "2024-01-25T14:30:00Z",
      "reported_date": "2024-01-25T16:00:00Z",
      "estimated_loss": 5000.00,
      "approved_amount": null,
      "paid_amount": null,
      "adjuster": {
        "id": "usr_adj1",
        "name": "Carlos Ruiz"
      },
      "created_at": "2024-01-25T16:00:00Z",
      "updated_at": "2024-01-28T10:00:00Z"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

#### Get Claim

```http
GET /claims/{claim_id}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "clm_abc123",
    "claim_number": "CLM-2024-001234",
    "status": "under_review",
    "type": "accident",
    "policy": {
      "id": "pol_xyz789",
      "policy_number": "AUT-2024-001234",
      "type": "auto"
    },
    "client": {
      "id": "clt_def456",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+34600123456"
    },
    "incident": {
      "date": "2024-01-25T14:30:00Z",
      "location": {
        "address": "Calle Mayor 15, Madrid",
        "coordinates": {
          "lat": 40.4168,
          "lng": -3.7038
        }
      },
      "description": "Rear-end collision at intersection",
      "police_report": "POL-2024-12345"
    },
    "estimated_loss": 5000.00,
    "approved_amount": null,
    "paid_amount": null,
    "adjuster": {
      "id": "usr_adj1",
      "name": "Carlos Ruiz",
      "email": "carlos@soriano.es"
    },
    "documents": [
      {
        "id": "doc_123",
        "type": "photo",
        "name": "damage_front.jpg",
        "url": "https://cdn.example.com/claims/clm_abc123/damage_front.jpg",
        "uploaded_at": "2024-01-25T16:10:00Z"
      }
    ],
    "timeline": [
      {
        "id": "evt_1",
        "event": "claim_submitted",
        "timestamp": "2024-01-25T16:00:00Z",
        "user": "clt_def456",
        "notes": "Claim submitted via mobile app"
      },
      {
        "id": "evt_2",
        "event": "adjuster_assigned",
        "timestamp": "2024-01-25T16:30:00Z",
        "user": "system",
        "notes": "Assigned to Carlos Ruiz"
      }
    ],
    "ai_analysis": {
      "fraud_score": 12,
      "confidence": 0.95,
      "recommendation": "approve",
      "similar_claims": 5,
      "estimated_processing_days": 7
    },
    "created_at": "2024-01-25T16:00:00Z",
    "updated_at": "2024-01-28T10:00:00Z"
  }
}
```

#### Submit Claim

```http
POST /claims
```

**Request:**
```json
{
  "policy_id": "pol_xyz789",
  "type": "accident",
  "incident": {
    "date": "2024-01-25T14:30:00Z",
    "location": {
      "address": "Calle Mayor 15, Madrid",
      "coordinates": {
        "lat": 40.4168,
        "lng": -3.7038
      }
    },
    "description": "Rear-end collision at intersection",
    "police_report": "POL-2024-12345"
  },
  "estimated_loss": 5000.00,
  "document_ids": ["doc_123", "doc_124", "doc_125"]
}
```

**Response:** `201 Created`

#### Update Claim Status

```http
PATCH /claims/{claim_id}/status
```

**Request:**
```json
{
  "status": "approved",
  "approved_amount": 4500.00,
  "notes": "Claim approved after inspection"
}
```

**Response:** `200 OK`

#### Upload Claim Document

```http
POST /claims/{claim_id}/documents
Content-Type: multipart/form-data
```

**Request:**
```
file: [binary file data]
type: photo|invoice|report|other
description: "Front damage photo"
```

**Response:** `201 Created`

---

### Client Endpoints

#### List Clients

```http
GET /clients
```

**Query Parameters:**
```
?search=john
&status=active|inactive
&segment=premium|business|standard|new
&agent_id=usr_abc123
&has_active_policies=true
&created_after=2024-01-01
&page=1
&limit=50
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "clt_abc123",
      "type": "individual",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+34600123456",
      "status": "active",
      "segment": "premium",
      "active_policies": 3,
      "total_premium": 1350.00,
      "lifetime_value": 6750.00,
      "claims_filed": 1,
      "agent": {
        "id": "usr_agent1",
        "name": "Maria Garcia"
      },
      "created_at": "2020-01-15T10:30:00Z"
    }
  ],
  "pagination": { /* pagination object */ }
}
```

#### Get Client

```http
GET /clients/{client_id}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "clt_abc123",
    "type": "individual",
    "personal_info": {
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "1980-01-15",
      "national_id": "12345678A",
      "gender": "male"
    },
    "contact": {
      "email": "john@example.com",
      "phone": "+34600123456",
      "mobile": "+34600123456",
      "address": {
        "street": "Calle Mayor 15",
        "city": "Madrid",
        "state": "Madrid",
        "postal_code": "28013",
        "country": "ES"
      }
    },
    "status": "active",
    "segment": "premium",
    "preferences": {
      "communication_channel": "email",
      "language": "es",
      "marketing_consent": true
    },
    "statistics": {
      "active_policies": 3,
      "total_premium_annual": 1350.00,
      "lifetime_value": 6750.00,
      "claims_filed": 1,
      "claims_approved": 1,
      "client_since": "2020-01-15T10:30:00Z",
      "last_policy": "2024-01-01T00:00:00Z",
      "renewal_rate": 0.95
    },
    "policies": [
      {
        "id": "pol_1",
        "policy_number": "AUT-2024-001",
        "type": "auto",
        "status": "active",
        "premium": 450.00
      }
    ],
    "agent": {
      "id": "usr_agent1",
      "name": "Maria Garcia",
      "email": "maria@soriano.es"
    },
    "ai_insights": {
      "churn_risk": 0.08,
      "upsell_opportunities": [
        {
          "product": "health_insurance",
          "probability": 0.72,
          "estimated_premium": 300.00
        }
      ],
      "recommended_actions": [
        "Schedule annual review",
        "Offer health insurance quote"
      ]
    },
    "created_at": "2020-01-15T10:30:00Z",
    "updated_at": "2024-01-28T14:30:00Z"
  }
}
```

#### Create Client

```http
POST /clients
```

**Request:**
```json
{
  "type": "individual",
  "personal_info": {
    "first_name": "Jane",
    "last_name": "Smith",
    "date_of_birth": "1985-05-20",
    "national_id": "87654321B",
    "gender": "female"
  },
  "contact": {
    "email": "jane@example.com",
    "phone": "+34600987654",
    "address": {
      "street": "Calle Serrano 50",
      "city": "Madrid",
      "postal_code": "28006",
      "country": "ES"
    }
  },
  "preferences": {
    "language": "es",
    "communication_channel": "email"
  }
}
```

**Response:** `201 Created`

#### Update Client

```http
PATCH /clients/{client_id}
```

**Request:**
```json
{
  "contact": {
    "phone": "+34600111222",
    "email": "newemail@example.com"
  }
}
```

**Response:** `200 OK`

---

### Payment Endpoints

#### List Payments

```http
GET /payments
```

**Query Parameters:**
```
?status=pending|completed|failed|refunded
&policy_id=pol_abc123
&client_id=clt_xyz789
&date_from=2024-01-01
&date_to=2024-12-31
&page=1
&limit=50
```

**Response:** `200 OK`

#### Process Payment

```http
POST /payments
```

**Request:**
```json
{
  "policy_id": "pol_abc123",
  "amount": 450.00,
  "currency": "EUR",
  "payment_method": "credit_card",
  "payment_details": {
    "card_token": "tok_abc123",
    "card_last4": "4242"
  }
}
```

**Response:** `201 Created`

#### Refund Payment

```http
POST /payments/{payment_id}/refund
```

**Request:**
```json
{
  "amount": 225.00,
  "reason": "policy_cancellation",
  "notes": "Pro-rata refund for cancelled policy"
}
```

**Response:** `200 OK`

---

### Document Endpoints

#### Upload Document

```http
POST /documents
Content-Type: multipart/form-data
```

**Request:**
```
file: [binary file data]
type: policy|claim|id|contract|other
entity_type: policy|claim|client
entity_id: pol_abc123
description: "Policy certificate"
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "doc_abc123",
    "name": "policy_certificate.pdf",
    "type": "policy",
    "size": 245678,
    "mime_type": "application/pdf",
    "url": "https://cdn.example.com/docs/doc_abc123.pdf",
    "download_url": "https://api.example.com/documents/doc_abc123/download",
    "thumbnail_url": "https://cdn.example.com/thumbnails/doc_abc123.jpg",
    "entity_type": "policy",
    "entity_id": "pol_abc123",
    "uploaded_by": "usr_agent1",
    "created_at": "2024-01-28T14:30:00Z"
  }
}
```

#### Download Document

```http
GET /documents/{document_id}/download
```

**Response:** `302 Redirect` to signed URL

#### Delete Document

```http
DELETE /documents/{document_id}
```

**Response:** `204 No Content`

---

### Report Endpoints

#### Generate Report

```http
POST /reports/generate
```

**Request:**
```json
{
  "report_type": "sales|claims|financial|clients",
  "date_range": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  },
  "filters": {
    "agent_id": "usr_agent1",
    "policy_type": "auto"
  },
  "format": "pdf|excel|csv",
  "delivery": {
    "method": "email|download",
    "email": "user@example.com"
  }
}
```

**Response:** `202 Accepted`
```json
{
  "success": true,
  "data": {
    "report_id": "rpt_abc123",
    "status": "generating",
    "estimated_completion": "2024-01-28T14:35:00Z",
    "download_url": null
  }
}
```

#### Get Report Status

```http
GET /reports/{report_id}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "report_id": "rpt_abc123",
    "status": "completed",
    "download_url": "https://cdn.example.com/reports/rpt_abc123.pdf",
    "expires_at": "2024-02-04T14:35:00Z",
    "generated_at": "2024-01-28T14:35:00Z"
  }
}
```

---

### Module Endpoints

#### List Modules

```http
GET /modules
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "total_modules": 57,
    "enabled": 34,
    "categories": [
      {
        "id": "01-core-business",
        "name": "Core Business",
        "modules": [
          {
            "id": "ait-accountant",
            "name": "AIT Accountant",
            "version": "1.0.0",
            "enabled": true,
            "status": "healthy",
            "health_score": 98
          }
        ]
      }
    ]
  }
}
```

#### Enable Module

```http
POST /modules/{module_id}/enable
```

**Response:** `200 OK`

#### Disable Module

```http
POST /modules/{module_id}/disable
```

**Response:** `200 OK`

#### Module Health Check

```http
GET /modules/{module_id}/health
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "module_id": "ait-accountant",
    "status": "healthy",
    "metrics": {
      "cpu_usage": 23,
      "memory_usage": 45,
      "request_count": 1234,
      "error_rate": 0.01,
      "avg_response_time": 145
    },
    "last_check": "2024-01-28T14:30:00Z"
  }
}
```

---

### AI Agent Endpoints

#### Query Agent

```http
POST /ai/agents/{agent_type}/query
```

**Agent Types:** `insurance|finance|legal|marketing|data|security|customer|operations`

**Request:**
```json
{
  "query": "Should I approve this auto insurance policy?",
  "context": {
    "policy_id": "pol_abc123",
    "client_id": "clt_xyz789"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "agent": "insurance_specialist",
    "response": "Based on my analysis...",
    "recommendation": "approve",
    "confidence": 0.87,
    "reasoning": [
      "Clean driving record",
      "Low-risk vehicle",
      "Good payment history"
    ],
    "suggested_actions": [
      "Standard premium: €450/year",
      "Offer telematics discount"
    ]
  }
}
```

#### Get Agent Insights

```http
GET /ai/agents/{agent_type}/insights
```

**Response:** `200 OK`

---

## 7. Webhooks

### Overview

Webhooks allow you to receive real-time notifications when events occur in the system.

### Webhook Events

Available events:
- `policy.created`
- `policy.updated`
- `policy.cancelled`
- `policy.renewed`
- `claim.submitted`
- `claim.status_changed`
- `claim.paid`
- `payment.completed`
- `payment.failed`
- `client.created`
- `client.updated`
- `document.uploaded`

### Configuring Webhooks

```http
POST /webhooks
```

**Request:**
```json
{
  "url": "https://your-app.com/webhooks/ait-core",
  "events": [
    "policy.created",
    "claim.submitted",
    "payment.completed"
  ],
  "secret": "your_webhook_secret",
  "active": true
}
```

### Webhook Payload

```json
{
  "id": "evt_abc123",
  "type": "policy.created",
  "created_at": "2024-01-28T14:30:00Z",
  "data": {
    "object": "policy",
    "id": "pol_abc123",
    /* full policy object */
  },
  "api_version": "v1"
}
```

### Webhook Signature

Each webhook includes a signature header for verification:

```
X-AIT-Signature: sha256=abc123def456...
```

**Verification (Node.js):**
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

### Retry Policy

Failed webhooks are retried:
- Attempt 1: Immediate
- Attempt 2: 1 minute later
- Attempt 3: 5 minutes later
- Attempt 4: 15 minutes later
- Attempt 5: 1 hour later

After 5 failures, the webhook is disabled and you're notified.

---

## 8. SDKs

### Official SDKs

We provide official SDKs for popular languages:

#### JavaScript/TypeScript

```bash
npm install @ait-core/sdk
```

```typescript
import { AITCore } from '@ait-core/sdk';

const client = new AITCore({
  apiKey: 'your_api_key',
  environment: 'production'
});

// Get policies
const policies = await client.policies.list({
  status: 'active',
  page: 1,
  limit: 50
});

// Create policy
const newPolicy = await client.policies.create({
  type: 'auto',
  client_id: 'clt_abc123',
  // ...
});
```

#### Python

```bash
pip install ait-core
```

```python
from ait_core import AITCore

client = AITCore(api_key='your_api_key')

# Get policies
policies = client.policies.list(status='active', page=1, limit=50)

# Create policy
new_policy = client.policies.create(
    type='auto',
    client_id='clt_abc123',
    # ...
)
```

#### PHP

```bash
composer require ait-core/sdk
```

```php
require_once 'vendor/autoload.php';

use AITCore\Client;

$client = new Client(['api_key' => 'your_api_key']);

// Get policies
$policies = $client->policies->all(['status' => 'active']);

// Create policy
$newPolicy = $client->policies->create([
    'type' => 'auto',
    'client_id' => 'clt_abc123',
    // ...
]);
```

---

## 9. Postman Collection

### Download Collection

Download our complete Postman collection:
```
https://docs.aintech.es/postman/ait-core-collection.json
```

### Import to Postman

1. Open Postman
2. Click "Import"
3. Paste the URL or upload the file
4. Collection includes:
   - All API endpoints
   - Example requests
   - Environment variables
   - Pre-request scripts
   - Test scripts

### Environment Setup

Create an environment with:
```json
{
  "base_url": "https://api.sorianomediadores.es/api/v1",
  "api_key": "your_api_key",
  "access_token": "will_be_set_automatically"
}
```

---

## Support

For API support:
- **Documentation**: https://docs.aintech.es/api
- **Support Email**: api-support@aintech.es
- **Developer Forum**: https://community.aintech.es
- **Status Page**: https://status.aintech.es

---

*API Documentation v1.0.0 | Last Updated: January 28, 2026*
