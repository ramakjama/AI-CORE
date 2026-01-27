/**
 * MDM (Master Data Management) Mocks
 * Common test data for parties, deduplication, and golden records
 */

// ============================================================================
// Party Type Enums
// ============================================================================

export enum PartyType {
  INDIVIDUAL = 'INDIVIDUAL',
  ORGANIZATION = 'ORGANIZATION',
  HOUSEHOLD = 'HOUSEHOLD',
}

export enum IdentifierType {
  NIF = 'NIF',
  CIF = 'CIF',
  NIE = 'NIE',
  PASSPORT = 'PASSPORT',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
}

export enum SourceSystem {
  CORE_INSURANCE = 'CORE_INSURANCE',
  CRM = 'CRM',
  AGENT_PORTAL = 'AGENT_PORTAL',
  CALL_CENTER = 'CALL_CENTER',
  WEBSITE = 'WEBSITE',
  MOBILE_APP = 'MOBILE_APP',
  EXTERNAL_API = 'EXTERNAL_API',
  DATA_IMPORT = 'DATA_IMPORT',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
}

// ============================================================================
// Individual Party Mock
// ============================================================================

export const mockIndividualParty = {
  id: 'PARTY-IND-001',
  type: PartyType.INDIVIDUAL,
  displayName: 'Juan Garcia Lopez',
  individual: {
    firstName: 'Juan',
    lastName: 'Garcia',
    secondLastName: 'Lopez',
    birthDate: new Date('1985-06-15'),
    gender: 'MALE',
    nationality: 'ES',
    maritalStatus: 'MARRIED',
  },
  identifiers: [
    {
      id: 'ID-001',
      type: IdentifierType.NIF,
      value: '12345678A',
      isPrimary: true,
      isVerified: true,
      partyId: 'PARTY-IND-001',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  addresses: [
    {
      id: 'ADDR-001',
      type: 'HOME',
      streetLine1: 'Calle Mayor 123',
      streetLine2: '2A',
      city: 'Madrid',
      state: 'Madrid',
      postalCode: '28001',
      country: 'Spain',
      countryCode: 'ES',
      isPrimary: true,
      isVerified: true,
      partyId: 'PARTY-IND-001',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  contacts: [
    {
      id: 'CONTACT-001',
      type: 'EMAIL',
      value: 'juan.garcia@example.com',
      isPrimary: true,
      isVerified: true,
      partyId: 'PARTY-IND-001',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'CONTACT-002',
      type: 'MOBILE',
      value: '+34 612 345 678',
      isPrimary: true,
      isVerified: true,
      partyId: 'PARTY-IND-001',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  tags: ['VIP', 'POLICYHOLDER'],
  customAttributes: {},
  sourceSystem: SourceSystem.CORE_INSURANCE,
  isActive: true,
  isDeleted: false,
  isGoldenRecord: false,
  version: 1,
  dataQualityScore: 95,
  completenessScore: 100,
  createdAt: new Date('2024-01-01'),
  createdBy: 'system',
  updatedAt: new Date('2024-01-01'),
  updatedBy: 'system',
};

// ============================================================================
// Organization Party Mock
// ============================================================================

export const mockOrganizationParty = {
  id: 'PARTY-ORG-001',
  type: PartyType.ORGANIZATION,
  displayName: 'Acme Insurance S.L.',
  organization: {
    legalName: 'Acme Insurance S.L.',
    tradeName: 'Acme Insurance',
    legalForm: 'SL',
    incorporationDate: new Date('2010-03-15'),
    industry: 'Insurance',
    sector: 'Financial Services',
    employeeCount: 50,
    website: 'https://acme-insurance.com',
  },
  identifiers: [
    {
      id: 'ID-002',
      type: IdentifierType.CIF,
      value: 'B12345678',
      isPrimary: true,
      isVerified: true,
      partyId: 'PARTY-ORG-001',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  addresses: [
    {
      id: 'ADDR-002',
      type: 'BUSINESS',
      streetLine1: 'Paseo de la Castellana 100',
      city: 'Madrid',
      state: 'Madrid',
      postalCode: '28046',
      country: 'Spain',
      countryCode: 'ES',
      isPrimary: true,
      isVerified: true,
      partyId: 'PARTY-ORG-001',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  contacts: [
    {
      id: 'CONTACT-003',
      type: 'EMAIL',
      value: 'info@acme-insurance.com',
      isPrimary: true,
      isVerified: true,
      partyId: 'PARTY-ORG-001',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  tags: ['CORPORATE', 'INSURER'],
  customAttributes: {},
  sourceSystem: SourceSystem.CORE_INSURANCE,
  isActive: true,
  isDeleted: false,
  isGoldenRecord: false,
  version: 1,
  dataQualityScore: 90,
  completenessScore: 95,
  createdAt: new Date('2024-01-01'),
  createdBy: 'system',
  updatedAt: new Date('2024-01-01'),
  updatedBy: 'system',
};

// ============================================================================
// Duplicate Match Mock
// ============================================================================

export const mockDuplicateMatch = {
  id: 'MATCH-001',
  party1Id: 'PARTY-IND-001',
  party2Id: 'PARTY-IND-002',
  overallScore: 0.92,
  confidence: 'HIGH',
  scores: {
    name: 0.95,
    identifier: 1.0,
    address: 0.85,
    phone: 0.90,
    email: 0.88,
    birthDate: 1.0,
    overall: 0.92,
  },
  matchedFields: ['identifier', 'name', 'birthDate'],
  mismatchedFields: ['address'],
  status: 'PENDING',
  detectedAt: new Date('2024-01-15'),
  detectedBy: 'system',
  algorithm: 'fuzzy-matcher-v1',
};

// ============================================================================
// Golden Record Mock
// ============================================================================

export const mockGoldenRecord = {
  id: 'GR-001',
  partyId: 'PARTY-IND-001',
  displayName: 'Juan Garcia Lopez',
  type: PartyType.INDIVIDUAL,
  individual: {
    firstName: 'Juan',
    lastName: 'Garcia',
    secondLastName: 'Lopez',
    birthDate: new Date('1985-06-15'),
    gender: 'MALE',
  },
  bestIdentifier: mockIndividualParty.identifiers[0],
  bestAddress: mockIndividualParty.addresses[0],
  bestContact: mockIndividualParty.contacts[0],
  sourcePartyIds: ['PARTY-IND-001', 'PARTY-IND-002'],
  sourceSystems: [SourceSystem.CORE_INSURANCE, SourceSystem.CRM],
  dataQualityScore: 95,
  completenessScore: 100,
  accuracyScore: 90,
  consistencyScore: 100,
  fieldSources: [
    {
      fieldPath: 'individual.firstName',
      value: 'Juan',
      sourcePartyId: 'PARTY-IND-001',
      sourceSystem: SourceSystem.CORE_INSURANCE,
      confidence: 1.0,
      lastUpdated: new Date('2024-01-01'),
    },
  ],
  unresolvedConflicts: [],
  lastRefreshedAt: new Date('2024-01-15'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

// ============================================================================
// Factory Functions
// ============================================================================

export const createMockIndividualParty = (overrides?: Partial<typeof mockIndividualParty>) => ({
  ...mockIndividualParty,
  id: `PARTY-IND-${Date.now()}`,
  ...overrides,
});

export const createMockOrganizationParty = (overrides?: Partial<typeof mockOrganizationParty>) => ({
  ...mockOrganizationParty,
  id: `PARTY-ORG-${Date.now()}`,
  ...overrides,
});

export const createMockDuplicateMatch = (overrides?: Partial<typeof mockDuplicateMatch>) => ({
  ...mockDuplicateMatch,
  id: `MATCH-${Date.now()}`,
  ...overrides,
});

export const createMockGoldenRecord = (overrides?: Partial<typeof mockGoldenRecord>) => ({
  ...mockGoldenRecord,
  id: `GR-${Date.now()}`,
  ...overrides,
});

export default {
  PartyType,
  IdentifierType,
  SourceSystem,
  mockIndividualParty,
  mockOrganizationParty,
  mockDuplicateMatch,
  mockGoldenRecord,
  createMockIndividualParty,
  createMockOrganizationParty,
  createMockDuplicateMatch,
  createMockGoldenRecord,
};
