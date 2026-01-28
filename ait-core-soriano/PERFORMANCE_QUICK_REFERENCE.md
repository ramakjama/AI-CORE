# AIT-CORE Performance - Quick Reference Card

## 🚀 Quick Start (Copy-Paste Ready)

```bash
# Setup
pnpm run setup:performance

# Configure
cp .env.performance .env.production

# Optimize
pnpm run optimize:images

# Build & Analyze
ANALYZE=true pnpm run build

# Deploy
vercel --prod
```

---

## 📋 Essential Commands

```bash
# Development
pnpm run dev                    # Start dev server
pnpm run lint                   # Lint code
pnpm run type-check             # Type check

# Building
pnpm run build                  # Standard build
pnpm run build:analyze          # Build with analysis
pnpm run build:production       # Production build

# Optimization
pnpm run optimize:images        # Optimize images
pnpm run optimize:all           # Run all optimizations
pnpm run analyze                # Analyze bundles

# Cache & CDN
pnpm run cache:clear            # Clear Redis
pnpm run cdn:purge              # Purge CDN

# Deployment
vercel --prod                   # Deploy to production
```

---

## 🎯 Performance Targets (at a glance)

| Metric | Target | Maximum |
|--------|--------|---------|
| LCP | < 2.0s | < 2.5s |
| FID | < 50ms | < 100ms |
| CLS | < 0.05 | < 0.1 |
| JS (initial) | < 200KB | < 300KB |
| CSS (initial) | < 50KB | < 100KB |
| Lighthouse | > 90 | > 85 |

---

## 🛠️ Code Snippets

### Lazy Load Component
```typescript
import { lazyLoadWithRetry } from '@/lib/lazy-loading';

const HeavyComponent = lazyLoadWithRetry(
  () => import('./HeavyComponent'),
  { retries: 3, ssr: false }
);
```

### Lazy Load Image
```typescript
import { LazyImage } from '@/lib/lazy-loading';

<LazyImage
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  quality={85}
/>
```

### Cache Data
```typescript
import { cacheManager, ttlConfig } from '@/cache.config';

// Set
await cacheManager.set('key', data, ttlConfig.userProfile);

// Get
const data = await cacheManager.get('key');

// Delete
await cacheManager.delete('key');
```

### CDN URL
```typescript
import { cdnManager } from '@/cdn.config';

const url = cdnManager.getCDNUrl('/images/logo.png');
```

### Measure Performance
```typescript
import { measureAsync } from '@/lib/performance';

const data = await measureAsync('fetchData', async () => {
  return await fetch('/api/data');
});
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `webpack.config.js` | Webpack optimization |
| `performance.config.js` | Central settings |
| `cache.config.js` | Caching config |
| `cdn.config.js` | CDN config |
| `apps/web/next.config.js` | Next.js config |
| `apps/web/src/lib/lazy-loading.ts` | Lazy loading |
| `apps/web/src/lib/performance.ts` | Performance utils |

---

## 🔍 Troubleshooting

### Large Bundle Size
```bash
ANALYZE=true pnpm run build
pnpm run analyze
# Check recommendations in console
```

### Slow Load Times
1. Check CDN is configured
2. Run `pnpm run optimize:images`
3. Verify caching headers
4. Review lazy loading

### Cache Not Working
```bash
# Check Redis
redis-cli ping

# Clear cache
pnpm run cache:clear

# Check headers in browser DevTools
```

### Images Not Optimized
```bash
pnpm run optimize:images
# Check Next.js Image component usage
```

---

## 📊 Monitoring

### Web Vitals (in browser console)
```javascript
// Add to _app.tsx
export function reportWebVitals(metric) {
  console.log(metric);
}
```

### Network Info
```javascript
import { getNetworkInfo } from '@/lib/performance';
console.log(getNetworkInfo());
```

### Memory Usage
```javascript
import { getMemoryUsage } from '@/lib/performance';
console.log(getMemoryUsage());
```

---

## 🌐 Environment Variables (Quick Setup)

```env
# CDN
USE_CDN=true
CDN_URL=https://cdn.your-domain.com

# Cloudflare
CLOUDFLARE_ENABLED=true
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_token

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Monitoring
SENTRY_ENABLED=true
SENTRY_DSN=your_dsn
```

---

## ✅ Pre-Deployment Checklist (Quick)

- [ ] Run `pnpm run optimize:all`
- [ ] Check bundle sizes with `pnpm run analyze`
- [ ] Configure CDN
- [ ] Set up Redis (optional)
- [ ] Update environment variables
- [ ] Test production build locally
- [ ] Deploy with `vercel --prod`
- [ ] Monitor Web Vitals

---

## 📚 Documentation Links

- **[PERFORMANCE_INDEX.md](./PERFORMANCE_INDEX.md)** - Central index
- **[PERFORMANCE_README.md](./PERFORMANCE_README.md)** - Quick start
- **[PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md)** - Complete guide
- **[PERFORMANCE_CHECKLIST.md](./PERFORMANCE_CHECKLIST.md)** - Full checklist

---

## 🆘 Quick Help

**Problem**: Bundle too large
**Solution**: `ANALYZE=true pnpm run build` → follow recommendations

**Problem**: Images slow
**Solution**: `pnpm run optimize:images` + use Next.js Image

**Problem**: Cache not working
**Solution**: Check Redis connection + verify headers

**Problem**: CDN not working
**Solution**: Verify configuration in cdn.config.js

**Problem**: Slow performance
**Solution**: Check Web Vitals + review lazy loading

---

## 💡 Quick Wins (< 30 minutes each)

1. ✅ **Enable compression** (Already done via webpack.config.js)
2. 🖼️ **Optimize images**: `pnpm run optimize:images`
3. 📦 **Analyze bundle**: `ANALYZE=true pnpm run build`
4. 🔄 **Add lazy loading**: Use utilities in lazy-loading.ts
5. 🌐 **Configure CDN**: Follow cdn.config.js setup

---

**Print this page and keep it handy!**

---

**Version**: 1.0.0 | **Last Updated**: 2026-01-28
