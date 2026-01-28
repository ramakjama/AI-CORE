export const oauthConfig = {
  // Token expiration times
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  authorizationCodeExpiry: 600, // 10 minutes in seconds

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    algorithm: 'HS256' as const,
    issuer: process.env.JWT_ISSUER || 'ait-authenticator',
    audience: process.env.JWT_AUDIENCE || 'ait-core'
  },

  // OAuth2 grant types
  supportedGrantTypes: [
    'authorization_code',
    'password',
    'client_credentials',
    'refresh_token'
  ],

  // OAuth2 response types
  supportedResponseTypes: [
    'code',
    'token'
  ],

  // OAuth2 scopes
  scopes: {
    'read:profile': 'Read user profile information',
    'write:profile': 'Update user profile information',
    'read:users': 'Read users data',
    'write:users': 'Create and update users',
    'delete:users': 'Delete users',
    'admin': 'Full administrative access',
    'offline_access': 'Request refresh tokens'
  },

  // Social OAuth providers
  providers: {
    google: {
      enabled: process.env.GOOGLE_OAUTH_ENABLED === 'true',
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4001/api/v1/auth/google/callback'
    },
    github: {
      enabled: process.env.GITHUB_OAUTH_ENABLED === 'true',
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:4001/api/v1/auth/github/callback'
    },
    microsoft: {
      enabled: process.env.MICROSOFT_OAUTH_ENABLED === 'true',
      clientID: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:4001/api/v1/auth/microsoft/callback',
      tenant: process.env.MICROSOFT_TENANT || 'common'
    }
  },

  // MFA configuration
  mfa: {
    enabled: process.env.MFA_ENABLED !== 'false',
    issuer: process.env.MFA_ISSUER || 'AIT-CORE',
    window: 2, // Time window for TOTP validation
    algorithm: 'sha1' as const,
    digits: 6,
    period: 30
  },

  // Password policy
  passwordPolicy: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 5, // Number of previous passwords to check
    expiryDays: 90 // Password expiration in days
  },

  // Session configuration
  session: {
    maxConcurrentSessions: 5,
    idleTimeout: 1800, // 30 minutes in seconds
    absoluteTimeout: 28800 // 8 hours in seconds
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    skipSuccessfulRequests: false,
    standardHeaders: true,
    legacyHeaders: false
  },

  // Brute force protection
  bruteForce: {
    freeRetries: 3,
    minWait: 5 * 60 * 1000, // 5 minutes
    maxWait: 60 * 60 * 1000, // 1 hour
    lifetime: 24 * 60 * 60 // 24 hours in seconds
  }
};

export default oauthConfig;
