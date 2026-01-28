# Security Quick Start Guide

## 5-Minute Security Setup for AIT-CORE

This is a rapid deployment guide to get security features up and running quickly.

---

## Step 1: Copy Environment File (30 seconds)

```bash
cd apps/api
cp .env.security.example .env
```

---

## Step 2: Generate Keys (2 minutes)

```bash
# Create keys directory
mkdir -p keys

# Generate JWT keys
openssl genrsa -out keys/jwt-private.key 4096
openssl rsa -in keys/jwt-private.key -pubout -out keys/jwt-public.key

# Generate secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Copy these to your .env file
```

---

## Step 3: Update main.ts (1 minute)

Add these imports at the top:

```typescript
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { getHelmetConfig, getCorsConfig } from './config';
```

Add before `await app.listen()`:

```typescript
app.use(helmet(getHelmetConfig(process.env.NODE_ENV)));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.enableCors(getCorsConfig(process.env.NODE_ENV));
```

---

## Step 4: Update app.module.ts (1 minute)

Add imports:

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { globalRateLimitConfig } from './config/rate-limit.config';
```

Add to imports array:

```typescript
ThrottlerModule.forRoot(globalRateLimitConfig),
```

Add to providers array:

```typescript
{
  provide: APP_GUARD,
  useClass: ThrottlerGuard,
},
```

---

## Step 5: Test (30 seconds)

```bash
# Start server
pnpm run start:dev

# In another terminal, test security headers
node scripts/test-security-headers.js
```

---

## Essential Environment Variables

Edit `.env` and set these minimum variables:

```env
NODE_ENV=production

# JWT (from Step 2)
JWT_SECRET=your-generated-secret
JWT_PRIVATE_KEY_PATH=./keys/jwt-private.key
JWT_PUBLIC_KEY_PATH=./keys/jwt-public.key

# Session (from Step 2)
SESSION_SECRET=your-generated-secret

# Encryption (from Step 2)
ENCRYPTION_KEY=your-generated-key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db?ssl=true

# CORS (update with your domains)
CORS_ORIGIN=https://yourdomain.com

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Verify Security (Optional)

```bash
# Run security scans
pnpm run security:scan

# Generate security report
pnpm run security:report

# Test rate limiting
for i in {1..100}; do curl http://localhost:3000/api/health; done
```

---

## Quick Security Checklist

- [ ] Environment variables set
- [ ] JWT keys generated
- [ ] Helmet configured
- [ ] CORS enabled
- [ ] Rate limiting active
- [ ] Redis running (for sessions)
- [ ] Database SSL enabled
- [ ] Security headers verified

---

## Need Help?

- Full Guide: [SECURITY_IMPLEMENTATION_SUMMARY.md](./SECURITY_IMPLEMENTATION_SUMMARY.md)
- Security Policy: [SECURITY.md](./SECURITY.md)
- Hardening Guide: [security-hardening.md](./security-hardening.md)
- API Guide: [apps/api/README.security.md](./apps/api/README.security.md)

---

## Common Commands

```bash
# Security scans
pnpm run security:audit
pnpm run security:snyk
pnpm run security:scan

# Generate reports
pnpm run security:report

# Test headers
node scripts/test-security-headers.js

# Update dependencies
pnpm run security:update
```

---

**That's it!** Your application now has enterprise-grade security in 5 minutes.

For production deployment, see the full [Production Checklist](./security-hardening.md#production-checklist).
