# AIT-Authenticator

Authentication microservice for the AINTECH ecosystem.

## Features

- ✅ **Email/Password Authentication** with bcrypt hashing
- ✅ **JWT Tokens** (Access + Refresh token rotation)
- ✅ **OAuth 2.0** (Google, Microsoft)
- ✅ **Two-Factor Authentication (2FA)** using TOTP
- ✅ **Role-Based Access Control (RBAC)** with permissions
- ✅ **Password Reset** flow with email tokens
- ✅ **Session Management** with Redis
- ✅ **Audit Logging** for security events
- ✅ **Rate Limiting** to prevent abuse

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: Passport.js + JWT
- **Validation**: Zod
- **Logging**: Winston
- **Metrics**: Prometheus

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- pnpm (or npm)

### 2. Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your actual values
nano .env
```

### 3. Database Setup

```bash
# Run migrations
pnpm migrate

# Load seed data (dev users)
pnpm seed
```

### 4. Start Development Server

```bash
pnpm dev
```

Server will start on `http://localhost:3004`

## API Endpoints

### Public Endpoints

#### POST /auth/register
Register a new user.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "customer" },
    "message": "Registration successful..."
  }
}
```

#### POST /auth/login
Login with email and password.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "..." },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

#### POST /auth/refresh
Refresh access token.

**Request**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

#### POST /auth/forgot-password
Request password reset.

**Request**:
```json
{
  "email": "user@example.com"
}
```

#### POST /auth/reset-password
Reset password with token.

**Request**:
```json
{
  "token": "abc123...",
  "newPassword": "NewPassword123!"
}
```

### Protected Endpoints (Require Authorization Header)

Add header: `Authorization: Bearer <accessToken>`

#### GET /auth/me
Get current user.

#### POST /auth/logout
Logout and revoke tokens.

#### POST /auth/change-password
Change password.

**Request**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

### OAuth Endpoints

#### GET /auth/google
Initiate Google OAuth flow.

#### GET /auth/google/callback
Google OAuth callback (handled automatically).

#### GET /auth/microsoft
Initiate Microsoft OAuth flow.

#### GET /auth/microsoft/callback
Microsoft OAuth callback (handled automatically).

### 2FA Endpoints

#### POST /auth/2fa/enable
Enable 2FA for current user.

**Request**:
```json
{
  "token": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "qrCodeUrl": "data:image/png;base64,...",
    "backupCodes": ["ABCD-1234", "EFGH-5678", ...]
  }
}
```

#### POST /auth/2fa/verify
Verify 2FA token.

#### POST /auth/2fa/disable
Disable 2FA.

## Development

### Test Users

After running seeds, these test users are available:

| Email | Password | Role |
|-------|----------|------|
| admin@aintech.com | Password123! | admin |
| supervisor1@aintech.com | Password123! | supervisor |
| agent1@aintech.com | Password123! | agent |
| customer1@example.com | Password123! | customer |

### Database Commands

```bash
# Run migrations
pnpm migrate

# Load seed data
pnpm seed

# Reset database (migrate + seed)
pnpm db:reset
```

### Development Commands

```bash
# Start development server with auto-reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL connection
- `REDIS_HOST`, `REDIS_PORT` - Redis connection
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - JWT signing secrets (change in production!)

### Optional Variables

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` - For Microsoft OAuth
- `CORS_ORIGINS` - Allowed origins (comma-separated)

## Architecture

```
src/
├── config/
│   └── passport.ts          # Passport strategies
├── controllers/
│   └── auth.controller.ts   # Request handlers
├── middleware/
│   ├── auth.middleware.ts   # JWT authentication
│   ├── rbac.middleware.ts   # Permission checking
│   └── errorHandler.ts      # Error handling
├── models/
│   └── user.model.ts        # Database access
├── routes/
│   └── auth.routes.ts       # Route definitions
├── services/
│   ├── auth.service.ts      # Business logic
│   ├── jwt.service.ts       # Token management
│   ├── oauth.service.ts     # OAuth handling
│   └── twoFactor.service.ts # 2FA logic
├── utils/
│   ├── logger.ts            # Winston logging
│   ├── password.ts          # Bcrypt helpers
│   └── validation.ts        # Zod schemas
└── index.ts                 # Server entry point
```

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with short expiration (15 minutes)
- Refresh token rotation
- Rate limiting on all endpoints
- CSRF protection
- Helmet security headers
- 2FA with TOTP (Google Authenticator compatible)
- Audit logging for security events

## Monitoring

- Health check: `GET /health`
- Prometheus metrics: `GET /metrics`

## License

Proprietary - AINTECH Ecosystem
