# AIT-CORE Performance Optimization Guide

Complete guide for implementing and managing performance optimizations in the AIT-CORE Soriano system.

## Table of Contents

1. [Overview](#overview)
2. [Bundle Optimization](#bundle-optimization)
3. [Caching Strategies](#caching-strategies)
4. [CDN Setup](#cdn-setup)
5. [Image Optimization](#image-optimization)
6. [Lazy Loading](#lazy-loading)
7. [Performance Monitoring](#performance-monitoring)
8. [Production Deployment](#production-deployment)

---

## Overview

This project includes comprehensive performance optimizations for production deployments:

- **Webpack Configuration**: Advanced code splitting and minification
- **Bundle Analysis**: Tools to analyze and reduce bundle sizes
- **Caching**: Multi-layer caching with Redis and edge caching
- **CDN Integration**: Cloudflare and CloudFront support
- **Image Optimization**: Automated image compression and format conversion
- **Lazy Loading**: Dynamic imports and route-based code splitting
- **Performance Monitoring**: Web Vitals and custom metrics tracking

---

## Bundle Optimization

### Configuration Files

#### 1. `webpack.config.js`
Main Webpack configuration with:
- Code splitting strategies
- Terser minification
- Compression (Gzip + Brotli)
- Bundle analysis
- Persistent caching

#### 2. Next.js Configurations
Enhanced configurations for both web and admin apps:
- `apps/web/next.config.js`
- `apps/admin/next.config.js`

Features:
- SWC minification
- Package optimization
- Tree shaking
- Automatic static optimization

### Bundle Analysis

Run bundle analysis:

```bash
# Analyze web app
cd apps/web
ANALYZE=true pnpm run build

# Analyze admin app
cd apps/admin
ANALYZE=true pnpm run build

# Run bundle analyzer script
node scripts/analyze-bundle.js
```

This generates:
- `bundle-report.html` - Visual bundle analysis
- `bundle-stats.json` - Detailed statistics
- Console recommendations for optimization

### Optimization Strategies

#### Code Splitting

```typescript
// Route-based splitting (automatic with Next.js)
// Component-based splitting
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});
```

#### Tree Shaking

```javascript
// Named imports (tree-shakeable)
import { Button, Card } from '@/components';

// Avoid default imports of large libraries
import map from 'lodash/map'; // Good
import _ from 'lodash'; // Bad - imports entire library
```

---

## Caching Strategies

### Multi-Layer Caching Architecture

1. **Browser Cache** - Static assets
2. **Memory Cache** - In-process cache
3. **Redis Cache** - Shared application cache
4. **Edge Cache** - CDN/Vercel Edge Network

### Configuration

Edit `cache.config.js` for:
- TTL settings per data type
- Redis connection settings
- Cache key patterns

### Usage

```typescript
import { cacheManager, ttlConfig, keyPatterns } from '@/cache.config';

// Initialize cache
await cacheManager.initialize();

// Get from cache
const user = await cacheManager.get(keyPatterns.user(userId));

// Set in cache
await cacheManager.set(
  keyPatterns.user(userId),
  userData,
  ttlConfig.userProfile
);

// Delete from cache
await cacheManager.delete(keyPatterns.user(userId));

// Delete by pattern
await cacheManager.deletePattern('user:*');

// Cache decorator
import { cached } from '@/cache.config';

class UserService {
  @cached(ttlConfig.userProfile, (userId) => keyPatterns.user(userId))
  async getUser(userId: string) {
    // This will be cached automatically
    return fetchUserFromDB(userId);
  }
}
```

### Cache Invalidation

```typescript
// Single key
await cacheManager.delete('user:123');

// Pattern-based
await cacheManager.deletePattern('policies:user:123:*');

// Clear all
await cacheManager.clear();
```

---

## CDN Setup

### Supported CDN Providers

1. **Cloudflare** (Recommended)
2. **AWS CloudFront**
3. **Custom CDN**

### Configuration

Edit `.env.performance`:

```env
# Cloudflare
CLOUDFLARE_ENABLED=true
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_DOMAIN=your-domain.com

# CloudFront (Alternative)
CLOUDFRONT_ENABLED=false
CLOUDFRONT_DISTRIBUTION_ID=your_dist_id
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

### Usage

```typescript
import { cdnManager } from '@/cdn.config';

// Get CDN URL for asset
const imageUrl = cdnManager.getCDNUrl('/images/logo.png', 'images');

// Purge cache
await cdnManager.purgeCache(['/images/logo.png']);

// Purge all
await cdnManager.purgeAll();

// Purge by pattern
await cdnManager.purgeByPattern('*.js');

// Preload assets
await cdnManager.preloadAssets([
  '/fonts/main.woff2',
  '/images/hero.jpg',
]);

// Get analytics
const stats = await cdnManager.getAnalytics(startDate, endDate);
```

### Image Transformations

```typescript
import { transformImageUrl, generateSrcSet } from '@/cdn.config';

// Transform image
const optimizedUrl = transformImageUrl('/images/photo.jpg', {
  width: 800,
  quality: 85,
  format: 'webp',
});

// Generate srcset for responsive images
const srcSet = generateSrcSet('/images/photo.jpg', [640, 768, 1024, 1280]);
```

---

## Image Optimization

### Automated Optimization Script

Run the image optimizer:

```bash
# Optimize all images in apps/*/public
node scripts/optimize-images.js

# Generate AVIF formats (slower but better compression)
GENERATE_AVIF=true node scripts/optimize-images.js
```

Features:
- Compresses JPEG/PNG images (85% quality)
- Generates WebP versions
- Optionally generates AVIF versions
- Resizes images to max 2048px width
- Reports file size savings

### Manual Image Optimization

```typescript
import { LazyImage } from '@/lib/lazy-loading';

// Use Next.js Image component with optimizations
<LazyImage
  src="/images/photo.jpg"
  alt="Description"
  width={800}
  height={600}
  quality={85}
  priority={false} // Set true for above-fold images
/>
```

### Image Loading Strategies

```typescript
import { getImageLoadingStrategy } from '@/lib/performance';

// Adapt quality based on connection speed
const strategy = getImageLoadingStrategy();

<Image
  src="/photo.jpg"
  quality={strategy.quality}
  loading={strategy.eager ? 'eager' : 'lazy'}
/>
```

---

## Lazy Loading

### Route-Based Lazy Loading

Pre-configured lazy-loaded routes in `apps/web/src/lib/lazy-loading.ts`:

```typescript
import {
  LazyDashboard,
  LazyPolicies,
  LazyClaims,
  LazyCustomers,
} from '@/lib/lazy-loading';

// Use in your routing
<Route path="/dashboard" component={LazyDashboard} />
```

### Component Lazy Loading

```typescript
import { lazyLoad, lazyLoadWithRetry } from '@/lib/lazy-loading';

// Basic lazy loading
const MyComponent = lazyLoad(() => import('./MyComponent'));

// With retry logic (recommended)
const MyComponent = lazyLoadWithRetry(
  () => import('./MyComponent'),
  { retries: 3, ssr: false }
);

// Preload for better UX
import { preloadComponent } from '@/lib/lazy-loading';

function onMouseEnter() {
  preloadComponent(() => import('./HeavyComponent'));
}
```

### Lazy Loading on Scroll

```typescript
import { useLazyLoadOnView } from '@/lib/lazy-loading';

function MyComponent() {
  const ref = useRef(null);
  const [Component, setComponent] = useState(null);

  useLazyLoadOnView(ref, async () => {
    const module = await import('./HeavyComponent');
    setComponent(() => module.default);
  });

  return (
    <div ref={ref}>
      {Component ? <Component /> : <Placeholder />}
    </div>
  );
}
```

### Script and Style Lazy Loading

```typescript
import { loadScript, loadStylesheet } from '@/lib/lazy-loading';

// Load external scripts on demand
await loadScript('https://cdn.example.com/library.js');

// Load stylesheets on demand
await loadStylesheet('/styles/theme.css');
```

---

## Performance Monitoring

### Web Vitals

Automatically tracked in production:
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **FCP** (First Contentful Paint)
- **TTFB** (Time to First Byte)
- **INP** (Interaction to Next Paint)

### Setup

```typescript
// apps/web/src/pages/_app.tsx
import { reportWebVitals } from '@/lib/performance';

export function reportWebVitals(metric) {
  reportWebVitals(metric);
}
```

### Custom Performance Monitoring

```typescript
import {
  initPerformanceMonitoring,
  measurePerformance,
  measureAsync,
} from '@/lib/performance';

// Initialize monitoring
initPerformanceMonitoring();

// Measure function execution
const result = measurePerformance('heavyCalculation', () => {
  // Your code here
  return calculation();
});

// Measure async operations
const data = await measureAsync('fetchData', async () => {
  return await fetch('/api/data');
});
```

### Performance Utilities

```typescript
import {
  debounce,
  throttle,
  getMemoryUsage,
  getNetworkInfo,
  isSlowConnection,
} from '@/lib/performance';

// Debounce expensive operations
const debouncedSearch = debounce(searchFunction, 300);

// Throttle frequent events
const throttledScroll = throttle(scrollHandler, 100);

// Check memory usage
const memory = getMemoryUsage();
console.log(`Memory usage: ${memory.usedPercent}%`);

// Adapt to network conditions
if (isSlowConnection()) {
  // Load low-quality assets
}
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Run bundle analysis
- [ ] Optimize images
- [ ] Set up CDN
- [ ] Configure Redis cache
- [ ] Enable compression
- [ ] Test lazy loading
- [ ] Verify Web Vitals
- [ ] Set up monitoring

### Build Commands

```bash
# Standard production build
pnpm run build

# Build with analysis
ANALYZE=true pnpm run build

# Build with optimizations
NODE_ENV=production pnpm run build
```

### Environment Variables

Copy and configure `.env.performance`:

```bash
cp .env.performance .env.production
# Edit with your production values
```

### Vercel Deployment

Configuration in `vercel.json`:

```bash
# Deploy to Vercel
vercel --prod

# With custom configuration
vercel --prod --build-env ANALYZE=true
```

### Performance Headers

Automatically configured in Next.js config:
- Cache-Control headers for static assets
- Security headers (CSP, HSTS, etc.)
- Compression enabled
- ETags for cache validation

### Monitoring in Production

1. **Vercel Analytics**: Automatically enabled
2. **Sentry**: Configure in `.env.production`
3. **Custom Metrics**: POST to `/api/analytics/*`

### Performance Targets

| Metric | Target | Threshold |
|--------|--------|-----------|
| LCP | < 2.5s | < 4.0s |
| FID | < 100ms | < 300ms |
| CLS | < 0.1 | < 0.25 |
| TTFB | < 600ms | < 1800ms |
| JS Bundle | < 300KB | < 500KB |
| CSS Bundle | < 100KB | < 150KB |

---

## Maintenance

### Regular Tasks

1. **Weekly**: Review bundle analysis
2. **Weekly**: Check CDN cache hit rates
3. **Monthly**: Optimize images
4. **Monthly**: Review performance metrics
5. **Quarterly**: Update dependencies
6. **Quarterly**: Review caching strategies

### Troubleshooting

#### Large Bundle Sizes

```bash
# Analyze bundles
ANALYZE=true pnpm run build

# Check for duplicate dependencies
pnpm list --depth=0

# Use bundle analyzer recommendations
node scripts/analyze-bundle.js
```

#### Cache Issues

```bash
# Clear Redis cache
redis-cli FLUSHDB

# Purge CDN cache
node -e "require('./cdn.config').cdnManager.purgeAll()"

# Clear Next.js cache
rm -rf apps/web/.next/cache
```

#### Image Optimization Issues

```bash
# Re-optimize all images
node scripts/optimize-images.js

# Check image formats
find apps/*/public -name "*.jpg" -o -name "*.png"
```

---

## Additional Resources

- [Next.js Performance Documentation](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Webpack Documentation](https://webpack.js.org/guides/)
- [Cloudflare CDN Guide](https://developers.cloudflare.com/cache/)
- [Redis Caching Best Practices](https://redis.io/docs/manual/patterns/)

---

## Support

For issues or questions:
1. Check this guide
2. Review configuration files
3. Run diagnostic scripts
4. Contact DevOps team

---

**Last Updated**: 2026-01-28
**Version**: 1.0.0
