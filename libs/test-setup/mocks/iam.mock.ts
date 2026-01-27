/**
 * IAM (Identity and Access Management) Mocks
 * Common test data for authentication, RBAC, and MFA
 */

import { jest } from '@jest/globals';

// ============================================================================
// User Mocks
// ============================================================================

export const mockUser = {
  id: 'USER-001',
  email: 'john.doe@example.com',
  username: 'johndoe',
  password: '$2b$10$hashedpasswordhere', // bcrypt hash
  firstName: 'John',
  lastName: 'Doe',
  roles: ['USER'],
  permissions: ['read:profile', 'update:profile'],
  status: 'ACTIVE',
  mfaEnabled: false,
  mfaSecret: null,
  emailVerified: true,
  lastLoginAt: new Date('2024-01-15'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

export const mockAdminUser = {
  ...mockUser,
  id: 'ADMIN-001',
  email: 'admin@example.com',
  username: 'admin',
  roles: ['ADMIN', 'USER'],
  permissions: ['*'],
};

export const mockAgentUser = {
  ...mockUser,
  id: 'AGENT-001',
  email: 'agent@insurance.com',
  username: 'agent',
  roles: ['AGENT', 'USER'],
  permissions: ['read:policies', 'create:policies', 'read:claims', 'create:claims'],
};

// ============================================================================
// Token Mocks
// ============================================================================

export const mockTokenPayload = {
  sub: 'USER-001',
  email: 'john.doe@example.com',
  roles: ['USER'],
  permissions: ['read:profile', 'update:profile'],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  iss: 'ai-core',
  aud: 'ai-core-client',
};

export const mockRefreshTokenPayload = {
  sub: 'USER-001',
  tokenVersion: 1,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 604800, // 7 days
};

export const mockAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.access.token';
export const mockRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.refresh.token';

// ============================================================================
// Role & Permission Mocks
// ============================================================================

export const mockRole = {
  id: 'ROLE-USER',
  name: 'USER',
  description: 'Standard user role',
  permissions: ['read:profile', 'update:profile'],
  isSystem: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockAdminRole = {
  id: 'ROLE-ADMIN',
  name: 'ADMIN',
  description: 'Administrator role with full access',
  permissions: ['*'],
  isSystem: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockPermission = {
  id: 'PERM-001',
  name: 'read:profile',
  description: 'Read user profile',
  resource: 'profile',
  action: 'read',
  createdAt: new Date('2024-01-01'),
};

// ============================================================================
// MFA Mocks
// ============================================================================

export const mockMFAConfig = {
  userId: 'USER-001',
  type: 'TOTP',
  secret: 'JBSWY3DPEHPK3PXP', // Base32 encoded secret
  backupCodes: [
    'ABC123',
    'DEF456',
    'GHI789',
    'JKL012',
    'MNO345',
    'PQR678',
    'STU901',
    'VWX234',
  ],
  enabled: true,
  verifiedAt: new Date('2024-01-15'),
  createdAt: new Date('2024-01-15'),
};

export const mockTOTPCode = '123456';

// ============================================================================
// Session Mocks
// ============================================================================

export const mockSession = {
  id: 'SESSION-001',
  userId: 'USER-001',
  accessToken: mockAccessToken,
  refreshToken: mockRefreshToken,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  ipAddress: '192.168.1.1',
  expiresAt: new Date(Date.now() + 3600000),
  createdAt: new Date(),
};

// ============================================================================
// Mock Implementations
// ============================================================================

export const createBcryptMock = () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('$2b$10$salt'),
});

export const createJwtMock = () => ({
  sign: jest.fn().mockReturnValue(mockAccessToken),
  verify: jest.fn().mockReturnValue(mockTokenPayload),
  decode: jest.fn().mockReturnValue(mockTokenPayload),
});

export const createSpeakeasyMock = () => ({
  generateSecret: jest.fn().mockReturnValue({
    ascii: 'test-secret-ascii',
    hex: 'test-secret-hex',
    base32: 'JBSWY3DPEHPK3PXP',
    otpauth_url: 'otpauth://totp/AI-Core:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=AI-Core',
  }),
  totp: {
    verify: jest.fn().mockReturnValue(true),
    generate: jest.fn().mockReturnValue(mockTOTPCode),
  },
});

// ============================================================================
// Factory Functions
// ============================================================================

export const createMockUser = (overrides?: Partial<typeof mockUser>) => ({
  ...mockUser,
  id: `USER-${Date.now()}`,
  ...overrides,
});

export const createMockRole = (overrides?: Partial<typeof mockRole>) => ({
  ...mockRole,
  id: `ROLE-${Date.now()}`,
  ...overrides,
});

export const createMockSession = (overrides?: Partial<typeof mockSession>) => ({
  ...mockSession,
  id: `SESSION-${Date.now()}`,
  ...overrides,
});

export default {
  mockUser,
  mockAdminUser,
  mockAgentUser,
  mockTokenPayload,
  mockAccessToken,
  mockRefreshToken,
  mockRole,
  mockAdminRole,
  mockPermission,
  mockMFAConfig,
  mockTOTPCode,
  mockSession,
  createBcryptMock,
  createJwtMock,
  createSpeakeasyMock,
  createMockUser,
  createMockRole,
  createMockSession,
};
