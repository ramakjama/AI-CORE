/**
 * AI-MDM Identifier Types - Interfaces para PartyIdentifier
 */

import { IdentifierType, DocumentType } from './enums';

// =============================================================================
// CORE IDENTIFIER INTERFACE
// =============================================================================

export interface PartyIdentifier {
  id: string;
  partyId: string;
  type: IdentifierType;
  value: string;           // Valor original
  valueNorm: string;       // Valor normalizado
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt?: Date | null;
  source?: string | null;
  createdAt: Date;
}

// =============================================================================
// CREATE / UPDATE DTOs
// =============================================================================

export interface CreateIdentifierInput {
  partyId: string;
  type: IdentifierType;
  value: string;
  isPrimary?: boolean;
  isVerified?: boolean;
  source?: string;
}

export interface UpdateIdentifierInput {
  isPrimary?: boolean;
  isVerified?: boolean;
  source?: string;
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface IdentifierValidationResult {
  isValid: boolean;
  type: IdentifierType | DocumentType;
  originalValue: string;
  normalizedValue: string;
  errors: string[];
  warnings: string[];
  metadata?: IdentifierMetadata;
}

export interface IdentifierMetadata {
  // Para NIF/CIF/NIE
  documentType?: DocumentType;
  controlDigit?: string;
  province?: string;          // Para CIF

  // Para telefonos
  countryCode?: string;
  nationalNumber?: string;
  isFixedLine?: boolean;
  isMobile?: boolean;

  // Para email
  domain?: string;
  localPart?: string;

  // Para IBAN
  countryCode2?: string;
  checkDigits?: string;
  bankCode?: string;
  branchCode?: string;
  accountNumber?: string;
}

// =============================================================================
// LOOKUP TYPES
// =============================================================================

export interface IdentifierLookupResult {
  found: boolean;
  identifier?: PartyIdentifier;
  party?: {
    id: string;
    displayName: string;
    partyType: string;
  };
  duplicates?: IdentifierDuplicateInfo[];
}

export interface IdentifierDuplicateInfo {
  identifierId: string;
  partyId: string;
  partyDisplayName: string;
  type: IdentifierType;
  value: string;
  confidence: number;
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

export interface BatchIdentifierInput {
  partyId: string;
  identifiers: CreateIdentifierInput[];
}

export interface BatchIdentifierResult {
  success: boolean;
  created: PartyIdentifier[];
  errors: Array<{
    input: CreateIdentifierInput;
    error: string;
  }>;
  duplicatesFound: IdentifierDuplicateInfo[];
}

// =============================================================================
// SPANISH DOCUMENT TYPES
// =============================================================================

export interface SpanishDocumentInfo {
  type: DocumentType;
  originalValue: string;
  normalizedValue: string;
  isValid: boolean;
  controlDigit?: string;
  errors: string[];

  // Specific to each type
  letterPosition?: 'prefix' | 'suffix';   // NIE has prefix, DNI has suffix
  numericPart?: string;
  letterPart?: string;

  // CIF specific
  cifOrganizationType?: string;           // A, B, C, D, etc.
  cifProvince?: string;                   // 2 digits
  cifSequence?: string;                   // 5 digits
  cifControlType?: 'letter' | 'digit';    // Some CIFs end in letter, others in digit
}

export interface SpanishDocumentValidation {
  dni: (value: string) => SpanishDocumentInfo;
  nie: (value: string) => SpanishDocumentInfo;
  cif: (value: string) => SpanishDocumentInfo;
  auto: (value: string) => SpanishDocumentInfo;  // Auto-detect type
}
