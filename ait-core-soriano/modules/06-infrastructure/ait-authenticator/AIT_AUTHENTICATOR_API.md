# AIT-AUTHENTICATOR API Documentation

## Overview

**AIT-AUTHENTICATOR** is a comprehensive authentication and authorization service for the AIT-CORE ecosystem. It provides:

- OAuth2 authentication (Google, Microsoft)
- JWT-based access and refresh tokens
- Single Sign-On (SSO) across platforms
- Role-Based Access Control (RBAC)
- Multi-Factor Authentication (MFA)
- Session management with Redis

**Base URL**: `http://localhost:3002/auth` (Development)
**Production URL**: `https://auth.sorianomediadores.es/auth`

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [OAuth2 Endpoints](#oauth2-endpoints)
3. [Token Management](#token-management)
4. [User Management](#user-management)
5. [Error Responses](#error-responses)
6. [Response Formats](#response-formats)

---

## Authentication Endpoints

### 1. Register New User

Create a new user account with email and password.

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "mfaEnabled": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**Errors**:
- `400 Bad Request` - Invalid email or weak password
- `409 Conflict` - Email already registered

---

### 2. Login with Email/Password

Authenticate with email and password credentials.

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "mfaEnabled": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**With MFA Enabled**:
```json
{
  "success": true,
  "data": {
    "mfaRequired": true,
    "message": "MFA code required"
  }
}
```

**Errors**:
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account locked

---

### 3. Verify MFA Code

Verify multi-factor authentication code.

**Endpoint**: `POST /auth/mfa/verify`

**Request Body**:
```json
{
  "email": "user@example.com",
  "mfaCode": "123456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**Errors**:
- `401 Unauthorized` - Invalid MFA code
- `429 Too Many Requests` - Too many failed attempts

---

## OAuth2 Endpoints

### 4. Google OAuth2 Login

Initiate Google OAuth2 authentication flow.

**Endpoint**: `GET /auth/google`

**Parameters**: None

**Flow**:
1. User clicks "Login with Google" button
2. Redirects to Google consent screen
3. User authorizes the application
4. Google redirects to callback URL

**Redirect URL**: `{FRONTEND_URL}/auth/callback?access_token=...&refresh_token=...`

---

### 5. Google OAuth2 Callback

Handle Google OAuth2 callback (automatic).

**Endpoint**: `GET /auth/google/callback`

**Parameters**:
- `code` (query) - Authorization code from Google

**Response**: Redirects to frontend with tokens in URL

---

### 6. Microsoft OAuth2 Login

Initiate Microsoft OAuth2 authentication flow.

**Endpoint**: `GET /auth/microsoft`

**Parameters**: None

**Flow**:
1. User clicks "Login with Microsoft" button
2. Redirects to Microsoft consent screen
3. User authorizes the application
4. Microsoft redirects to callback URL

**Redirect URL**: `{FRONTEND_URL}/auth/callback?access_token=...&refresh_token=...`

---

### 7. Microsoft OAuth2 Callback

Handle Microsoft OAuth2 callback (automatic).

**Endpoint**: `GET /auth/microsoft/callback`

**Parameters**:
- `code` (query) - Authorization code from Microsoft

**Response**: Redirects to frontend with tokens in URL

---

## Token Management

### 8. Refresh Access Token

Get a new access token using a refresh token.

**Endpoint**: `POST /auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**Errors**:
- `401 Unauthorized` - Invalid or expired refresh token

---

### 9. Validate Token

Validate an access token and retrieve payload.

**Endpoint**: `POST /auth/validate`

**Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "valid": true,
    "payload": {
      "userId": "uuid-123",
      "email": "user@example.com",
      "role": "USER",
      "permissions": ["policies:read:own", "claims:create:own"]
    }
  }
}
```

**Invalid Token**:
```json
{
  "success": false,
  "data": {
    "valid": false,
    "error": "Token expired"
  }
}
```

---

### 10. Logout

Revoke the current refresh token and invalidate session.

**Endpoint**: `POST /auth/logout`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Errors**:
- `401 Unauthorized` - Invalid or missing token

---

### 11. Logout from All Devices

Revoke all tokens for the current user across all devices.

**Endpoint**: `POST /auth/logout-all`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

---

## User Management

### 12. Get Current User

Retrieve information about the currently authenticated user.

**Endpoint**: `GET /auth/me`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "email": "user@example.com",
    "role": "USER",
    "permissions": [
      "policies:read:own",
      "policies:create:own",
      "claims:read:own",
      "claims:create:own",
      "profile:read",
      "profile:update"
    ]
  }
}
```

**Errors**:
- `401 Unauthorized` - Invalid or expired token

---

### 13. Setup MFA

Generate MFA secret and QR code for enabling two-factor authentication.

**Endpoint**: `POST /auth/mfa/setup`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "backupCodes": [
      "12345678",
      "87654321",
      "11223344"
    ]
  }
}
```

---

### 14. Enable MFA

Enable multi-factor authentication after verifying the initial code.

**Endpoint**: `POST /auth/mfa/enable`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "code": "123456",
  "secret": "JBSWY3DPEHPK3PXP"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "MFA enabled successfully"
}
```

**Errors**:
- `400 Bad Request` - Invalid MFA code

---

### 15. Disable MFA

Disable multi-factor authentication.

**Endpoint**: `POST /auth/mfa/disable`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "code": "123456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "MFA disabled successfully"
}
```

---

### 16. Health Check

Check the health status of the authentication service.

**Endpoint**: `GET /auth/health`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "ait-authenticator",
    "timestamp": "2026-01-28T10:30:00.000Z"
  }
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `BAD_REQUEST` | Invalid request parameters |
| 401 | `UNAUTHORIZED` | Authentication failed |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource already exists |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_SERVER_ERROR` | Server error |

---

## Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials",
    "timestamp": "2026-01-28T10:30:00.000Z"
  }
}
```

---

## JWT Token Structure

### Access Token Payload

```json
{
  "sub": "uuid-123",           // User ID
  "email": "user@example.com",
  "role": "USER",
  "permissions": [
    "policies:read:own",
    "claims:create:own"
  ],
  "type": "access",
  "iat": 1706437800,           // Issued at
  "exp": 1706438700            // Expires at (15 minutes)
}
```

### Refresh Token Payload

```json
{
  "sub": "uuid-123",           // User ID
  "email": "user@example.com",
  "role": "USER",
  "permissions": [...],
  "type": "refresh",
  "iat": 1706437800,           // Issued at
  "exp": 1707042600            // Expires at (7 days)
}
```

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

- **Authentication endpoints** (login, register): 5 requests per minute per IP
- **Token refresh**: 10 requests per minute per user
- **MFA endpoints**: 3 requests per minute per user
- **Other endpoints**: 100 requests per minute per user

**Rate Limit Headers**:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1706437860
```

---

## CORS Configuration

The API accepts requests from configured origins:

```
Access-Control-Allow-Origin: https://sorianomediadores.es, https://app.sorianomediadores.es
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
```

---

## Security Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (httpOnly cookies or secure storage)
3. **Implement token refresh** before expiration
4. **Handle token expiration** gracefully
5. **Use SSO cookies** for cross-platform authentication
6. **Enable MFA** for sensitive operations
7. **Rotate secrets** regularly
8. **Monitor for suspicious activity**

---

## Testing with cURL

### Example: Login

```bash
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

### Example: Get Current User

```bash
curl -X GET http://localhost:3002/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example: Refresh Token

```bash
curl -X POST http://localhost:3002/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

## Webhooks (Optional)

Configure webhooks to receive notifications about authentication events:

**Supported Events**:
- `user.registered` - New user registration
- `user.login` - User login
- `user.logout` - User logout
- `user.mfa_enabled` - MFA enabled
- `user.mfa_disabled` - MFA disabled
- `token.revoked` - Token revoked

**Webhook Payload**:
```json
{
  "event": "user.login",
  "timestamp": "2026-01-28T10:30:00.000Z",
  "data": {
    "userId": "uuid-123",
    "email": "user@example.com",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
}
```

---

## Related Documentation

- [PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md) - RBAC permissions matrix
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Integration examples
- [README.md](./README.md) - General overview

---

**Last Updated**: 2026-01-28
**Version**: 1.0.0
**Support**: support@aintechmediadores.com
