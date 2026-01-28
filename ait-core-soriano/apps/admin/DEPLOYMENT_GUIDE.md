# AIT-CORE Admin Panel - Deployment Guide

## Production-Ready Deployment Instructions

### Prerequisites
- Node.js 18+ installed
- pnpm 8+ installed
- Backend API running
- PostgreSQL database configured
- Redis instance for caching (optional)

### Environment Configuration

1. **Copy environment template:**
```bash
cp .env.local .env.production
```

2. **Configure production variables:**
```env
# Production URLs
NEXT_PUBLIC_APP_URL=https://admin.ait-core.com
NEXT_PUBLIC_API_URL=https://api.ait-core.com
NEXT_PUBLIC_WS_URL=wss://api.ait-core.com

# Authentication
JWT_SECRET=<generate-secure-secret>
NEXTAUTH_SECRET=<generate-secure-secret>
NEXTAUTH_URL=https://admin.ait-core.com

# Database (if needed)
DATABASE_URL=postgresql://user:password@host:5432/database

# Production Settings
NODE_ENV=production
NEXT_PUBLIC_LOG_LEVEL=error
```

### Installation Steps

1. **Install dependencies:**
```bash
cd apps/admin
pnpm install
```

2. **Build the application:**
```bash
pnpm build
```

3. **Test the build locally:**
```bash
pnpm start
```

### Deployment Options

#### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
```bash
pnpm add -g vercel
```

2. **Deploy:**
```bash
vercel --prod
```

3. **Configure environment variables in Vercel dashboard**

#### Option 2: Docker

1. **Create Dockerfile:**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN corepack enable pnpm && pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT 3001

CMD ["node", "server.js"]
```

2. **Build and run:**
```bash
docker build -t ait-core-admin .
docker run -p 3001:3001 ait-core-admin
```

#### Option 3: Traditional Server

1. **Build the application:**
```bash
pnpm build
```

2. **Copy files to server:**
```bash
scp -r .next package.json pnpm-lock.yaml user@server:/var/www/ait-core-admin/
```

3. **On server, install and start:**
```bash
cd /var/www/ait-core-admin
pnpm install --prod
pnpm start
```

4. **Setup PM2 for process management:**
```bash
pm2 start npm --name "ait-core-admin" -- start
pm2 save
pm2 startup
```

#### Option 4: Nginx Reverse Proxy

1. **Configure Nginx:**
```nginx
server {
    listen 80;
    server_name admin.ait-core.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. **Enable site and reload Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/ait-core-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL/TLS Configuration

1. **Install Certbot:**
```bash
sudo apt-get install certbot python3-certbot-nginx
```

2. **Obtain certificate:**
```bash
sudo certbot --nginx -d admin.ait-core.com
```

### Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test authentication flow
- [ ] Verify API connectivity
- [ ] Test WebSocket connections
- [ ] Check all page routes
- [ ] Verify data loading
- [ ] Test real-time updates
- [ ] Check error handling
- [ ] Verify logging
- [ ] Test mobile responsiveness
- [ ] Check performance metrics
- [ ] Setup monitoring (Sentry, DataDog, etc.)
- [ ] Configure backups
- [ ] Setup CI/CD pipeline
- [ ] Document any custom configurations

### Monitoring Setup

1. **Add error tracking (Sentry):**
```bash
pnpm add @sentry/nextjs
```

2. **Configure in next.config.js:**
```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  org: 'your-org',
  project: 'ait-core-admin',
});
```

### Performance Optimization

1. **Enable compression** (already configured in next.config.js)
2. **Configure CDN** for static assets
3. **Setup caching** headers
4. **Enable HTTP/2**
5. **Optimize images** (using Next.js Image component)
6. **Lazy load** components where appropriate

### Security Hardening

1. **Security headers** (already configured)
2. **CORS configuration**
3. **Rate limiting** on API endpoints
4. **Input validation** on all forms
5. **XSS protection**
6. **CSRF tokens**
7. **Content Security Policy**

### Backup and Recovery

1. **Database backups:**
```bash
pg_dump dbname > backup.sql
```

2. **Application backups:**
```bash
tar -czf ait-core-admin-backup.tar.gz /var/www/ait-core-admin
```

### Scaling Considerations

1. **Horizontal scaling** with load balancer
2. **Database connection pooling**
3. **Redis caching layer**
4. **CDN for static assets**
5. **WebSocket clustering**

### Troubleshooting

#### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

#### Port Already in Use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

#### WebSocket Not Connecting
- Check CORS configuration
- Verify WSS protocol for HTTPS sites
- Check firewall rules

#### High Memory Usage
- Adjust Node.js memory limit
- Enable garbage collection
- Check for memory leaks

### Support and Maintenance

- Monitor error logs regularly
- Update dependencies monthly
- Review security advisories
- Perform load testing
- Update documentation
- Train team members

---

## Quick Deployment Commands

### Development
```bash
pnpm dev
```

### Production Build
```bash
pnpm build && pnpm start
```

### Docker
```bash
docker-compose up -d
```

### PM2
```bash
pm2 start ecosystem.config.js
```

---

**Status**: Ready for Production Deployment
**Support**: support@ait-core.com
**Documentation**: https://docs.ait-core.com
