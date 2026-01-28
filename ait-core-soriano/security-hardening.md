# Production Security Hardening Guide

## AIT-CORE Soriano Mediadores - Security Implementation

This document outlines the comprehensive security measures implemented in the AIT-CORE platform and provides guidelines for production deployment.

---

## Table of Contents

1. [Security Configuration Files](#security-configuration-files)
2. [Helmet Configuration](#helmet-configuration)
3. [CORS Policies](#cors-policies)
4. [Rate Limiting](#rate-limiting)
5. [Content Security Policy](#content-security-policy)
6. [Security Middleware](#security-middleware)
7. [Security Guards](#security-guards)
8. [Vulnerability Scanning](#vulnerability-scanning)
9. [Environment Variables](#environment-variables)
10. [Production Checklist](#production-checklist)
11. [Security Monitoring](#security-monitoring)
12. [Incident Response](#incident-response)

---

## Security Configuration Files

### Location
```
ait-core-soriano/
├── apps/api/src/config/
│   ├── helmet.config.ts
│   ├── cors.config.ts
│   ├── rate-limit.config.ts
│   ├── csp.config.ts
│   └── security.config.ts
├── apps/api/src/middleware/
│   └── security.middleware.ts
├── apps/api/src/guards/
│   └── security.guards.ts
├── apps/api/src/decorators/
│   └── security.decorators.ts
├── .well-known/
│   └── security.txt
└── apps/api/vulnerability-scan.config.json
```

---

## Helmet Configuration

Helmet provides security headers to protect against common web vulnerabilities.

### Production Headers
- **CSP**: Strict Content Security Policy
- **HSTS**: HTTP Strict Transport Security (1 year, includeSubDomains, preload)
- **X-Frame-Options**: DENY (clickjacking protection)
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin

### Implementation
```typescript
import { getHelmetConfig } from './config/helmet.config';

// In main.ts
app.use(helmet(getHelmetConfig(process.env.NODE_ENV)));
```

---

## CORS Policies

### Production Whitelist
- `https://sorianomediadore.com`
- `https://www.sorianomediadore.com`
- `https://app.sorianomediadore.com`
- `https://admin.sorianomediadore.com`
- `https://api.sorianomediadore.com`

### Configuration
```typescript
import { getCorsConfig } from './config/cors.config';

app.enableCors(getCorsConfig(process.env.NODE_ENV));
```

### Allowed Methods
- GET, POST, PUT, PATCH, DELETE, OPTIONS

### Allowed Headers
- Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Key

---

## Rate Limiting

### Global Limits
- **Short**: 10 requests per second
- **Medium**: 100 requests per minute
- **Long**: 1000 requests per hour

### Endpoint-Specific Limits

#### Authentication
- **Login**: 5 attempts per 15 minutes
- **Register**: 3 registrations per hour
- **Password Reset**: 3 requests per hour
- **Email Verification**: 5 attempts per 10 minutes

#### File Operations
- **Upload**: 50 uploads per hour (max 10MB per file)
- **Download**: 100 downloads per hour

#### Search & Queries
- **Search**: 20 searches per minute
- **Export**: 10 exports per hour

### User Tier Limits
- **Free**: 30 requests per minute
- **Basic**: 100 requests per minute
- **Premium**: 300 requests per minute
- **Admin**: 500 requests per minute

---

## Content Security Policy

### Strict CSP (Recommended)
```
default-src 'none';
script-src 'self' 'strict-dynamic';
style-src 'self';
img-src 'self' data: https:;
connect-src 'self' https://api.sorianomediadore.com;
```

### Balanced CSP (With Third-party)
Allows integration with:
- Google Analytics
- CDN resources (jsdelivr, cdnjs)
- Font providers (Google Fonts)
- Video platforms (YouTube, Vimeo)

### CSP Reporting
Violations are logged to `/api/csp-report` for monitoring and analysis.

---

## Security Middleware

### Available Middleware

1. **IPFilterMiddleware**
   - IP whitelist/blacklist
   - Geographic restrictions

2. **SanitizationMiddleware**
   - XSS prevention
   - SQL injection prevention
   - Null byte removal

3. **SecurityHeadersMiddleware**
   - Additional security headers
   - Request ID generation
   - Server identification removal

4. **AntiScrapingMiddleware**
   - Bot detection
   - Rate-based scraping detection
   - Legitimate bot allowlist

5. **RequestSizeLimitMiddleware**
   - Body size limits (10MB default)
   - Header size limits (8KB default)

6. **AuditLoggingMiddleware**
   - All requests logged
   - Security event tracking
   - Compliance logging

7. **CSRFProtectionMiddleware**
   - Token-based CSRF protection
   - Double-submit cookie pattern

### Implementation
```typescript
// In app.module.ts
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
        CSRFProtectionMiddleware
      )
      .forRoutes('*');
  }
}
```

---

## Security Guards

### Available Guards

1. **ApiKeyGuard** - API key validation
2. **RolesGuard** - Role-based access control
3. **PermissionsGuard** - Permission-based access control
4. **IPWhitelistGuard** - IP-based restrictions
5. **ResourceOwnershipGuard** - Resource ownership validation
6. **EmailVerifiedGuard** - Email verification requirement
7. **MFAGuard** - Multi-factor authentication
8. **AccountStatusGuard** - Account status checks
9. **TrialPeriodGuard** - Subscription validation

### Usage with Decorators
```typescript
@Controller('admin')
@AdminOnly()
export class AdminController {
  @Get('sensitive')
  @SensitiveOperation('View sensitive data')
  @RequiresMFA()
  getSensitiveData() {
    // Implementation
  }
}
```

---

## Vulnerability Scanning

### Scanners Configured

1. **npm audit** - Node.js dependency scanning
2. **Snyk** - Comprehensive vulnerability detection
3. **OWASP Dependency Check** - CVE database scanning

### Scan Schedule
- **Daily**: Automated scans at 2:00 AM
- **On PR**: All pull requests
- **On Push**: Main branch commits

### Severity Thresholds
- **Critical**: 0 allowed (fail build)
- **High**: 5 allowed
- **Medium**: 20 allowed
- **Low**: 100 allowed

### Commands
```bash
# Run all security scans
npm run security:scan

# Individual scans
npm audit
snyk test
npm run owasp:check
```

---

## Environment Variables

### Required Security Variables

```env
# JWT Configuration
JWT_SECRET=<strong-random-secret>
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Session Configuration
SESSION_SECRET=<strong-random-secret>

# Encryption
ENCRYPTION_KEY=<32-byte-hex-string>

# API Keys
VALID_API_KEYS=key1,key2,key3

# IP Configuration
IP_WHITELIST=1.2.3.4,5.6.7.8
IP_BLACKLIST=9.10.11.12

# Redis (for rate limiting and sessions)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>

# Database
DATABASE_URL=<encrypted-connection-string>
DATABASE_SSL=true

# External Services
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=<username>
SMTP_PASS=<password>

# Monitoring
SENTRY_DSN=<sentry-dsn>
LOG_LEVEL=info

# Security
CORS_ORIGIN=https://sorianomediadore.com
HELMET_ENABLED=true
RATE_LIMIT_ENABLED=true
```

### Generating Secrets
```bash
# Generate strong secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT keypair (RS256)
ssh-keygen -t rsa -b 4096 -m PEM -f jwt.key
openssl rsa -in jwt.key -pubout -outform PEM -out jwt.key.pub
```

---

## Production Checklist

### Pre-Deployment

- [ ] Update all dependencies to latest secure versions
- [ ] Run complete security scan suite
- [ ] Review and fix all high/critical vulnerabilities
- [ ] Configure production environment variables
- [ ] Set strong JWT and session secrets
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates (Let's Encrypt recommended)
- [ ] Enable HSTS preloading
- [ ] Configure rate limiting for production load
- [ ] Set up Redis for session storage
- [ ] Configure database connection pooling
- [ ] Enable query parameterization
- [ ] Set up backup and recovery procedures

### Security Headers

- [ ] Helmet configured for production
- [ ] CSP headers properly configured
- [ ] HSTS enabled with preload
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options set to nosniff
- [ ] Referrer-Policy configured
- [ ] Permissions-Policy configured

### Authentication & Authorization

- [ ] Strong password policy enforced
- [ ] MFA enabled for admin accounts
- [ ] Session timeout configured (30 minutes)
- [ ] Concurrent session limits set
- [ ] Account lockout after failed attempts
- [ ] Password reset flow secured
- [ ] Email verification required
- [ ] OAuth 2.0 properly configured

### Data Protection

- [ ] Encryption at rest enabled
- [ ] TLS 1.3 enforced
- [ ] Database credentials encrypted
- [ ] Sensitive data redacted in logs
- [ ] PII handling compliant with GDPR
- [ ] Data retention policies implemented
- [ ] Secure backup procedures
- [ ] Data disposal procedures

### Network Security

- [ ] Firewall rules configured
- [ ] DDoS protection enabled
- [ ] Load balancer SSL termination
- [ ] Internal network segmentation
- [ ] VPN for admin access
- [ ] IP whitelisting for sensitive endpoints
- [ ] API gateway configured

### Monitoring & Logging

- [ ] Security event logging enabled
- [ ] Failed login attempts logged
- [ ] API access logs enabled
- [ ] Anomaly detection configured
- [ ] Real-time alerting set up
- [ ] Log aggregation (ELK/Splunk)
- [ ] SIEM integration
- [ ] Audit trail for compliance

### Compliance

- [ ] GDPR compliance verified
- [ ] Data processing agreements signed
- [ ] Privacy policy updated
- [ ] Terms of service reviewed
- [ ] Cookie consent implemented
- [ ] Data breach response plan
- [ ] Regular security audits scheduled
- [ ] Penetration testing completed

### Infrastructure

- [ ] Container security scanning
- [ ] Kubernetes security policies
- [ ] Secrets management (Vault/KMS)
- [ ] Image vulnerability scanning
- [ ] Network policies configured
- [ ] Resource limits set
- [ ] Auto-scaling configured
- [ ] Disaster recovery plan

---

## Security Monitoring

### Key Metrics to Monitor

1. **Authentication Failures**
   - Failed login attempts
   - Brute force attacks
   - Session hijacking attempts

2. **Rate Limit Violations**
   - Endpoints exceeding limits
   - Suspicious traffic patterns
   - DDoS indicators

3. **Security Header Violations**
   - CSP violations
   - Mixed content warnings
   - Insecure requests

4. **Access Control**
   - Unauthorized access attempts
   - Privilege escalation attempts
   - Resource ownership violations

5. **Data Access**
   - Unusual data queries
   - Large data exports
   - Sensitive data access

### Alerting Thresholds

- **Critical**: Immediate notification (SMS/Phone)
- **High**: Within 5 minutes (Email/Slack)
- **Medium**: Within 30 minutes (Email)
- **Low**: Daily digest (Email)

### Tools
- **Sentry**: Error and security event tracking
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **ELK Stack**: Log aggregation and analysis
- **DataDog**: Full-stack monitoring

---

## Incident Response

### Response Plan

#### 1. Detection (0-5 minutes)
- Automated monitoring alerts
- Manual report received
- Anomaly detected

#### 2. Analysis (5-30 minutes)
- Assess severity and scope
- Identify affected systems
- Determine attack vector
- Collect evidence

#### 3. Containment (30-60 minutes)
- Isolate affected systems
- Block malicious IPs
- Revoke compromised credentials
- Enable additional monitoring

#### 4. Eradication (1-4 hours)
- Remove malicious code
- Patch vulnerabilities
- Update security rules
- Verify system integrity

#### 5. Recovery (4-24 hours)
- Restore from clean backups
- Validate all systems
- Monitor for reinfection
- Gradually restore services

#### 6. Post-Incident (24-72 hours)
- Document incident details
- Conduct root cause analysis
- Update security policies
- Implement preventive measures
- Notify affected parties (GDPR)
- File required reports

### Contact Information

**Security Team**
- Email: security@sorianomediadore.com
- Phone: +34 XXX XXX XXX (24/7 hotline)
- Slack: #security-incidents

**External Contacts**
- Hosting Provider: [Contact Info]
- CDN Provider: [Contact Info]
- Legal Counsel: [Contact Info]
- Insurance: [Contact Info]
- Law Enforcement: [Contact Info]

---

## Security Training

### Required Training
- [ ] OWASP Top 10 awareness
- [ ] Secure coding practices
- [ ] Password management
- [ ] Phishing awareness
- [ ] Data protection (GDPR)
- [ ] Incident response procedures

### Frequency
- Initial training: All new employees
- Refresher: Annually
- Updates: When new threats emerge

---

## Regular Security Tasks

### Daily
- [ ] Review security alerts
- [ ] Check failed login attempts
- [ ] Monitor rate limit violations
- [ ] Review audit logs

### Weekly
- [ ] Dependency vulnerability scan
- [ ] Review access control logs
- [ ] Check SSL certificate expiry
- [ ] Update threat intelligence

### Monthly
- [ ] Full security assessment
- [ ] Update security policies
- [ ] Review user permissions
- [ ] Penetration testing (automated)
- [ ] Backup verification

### Quarterly
- [ ] External security audit
- [ ] Penetration testing (manual)
- [ ] Disaster recovery drill
- [ ] Security training update
- [ ] Compliance review

### Annually
- [ ] Comprehensive security audit
- [ ] Third-party assessment
- [ ] Insurance review
- [ ] Policy updates
- [ ] Certification renewal

---

## Additional Resources

### Documentation
- OWASP Application Security Guide
- NIST Cybersecurity Framework
- CIS Controls
- GDPR Compliance Guide
- PCI DSS Requirements

### Tools
- OWASP ZAP (penetration testing)
- Burp Suite (security testing)
- Wireshark (network analysis)
- Nmap (network scanning)
- Metasploit (vulnerability testing)

---

## Support

For security concerns or questions:
- Email: security@sorianomediadore.com
- Security Portal: https://sorianomediadore.com/security
- Bug Bounty: https://sorianomediadore.com/security-report

---

**Last Updated**: 2026-01-28
**Version**: 1.0.0
**Document Owner**: Security Team
**Next Review**: 2026-04-28
