# AIT-CORE Performance Optimizations

Complete performance optimization suite for the AIT-CORE Soriano ERP system.

## Quick Start

```bash
# Install dependencies
pnpm install

# Optimize images
pnpm run optimize:images

# Build with analysis
ANALYZE=true pnpm run build

# Run bundle analyzer
pnpm run analyze

# Deploy to production
vercel --prod
```

## What's Included

### 1. Webpack & Build Configuration

#### Files Created:
- `webpack.config.js` - Advanced Webpack configuration
- `.babelrc` - Babel optimization settings
- `apps/web/next.config.js` - Enhanced Next.js config (web)
- `apps/admin/next.config.js` - Enhanced Next.js config (admin)
- `turbo.json` - Updated with performance pipelines

#### Features:
- **Code Splitting**: Automatic chunking for optimal loading
- **Minification**: Terser with aggressive optimization
- **Compression**: Gzip and Brotli for all assets
- **Bundle Analysis**: Visual and statistical analysis
- **Persistent Caching**: Faster subsequent builds
- **Tree Shaking**: Remove unused code

### 2. Caching System

#### Files Created:
- `cache.config.js` - Redis and memory cache configuration
- `performance.config.js` - Centralized performance settings

#### Features:
- **Multi-layer Caching**:
  - Browser cache (static assets)
  - Memory cache (in-process)
  - Redis cache (shared)
  - Edge cache (CDN/Vercel)
- **Smart TTL Management**: Different TTLs per data type
- **Cache Decorators**: Easy function caching
- **Invalidation Strategies**: Pattern-based and single-key
- **Cache Stats**: Monitor cache performance

#### Usage:
```typescript
import { cacheManager } from '@/cache.config';

// Get/Set
await cacheManager.set('key', value, ttl);
const value = await cacheManager.get('key');

// Delete
await cacheManager.delete('key');
await cacheManager.deletePattern('pattern:*');
```

### 3. CDN Integration

#### Files Created:
- `cdn.config.js` - CDN configuration and utilities

#### Supported Providers:
- **Cloudflare** (Recommended)
- **AWS CloudFront**
- **Custom CDN**

#### Features:
- **Automatic Asset Routing**: JS, CSS, images, fonts
- **Cache Purging**: Single, pattern, or full
- **Image Transformations**: On-the-fly resizing and format conversion
- **Analytics**: CDN usage statistics
- **Preloading**: Warm cache for critical assets

#### Usage:
```typescript
import { cdnManager } from '@/cdn.config';

// Get CDN URL
const url = cdnManager.getCDNUrl('/images/logo.png');

// Purge cache
await cdnManager.purgeCache(['/images/logo.png']);
await cdnManager.purgeAll();

// Transform images
const optimized = transformImageUrl('/photo.jpg', {
  width: 800,
  quality: 85,
  format: 'webp'
});
```

### 4. Image Optimization

#### Files Created:
- `scripts/optimize-images.js` - Automated image optimizer

#### Features:
- **Automatic Compression**: 85% quality JPEG/PNG
- **WebP Generation**: Modern format for better compression
- **AVIF Support**: Optional next-gen format
- **Responsive Images**: Multiple sizes for different devices
- **Batch Processing**: Optimize all images at once
- **Progress Reporting**: Detailed optimization reports

#### Usage:
```bash
# Optimize all images
pnpm run optimize:images

# With AVIF generation
GENERATE_AVIF=true pnpm run optimize:images
```

### 5. Lazy Loading

#### Files Created:
- `apps/web/src/lib/lazy-loading.ts` - Lazy loading utilities

#### Features:
- **Route-Based**: Automatic route code splitting
- **Component-Based**: Dynamic component imports
- **Retry Logic**: Automatic retry on failed loads
- **Intersection Observer**: Load on scroll/view
- **Preloading**: Preload on hover/intent
- **Script/Style Loading**: Dynamic asset loading

#### Usage:
```typescript
import { lazyLoadWithRetry, LazyImage } from '@/lib/lazy-loading';

// Lazy load component
const HeavyComponent = lazyLoadWithRetry(
  () => import('./HeavyComponent'),
  { retries: 3, ssr: false }
);

// Lazy load image
<LazyImage
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  quality={85}
/>
```

### 6. Performance Monitoring

#### Files Created:
- `apps/web/src/lib/performance.ts` - Performance utilities
- `apps/web/src/app/api/analytics/vitals/route.ts` - Web Vitals API
- `apps/web/src/app/api/analytics/performance/route.ts` - Custom metrics API

#### Features:
- **Web Vitals Tracking**: LCP, FID, CLS, FCP, TTFB, INP
- **Custom Metrics**: Long tasks, layout shifts, slow resources
- **Network Awareness**: Adapt to connection speed
- **Memory Monitoring**: Track JS heap usage
- **Performance Marks**: Measure execution time
- **Real User Monitoring**: Production metrics

#### Usage:
```typescript
import {
  initPerformanceMonitoring,
  measureAsync,
  isSlowConnection
} from '@/lib/performance';

// Initialize monitoring
initPerformanceMonitoring();

// Measure performance
await measureAsync('fetchData', async () => {
  return await fetch('/api/data');
});

// Adapt to network
if (isSlowConnection()) {
  // Use lower quality assets
}
```

### 7. Bundle Analysis

#### Files Created:
- `scripts/analyze-bundle.js` - Bundle analyzer script

#### Features:
- **Size Analysis**: JS, CSS, image sizes
- **Threshold Warnings**: Alerts for large files
- **Recommendations**: Actionable optimization tips
- **Visual Reports**: HTML bundle visualization
- **Detailed Stats**: JSON statistics export

#### Usage:
```bash
# Run analyzer
pnpm run analyze

# Build with visual analysis
ANALYZE=true pnpm run build
```

### 8. Middleware Enhancements

#### Files Modified:
- `apps/web/src/middleware.ts` - Added performance headers

#### Features:
- **Cache Headers**: Automatic cache control
- **Compression Hints**: Brotli/Gzip detection
- **Resource Preloading**: Critical resource hints
- **Security Headers**: Performance-safe security
- **Edge Runtime**: Fast edge execution

### 9. Configuration Files

#### Files Created:
- `.env.performance` - Performance environment variables
- `vercel.json` - Vercel deployment configuration
- `performance.config.js` - Centralized settings

## Performance Targets

### Web Vitals
| Metric | Target | Threshold |
|--------|--------|-----------|
| LCP | < 2.0s | < 2.5s |
| FID | < 50ms | < 100ms |
| CLS | < 0.05 | < 0.1 |
| FCP | < 1.5s | < 1.8s |
| TTFB | < 400ms | < 600ms |
| INP | < 100ms | < 200ms |

### Bundle Sizes
| Asset | Target | Maximum |
|-------|--------|---------|
| Initial JS | 200KB | 300KB |
| Total JS | 400KB | 500KB |
| Initial CSS | 50KB | 100KB |
| Total CSS | 100KB | 150KB |
| Images | N/A | 500KB each |
| Fonts | 80KB | 100KB |

### Load Times
| Metric | Target |
|--------|--------|
| Time to Interactive | < 3.0s |
| Speed Index | < 3.0s |
| First Meaningful Paint | < 2.0s |

### Lighthouse Scores
| Category | Target |
|----------|--------|
| Performance | > 90 |
| Best Practices | > 90 |
| Accessibility | > 90 |
| SEO | > 90 |

## Scripts Reference

```bash
# Development
pnpm run dev                    # Start dev server

# Building
pnpm run build                  # Standard build
pnpm run build:analyze          # Build with bundle analysis
pnpm run build:production       # Production build

# Optimization
pnpm run optimize:images        # Optimize all images
pnpm run optimize:all           # Run all optimizations
pnpm run analyze                # Analyze bundles

# Caching
pnpm run cache:clear            # Clear Redis cache
pnpm run cdn:purge              # Purge CDN cache

# Testing
pnpm run test                   # Run tests
pnpm run lint                   # Lint code
pnpm run type-check             # Type check
```

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
# Copy performance config
cp .env.performance .env.production

# Edit with your values
nano .env.production
```

### 3. Set Up Redis (Optional but Recommended)

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install locally
# Windows: https://github.com/microsoftarchive/redis/releases
# Mac: brew install redis
# Linux: apt-get install redis-server
```

### 4. Configure CDN (Choose One)

#### Option A: Cloudflare
1. Sign up at cloudflare.com
2. Add your domain
3. Get Zone ID and API Token
4. Update `.env.production`:
   ```env
   CLOUDFLARE_ENABLED=true
   CLOUDFLARE_ZONE_ID=your_zone_id
   CLOUDFLARE_API_TOKEN=your_token
   ```

#### Option B: AWS CloudFront
1. Create CloudFront distribution
2. Get distribution ID
3. Configure AWS credentials
4. Update `.env.production`:
   ```env
   CLOUDFRONT_ENABLED=true
   CLOUDFRONT_DISTRIBUTION_ID=your_dist_id
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   ```

### 5. Optimize Assets

```bash
# Optimize images
pnpm run optimize:images

# Build with analysis
ANALYZE=true pnpm run build
```

### 6. Deploy

```bash
# Deploy to Vercel
vercel --prod

# Or use CI/CD
git push origin main
```

## Best Practices

### 1. Images
- Always use Next.js Image component
- Provide width and height
- Use appropriate quality (85% default)
- Enable lazy loading for below-fold images
- Use priority for above-fold images

### 2. Code Splitting
- Use dynamic imports for large components
- Split by route automatically (Next.js)
- Lazy load heavy libraries
- Avoid importing entire libraries

### 3. Caching
- Set appropriate TTLs per data type
- Use pattern-based invalidation
- Monitor cache hit rates
- Clear cache on deployments

### 4. Bundle Size
- Review bundle analysis regularly
- Remove unused dependencies
- Use tree-shakeable imports
- Consider lighter alternatives

### 5. Performance Monitoring
- Track Web Vitals in production
- Set up alerts for violations
- Monitor trends over time
- Test on real devices

## Troubleshooting

See [PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md) for detailed troubleshooting steps.

### Common Issues

1. **Large bundle size**: Run `pnpm run analyze` and follow recommendations
2. **Slow load times**: Check CDN configuration and image optimization
3. **Cache not working**: Verify Redis connection and cache headers
4. **Images not optimized**: Re-run optimizer and check Next.js Image config

## Documentation

- [Performance Guide](./PERFORMANCE_GUIDE.md) - Complete implementation guide
- [Performance Checklist](./PERFORMANCE_CHECKLIST.md) - Pre-deployment checklist
- [Performance Config](./performance.config.js) - Configuration reference

## Support

For issues or questions:
1. Check documentation
2. Review configuration files
3. Run diagnostic scripts
4. Contact DevOps team

## License

Proprietary - AIN TECH - Soriano Mediadores

---

**Version**: 1.0.0
**Last Updated**: 2026-01-28
**Maintained by**: AIN TECH DevOps Team
