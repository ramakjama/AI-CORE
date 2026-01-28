# AIT-CORE SORIANO - Troubleshooting Guide

**Version:** 1.0.0
**Last Updated:** 2026-01-28

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Installation Issues](#installation-issues)
3. [Development Issues](#development-issues)
4. [Database Issues](#database-issues)
5. [API Issues](#api-issues)
6. [Authentication Issues](#authentication-issues)
7. [Module Issues](#module-issues)
8. [Agent Issues](#agent-issues)
9. [Performance Issues](#performance-issues)
10. [Production Issues](#production-issues)
11. [Getting Help](#getting-help)

---

## Quick Diagnostics

### Health Check Commands

```bash
# Check all services status
pnpm health:check

# Check specific service
docker ps | grep ait-postgres
docker ps | grep ait-redis
docker ps | grep ait-kafka

# Check API health
curl http://localhost:3000/api/health

# Check logs
docker-compose logs -f
pnpm logs:api
pnpm logs:web
```

### Common Quick Fixes

```bash
# Restart all services
pnpm docker:down
pnpm docker:up

# Clean install
rm -rf node_modules
pnpm install

# Reset database
pnpm db:reset

# Clear cache
pnpm cache:clear
```

---

## Installation Issues

### Issue: pnpm install fails

**Symptoms**:
```
ERR_PNPM_FETCH_404  GET https://registry.npmjs.org/@package/name: Not Found
```

**Solutions**:

1. **Check Node.js version**:
```bash
node --version  # Should be 20+
```
If incorrect:
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node 20
nvm install 20
nvm use 20
```

2. **Check pnpm version**:
```bash
pnpm --version  # Should be 8+
```
If incorrect:
```bash
npm install -g pnpm@latest
```

3. **Clear pnpm cache**:
```bash
pnpm store prune
pnpm install --force
```

4. **Check .npmrc**:
```bash
cat .npmrc
# Should have:
# registry=https://registry.npmjs.org/
```

---

### Issue: Docker containers won't start

**Symptoms**:
```
ERROR: Cannot start service postgres: driver failed
```

**Solutions**:

1. **Check Docker is running**:
```bash
docker info
```

2. **Check port conflicts**:
```bash
# Check if port 5432 is already in use
lsof -i :5432  # macOS/Linux
netstat -ano | findstr :5432  # Windows

# Kill conflicting process or change port in docker-compose.yml
```

3. **Reset Docker**:
```bash
docker-compose down -v
docker system prune -a --volumes
docker-compose up -d
```

4. **Check Docker logs**:
```bash
docker-compose logs postgres
docker-compose logs redis
```

---

### Issue: Database migrations fail

**Symptoms**:
```
Migration failed with error: relation "users" already exists
```

**Solutions**:

1. **Reset database**:
```bash
pnpm db:reset
```

2. **Check connection string**:
```bash
echo $DATABASE_URL
# Should be: postgresql://aitcore:aitcore2024@localhost:5432/soriano_core
```

3. **Manual migration**:
```bash
pnpm prisma migrate deploy
pnpm prisma generate
```

4. **Check PostgreSQL is running**:
```bash
docker ps | grep postgres
docker logs ait-postgres
```

---

## Development Issues

### Issue: Hot reload not working

**Symptoms**:
- Changes not reflected without manual restart

**Solutions**:

1. **Check if running in dev mode**:
```bash
# Should use 'pnpm dev' not 'pnpm start'
pnpm dev
```

2. **Clear Next.js cache** (for web app):
```bash
rm -rf .next
pnpm dev
```

3. **Check file watchers limit** (Linux):
```bash
# Check current limit
cat /proc/sys/fs/inotify/max_user_watches

# Increase limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

4. **Restart Turbo cache**:
```bash
rm -rf node_modules/.cache
pnpm dev
```

---

### Issue: TypeScript errors

**Symptoms**:
```
TS2304: Cannot find name 'User'
TS7016: Could not find a declaration file for module '@ait-core/shared'
```

**Solutions**:

1. **Regenerate types**:
```bash
pnpm type-check
pnpm db:generate  # Regenerate Prisma types
```

2. **Check tsconfig.json paths**:
```json
{
  "compilerOptions": {
    "paths": {
      "@ait-core/*": ["../../libs/*/src"]
    }
  }
}
```

3. **Restart TypeScript server** (VS Code):
- Cmd+Shift+P → "TypeScript: Restart TS Server"

4. **Clean build**:
```bash
pnpm clean
pnpm build
```

---

### Issue: Tests failing

**Symptoms**:
```
FAIL tests/unit/user.service.spec.ts
TypeError: Cannot read property 'findUnique' of undefined
```

**Solutions**:

1. **Check test setup**:
```typescript
// Ensure mocks are properly configured
beforeEach(async () => {
  const module = await Test.createTestingModule({
    providers: [
      UserService,
      {
        provide: PrismaService,
        useValue: {
          user: {
            findUnique: jest.fn(),
            create: jest.fn(),
          },
        },
      },
    ],
  }).compile();

  service = module.get<UserService>(UserService);
});
```

2. **Clear Jest cache**:
```bash
pnpm jest --clearCache
pnpm test
```

3. **Run tests in isolation**:
```bash
pnpm test user.service.spec.ts
```

4. **Check test database**:
```bash
# Ensure test database is clean
DATABASE_URL="postgresql://test:test@localhost:5432/test_db" pnpm db:reset
```

---

## Database Issues

### Issue: Database connection refused

**Symptoms**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions**:

1. **Check PostgreSQL is running**:
```bash
docker ps | grep postgres
# If not running:
docker-compose up -d postgres
```

2. **Check connection string**:
```bash
# In .env
DATABASE_URL="postgresql://aitcore:aitcore2024@localhost:5432/soriano_core"
```

3. **Test connection**:
```bash
docker exec -it ait-postgres psql -U aitcore -d soriano_core
```

4. **Check firewall**:
```bash
# Allow port 5432
sudo ufw allow 5432  # Linux
```

---

### Issue: Slow database queries

**Symptoms**:
- API responses taking > 1 second
- Database CPU at 100%

**Solutions**:

1. **Check query performance**:
```sql
-- Enable query logging in PostgreSQL
ALTER DATABASE soriano_core SET log_statement = 'all';
ALTER DATABASE soriano_core SET log_min_duration_statement = 1000;

-- View slow queries
SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;
```

2. **Add missing indexes**:
```sql
-- Check missing indexes
SELECT * FROM pg_stat_user_tables WHERE idx_scan = 0;

-- Add index
CREATE INDEX idx_users_email ON users(email);
```

3. **Optimize Prisma queries**:
```typescript
// Bad: N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { userId: user.id } });
}

// Good: Include related data
const users = await prisma.user.findMany({
  include: { posts: true },
});
```

4. **Enable connection pooling**:
```bash
# In .env
DATABASE_URL="postgresql://user:pass@localhost:5432/db?pgbouncer=true"
```

---

### Issue: Database out of disk space

**Symptoms**:
```
ERROR: could not extend file "base/16384/16385": No space left on device
```

**Solutions**:

1. **Check disk usage**:
```bash
df -h
docker system df
```

2. **Clean up old data**:
```sql
-- Delete old audit logs
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';

-- Vacuum database
VACUUM FULL;
```

3. **Increase disk space** (production):
- AWS RDS: Increase storage in console
- Azure: Increase storage in portal
- Self-hosted: Add more disk space

4. **Archive old data**:
```bash
# Export old data
pg_dump -t old_table > archive.sql

# Delete from main DB
psql -c "DROP TABLE old_table;"
```

---

## API Issues

### Issue: API returns 500 Internal Server Error

**Symptoms**:
```json
{
  "success": false,
  "error": {
    "code": "SERVER_001",
    "message": "Internal server error"
  }
}
```

**Solutions**:

1. **Check API logs**:
```bash
pnpm logs:api
docker logs ait-core-api
```

2. **Check error details**:
```bash
# Enable debug mode in .env
LOG_LEVEL=debug
NODE_ENV=development

# Restart API
pnpm dev
```

3. **Common causes**:
```typescript
// Missing environment variable
const apiKey = process.env.MISSING_API_KEY;  // undefined!

// Database connection issue
await prisma.user.findMany();  // Connection refused

// Unhandled promise rejection
async function doSomething() {
  throw new Error('Unhandled error');
}
```

4. **Enable error reporting**:
```typescript
// main.ts
app.useGlobalFilters(new HttpExceptionFilter());

// Catch all errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
```

---

### Issue: API rate limit exceeded

**Symptoms**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests"
  }
}
```

**Solutions**:

1. **Wait and retry**:
```javascript
// Implement exponential backoff
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (error.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000));
      } else {
        throw error;
      }
    }
  }
}
```

2. **Check rate limits**:
```bash
curl -I https://api.sorianomediadores.es/api/v1/users
# Headers:
# X-RateLimit-Limit: 1000
# X-RateLimit-Remaining: 0
# X-RateLimit-Reset: 1706436000
```

3. **Upgrade plan** (if needed):
- Standard: 1,000 req/hour
- Pro: 10,000 req/hour
- Enterprise: Unlimited

4. **Implement caching**:
```typescript
import { CacheInterceptor } from '@nestjs/cache-manager';

@UseInterceptors(CacheInterceptor)
@Get()
async findAll() {
  // Cached for 60 seconds
}
```

---

### Issue: CORS errors

**Symptoms**:
```
Access to fetch at 'https://api.sorianomediadores.es' from origin 'http://localhost:3001'
has been blocked by CORS policy
```

**Solutions**:

1. **Configure CORS in API**:
```typescript
// main.ts
app.enableCors({
  origin: ['http://localhost:3001', 'https://app.sorianomediadores.es'],
  credentials: true,
});
```

2. **Check preflight requests**:
```bash
curl -X OPTIONS https://api.sorianomediadores.es/api/v1/users \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST"
```

3. **Use proxy in development**:
```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
};
```

---

## Authentication Issues

### Issue: Token expired

**Symptoms**:
```json
{
  "success": false,
  "error": {
    "code": "AUTH_002",
    "message": "Token expired"
  }
}
```

**Solutions**:

1. **Refresh token**:
```javascript
async function refreshAccessToken() {
  const response = await fetch('https://api.sorianomediadores.es/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: storedRefreshToken }),
  });

  const { access_token } = await response.json();
  return access_token;
}
```

2. **Automatic token refresh**:
```javascript
// Axios interceptor
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response.status === 401) {
      const newToken = await refreshAccessToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

### Issue: MFA verification fails

**Symptoms**:
- MFA code always invalid

**Solutions**:

1. **Check time sync**:
```bash
# TOTP depends on accurate time
sudo ntpdate -s time.nist.gov  # macOS/Linux
```

2. **Regenerate MFA secret**:
```bash
# In API or admin panel
POST /api/v1/auth/mfa/regenerate
```

3. **Use backup codes**:
- Each MFA setup provides 10 backup codes
- Use one if TOTP fails

---

## Module Issues

### Issue: Module fails to load

**Symptoms**:
```
Error loading module 'ai-accountant': Module dependencies not met
```

**Solutions**:

1. **Check module dependencies**:
```bash
pnpm modules:deps ai-accountant
```

2. **Enable required dependencies**:
```bash
pnpm modules:enable ai-pgc-engine
pnpm modules:enable ait-authenticator
```

3. **Check module configuration**:
```json
// module.config.json
{
  "module": {
    "id": "ai-accountant",
    "enabled": true
  },
  "connector": {
    "dependencies": ["ai-pgc-engine", "ait-authenticator"]
  }
}
```

4. **Check module logs**:
```bash
pnpm logs:module ai-accountant
```

---

### Issue: Module hot reload fails

**Symptoms**:
- Module changes require full restart

**Solutions**:

1. **Check connector status**:
```bash
curl http://localhost:3000/api/v1/connector/modules/ai-accountant/health
```

2. **Manual reload**:
```bash
curl -X POST http://localhost:3000/api/v1/connector/modules/ai-accountant/reload
```

3. **Check for circular dependencies**:
```bash
pnpm modules:check-cycles
```

---

## Agent Issues

### Issue: Agent responses are slow

**Symptoms**:
- Agent requests taking > 30 seconds

**Solutions**:

1. **Check Claude API status**:
```bash
curl https://status.anthropic.com/api/v2/status.json
```

2. **Reduce context size**:
```javascript
// Keep context concise
const response = await agent.analyze({
  question: 'Analyze risk',
  context: {
    // Only include relevant data
    age: 45,
    occupation: 'office worker',
    // Don't include entire user history
  },
});
```

3. **Enable caching**:
```javascript
// Cache common queries
const cacheKey = `agent:insurance:${questionHash}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const response = await agent.analyze(request);
await redis.setex(cacheKey, 3600, JSON.stringify(response));
```

4. **Check rate limits**:
```bash
# Claude API rate limits
# Tier 1: 50 req/min
# Tier 2: 1000 req/min
```

---

### Issue: Agent gives incorrect responses

**Symptoms**:
- Agent recommendations don't make sense

**Solutions**:

1. **Provide more context**:
```javascript
// Bad: Insufficient context
await agent.analyze({
  question: 'Should I buy this insurance?',
});

// Good: Rich context
await agent.analyze({
  question: 'Should I buy this insurance?',
  context: {
    customerAge: 35,
    familySize: 4,
    income: 60000,
    currentInsurance: ['health', 'auto'],
    budget: 200,
    needCoverage: ['life', 'disability'],
  },
});
```

2. **Refine system prompt**:
```typescript
// Update agent.config.json
{
  "claude": {
    "systemPrompt": "./prompts/insurance-specialist-v2.txt"
  }
}
```

3. **Check agent version**:
```bash
# Ensure using latest agent version
git pull origin main
pnpm install
```

---

## Performance Issues

### Issue: Slow page loads

**Symptoms**:
- Web pages taking > 3 seconds to load

**Solutions**:

1. **Enable Next.js caching**:
```typescript
// app/page.tsx
export const revalidate = 3600;  // Cache for 1 hour

// Or use React cache
import { cache } from 'react';

const getData = cache(async () => {
  return fetch('...').then(res => res.json());
});
```

2. **Optimize images**:
```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  width={500}
  height={300}
  alt="Logo"
  priority  // Load immediately
/>
```

3. **Code splitting**:
```typescript
// Dynamic import
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
});
```

4. **Use React Query**:
```typescript
import { useQuery } from '@tanstack/react-query';

function Users() {
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000,  // Cache for 5 minutes
  });
}
```

---

### Issue: High memory usage

**Symptoms**:
- Node process using > 2GB RAM

**Solutions**:

1. **Check for memory leaks**:
```bash
# Monitor memory
node --inspect server.js

# Use Chrome DevTools
# chrome://inspect
```

2. **Increase memory limit**:
```bash
# In package.json
"scripts": {
  "start": "node --max-old-space-size=4096 dist/main.js"
}
```

3. **Optimize queries**:
```typescript
// Stream large result sets
const users = await prisma.user.findMany({
  take: 1000,  // Limit results
  select: { id: true, email: true },  // Select only needed fields
});
```

4. **Use pagination**:
```typescript
// Instead of loading everything
const users = await prisma.user.findMany();  // ❌

// Use cursor-based pagination
const users = await prisma.user.findMany({
  take: 20,
  skip: page * 20,
});  // ✅
```

---

## Production Issues

### Issue: Pod crashes in Kubernetes

**Symptoms**:
```
CrashLoopBackOff
```

**Solutions**:

1. **Check pod logs**:
```bash
kubectl logs -f deployment/ait-core-api -n ait-core-prod
kubectl logs --previous deployment/ait-core-api -n ait-core-prod
```

2. **Describe pod**:
```bash
kubectl describe pod <pod-name> -n ait-core-prod
```

3. **Check resource limits**:
```yaml
# Increase if OOMKilled
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

4. **Check liveness probe**:
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 60  # Increase if slow startup
  periodSeconds: 10
```

---

### Issue: High response times in production

**Symptoms**:
- API response times > 1 second

**Solutions**:

1. **Enable APM**:
```bash
# Check Prometheus metrics
kubectl port-forward svc/prometheus 9090:9090 -n monitoring
# Open http://localhost:9090
```

2. **Check database performance**:
```bash
# View RDS performance insights (AWS)
aws rds describe-db-instances --db-instance-identifier ait-core-prod
```

3. **Scale horizontally**:
```bash
# Increase replicas
kubectl scale deployment ait-core-api --replicas=10 -n ait-core-prod
```

4. **Enable caching**:
```typescript
// Use Redis for API responses
app.use(RedisCache);
```

---

## Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Search existing GitHub issues**
3. **Check documentation**
4. **Review logs for error messages**

### How to Ask for Help

**Provide**:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Error messages (full stack trace)
- Environment details (OS, Node version, etc.)
- What you've already tried

**Good Issue Example**:
```markdown
## Problem
API returns 500 error when creating user

## Steps to Reproduce
1. POST to /api/v1/users with valid data
2. See 500 error

## Expected
User created, 201 response

## Actual
500 Internal Server Error

## Error Logs
```
[Error] ValidationError: Invalid email format
  at UserService.createUser (user.service.ts:45)
  ...
```

## Environment
- OS: Ubuntu 22.04
- Node: 20.10.0
- Docker: 24.0.7

## Already Tried
- Restarted services
- Checked database connection
- Verified input data
```

### Support Channels

**Community Support**:
- GitHub Issues: https://github.com/aintech/ait-core-soriano/issues
- GitHub Discussions: https://github.com/aintech/ait-core-soriano/discussions

**Enterprise Support** (for customers):
- Email: support@sorianomediadores.es
- Phone: +34 XXX XXX XXX
- Slack: #support channel

**Response Times**:
- Critical (production down): < 1 hour
- High (degraded service): < 4 hours
- Medium (bug affecting some users): < 24 hours
- Low (feature request): < 1 week

---

## Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [API Reference](./API.md)
- [Development Guide](./DEVELOPMENT.md)
- [Security Guide](./SECURITY.md)

---

**Document Version:** 1.0.0
**Last Updated:** 2026-01-28
**Support:** support@sorianomediadores.es
