# AIT-CORE Shared Libraries - Deployment Checklist

## Pre-Deployment Verification

### 1. Files Created ✅
- [x] @ait-core/shared (8 source files)
- [x] @ait-core/database (4 source files + Prisma schema)
- [x] @ait-core/kafka (7 source files)
- [x] @ait-core/auth (8 source files)
- [x] @ait-core/ui (24 source files)
- [x] Documentation (5 README files + 2 manifest files)
- [x] Configuration (5 package.json, 5 tsconfig.json)

**Total: 51 TypeScript files + configuration**

### 2. Library Structure ✅
```
libs/
├── shared/          ✅ Complete
├── database/        ✅ Complete
├── kafka/           ✅ Complete
├── auth/            ✅ Complete
├── ui/              ✅ Complete
├── LIBRARIES_MANIFEST.md        ✅
├── IMPLEMENTATION_SUMMARY.md    ✅
└── DEPLOYMENT_CHECKLIST.md      ✅ (this file)
```

### 3. Package Configuration ✅
Each library has:
- [x] package.json with proper exports
- [x] tsconfig.json with strict TypeScript
- [x] Build scripts (build, dev, lint, test)
- [x] Proper dependencies
- [x] Workspace references

---

## Installation Steps

### Step 1: Install Dependencies
```bash
cd C:\Users\rsori\codex\ait-core-soriano
pnpm install
```

**Expected Result**: All dependencies installed without errors

### Step 2: Build All Libraries
```bash
# From root
pnpm build

# Or individually
cd libs/shared && pnpm build
cd libs/database && pnpm build
cd libs/kafka && pnpm build
cd libs/auth && pnpm build
cd libs/ui && pnpm build
```

**Expected Result**:
- `dist/` folder created in each library
- CJS and ESM bundles generated
- Type definitions (.d.ts) generated

### Step 3: Verify TypeScript Compilation
```bash
pnpm type-check
```

**Expected Result**: No TypeScript errors

### Step 4: Run Linting
```bash
pnpm lint
```

**Expected Result**: Clean lint report (or only minor warnings)

---

## Environment Configuration

### Required Environment Variables

Create `.env` file in project root:

```bash
# ============================================================================
# DATABASE CONFIGURATION (@ait-core/database)
# ============================================================================
# Main database (fallback)
DATABASE_URL="postgresql://user:password@localhost:5432/ait_core"

# Optional: Individual databases (use main URL if not specified)
DATABASE_URL_POLICIES="postgresql://user:password@localhost:5432/ait_policies"
DATABASE_URL_CLAIMS="postgresql://user:password@localhost:5432/ait_claims"
DATABASE_URL_CUSTOMERS="postgresql://user:password@localhost:5432/ait_customers"
DATABASE_URL_FINANCE="postgresql://user:password@localhost:5432/ait_finance"
# ... continue for all 40 databases

# ============================================================================
# KAFKA CONFIGURATION (@ait-core/kafka)
# ============================================================================
KAFKA_BROKERS="localhost:9092"
KAFKA_CLIENT_ID="ait-core"
KAFKA_SSL_ENABLED="false"

# Optional: SASL Authentication
KAFKA_SASL_MECHANISM="plain"
KAFKA_SASL_USERNAME=""
KAFKA_SASL_PASSWORD=""

# ============================================================================
# AUTHENTICATION CONFIGURATION (@ait-core/auth)
# ============================================================================
# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET="your-secret-key-change-in-production-use-strong-random-string"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production"

# Token expiration
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Password hashing
BCRYPT_SALT_ROUNDS="10"

# Session duration (7 days in milliseconds)
SESSION_DURATION="604800000"

# ============================================================================
# LOGGING CONFIGURATION (@ait-core/shared)
# ============================================================================
NODE_ENV="development"
LOG_LEVEL="info"

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================
PORT="3000"
API_URL="http://localhost:3000"
```

**Security Notes**:
- ✅ Never commit `.env` to version control
- ✅ Use different secrets for each environment
- ✅ Rotate secrets regularly in production
- ✅ Use strong random strings for JWT secrets
- ✅ Enable SSL/TLS in production

---

## Database Setup

### Step 1: Install PostgreSQL
Ensure PostgreSQL 14+ is installed and running.

### Step 2: Create Databases
```bash
# Using psql
psql -U postgres

CREATE DATABASE ait_core;
CREATE DATABASE ait_policies;
CREATE DATABASE ait_claims;
CREATE DATABASE ait_customers;
CREATE DATABASE ait_finance;
-- ... create all 40 databases
```

### Step 3: Generate Prisma Client
```bash
cd libs/database
pnpm db:generate
```

### Step 4: Run Migrations
```bash
cd libs/database
pnpm db:migrate
```

**Expected Result**: All tables created successfully

---

## Kafka Setup

### Step 1: Install Kafka
Ensure Kafka is installed and running:
```bash
# Start Zookeeper
bin/zookeeper-server-start.sh config/zookeeper.properties

# Start Kafka
bin/kafka-server-start.sh config/server.properties
```

### Step 2: Create Topics
```bash
# Policy topics
kafka-topics.sh --create --topic policy.created --bootstrap-server localhost:9092
kafka-topics.sh --create --topic policy.updated --bootstrap-server localhost:9092
kafka-topics.sh --create --topic policy.cancelled --bootstrap-server localhost:9092
kafka-topics.sh --create --topic policy.renewed --bootstrap-server localhost:9092

# Claim topics
kafka-topics.sh --create --topic claim.submitted --bootstrap-server localhost:9092
kafka-topics.sh --create --topic claim.approved --bootstrap-server localhost:9092
kafka-topics.sh --create --topic claim.rejected --bootstrap-server localhost:9092
kafka-topics.sh --create --topic claim.paid --bootstrap-server localhost:9092

# Payment topics
kafka-topics.sh --create --topic payment.initiated --bootstrap-server localhost:9092
kafka-topics.sh --create --topic payment.completed --bootstrap-server localhost:9092
kafka-topics.sh --create --topic payment.failed --bootstrap-server localhost:9092

# Customer topics
kafka-topics.sh --create --topic customer.created --bootstrap-server localhost:9092
kafka-topics.sh --create --topic customer.updated --bootstrap-server localhost:9092

# Notification topics
kafka-topics.sh --create --topic notification.send --bootstrap-server localhost:9092
kafka-topics.sh --create --topic email.send --bootstrap-server localhost:9092
kafka-topics.sh --create --topic sms.send --bootstrap-server localhost:9092

# Analytics topics
kafka-topics.sh --create --topic analytics.event --bootstrap-server localhost:9092
kafka-topics.sh --create --topic audit.log --bootstrap-server localhost:9092
```

**Expected Result**: All topics created successfully

---

## Verification Tests

### Test 1: Import Libraries
Create `test-imports.ts`:
```typescript
import { HTTP_STATUS, formatCurrency } from '@ait-core/shared';
import { policiesDb } from '@ait-core/database';
import { getEventBus } from '@ait-core/kafka';
import { generateTokens } from '@ait-core/auth';
import { Button } from '@ait-core/ui';

console.log('✅ All imports successful');
```

Run: `npx tsx test-imports.ts`

### Test 2: Database Connection
Create `test-database.ts`:
```typescript
import { connectAllDatabases, checkAllDatabasesHealth } from '@ait-core/database';

async function test() {
  await connectAllDatabases();
  const health = await checkAllDatabasesHealth();
  console.log('Database health:', health);
}

test();
```

### Test 3: Kafka Connection
Create `test-kafka.ts`:
```typescript
import { getProducer } from '@ait-core/kafka';

async function test() {
  const producer = getProducer();
  await producer.connect();
  console.log('✅ Kafka connected');
  await producer.disconnect();
}

test();
```

### Test 4: Auth System
Create `test-auth.ts`:
```typescript
import { generateTokens, verifyToken } from '@ait-core/auth';

const tokens = generateTokens({
  userId: 'test-123',
  email: 'test@example.com',
  role: 'AGENT',
  permissions: ['policy:read'],
});

const payload = verifyToken(tokens.accessToken);
console.log('✅ Auth system working:', payload);
```

---

## Integration with Modules

### Using in Module
Any of the 57 modules can now import these libraries:

```typescript
// In any module: modules/01-core-business/policies-management/src/index.ts

import { logger, formatCurrency } from '@ait-core/shared';
import { policiesDb } from '@ait-core/database';
import { getEventBus } from '@ait-core/kafka';
import { requirePermission } from '@ait-core/auth';
import { Button, Card } from '@ait-core/ui';

// Use the libraries
logger.info('Module started');
const policies = await policiesDb.policy.findMany();
await eventBus.publish('policy.created', ...);
```

### TypeScript Configuration
Ensure `tsconfig.json` in modules includes:
```json
{
  "compilerOptions": {
    "paths": {
      "@ait-core/*": ["../../libs/*/src"]
    }
  }
}
```

---

## Production Deployment

### Pre-Production Checklist
- [ ] All environment variables configured
- [ ] JWT secrets are strong and unique
- [ ] Database backups configured
- [ ] Kafka topics created
- [ ] SSL/TLS enabled
- [ ] Rate limiting configured
- [ ] Monitoring and logging set up
- [ ] Error tracking (Sentry, etc.) configured
- [ ] Performance monitoring enabled
- [ ] Security audit completed

### Deployment Steps
1. Build all libraries: `pnpm build`
2. Run tests: `pnpm test`
3. Run type check: `pnpm type-check`
4. Run linting: `pnpm lint`
5. Deploy to staging environment
6. Run integration tests
7. Deploy to production
8. Verify all services

### Post-Deployment
- [ ] Monitor logs for errors
- [ ] Check database connections
- [ ] Verify Kafka message flow
- [ ] Test authentication flows
- [ ] Monitor performance metrics
- [ ] Set up alerts

---

## Troubleshooting

### Issue: TypeScript Errors
**Solution**:
- Run `pnpm install`
- Run `pnpm build` in each library
- Check `tsconfig.json` paths

### Issue: Database Connection Fails
**Solution**:
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Check database permissions
- Run `pnpm db:generate`

### Issue: Kafka Connection Fails
**Solution**:
- Check Kafka is running
- Verify KAFKA_BROKERS in .env
- Check topic creation
- Review Kafka logs

### Issue: Build Fails
**Solution**:
- Clear dist folders: `pnpm clean`
- Reinstall: `rm -rf node_modules && pnpm install`
- Rebuild: `pnpm build`

---

## Monitoring & Maintenance

### Regular Tasks
- [ ] Review logs daily
- [ ] Monitor database performance
- [ ] Check Kafka consumer lag
- [ ] Review authentication failures
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly
- [ ] Run security audits quarterly

### Health Checks
Create health check endpoints:
```typescript
// GET /health
{
  databases: await checkAllDatabasesHealth(),
  kafka: await checkKafkaHealth(),
  version: "1.0.0"
}
```

---

## Success Criteria

### All Green ✅
- [x] All 5 libraries created
- [x] 51 TypeScript files implemented
- [x] Complete documentation
- [x] Build system configured
- [x] Dependencies installed
- [x] Type checking passes
- [x] Ready for module integration

### Ready for Production When:
- [ ] All tests passing
- [ ] Environment configured
- [ ] Databases migrated
- [ ] Kafka topics created
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Team training completed

---

## Support & Documentation

### Resources
- Individual library READMEs in each lib folder
- `LIBRARIES_MANIFEST.md` - Overview of all libraries
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- Inline code documentation (JSDoc)
- TypeScript type definitions

### Getting Help
1. Check library README
2. Review inline documentation
3. Check TypeScript types
4. Review example code
5. Check logs for errors

---

## Next Steps

1. ✅ **Install dependencies**: `pnpm install`
2. ✅ **Build libraries**: `pnpm build`
3. ⏳ **Configure environment**: Create `.env` file
4. ⏳ **Set up databases**: Create and migrate
5. ⏳ **Set up Kafka**: Install and create topics
6. ⏳ **Run verification tests**
7. ⏳ **Start module development**
8. ⏳ **Deploy to staging**
9. ⏳ **Deploy to production**

---

**Created**: January 28, 2026
**Status**: Ready for deployment
**Version**: 1.0.0

**END OF DEPLOYMENT CHECKLIST**
