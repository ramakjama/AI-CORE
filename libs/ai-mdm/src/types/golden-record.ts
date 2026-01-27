/**
 * AI-MDM Golden Record Types - Interfaces para registro canonico unificado
 */

import { GoldenRecordStatus, MatchConfidence, MergeDecision, PartyType, DocumentType } from './enums';
import { Party } from './party';
import { PartyIdentifier } from './identifier';
import { ContactPoint, Address } from './contact';

// =============================================================================
// GOLDEN RECORD INTERFACE
// =============================================================================

/**
 * GoldenRecord representa el registro canonico/master de una entidad
 * Es el resultado de la consolidacion de multiples fuentes de datos
 */
export interface GoldenRecord {
  id: string;
  partyId: string;                    // Party principal asociado
  tenantId: string;

  status: GoldenRecordStatus;

  // Datos canonicos (la "verdad" consolidada)
  canonicalData: CanonicalPartyData;

  // Fuentes de datos contribuyentes
  sourceRecords: SourceRecord[];

  // Metricas de calidad
  qualityScore: number;               // 0-100
  completenessScore: number;          // 0-100
  accuracyScore: number;              // 0-100
  consistencyScore: number;           // 0-100

  // Historial de cambios
  lastMergeAt?: Date | null;
  lastUpdateSource?: string | null;

  // Conflictos pendientes
  pendingConflicts: DataConflict[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
}

// =============================================================================
// CANONICAL DATA
// =============================================================================

export interface CanonicalPartyData {
  // Identidad
  partyType: PartyType;
  displayName: string;
  firstName?: string;
  lastName?: string;
  legalName?: string;
  tradeName?: string;

  // Documento principal
  documentType: DocumentType;
  documentNumber?: string;

  // Datos personales
  birthDate?: Date;
  gender?: string;
  nationalityIso?: string;

  // Mejor contacto
  primaryEmail?: string;
  primaryPhone?: string;
  primaryAddress?: CanonicalAddress;

  // Datos enriquecidos
  profession?: string;
  isVip: boolean;

  // Confianza por campo
  fieldConfidence: Record<string, number>;
}

export interface CanonicalAddress {
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode: string;
  countryIso: string;
}

// =============================================================================
// SOURCE RECORDS
// =============================================================================

export interface SourceRecord {
  id: string;
  goldenRecordId: string;

  // Origen
  sourceSystem: string;               // "occident", "gco", "blacktelecom", etc.
  sourceId: string;                   // ID en el sistema origen
  businessArea: string;

  // Datos del origen
  rawData: Record<string, unknown>;
  extractedData: ExtractedPartyData;

  // Calidad del origen
  qualityScore: number;
  trustScore: number;                 // Confiabilidad del sistema origen

  // Timestamps
  firstSeenAt: Date;
  lastSeenAt: Date;
  lastChangedAt?: Date;
}

export interface ExtractedPartyData {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  legalName?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  birthDate?: Date;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    city?: string;
    postalCode?: string;
  };
  [key: string]: unknown;
}

// =============================================================================
// DATA CONFLICTS
// =============================================================================

export interface DataConflict {
  id: string;
  goldenRecordId: string;
  fieldName: string;

  // Valores en conflicto
  currentValue: unknown;
  conflictingValue: unknown;
  sourceRecordId: string;

  // Resolucion
  status: 'pending' | 'resolved' | 'ignored';
  resolvedValue?: unknown;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionReason?: string;

  createdAt: Date;
}

export interface ConflictResolutionInput {
  conflictId: string;
  resolution: 'accept_current' | 'accept_new' | 'manual_value' | 'ignore';
  manualValue?: unknown;
  reason?: string;
  resolvedBy?: string;
}

// =============================================================================
// MATCHING TYPES
// =============================================================================

export interface MatchCandidate {
  partyId: string;
  goldenRecordId?: string;
  displayName: string;
  documentNumber?: string;

  // Scores de matching
  overallScore: number;               // 0-100
  confidence: MatchConfidence;
  fieldScores: FieldMatchScore[];

  // Decision
  suggestedDecision: MergeDecision;
  isExactMatch: boolean;
}

export interface FieldMatchScore {
  fieldName: string;
  sourceValue: string;
  candidateValue: string;
  score: number;                      // 0-100
  matchType: 'exact' | 'fuzzy' | 'partial' | 'phonetic' | 'none';
}

export interface MatchingConfig {
  // Pesos por campo
  fieldWeights: Record<string, number>;

  // Umbrales
  exactMatchThreshold: number;        // Default 95
  highConfidenceThreshold: number;    // Default 85
  mediumConfidenceThreshold: number;  // Default 70
  lowConfidenceThreshold: number;     // Default 50

  // Configuracion de fuzzy
  fuzzyMatchEnabled: boolean;
  phoneticMatchEnabled: boolean;
  maxLevenshteinDistance: number;

  // Blocking
  blockingFields: string[];           // Campos para pre-filtrado
}

export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  fieldWeights: {
    documentNumber: 40,
    email: 20,
    phone: 15,
    firstName: 10,
    lastName: 10,
    birthDate: 5,
  },
  exactMatchThreshold: 95,
  highConfidenceThreshold: 85,
  mediumConfidenceThreshold: 70,
  lowConfidenceThreshold: 50,
  fuzzyMatchEnabled: true,
  phoneticMatchEnabled: true,
  maxLevenshteinDistance: 2,
  blockingFields: ['documentNumber', 'email', 'phone'],
};

// =============================================================================
// GOLDEN RECORD OPERATIONS
// =============================================================================

export interface BuildGoldenRecordInput {
  partyId: string;
  sourceRecords?: SourceRecord[];
  config?: Partial<MatchingConfig>;
}

export interface BuildGoldenRecordResult {
  goldenRecord: GoldenRecord;
  matchCandidates: MatchCandidate[];
  conflicts: DataConflict[];
  warnings: string[];
}

export interface UpdateGoldenRecordInput {
  goldenRecordId: string;
  sourceRecord: SourceRecord;
  forceUpdate?: boolean;
}

export interface UpdateGoldenRecordResult {
  goldenRecord: GoldenRecord;
  fieldsUpdated: string[];
  newConflicts: DataConflict[];
  warnings: string[];
}

// =============================================================================
// GOLDEN RECORD SEARCH
// =============================================================================

export interface GoldenRecordSearchCriteria {
  tenantId: string;
  query?: string;
  status?: GoldenRecordStatus;
  minQualityScore?: number;
  hasConflicts?: boolean;
  sourceSystem?: string;

  limit?: number;
  offset?: number;
}

export interface GoldenRecordSearchResult {
  records: GoldenRecord[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// =============================================================================
// SURVIVORSHIP RULES
// =============================================================================

/**
 * Reglas para determinar que valor "sobrevive" cuando hay conflictos
 */
export interface SurvivorshipRule {
  fieldName: string;
  strategy: SurvivorshipStrategy;
  config?: SurvivorshipConfig;
}

export type SurvivorshipStrategy =
  | 'most_recent'           // El valor mas reciente
  | 'most_trusted'          // Del sistema mas confiable
  | 'most_complete'         // El valor mas completo/largo
  | 'most_frequent'         // El valor mas frecuente
  | 'longest'               // El string mas largo
  | 'manual'                // Siempre requiere revision manual
  | 'custom';               // Logica personalizada

export interface SurvivorshipConfig {
  trustOrder?: string[];              // Orden de sistemas por confianza
  customFunction?: (values: SurvivorshipValue[]) => unknown;
}

export interface SurvivorshipValue {
  value: unknown;
  sourceSystem: string;
  timestamp: Date;
  quality: number;
}

export const DEFAULT_SURVIVORSHIP_RULES: SurvivorshipRule[] = [
  { fieldName: 'documentNumber', strategy: 'most_trusted', config: { trustOrder: ['manual', 'occident', 'gco'] } },
  { fieldName: 'displayName', strategy: 'most_complete' },
  { fieldName: 'firstName', strategy: 'most_frequent' },
  { fieldName: 'lastName', strategy: 'most_frequent' },
  { fieldName: 'birthDate', strategy: 'most_trusted' },
  { fieldName: 'email', strategy: 'most_recent' },
  { fieldName: 'phone', strategy: 'most_recent' },
  { fieldName: 'address', strategy: 'most_recent' },
];

// =============================================================================
// DATA QUALITY METRICS
// =============================================================================

export interface DataQualityReport {
  goldenRecordId: string;
  calculatedAt: Date;

  // Scores globales
  overallScore: number;
  completenessScore: number;
  accuracyScore: number;
  consistencyScore: number;
  timelinessScore: number;

  // Detalle por campo
  fieldQuality: FieldQualityScore[];

  // Issues detectados
  issues: DataQualityIssue[];

  // Recomendaciones
  recommendations: string[];
}

export interface FieldQualityScore {
  fieldName: string;
  isPresent: boolean;
  isValid: boolean;
  isConsistent: boolean;
  lastUpdated?: Date;
  score: number;
}

export interface DataQualityIssue {
  severity: 'high' | 'medium' | 'low';
  category: 'missing' | 'invalid' | 'inconsistent' | 'outdated' | 'duplicate';
  fieldName?: string;
  description: string;
  suggestedAction?: string;
}
