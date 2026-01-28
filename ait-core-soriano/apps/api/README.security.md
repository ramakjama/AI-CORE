# API Security Implementation Guide

## Quick Start

This guide provides instructions for implementing and configuring security features in the AIT-CORE API.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Usage Examples](#usage-examples)
4. [Testing Security](#testing-security)
5. [Production Deployment](#production-deployment)

---

## Installation

### 1. Install Dependencies

All required security dependencies are already included in `package.json`:

```bash
pnpm install
```

### 2. Setup Environment Variables

Copy the security environment template:

```bash
cp .env.security.example .env
```

Edit `.env` and configure all security-related variables.

### 3. Generate Security Keys

Generate JWT keys for RS256 algorithm:

```bash
# Create keys directory
mkdir -p keys

# Generate private key
openssl genrsa -out keys/jwt-private.key 4096

# Generate public key
openssl rsa -in keys/jwt-private.key -pubout -out keys/jwt-public.key

# Set permissions (Linux/Mac)
chmod 600 keys/jwt-private.key
chmod 644 keys/jwt-public.key
```

Generate encryption keys:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" > keys/encryption.key
```

---

## Configuration

### 1. Update main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import { getHelmetConfig, getCorsConfig, getSecurityConfig } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get security configuration
  const securityConfig = getSecurityConfig();

  // Security middleware
  app.use(helmet(getHelmetConfig(process.env.NODE_ENV)));
  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.use(compression());

  // CORS
  app.enableCors(getCorsConfig(process.env.NODE_ENV));

  // Global prefix
  app.setGlobalPrefix('api');

  // Start server
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🔒 Security: ${process.env.NODE_ENV} mode`);
}

bootstrap();
```

### 2. Update app.module.ts

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { globalRateLimitConfig } from './config/rate-limit.config';
import {
  IPFilterMiddleware,
  SanitizationMiddleware,
  SecurityHeadersMiddleware,
  AntiScrapingMiddleware,
  RequestSizeLimitMiddleware,
  AuditLoggingMiddleware,
} from './middleware/security.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot(globalRateLimitConfig),
    // ... other modules
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ... other providers
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        IPFilterMiddleware,
        SanitizationMiddleware,
        SecurityHeadersMiddleware,
        AntiScrapingMiddleware,
        RequestSizeLimitMiddleware,
        AuditLoggingMiddleware,
      )
      .forRoutes('*');
  }
}
```

---

## Usage Examples

### 1. Protecting Routes with Decorators

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  AdminOnly,
  RequiresAuth,
  RateLimited,
  SensitiveOperation,
  RequiresMFA,
} from './decorators/security.decorators';

@Controller('users')
@RequiresAuth(['user'])
export class UsersController {
  // Public endpoint (no auth required)
  @Get('public')
  @Public()
  getPublicData() {
    return { message: 'This is public data' };
  }

  // Requires authentication
  @Get('profile')
  getProfile() {
    return { message: 'User profile' };
  }

  // Admin only
  @Get('admin')
  @AdminOnly()
  getAdminData() {
    return { message: 'Admin only data' };
  }

  // Sensitive operation with MFA
  @Post('delete-account')
  @SensitiveOperation('Delete user account')
  @RequiresMFA()
  deleteAccount() {
    return { message: 'Account deleted' };
  }

  // Custom rate limiting
  @Get('search')
  @RateLimited(60000, 20) // 20 requests per minute
  search() {
    return { message: 'Search results' };
  }
}
```

### 2. Using Guards

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  RolesGuard,
  EmailVerifiedGuard,
  ResourceOwnershipGuard,
} from './guards/security.guards';
import { Roles } from './decorators/security.decorators';

@Controller('documents')
@UseGuards(RolesGuard, EmailVerifiedGuard)
export class DocumentsController {
  @Get(':id')
  @UseGuards(ResourceOwnershipGuard)
  @Roles('user', 'admin')
  getDocument(@Param('id') id: string) {
    return { message: `Document ${id}` };
  }
}
```

### 3. API Key Authentication

```typescript
import { Controller, Get } from '@nestjs/common';
import { RequiresApiKey } from './decorators/security.decorators';

@Controller('external')
export class ExternalApiController {
  @Get('data')
  @RequiresApiKey()
  getExternalData() {
    return { message: 'Data for external clients' };
  }
}
```

---

## Testing Security

### 1. Test Security Headers

```bash
# Start the server
pnpm run start:dev

# In another terminal, test headers
node scripts/test-security-headers.js
```

### 2. Test Rate Limiting

```bash
# Send multiple requests quickly
for i in {1..100}; do curl http://localhost:3000/api/test; done
```

### 3. Run Security Scans

```bash
# NPM Audit
pnpm run security:audit

# Snyk scan
pnpm run security:snyk

# Generate security report
pnpm run security:report
```

### 4. Test CORS

```bash
# Test CORS with different origins
curl -H "Origin: https://sorianomediadore.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:3000/api/test

# Should be allowed
curl -H "Origin: https://sorianomediadore.com" \
     http://localhost:3000/api/test

# Should be blocked
curl -H "Origin: https://malicious.com" \
     http://localhost:3000/api/test
```

### 5. Test Authentication

```bash
# Try accessing protected route without token
curl http://localhost:3000/api/users/profile

# Should return 401 Unauthorized

# With valid token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/users/profile
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] JWT keys generated and secured
- [ ] Redis configured for sessions and rate limiting
- [ ] SSL/TLS certificates installed
- [ ] Database connections encrypted
- [ ] CORS origins configured for production domains
- [ ] Rate limits adjusted for production load
- [ ] Monitoring and alerting configured
- [ ] Backup procedures in place
- [ ] Security scan completed with no critical issues

### Environment-Specific Configuration

#### Development
```env
NODE_ENV=development
HELMET_ENABLED=true
RATE_LIMIT_ENABLED=true
LOG_LEVEL=debug
```

#### Staging
```env
NODE_ENV=staging
HELMET_ENABLED=true
RATE_LIMIT_ENABLED=true
LOG_LEVEL=info
```

#### Production
```env
NODE_ENV=production
HELMET_ENABLED=true
RATE_LIMIT_ENABLED=true
LOG_LEVEL=warn
```

### Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod

# Copy application
COPY . .

# Build
RUN pnpm run build

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start
CMD ["node", "dist/main"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ait-core-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ait-core-api
  template:
    metadata:
      labels:
        app: ait-core-api
    spec:
      containers:
      - name: api
        image: ait-core-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        envFrom:
        - secretRef:
            name: ait-core-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
```

---

## Monitoring & Alerts

### Setup Monitoring

1. **Prometheus Metrics**
   - Install @willsoto/nestjs-prometheus
   - Configure metrics endpoints
   - Set up Grafana dashboards

2. **Error Tracking**
   - Configure Sentry
   - Set up error alerting
   - Define severity thresholds

3. **Log Aggregation**
   - Use Winston for structured logging
   - Send logs to ELK/Splunk
   - Configure log retention

### Alert Rules

```yaml
groups:
  - name: security_alerts
    rules:
      - alert: HighFailedLoginRate
        expr: rate(failed_login_total[5m]) > 10
        annotations:
          summary: "High rate of failed logins detected"

      - alert: RateLimitExceeded
        expr: rate(rate_limit_exceeded_total[1m]) > 50
        annotations:
          summary: "Rate limit frequently exceeded"

      - alert: UnauthorizedAccess
        expr: rate(unauthorized_access_total[5m]) > 20
        annotations:
          summary: "Multiple unauthorized access attempts"
```

---

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem**: Requests blocked by CORS policy

**Solution**:
- Verify origin is in whitelist
- Check CORS credentials setting
- Ensure preflight requests succeed

#### 2. Rate Limiting Too Aggressive

**Problem**: Legitimate users getting rate limited

**Solution**:
- Adjust rate limit thresholds
- Implement user-tier based limits
- Add IP whitelist for trusted clients

#### 3. JWT Token Issues

**Problem**: Tokens not validating

**Solution**:
- Verify JWT secret matches
- Check token expiration
- Ensure correct algorithm (RS256)

#### 4. Security Headers Not Applied

**Problem**: Headers missing in responses

**Solution**:
- Verify Helmet is configured in main.ts
- Check middleware order
- Test with curl -I

---

## Additional Resources

- [Security Hardening Guide](../../security-hardening.md)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [Helmet.js Documentation](https://helmetjs.github.io/)

---

## Support

For security-related questions:
- Email: security@sorianomediadore.com
- Documentation: https://docs.sorianomediadore.com/security
- GitHub Issues: https://github.com/ait-core/security/issues

---

**Last Updated**: 2026-01-28
