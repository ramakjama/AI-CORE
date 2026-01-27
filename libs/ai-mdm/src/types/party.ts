/**
 * AI-MDM Party Types - Interfaces para Party (persona fisica/juridica)
 */

import { PartyType, Gender, DocumentType, BusinessArea } from './enums';

// =============================================================================
// CORE PARTY INTERFACE
// =============================================================================

export interface Party {
  id: string;
  tenantId: string;
  partyType: PartyType;

  // Nombres
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  legalName?: string | null;
  tradeName?: string | null;

  // Documento principal
  documentType: DocumentType;
  documentNumber?: string | null;
  documentNorm?: string | null;
  documentExpiry?: Date | null;

  // Datos personales (solo fisicas)
  birthDate?: Date | null;
  gender: Gender;

  // Datos enriquecidos
  nationalityIso?: string | null;
  profession?: string | null;
  professionCode?: string | null;
  occupationId?: string | null;

  // Flags
  isVip: boolean;
  isBlacklisted: boolean;
  blacklistReason?: string | null;

  // Datos de antiguedad
  firstContactAt?: Date | null;
  customerSince?: Date | null;

  // Metricas agregadas
  totalActiveContracts?: number | null;
  totalLifetimeValue?: number | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// =============================================================================
// CREATE / UPDATE DTOs
// =============================================================================

export interface CreatePartyInput {
  tenantId: string;
  partyType: PartyType;

  // Nombres
  displayName: string;
  firstName?: string;
  lastName?: string;
  legalName?: string;
  tradeName?: string;

  // Documento principal
  documentType?: DocumentType;
  documentNumber?: string;
  documentExpiry?: Date;

  // Datos personales
  birthDate?: Date;
  gender?: Gender;

  // Datos enriquecidos
  nationalityIso?: string;
  profession?: string;
  professionCode?: string;

  // Flags
  isVip?: boolean;
}

export interface UpdatePartyInput {
  partyType?: PartyType;

  // Nombres
  displayName?: string;
  firstName?: string;
  lastName?: string;
  legalName?: string;
  tradeName?: string;

  // Documento principal
  documentType?: DocumentType;
  documentNumber?: string;
  documentExpiry?: Date;

  // Datos personales
  birthDate?: Date;
  gender?: Gender;

  // Datos enriquecidos
  nationalityIso?: string;
  profession?: string;
  professionCode?: string;

  // Flags
  isVip?: boolean;
  isBlacklisted?: boolean;
  blacklistReason?: string;
}

// =============================================================================
// SEARCH / FILTER
// =============================================================================

export interface PartySearchCriteria {
  tenantId: string;
  query?: string;                    // Busqueda libre
  partyType?: PartyType;
  documentNumber?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  isVip?: boolean;
  isBlacklisted?: boolean;
  businessArea?: BusinessArea;       // Filtrar por area de negocio

  // Paginacion
  limit?: number;
  offset?: number;

  // Ordenacion
  orderBy?: 'displayName' | 'createdAt' | 'updatedAt' | 'totalLifetimeValue';
  orderDirection?: 'asc' | 'desc';
}

export interface PartySearchResult {
  parties: Party[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// =============================================================================
// MERGE OPERATIONS
// =============================================================================

export interface MergePartyInput {
  sourcePartyIds: string[];          // Parties a fusionar
  targetPartyId?: string;            // Party destino (si no se especifica, se crea uno nuevo)

  // Resolucion de conflictos
  fieldResolutions?: {
    [field: string]: {
      sourcePartyId: string;         // De que party tomar el valor
      value?: unknown;               // O especificar valor manual
    };
  };

  mergeReason?: string;
  mergedBy?: string;                 // userId
}

export interface MergePartyResult {
  success: boolean;
  mergedParty: Party;
  sourceParties: Party[];
  mergeAuditId: string;
  warnings?: string[];
}

export interface UnmergePartyInput {
  mergedPartyId: string;
  mergeAuditId: string;
  unmergeReason?: string;
  unmergedBy?: string;
}

export interface UnmergePartyResult {
  success: boolean;
  restoredParties: Party[];
  warnings?: string[];
}

// =============================================================================
// EXTENDED PARTY (with relations)
// =============================================================================

export interface ExtendedParty extends Party {
  identifiers?: PartyIdentifierSummary[];
  contacts?: ContactSummary[];
  addresses?: AddressSummary[];
  relationships?: RelationshipSummary[];
  households?: HouseholdSummary[];
  externalAccounts?: ExternalAccountSummary[];
}

export interface PartyIdentifierSummary {
  id: string;
  type: string;
  value: string;
  isPrimary: boolean;
  isVerified: boolean;
}

export interface ContactSummary {
  id: string;
  type: string;
  value: string;
  isPrimary: boolean;
  isVerified: boolean;
}

export interface AddressSummary {
  id: string;
  type: string;
  line1: string;
  city?: string;
  postalCode?: string;
  isPrimary: boolean;
}

export interface RelationshipSummary {
  id: string;
  relatedPartyId: string;
  relatedPartyName: string;
  relationshipType: string;
  direction: 'from' | 'to';
}

export interface HouseholdSummary {
  id: string;
  name?: string;
  role: string;
  isHead: boolean;
}

export interface ExternalAccountSummary {
  id: string;
  area: BusinessArea;
  externalSystem: string;
  externalId: string;
}
