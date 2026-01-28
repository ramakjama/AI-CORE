# 🎯 PLAN DE EJECUCIÓN ULTRA-DETALLADO - AINTECH ECOSYSTEM

**Objetivo**: Implementar el 100% del ecosistema AINTECH
**Estado Actual**: 28% completado
**Pendiente**: 72% restante

---

## 📋 ÍNDICE DE FASES

1. [FASE 1: Backend Core Services (Semana 1-2)](#fase-1-backend-core-services)
2. [FASE 2: Telephony & Omnichannel (Semana 3-4)](#fase-2-telephony--omnichannel)
3. [FASE 3: Quote Engine & Scrapers (Semana 5-6)](#fase-3-quote-engine--scrapers)
4. [FASE 4: AI Modules (Semana 7-8)](#fase-4-ai-modules)
5. [FASE 5: Analytics & DataHub (Semana 9-10)](#fase-5-analytics--datahub)
6. [FASE 6: Integrations (Semana 11-12)](#fase-6-integrations)
7. [FASE 7: Mobile & Desktop (Semana 13-14)](#fase-7-mobile--desktop)
8. [FASE 8: Testing & Production (Semana 15-16)](#fase-8-testing--production)

---

# FASE 1: Backend Core Services

## 📦 1.1: ait-authenticator (Auth Service) - COMPLETAR

**Estado**: 20% completado
**Tiempo estimado**: 6-8 horas
**Prioridad**: CRÍTICA

### Checklist de Implementación

#### 1.1.1: Utils & Config (1 hora)

- [ ] **Crear `src/utils/logger.ts`**
  - [ ] Importar Winston
  - [ ] Configurar transports (console, file)
  - [ ] Configurar formatos (timestamp, colorize, json)
  - [ ] Exportar logger instance
  - [ ] Añadir log rotation (daily rotate file)
  - [ ] Configurar niveles: error, warn, info, debug
  - **Verificación**: `logger.info('test')` funciona

- [ ] **Crear `src/utils/password.ts`**
  - [ ] Importar bcrypt
  - [ ] `hashPassword(password: string): Promise<string>`
    - [ ] Validar longitud mínima (8 caracteres)
    - [ ] Salt rounds = 12
    - [ ] Return hashed password
  - [ ] `comparePassword(password: string, hash: string): Promise<boolean>`
    - [ ] Usar bcrypt.compare
    - [ ] Return boolean result
  - **Verificación**: Test con password "test123" hash/compare exitoso

- [ ] **Crear `src/utils/validation.ts`**
  - [ ] Importar Zod
  - [ ] `loginSchema`: email + password
  - [ ] `registerSchema`: email, password, firstName, lastName, phone
  - [ ] `resetPasswordSchema`: token + newPassword
  - [ ] `twoFactorSchema`: token (6 dígitos)
  - [ ] Validaciones custom:
    - [ ] Password: min 8, mayúscula, minúscula, número, símbolo
    - [ ] Email: formato válido
    - [ ] Phone: formato internacional
  - **Verificación**: Schema.parse() valida correctamente

- [ ] **Crear `src/config/passport.ts`**
  - [ ] Importar passport, strategies
  - [ ] **JWT Strategy**:
    - [ ] Secret from env
    - [ ] Extract from header: Authorization Bearer
    - [ ] Verify token y cargar user desde DB
  - [ ] **Google Strategy**:
    - [ ] Client ID/Secret from env
    - [ ] Callback URL
    - [ ] Profile to user mapping
  - [ ] **Microsoft Strategy**:
    - [ ] Client ID/Secret from env
    - [ ] Callback URL
    - [ ] Profile to user mapping
  - [ ] Exportar `setupPassport(passport)`
  - **Verificación**: Passport initialized sin errores

- [ ] **Crear `.env.example`**
  - [ ] DATABASE_URL
  - [ ] REDIS_URL
  - [ ] JWT_SECRET
  - [ ] JWT_REFRESH_SECRET
  - [ ] GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
  - [ ] MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_CALLBACK_URL
  - [ ] PORT=3004
  - [ ] NODE_ENV=development
  - [ ] CORS_ORIGINS
  - **Verificación**: Copiar a `.env` y configurar valores reales

#### 1.1.2: Database & Models (1.5 horas)

- [ ] **Crear `migrations/001_initial_schema.sql`**
  ```sql
  -- [ ] CREATE TABLE users
    - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    - email VARCHAR(255) UNIQUE NOT NULL
    - password_hash VARCHAR(255)
    - first_name VARCHAR(100)
    - last_name VARCHAR(100)
    - phone VARCHAR(20)
    - role VARCHAR(50) NOT NULL DEFAULT 'agent'
    - status VARCHAR(20) DEFAULT 'active'
    - email_verified BOOLEAN DEFAULT false
    - two_factor_enabled BOOLEAN DEFAULT false
    - two_factor_secret VARCHAR(255)
    - created_at TIMESTAMP DEFAULT NOW()
    - updated_at TIMESTAMP DEFAULT NOW()
    - last_login_at TIMESTAMP
    - metadata JSONB

  -- [ ] CREATE TABLE oauth_identities
    - id UUID PRIMARY KEY
    - user_id UUID REFERENCES users(id) ON DELETE CASCADE
    - provider VARCHAR(50) NOT NULL (google, microsoft)
    - provider_user_id VARCHAR(255) NOT NULL
    - access_token TEXT
    - refresh_token TEXT
    - profile_data JSONB
    - created_at TIMESTAMP
    - UNIQUE(provider, provider_user_id)

  -- [ ] CREATE TABLE sessions
    - id UUID PRIMARY KEY
    - user_id UUID REFERENCES users(id) ON DELETE CASCADE
    - ip_address VARCHAR(45)
    - user_agent TEXT
    - created_at TIMESTAMP
    - expires_at TIMESTAMP
    - last_activity_at TIMESTAMP

  -- [ ] CREATE TABLE refresh_tokens
    - id UUID PRIMARY KEY
    - user_id UUID REFERENCES users(id) ON DELETE CASCADE
    - token VARCHAR(500) UNIQUE NOT NULL
    - expires_at TIMESTAMP NOT NULL
    - created_at TIMESTAMP
    - revoked BOOLEAN DEFAULT false

  -- [ ] CREATE TABLE audit_logs
    - id UUID PRIMARY KEY
    - user_id UUID REFERENCES users(id)
    - action VARCHAR(100) NOT NULL
    - resource_type VARCHAR(100)
    - resource_id VARCHAR(255)
    - ip_address VARCHAR(45)
    - user_agent TEXT
    - changes JSONB
    - created_at TIMESTAMP DEFAULT NOW()

  -- [ ] CREATE INDEXes
    - idx_users_email ON users(email)
    - idx_oauth_provider ON oauth_identities(provider, provider_user_id)
    - idx_sessions_user ON sessions(user_id)
    - idx_refresh_tokens_user ON refresh_tokens(user_id)
    - idx_audit_logs_user ON audit_logs(user_id)
    - idx_audit_logs_created ON audit_logs(created_at)
  ```
  - **Verificación**: SQL ejecuta sin errores en PostgreSQL

- [ ] **Crear `seeds/dev_users.sql`**
  ```sql
  -- [ ] Admin user
  -- [ ] 3 Agent users
  -- [ ] 2 Supervisor users
  -- [ ] 1 Customer user
  ```
  - [ ] Passwords: bcrypt hash de "password123"
  - [ ] Emails: admin@aintech.com, agent1@aintech.com, etc.
  - [ ] Roles correctos
  - [ ] Email verified = true para dev
  - **Verificación**: 7 usuarios insertados correctamente

- [ ] **Crear `src/models/user.model.ts`**
  - [ ] Type UserRow = database row interface
  - [ ] Class UserModel
  - [ ] `static async findById(id: string): Promise<User | null>`
  - [ ] `static async findByEmail(email: string): Promise<User | null>`
  - [ ] `static async create(data: CreateUserData): Promise<User>`
  - [ ] `static async update(id: string, data: UpdateUserData): Promise<User>`
  - [ ] `static async delete(id: string): Promise<void>`
  - [ ] `static async updateLastLogin(id: string): Promise<void>`
  - [ ] `static async enable2FA(id: string, secret: string): Promise<void>`
  - [ ] `static async disable2FA(id: string): Promise<void>`
  - [ ] Usar pool de db importado desde index.ts
  - **Verificación**: CRUD operations funcionan correctamente

- [ ] **Script de migración**
  - [ ] Crear `scripts/migrate.ts`
  - [ ] Leer archivos .sql de migrations/
  - [ ] Ejecutar en orden
  - [ ] Añadir a package.json: `"migrate": "ts-node scripts/migrate.ts"`
  - **Verificación**: `npm run migrate` crea todas las tablas

- [ ] **Script de seed**
  - [ ] Crear `scripts/seed.ts`
  - [ ] Leer seeds/*.sql
  - [ ] Ejecutar
  - [ ] Añadir a package.json: `"seed": "ts-node scripts/seed.ts"`
  - **Verificación**: `npm run seed` inserta usuarios de prueba

#### 1.1.3: Services Layer (2 horas)

- [ ] **Crear `src/services/jwt.service.ts`**
  - [ ] Importar jsonwebtoken
  - [ ] `generateAccessToken(user: User): string`
    - [ ] Payload: { userId, email, role }
    - [ ] ExpiresIn: 15m
    - [ ] Sign con JWT_SECRET
  - [ ] `generateRefreshToken(user: User): string`
    - [ ] Payload: { userId }
    - [ ] ExpiresIn: 7d
    - [ ] Sign con JWT_REFRESH_SECRET
  - [ ] `verifyAccessToken(token: string): TokenPayload`
    - [ ] jwt.verify con JWT_SECRET
    - [ ] Return decoded payload
  - [ ] `verifyRefreshToken(token: string): TokenPayload`
    - [ ] jwt.verify con JWT_REFRESH_SECRET
    - [ ] Return decoded payload
  - [ ] `saveRefreshToken(userId: string, token: string): Promise<void>`
    - [ ] INSERT en refresh_tokens table
    - [ ] expires_at = NOW() + 7 days
  - [ ] `revokeRefreshToken(token: string): Promise<void>`
    - [ ] UPDATE refresh_tokens SET revoked = true
  - **Verificación**: Generar y verificar tokens exitosamente

- [ ] **Crear `src/services/auth.service.ts`**
  - [ ] Importar UserModel, password utils, jwt service
  - [ ] `async login(email: string, password: string): Promise<AuthResult>`
    - [ ] Buscar user por email
    - [ ] Si no existe: throw "Invalid credentials"
    - [ ] Comparar password con hash
    - [ ] Si no coincide: throw "Invalid credentials"
    - [ ] Si 2FA enabled: return { requires2FA: true, tempToken }
    - [ ] Generar access + refresh tokens
    - [ ] Guardar refresh token en DB
    - [ ] Update last_login_at
    - [ ] Return { user, accessToken, refreshToken }
  - [ ] `async register(data: RegisterData): Promise<User>`
    - [ ] Validar email no existe
    - [ ] Hash password
    - [ ] Create user con UserModel
    - [ ] Enviar email verificación (placeholder)
    - [ ] Return user
  - [ ] `async logout(refreshToken: string): Promise<void>`
    - [ ] Revoke refresh token
    - [ ] Delete session si existe
  - [ ] `async refreshAccessToken(refreshToken: string): Promise<AuthResult>`
    - [ ] Verify refresh token
    - [ ] Check no está revoked en DB
    - [ ] Get user by ID
    - [ ] Generate new access token
    - [ ] Return { user, accessToken }
  - [ ] `async forgotPassword(email: string): Promise<void>`
    - [ ] Find user by email
    - [ ] Generate reset token (JWT con expires 1h)
    - [ ] Save en Redis: key=resetToken, value=userId, expire=1h
    - [ ] Enviar email con link (placeholder)
  - [ ] `async resetPassword(token: string, newPassword: string): Promise<void>`
    - [ ] Verify reset token
    - [ ] Get userId desde Redis
    - [ ] Hash new password
    - [ ] Update user password
    - [ ] Delete reset token de Redis
  - **Verificación**: Todos los flujos de auth funcionan

- [ ] **Crear `src/services/oauth.service.ts`**
  - [ ] `async googleLogin(profile: GoogleProfile): Promise<AuthResult>`
    - [ ] Buscar oauth_identity por provider_user_id
    - [ ] Si existe: get user, generate tokens, return
    - [ ] Si no existe:
      - [ ] Buscar user por email
      - [ ] Si no existe: create new user
      - [ ] Create oauth_identity
      - [ ] Generate tokens
      - [ ] Return result
  - [ ] `async microsoftLogin(profile: MicrosoftProfile): Promise<AuthResult>`
    - [ ] Same logic que Google
  - [ ] `async linkOAuthAccount(userId: string, provider: string, profile: any): Promise<void>`
    - [ ] Insert oauth_identity
    - [ ] Update profile_data
  - [ ] `async unlinkOAuthAccount(userId: string, provider: string): Promise<void>`
    - [ ] Delete oauth_identity
  - **Verificación**: OAuth login flow completo funciona

- [ ] **Crear `src/services/twoFactor.service.ts`**
  - [ ] Importar speakeasy, qrcode
  - [ ] `generateSecret(): { secret: string, qrCodeUrl: string }`
    - [ ] speakeasy.generateSecret()
    - [ ] Generate QR code data URL
    - [ ] Return both
  - [ ] `verifyToken(secret: string, token: string): boolean`
    - [ ] speakeasy.verify({ secret, token, encoding: 'base32' })
    - [ ] Return boolean
  - [ ] `async enable2FA(userId: string, token: string): Promise<string>`
    - [ ] Get user
    - [ ] Generate secret
    - [ ] Verify token against secret
    - [ ] Si válido: save secret, enable 2FA en user
    - [ ] Return QR code URL
  - [ ] `async disable2FA(userId: string, token: string): Promise<void>`
    - [ ] Get user
    - [ ] Verify token
    - [ ] Si válido: disable 2FA, clear secret
  - [ ] `async verify2FAToken(userId: string, token: string): Promise<boolean>`
    - [ ] Get user 2FA secret
    - [ ] Verify token
    - [ ] Return result
  - **Verificación**: 2FA enable/verify/disable funciona

#### 1.1.4: Middleware (30 min)

- [ ] **Crear `src/middleware/auth.middleware.ts`**
  - [ ] `authenticate(req, res, next)`
    - [ ] Extract token de Authorization header
    - [ ] Si no hay token: 401 Unauthorized
    - [ ] Verify token con jwtService
    - [ ] Si inválido: 401 Invalid token
    - [ ] Load user desde DB
    - [ ] Set req.user = user
    - [ ] Call next()
  - **Verificación**: Protected routes requieren token válido

- [ ] **Crear `src/middleware/rbac.middleware.ts`**
  - [ ] `requireRole(...roles: string[])`
    - [ ] Return middleware function
    - [ ] Check req.user.role in roles
    - [ ] Si no: 403 Forbidden
    - [ ] Si sí: next()
  - [ ] `requirePermission(...permissions: string[])`
    - [ ] Return middleware function
    - [ ] Check user permissions (from role)
    - [ ] Si no tiene: 403 Forbidden
    - [ ] Si tiene: next()
  - **Verificación**: Admin-only routes bloquean non-admins

- [ ] **Crear `src/middleware/errorHandler.ts`**
  - [ ] Export error handler middleware
  - [ ] Catch all errors
  - [ ] Log error con winston
  - [ ] Return formatted JSON response
  - [ ] Status code según error type
  - [ ] No exponer stack trace en production
  - **Verificación**: Errors devuelven JSON estructurado

#### 1.1.5: Controllers & Routes (2 horas)

- [ ] **Crear `src/controllers/auth.controller.ts`**
  - [ ] `async login(req, res, next)`
    - [ ] Validate input con Zod
    - [ ] Call authService.login()
    - [ ] Return { success: true, data: { user, accessToken, refreshToken } }
    - [ ] Catch errors y pasar a next(error)
  - [ ] `async register(req, res, next)`
    - [ ] Validate input
    - [ ] Call authService.register()
    - [ ] Return 201 Created con user
  - [ ] `async logout(req, res, next)`
    - [ ] Get refreshToken de body
    - [ ] Call authService.logout()
    - [ ] Return 204 No Content
  - [ ] `async refresh(req, res, next)`
    - [ ] Get refreshToken
    - [ ] Call authService.refreshAccessToken()
    - [ ] Return new accessToken
  - [ ] `async me(req, res, next)`
    - [ ] Return req.user (from authenticate middleware)
  - [ ] `async forgotPassword(req, res, next)`
    - [ ] Validate email
    - [ ] Call authService.forgotPassword()
    - [ ] Return success message
  - [ ] `async resetPassword(req, res, next)`
    - [ ] Validate token + newPassword
    - [ ] Call authService.resetPassword()
    - [ ] Return success message
  - [ ] `async googleCallback(req, res, next)`
    - [ ] Get profile desde passport
    - [ ] Call oauthService.googleLogin()
    - [ ] Return tokens
  - [ ] `async microsoftCallback(req, res, next)`
    - [ ] Same que Google
  - [ ] `async enable2FA(req, res, next)`
    - [ ] Get userId desde req.user
    - [ ] Call twoFactorService.enable2FA()
    - [ ] Return { secret, qrCodeUrl }
  - [ ] `async verify2FA(req, res, next)`
    - [ ] Get token desde body
    - [ ] Call twoFactorService.verify2FAToken()
    - [ ] Return success/failure
  - [ ] `async disable2FA(req, res, next)`
    - [ ] Get token desde body
    - [ ] Call twoFactorService.disable2FA()
    - [ ] Return success
  - **Verificación**: Todos los controllers funcionan con mock data

- [ ] **Crear `src/routes/auth.routes.ts`**
  - [ ] Import express Router, controller, middlewares
  - [ ] `POST /login` → controller.login
  - [ ] `POST /register` → controller.register
  - [ ] `POST /logout` → authenticate → controller.logout
  - [ ] `POST /refresh` → controller.refresh
  - [ ] `GET /me` → authenticate → controller.me
  - [ ] `POST /forgot-password` → controller.forgotPassword
  - [ ] `POST /reset-password` → controller.resetPassword
  - [ ] `GET /google` → passport.authenticate('google')
  - [ ] `GET /google/callback` → passport.authenticate('google') → controller.googleCallback
  - [ ] `GET /microsoft` → passport.authenticate('microsoft')
  - [ ] `GET /microsoft/callback` → passport.authenticate('microsoft') → controller.microsoftCallback
  - [ ] `POST /2fa/enable` → authenticate → controller.enable2FA
  - [ ] `POST /2fa/verify` → authenticate → controller.verify2FA
  - [ ] `POST /2fa/disable` → authenticate → controller.disable2FA
  - [ ] Export router
  - **Verificación**: Todas las rutas registradas correctamente

#### 1.1.6: Testing & Integration (1 hora)

- [ ] **Crear `tests/auth.test.ts`**
  - [ ] Test register user
  - [ ] Test login con credentials válidos
  - [ ] Test login con credentials inválidos
  - [ ] Test refresh token
  - [ ] Test logout
  - [ ] Test protected route sin token → 401
  - [ ] Test protected route con token válido → 200
  - [ ] Test 2FA enable/verify/disable flow
  - **Verificación**: All tests pass

- [ ] **Añadir a package.json**
  - [ ] `"test": "jest --watchAll=false"`
  - [ ] `"test:watch": "jest --watch"`
  - [ ] `"test:coverage": "jest --coverage"`
  - **Verificación**: `npm test` ejecuta sin errores

- [ ] **Documentar endpoints**
  - [ ] Crear `docs/API.md`
  - [ ] Documentar todos los endpoints
  - [ ] Request/Response examples
  - [ ] Error codes
  - **Verificación**: Documentación completa y clara

### ✅ Verificación Final Fase 1.1

- [ ] `npm run migrate` crea todas las tablas
- [ ] `npm run seed` inserta usuarios de prueba
- [ ] `npm run dev` inicia servidor sin errores
- [ ] POST /auth/login retorna tokens válidos
- [ ] GET /auth/me con token retorna user data
- [ ] OAuth Google/Microsoft funciona
- [ ] 2FA enable/verify funciona
- [ ] Todos los tests pasan
- [ ] Zero TypeScript errors
- [ ] Logs aparecen correctamente en Winston

---

## 📦 1.2: ait-core-soriano (ERP/CRM Service)

**Estado**: 0% completado
**Tiempo estimado**: 2-3 días
**Prioridad**: CRÍTICA

### Checklist de Implementación

#### 1.2.1: Project Setup (30 min)

- [ ] **Crear directorio**
  - [ ] `mkdir -p services/ait-core-soriano/src`

- [ ] **Crear `package.json`**
  ```json
  {
    "name": "@aintech/ait-core-soriano",
    "version": "1.0.0",
    "main": "dist/index.js",
    "scripts": {
      "dev": "ts-node-dev --respawn src/index.ts",
      "build": "tsc",
      "start": "node dist/index.js",
      "migrate": "ts-node scripts/migrate.ts",
      "seed": "ts-node scripts/seed.ts"
    },
    "dependencies": {
      "express": "^4.18.2",
      "pg": "^8.11.3",
      "ioredis": "^5.3.2",
      "dotenv": "^16.3.1",
      "cors": "^2.8.5",
      "helmet": "^7.1.0",
      "compression": "^1.7.4",
      "express-rate-limit": "^7.1.5",
      "winston": "^3.11.0",
      "zod": "^3.22.4",
      "@ait-core/shared": "workspace:*",
      "prom-client": "^15.1.0",
      "bull": "^4.11.5",
      "axios": "^1.6.2"
    },
    "devDependencies": {
      "@types/express": "^4.17.21",
      "@types/node": "^20.10.5",
      "@types/cors": "^2.8.17",
      "@types/compression": "^1.7.5",
      "typescript": "^5.3.3",
      "ts-node": "^10.9.2",
      "ts-node-dev": "^2.0.0"
    }
  }
  ```
  - **Verificación**: package.json válido

- [ ] **Crear `tsconfig.json`**
  - [ ] Copiar config desde ait-authenticator
  - [ ] Ajustar outDir a "dist"
  - **Verificación**: tsc compila sin errores

#### 1.2.2: Database Schema (2 horas)

- [ ] **Crear `migrations/001_customers.sql`**
  ```sql
  CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Personal info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    mobile VARCHAR(20),
    dni VARCHAR(20),
    birth_date DATE,

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(10),
    country VARCHAR(2) DEFAULT 'ES',

    -- Business info
    company_name VARCHAR(255),
    tax_id VARCHAR(50),

    -- Status
    status VARCHAR(20) DEFAULT 'active',
    segment VARCHAR(50),
    lead_source VARCHAR(100),

    -- Metadata
    tags TEXT[],
    notes TEXT,
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,

    -- Indexes
    CONSTRAINT customers_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
  );

  CREATE INDEX idx_customers_email ON customers(email);
  CREATE INDEX idx_customers_phone ON customers(phone);
  CREATE INDEX idx_customers_dni ON customers(dni);
  CREATE INDEX idx_customers_status ON customers(status);
  CREATE INDEX idx_customers_created ON customers(created_at);
  ```

- [ ] **Crear `migrations/002_policies.sql`**
  ```sql
  CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

    -- Policy info
    policy_number VARCHAR(100) UNIQUE NOT NULL,
    policy_type VARCHAR(50) NOT NULL, -- auto, home, life, health, business
    carrier VARCHAR(100) NOT NULL, -- Mapfre, AXA, Allianz, etc.

    -- Coverage
    coverage_start_date DATE NOT NULL,
    coverage_end_date DATE NOT NULL,
    premium_amount DECIMAL(10,2) NOT NULL,
    premium_frequency VARCHAR(20), -- monthly, quarterly, annual
    coverage_amount DECIMAL(12,2),

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, expired, cancelled, pending
    cancellation_reason VARCHAR(255),
    cancelled_at TIMESTAMP,

    -- Vehicle (if auto policy)
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    vehicle_plate VARCHAR(20),
    vehicle_vin VARCHAR(50),

    -- Property (if home policy)
    property_address VARCHAR(255),
    property_type VARCHAR(50),
    property_value DECIMAL(12,2),

    -- Documents
    policy_document_url VARCHAR(500),
    certificate_url VARCHAR(500),

    -- Metadata
    metadata JSONB,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
  );

  CREATE INDEX idx_policies_customer ON policies(customer_id);
  CREATE INDEX idx_policies_number ON policies(policy_number);
  CREATE INDEX idx_policies_type ON policies(policy_type);
  CREATE INDEX idx_policies_status ON policies(status);
  CREATE INDEX idx_policies_dates ON policies(coverage_start_date, coverage_end_date);
  ```

- [ ] **Crear `migrations/003_claims.sql`**
  ```sql
  CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    policy_id UUID REFERENCES policies(id),

    -- Claim info
    claim_number VARCHAR(100) UNIQUE NOT NULL,
    claim_type VARCHAR(50) NOT NULL,
    incident_date TIMESTAMP NOT NULL,
    reported_date TIMESTAMP DEFAULT NOW(),

    -- Description
    description TEXT NOT NULL,
    location VARCHAR(255),

    -- Financial
    claimed_amount DECIMAL(10,2),
    approved_amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2),

    -- Status
    status VARCHAR(20) DEFAULT 'reported', -- reported, investigating, approved, denied, paid
    denial_reason VARCHAR(255),

    -- Assignment
    adjuster_id UUID,

    -- Documents
    documents JSONB, -- [{name, url, type, uploadedAt}]

    -- Metadata
    metadata JSONB,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
  );

  CREATE INDEX idx_claims_customer ON claims(customer_id);
  CREATE INDEX idx_claims_policy ON claims(policy_id);
  CREATE INDEX idx_claims_status ON claims(status);
  CREATE INDEX idx_claims_number ON claims(claim_number);
  ```

- [ ] **Crear `migrations/004_quotes.sql`**
  ```sql
  CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),

    -- Quote info
    quote_number VARCHAR(100) UNIQUE NOT NULL,
    quote_type VARCHAR(50) NOT NULL,

    -- Coverage details
    coverage_details JSONB NOT NULL,

    -- Pricing
    base_premium DECIMAL(10,2) NOT NULL,
    discounts JSONB, -- [{type, amount, description}]
    surcharges JSONB,
    total_premium DECIMAL(10,2) NOT NULL,

    -- Comparison
    carrier_quotes JSONB, -- [{carrier, premium, coverage, link}]

    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
    valid_until TIMESTAMP,

    -- Conversion
    converted BOOLEAN DEFAULT false,
    policy_id UUID REFERENCES policies(id),
    converted_at TIMESTAMP,

    -- Metadata
    metadata JSONB,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID
  );

  CREATE INDEX idx_quotes_customer ON quotes(customer_id);
  CREATE INDEX idx_quotes_status ON quotes(status);
  CREATE INDEX idx_quotes_number ON quotes(quote_number);
  ```

- [ ] **Crear `migrations/005_interactions.sql`**
  ```sql
  CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),

    -- Interaction info
    type VARCHAR(50) NOT NULL, -- call, email, sms, whatsapp, meeting, chat
    direction VARCHAR(20), -- inbound, outbound
    channel VARCHAR(50),

    -- Content
    subject VARCHAR(255),
    description TEXT,
    outcome VARCHAR(100),

    -- Contact
    duration INTEGER, -- seconds (for calls)
    recording_url VARCHAR(500),

    -- References
    call_sid VARCHAR(100),
    policy_id UUID REFERENCES policies(id),
    claim_id UUID REFERENCES claims(id),
    quote_id UUID REFERENCES quotes(id),

    -- Assignment
    agent_id UUID NOT NULL,

    -- Metadata
    metadata JSONB,
    tags TEXT[],

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    scheduled_at TIMESTAMP
  );

  CREATE INDEX idx_interactions_customer ON interactions(customer_id);
  CREATE INDEX idx_interactions_agent ON interactions(agent_id);
  CREATE INDEX idx_interactions_type ON interactions(type);
  CREATE INDEX idx_interactions_created ON interactions(created_at);
  ```

- [ ] **Crear `migrations/006_tasks.sql`**
  ```sql
  CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Task info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent

    -- Assignment
    assigned_to UUID,
    created_by UUID,

    -- References
    customer_id UUID REFERENCES customers(id),
    policy_id UUID REFERENCES policies(id),
    claim_id UUID REFERENCES claims(id),
    quote_id UUID REFERENCES quotes(id),

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, cancelled

    -- Dates
    due_date TIMESTAMP,
    completed_at TIMESTAMP,

    -- Metadata
    metadata JSONB,
    tags TEXT[],

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
  CREATE INDEX idx_tasks_status ON tasks(status);
  CREATE INDEX idx_tasks_due_date ON tasks(due_date);
  CREATE INDEX idx_tasks_customer ON tasks(customer_id);
  ```

- [ ] **Crear `migrations/007_workflows.sql`**
  ```sql
  CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Workflow info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL, -- manual, event, scheduled
    trigger_config JSONB,

    -- Steps
    steps JSONB NOT NULL, -- [{type, action, config, conditions}]

    -- Status
    active BOOLEAN DEFAULT true,

    -- Stats
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID
  );

  CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id),

    -- Execution info
    status VARCHAR(20), -- running, completed, failed
    trigger_data JSONB,

    -- Results
    steps_completed INTEGER DEFAULT 0,
    steps_total INTEGER,
    error_message TEXT,
    results JSONB,

    -- Timestamps
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
  );

  CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
  CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
  ```

- [ ] **Verificación migración completa**
  - [ ] Ejecutar migrations en orden
  - [ ] Verificar todas las tablas creadas
  - [ ] Verificar todos los índices
  - [ ] Verificar foreign keys

#### 1.2.3: Seeds Data (1 hora)

- [ ] **Crear `seeds/001_customers.sql`**
  - [ ] 50 customers de ejemplo
  - [ ] Variedad de segmentos
  - [ ] Mix de personal y business
  - **Verificación**: 50 customers insertados

- [ ] **Crear `seeds/002_policies.sql`**
  - [ ] 100 policies de ejemplo
  - [ ] Mix de tipos (auto 40%, home 30%, life 20%, health 10%)
  - [ ] Varios carriers
  - [ ] Diferentes estados
  - **Verificación**: 100 policies insertadas

- [ ] **Crear `seeds/003_claims.sql`**
  - [ ] 30 claims de ejemplo
  - [ ] Diferentes estados
  - [ ] Linked a policies
  - **Verificación**: 30 claims insertados

- [ ] **Crear `seeds/004_quotes.sql`**
  - [ ] 40 quotes de ejemplo
  - [ ] Algunos convertidos, algunos expirados
  - **Verificación**: 40 quotes insertados

#### 1.2.4: Models Layer (2 horas)

- [ ] **Crear `src/models/customer.model.ts`**
  - [ ] `findById(id: string): Promise<Customer | null>`
  - [ ] `findByEmail(email: string): Promise<Customer | null>`
  - [ ] `findByDNI(dni: string): Promise<Customer | null>`
  - [ ] `search(query: string, filters: any): Promise<Customer[]>`
  - [ ] `create(data: CreateCustomerData): Promise<Customer>`
  - [ ] `update(id: string, data: UpdateCustomerData): Promise<Customer>`
  - [ ] `delete(id: string): Promise<void>`
  - [ ] `getStats(customerId: string): Promise<CustomerStats>`
  - **Verificación**: All CRUD operations work

- [ ] **Crear `src/models/policy.model.ts`**
  - [ ] `findById(id: string): Promise<Policy | null>`
  - [ ] `findByCustomer(customerId: string): Promise<Policy[]>`
  - [ ] `findByNumber(policyNumber: string): Promise<Policy | null>`
  - [ ] `search(filters: PolicyFilters): Promise<Policy[]>`
  - [ ] `create(data: CreatePolicyData): Promise<Policy>`
  - [ ] `update(id: string, data: UpdatePolicyData): Promise<Policy>`
  - [ ] `cancel(id: string, reason: string): Promise<void>`
  - [ ] `renew(id: string, newEndDate: Date): Promise<Policy>`
  - [ ] `getExpiringPolicies(days: number): Promise<Policy[]>`
  - **Verificación**: All operations work

- [ ] **Crear `src/models/claim.model.ts`**
  - [ ] `findById(id: string): Promise<Claim | null>`
  - [ ] `findByCustomer(customerId: string): Promise<Claim[]>`
  - [ ] `findByPolicy(policyId: string): Promise<Claim[]>`
  - [ ] `findByNumber(claimNumber: string): Promise<Claim | null>`
  - [ ] `search(filters: ClaimFilters): Promise<Claim[]>`
  - [ ] `create(data: CreateClaimData): Promise<Claim>`
  - [ ] `update(id: string, data: UpdateClaimData): Promise<Claim>`
  - [ ] `updateStatus(id: string, status: string, note: string): Promise<Claim>`
  - [ ] `approve(id: string, amount: number): Promise<Claim>`
  - [ ] `deny(id: string, reason: string): Promise<Claim>`
  - **Verificación**: Claim lifecycle works

- [ ] **Crear `src/models/quote.model.ts`**
  - [ ] `findById(id: string): Promise<Quote | null>`
  - [ ] `findByCustomer(customerId: string): Promise<Quote[]>`
  - [ ] `findByNumber(quoteNumber: string): Promise<Quote | null>`
  - [ ] `create(data: CreateQuoteData): Promise<Quote>`
  - [ ] `update(id: string, data: UpdateQuoteData): Promise<Quote>`
  - [ ] `convert(id: string, policyData: any): Promise<Policy>`
  - [ ] `expire(id: string): Promise<void>`
  - [ ] `getExpiredQuotes(): Promise<Quote[]>`
  - **Verificación**: Quote to policy conversion works

- [ ] **Crear `src/models/interaction.model.ts`**
  - [ ] `findById(id: string): Promise<Interaction | null>`
  - [ ] `findByCustomer(customerId: string): Promise<Interaction[]>`
  - [ ] `findByAgent(agentId: string): Promise<Interaction[]>`
  - [ ] `create(data: CreateInteractionData): Promise<Interaction>`
  - [ ] `update(id: string, data: UpdateInteractionData): Promise<Interaction>`
  - [ ] `getTimeline(customerId: string): Promise<Interaction[]>`
  - **Verificación**: Timeline chronological order

- [ ] **Crear `src/models/task.model.ts`**
  - [ ] `findById(id: string): Promise<Task | null>`
  - [ ] `findByAssignee(userId: string): Promise<Task[]>`
  - [ ] `findOverdue(): Promise<Task[]>`
  - [ ] `findDueToday(): Promise<Task[]>`
  - [ ] `create(data: CreateTaskData): Promise<Task>`
  - [ ] `update(id: string, data: UpdateTaskData): Promise<Task>`
  - [ ] `complete(id: string): Promise<Task>`
  - [ ] `cancel(id: string): Promise<Task>`
  - **Verificación**: Task filtering works

#### 1.2.5: Services Layer (3 horas)

- [ ] **Crear `src/services/customer.service.ts`**
  - [ ] Business logic sobre CustomerModel
  - [ ] `createCustomer()` - validaciones extra
  - [ ] `mergeCustomers()` - merge duplicates
  - [ ] `segmentCustomer()` - auto-segment logic
  - [ ] `calculateLifetimeValue()` - LTV calculation
  - [ ] Event emission a event bus
  - **Verificación**: Business rules enforced

- [ ] **Crear `src/services/policy.service.ts`**
  - [ ] `createPolicy()` - validaciones
  - [ ] `renewPolicy()` - auto-renew logic
  - [ ] `cancelPolicy()` - cancellation workflow
  - [ ] `calculatePremium()` - pricing logic
  - [ ] `checkCoverage()` - coverage validation
  - [ ] Event emission
  - **Verificación**: Policy lifecycle complete

- [ ] **Crear `src/services/claim.service.ts`**
  - [ ] `createClaim()` - auto-assign adjuster
  - [ ] `processCllaim()` - workflow automation
  - [ ] `approveClaim()` - approval workflow
  - [ ] `denyClaim()` - denial workflow
  - [ ] `payClaim()` - payment integration (placeholder)
  - [ ] Fraud detection check (placeholder)
  - [ ] Event emission
  - **Verificación**: Claim workflow works

- [ ] **Crear `src/services/quote.service.ts`**
  - [ ] `createQuote()` - pricing calculation
  - [ ] `compareCarriers()` - multi-carrier comparison
  - [ ] `applyDiscounts()` - discount engine
  - [ ] `convertToPolicy()` - quote → policy
  - [ ] `sendQuoteEmail()` - email integration (placeholder)
  - [ ] Event emission
  - **Verificación**: Quote generation works

- [ ] **Crear `src/services/workflow.service.ts`**
  - [ ] `createWorkflow()` - workflow definition
  - [ ] `executeWorkflow()` - workflow execution
  - [ ] `executeStep()` - individual step execution
  - [ ] Step types:
    - [ ] send_email
    - [ ] create_task
    - [ ] update_record
    - [ ] call_webhook
    - [ ] wait_duration
    - [ ] condition_check
  - [ ] Event emission
  - **Verificación**: Basic workflow executes

#### 1.2.6: Controllers & Routes (2 horas)

- [ ] **Controllers**
  - [ ] `src/controllers/customer.controller.ts`
    - [ ] list, get, create, update, delete
    - [ ] search, stats, timeline
  - [ ] `src/controllers/policy.controller.ts`
    - [ ] list, get, create, update, cancel, renew
    - [ ] search, expiring
  - [ ] `src/controllers/claim.controller.ts`
    - [ ] list, get, create, update, approve, deny
  - [ ] `src/controllers/quote.controller.ts`
    - [ ] list, get, create, update, convert
  - [ ] `src/controllers/interaction.controller.ts`
    - [ ] list, get, create
  - [ ] `src/controllers/task.controller.ts`
    - [ ] list, get, create, update, complete, cancel
  - [ ] `src/controllers/workflow.controller.ts`
    - [ ] list, get, create, update, execute

- [ ] **Routes**
  - [ ] `src/routes/customer.routes.ts`
  - [ ] `src/routes/policy.routes.ts`
  - [ ] `src/routes/claim.routes.ts`
  - [ ] `src/routes/quote.routes.ts`
  - [ ] `src/routes/interaction.routes.ts`
  - [ ] `src/routes/task.routes.ts`
  - [ ] `src/routes/workflow.routes.ts`

- [ ] **Main server `src/index.ts`**
  - [ ] Express setup
  - [ ] Middleware (cors, helmet, compression, auth)
  - [ ] Route registration
  - [ ] Error handler
  - [ ] Database connection
  - [ ] Redis connection
  - [ ] Event bus setup
  - [ ] Prometheus metrics
  - [ ] Health check endpoint
  - **Verificación**: Server starts without errors

#### 1.2.7: Event Bus Integration (1 hora)

- [ ] **Event Publishers**
  - [ ] customer.created
  - [ ] customer.updated
  - [ ] customer.deleted
  - [ ] policy.created
  - [ ] policy.renewed
  - [ ] policy.cancelled
  - [ ] policy.expiring_soon
  - [ ] claim.created
  - [ ] claim.updated
  - [ ] claim.approved
  - [ ] claim.denied
  - [ ] claim.paid
  - [ ] quote.created
  - [ ] quote.converted
  - [ ] interaction.created
  - [ ] task.created
  - [ ] task.completed

- [ ] **Event Consumers**
  - [ ] Escuchar policy.expiring_soon → create renewal task
  - [ ] Escuchar claim.created → auto-assign adjuster
  - [ ] Escuchar quote.created → send quote email
  - [ ] Escuchar customer.created → create welcome task
  - **Verificación**: Events flow correctly

#### 1.2.8: Testing (2 horas)

- [ ] **Unit tests**
  - [ ] Customer service tests
  - [ ] Policy service tests
  - [ ] Claim service tests
  - [ ] Quote service tests
  - **Verificación**: All unit tests pass

- [ ] **Integration tests**
  - [ ] Customer CRUD flow
  - [ ] Policy lifecycle
  - [ ] Claim workflow
  - [ ] Quote to policy conversion
  - **Verificación**: All integration tests pass

### ✅ Verificación Final Fase 1.2

- [ ] `npm run migrate` crea 7 tablas
- [ ] `npm run seed` inserta 220+ records
- [ ] `npm run dev` starts server on port 3005
- [ ] GET /customers returns lista de customers
- [ ] POST /customers creates new customer
- [ ] GET /policies/:id returns policy details
- [ ] POST /claims creates new claim
- [ ] POST /quotes/convert converts quote to policy
- [ ] Events se publican correctamente
- [ ] All tests pass
- [ ] TypeScript compiles sin errores

---

## 📦 1.3: Database Migrations & Seeds Scripts

**Tiempo estimado**: 1 hora

### Checklist

- [ ] **Crear script unificado de migración**
  - [ ] `scripts/migrate-all.ts`
  - [ ] Lee todas las migrations de todos los servicios
  - [ ] Ejecuta en orden correcto
  - [ ] Tracking de migrations aplicadas
  - [ ] Rollback support
  - **Verificación**: Migración completa funciona

- [ ] **Crear script unificado de seeds**
  - [ ] `scripts/seed-all.ts`
  - [ ] Ejecuta seeds de todos los servicios
  - [ ] Orden correcto (auth → erp)
  - [ ] Idempotente
  - **Verificación**: Seed completo funciona

- [ ] **npm scripts en root package.json**
  - [ ] `"db:migrate": "ts-node scripts/migrate-all.ts"`
  - [ ] `"db:seed": "ts-node scripts/seed-all.ts"`
  - [ ] `"db:reset": "npm run db:migrate && npm run db:seed"`
  - **Verificación**: Scripts ejecutan correctamente

### ✅ Verificación Final Fase 1

- [ ] ait-authenticator 100% completo
- [ ] ait-core-soriano 100% completo
- [ ] Migrations & seeds funcionan
- [ ] Todos los servicios arrancan sin errores
- [ ] Event bus conectado
- [ ] Authentication funciona end-to-end
- [ ] Customer/Policy CRUD funciona
- [ ] Ready para Fase 2

---

# FASE 2: Telephony & Omnichannel

## 📦 2.1: ait-comms-telephony (Twilio Integration)

**Tiempo estimado**: 2-3 días
**Prioridad**: ALTA

### Checklist de Implementación

#### 2.1.1: Project Setup (30 min)

- [ ] Crear estructura de proyecto
- [ ] package.json con dependencies:
  - [ ] twilio
  - [ ] express
  - [ ] socket.io-client (para conectar con WS server)
  - [ ] bull (queue management)
- [ ] tsconfig.json
- [ ] .env.example
  - [ ] TWILIO_ACCOUNT_SID
  - [ ] TWILIO_AUTH_TOKEN
  - [ ] TWILIO_PHONE_NUMBER
  - [ ] TWILIO_TWIML_APP_SID
  - [ ] TWILIO_API_KEY_SID
  - [ ] TWILIO_API_KEY_SECRET

#### 2.1.2: Database Schema (1 hora)

- [ ] **migrations/001_telephony.sql**
  ```sql
  CREATE TABLE calls (
    id UUID PRIMARY KEY,
    call_sid VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    agent_id UUID,
    direction VARCHAR(20),
    from_number VARCHAR(20),
    to_number VARCHAR(20),
    status VARCHAR(20),
    duration INTEGER,
    recording_url VARCHAR(500),
    transcription TEXT,
    metadata JSONB,
    created_at TIMESTAMP,
    answered_at TIMESTAMP,
    ended_at TIMESTAMP
  );

  CREATE TABLE agent_status (
    agent_id UUID PRIMARY KEY,
    status VARCHAR(20), -- available, busy, away, offline
    current_call_sid VARCHAR(100),
    last_status_change TIMESTAMP,
    capabilities JSONB
  );

  CREATE TABLE call_queue (
    id UUID PRIMARY KEY,
    call_sid VARCHAR(100),
    customer_phone VARCHAR(20),
    position INTEGER,
    priority VARCHAR(20),
    created_at TIMESTAMP,
    assigned_at TIMESTAMP,
    assigned_to UUID
  );
  ```

#### 2.1.3: Twilio Service (2 horas)

- [ ] **src/services/twilio.service.ts**
  - [ ] Initialize Twilio client
  - [ ] `generateToken(identity: string): string`
    - [ ] Create AccessToken
    - [ ] Add VoiceGrant
    - [ ] Return token string
  - [ ] `makeCall(from: string, to: string, twimlUrl: string): Promise<Call>`
    - [ ] twilio.calls.create()
    - [ ] Return call object
  - [ ] `getCallDetails(callSid: string): Promise<CallDetails>`
  - [ ] `recordCall(callSid: string): Promise<void>`
  - [ ] `pauseRecording(recordingSid: string): Promise<void>`
  - [ ] `resumeRecording(recordingSid: string): Promise<void>`
  - [ ] `hangupCall(callSid: string): Promise<void>`
  - [ ] `transferCall(callSid: string, to: string): Promise<void>`
  - [ ] `getRecording(recordingSid: string): Promise<Buffer>`
  - [ ] `getTranscription(callSid: string): Promise<string>`
  - **Verificación**: All Twilio operations work

#### 2.1.4: Call Management (2 horas)

- [ ] **src/services/call.service.ts**
  - [ ] `initiateCall(agentId, customerPhone): Promise<Call>`
    - [ ] Check agent availability
    - [ ] Create call record en DB
    - [ ] Call twilio.service.makeCall()
    - [ ] Update agent status to busy
    - [ ] Emit call.initiated event
  - [ ] `acceptCall(callSid, agentId): Promise<void>`
    - [ ] Update call record
    - [ ] Update agent status
    - [ ] Emit call.answered event
  - [ ] `endCall(callSid): Promise<void>`
    - [ ] Get call details from Twilio
    - [ ] Update call record with duration
    - [ ] Update agent status to available
    - [ ] Trigger recording/transcription
    - [ ] Emit call.ended event
  - [ ] `transferCall(callSid, targetAgentId): Promise<void>`
  - [ ] `startRecording(callSid): Promise<void>`
  - [ ] `pauseRecording(callSid): Promise<void>`
  - [ ] `muteCall(callSid): Promise<void>`
  - [ ] `holdCall(callSid): Promise<void>`
  - **Verificación**: Call lifecycle completo funciona

#### 2.1.5: Agent Management (1 hora)

- [ ] **src/services/agent.service.ts**
  - [ ] `updateStatus(agentId, status): Promise<void>`
    - [ ] Update agent_status table
    - [ ] Emit agent.status_changed event
  - [ ] `getAvailableAgents(): Promise<Agent[]>`
  - [ ] `assignCall(callSid, agentId): Promise<void>`
  - [ ] `getAgentStats(agentId): Promise<AgentStats>`
    - [ ] Total calls
    - [ ] Average duration
    - [ ] Availability percentage
  - **Verificación**: Agent status tracking works

#### 2.1.6: Queue Management (1.5 horas)

- [ ] **src/services/queue.service.ts**
  - [ ] `addToQueue(callSid, customerPhone, priority): Promise<void>`
    - [ ] Insert en call_queue
    - [ ] Calculate position
    - [ ] Emit queue.call_added
  - [ ] `getQueuePosition(callSid): Promise<number>`
  - [ ] `getNextInQueue(): Promise<QueuedCall | null>`
  - [ ] `assignNextCall(): Promise<void>`
    - [ ] Get next call
    - [ ] Find available agent
    - [ ] Assign call
    - [ ] Remove from queue
    - [ ] Emit queue.call_assigned
  - [ ] `removeFromQueue(callSid): Promise<void>`
  - [ ] Queue monitoring with Bull
    - [ ] Auto-assign job every 5 seconds
    - [ ] Escalate priority after X minutes
  - **Verificación**: Queue FIFO works correctly

#### 2.1.7: TwiML Endpoints (1 hora)

- [ ] **src/controllers/twiml.controller.ts**
  - [ ] `handleIncomingCall(req, res)`
    - [ ] Parse Twilio webhook
    - [ ] Identify customer (lookup by phone)
    - [ ] Generate TwiML
    - [ ] Add to queue if no agents available
    - [ ] Play hold music
    - [ ] Return TwiML response
  - [ ] `handleCallStatus(req, res)`
    - [ ] Parse status callback
    - [ ] Update call record
    - [ ] Emit events based on status
  - [ ] `handleRecordingStatus(req, res)`
    - [ ] Parse recording callback
    - [ ] Save recording URL
    - [ ] Trigger transcription
  - [ ] `handleDialCallback(req, res)`
    - [ ] Handle dial status
    - [ ] Update call record
  - **Verificación**: TwiML responses válidos

#### 2.1.8: WebRTC Signaling (1.5 horas)

- [ ] **src/services/webrtc.service.ts**
  - [ ] `createOffer(callId): Promise<RTCSessionDescription>`
  - [ ] `createAnswer(callId, offer): Promise<RTCSessionDescription>`
  - [ ] `addIceCandidate(callId, candidate): Promise<void>`
  - [ ] Integration con WebSocket server
    - [ ] Emit WebRTC signals via WS
    - [ ] Listen for signals from clients
  - **Verificación**: WebRTC call establecida

#### 2.1.9: Controllers & Routes (1 hora)

- [ ] **src/controllers/call.controller.ts**
  - [ ] POST /calls/initiate
  - [ ] POST /calls/:id/accept
  - [ ] POST /calls/:id/end
  - [ ] POST /calls/:id/transfer
  - [ ] POST /calls/:id/mute
  - [ ] POST /calls/:id/hold
  - [ ] POST /calls/:id/record
  - [ ] GET /calls/:id
  - [ ] GET /calls

- [ ] **src/controllers/agent.controller.ts**
  - [ ] POST /agents/status
  - [ ] GET /agents/available
  - [ ] GET /agents/:id/stats

- [ ] **src/controllers/queue.controller.ts**
  - [ ] GET /queue
  - [ ] POST /queue/assign

- [ ] **src/routes/*.ts**
  - [ ] Registrar todas las rutas
  - [ ] Authentication middleware
  - [ ] Rate limiting

- [ ] **src/index.ts**
  - [ ] Express server setup
  - [ ] Route registration
  - [ ] Twilio webhook validation
  - [ ] Error handling
  - [ ] Start server on port 3006

#### 2.1.10: Testing (2 horas)

- [ ] Test generateToken
- [ ] Test makeCall
- [ ] Test incoming call flow
- [ ] Test queue management
- [ ] Test agent status changes
- [ ] Test call transfer
- [ ] Test recording
- [ ] Integration test: complete call flow
- **Verificación**: All tests pass

### ✅ Verificación Final Fase 2.1

- [ ] Twilio client conecta correctamente
- [ ] Access token se genera
- [ ] Outbound call funciona
- [ ] Incoming call va a queue
- [ ] Agent puede acceptar call
- [ ] Recording funciona
- [ ] Call transfer funciona
- [ ] Queue management funciona
- [ ] WebRTC signaling funciona
- [ ] Todos los tests pasan

---

## 📦 2.2: Omnichannel Integration

**Tiempo estimado**: 1.5 días

### 2.2.1: WhatsApp (Twilio) - 4 horas

- [ ] **Setup**
  - [ ] Twilio WhatsApp sandbox configurado
  - [ ] Webhook URL configurada

- [ ] **Database**
  ```sql
  CREATE TABLE whatsapp_conversations (
    id UUID PRIMARY KEY,
    customer_id UUID,
    customer_phone VARCHAR(20),
    agent_id UUID,
    status VARCHAR(20),
    created_at TIMESTAMP,
    closed_at TIMESTAMP
  );

  CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY,
    conversation_id UUID,
    direction VARCHAR(20),
    from_number VARCHAR(20),
    to_number VARCHAR(20),
    body TEXT,
    media_url VARCHAR(500),
    message_sid VARCHAR(100),
    status VARCHAR(20),
    created_at TIMESTAMP
  );
  ```

- [ ] **Service**
  - [ ] `sendMessage(to, body, mediaUrl?): Promise<void>`
  - [ ] `handleIncomingMessage(webhook): Promise<void>`
    - [ ] Parse webhook
    - [ ] Find/create conversation
    - [ ] Save message
    - [ ] Emit event
    - [ ] Auto-assign agent if needed
  - [ ] `getConversation(id): Promise<Conversation>`
  - [ ] `getMessages(conversationId): Promise<Message[]>`
  - [ ] `closeConversation(id): Promise<void>`

- [ ] **Controller & Routes**
  - [ ] POST /whatsapp/send
  - [ ] POST /whatsapp/webhook
  - [ ] GET /whatsapp/conversations
  - [ ] GET /whatsapp/conversations/:id/messages

- [ ] **Testing**
  - [ ] Test send message
  - [ ] Test receive message
  - [ ] Test media handling
  - **Verificación**: WhatsApp bidirectional funciona

### 2.2.2: SMS (Twilio) - 2 horas

- [ ] **Database**
  ```sql
  CREATE TABLE sms_messages (
    id UUID PRIMARY KEY,
    customer_id UUID,
    direction VARCHAR(20),
    from_number VARCHAR(20),
    to_number VARCHAR(20),
    body TEXT,
    message_sid VARCHAR(100),
    status VARCHAR(20),
    created_at TIMESTAMP
  );
  ```

- [ ] **Service**
  - [ ] `sendSMS(to, body): Promise<void>`
  - [ ] `handleIncomingSMS(webhook): Promise<void>`
  - [ ] `getSMSHistory(customerId): Promise<SMS[]>`

- [ ] **Controller & Routes**
  - [ ] POST /sms/send
  - [ ] POST /sms/webhook
  - [ ] GET /sms/history/:customerId

- [ ] **Testing**
  - [ ] Test send SMS
  - [ ] Test receive SMS
  - **Verificación**: SMS bidirectional funciona

### 2.2.3: Email (SendGrid) - 3 horas

- [ ] **Setup**
  - [ ] SendGrid API key
  - [ ] Domain verification
  - [ ] Email templates

- [ ] **Database**
  ```sql
  CREATE TABLE emails (
    id UUID PRIMARY KEY,
    customer_id UUID,
    direction VARCHAR(20),
    from_email VARCHAR(255),
    to_email VARCHAR(255),
    subject VARCHAR(500),
    body TEXT,
    html BOOLEAN,
    attachments JSONB,
    status VARCHAR(20),
    message_id VARCHAR(255),
    created_at TIMESTAMP
  );
  ```

- [ ] **Service**
  - [ ] `sendEmail(to, subject, body, options): Promise<void>`
  - [ ] `sendTemplateEmail(to, templateId, data): Promise<void>`
  - [ ] `handleIncomingEmail(webhook): Promise<void>`
  - [ ] `getEmailThread(customerId): Promise<Email[]>`

- [ ] **Templates**
  - [ ] Welcome email
  - [ ] Quote email
  - [ ] Policy renewal reminder
  - [ ] Claim update
  - [ ] Password reset

- [ ] **Controller & Routes**
  - [ ] POST /email/send
  - [ ] POST /email/webhook
  - [ ] GET /email/thread/:customerId

- [ ] **Testing**
  - [ ] Test send email
  - [ ] Test template email
  - [ ] Test attachments
  - **Verificación**: Email sending funciona

### 2.2.4: Live Chat - 2 horas

- [ ] **Database**
  ```sql
  CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY,
    customer_id UUID,
    agent_id UUID,
    status VARCHAR(20),
    created_at TIMESTAMP,
    closed_at TIMESTAMP
  );

  CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    conversation_id UUID,
    sender_id UUID,
    sender_type VARCHAR(20),
    message TEXT,
    created_at TIMESTAMP
  );
  ```

- [ ] **Service**
  - [ ] `createConversation(customerId): Promise<Conversation>`
  - [ ] `sendMessage(conversationId, senderId, message): Promise<void>`
  - [ ] `assignAgent(conversationId, agentId): Promise<void>`
  - [ ] `closeConversation(conversationId): Promise<void>`
  - [ ] Real-time via WebSocket
    - [ ] Join conversation room
    - [ ] Emit message to room
    - [ ] Typing indicators

- [ ] **Controller & Routes**
  - [ ] POST /chat/conversations
  - [ ] POST /chat/conversations/:id/messages
  - [ ] POST /chat/conversations/:id/assign
  - [ ] POST /chat/conversations/:id/close
  - [ ] GET /chat/conversations/:id

- [ ] **WebSocket Events**
  - [ ] chat.message
  - [ ] chat.typing
  - [ ] chat.agent_joined
  - [ ] chat.closed

- [ ] **Testing**
  - [ ] Test create conversation
  - [ ] Test send message
  - [ ] Test real-time delivery
  - **Verificación**: Chat funciona en tiempo real

### ✅ Verificación Final Fase 2

- [ ] Telephony completo (VoIP, recording, queue)
- [ ] WhatsApp bidirectional
- [ ] SMS bidirectional
- [ ] Email sending/receiving
- [ ] Live chat en tiempo real
- [ ] All channels integrados con CRM
- [ ] Interactions logging funciona
- [ ] Unified inbox conceptual
- [ ] Ready para Fase 3

---

# FASE 3: Quote Engine & Scrapers

## 📦 3.1: ait-qb (Quote Engine)

**Tiempo estimado**: 1 semana
**Prioridad**: MEDIA

### Checklist resumido

- [ ] **Database schema**
  - [ ] pricing_rules table
  - [ ] discount_rules table
  - [ ] carrier_products table
  - [ ] rate_tables table

- [ ] **Pricing Engine**
  - [ ] Base premium calculation
  - [ ] Risk factors
  - [ ] Discount application
  - [ ] Surcharge application

- [ ] **Quote Comparison**
  - [ ] Multi-carrier API integration
  - [ ] Quote aggregation
  - [ ] Best price recommendation

- [ ] **Controllers & Routes**
  - [ ] POST /quotes/calculate
  - [ ] POST /quotes/compare
  - [ ] GET /quotes/:id

- [ ] **Testing**
  - [ ] Premium calculation tests
  - [ ] Discount logic tests
  - [ ] Comparison tests

- **Verificación**: Quote generation con multiple carriers

---

## 📦 3.2: ait-multiscraper (Web Scraping)

**Tiempo estimado**: 1 semana
**Prioridad**: MEDIA

### Checklist resumido

- [ ] **Setup**
  - [ ] Puppeteer/Playwright
  - [ ] Bull queue
  - [ ] Proxy rotation

- [ ] **Database**
  - [ ] scraper_jobs table
  - [ ] scraper_results table
  - [ ] proxies table

- [ ] **Scrapers**
  - [ ] Mapfre scraper
  - [ ] AXA scraper
  - [ ] Allianz scraper
  - [ ] Generic scraper template

- [ ] **Queue Management**
  - [ ] Job scheduling
  - [ ] Retry logic
  - [ ] Rate limiting
  - [ ] Error handling

- [ ] **PDF Parsing**
  - [ ] Extract policy info
  - [ ] Extract premium details
  - [ ] Extract coverage

- [ ] **API**
  - [ ] POST /scrapers/jobs
  - [ ] GET /scrapers/jobs/:id
  - [ ] GET /scrapers/results

- **Verificación**: Scraping automático funciona

---

### ✅ Verificación Final Fase 3

- [ ] Quote Engine calcula premiums
- [ ] Multi-carrier comparison funciona
- [ ] Scrapers ejecutan correctamente
- [ ] PDF parsing funciona
- [ ] Queue management funciona
- [ ] Ready para Fase 4

---

# FASE 4: AI Modules

## 📦 4.1: ai-defender (Fraud Detection)

**Tiempo estimado**: 1 semana

### Checklist resumido

- [ ] **Database**
  - [ ] fraud_cases table
  - [ ] fraud_rules table
  - [ ] fraud_scores table

- [ ] **ML Models**
  - [ ] Random Forest classifier
  - [ ] Neural Network
  - [ ] Training pipeline
  - [ ] Model versioning

- [ ] **Rule Engine**
  - [ ] Configurable rules
  - [ ] Threshold-based detection
  - [ ] Pattern matching

- [ ] **Image Analysis**
  - [ ] Duplicate detection
  - [ ] Metadata analysis
  - [ ] Visual similarity

- [ ] **Network Analysis (Neo4j)**
  - [ ] Relationship mapping
  - [ ] Fraud ring detection

- [ ] **API**
  - [ ] POST /fraud/analyze
  - [ ] GET /fraud/score/:claimId
  - [ ] POST /fraud/rules

- **Verificación**: Fraud detection funciona

---

## 📦 4.2: ai-optimax (Cost Optimization)

**Tiempo estimado**: 4 días

### Checklist resumido

- [ ] **Optimization algorithms**
  - [ ] Policy bundling
  - [ ] Premium optimization
  - [ ] Coverage optimization

- [ ] **API**
  - [ ] POST /optimize/portfolio
  - [ ] GET /optimize/recommendations/:customerId

- **Verificación**: Optimization recommendations

---

## 📦 4.3: ai-pgc-engine (Pricing, Growth, Churn)

**Tiempo estimado**: 4 días

### Checklist resumido

- [ ] **Predictive models**
  - [ ] Churn prediction
  - [ ] Growth forecasting
  - [ ] Dynamic pricing

- [ ] **API**
  - [ ] POST /predict/churn
  - [ ] POST /predict/growth
  - [ ] POST /pricing/dynamic

- **Verificación**: Predictions funcionan

---

## 📦 4.4: ai-nerve-max (Predictive Analytics)

**Tiempo estimado**: 4 días

### Checklist resumido

- [ ] **Time series forecasting**
  - [ ] Sales forecasting
  - [ ] Claim frequency
  - [ ] Premium trends

- [ ] **API**
  - [ ] POST /forecast/sales
  - [ ] POST /forecast/claims

- **Verificación**: Forecasts generados

---

### ✅ Verificación Final Fase 4

- [ ] AI Defender detecta fraud
- [ ] OptiMax genera recomendaciones
- [ ] PGC Engine predice churn
- [ ] Nerve-Max forecasts funcionan
- [ ] Models deployados
- [ ] Ready para Fase 5

---

# FASE 5: Analytics & DataHub

## 📦 5.1: ait-datahub (Analytics Engine)

**Tiempo estimado**: 1 semana

### Checklist resumido

- [ ] **ClickHouse setup**
  - [ ] Schema design
  - [ ] Materialized views
  - [ ] Aggregation tables

- [ ] **ETL Pipelines**
  - [ ] Extract from PostgreSQL
  - [ ] Transform & aggregate
  - [ ] Load to ClickHouse
  - [ ] Scheduling con Bull

- [ ] **Dashboards**
  - [ ] Sales dashboard
  - [ ] Agent performance
  - [ ] Customer analytics
  - [ ] Financial metrics

- [ ] **Reports**
  - [ ] PDF generation
  - [ ] Scheduled reports
  - [ ] Email delivery

- [ ] **API**
  - [ ] GET /analytics/dashboard/:type
  - [ ] POST /analytics/reports/generate
  - [ ] GET /analytics/kpis

- **Verificación**: Dashboards con datos reales

---

### ✅ Verificación Final Fase 5

- [ ] ClickHouse storing analytics data
- [ ] ETL pipelines running
- [ ] Dashboards displaying correctly
- [ ] Reports generating
- [ ] KPIs accurate
- [ ] Ready para Fase 6

---

# FASE 6: Integrations

## 📦 6.1: Payment Processing

**Tiempo estimado**: 1 semana

### Checklist resumido

- [ ] **Stripe Integration**
  - [ ] Customer creation
  - [ ] Payment methods
  - [ ] Charges
  - [ ] Subscriptions
  - [ ] Webhooks

- [ ] **Redsys Integration**
  - [ ] Payment initiation
  - [ ] Payment confirmation
  - [ ] Refunds

- [ ] **PayPal**
  - [ ] Express Checkout
  - [ ] Subscriptions

- [ ] **Database**
  - [ ] payments table
  - [ ] payment_methods table
  - [ ] invoices table

- [ ] **API**
  - [ ] POST /payments/charge
  - [ ] POST /payments/refund
  - [ ] GET /payments/history/:customerId

- **Verificación**: Payments procesados correctamente

---

## 📦 6.2: Document Management

**Tiempo estimado**: 5 días

### Checklist resumido

- [ ] **AWS S3 Setup**
  - [ ] Bucket creation
  - [ ] IAM policies
  - [ ] Presigned URLs

- [ ] **Upload/Download**
  - [ ] File upload
  - [ ] File download
  - [ ] Version control

- [ ] **OCR**
  - [ ] Tesseract integration
  - [ ] Google Vision API
  - [ ] Text extraction

- [ ] **PDF Generation**
  - [ ] Policy documents
  - [ ] Certificates
  - [ ] Invoices

- [ ] **E-Signature (DocuSign)**
  - [ ] Send documents
  - [ ] Track signatures
  - [ ] Download signed

- [ ] **Database**
  - [ ] documents table
  - [ ] document_versions table

- [ ] **API**
  - [ ] POST /documents/upload
  - [ ] GET /documents/:id
  - [ ] POST /documents/:id/sign

- **Verificación**: Document lifecycle completo

---

## 📦 6.3: Blockchain Integration

**Tiempo estimado**: 1 semana

### Checklist resumido

- [ ] **Smart Contracts (Solidity)**
  - [ ] Parametric insurance contract
  - [ ] Claim automation contract
  - [ ] Deploy to testnet

- [ ] **Web3 Integration**
  - [ ] ethers.js setup
  - [ ] Contract interaction
  - [ ] Event listening

- [ ] **API**
  - [ ] POST /blockchain/policy/create
  - [ ] POST /blockchain/claim/trigger
  - [ ] GET /blockchain/transactions

- **Verificación**: Smart contract deployed y funciona

---

### ✅ Verificación Final Fase 6

- [ ] Payment processing funciona
- [ ] Documents uploading/downloading
- [ ] OCR extracting text
- [ ] E-signatures working
- [ ] Blockchain integration activa
- [ ] Ready para Fase 7

---

# FASE 7: Mobile & Desktop Apps

## 📦 7.1: React Native Apps

**Tiempo estimado**: 2 semanas

### Checklist resumido

- [ ] **Setup**
  - [ ] React Native project
  - [ ] Navigation (React Navigation)
  - [ ] State management (Zustand/Redux)

- [ ] **Agent App**
  - [ ] Login
  - [ ] Dashboard
  - [ ] Customer list
  - [ ] Call initiation
  - [ ] Policy details
  - [ ] Claim creation
  - [ ] Task management

- [ ] **Customer App**
  - [ ] Login
  - [ ] Policy viewing
  - [ ] Claim filing
  - [ ] Document upload
  - [ ] Chat support
  - [ ] Payment

- [ ] **Push Notifications**
  - [ ] FCM setup
  - [ ] Notification handling
  - [ ] Deep linking

- [ ] **Offline Mode**
  - [ ] Local storage
  - [ ] Sync on reconnect

- [ ] **Camera Integration**
  - [ ] Photo capture
  - [ ] Document scanning

- [ ] **Build & Deploy**
  - [ ] iOS build
  - [ ] Android build
  - [ ] TestFlight/Play Store upload

- **Verificación**: Apps funcionando en iOS y Android

---

## 📦 7.2: Electron Desktop App

**Tiempo estimado**: 1 semana

### Checklist resumido

- [ ] **Setup**
  - [ ] Electron project
  - [ ] React frontend

- [ ] **Features**
  - [ ] Same as web app
  - [ ] System tray integration
  - [ ] Desktop notifications
  - [ ] Auto-updates (electron-updater)

- [ ] **Build**
  - [ ] Windows installer
  - [ ] macOS DMG
  - [ ] Linux AppImage

- **Verificación**: Desktop app instalable

---

### ✅ Verificación Final Fase 7

- [ ] Mobile apps en App Store/Play Store
- [ ] Desktop app instalable
- [ ] All features funcionando
- [ ] Push notifications working
- [ ] Offline mode funciona
- [ ] Ready para Fase 8

---

# FASE 8: Testing & Production Deployment

## 📦 8.1: Testing Suite

**Tiempo estimado**: 1 semana

### Checklist resumido

- [ ] **Unit Tests**
  - [ ] All services covered
  - [ ] 80%+ coverage

- [ ] **Integration Tests**
  - [ ] API endpoints
  - [ ] Database operations
  - [ ] Event bus flows

- [ ] **E2E Tests (Playwright)**
  - [ ] User registration flow
  - [ ] Login flow
  - [ ] Create customer
  - [ ] Create policy
  - [ ] Make call
  - [ ] File claim
  - [ ] Generate quote

- [ ] **Load Testing (K6)**
  - [ ] Auth endpoints
  - [ ] Customer CRUD
  - [ ] Call initiation
  - [ ] Target: 1000 req/s

- [ ] **Security Audit**
  - [ ] SQL injection tests
  - [ ] XSS tests
  - [ ] CSRF tests
  - [ ] Authentication tests
  - [ ] Authorization tests

- **Verificación**: All tests passing

---

## 📦 8.2: CI/CD Pipeline

**Tiempo estimado**: 3 días

### Checklist resumido

- [ ] **GitHub Actions**
  - [ ] Test workflow
  - [ ] Build workflow
  - [ ] Deploy workflow

- [ ] **Docker**
  - [ ] Dockerfile para cada servicio
  - [ ] Multi-stage builds
  - [ ] Docker Compose para dev

- [ ] **Kubernetes**
  - [ ] Deployment YAMLs
  - [ ] Service YAMLs
  - [ ] Ingress configuration
  - [ ] ConfigMaps & Secrets

- [ ] **Monitoring**
  - [ ] Prometheus setup
  - [ ] Grafana dashboards
  - [ ] Alert rules

- **Verificación**: Auto-deploy funciona

---

## 📦 8.3: Production Deployment

**Tiempo estimado**: 1 semana

### Checklist resumido

- [ ] **Infrastructure**
  - [ ] Cloud provider (AWS/GCP/Azure)
  - [ ] Kubernetes cluster
  - [ ] Load balancers
  - [ ] CDN setup

- [ ] **Databases**
  - [ ] PostgreSQL cluster (replicas)
  - [ ] Redis cluster
  - [ ] MongoDB replica set
  - [ ] ClickHouse cluster

- [ ] **SSL/TLS**
  - [ ] Domain configuration
  - [ ] SSL certificates (Let's Encrypt)
  - [ ] HTTPS everywhere

- [ ] **Backup & Recovery**
  - [ ] Database backups (daily)
  - [ ] S3 backups
  - [ ] Recovery testing

- [ ] **Scaling**
  - [ ] Horizontal pod autoscaling
  - [ ] Database read replicas
  - [ ] Redis sharding

- [ ] **Monitoring & Logging**
  - [ ] Centralized logging (ELK/Loki)
  - [ ] APM (New Relic/DataDog)
  - [ ] Error tracking (Sentry)
  - [ ] Uptime monitoring

- [ ] **Security**
  - [ ] WAF (Web Application Firewall)
  - [ ] DDoS protection
  - [ ] Rate limiting
  - [ ] IP whitelisting
  - [ ] Secrets management (Vault)

- **Verificación**: Production stable and monitored

---

### ✅ Verificación Final Fase 8

- [ ] All tests passing
- [ ] CI/CD pipeline working
- [ ] Production deployed
- [ ] Monitoring active
- [ ] Backups configured
- [ ] SSL/TLS configured
- [ ] Auto-scaling working
- [ ] System stable under load

---

# 🎯 RESUMEN EJECUTIVO

## Progreso por Fase

```
FASE 1: Backend Core Services        [ ] 0/3 completado
FASE 2: Telephony & Omnichannel      [ ] 0/5 completado
FASE 3: Quote Engine & Scrapers      [ ] 0/2 completado
FASE 4: AI Modules                   [ ] 0/4 completado
FASE 5: Analytics & DataHub          [ ] 0/1 completado
FASE 6: Integrations                 [ ] 0/3 completado
FASE 7: Mobile & Desktop             [ ] 0/2 completado
FASE 8: Testing & Production         [ ] 0/3 completado

TOTAL: 0/23 módulos completados (0%)
```

## Cronograma

- **Semanas 1-2**: Fase 1 (Backend Core)
- **Semanas 3-4**: Fase 2 (Telephony & Omnichannel)
- **Semanas 5-6**: Fase 3 (Quote & Scrapers)
- **Semanas 7-8**: Fase 4 (AI Modules)
- **Semanas 9-10**: Fase 5 (Analytics)
- **Semanas 11-12**: Fase 6 (Integrations)
- **Semanas 13-14**: Fase 7 (Mobile & Desktop)
- **Semanas 15-16**: Fase 8 (Testing & Production)

**Total: 16 semanas para 100% completado**

## Dependencias Críticas

- Fase 1 debe completarse antes de Fase 2-8
- Fase 2 debe completarse antes de apps móviles (Fase 7)
- Fase 6.1 (Payments) necesario antes de production
- Fase 8 es secuencial al final

## Prioridades

1. **CRÍTICO**: Fase 1 (Auth + ERP)
2. **CRÍTICO**: Fase 2.1 (Telephony)
3. **ALTA**: Fase 2.2 (Omnichannel)
4. **ALTA**: Fase 3.1 (Quote Engine)
5. **MEDIA**: Todo lo demás
6. **BAJA**: Blockchain

---

# 📝 NOTAS FINALES

Este plan cubre TODOS los aspectos del ecosistema AINTECH:

- ✅ Authentication & Authorization (OAuth, 2FA, RBAC)
- ✅ CRM/ERP (Customers, Policies, Claims, Tasks, Workflows)
- ✅ Telephony (VoIP, Recording, Queue, IVR)
- ✅ Omnichannel (WhatsApp, SMS, Email, Chat)
- ✅ Quote Engine (Pricing, Comparison)
- ✅ Web Scraping (Multi-carrier)
- ✅ AI Modules (Fraud, Optimization, Predictions)
- ✅ Analytics (ClickHouse, Dashboards, Reports)
- ✅ Payments (Stripe, Redsys, PayPal)
- ✅ Documents (S3, OCR, E-Signature)
- ✅ Blockchain (Smart Contracts)
- ✅ Mobile Apps (iOS, Android)
- ✅ Desktop App (Electron)
- ✅ Testing Completo
- ✅ CI/CD Pipeline
- ✅ Production Deployment

**¡LISTO PARA EJECUTAR! 🚀**
