/**
 * AI-MDM Types
 * Master Data Management type definitions for Party canonical model
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Type of party entity
 */
export enum PartyType {
  INDIVIDUAL = 'INDIVIDUAL',
  ORGANIZATION = 'ORGANIZATION',
  HOUSEHOLD = 'HOUSEHOLD'
}

/**
 * Type of identifier document
 */
export enum IdentifierType {
  NIF = 'NIF',           // Spanish Tax ID for individuals
  NIE = 'NIE',           // Foreign resident ID in Spain
  CIF = 'CIF',           // Spanish Tax ID for companies
  PASSPORT = 'PASSPORT',
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  SSN = 'SSN',           // Social Security Number
  VAT = 'VAT',           // VAT Number
  CUSTOM = 'CUSTOM'
}

/**
 * Type of relationship between parties
 */
export enum RelationshipType {
  // Family relationships
  SPOUSE = 'SPOUSE',
  CHILD = 'CHILD',
  PARENT = 'PARENT',
  SIBLING = 'SIBLING',
  GRANDPARENT = 'GRANDPARENT',
  GRANDCHILD = 'GRANDCHILD',
  UNCLE_AUNT = 'UNCLE_AUNT',
  NEPHEW_NIECE = 'NEPHEW_NIECE',
  COUSIN = 'COUSIN',

  // Business relationships
  EMPLOYEE = 'EMPLOYEE',
  EMPLOYER = 'EMPLOYER',
  OWNER = 'OWNER',
  PARTNER = 'PARTNER',
  DIRECTOR = 'DIRECTOR',
  SHAREHOLDER = 'SHAREHOLDER',

  // Insurance specific
  BENEFICIARY = 'BENEFICIARY',
  POLICYHOLDER = 'POLICYHOLDER',
  INSURED = 'INSURED',
  AGENT = 'AGENT',

  // Other
  LEGAL_REPRESENTATIVE = 'LEGAL_REPRESENTATIVE',
  GUARDIAN = 'GUARDIAN',
  POWER_OF_ATTORNEY = 'POWER_OF_ATTORNEY',
  OTHER = 'OTHER'
}

/**
 * Confidence level for duplicate matching
 */
export enum MatchConfidence {
  HIGH = 'HIGH',       // >= 90% match
  MEDIUM = 'MEDIUM',   // 70-89% match
  LOW = 'LOW',         // 50-69% match
  NONE = 'NONE'        // < 50% match
}

/**
 * Contact channel type
 */
export enum ContactType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  MOBILE = 'MOBILE',
  FAX = 'FAX',
  WHATSAPP = 'WHATSAPP',
  TELEGRAM = 'TELEGRAM',
  LINKEDIN = 'LINKEDIN',
  TWITTER = 'TWITTER',
  WEBSITE = 'WEBSITE',
  OTHER = 'OTHER'
}

/**
 * Address type
 */
export enum AddressType {
  HOME = 'HOME',
  WORK = 'WORK',
  BILLING = 'BILLING',
  SHIPPING = 'SHIPPING',
  LEGAL = 'LEGAL',
  TEMPORARY = 'TEMPORARY',
  OTHER = 'OTHER'
}

/**
 * Data source system
 */
export enum SourceSystem {
  CORE_INSURANCE = 'CORE_INSURANCE',
  CRM = 'CRM',
  WEBSITE = 'WEBSITE',
  MOBILE_APP = 'MOBILE_APP',
  CALL_CENTER = 'CALL_CENTER',
  AGENT_PORTAL = 'AGENT_PORTAL',
  EXTERNAL_API = 'EXTERNAL_API',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  DATA_IMPORT = 'DATA_IMPORT'
}

/**
 * Sync status
 */
export enum SyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
  CONFLICT = 'CONFLICT'
}

/**
 * Merge status
 */
export enum MergeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  REVERTED = 'REVERTED'
}

/**
 * Gender
 */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN'
}

// ============================================================================
// PARTY INTERFACES
// ============================================================================

/**
 * Party identifier (NIF, NIE, CIF, etc.)
 */
export interface PartyIdentifier {
  id: string;
  partyId: string;
  type: IdentifierType;
  value: string;
  issuingCountry?: string;
  issueDate?: Date;
  expiryDate?: Date;
  isPrimary: boolean;
  isVerified: boolean;
  verificationDate?: Date;
  verificationMethod?: string;
  sourceSystem: SourceSystem;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Individual person specific data
 */
export interface IndividualData {
  firstName: string;
  lastName: string;
  middleName?: string;
  secondLastName?: string;  // Spanish naming convention
  prefix?: string;          // Mr., Mrs., Dr., etc.
  suffix?: string;          // Jr., Sr., III, etc.
  birthDate?: Date;
  deathDate?: Date;
  gender?: Gender;
  nationality?: string;
  maritalStatus?: string;
  occupation?: string;
  education?: string;
}

/**
 * Organization specific data
 */
export interface OrganizationData {
  legalName: string;
  tradeName?: string;
  legalForm?: string;       // LLC, SA, SL, etc.
  incorporationDate?: Date;
  dissolutionDate?: Date;
  industry?: string;
  sector?: string;
  employeeCount?: number;
  annualRevenue?: number;
  website?: string;
}

/**
 * Main Party entity
 */
export interface Party {
  id: string;
  type: PartyType;
  displayName: string;

  // Type-specific data
  individual?: IndividualData;
  organization?: OrganizationData;

  // Collections
  identifiers: PartyIdentifier[];
  addresses: Address[];
  contacts: Contact[];

  // Golden Record reference
  goldenRecordId?: string;
  isGoldenRecord: boolean;

  // Metadata
  sourceSystem: SourceSystem;
  externalId?: string;
  tags: string[];
  customAttributes: Record<string, unknown>;

  // Data quality
  dataQualityScore?: number;
  completenessScore?: number;
  lastValidatedAt?: Date;

  // Audit
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  version: number;
}

/**
 * Party version for history tracking
 */
export interface PartyVersion {
  id: string;
  partyId: string;
  version: number;
  data: Partial<Party>;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'MERGE' | 'UNMERGE';
  changeReason?: string;
  changedFields: string[];
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  createdAt: Date;
  createdBy: string;
  sourceSystem: SourceSystem;
}

// ============================================================================
// ADDRESS INTERFACES
// ============================================================================

/**
 * Physical or postal address
 */
export interface Address {
  id: string;
  partyId: string;
  type: AddressType;

  // Address components
  streetLine1: string;
  streetLine2?: string;
  streetLine3?: string;
  city: string;
  state?: string;
  province?: string;
  postalCode: string;
  country: string;
  countryCode: string;  // ISO 3166-1 alpha-2

  // Geolocation
  latitude?: number;
  longitude?: number;

  // Metadata
  isPrimary: boolean;
  isVerified: boolean;
  verificationDate?: Date;
  verificationMethod?: string;

  // Validity
  validFrom?: Date;
  validTo?: Date;

  // Audit
  sourceSystem: SourceSystem;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Normalized/standardized address
 */
export interface NormalizedAddress {
  original: Address;
  normalized: {
    streetLine1: string;
    city: string;
    postalCode: string;
    country: string;
  };
  confidence: number;
  suggestions?: Address[];
}

// ============================================================================
// CONTACT INTERFACES
// ============================================================================

/**
 * Contact channel (email, phone, etc.)
 */
export interface Contact {
  id: string;
  partyId: string;
  type: ContactType;
  value: string;
  label?: string;           // "Personal", "Work", etc.

  // Preferences
  isPrimary: boolean;
  isPreferred: boolean;
  isVerified: boolean;
  verificationDate?: Date;

  // Communication preferences
  preferences: ContactPreference;

  // Validity
  validFrom?: Date;
  validTo?: Date;

  // Audit
  sourceSystem: SourceSystem;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Contact channel preferences
 */
export interface ContactPreference {
  allowMarketing: boolean;
  allowTransactional: boolean;
  allowReminders: boolean;
  allowEmergency: boolean;
  preferredLanguage?: string;
  preferredTime?: {
    from: string;  // HH:mm
    to: string;    // HH:mm
    timezone: string;
  };
  doNotContact: boolean;
  doNotContactReason?: string;
  unsubscribedAt?: Date;
}

// ============================================================================
// HOUSEHOLD INTERFACES
// ============================================================================

/**
 * Household grouping of parties
 */
export interface Household {
  id: string;
  name: string;

  // Members
  members: HouseholdMember[];
  headOfHouseholdId?: string;

  // Primary address (shared)
  primaryAddressId?: string;

  // Aggregate data
  totalMembers: number;
  totalPolicies?: number;
  totalPremium?: number;
  householdValue?: number;

  // Metadata
  tags: string[];
  customAttributes: Record<string, unknown>;

  // Audit
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Household member with relationship
 */
export interface HouseholdMember {
  id: string;
  householdId: string;
  partyId: string;
  relationship: RelationshipType;

  // Member details (denormalized for performance)
  displayName: string;
  partyType: PartyType;

  // Role in household
  isHeadOfHousehold: boolean;
  isPrimaryContact: boolean;

  // Financial contribution
  incomeContribution?: number;

  // Dates
  joinedAt: Date;
  leftAt?: Date;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// RELATIONSHIP INTERFACES
// ============================================================================

/**
 * Relationship between two parties
 */
export interface PartyRelationship {
  id: string;
  fromPartyId: string;
  toPartyId: string;
  type: RelationshipType;
  inverseType?: RelationshipType;  // Auto-set inverse (PARENT <-> CHILD)

  // Relationship details
  description?: string;
  startDate?: Date;
  endDate?: Date;

  // Role-specific data
  roleData?: Record<string, unknown>;

  // Metadata
  isActive: boolean;
  isVerified: boolean;

  // Audit
  sourceSystem: SourceSystem;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Relationship graph node
 */
export interface RelationshipGraphNode {
  partyId: string;
  party: Party;
  depth: number;
  relationships: {
    relationshipId: string;
    type: RelationshipType;
    direction: 'outgoing' | 'incoming';
    connectedPartyId: string;
  }[];
}

/**
 * Path between two parties
 */
export interface RelationshipPath {
  fromPartyId: string;
  toPartyId: string;
  path: {
    partyId: string;
    relationship: RelationshipType;
  }[];
  totalDegrees: number;
}

// ============================================================================
// GOLDEN RECORD INTERFACES
// ============================================================================

/**
 * Golden Record - consolidated master record
 */
export interface GoldenRecord {
  id: string;
  partyId: string;

  // Consolidated data
  displayName: string;
  type: PartyType;
  individual?: IndividualData;
  organization?: OrganizationData;

  // Best values from sources
  bestIdentifier?: PartyIdentifier;
  bestAddress?: Address;
  bestContact?: Contact;

  // Source records
  sourcePartyIds: string[];
  sourceSystems: SourceSystem[];

  // Data quality
  dataQualityScore: number;
  completenessScore: number;
  accuracyScore: number;
  consistencyScore: number;

  // Field-level sourcing
  fieldSources: GoldenRecordFieldSource[];

  // Conflicts
  unresolvedConflicts: GoldenRecordConflict[];

  // Audit
  lastRefreshedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Source of each golden record field
 */
export interface GoldenRecordFieldSource {
  fieldPath: string;         // e.g., "individual.firstName"
  value: unknown;
  sourcePartyId: string;
  sourceSystem: SourceSystem;
  confidence: number;
  lastUpdated: Date;
}

/**
 * Conflict in golden record values
 */
export interface GoldenRecordConflict {
  id: string;
  goldenRecordId: string;
  fieldPath: string;
  values: {
    value: unknown;
    sourcePartyId: string;
    sourceSystem: SourceSystem;
    updatedAt: Date;
  }[];
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: 'SELECTED' | 'MERGED' | 'IGNORED';
  selectedValue?: unknown;
}

// ============================================================================
// DEDUPLICATION INTERFACES
// ============================================================================

/**
 * Duplicate match result
 */
export interface DuplicateMatch {
  id: string;
  party1Id: string;
  party2Id: string;

  // Match scores
  overallScore: number;
  confidence: MatchConfidence;
  scores: MatchScore;

  // Match details
  matchedFields: string[];
  mismatchedFields: string[];

  // Status
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'MERGED';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;

  // Audit
  detectedAt: Date;
  detectedBy: string;
  algorithm: string;
}

/**
 * Detailed match scores by field
 */
export interface MatchScore {
  overall: number;
  name: number;
  identifier: number;
  address: number;
  phone: number;
  email: number;
  birthDate: number;

  // Weighted components
  weights: {
    name: number;
    identifier: number;
    address: number;
    phone: number;
    email: number;
    birthDate: number;
  };
}

/**
 * Merge candidate suggestion
 */
export interface MergeCandidate {
  id: string;
  survivorId: string;        // Record that will survive
  victimIds: string[];       // Records that will be merged

  // Match information
  duplicateMatchId: string;
  confidence: MatchConfidence;
  overallScore: number;

  // Preview
  previewGoldenRecord: Partial<GoldenRecord>;
  fieldsToMerge: string[];
  conflictingFields: string[];

  // Status
  status: MergeStatus;
  suggestedAt: Date;
  suggestedBy: string;
  reviewedAt?: Date;
  reviewedBy?: string;
}

/**
 * Result of a merge operation
 */
export interface MergeResult {
  id: string;
  survivorId: string;
  victimIds: string[];

  // Resulting record
  goldenRecordId: string;

  // What was merged
  mergedFields: Record<string, unknown>;
  conflictResolutions: Record<string, unknown>;

  // Status
  status: MergeStatus;

  // Reversibility
  canUnmerge: boolean;
  unmergeDeadline?: Date;

  // Audit
  mergedAt: Date;
  mergedBy: string;
  unmergedAt?: Date;
  unmergedBy?: string;
}

/**
 * Merge history entry
 */
export interface MergeHistory {
  id: string;
  mergeResultId: string;
  partyId: string;

  // Merge details
  action: 'MERGE' | 'UNMERGE';
  survivorId: string;
  victimIds: string[];

  // Snapshot before merge
  premergeSnapshot: Partial<Party>;

  // Audit
  performedAt: Date;
  performedBy: string;
  reason?: string;
}

// ============================================================================
// SYNC INTERFACES
// ============================================================================

/**
 * Sync operation record
 */
export interface SyncRecord {
  id: string;
  partyId: string;

  // Systems involved
  sourceSystem: SourceSystem;
  targetSystem: SourceSystem;
  direction: 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';

  // Status
  status: SyncStatus;

  // Data
  syncedFields: string[];
  failedFields?: string[];
  conflicts?: SyncConflict[];

  // Timing
  startedAt: Date;
  completedAt?: Date;
  nextScheduledAt?: Date;

  // Error handling
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
  retryCount: number;

  // Audit
  triggeredBy: string;
}

/**
 * Sync conflict between systems
 */
export interface SyncConflict {
  id: string;
  syncRecordId: string;
  partyId: string;
  fieldPath: string;

  // Conflicting values
  sourceValue: unknown;
  targetValue: unknown;
  sourceUpdatedAt: Date;
  targetUpdatedAt: Date;

  // Resolution
  status: 'PENDING' | 'RESOLVED' | 'IGNORED';
  resolution?: 'SOURCE_WINS' | 'TARGET_WINS' | 'MANUAL' | 'MERGED';
  resolvedValue?: unknown;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/**
 * Changelog entry for party
 */
export interface ChangelogEntry {
  id: string;
  partyId: string;

  // Change details
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'MERGE' | 'SYNC';
  fieldPath?: string;
  previousValue?: unknown;
  newValue?: unknown;

  // Source
  sourceSystem: SourceSystem;

  // Audit
  changedAt: Date;
  changedBy: string;
  reason?: string;
}

// ============================================================================
// SEARCH & FILTER INTERFACES
// ============================================================================

/**
 * Party search query
 */
export interface PartySearchQuery {
  // Text search
  q?: string;

  // Filters
  type?: PartyType;
  identifierType?: IdentifierType;
  identifierValue?: string;
  name?: string;
  email?: string;
  phone?: string;
  postalCode?: string;
  city?: string;
  country?: string;

  // Tags & attributes
  tags?: string[];
  customAttributes?: Record<string, unknown>;

  // Data quality
  minDataQualityScore?: number;

  // Status
  isActive?: boolean;
  isDeleted?: boolean;

  // Pagination
  page?: number;
  pageSize?: number;

  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search result
 */
export interface PartySearchResult {
  items: Party[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets?: Record<string, { value: string; count: number }[]>;
}

// ============================================================================
// BATCH OPERATION INTERFACES
// ============================================================================

/**
 * Batch deduplication options
 */
export interface BatchDeduplicationOptions {
  // Scope
  partyTypes?: PartyType[];
  sourceSystems?: SourceSystem[];
  dateRange?: {
    from: Date;
    to: Date;
  };

  // Thresholds
  minMatchScore?: number;
  minConfidence?: MatchConfidence;

  // Processing
  batchSize?: number;
  maxResults?: number;

  // Output
  includeDetails?: boolean;
  autoMerge?: boolean;
  autoMergeThreshold?: number;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  id: string;
  operation: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

  // Progress
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;

  // Results
  results?: unknown[];
  errors?: {
    itemId: string;
    error: string;
  }[];

  // Timing
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Create input type (omit auto-generated fields)
 */
export type CreatePartyInput = Omit<Party,
  'id' | 'createdAt' | 'updatedAt' | 'version' | 'isDeleted' | 'deletedAt' | 'deletedBy'
>;

/**
 * Update input type (partial with required id)
 */
export type UpdatePartyInput = Partial<Party> & { id: string };

/**
 * Party with related data
 */
export interface PartyWithRelations extends Party {
  household?: Household;
  relationships?: PartyRelationship[];
  goldenRecord?: GoldenRecord;
  mergeHistory?: MergeHistory[];
}

/**
 * Data quality metrics
 */
export interface DataQualityMetrics {
  partyId: string;
  overallScore: number;
  completeness: {
    score: number;
    missingFields: string[];
    requiredFieldsFilled: number;
    totalRequiredFields: number;
  };
  accuracy: {
    score: number;
    verifiedFields: string[];
    unverifiedFields: string[];
  };
  consistency: {
    score: number;
    inconsistencies: {
      field: string;
      issue: string;
    }[];
  };
  timeliness: {
    score: number;
    lastUpdated: Date;
    staleFields: string[];
  };
  uniqueness: {
    score: number;
    potentialDuplicates: number;
  };
}
