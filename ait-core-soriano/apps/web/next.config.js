/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const performanceConfig = require('../../performance.config.js');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,

  transpilePackages: ['@ait-core/shared', '@ait-core/ui'],

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-icons'],
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3001"],
      bodySizeLimit: '2mb',
    },
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB', 'INP'],
  },

  images: {
    formats: performanceConfig.images.formats,
    deviceSizes: performanceConfig.images.deviceSizes,
    imageSizes: performanceConfig.images.imageSizes,
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    domains: ['localhost', 'cdn.ait-core.com', 'assets.ait-core.com'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    loader: performanceConfig.images.loader,
    unoptimized: false,
  },

  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    CDN_URL: performanceConfig.cdn.url,
  },

  webpack: (config, { dev, isServer, webpack }) => {
    // Aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    };

    // Fix for canvas module in jspdf
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        encoding: false,
        fs: false,
      };
    }

    // Performance optimizations
    if (!dev) {
      // Tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Better code splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
            },
            name(module) {
              const hash = require('crypto').createHash('sha1');
              hash.update(module.identifier());
              return hash.digest('hex').substring(0, 8);
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module, chunks) {
              return chunks.map((c) => c.name).join('_');
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
        maxInitialRequests: 25,
        minSize: 20000,
      };
    }

    // Compression
    if (!dev && !isServer) {
      const CompressionPlugin = require('compression-webpack-plugin');

      config.plugins.push(
        new CompressionPlugin({
          filename: '[path][base].gz',
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8,
        }),
        new CompressionPlugin({
          filename: '[path][base].br',
          algorithm: 'brotliCompress',
          test: /\.(js|css|html|svg)$/,
          compressionOptions: { level: 11 },
          threshold: 8192,
          minRatio: 0.8,
        })
      );
    }

    // Persistent caching
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };

    return config;
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    styledComponents: true,
  },

  // Output configuration
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Security and Performance headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
      // Static assets caching
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Images caching
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Font caching
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for performance
  async redirects() {
    return [];
  },

  // Rewrites for API proxy
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/api/v1/:path*',
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
