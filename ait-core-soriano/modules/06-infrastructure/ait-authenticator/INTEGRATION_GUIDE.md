# AIT-AUTHENTICATOR Integration Guide

## Overview

This guide explains how to integrate **AIT-AUTHENTICATOR** into your applications for centralized authentication, SSO, and RBAC.

**What you'll learn**:
- Frontend integration (React, Next.js)
- Backend integration (NestJS, Express)
- SSO cookie configuration
- RBAC implementation
- Testing strategies

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Frontend Integration](#frontend-integration)
3. [Backend Integration](#backend-integration)
4. [SSO Configuration](#sso-configuration)
5. [RBAC Implementation](#rbac-implementation)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Install Dependencies

```bash
# Frontend
pnpm add axios
pnpm add js-cookie

# Backend (NestJS)
pnpm add @nestjs/passport @nestjs/jwt passport passport-jwt
pnpm add ioredis
```

### 2. Configure Environment Variables

```env
# Authentication Service
AUTH_SERVICE_URL=http://localhost:3002
JWT_ACCESS_SECRET=your-access-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# OAuth2 Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# SSO Configuration
COOKIE_DOMAIN=.sorianomediadores.es
FRONTEND_URL=https://app.sorianomediadores.es

# Redis
REDIS_URL=redis://localhost:6379
```

### 3. Start the Authentication Service

```bash
cd ait-core-soriano/modules/06-infrastructure/ait-authenticator
pnpm install
pnpm run dev
```

Service will be available at: `http://localhost:3002`

---

## Frontend Integration

### React/Next.js Integration

#### 1. Create Auth Context

Create `contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  loginWithMicrosoft: () => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const AUTH_API = process.env.NEXT_PUBLIC_AUTH_API || 'http://localhost:3002/auth';

  // Initialize: Check for existing token
  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('access_token');

      if (token) {
        try {
          const response = await axios.get(`${AUTH_API}/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data.data);
        } catch (error) {
          // Token invalid, clear it
          Cookies.remove('access_token');
          localStorage.removeItem('refresh_token');
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // Login with email/password
  const login = async (email: string, password: string) => {
    const response = await axios.post(`${AUTH_API}/login`, { email, password });
    const { user, accessToken, refreshToken } = response.data.data;

    // Store tokens
    Cookies.set('access_token', accessToken, {
      expires: 1/96, // 15 minutes
      secure: true,
      sameSite: 'lax',
    });
    localStorage.setItem('refresh_token', refreshToken);

    setUser(user);
  };

  // Login with Google
  const loginWithGoogle = () => {
    window.location.href = `${AUTH_API}/google`;
  };

  // Login with Microsoft
  const loginWithMicrosoft = () => {
    window.location.href = `${AUTH_API}/microsoft`;
  };

  // Logout
  const logout = async () => {
    const token = Cookies.get('access_token');

    try {
      await axios.post(
        `${AUTH_API}/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Logout error:', error);
    }

    Cookies.remove('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  // Refresh access token
  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${AUTH_API}/refresh`, { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

    Cookies.set('access_token', accessToken, {
      expires: 1/96,
      secure: true,
      sameSite: 'lax',
    });
    localStorage.setItem('refresh_token', newRefreshToken);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        loginWithMicrosoft,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### 2. Create Login Component

Create `components/LoginForm.tsx`:

```typescript
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginWithGoogle, loginWithMicrosoft } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    }
  };

  return (
    <div className="login-form">
      <h2>Login</h2>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>

      <div className="oauth-buttons">
        <button onClick={loginWithGoogle}>
          <img src="/google-icon.svg" alt="Google" />
          Login with Google
        </button>
        <button onClick={loginWithMicrosoft}>
          <img src="/microsoft-icon.svg" alt="Microsoft" />
          Login with Microsoft
        </button>
      </div>
    </div>
  );
}
```

#### 3. Create Protected Route Component

Create `components/ProtectedRoute.tsx`:

```typescript
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
}

export function ProtectedRoute({ children, requiredPermissions = [] }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.some(perm =>
          user.permissions.includes(perm) || user.permissions.includes('*')
        );

        if (!hasPermission) {
          router.push('/unauthorized');
        }
      }
    }
  }, [user, loading, requiredPermissions, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

#### 4. Create Axios Interceptor for Auto Token Refresh

Create `lib/axios.ts`:

```typescript
import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Request interceptor: Add access token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_AUTH_API}/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Update tokens
        Cookies.set('access_token', accessToken, {
          expires: 1/96,
          secure: true,
          sameSite: 'lax',
        });
        localStorage.setItem('refresh_token', newRefreshToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

#### 5. Usage in Pages

```typescript
// pages/policies.tsx
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

export default function PoliciesPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredPermissions={['policies:read']}>
      <div>
        <h1>Policies</h1>
        <p>Welcome, {user?.email}</p>
        {/* Your content */}
      </div>
    </ProtectedRoute>
  );
}
```

---

## Backend Integration

### NestJS Integration

#### 1. Create JWT Strategy

Create `strategies/jwt.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    // Payload from JWT token
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
    };
  }
}
```

#### 2. Create Auth Module

Create `auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
```

#### 3. Use Guards in Controllers

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RBACGuard } from './guards/rbac.guard';
import { Permissions } from './decorators/permissions.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('policies')
@UseGuards(JwtAuthGuard, RBACGuard)
export class PoliciesController {
  @Get()
  @Permissions('policies:read')
  async findAll(@CurrentUser() user) {
    return this.policiesService.findAll();
  }

  @Post()
  @Permissions('policies:create')
  async create(@CurrentUser() user, @Body() data) {
    return this.policiesService.create(data);
  }
}
```

---

## SSO Configuration

### Cross-Platform SSO Setup

SSO works by sharing authentication cookies across subdomains.

#### 1. Configure Cookie Domain

Set the cookie domain to your root domain:

```env
# .env
COOKIE_DOMAIN=.sorianomediadores.es
```

This allows cookies to be shared between:
- `app.sorianomediadores.es`
- `admin.sorianomediadores.es`
- `api.sorianomediadores.es`

#### 2. Apply SSO Middleware (Backend)

In your NestJS app:

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parsing
  app.use(cookieParser());

  // CORS with credentials
  app.enableCors({
    origin: [
      'https://app.sorianomediadores.es',
      'https://admin.sorianomediadores.es',
    ],
    credentials: true, // Important for SSO cookies
  });

  await app.listen(3000);
}
bootstrap();
```

#### 3. SSO Middleware Usage

```typescript
// Apply SSO middleware globally
import { SSOMiddleware } from '@ait-core/authenticator';

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SSOMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
```

---

## RBAC Implementation

### Frontend: Permission-Based UI

```typescript
// components/PermissionGate.tsx
import { useAuth } from '../contexts/AuthContext';

interface PermissionGateProps {
  children: React.ReactNode;
  permissions: string[];
  fallback?: React.ReactNode;
}

export function PermissionGate({ children, permissions, fallback = null }: PermissionGateProps) {
  const { user } = useAuth();

  if (!user) return <>{fallback}</>;

  const hasPermission = permissions.some(perm =>
    user.permissions.includes(perm) || user.permissions.includes('*')
  );

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

// Usage
<PermissionGate permissions={['policies:create']}>
  <button onClick={createPolicy}>Create Policy</button>
</PermissionGate>
```

### Backend: Permission Checks in Services

```typescript
// services/policies.service.ts
import { ForbiddenException } from '@nestjs/common';

export class PoliciesService {
  async findAll(user: any) {
    // Admins can see all policies
    if (this.hasPermission(user.permissions, 'policies:read')) {
      return this.policiesRepository.findAll();
    }

    // Users can only see their own
    if (this.hasPermission(user.permissions, 'policies:read:own')) {
      return this.policiesRepository.findByUserId(user.userId);
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  private hasPermission(userPermissions: string[], required: string): boolean {
    if (userPermissions.includes('*')) return true;
    if (userPermissions.includes(required)) return true;

    const [resource, action] = required.split(':');
    return userPermissions.includes(`${resource}:*`);
  }
}
```

---

## Testing

### Unit Tests

```typescript
// jwt.service.spec.ts
import { Test } from '@nestjs/testing';
import { JwtTokenService } from './jwt.service';
import { RedisService } from './redis.service';

describe('JwtTokenService', () => {
  let service: JwtTokenService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [JwtTokenService, RedisService],
    }).compile();

    service = module.get<JwtTokenService>(JwtTokenService);
  });

  it('should generate token pair', async () => {
    const tokens = await service.generateTokenPair(
      'user-id',
      'user@example.com',
      UserRole.USER
    );

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.expiresIn).toBe(900);
  });

  it('should validate access token', async () => {
    const tokens = await service.generateTokenPair('user-id', 'user@example.com', UserRole.USER);
    const payload = await service.validateAccessToken(tokens.accessToken);

    expect(payload.sub).toBe('user-id');
    expect(payload.email).toBe('user@example.com');
  });
});
```

### E2E Tests

```typescript
// auth.e2e-spec.ts
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication E2E', () => {
  let app;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('should login with valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' })
      .expect(401);
  });
});
```

---

## Troubleshooting

### Issue: Tokens Not Working Across Domains

**Solution**: Ensure `COOKIE_DOMAIN` is set correctly with a leading dot:
```env
COOKIE_DOMAIN=.sorianomediadores.es
```

### Issue: CORS Errors

**Solution**: Enable credentials in CORS config:
```typescript
app.enableCors({
  origin: ['https://app.sorianomediadores.es'],
  credentials: true,
});
```

### Issue: Token Expired Too Quickly

**Solution**: Implement automatic token refresh using axios interceptors (see section above).

### Issue: Redis Connection Failed

**Solution**: Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

---

## Best Practices

1. **Always use HTTPS** in production
2. **Store refresh tokens securely** (localStorage or httpOnly cookies)
3. **Implement token refresh** before expiration
4. **Use SSO cookies** for seamless cross-platform experience
5. **Apply RBAC** at both frontend and backend
6. **Monitor authentication metrics** (failed logins, token refreshes)
7. **Enable MFA** for admin accounts
8. **Rotate secrets** regularly

---

## Next Steps

1. Read [PERMISSIONS_MATRIX.md](./PERMISSIONS_MATRIX.md) for RBAC details
2. Review [AIT_AUTHENTICATOR_API.md](./AIT_AUTHENTICATOR_API.md) for API reference
3. Implement MFA for enhanced security
4. Set up monitoring and alerting

---

**Last Updated**: 2026-01-28
**Version**: 1.0.0
**Support**: support@aintechmediadores.com
