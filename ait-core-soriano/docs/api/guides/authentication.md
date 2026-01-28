# Authentication Guide

This guide covers all authentication methods supported by the AIT-CORE Soriano API.

## Table of Contents

1. [Overview](#overview)
2. [JWT Bearer Authentication](#jwt-bearer-authentication)
3. [API Key Authentication](#api-key-authentication)
4. [Token Refresh](#token-refresh)
5. [Security Best Practices](#security-best-practices)
6. [Common Issues](#common-issues)

## Overview

The AIT-CORE API supports three authentication methods:

| Method | Use Case | Header |
|--------|----------|--------|
| JWT Bearer Token | Primary authentication for user sessions | `Authorization: Bearer <token>` |
| API Key | Service-to-service authentication | `X-API-Key: <key>` |
| Refresh Token | Obtaining new access tokens | HTTP-only cookie or request body |

## JWT Bearer Authentication

JWT (JSON Web Token) is the primary authentication method for user-based API access.

### Authentication Flow

```
┌─────────┐                                    ┌─────────┐
│ Client  │                                    │   API   │
└────┬────┘                                    └────┬────┘
     │                                              │
     │  1. POST /auth/login                        │
     │  { email, password }                        │
     ├─────────────────────────────────────────────>│
     │                                              │
     │  2. JWT tokens + user data                  │
     │<─────────────────────────────────────────────┤
     │                                              │
     │  3. GET /users/me                           │
     │  Authorization: Bearer <accessToken>        │
     ├─────────────────────────────────────────────>│
     │                                              │
     │  4. User profile data                       │
     │<─────────────────────────────────────────────┤
     │                                              │
```

### Step 1: Login

**Endpoint**: `POST /api/v1/auth/login`

**Request**:
```bash
curl -X POST https://api.soriano.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImlhdCI6MTY0MDAwMDAwMCwiZXhwIjoxNjQwMDAzNjAwfQ.signature",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTY0MDAwMDAwMCwiZXhwIjoxNjQwNjA0ODAwfQ.signature",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "isActive": true,
      "emailVerified": true
    }
  }
}
```

**Error Responses**:

401 Unauthorized - Invalid credentials:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

403 Forbidden - Account inactive:
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_INACTIVE",
    "message": "Your account has been deactivated. Please contact support."
  }
}
```

### Step 2: Use Access Token

Include the access token in the `Authorization` header for all authenticated requests:

```bash
curl -X GET https://api.soriano.com/api/v1/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JWT Token Structure

The access token is a JWT with the following payload:

```json
{
  "sub": "123e4567-e89b-12d3-a456-426614174000",  // User ID
  "email": "user@example.com",                    // User email
  "role": "USER",                                 // User role
  "iat": 1640000000,                              // Issued at (Unix timestamp)
  "exp": 1640003600                               // Expires at (Unix timestamp)
}
```

### Token Expiration

- **Access Token**: 1 hour (3600 seconds)
- **Refresh Token**: 7 days (604800 seconds)

After the access token expires, use the refresh token to obtain a new access token.

## API Key Authentication

API keys are used for service-to-service authentication and don't expire.

### Obtaining an API Key

Contact support@soriano.com to request an API key for your application.

### Using an API Key

Include the API key in the `X-API-Key` header:

```bash
curl -X GET https://api.soriano.com/api/v1/users \
  -H "X-API-Key: YOUR_API_KEY_HERE"
```

### API Key Format

- **Production**: `sk_live_<random_string>`
- **Test**: `sk_test_<random_string>`

### API Key Permissions

API keys can be configured with specific permissions:

- **Read-only**: GET requests only
- **Read-write**: GET, POST, PUT, PATCH requests
- **Full access**: All HTTP methods including DELETE

## Token Refresh

When the access token expires, use the refresh token to obtain a new access token without requiring the user to log in again.

### Refresh Token Flow

**Endpoint**: `POST /api/v1/auth/refresh`

**Request**:
```bash
curl -X POST https://api.soriano.com/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Invalid or expired refresh token"
  }
}
```

### Automatic Token Refresh

Implement automatic token refresh in your application:

```javascript
// JavaScript/TypeScript example
class ApiClient {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  async request(endpoint, options = {}) {
    // Check if token is expired or will expire in next 5 minutes
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    // If unauthorized, try refreshing token once
    if (response.status === 401 && !options.isRetry) {
      await this.refreshAccessToken();
      return this.request(endpoint, { ...options, isRetry: true });
    }

    return response;
  }

  isTokenExpired() {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry - 300000; // 5 minutes buffer
  }

  async refreshAccessToken() {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      this.accessToken = data.data.accessToken;
      this.tokenExpiry = Date.now() + (data.data.expiresIn * 1000);
    } else {
      // Refresh failed, redirect to login
      this.logout();
    }
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    window.location.href = '/login';
  }
}
```

## Registration

### Create New Account

**Endpoint**: `POST /api/v1/auth/register`

**Request**:
```bash
curl -X POST https://api.soriano.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePassword123!",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+34612345678"
  }'
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "email": "newuser@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "USER",
      "isActive": true,
      "emailVerified": false
    }
  }
}
```

**Error Response** (409 Conflict):
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "An account with this email already exists"
  }
}
```

## Logout

**Endpoint**: `POST /api/v1/auth/logout`

**Request**:
```bash
curl -X POST https://api.soriano.com/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

The logout endpoint invalidates the refresh token on the server. The client should also clear stored tokens.

## Security Best Practices

### Token Storage

**Do**:
- Store tokens in memory for single-page applications
- Use HTTP-only cookies for refresh tokens
- Use secure, encrypted storage for mobile apps

**Don't**:
- Store tokens in localStorage (XSS vulnerable)
- Store tokens in cookies without HttpOnly flag
- Share tokens between applications
- Log tokens in console or error tracking

### Password Requirements

Passwords must meet the following criteria:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Not be a common password

### HTTPS Only

**Always use HTTPS** in production. HTTP requests will be automatically redirected to HTTPS.

### Token Security

- Never share your access token
- Rotate API keys regularly
- Immediately revoke compromised tokens
- Use short-lived access tokens
- Implement token refresh properly

### Rate Limiting

Authentication endpoints have strict rate limits:

| Endpoint | Rate Limit |
|----------|------------|
| `/auth/login` | 5 attempts per 15 minutes |
| `/auth/register` | 3 attempts per hour |
| `/auth/refresh` | 10 attempts per minute |

### Multi-Factor Authentication (MFA)

MFA will be available in a future release. Contact support@soriano.com for early access.

## Common Issues

### Issue: Token Expired

**Error**:
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "JWT token has expired"
  }
}
```

**Solution**: Use the refresh token to obtain a new access token.

### Issue: Invalid Token

**Error**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or malformed JWT token"
  }
}
```

**Solution**: Ensure the token is correctly formatted and not corrupted. Re-authenticate if necessary.

### Issue: Insufficient Permissions

**Error**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You don't have permission to access this resource"
  }
}
```

**Solution**: Check your user role and permissions. Contact your administrator if you need additional access.

### Issue: Rate Limit Exceeded

**Error**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many login attempts. Please try again in 15 minutes."
  }
}
```

**Solution**: Wait for the rate limit period to expire before trying again.

## Testing Authentication

### Test Credentials

For development and testing, use the following test accounts:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| admin@test.com | Admin123! | ADMIN | Admin account |
| user@test.com | User123! | USER | Regular user |
| manager@test.com | Manager123! | MANAGER | Manager account |

**Note**: These accounts only work in development and staging environments.

### Postman Collection

Download our Postman collection with pre-configured authentication:
[AIT-CORE API Postman Collection](../examples/postman/ait-core-api.postman_collection.json)

## Role-Based Access Control (RBAC)

### Available Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `USER` | Regular user | Read own data, create quotes |
| `MANAGER` | Department manager | Read team data, approve requests |
| `ADMIN` | System administrator | Full CRUD on most resources |
| `SUPER_ADMIN` | Super administrator | Full system access |

### Permission Hierarchy

```
SUPER_ADMIN
    ↓
   ADMIN
    ↓
  MANAGER
    ↓
   USER
```

Higher roles inherit permissions from lower roles.

## Next Steps

- [Rate Limiting Guide](./rate-limiting.md)
- [Error Handling Guide](./error-handling.md)
- [API Reference](../openapi/openapi.yaml)
- [Code Examples](../examples/)

---

**Last Updated**: January 28, 2026
