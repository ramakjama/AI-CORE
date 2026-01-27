# AI-CORE: Modelo de Seguridad

## Vision General

AI-CORE implementa un modelo de seguridad en profundidad (Defense in Depth) con multiples capas de proteccion, control de acceso basado en roles (RBAC), y arquitectura multi-tenant con aislamiento completo de datos.

## Arquitectura de Seguridad

```
+------------------------------------------------------------------+
|                    SECURITY ARCHITECTURE                          |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                    PERIMETER LAYER                          |  |
|  |  +----------+  +----------+  +----------+  +----------+     |  |
|  |  | WAF      |  | DDoS     |  | Rate     |  | IP       |     |  |
|  |  | Firewall |  | Shield   |  | Limiting |  | Filtering|     |  |
|  |  +----------+  +----------+  +----------+  +----------+     |  |
|  +------------------------------------------------------------+  |
|                              |                                   |
|  +------------------------------------------------------------+  |
|  |                   AUTHENTICATION LAYER                      |  |
|  |  +----------+  +----------+  +----------+  +----------+     |  |
|  |  | JWT      |  | OAuth2   |  | MFA      |  | SSO      |     |  |
|  |  | Tokens   |  | / OIDC   |  | TOTP     |  | SAML     |     |  |
|  |  +----------+  +----------+  +----------+  +----------+     |  |
|  +------------------------------------------------------------+  |
|                              |                                   |
|  +------------------------------------------------------------+  |
|  |                   AUTHORIZATION LAYER                       |  |
|  |  +----------+  +----------+  +----------+  +----------+     |  |
|  |  | RBAC     |  | ABAC     |  | Tenant   |  | Resource |     |  |
|  |  | Roles    |  | Policies |  | Isolation|  | Policies |     |  |
|  |  +----------+  +----------+  +----------+  +----------+     |  |
|  +------------------------------------------------------------+  |
|                              |                                   |
|  +------------------------------------------------------------+  |
|  |                      DATA LAYER                             |  |
|  |  +----------+  +----------+  +----------+  +----------+     |  |
|  |  | Encryption|  | RLS     |  | Masking  |  | Audit    |     |  |
|  |  | at Rest  |  | (Row)   |  | PII      |  | Logging  |     |  |
|  |  +----------+  +----------+  +----------+  +----------+     |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

## Autenticacion (AI-IAM)

### Flujo de Autenticacion JWT

```
+------------------------------------------------------------------+
|                      JWT Authentication Flow                      |
+------------------------------------------------------------------+
|                                                                  |
|  +--------+          +--------+          +--------+              |
|  | Client |          | AI-IAM |          |  DB    |              |
|  +--------+          +--------+          +--------+              |
|       |                   |                   |                  |
|       | 1. POST /auth/login                   |                  |
|       |   { email, password }                 |                  |
|       |------------------>|                   |                  |
|       |                   | 2. Query User     |                  |
|       |                   |------------------>|                  |
|       |                   |<------------------|                  |
|       |                   | 3. User Record    |                  |
|       |                   |                   |                  |
|       |                   | 4. bcrypt.compare()                  |
|       |                   |                   |                  |
|       |                   | 5. Generate JWT   |                  |
|       |                   |   - Access Token (15min)             |
|       |                   |   - Refresh Token (7d)               |
|       |                   |                   |                  |
|       |<------------------|                   |                  |
|       | 6. { accessToken,                     |                  |
|       |      refreshToken }                   |                  |
|       |                   |                   |                  |
+------------------------------------------------------------------+

JWT Token Structure:
+------------------------------------------------------------------+
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-rotation-id"
  },
  "payload": {
    "sub": "user-uuid",
    "iss": "ai-core",
    "aud": "ai-core-api",
    "iat": 1704067200,
    "exp": 1704068100,
    "tenant_id": "tenant-uuid",
    "roles": ["admin", "policy_manager"],
    "permissions": ["policy:read", "policy:write"],
    "session_id": "session-uuid"
  },
  "signature": "..."
}
+------------------------------------------------------------------+
```

### Multi-Factor Authentication (MFA)

```
+------------------------------------------------------------------+
|                         MFA Flow                                  |
+------------------------------------------------------------------+
|                                                                  |
|  Step 1: Primary Authentication                                  |
|  +--------+          +--------+                                  |
|  | Client |--------->| AI-IAM |  Password verified               |
|  +--------+          +--------+                                  |
|                          |                                       |
|  Step 2: MFA Challenge                                           |
|                          |                                       |
|       +------------------+------------------+                    |
|       |                  |                  |                    |
|       v                  v                  v                    |
|  +--------+        +----------+        +--------+                |
|  | TOTP   |        | SMS/Email|        | Push   |                |
|  | (App)  |        | OTP      |        | Notify |                |
|  +--------+        +----------+        +--------+                |
|       |                  |                  |                    |
|       +------------------+------------------+                    |
|                          |                                       |
|  Step 3: Verification                                            |
|                          v                                       |
|                    +----------+                                  |
|                    | Validate |                                  |
|                    | Code     |                                  |
|                    +----------+                                  |
|                          |                                       |
|  Step 4: Session Created                                         |
|                          v                                       |
|                    +----------+                                  |
|                    | Issue    |                                  |
|                    | Tokens   |                                  |
|                    +----------+                                  |
|                                                                  |
+------------------------------------------------------------------+
```

## RBAC (Role-Based Access Control)

### Modelo de Permisos

```
+------------------------------------------------------------------+
|                    RBAC Permission Model                          |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------+                                            |
|  |      User        |                                            |
|  +------------------+                                            |
|           |                                                      |
|           | has many                                             |
|           v                                                      |
|  +------------------+      +------------------+                   |
|  |      Roles       |----->|   Permissions    |                   |
|  +------------------+      +------------------+                   |
|           |                        |                             |
|           |                        v                             |
|           |                +------------------+                   |
|           |                |    Resources     |                   |
|           |                +------------------+                   |
|           |                        |                             |
|           v                        v                             |
|  +------------------+      +------------------+                   |
|  |     Scopes       |      |    Actions       |                   |
|  | (tenant, dept)   |      | (CRUD, approve)  |                   |
|  +------------------+      +------------------+                   |
|                                                                  |
+------------------------------------------------------------------+
```

### Jerarquia de Roles

```
+------------------------------------------------------------------+
|                      Role Hierarchy                               |
+------------------------------------------------------------------+
|                                                                  |
|                    +------------------+                          |
|                    |   SUPER_ADMIN    |                          |
|                    | (Platform Owner) |                          |
|                    +------------------+                          |
|                            |                                     |
|              +-------------+-------------+                       |
|              |                           |                       |
|    +---------v---------+       +---------v---------+             |
|    |    TENANT_ADMIN   |       |   SYSTEM_ADMIN    |             |
|    | (Organization)    |       | (Technical)       |             |
|    +-------------------+       +-------------------+             |
|              |                           |                       |
|    +---------+---------+       +---------+---------+             |
|    |         |         |       |                   |             |
|    v         v         v       v                   v             |
| +------+ +------+ +------+ +------+          +--------+          |
| |ADMIN | |MANAGER| |VIEWER| |SUPPORT|         |DEVELOPER|        |
| +------+ +------+ +------+ +------+          +--------+          |
|                                                                  |
+------------------------------------------------------------------+
```

### Tabla de Permisos por Rol

| Rol | Usuarios | Polizas | Siniestros | Configuracion | IA | Reportes |
|-----|----------|---------|------------|---------------|-----|----------|
| **SUPER_ADMIN** | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD |
| **TENANT_ADMIN** | CRUD | CRUD | CRUD | CRU | CR | CRUD |
| **MANAGER** | CR | CRUD | CRUD | R | CR | CR |
| **AGENT** | R | CRU | CRU | - | R | R |
| **VIEWER** | R | R | R | - | R | R |
| **CUSTOMER** | R (self) | R (own) | CRU (own) | - | R | - |

### Implementacion de Permisos

```typescript
// Permission Decorator
@Permission('policy:create')
@Permission('policy:read', { scope: 'tenant' })
async createPolicy(dto: CreatePolicyDto) {
  // ...
}

// Permission Guard
@Injectable()
export class PermissionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.getUser();
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler()
    );

    return requiredPermissions.every(permission =>
      this.permissionService.hasPermission(user, permission)
    );
  }
}

// ABAC Policy Example
const policySchema = {
  resource: 'policy',
  action: 'update',
  conditions: {
    'resource.tenant_id': { equals: 'user.tenant_id' },
    'resource.status': { not_in: ['cancelled', 'expired'] },
    'user.department': { in: ['sales', 'underwriting'] }
  }
};
```

## Multi-Tenancy

### Modelo de Aislamiento

```
+------------------------------------------------------------------+
|                    Multi-Tenant Isolation                         |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                      API Gateway                            |  |
|  +------------------------------------------------------------+  |
|                              |                                   |
|           +------------------+------------------+                 |
|           |                  |                  |                 |
|           v                  v                  v                 |
|  +----------------+  +----------------+  +----------------+       |
|  |   Tenant A     |  |   Tenant B     |  |   Tenant C     |       |
|  |   Context      |  |   Context      |  |   Context      |       |
|  +----------------+  +----------------+  +----------------+       |
|           |                  |                  |                 |
|           v                  v                  v                 |
|  +----------------+  +----------------+  +----------------+       |
|  |   Schema A     |  |   Schema B     |  |   Schema C     |       |
|  +----------------+  +----------------+  +----------------+       |
|           |                  |                  |                 |
|           +------------------+------------------+                 |
|                              |                                   |
|                              v                                   |
|  +------------------------------------------------------------+  |
|  |              PostgreSQL with Row-Level Security             |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### Row-Level Security (RLS)

```sql
-- Enable RLS on tables
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation ON policies
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Create policy for specific roles
CREATE POLICY manager_access ON policies
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      current_setting('app.user_role') IN ('admin', 'manager')
      OR created_by = current_setting('app.user_id')::uuid
    )
  );
```

### Tenant Context Middleware

```typescript
// Tenant Context Middleware
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = this.extractTenantId(req);

    // Set tenant context in AsyncLocalStorage
    await this.tenantContext.run(tenantId, async () => {
      // Set PostgreSQL session variable
      await this.prisma.$executeRaw`
        SET LOCAL app.current_tenant_id = ${tenantId}
      `;
      next();
    });
  }

  private extractTenantId(req: Request): string {
    // 1. From JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = this.jwtService.decode(token);
      return decoded.tenant_id;
    }

    // 2. From subdomain
    const subdomain = req.hostname.split('.')[0];
    return this.tenantService.getBySubdomain(subdomain);

    // 3. From header
    return req.headers['x-tenant-id'];
  }
}
```

## Encriptacion

### Encriptacion en Transito

```
+------------------------------------------------------------------+
|                    Encryption in Transit                          |
+------------------------------------------------------------------+
|                                                                  |
|  Client <------ TLS 1.3 ------> Load Balancer                    |
|                                      |                           |
|                                 mTLS |                           |
|                                      v                           |
|                              API Gateway                         |
|                                      |                           |
|                                 mTLS |                           |
|                                      v                           |
|                              Microservices                       |
|                                      |                           |
|                            TLS/SSL   |                           |
|                                      v                           |
|                              Databases                           |
|                                                                  |
+------------------------------------------------------------------+

TLS Configuration:
- Protocol: TLS 1.3 (minimum TLS 1.2)
- Cipher Suites: AEAD only (AES-GCM, ChaCha20-Poly1305)
- Certificate: RSA 4096 or ECDSA P-384
- HSTS: Enabled with preload
```

### Encriptacion en Reposo

```
+------------------------------------------------------------------+
|                    Encryption at Rest                             |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------+     +------------------+                    |
|  |  Application     |     |   Key Management |                    |
|  |  Encryption      |<--->|   Service (KMS)  |                    |
|  +------------------+     +------------------+                    |
|           |                        |                             |
|           v                        v                             |
|  +------------------+     +------------------+                    |
|  | Field-Level      |     | Key Rotation     |                    |
|  | Encryption       |     | (Automatic)      |                    |
|  | (PII Data)       |     | Every 90 days    |                    |
|  +------------------+     +------------------+                    |
|           |                                                      |
|           v                                                      |
|  +------------------------------------------------------------+  |
|  |           Database (TDE - Transparent Data Encryption)     |  |
|  +------------------------------------------------------------+  |
|           |                                                      |
|           v                                                      |
|  +------------------------------------------------------------+  |
|  |                 Disk Encryption (LUKS/BitLocker)           |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### Campos Encriptados

```typescript
// Field-level encryption for PII
@Entity()
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Encrypted() // Application-level encryption
  ssn: string;

  @Column()
  @Encrypted()
  bankAccount: string;

  @Column()
  @Encrypted()
  creditCardNumber: string;

  @Column({ type: 'jsonb' })
  @Encrypted()
  healthData: HealthInfo;
}

// Encryption Service
@Injectable()
export class EncryptionService {
  constructor(private kms: KMSService) {}

  async encrypt(plaintext: string, keyId: string): Promise<string> {
    const key = await this.kms.getKey(keyId);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);

    return Buffer.concat([
      iv,
      cipher.getAuthTag(),
      encrypted
    ]).toString('base64');
  }
}
```

## Auditoria y Logging

### Audit Trail

```
+------------------------------------------------------------------+
|                       Audit Trail System                          |
+------------------------------------------------------------------+
|                                                                  |
|  +----------+     +----------+     +----------+     +----------+ |
|  | Action   |---->| Audit    |---->| Event    |---->| Storage  | |
|  | Event    |     | Service  |     | Store    |     | (Immut.) | |
|  +----------+     +----------+     +----------+     +----------+ |
|                                                                  |
|  Audit Event Schema:                                             |
|  +------------------------------------------------------------+  |
|  {                                                             |  |
|    "id": "uuid",                                               |  |
|    "timestamp": "2024-01-15T10:30:00Z",                        |  |
|    "tenant_id": "tenant-uuid",                                 |  |
|    "actor": {                                                  |  |
|      "user_id": "user-uuid",                                   |  |
|      "ip_address": "192.168.1.100",                            |  |
|      "user_agent": "Mozilla/5.0..."                            |  |
|    },                                                          |  |
|    "action": "policy.update",                                  |  |
|    "resource": {                                               |  |
|      "type": "Policy",                                         |  |
|      "id": "policy-uuid"                                       |  |
|    },                                                          |  |
|    "changes": {                                                |  |
|      "before": { "status": "draft" },                          |  |
|      "after": { "status": "active" }                           |  |
|    },                                                          |  |
|    "result": "success",                                        |  |
|    "metadata": {                                               |  |
|      "request_id": "req-uuid",                                 |  |
|      "session_id": "session-uuid"                              |  |
|    }                                                           |  |
|  }                                                             |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### Security Events

| Evento | Severidad | Descripcion | Accion |
|--------|-----------|-------------|--------|
| `auth.login.success` | INFO | Login exitoso | Log |
| `auth.login.failed` | WARN | Login fallido | Log + Alert (3+) |
| `auth.mfa.failed` | WARN | MFA fallido | Log + Alert |
| `auth.session.hijack` | CRITICAL | Posible session hijacking | Block + Alert |
| `authz.denied` | WARN | Acceso denegado | Log |
| `authz.elevation` | INFO | Elevacion de privilegios | Log + Review |
| `data.export` | INFO | Exportacion de datos | Log |
| `data.bulk_delete` | WARN | Eliminacion masiva | Log + Approval |
| `config.change` | INFO | Cambio de configuracion | Log |
| `security.breach` | CRITICAL | Brecha detectada | Block + Alert + Incident |

## Seguridad de API

### Rate Limiting

```
+------------------------------------------------------------------+
|                      Rate Limiting Strategy                       |
+------------------------------------------------------------------+
|                                                                  |
|  Layer 1: Global Rate Limit                                      |
|  +------------------------------------------------------------+  |
|  | 10,000 requests/minute per IP                               |  |
|  +------------------------------------------------------------+  |
|                              |                                   |
|  Layer 2: User Rate Limit                                        |
|  +------------------------------------------------------------+  |
|  | Authenticated: 1,000 requests/minute                        |  |
|  | Unauthenticated: 100 requests/minute                        |  |
|  +------------------------------------------------------------+  |
|                              |                                   |
|  Layer 3: Endpoint Rate Limit                                    |
|  +------------------------------------------------------------+  |
|  | /auth/login: 5 requests/minute                              |  |
|  | /api/ai/*: 50 requests/minute                               |  |
|  | /api/export: 10 requests/hour                               |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### Input Validation

```typescript
// Zod Schema Validation
const CreatePolicySchema = z.object({
  customerId: z.string().uuid(),
  type: z.enum(['auto', 'home', 'life', 'health']),
  coverage: z.object({
    amount: z.number().positive().max(10_000_000),
    deductible: z.number().nonnegative()
  }),
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
}).refine(
  data => new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date' }
);

// SQL Injection Prevention (Prisma)
// Prisma uses parameterized queries by default
const policy = await prisma.policy.findMany({
  where: {
    customerId: userId, // Sanitized automatically
    status: 'active'
  }
});

// XSS Prevention
import DOMPurify from 'isomorphic-dompurify';

const sanitizedHtml = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
  ALLOWED_ATTR: []
});
```

## Compliance

### GDPR Compliance

```
+------------------------------------------------------------------+
|                      GDPR Compliance Features                     |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------+     +------------------+                    |
|  | Right to Access  |     | Data Portability |                    |
|  | GET /user/data   |     | GET /user/export |                    |
|  +------------------+     +------------------+                    |
|                                                                  |
|  +------------------+     +------------------+                    |
|  | Right to Erasure |     | Consent Mgmt     |                    |
|  | DELETE /user     |     | POST /consent    |                    |
|  +------------------+     +------------------+                    |
|                                                                  |
|  +------------------+     +------------------+                    |
|  | Data Minimization|     | Purpose Limitation|                   |
|  | Auto-cleanup     |     | Scope enforcement |                   |
|  +------------------+     +------------------+                    |
|                                                                  |
+------------------------------------------------------------------+
```

### Security Headers

```typescript
// Security Headers Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'strict-dynamic'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.ai-core.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

## Gestion de Secretos

```
+------------------------------------------------------------------+
|                    Secrets Management                             |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------+                                            |
|  |  HashiCorp Vault |<---- Secret Rotation                       |
|  |  or AWS Secrets  |      (Automatic)                           |
|  +------------------+                                            |
|           |                                                      |
|           | Dynamic Secrets                                      |
|           v                                                      |
|  +------------------+                                            |
|  | Application      |                                            |
|  | (Memory Only)    |---- No secrets in:                         |
|  +------------------+     - Environment files (.env)             |
|           |               - Source code                          |
|           |               - Logs                                 |
|           v               - Error messages                       |
|  +------------------+                                            |
|  | Secret Types:    |                                            |
|  | - DB credentials |                                            |
|  | - API keys       |                                            |
|  | - JWT secrets    |                                            |
|  | - Encryption keys|                                            |
|  +------------------+                                            |
|                                                                  |
+------------------------------------------------------------------+
```

## Referencias

- [Architecture Overview](./overview.md)
- [Data Flow](./data-flow.md)
- [Deployment Guide](../guides/deployment.md)
