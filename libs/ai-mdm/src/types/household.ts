/**
 * AI-MDM Household Types - Interfaces para Household (unidades familiares)
 */

import { HouseholdSource, HouseholdRole } from './enums';

// =============================================================================
// CORE HOUSEHOLD INTERFACE
// =============================================================================

export interface Household {
  id: string;
  tenantId: string;

  // Identidad del hogar
  name?: string | null;             // "Familia Garcia-Lopez"

  // Residencia principal
  primaryPropertyId?: string | null;

  // Composicion del hogar (calculado)
  totalMembers: number;
  adultCount: number;
  minorCount: number;
  elderlyCount: number;

  // Metricas agregadas (calculadas por ETL)
  totalPolicies: number;
  totalPremium: number;
  totalVehicles: number;
  totalProperties: number;

  // Scoring
  householdLtv?: number | null;
  crossSellScore?: number | null;
  churnRisk?: number | null;

  // Metadata
  confidenceScore: number;
  source: HouseholdSource;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// HOUSEHOLD MEMBER
// =============================================================================

export interface HouseholdMember {
  id: string;
  householdId: string;
  partyId: string;

  role: HouseholdRole;
  isHead: boolean;

  joinedAt: Date;
  leftAt?: Date | null;

  createdAt: Date;

  // Populated fields
  party?: {
    id: string;
    displayName: string;
    partyType: string;
    birthDate?: Date | null;
    gender?: string;
  };
}

// =============================================================================
// CREATE / UPDATE DTOs
// =============================================================================

export interface CreateHouseholdInput {
  tenantId: string;
  name?: string;
  primaryPropertyId?: string;
  source?: HouseholdSource;
  confidenceScore?: number;

  // Miembros iniciales
  members?: CreateHouseholdMemberInput[];
}

export interface UpdateHouseholdInput {
  name?: string;
  primaryPropertyId?: string;
  source?: HouseholdSource;
  confidenceScore?: number;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface CreateHouseholdMemberInput {
  householdId?: string;
  partyId: string;
  role?: HouseholdRole;
  isHead?: boolean;
  joinedAt?: Date;
}

export interface UpdateHouseholdMemberInput {
  role?: HouseholdRole;
  isHead?: boolean;
  leftAt?: Date;
}

// =============================================================================
// HOUSEHOLD WITH MEMBERS
// =============================================================================

export interface HouseholdWithMembers extends Household {
  members: HouseholdMember[];
}

export interface HouseholdSummary {
  id: string;
  name?: string;
  totalMembers: number;
  totalPolicies: number;
  totalPremium: number;
  householdLtv?: number;
  source: HouseholdSource;
}

// =============================================================================
// HOUSEHOLD SEARCH
// =============================================================================

export interface HouseholdSearchCriteria {
  tenantId: string;
  query?: string;
  partyId?: string;              // Buscar hogares donde esta party es miembro
  primaryPropertyId?: string;
  minMembers?: number;
  maxMembers?: number;
  minPremium?: number;
  source?: HouseholdSource;

  // Paginacion
  limit?: number;
  offset?: number;
}

export interface HouseholdSearchResult {
  households: HouseholdWithMembers[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// =============================================================================
// HOUSEHOLD INFERENCE
// =============================================================================

export interface InferHouseholdsInput {
  tenantId: string;
  partyId?: string;              // Inferir para una party especifica
  minConfidence?: number;
  sources?: HouseholdSource[];   // Que tipos de inferencia usar
}

export interface InferredHousehold {
  suggestedMembers: InferredHouseholdMember[];
  source: HouseholdSource;
  confidence: number;
  evidence: HouseholdInferenceEvidence[];
  existingHouseholdId?: string;  // Si ya existe un hogar similar
}

export interface InferredHouseholdMember {
  partyId: string;
  partyDisplayName: string;
  suggestedRole: HouseholdRole;
  suggestedIsHead: boolean;
  confidence: number;
}

export interface HouseholdInferenceEvidence {
  type: 'shared_address' | 'family_relationship' | 'shared_policy' | 'same_surname' | 'phone_match';
  description: string;
  reference?: string;
  weight: number;
}

export interface InferHouseholdsResult {
  tenantId: string;
  inferredHouseholds: InferredHousehold[];
  totalFound: number;
  newHouseholds: number;
  existingHouseholds: number;
}

// =============================================================================
// HOUSEHOLD METRICS
// =============================================================================

export interface HouseholdMetrics {
  householdId: string;

  // Composicion
  totalMembers: number;
  adultCount: number;
  minorCount: number;
  elderlyCount: number;
  avgAge?: number;

  // Economicos
  totalPolicies: number;
  totalPremium: number;
  avgPremiumPerMember: number;

  // Activos
  totalVehicles: number;
  totalProperties: number;

  // Scoring
  householdLtv: number;
  crossSellScore: number;
  churnRisk: number;
  engagementScore: number;

  // Oportunidades
  missingProducts: string[];
  crossSellOpportunities: CrossSellOpportunity[];

  calculatedAt: Date;
}

export interface CrossSellOpportunity {
  productCategory: string;
  reason: string;
  probability: number;
  estimatedValue: number;
  targetMemberId?: string;
}

// =============================================================================
// HOUSEHOLD OPERATIONS
// =============================================================================

export interface MergeHouseholdsInput {
  sourceHouseholdIds: string[];
  targetHouseholdId?: string;    // Si no se especifica, se mantiene el primero
  mergeReason?: string;
  mergedBy?: string;
}

export interface MergeHouseholdsResult {
  success: boolean;
  mergedHousehold: HouseholdWithMembers;
  sourceHouseholds: string[];
  warnings?: string[];
}

export interface SplitHouseholdInput {
  householdId: string;
  newHouseholdMembers: string[];  // IDs de miembros para el nuevo hogar
  splitReason?: string;
  splitBy?: string;
}

export interface SplitHouseholdResult {
  success: boolean;
  originalHousehold: HouseholdWithMembers;
  newHousehold: HouseholdWithMembers;
  warnings?: string[];
}
