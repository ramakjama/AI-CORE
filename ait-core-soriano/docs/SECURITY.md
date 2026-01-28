# AIT-CORE SORIANO - Security Practices

**Version:** 1.0.0
**Last Updated:** 2026-01-28

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Security](#data-security)
4. [Network Security](#network-security)
5. [Application Security](#application-security)
6. [Compliance & Standards](#compliance--standards)
7. [Security Monitoring](#security-monitoring)
8. [Incident Response](#incident-response)
9. [Security Best Practices](#security-best-practices)
10. [Security Checklist](#security-checklist)

---

## Security Overview

AIT-CORE SORIANO implements a defense-in-depth security strategy with multiple layers of protection.

### Security Principles

1. **Zero Trust Architecture**: Never trust, always verify
2. **Least Privilege**: Minimum required permissions
3. **Defense in Depth**: Multiple security layers
4. **Security by Design**: Security integrated from the start
5. **Continuous Monitoring**: 24/7 security monitoring
6. **Incident Preparedness**: Ready to respond to threats

### Security Layers

```
┌────────────────────────────────────────────────────┐
│  Layer 7: Monitoring & Incident Response          │
├────────────────────────────────────────────────────┤
│  Layer 6: Compliance & Audit                      │
├────────────────────────────────────────────────────┤
│  Layer 5: Data Security (Encryption)              │
├────────────────────────────────────────────────────┤
│  Layer 4: Application Security                    │
├────────────────────────────────────────────────────┤
│  Layer 3: Authentication & Authorization          │
├────────────────────────────────────────────────────┤
│  Layer 2: Network Security                        │
├────────────────────────────────────────────────────┤
│  Layer 1: Infrastructure Security                 │
└────────────────────────────────────────────────────┘
```

---

## Authentication & Authorization

### Authentication Methods

**JWT (JSON Web Tokens)**:
- Access token: 1 hour expiry
- Refresh token: 7 days expiry
- Token rotation on refresh
- Secure storage (httpOnly cookies)

**Multi-Factor Authentication (MFA)**:
- TOTP (Time-based One-Time Password)
- SMS OTP
- Email OTP
- Biometric (mobile apps)

**OAuth 2.0 / OIDC**:
- Google OAuth
- Microsoft OAuth
- Enterprise SSO (SAML 2.0)

**API Keys**:
- Scoped permissions
- Rotation policies
- Rate limiting
- Usage monitoring

### Authorization Model

**Role-Based Access Control (RBAC)**:
```typescript
enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  AGENT = 'agent',
  USER = 'user',
}

const permissions = {
  super_admin: ['*'],
  admin: ['read', 'write', 'delete', 'manage_users'],
  manager: ['read', 'write', 'manage_team'],
  agent: ['read', 'write'],
  user: ['read'],
};
```

**Attribute-Based Access Control (ABAC)**:
```typescript
interface AccessPolicy {
  resource: string;
  action: string;
  conditions: {
    userRole?: string[];
    userDepartment?: string[];
    timeRange?: { start: string; end: string };
    ipWhitelist?: string[];
    mfaRequired?: boolean;
  };
}
```

### Session Management

- Redis-backed sessions
- Session timeout: 1 hour inactivity
- Concurrent session limits: 3 per user
- Device fingerprinting
- Geo-location tracking
- Automatic logout on suspicious activity

### Password Policy

- Minimum length: 12 characters
- Complexity requirements:
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
- Password history: Last 5 passwords
- Password expiry: 90 days (optional)
- Hashing: Argon2id (industry best practice)

**Implementation**:
```typescript
import * as argon2 from 'argon2';

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}
```

---

## Data Security

### Encryption at Rest

**Database Encryption**:
- PostgreSQL: Transparent Data Encryption (TDE)
- Encryption algorithm: AES-256-GCM
- Key management: AWS KMS / Azure Key Vault

**File Storage Encryption**:
- S3: Server-side encryption (SSE-S3 or SSE-KMS)
- MinIO: Encryption enabled by default

**Sensitive Field Encryption**:
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

function encryptField(data: string, key: Buffer): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptField(encryptedData: string, key: Buffer): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### Encryption in Transit

**TLS Configuration**:
- TLS 1.3 (minimum TLS 1.2)
- Strong cipher suites only
- Perfect Forward Secrecy (PFS)
- HSTS enabled
- Certificate pinning (mobile apps)

**TLS Termination**:
```nginx
server {
    listen 443 ssl http2;
    server_name api.sorianomediadores.es;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### Data Masking

**PII Masking**:
```typescript
function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  return `${username.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone: string): string {
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
}

function maskCreditCard(cardNumber: string): string {
  return '**** **** **** ' + cardNumber.slice(-4);
}
```

### Data Retention

**Retention Policies**:
- Transactional data: 7 years (legal requirement)
- Log data: 90 days
- Session data: 30 days
- Backup data: 30 days

**Data Deletion**:
- Soft delete with `deleted_at` timestamp
- Hard delete after retention period
- GDPR "Right to be forgotten" support

---

## Network Security

### Firewall Rules

**Cloud Security Groups**:
```yaml
Inbound Rules:
  - Port 443 (HTTPS): 0.0.0.0/0
  - Port 22 (SSH): Admin IPs only
  - Port 5432 (PostgreSQL): VPC only
  - Port 6379 (Redis): VPC only
  - Port 9092 (Kafka): VPC only

Outbound Rules:
  - All traffic: 0.0.0.0/0 (with egress filtering)
```

### VPC Configuration

```
┌────────────────────────────────────────────────┐
│                  VPC (10.0.0.0/16)             │
├────────────────────────────────────────────────┤
│  Public Subnet (10.0.1.0/24)                   │
│  • Load Balancer                               │
│  • NAT Gateway                                 │
├────────────────────────────────────────────────┤
│  Private Subnet 1 (10.0.10.0/24)               │
│  • API Servers                                 │
│  • Web Servers                                 │
├────────────────────────────────────────────────┤
│  Private Subnet 2 (10.0.20.0/24)               │
│  • Databases (RDS)                             │
│  • Cache (Redis)                               │
└────────────────────────────────────────────────┘
```

### DDoS Protection

- CloudFlare / AWS Shield
- Rate limiting (per IP, per API key)
- Connection limits
- Request size limits

### WAF (Web Application Firewall)

**Rules**:
- SQL injection protection
- XSS protection
- CSRF protection
- Brute force protection
- Bot detection

---

## Application Security

### Input Validation

**Validation with Zod**:
```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(12).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  role: z.enum(['user', 'admin', 'manager']),
});

// Usage
function createUser(data: unknown) {
  const validatedData = CreateUserSchema.parse(data);
  // ... create user
}
```

### SQL Injection Prevention

**Parameterized Queries (Prisma)**:
```typescript
// Safe: Parameterized query
const user = await prisma.user.findUnique({
  where: { email: userInput },
});

// Safe: Prisma ORM prevents SQL injection
const users = await prisma.user.findMany({
  where: {
    name: { contains: searchTerm },
  },
});
```

### XSS Prevention

**Content Security Policy**:
```typescript
// Helmet.js configuration
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.example.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'api.sorianomediadores.es'],
      fontSrc: ["'self'", 'fonts.googleapis.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);
```

**Output Encoding**:
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize HTML
const cleanHTML = DOMPurify.sanitize(userInput);

// Escape for HTML context
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### CSRF Protection

```typescript
import csrf from 'csurf';

// CSRF middleware
app.use(csrf({ cookie: true }));

// Include CSRF token in forms
app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// Global rate limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later',
});

// Auth endpoint rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
});

app.use('/api/', globalLimiter);
app.use('/api/v1/auth/login', authLimiter);
```

### Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet());

// Additional headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
```

---

## Compliance & Standards

### GDPR Compliance

**Data Subject Rights**:
- Right to access
- Right to rectification
- Right to erasure ("right to be forgotten")
- Right to data portability
- Right to restrict processing
- Right to object

**Implementation**:
```typescript
// Export user data (data portability)
async function exportUserData(userId: string) {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      contacts: true,
      policies: true,
      interactions: true,
    },
  });

  return {
    format: 'json',
    data: userData,
    exportedAt: new Date(),
  };
}

// Delete user data (right to be forgotten)
async function deleteUserData(userId: string) {
  // Anonymize instead of hard delete for compliance
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted_${userId}@example.com`,
      name: 'Deleted User',
      phone: null,
      address: null,
      gdpr_deleted: true,
      deleted_at: new Date(),
    },
  });
}
```

### LOPD Compliance

**Data Protection Officer (DPO)**:
- Designated DPO contact
- Data protection impact assessments (DPIA)
- Privacy by design
- Privacy by default

### SOC 2 Type II

**Control Objectives**:
- Security
- Availability
- Processing integrity
- Confidentiality
- Privacy

### ISO 27001

**Information Security Management System (ISMS)**:
- Risk assessment and treatment
- Security policies and procedures
- Incident management
- Business continuity
- Compliance monitoring

### PCI DSS (if handling payments)

**Requirements**:
- Never store full card numbers (use tokenization)
- Encrypt cardholder data
- Maintain secure network
- Regular security testing
- Maintain information security policy

---

## Security Monitoring

### Logging

**Security Event Logging**:
```typescript
// Login attempt
logger.security({
  event: 'login_attempt',
  userId: user.id,
  success: true,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date(),
});

// Permission denied
logger.security({
  event: 'permission_denied',
  userId: user.id,
  resource: '/api/v1/admin/users',
  action: 'delete',
  ip: req.ip,
  timestamp: new Date(),
});

// Data access
logger.security({
  event: 'data_access',
  userId: user.id,
  resource: 'policy',
  resourceId: policyId,
  action: 'read',
  timestamp: new Date(),
});
```

### Anomaly Detection

**AI-Defender Module**:
- Unusual login patterns
- Suspicious API usage
- Abnormal data access
- Geographic anomalies
- Brute force attempts

### SIEM Integration

**Elasticsearch Security Analytics**:
```
Security events → Elasticsearch → Kibana dashboards
                                    ↓
                              Alerting rules
                                    ↓
                            PagerDuty / Slack
```

### Alerts

**Critical Alerts**:
- Multiple failed login attempts
- Privilege escalation attempts
- Data exfiltration patterns
- Unauthorized API access
- System component failures

---

## Incident Response

### Incident Response Plan

**Phases**:
1. **Preparation**: Have IR plan and tools ready
2. **Detection**: Identify security incidents
3. **Containment**: Limit impact
4. **Eradication**: Remove threat
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Post-incident review

### Incident Classification

| Severity | Description | Response Time | Escalation |
|----------|-------------|---------------|------------|
| Critical | Data breach, system compromise | < 15 min | CEO, Legal |
| High | Service disruption, DoS | < 1 hour | CTO, DevOps |
| Medium | Failed intrusion attempt | < 4 hours | Security team |
| Low | Policy violation | < 24 hours | Team lead |

### Contact Information

**Security Team**:
- Email: security@sorianomediadores.es
- Phone: +34 XXX XXX XXX (24/7)
- Slack: #security-incidents

**Escalation Chain**:
1. Security Engineer
2. Security Lead
3. CTO
4. CEO
5. Legal Team

---

## Security Best Practices

### For Developers

1. **Never commit secrets to Git**
   ```bash
   # Use environment variables
   DATABASE_URL=postgresql://...
   ANTHROPIC_API_KEY=sk-ant-...

   # Add .env to .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use parameterized queries**
   ```typescript
   // Good
   await prisma.user.findUnique({ where: { email: userInput } });

   // Bad (if not using ORM)
   await db.query(`SELECT * FROM users WHERE email = '${userInput}'`);
   ```

3. **Validate all input**
   ```typescript
   const schema = z.object({ email: z.string().email() });
   const data = schema.parse(req.body);
   ```

4. **Use least privilege**
   ```typescript
   // Give minimum required permissions
   @Roles('user') // Not 'admin' unless necessary
   async getUserProfile() { ... }
   ```

5. **Keep dependencies updated**
   ```bash
   pnpm audit
   pnpm update
   ```

### For Operators

1. **Regular security audits**
2. **Patch management**
3. **Backup verification**
4. **Access review**
5. **Monitoring alerts**

### For Users

1. **Strong passwords**
2. **Enable MFA**
3. **Be wary of phishing**
4. **Use secure devices**
5. **Report suspicious activity**

---

## Security Checklist

### Development Phase

- [ ] Input validation implemented
- [ ] Output encoding applied
- [ ] Authentication required for protected endpoints
- [ ] Authorization checks in place
- [ ] Sensitive data encrypted
- [ ] Secrets stored securely (not in code)
- [ ] Dependencies audited for vulnerabilities
- [ ] Security tests written
- [ ] Code reviewed by security team

### Deployment Phase

- [ ] TLS/SSL configured
- [ ] Firewall rules configured
- [ ] Security groups restricted
- [ ] Database encryption enabled
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Logging configured
- [ ] Secrets management configured (Vault/KMS)
- [ ] Rate limiting enabled
- [ ] DDoS protection enabled

### Operational Phase

- [ ] Security monitoring active
- [ ] Alerts configured
- [ ] Incident response plan documented
- [ ] Regular security audits scheduled
- [ ] Patch management process in place
- [ ] Access reviews conducted quarterly
- [ ] Backup restoration tested
- [ ] Security training completed
- [ ] Compliance requirements met
- [ ] Penetration testing scheduled

---

## Vulnerability Disclosure

### Reporting Security Issues

**Contact**: security@sorianomediadores.es

**PGP Key**: Available at https://sorianomediadores.es/.well-known/pgp-key.txt

**Please Include**:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Your contact information

**Response Timeline**:
- Acknowledgment: Within 24 hours
- Initial assessment: Within 72 hours
- Regular updates: Weekly
- Resolution target: 30 days (critical), 90 days (others)

### Bug Bounty Program

**Coming Q2 2026**: Public bug bounty program on HackerOne

---

**Document Version:** 1.0.0
**Last Updated:** 2026-01-28
**Security Contact:** security@sorianomediadores.es
