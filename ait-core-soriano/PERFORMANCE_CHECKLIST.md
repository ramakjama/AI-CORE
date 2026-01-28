# AIT-CORE Performance Optimization Checklist

Use this checklist before deploying to production to ensure all performance optimizations are in place.

## Pre-Deployment Checklist

### 1. Bundle Optimization ✓

- [ ] Run bundle analysis: `ANALYZE=true pnpm run build`
- [ ] Check bundle sizes meet targets:
  - [ ] JavaScript < 300KB initial
  - [ ] CSS < 100KB
  - [ ] Total JS < 500KB
- [ ] Verify code splitting is working
- [ ] Check for duplicate dependencies: `pnpm list --depth=0`
- [ ] Remove unused dependencies
- [ ] Ensure tree shaking is enabled

### 2. Image Optimization ✓

- [ ] Run image optimizer: `pnpm run optimize:images`
- [ ] Verify WebP versions generated
- [ ] Check AVIF generation (optional): `GENERATE_AVIF=true pnpm run optimize:images`
- [ ] Ensure all images use Next.js Image component
- [ ] Verify lazy loading for below-fold images
- [ ] Check image sizes are appropriate
- [ ] Confirm responsive images with srcset

### 3. Caching Configuration ✓

- [ ] Redis connection configured
- [ ] Cache TTL values set appropriately
- [ ] Test cache hit/miss rates
- [ ] Verify cache invalidation works
- [ ] Configure browser cache headers
- [ ] Set up edge caching
- [ ] Test stale-while-revalidate

### 4. CDN Setup ✓

- [ ] CDN provider configured (Cloudflare/CloudFront)
- [ ] DNS configured to point to CDN
- [ ] Static assets routing to CDN
- [ ] SSL/TLS certificates configured
- [ ] Test cache purge functionality
- [ ] Verify compression (Gzip/Brotli)
- [ ] Configure cache rules per asset type

### 5. Lazy Loading ✓

- [ ] Routes lazy loaded where appropriate
- [ ] Heavy components lazy loaded
- [ ] Dynamic imports implemented
- [ ] Test lazy loading in production build
- [ ] Verify loading states
- [ ] Check error boundaries
- [ ] Test retry logic

### 6. Performance Monitoring ✓

- [ ] Web Vitals tracking enabled
- [ ] Analytics configured (GA/Vercel)
- [ ] Custom metrics endpoint working
- [ ] Error tracking configured (Sentry)
- [ ] Performance budgets set
- [ ] Alerts configured for violations
- [ ] Dashboard set up for monitoring

### 7. Compression ✓

- [ ] Gzip enabled
- [ ] Brotli enabled
- [ ] Verify compression in production
- [ ] Check compressed file sizes
- [ ] Test compression headers

### 8. Security Headers ✓

- [ ] CSP configured
- [ ] HSTS enabled
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set
- [ ] Referrer-Policy configured
- [ ] Permissions-Policy set

### 9. Environment Variables ✓

- [ ] Copy .env.performance to .env.production
- [ ] Configure CDN variables
- [ ] Set Redis connection details
- [ ] Configure monitoring services
- [ ] Set analytics IDs
- [ ] Verify all secrets are set

### 10. Testing ✓

- [ ] Test production build locally
- [ ] Verify all routes work
- [ ] Check lazy loading functionality
- [ ] Test on slow network
- [ ] Test on mobile devices
- [ ] Verify images load correctly
- [ ] Test cache headers
- [ ] Check compression

### 11. Documentation ✓

- [ ] Update PERFORMANCE_GUIDE.md
- [ ] Document any custom optimizations
- [ ] Update deployment instructions
- [ ] Document monitoring setup
- [ ] Update troubleshooting guide

## Performance Targets

### Web Vitals
- [ ] LCP < 2.5s (Target: < 2.0s)
- [ ] FID < 100ms (Target: < 50ms)
- [ ] CLS < 0.1 (Target: < 0.05)
- [ ] FCP < 1.8s (Target: < 1.5s)
- [ ] TTFB < 600ms (Target: < 400ms)
- [ ] INP < 200ms (Target: < 100ms)

### Bundle Sizes
- [ ] Initial JavaScript < 300KB
- [ ] Initial CSS < 100KB
- [ ] Total JavaScript < 500KB
- [ ] Total CSS < 150KB
- [ ] Largest image < 500KB
- [ ] Total fonts < 100KB

### Loading Times
- [ ] Time to Interactive < 3.8s
- [ ] Speed Index < 3.4s
- [ ] First Meaningful Paint < 2.5s

### Scores
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Best Practices > 90
- [ ] Lighthouse Accessibility > 90
- [ ] Lighthouse SEO > 90

## Commands Reference

```bash
# Build with analysis
ANALYZE=true pnpm run build

# Production build
NODE_ENV=production pnpm run build

# Optimize images
pnpm run optimize:images

# Optimize with AVIF
GENERATE_AVIF=true pnpm run optimize:images

# Analyze bundles
pnpm run analyze

# Clear Redis cache
pnpm run cache:clear

# Purge CDN cache
pnpm run cdn:purge

# Run all optimizations
pnpm run optimize:all
```

## Deployment Steps

1. **Pre-deployment**
   ```bash
   # Run all checks
   pnpm run lint
   pnpm run type-check
   pnpm run test
   pnpm run optimize:all
   ```

2. **Build**
   ```bash
   NODE_ENV=production pnpm run build
   ```

3. **Verify**
   ```bash
   # Check bundle sizes
   pnpm run analyze

   # Test production build locally
   pnpm run start
   ```

4. **Deploy**
   ```bash
   # Deploy to Vercel
   vercel --prod

   # Or deploy via CI/CD
   git push origin main
   ```

5. **Post-deployment**
   - Monitor Web Vitals
   - Check error rates
   - Verify cache hit rates
   - Review performance metrics
   - Test critical user flows

## Troubleshooting

### Large Bundle Size
1. Run `ANALYZE=true pnpm run build`
2. Identify large dependencies
3. Use dynamic imports for heavy components
4. Check for duplicate dependencies
5. Consider lighter alternatives

### Slow Load Times
1. Check Web Vitals in production
2. Verify CDN is working
3. Check image optimization
4. Review lazy loading implementation
5. Analyze network requests

### Cache Not Working
1. Verify Redis connection
2. Check cache headers in browser
3. Test cache invalidation
4. Review CDN cache rules
5. Check edge caching configuration

### Images Not Optimized
1. Re-run image optimizer
2. Check Next.js Image config
3. Verify CDN image transformation
4. Review image formats (WebP/AVIF)
5. Check responsive image sizes

## Monitoring Checklist

### Daily
- [ ] Review error rates
- [ ] Check Web Vitals scores
- [ ] Monitor cache hit rates
- [ ] Review slow queries

### Weekly
- [ ] Analyze bundle sizes
- [ ] Review performance trends
- [ ] Check CDN bandwidth usage
- [ ] Analyze user experience metrics

### Monthly
- [ ] Full performance audit
- [ ] Update dependencies
- [ ] Review and optimize images
- [ ] Analyze and optimize caching strategy
- [ ] Update performance documentation

## Sign-off

- [ ] All checklist items completed
- [ ] Performance targets met
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team informed

**Deployed by:** _________________
**Date:** _________________
**Version:** _________________

---

**Last Updated:** 2026-01-28
**Version:** 1.0.0
