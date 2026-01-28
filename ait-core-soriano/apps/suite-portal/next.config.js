/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@ait-core/ui'],

  async rewrites() {
    return [
      // Auth Service - Port 8000
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:8000/api/auth/:path*'
      },
      // Documents Service - Port 8001
      {
        source: '/api/documents/:path*',
        destination: 'http://localhost:8001/api/documents/:path*'
      },
      // Spreadsheets Service - Port 8002
      {
        source: '/api/spreadsheets/:path*',
        destination: 'http://localhost:8002/api/spreadsheets/:path*'
      },
      // Presentations Service - Port 8003
      {
        source: '/api/presentations/:path*',
        destination: 'http://localhost:8003/api/presentations/:path*'
      },
      // Calendar Service - Port 8004
      {
        source: '/api/calendar/:path*',
        destination: 'http://localhost:8004/api/calendar/:path*'
      },
      // Tasks Service - Port 8005
      {
        source: '/api/tasks/:path*',
        destination: 'http://localhost:8005/api/tasks/:path*'
      },
      // Mail Service - Port 8006
      {
        source: '/api/mail/:path*',
        destination: 'http://localhost:8006/api/mail/:path*'
      },
      // Storage Service - Port 8007
      {
        source: '/api/storage/:path*',
        destination: 'http://localhost:8007/api/storage/:path*'
      },
      // CRM Service - Port 8008
      {
        source: '/api/crm/:path*',
        destination: 'http://localhost:8008/api/crm/:path*'
      },
      // Analytics Service - Port 8009
      {
        source: '/api/analytics/:path*',
        destination: 'http://localhost:8009/api/analytics/:path*'
      },
      // Notes Service - Port 8010
      {
        source: '/api/notes/:path*',
        destination: 'http://localhost:8010/api/notes/:path*'
      },
      // Forms Service - Port 8011
      {
        source: '/api/forms/:path*',
        destination: 'http://localhost:8011/api/forms/:path*'
      },
      // Bookings Service - Port 8012
      {
        source: '/api/bookings/:path*',
        destination: 'http://localhost:8012/api/bookings/:path*'
      },
      // Notifications Service - Port 8013
      {
        source: '/api/notifications/:path*',
        destination: 'http://localhost:8013/api/notifications/:path*'
      },
      // Search Service - Port 8014
      {
        source: '/api/search/:path*',
        destination: 'http://localhost:8014/api/search/:path*'
      },
      // Collaboration Service - Port 8015
      {
        source: '/api/collaboration/:path*',
        destination: 'http://localhost:8015/api/collaboration/:path*'
      },
      // Workflow Service - Port 8016
      {
        source: '/api/workflow/:path*',
        destination: 'http://localhost:8016/api/workflow/:path*'
      },
      // AI Service - Port 8017
      {
        source: '/api/ai/:path*',
        destination: 'http://localhost:8017/api/ai/:path*'
      },
      // WebSocket Service - Port 8018
      {
        source: '/api/ws/:path*',
        destination: 'http://localhost:8018/api/ws/:path*'
      }
    ]
  },

  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8007',
        pathname: '/storage/**',
      },
    ],
  },

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    return config
  },
}

module.exports = nextConfig
