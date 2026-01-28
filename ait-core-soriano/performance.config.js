/**
 * AIT-CORE Performance Configuration
 * Centralized performance optimization settings
 */

module.exports = {
  // CDN Configuration
  cdn: {
    enabled: process.env.USE_CDN === 'true',
    url: process.env.CDN_URL || 'https://cdn.ait-core.com',
    domains: [
      'cdn.ait-core.com',
      'static.ait-core.com',
      'assets.ait-core.com',
    ],
    cloudflare: {
      enabled: true,
      zoneId: process.env.CLOUDFLARE_ZONE_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
    },
  },

  // Caching Strategies
  cache: {
    // Browser Cache
    browser: {
      static: {
        maxAge: 31536000, // 1 year
        staleWhileRevalidate: 86400, // 1 day
      },
      dynamic: {
        maxAge: 3600, // 1 hour
        staleWhileRevalidate: 60, // 1 minute
      },
      api: {
        maxAge: 0,
        staleWhileRevalidate: 60,
      },
    },

    // Server Cache (Redis)
    server: {
      enabled: true,
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: 0,
        ttl: {
          short: 300,    // 5 minutes
          medium: 3600,  // 1 hour
          long: 86400,   // 1 day
        },
      },
    },

    // Edge Cache (Vercel/Cloudflare)
    edge: {
      enabled: true,
      ttl: 60,
      staleWhileRevalidate: 86400,
    },
  },

  // Image Optimization
  images: {
    formats: ['image/avif', 'image/webp', 'image/jpeg'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    quality: {
      avif: 75,
      webp: 80,
      jpeg: 85,
    },
    loader: 'default', // 'cloudinary' | 'imgix' | 'akamai' | 'default'
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    lazyLoading: {
      enabled: true,
      threshold: 200, // pixels from viewport
      rootMargin: '50px',
    },
  },

  // Bundle Optimization
  bundle: {
    splitChunks: {
      minSize: 20000,
      maxSize: 244000,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
    },
    compression: {
      gzip: true,
      brotli: true,
      threshold: 8192, // 8kb
    },
    treeshaking: {
      enabled: true,
      sideEffects: false,
    },
  },

  // Lazy Loading Configuration
  lazyLoading: {
    routes: true,
    components: true,
    images: true,
    scripts: true,
    styles: false,
    thresholds: {
      components: 10000, // bytes
      routes: 50000,     // bytes
    },
  },

  // Preloading Strategy
  preload: {
    fonts: true,
    criticalCSS: true,
    criticalJS: true,
    dns: [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://cdn.ait-core.com',
    ],
    preconnect: [
      'https://fonts.googleapis.com',
      'https://cdn.ait-core.com',
    ],
  },

  // Performance Budgets
  budgets: {
    javascript: {
      initial: 300, // kb
      total: 500,   // kb
    },
    css: {
      initial: 100, // kb
      total: 150,   // kb
    },
    images: {
      total: 1000,  // kb
    },
    fonts: {
      total: 100,   // kb
    },
  },

  // Monitoring
  monitoring: {
    enabled: true,
    webVitals: true,
    customMetrics: true,
    sentry: {
      enabled: process.env.SENTRY_ENABLED === 'true',
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    },
    analytics: {
      enabled: true,
      provider: 'vercel', // 'google' | 'vercel' | 'plausible'
    },
  },

  // Service Worker
  serviceWorker: {
    enabled: process.env.NODE_ENV === 'production',
    scope: '/',
    strategies: {
      pages: 'NetworkFirst',
      images: 'CacheFirst',
      fonts: 'CacheFirst',
      scripts: 'StaleWhileRevalidate',
      styles: 'StaleWhileRevalidate',
      api: 'NetworkFirst',
    },
  },

  // HTTP/2 Server Push
  http2Push: {
    enabled: true,
    resources: [
      '/static/fonts/main.woff2',
      '/static/css/critical.css',
    ],
  },

  // Security Headers (performance-related)
  securityHeaders: {
    crossOriginEmbedderPolicy: false, // Can block some resources
    crossOriginOpenerPolicy: 'same-origin-allow-popups',
    crossOriginResourcePolicy: 'cross-origin',
  },
};
