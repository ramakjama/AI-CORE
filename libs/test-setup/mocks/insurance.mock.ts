/**
 * Insurance Domain Mocks
 * Common test data for policies, claims, and commissions
 */

// ============================================================================
// Policy Mocks
// ============================================================================

export const mockPolicy = {
  id: 'POL-001',
  policyNumber: 'AUTO-2024-00001',
  type: 'AUTO',
  status: 'ACTIVE',
  effectiveDate: new Date('2024-01-01'),
  expirationDate: new Date('2025-01-01'),
  premium: {
    annual: 1200.00,
    monthly: 100.00,
    frequency: 'MONTHLY',
  },
  insured: {
    partyId: 'PARTY-001',
    name: 'John Doe',
    email: 'john.doe@example.com',
  },
  coverages: [
    {
      code: 'LIABILITY',
      name: 'Liability Coverage',
      limit: 100000,
      deductible: 500,
      premium: 600,
    },
    {
      code: 'COLLISION',
      name: 'Collision Coverage',
      limit: 50000,
      deductible: 1000,
      premium: 400,
    },
    {
      code: 'COMPREHENSIVE',
      name: 'Comprehensive Coverage',
      limit: 50000,
      deductible: 500,
      premium: 200,
    },
  ],
  vehicle: {
    vin: '1HGBH41JXMN109186',
    make: 'Honda',
    model: 'Accord',
    year: 2023,
    value: 35000,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockPolicyInput = {
  type: 'AUTO',
  effectiveDate: new Date('2024-01-01'),
  insured: {
    partyId: 'PARTY-001',
    name: 'John Doe',
  },
  coverages: [
    { code: 'LIABILITY', limit: 100000, deductible: 500 },
  ],
  vehicle: {
    vin: '1HGBH41JXMN109186',
    make: 'Honda',
    model: 'Accord',
    year: 2023,
    value: 35000,
  },
};

// ============================================================================
// Claim Mocks
// ============================================================================

export const mockClaim = {
  id: 'CLM-001',
  claimNumber: 'CLM-2024-00001',
  policyId: 'POL-001',
  status: 'OPEN',
  type: 'COLLISION',
  dateOfLoss: new Date('2024-02-15'),
  dateReported: new Date('2024-02-16'),
  description: 'Vehicle collision at intersection',
  claimant: {
    partyId: 'PARTY-001',
    name: 'John Doe',
    phone: '+1-555-123-4567',
  },
  reserve: {
    initial: 5000,
    current: 7500,
    paid: 0,
  },
  coverage: {
    code: 'COLLISION',
    limit: 50000,
    deductible: 1000,
  },
  adjuster: {
    id: 'ADJ-001',
    name: 'Jane Smith',
  },
  createdAt: new Date('2024-02-16'),
  updatedAt: new Date('2024-02-16'),
};

export const mockClaimInput = {
  policyId: 'POL-001',
  type: 'COLLISION',
  dateOfLoss: new Date('2024-02-15'),
  description: 'Vehicle collision at intersection',
  claimant: {
    partyId: 'PARTY-001',
    name: 'John Doe',
  },
};

// ============================================================================
// Commission Mocks
// ============================================================================

export const mockCommission = {
  id: 'COM-001',
  agentId: 'AGENT-001',
  policyId: 'POL-001',
  type: 'NEW_BUSINESS',
  rate: 0.15,
  basePremium: 1200.00,
  amount: 180.00,
  status: 'PENDING',
  effectiveDate: new Date('2024-01-01'),
  paymentDate: null,
  createdAt: new Date('2024-01-01'),
};

export const mockAgent = {
  id: 'AGENT-001',
  name: 'Agent Smith',
  email: 'agent.smith@insurance.com',
  licenseNumber: 'LIC-123456',
  commissionRate: {
    newBusiness: 0.15,
    renewal: 0.10,
    endorsement: 0.05,
  },
  status: 'ACTIVE',
};

export const mockSettlement = {
  id: 'SET-001',
  agentId: 'AGENT-001',
  periodStart: new Date('2024-01-01'),
  periodEnd: new Date('2024-01-31'),
  totalAmount: 5000.00,
  commissionCount: 25,
  status: 'PENDING',
  commissions: [],
  createdAt: new Date('2024-02-01'),
};

// ============================================================================
// Factory Functions
// ============================================================================

export const createMockPolicy = (overrides?: Partial<typeof mockPolicy>) => ({
  ...mockPolicy,
  id: `POL-${Date.now()}`,
  policyNumber: `AUTO-${Date.now()}`,
  ...overrides,
});

export const createMockClaim = (overrides?: Partial<typeof mockClaim>) => ({
  ...mockClaim,
  id: `CLM-${Date.now()}`,
  claimNumber: `CLM-${Date.now()}`,
  ...overrides,
});

export const createMockCommission = (overrides?: Partial<typeof mockCommission>) => ({
  ...mockCommission,
  id: `COM-${Date.now()}`,
  ...overrides,
});

export default {
  mockPolicy,
  mockPolicyInput,
  mockClaim,
  mockClaimInput,
  mockCommission,
  mockAgent,
  mockSettlement,
  createMockPolicy,
  createMockClaim,
  createMockCommission,
};
