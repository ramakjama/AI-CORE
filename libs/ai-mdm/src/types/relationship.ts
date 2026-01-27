/**
 * AI-MDM Relationship Types - Interfaces para PartyRelationship
 */

import { RelationshipType, RelationshipSource } from './enums';

// =============================================================================
// CORE RELATIONSHIP INTERFACE
// =============================================================================

export interface PartyRelationship {
  id: string;
  fromPartyId: string;
  toPartyId: string;

  type: RelationshipType;
  source: RelationshipSource;
  confidence: number;          // 0..1

  startDate?: Date | null;
  endDate?: Date | null;
  isActive: boolean;

  // Metadata
  notes?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// CREATE / UPDATE DTOs
// =============================================================================

export interface CreateRelationshipInput {
  fromPartyId: string;
  toPartyId: string;
  type: RelationshipType;
  source?: RelationshipSource;
  confidence?: number;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  verifiedBy?: string;
}

export interface UpdateRelationshipInput {
  type?: RelationshipType;
  source?: RelationshipSource;
  confidence?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  notes?: string;
  verifiedBy?: string;
}

// =============================================================================
// RELATIONSHIP EVIDENCE
// =============================================================================

export interface RelationshipEvidence {
  id: string;
  relationshipId: string;
  fromPartyId: string;
  toPartyId: string;

  source: RelationshipSource;
  evidenceType: string;        // "shared_address", "shared_policy", "same_iban"
  evidenceRef?: string | null; // Referencia al dato (ej: policyNumber, addressId)
  confidence: number;
  notes?: string | null;

  createdAt: Date;
}

export interface CreateEvidenceInput {
  relationshipId: string;
  fromPartyId: string;
  toPartyId: string;
  source: RelationshipSource;
  evidenceType: string;
  evidenceRef?: string;
  confidence?: number;
  notes?: string;
}

// =============================================================================
// GRAPH QUERY TYPES
// =============================================================================

export interface RelationshipGraphQuery {
  partyId: string;
  depth?: number;              // Default 1, max 5
  relationshipTypes?: RelationshipType[];
  includeInactive?: boolean;
  minConfidence?: number;
}

export interface RelationshipGraphNode {
  partyId: string;
  displayName: string;
  partyType: string;
  documentNumber?: string;
  depth: number;
}

export interface RelationshipGraphEdge {
  id: string;
  fromPartyId: string;
  toPartyId: string;
  type: RelationshipType;
  source: RelationshipSource;
  confidence: number;
  isActive: boolean;
}

export interface RelationshipGraph {
  centerPartyId: string;
  nodes: RelationshipGraphNode[];
  edges: RelationshipGraphEdge[];
  maxDepth: number;
}

// =============================================================================
// RELATIONSHIP INFERENCE
// =============================================================================

export interface InferredRelationship {
  fromPartyId: string;
  toPartyId: string;
  suggestedType: RelationshipType;
  source: RelationshipSource;
  confidence: number;
  evidence: InferenceEvidence[];
  alreadyExists: boolean;
}

export interface InferenceEvidence {
  type: string;
  description: string;
  reference?: string;
  weight: number;
}

export interface InferRelationshipsInput {
  partyId: string;
  sources?: RelationshipSource[];  // Que tipos de inferencia ejecutar
  minConfidence?: number;
}

export interface InferRelationshipsResult {
  partyId: string;
  inferredRelationships: InferredRelationship[];
  totalFound: number;
  newRelationships: number;
  existingRelationships: number;
}

// =============================================================================
// BIDIRECTIONAL RELATIONSHIPS
// =============================================================================

/** Mapeo de relaciones bidireccionales */
export const BIDIRECTIONAL_RELATIONSHIPS: Record<RelationshipType, RelationshipType> = {
  [RelationshipType.SPOUSE]: RelationshipType.SPOUSE,
  [RelationshipType.PARTNER]: RelationshipType.PARTNER,
  [RelationshipType.CHILD]: RelationshipType.PARENT,
  [RelationshipType.PARENT]: RelationshipType.CHILD,
  [RelationshipType.SIBLING]: RelationshipType.SIBLING,
  [RelationshipType.GRANDPARENT]: RelationshipType.GRANDCHILD,
  [RelationshipType.GRANDCHILD]: RelationshipType.GRANDPARENT,
  [RelationshipType.UNCLE_AUNT]: RelationshipType.NEPHEW_NIECE,
  [RelationshipType.NEPHEW_NIECE]: RelationshipType.UNCLE_AUNT,
  [RelationshipType.COUSIN]: RelationshipType.COUSIN,
  [RelationshipType.IN_LAW]: RelationshipType.IN_LAW,
  [RelationshipType.ASCENDANT]: RelationshipType.DESCENDANT,
  [RelationshipType.DESCENDANT]: RelationshipType.ASCENDANT,
  [RelationshipType.GUARDIAN]: RelationshipType.OTHER,

  // Empresa
  [RelationshipType.OWNER]: RelationshipType.OTHER,
  [RelationshipType.BENEFICIAL_OWNER]: RelationshipType.OTHER,
  [RelationshipType.DIRECTOR]: RelationshipType.OTHER,
  [RelationshipType.ADMINISTRATOR]: RelationshipType.OTHER,
  [RelationshipType.PARTNER_SHAREHOLDER]: RelationshipType.OTHER,
  [RelationshipType.ATTORNEY_IN_FACT]: RelationshipType.OTHER,
  [RelationshipType.EMPLOYEE_OF]: RelationshipType.EMPLOYER_OF,
  [RelationshipType.EMPLOYER_OF]: RelationshipType.EMPLOYEE_OF,
  [RelationshipType.SUBSIDIARY]: RelationshipType.PARENT_COMPANY,
  [RelationshipType.PARENT_COMPANY]: RelationshipType.SUBSIDIARY,

  // Otros
  [RelationshipType.FRIEND]: RelationshipType.FRIEND,
  [RelationshipType.COHABITANT]: RelationshipType.COHABITANT,
  [RelationshipType.NEIGHBOR]: RelationshipType.NEIGHBOR,
  [RelationshipType.REFERRER]: RelationshipType.REFERRED_BY,
  [RelationshipType.REFERRED_BY]: RelationshipType.REFERRER,
  [RelationshipType.HOUSEHOLD_MEMBER]: RelationshipType.HOUSEHOLD_MEMBER,
  [RelationshipType.PAYOR_GROUP]: RelationshipType.PAYOR_GROUP,
  [RelationshipType.OTHER]: RelationshipType.OTHER,
};

/** Relaciones simetricas (la inversa es igual) */
export const SYMMETRIC_RELATIONSHIPS: RelationshipType[] = [
  RelationshipType.SPOUSE,
  RelationshipType.PARTNER,
  RelationshipType.SIBLING,
  RelationshipType.COUSIN,
  RelationshipType.IN_LAW,
  RelationshipType.FRIEND,
  RelationshipType.COHABITANT,
  RelationshipType.NEIGHBOR,
  RelationshipType.HOUSEHOLD_MEMBER,
  RelationshipType.PAYOR_GROUP,
];

/** Relaciones familiares */
export const FAMILY_RELATIONSHIPS: RelationshipType[] = [
  RelationshipType.SPOUSE,
  RelationshipType.PARTNER,
  RelationshipType.CHILD,
  RelationshipType.PARENT,
  RelationshipType.SIBLING,
  RelationshipType.GRANDPARENT,
  RelationshipType.GRANDCHILD,
  RelationshipType.UNCLE_AUNT,
  RelationshipType.NEPHEW_NIECE,
  RelationshipType.COUSIN,
  RelationshipType.IN_LAW,
  RelationshipType.ASCENDANT,
  RelationshipType.DESCENDANT,
  RelationshipType.GUARDIAN,
];

/** Relaciones empresariales */
export const BUSINESS_RELATIONSHIPS: RelationshipType[] = [
  RelationshipType.OWNER,
  RelationshipType.BENEFICIAL_OWNER,
  RelationshipType.DIRECTOR,
  RelationshipType.ADMINISTRATOR,
  RelationshipType.PARTNER_SHAREHOLDER,
  RelationshipType.ATTORNEY_IN_FACT,
  RelationshipType.EMPLOYEE_OF,
  RelationshipType.EMPLOYER_OF,
  RelationshipType.SUBSIDIARY,
  RelationshipType.PARENT_COMPANY,
];
