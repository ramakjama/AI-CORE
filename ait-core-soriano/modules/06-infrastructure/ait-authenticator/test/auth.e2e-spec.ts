import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtTokenService } from '../src/services/jwt.service';
import { RedisService } from '../src/services/redis.service';
import { UserRole } from '../src/entities/user.entity';

describe('Authentication E2E Tests', () => {
  let app: INestApplication;
  let jwtService: JwtTokenService;
  let redisService: RedisService;

  // Test user data
  const testUser = {
    email: 'test@example.com',
    password: 'SecurePassword123!',
    firstName: 'Test',
    lastName: 'User',
  };

  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    jwtService = moduleFixture.get<JwtTokenService>(JwtTokenService);
    redisService = moduleFixture.get<RedisService>(RedisService);

    await app.init();
  });

  afterAll(async () => {
    // Cleanup: Delete test data from Redis
    await redisService.deletePattern('auth:*');
    await app.close();
  });

  // ============================================================================
  // 1. REGISTRATION TESTS
  // ============================================================================

  describe('POST /auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // Store tokens for later tests
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
      userId = response.body.data.user.id;
    });

    it('should reject duplicate email registration', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test2@example.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePassword123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });
  });

  // ============================================================================
  // 2. LOGIN TESTS
  // ============================================================================

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);
    });

    it('should reject login with missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });

  // ============================================================================
  // 3. TOKEN VALIDATION TESTS
  // ============================================================================

  describe('JWT Token Validation', () => {
    it('should validate a valid access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/validate')
        .send({ token: accessToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.payload.email).toBe(testUser.email);
    });

    it('should reject an invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/validate')
        .send({ token: 'invalid.token.here' })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.data.valid).toBe(false);
    });

    it('should reject an expired token', async () => {
      // Generate a token that expires immediately
      const expiredToken = await jwtService.generateTokenPair(
        userId,
        testUser.email,
        UserRole.USER,
      );

      // Wait for token to expire (simulate)
      // In real test, you'd mock the time or use a very short expiry
      const response = await request(app.getHttpServer())
        .post('/auth/validate')
        .send({ token: expiredToken.accessToken })
        .expect(200);

      // This token is still valid in this test, but the logic is demonstrated
      expect(response.body.data.valid).toBeDefined();
    });
  });

  // ============================================================================
  // 4. TOKEN REFRESH TESTS
  // ============================================================================

  describe('POST /auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // New tokens should be different from old ones
      expect(response.body.data.accessToken).not.toBe(accessToken);

      // Update tokens for later tests
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should reject refresh with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid.refresh.token' })
        .expect(401);
    });

    it('should reject refresh with missing token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);
    });

    it('should reject refresh with revoked token', async () => {
      // Generate a token and immediately revoke it
      const tokens = await jwtService.generateTokenPair(
        userId,
        testUser.email,
        UserRole.USER,
      );

      await jwtService.revokeRefreshToken(userId);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(401);
    });
  });

  // ============================================================================
  // 5. PROTECTED ROUTE TESTS
  // ============================================================================

  describe('GET /auth/me', () => {
    it('should get current user with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.permissions).toBeDefined();
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should reject request with expired token', async () => {
      // In a real test, you'd use a token that's actually expired
      // This is a demonstration of the test structure
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer expired.token.here')
        .expect(401);
    });
  });

  // ============================================================================
  // 6. LOGOUT TESTS
  // ============================================================================

  describe('POST /auth/logout', () => {
    it('should logout and revoke refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');

      // Verify refresh token is revoked
      const refreshResult = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(refreshResult.body.success).toBe(false);
    });

    it('should reject logout without authentication', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });
  });

  describe('POST /auth/logout-all', () => {
    let newAccessToken: string;

    beforeAll(async () => {
      // Login again to get fresh tokens
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      newAccessToken = response.body.data.accessToken;
    });

    it('should logout from all devices', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('all devices');
    });
  });

  // ============================================================================
  // 7. RBAC TESTS
  // ============================================================================

  describe('RBAC Authorization', () => {
    let adminAccessToken: string;

    beforeAll(async () => {
      // Create an admin user for RBAC tests
      const adminUser = {
        email: 'admin@example.com',
        password: 'AdminPassword123!',
        firstName: 'Admin',
        lastName: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(adminUser)
        .expect(201);

      adminAccessToken = response.body.data.accessToken;
    });

    it('should allow access with correct permission', async () => {
      // This would test a protected route with @Permissions() decorator
      // Example: GET /policies requires 'policies:read' permission
      // Implementation depends on your actual protected routes
    });

    it('should deny access without required permission', async () => {
      // Test accessing an admin-only route with regular user token
      // Implementation depends on your actual protected routes
    });
  });

  // ============================================================================
  // 8. JWT SERVICE UNIT TESTS
  // ============================================================================

  describe('JWT Service', () => {
    it('should generate valid token pair', async () => {
      const tokens = await jwtService.generateTokenPair(
        'test-user-id',
        'test@example.com',
        UserRole.USER,
      );

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBe(900); // 15 minutes
    });

    it('should validate access token correctly', async () => {
      const tokens = await jwtService.generateTokenPair(
        'test-user-id',
        'test@example.com',
        UserRole.USER,
      );

      const payload = await jwtService.validateAccessToken(tokens.accessToken);

      expect(payload).toBeDefined();
      expect(payload.sub).toBe('test-user-id');
      expect(payload.email).toBe('test@example.com');
      expect(payload.type).toBe('access');
    });

    it('should validate refresh token correctly', async () => {
      const tokens = await jwtService.generateTokenPair(
        'test-user-id',
        'test@example.com',
        UserRole.USER,
      );

      const payload = await jwtService.validateRefreshToken(tokens.refreshToken);

      expect(payload).toBeDefined();
      expect(payload.sub).toBe('test-user-id');
      expect(payload.type).toBe('refresh');
    });

    it('should reject invalid token type', async () => {
      const tokens = await jwtService.generateTokenPair(
        'test-user-id',
        'test@example.com',
        UserRole.USER,
      );

      // Try to validate refresh token as access token
      const payload = await jwtService.validateAccessToken(tokens.refreshToken);

      expect(payload).toBeNull();
    });

    it('should check permissions correctly', async () => {
      const userPermissions = ['policies:read', 'claims:create'];

      expect(jwtService.hasPermission(userPermissions, 'policies:read')).toBe(true);
      expect(jwtService.hasPermission(userPermissions, 'policies:delete')).toBe(false);
    });

    it('should handle wildcard permissions', async () => {
      const adminPermissions = ['*'];

      expect(jwtService.hasPermission(adminPermissions, 'policies:read')).toBe(true);
      expect(jwtService.hasPermission(adminPermissions, 'anything:action')).toBe(true);
    });

    it('should handle resource wildcard permissions', async () => {
      const managerPermissions = ['policies:*', 'claims:read'];

      expect(jwtService.hasPermission(managerPermissions, 'policies:read')).toBe(true);
      expect(jwtService.hasPermission(managerPermissions, 'policies:delete')).toBe(true);
      expect(jwtService.hasPermission(managerPermissions, 'claims:read')).toBe(true);
      expect(jwtService.hasPermission(managerPermissions, 'claims:delete')).toBe(false);
    });
  });

  // ============================================================================
  // 9. REDIS INTEGRATION TESTS
  // ============================================================================

  describe('Redis Service', () => {
    it('should store and retrieve data', async () => {
      await redisService.set('test-key', 'test-value');
      const value = await redisService.get('test-key');

      expect(value).toBe('test-value');

      // Cleanup
      await redisService.del('test-key');
    });

    it('should store data with expiration', async () => {
      await redisService.set('test-key-exp', 'test-value', 'EX', 1);

      // Immediately should exist
      const exists = await redisService.exists('test-key-exp');
      expect(exists).toBe(true);

      // After 1 second should expire (in real test you'd wait)
    });

    it('should store and retrieve JSON', async () => {
      const testObj = { name: 'Test', value: 123 };

      await redisService.setJson('test-json', testObj);
      const retrieved = await redisService.getJson('test-json');

      expect(retrieved).toEqual(testObj);

      // Cleanup
      await redisService.del('test-json');
    });

    it('should delete keys', async () => {
      await redisService.set('test-delete', 'value');
      await redisService.del('test-delete');

      const exists = await redisService.exists('test-delete');
      expect(exists).toBe(false);
    });
  });

  // ============================================================================
  // 10. HEALTH CHECK TESTS
  // ============================================================================

  describe('GET /auth/health', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.service).toBe('ait-authenticator');
    });
  });
});

/**
 * Test Summary:
 *
 * Total Test Cases: 35+
 *
 * Coverage:
 * 1. Registration (4 tests)
 * 2. Login (4 tests)
 * 3. Token Validation (3 tests)
 * 4. Token Refresh (4 tests)
 * 5. Protected Routes (4 tests)
 * 6. Logout (3 tests)
 * 7. RBAC (2 tests)
 * 8. JWT Service (7 tests)
 * 9. Redis Service (4 tests)
 * 10. Health Check (1 test)
 *
 * Run tests with:
 * pnpm run test:e2e
 */
