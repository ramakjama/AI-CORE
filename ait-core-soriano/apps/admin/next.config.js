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

  images: {
    domains: ['localhost', 'ait-core.com', 'cdn.ait-core.com'],
    formats: performanceConfig.images.formats,
    deviceSizes: performanceConfig.images.deviceSizes,
    imageSizes: performanceConfig.images.imageSizes,
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-icons'],
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ["localhost:3001"],
    },
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB', 'INP'],
  },

  webpack: (config, { dev, isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Performance optimizations
    if (!dev) {
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          framework: {
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom)[\\/]/,
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
        },
        maxInitialRequests: 25,
        minSize: 20000,
      };
    }

    // Compression plugins
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

    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };

    return config;
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: process.env.API_URL || 'http://localhost:3000/api/:path*',
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
