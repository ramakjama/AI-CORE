/**
 * AI-MDM Enums - Enumeraciones globales para Master Data Management
 * Basado en el schema sm_global de Prisma
 */

// =============================================================================
// PARTY ENUMS
// =============================================================================

export enum PartyType {
  NATURAL = 'NATURAL',   // Persona fisica
  LEGAL = 'LEGAL',       // Persona juridica
  UNKNOWN = 'UNKNOWN'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN'
}

export enum DocumentType {
  DNI = 'DNI',
  NIE = 'NIE',
  CIF = 'CIF',
  PASSPORT = 'PASSPORT',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN'
}

// =============================================================================
// IDENTIFIER ENUMS
// =============================================================================

export enum IdentifierType {
  NIF = 'NIF',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  IBAN = 'IBAN',
  EXTERNAL_ID = 'EXTERNAL_ID',
  SOCIAL_SECURITY = 'SOCIAL_SECURITY',
  PASSPORT = 'PASSPORT',
  DRIVING_LICENSE = 'DRIVING_LICENSE'
}

// =============================================================================
// CONTACT ENUMS
// =============================================================================

export enum ContactType {
  EMAIL = 'EMAIL',
  PHONE_MOBILE = 'PHONE_MOBILE',
  PHONE_LANDLINE = 'PHONE_LANDLINE',
  PHONE_WORK = 'PHONE_WORK',
  FAX = 'FAX',
  WHATSAPP = 'WHATSAPP',
  TELEGRAM = 'TELEGRAM'
}

export enum AddressType {
  HOME = 'HOME',
  WORK = 'WORK',
  BILLING = 'BILLING',
  FISCAL = 'FISCAL',
  CORRESPONDENCE = 'CORRESPONDENCE',
  OTHER = 'OTHER'
}

// =============================================================================
// RELATIONSHIP ENUMS
// =============================================================================

export enum RelationshipType {
  // Familia
  SPOUSE = 'SPOUSE',
  PARTNER = 'PARTNER',
  CHILD = 'CHILD',
  PARENT = 'PARENT',
  SIBLING = 'SIBLING',
  GRANDPARENT = 'GRANDPARENT',
  GRANDCHILD = 'GRANDCHILD',
  UNCLE_AUNT = 'UNCLE_AUNT',
  NEPHEW_NIECE = 'NEPHEW_NIECE',
  COUSIN = 'COUSIN',
  IN_LAW = 'IN_LAW',
  ASCENDANT = 'ASCENDANT',
  DESCENDANT = 'DESCENDANT',
  GUARDIAN = 'GUARDIAN',

  // Empresa / representacion
  OWNER = 'OWNER',
  BENEFICIAL_OWNER = 'BENEFICIAL_OWNER',
  DIRECTOR = 'DIRECTOR',
  ADMINISTRATOR = 'ADMINISTRATOR',
  PARTNER_SHAREHOLDER = 'PARTNER_SHAREHOLDER',
  ATTORNEY_IN_FACT = 'ATTORNEY_IN_FACT',
  EMPLOYEE_OF = 'EMPLOYEE_OF',
  EMPLOYER_OF = 'EMPLOYER_OF',
  SUBSIDIARY = 'SUBSIDIARY',
  PARENT_COMPANY = 'PARENT_COMPANY',

  // Otros
  FRIEND = 'FRIEND',
  COHABITANT = 'COHABITANT',
  NEIGHBOR = 'NEIGHBOR',
  REFERRER = 'REFERRER',
  REFERRED_BY = 'REFERRED_BY',
  HOUSEHOLD_MEMBER = 'HOUSEHOLD_MEMBER',
  PAYOR_GROUP = 'PAYOR_GROUP',
  OTHER = 'OTHER'
}

export enum RelationshipSource {
  MANUAL = 'MANUAL',
  INFERRED_SHARED_NIF = 'INFERRED_SHARED_NIF',
  INFERRED_SHARED_ADDRESS = 'INFERRED_SHARED_ADDRESS',
  INFERRED_SHARED_PHONE = 'INFERRED_SHARED_PHONE',
  INFERRED_SHARED_EMAIL = 'INFERRED_SHARED_EMAIL',
  INFERRED_SHARED_BANK = 'INFERRED_SHARED_BANK',
  INFERRED_POLICY_ROLE = 'INFERRED_POLICY_ROLE',
  INFERRED_SAME_SURNAME = 'INFERRED_SAME_SURNAME',
  EXTERNAL_REGISTRY = 'EXTERNAL_REGISTRY',
  CRM_IMPORT = 'CRM_IMPORT',
  OTHER = 'OTHER'
}

// =============================================================================
// HOUSEHOLD ENUMS
// =============================================================================

export enum HouseholdSource {
  MANUAL = 'MANUAL',
  INFERRED_ADDRESS = 'INFERRED_ADDRESS',
  INFERRED_RELATIONSHIP = 'INFERRED_RELATIONSHIP',
  INFERRED_POLICY = 'INFERRED_POLICY',
  EXTERNAL = 'EXTERNAL'
}

export enum HouseholdRole {
  HEAD = 'HEAD',
  SPOUSE = 'SPOUSE',
  CHILD = 'CHILD',
  PARENT = 'PARENT',
  GRANDPARENT = 'GRANDPARENT',
  SIBLING = 'SIBLING',
  EXTENDED_FAMILY = 'EXTENDED_FAMILY',
  DOMESTIC_EMPLOYEE = 'DOMESTIC_EMPLOYEE',
  TENANT_RESIDENT = 'TENANT_RESIDENT',
  MEMBER = 'MEMBER',
  OTHER = 'OTHER'
}

// =============================================================================
// CONSENT ENUMS
// =============================================================================

export enum ConsentStatus {
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  PENDING = 'PENDING',
  WITHDRAWN = 'WITHDRAWN',
  UNKNOWN = 'UNKNOWN'
}

export enum ConsentPurpose {
  MARKETING_EMAIL = 'MARKETING_EMAIL',
  MARKETING_SMS = 'MARKETING_SMS',
  MARKETING_PHONE = 'MARKETING_PHONE',
  MARKETING_POSTAL = 'MARKETING_POSTAL',
  PROFILING = 'PROFILING',
  THIRD_PARTY_SHARING = 'THIRD_PARTY_SHARING',
  DATA_ANALYTICS = 'DATA_ANALYTICS',
  PERSONALIZATION = 'PERSONALIZATION'
}

// =============================================================================
// BUSINESS ENUMS
// =============================================================================

export enum BusinessArea {
  INSURANCE = 'INSURANCE',     // Soriano Seguros
  ENERGY = 'ENERGY',           // Soriano Energia
  TELECOM = 'TELECOM',         // Soriano Telecom
  BANKING = 'BANKING',         // Soriano Finanzas (Eurocaja Rural)
  REPAIRS = 'REPAIRS',         // Soriano Reparadores
  WORKSHOPS = 'WORKSHOPS',     // Soriano Talleres
  CORPORATE = 'CORPORATE'      // Soriano Mediadores (corporativo)
}

// =============================================================================
// GOLDEN RECORD ENUMS
// =============================================================================

export enum GoldenRecordStatus {
  ACTIVE = 'ACTIVE',
  PENDING_REVIEW = 'PENDING_REVIEW',
  MERGED = 'MERGED',
  UNMERGED = 'UNMERGED',
  DELETED = 'DELETED'
}

export enum MatchConfidence {
  EXACT = 'EXACT',           // 100% match
  HIGH = 'HIGH',             // 85-99%
  MEDIUM = 'MEDIUM',         // 70-84%
  LOW = 'LOW',               // 50-69%
  NO_MATCH = 'NO_MATCH'      // <50%
}

export enum MergeDecision {
  AUTO_MERGE = 'AUTO_MERGE',           // Sistema decide merge automatico
  MANUAL_REVIEW = 'MANUAL_REVIEW',     // Requiere revision humana
  NO_MERGE = 'NO_MERGE',               // No se debe fusionar
  POTENTIAL_MATCH = 'POTENTIAL_MATCH'  // Posible coincidencia para revision
}
