/**
 * AI-MDM Golden Record Service
 * Manages Golden Records - consolidated master records from multiple sources
 */

import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import {
  GoldenRecord,
  GoldenRecordFieldSource,
  GoldenRecordConflict,
  Party,
  PartyType,
  SourceSystem,
  IndividualData,
  OrganizationData,
  PartyIdentifier,
  Address,
  Contact,
  DataQualityMetrics,
  Gender
} from '../types';
import { getPartiesStore } from './party.service';

// In-memory stores
const goldenRecords: Map<string, GoldenRecord> = new Map();
const conflicts: Map<string, GoldenRecordConflict[]> = new Map();

/**
 * Source system priority for conflict resolution (higher = more trusted)
 */
const SOURCE_PRIORITY: Record<SourceSystem, number> = {
  [SourceSystem.CORE_INSURANCE]: 100,
  [SourceSystem.CRM]: 90,
  [SourceSystem.AGENT_PORTAL]: 80,
  [SourceSystem.CALL_CENTER]: 70,
  [SourceSystem.WEBSITE]: 60,
  [SourceSystem.MOBILE_APP]: 50,
  [SourceSystem.EXTERNAL_API]: 40,
  [SourceSystem.DATA_IMPORT]: 30,
  [SourceSystem.MANUAL_ENTRY]: 20
};

/**
 * Field weights for data quality scoring
 */
const FIELD_WEIGHTS: Record<string, number> = {
  'individual.firstName': 1.0,
  'individual.lastName': 1.0,
  'individual.birthDate': 0.8,
  'individual.gender': 0.5,
  'organization.legalName': 1.0,
  'organization.tradeName': 0.7,
  'identifiers': 1.0,
  'addresses': 0.9,
  'contacts': 0.9
};

/**
 * Golden Record Service
 */
export class GoldenRecordService {
  private currentUser: string;

  constructor(currentUser: string = 'system') {
    this.currentUser = currentUser;
  }

  /**
   * Set current user for audit
   */
  setCurrentUser(userId: string): void {
    this.currentUser = userId;
  }

  /**
   * Build a golden record for a party by consolidating data from multiple sources
   */
  async buildGoldenRecord(partyId: string): Promise<GoldenRecord> {
    const parties = getPartiesStore();
    const party = parties.get(partyId);

    if (!party) {
      throw new Error(`Party not found: ${partyId}`);
    }

    // Get all related source parties (parties that should be merged)
    const sourceParties = await this.getSourceParties(partyId);

    // If no source parties, create a golden record from the single party
    if (sourceParties.length === 0) {
      sourceParties.push(party);
    }

    const now = new Date();
    const goldenRecordId = party.goldenRecordId || uuidv4();

    // Consolidate data from all sources
    const consolidated = this.consolidateData(sourceParties);
    const fieldSources = this.buildFieldSources(sourceParties);
    const unresolvedConflicts = this.detectConflicts(sourceParties, goldenRecordId);

    // Calculate quality scores
    const qualityScores = this.calculateQualityScores(consolidated, fieldSources);

    // Build golden record
    const goldenRecord: GoldenRecord = {
      id: goldenRecordId,
      partyId,
      displayName: consolidated.displayName,
      type: party.type,
      individual: consolidated.individual,
      organization: consolidated.organization,
      bestIdentifier: consolidated.bestIdentifier,
      bestAddress: consolidated.bestAddress,
      bestContact: consolidated.bestContact,
      sourcePartyIds: sourceParties.map(p => p.id),
      sourceSystems: [...new Set(sourceParties.map(p => p.sourceSystem))],
      dataQualityScore: qualityScores.overall,
      completenessScore: qualityScores.completeness,
      accuracyScore: qualityScores.accuracy,
      consistencyScore: qualityScores.consistency,
      fieldSources,
      unresolvedConflicts,
      lastRefreshedAt: now,
      createdAt: goldenRecords.has(goldenRecordId) ? goldenRecords.get(goldenRecordId)!.createdAt : now,
      updatedAt: now
    };

    // Store golden record and conflicts
    goldenRecords.set(goldenRecordId, goldenRecord);
    conflicts.set(goldenRecordId, unresolvedConflicts);

    // Update party reference
    party.goldenRecordId = goldenRecordId;
    party.isGoldenRecord = true;
    parties.set(partyId, party);

    return goldenRecord;
  }

  /**
   * Get an existing golden record
   */
  async getGoldenRecord(partyId: string): Promise<GoldenRecord | null> {
    const parties = getPartiesStore();
    const party = parties.get(partyId);

    if (!party || !party.goldenRecordId) {
      return null;
    }

    return goldenRecords.get(party.goldenRecordId) || null;
  }

  /**
   * Refresh an existing golden record with latest data
   */
  async refreshGoldenRecord(partyId: string): Promise<GoldenRecord> {
    const existingRecord = await this.getGoldenRecord(partyId);

    if (!existingRecord) {
      // Create new if doesn't exist
      return this.buildGoldenRecord(partyId);
    }

    // Rebuild with current data
    return this.buildGoldenRecord(partyId);
  }

  /**
   * Resolve a conflict by selecting a specific value
   */
  async resolveConflict(
    partyId: string,
    fieldPath: string,
    selectedValue: unknown
  ): Promise<GoldenRecord> {
    const goldenRecord = await this.getGoldenRecord(partyId);

    if (!goldenRecord) {
      throw new Error(`Golden record not found for party: ${partyId}`);
    }

    // Find the conflict
    const conflictIndex = goldenRecord.unresolvedConflicts.findIndex(
      c => c.fieldPath === fieldPath
    );

    if (conflictIndex === -1) {
      throw new Error(`No conflict found for field: ${fieldPath}`);
    }

    const conflict = goldenRecord.unresolvedConflicts[conflictIndex];
    if (!conflict) {
      throw new Error(`No conflict found at index: ${conflictIndex}`);
    }

    // Mark conflict as resolved
    conflict.resolvedAt = new Date();
    conflict.resolvedBy = this.currentUser;
    conflict.resolution = 'SELECTED';
    conflict.selectedValue = selectedValue;

    // Remove from unresolved list
    goldenRecord.unresolvedConflicts.splice(conflictIndex, 1);

    // Update the golden record field with selected value
    _.set(goldenRecord, fieldPath, selectedValue);

    // Update field source
    const fieldSourceIndex = goldenRecord.fieldSources.findIndex(
      fs => fs.fieldPath === fieldPath
    );
    if (fieldSourceIndex !== -1) {
      const fieldSource = goldenRecord.fieldSources[fieldSourceIndex];
      if (fieldSource) {
        fieldSource.value = selectedValue;
        fieldSource.confidence = 1.0; // Manual resolution = full confidence
        fieldSource.lastUpdated = new Date();
      }
    }

    goldenRecord.updatedAt = new Date();

    // Store updates
    goldenRecords.set(goldenRecord.id, goldenRecord);

    return goldenRecord;
  }

  /**
   * Get all source systems that contributed to a party's data
   */
  async getSources(partyId: string): Promise<{
    system: SourceSystem;
    partyIds: string[];
    lastSyncAt?: Date;
    fieldsProvided: string[];
  }[]> {
    const goldenRecord = await this.getGoldenRecord(partyId);

    if (!goldenRecord) {
      return [];
    }

    // Group field sources by system
    const sourceMap = new Map<SourceSystem, {
      partyIds: Set<string>;
      fields: Set<string>;
      lastUpdated: Date;
    }>();

    for (const fieldSource of goldenRecord.fieldSources) {
      const existing = sourceMap.get(fieldSource.sourceSystem) || {
        partyIds: new Set<string>(),
        fields: new Set<string>(),
        lastUpdated: new Date(0)
      };

      existing.partyIds.add(fieldSource.sourcePartyId);
      existing.fields.add(fieldSource.fieldPath);
      if (fieldSource.lastUpdated > existing.lastUpdated) {
        existing.lastUpdated = fieldSource.lastUpdated;
      }

      sourceMap.set(fieldSource.sourceSystem, existing);
    }

    // Convert to array
    return Array.from(sourceMap.entries()).map(([system, data]) => ({
      system,
      partyIds: Array.from(data.partyIds),
      lastSyncAt: data.lastUpdated,
      fieldsProvided: Array.from(data.fields)
    }));
  }

  /**
   * Get data quality score for a party
   */
  async getDataQualityScore(partyId: string): Promise<DataQualityMetrics> {
    const goldenRecord = await this.getGoldenRecord(partyId);
    const parties = getPartiesStore();
    const party = parties.get(partyId);

    if (!party) {
      throw new Error(`Party not found: ${partyId}`);
    }

    // Calculate detailed metrics
    const completeness = this.calculateCompletenessScore(party, goldenRecord);
    const accuracy = this.calculateAccuracyScore(party, goldenRecord);
    const consistency = this.calculateConsistencyScore(party, goldenRecord);
    const timeliness = this.calculateTimelinessScore(party, goldenRecord);
    const uniqueness = this.calculateUniquenessScore(party);

    const overallScore = Math.round(
      completeness.score * 0.25 +
      accuracy.score * 0.25 +
      consistency.score * 0.20 +
      timeliness.score * 0.15 +
      uniqueness.score * 0.15
    );

    return {
      partyId,
      overallScore,
      completeness,
      accuracy,
      consistency,
      timeliness,
      uniqueness
    };
  }

  /**
   * Get all golden records (for admin/reporting)
   */
  async getAllGoldenRecords(): Promise<GoldenRecord[]> {
    return Array.from(goldenRecords.values());
  }

  /**
   * Delete a golden record
   */
  async deleteGoldenRecord(goldenRecordId: string): Promise<boolean> {
    const record = goldenRecords.get(goldenRecordId);
    if (!record) {
      return false;
    }

    // Remove golden record reference from party
    const parties = getPartiesStore();
    const party = parties.get(record.partyId);
    if (party) {
      party.goldenRecordId = undefined;
      party.isGoldenRecord = false;
      parties.set(record.partyId, party);
    }

    // Delete record and conflicts
    goldenRecords.delete(goldenRecordId);
    conflicts.delete(goldenRecordId);

    return true;
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  /**
   * Get all source parties that should be consolidated
   */
  private async getSourceParties(partyId: string): Promise<Party[]> {
    const parties = getPartiesStore();
    const mainParty = parties.get(partyId);

    if (!mainParty) {
      return [];
    }

    // For now, return just the main party
    // In a full implementation, this would find all parties linked through merges
    const sourceParties: Party[] = [mainParty];

    // Find parties with same identifiers
    for (const party of parties.values()) {
      if (party.id === partyId || party.isDeleted) continue;

      // Check for matching identifiers
      const hasMatchingId = party.identifiers.some(id1 =>
        mainParty.identifiers.some(id2 =>
          id1.type === id2.type && id1.value === id2.value
        )
      );

      if (hasMatchingId && !sourceParties.find(p => p.id === party.id)) {
        sourceParties.push(party);
      }
    }

    return sourceParties;
  }

  /**
   * Consolidate data from multiple source parties
   */
  private consolidateData(parties: Party[]): {
    displayName: string;
    individual?: IndividualData;
    organization?: OrganizationData;
    bestIdentifier?: PartyIdentifier;
    bestAddress?: Address;
    bestContact?: Contact;
  } {
    // Sort parties by source priority
    const sortedParties = [...parties].sort(
      (a, b) => SOURCE_PRIORITY[b.sourceSystem] - SOURCE_PRIORITY[a.sourceSystem]
    );

    const primaryParty = sortedParties[0];
    if (!primaryParty) {
      return {
        displayName: 'Unknown',
        individual: undefined,
        organization: undefined,
        bestIdentifier: undefined,
        bestAddress: undefined,
        bestContact: undefined
      };
    }

    // Consolidate individual data
    let individual: IndividualData | undefined;
    if (primaryParty.type === PartyType.INDIVIDUAL) {
      individual = this.consolidateIndividualData(sortedParties);
    }

    // Consolidate organization data
    let organization: OrganizationData | undefined;
    if (primaryParty.type === PartyType.ORGANIZATION) {
      organization = this.consolidateOrganizationData(sortedParties);
    }

    // Find best identifier (primary, verified, from highest priority source)
    const bestIdentifier = this.selectBestIdentifier(sortedParties);

    // Find best address (primary, verified, from highest priority source)
    const bestAddress = this.selectBestAddress(sortedParties);

    // Find best contact (primary, verified, from highest priority source)
    const bestContact = this.selectBestContact(sortedParties);

    // Build display name
    const displayName = this.buildConsolidatedDisplayName(
      primaryParty.type,
      individual,
      organization,
      primaryParty.displayName
    );

    return {
      displayName,
      individual,
      organization,
      bestIdentifier,
      bestAddress,
      bestContact
    };
  }

  /**
   * Consolidate individual data from multiple sources
   */
  private consolidateIndividualData(parties: Party[]): IndividualData | undefined {
    const individualsData = parties
      .filter(p => p.individual)
      .map(p => ({ data: p.individual!, priority: SOURCE_PRIORITY[p.sourceSystem] }));

    if (individualsData.length === 0) {
      return undefined;
    }

    // Pick best value for each field based on priority and availability
    return {
      firstName: this.selectBestValue(individualsData, 'firstName') as string,
      lastName: this.selectBestValue(individualsData, 'lastName') as string,
      middleName: this.selectBestValue(individualsData, 'middleName') as string | undefined,
      secondLastName: this.selectBestValue(individualsData, 'secondLastName') as string | undefined,
      prefix: this.selectBestValue(individualsData, 'prefix') as string | undefined,
      suffix: this.selectBestValue(individualsData, 'suffix') as string | undefined,
      birthDate: this.selectBestValue(individualsData, 'birthDate') as Date | undefined,
      deathDate: this.selectBestValue(individualsData, 'deathDate') as Date | undefined,
      gender: this.selectBestValue(individualsData, 'gender') as Gender | undefined,
      nationality: this.selectBestValue(individualsData, 'nationality') as string | undefined,
      maritalStatus: this.selectBestValue(individualsData, 'maritalStatus') as string | undefined,
      occupation: this.selectBestValue(individualsData, 'occupation') as string | undefined,
      education: this.selectBestValue(individualsData, 'education') as string | undefined
    };
  }

  /**
   * Consolidate organization data from multiple sources
   */
  private consolidateOrganizationData(parties: Party[]): OrganizationData | undefined {
    const orgsData = parties
      .filter(p => p.organization)
      .map(p => ({ data: p.organization!, priority: SOURCE_PRIORITY[p.sourceSystem] }));

    if (orgsData.length === 0) {
      return undefined;
    }

    return {
      legalName: this.selectBestValue(orgsData, 'legalName') as string,
      tradeName: this.selectBestValue(orgsData, 'tradeName') as string | undefined,
      legalForm: this.selectBestValue(orgsData, 'legalForm') as string | undefined,
      incorporationDate: this.selectBestValue(orgsData, 'incorporationDate') as Date | undefined,
      dissolutionDate: this.selectBestValue(orgsData, 'dissolutionDate') as Date | undefined,
      industry: this.selectBestValue(orgsData, 'industry') as string | undefined,
      sector: this.selectBestValue(orgsData, 'sector') as string | undefined,
      employeeCount: this.selectBestValue(orgsData, 'employeeCount') as number | undefined,
      annualRevenue: this.selectBestValue(orgsData, 'annualRevenue') as number | undefined,
      website: this.selectBestValue(orgsData, 'website') as string | undefined
    };
  }

  /**
   * Select best value for a field from multiple sources
   */
  private selectBestValue<T>(
    sources: { data: T; priority: number }[],
    field: keyof T
  ): T[keyof T] {
    // Sort by priority (highest first)
    const sorted = sources
      .filter(s => s.data[field] !== undefined && s.data[field] !== null)
      .sort((a, b) => b.priority - a.priority);

    if (sorted.length === 0) {
      return undefined as T[keyof T];
    }

    return sorted[0]!.data[field];
  }

  /**
   * Select best identifier from all parties
   */
  private selectBestIdentifier(parties: Party[]): PartyIdentifier | undefined {
    const allIdentifiers: { identifier: PartyIdentifier; priority: number }[] = [];

    for (const party of parties) {
      for (const id of party.identifiers) {
        allIdentifiers.push({
          identifier: id,
          priority: SOURCE_PRIORITY[party.sourceSystem] +
            (id.isPrimary ? 50 : 0) +
            (id.isVerified ? 30 : 0)
        });
      }
    }

    if (allIdentifiers.length === 0) {
      return undefined;
    }

    allIdentifiers.sort((a, b) => b.priority - a.priority);
    return allIdentifiers[0]!.identifier;
  }

  /**
   * Select best address from all parties
   */
  private selectBestAddress(parties: Party[]): Address | undefined {
    const allAddresses: { address: Address; priority: number }[] = [];

    for (const party of parties) {
      for (const addr of party.addresses) {
        allAddresses.push({
          address: addr,
          priority: SOURCE_PRIORITY[party.sourceSystem] +
            (addr.isPrimary ? 50 : 0) +
            (addr.isVerified ? 30 : 0)
        });
      }
    }

    if (allAddresses.length === 0) {
      return undefined;
    }

    allAddresses.sort((a, b) => b.priority - a.priority);
    return allAddresses[0]!.address;
  }

  /**
   * Select best contact from all parties
   */
  private selectBestContact(parties: Party[]): Contact | undefined {
    const allContacts: { contact: Contact; priority: number }[] = [];

    for (const party of parties) {
      for (const contact of party.contacts) {
        allContacts.push({
          contact,
          priority: SOURCE_PRIORITY[party.sourceSystem] +
            (contact.isPrimary ? 50 : 0) +
            (contact.isVerified ? 30 : 0) +
            (contact.isPreferred ? 20 : 0)
        });
      }
    }

    if (allContacts.length === 0) {
      return undefined;
    }

    allContacts.sort((a, b) => b.priority - a.priority);
    return allContacts[0]!.contact;
  }

  /**
   * Build consolidated display name
   */
  private buildConsolidatedDisplayName(
    type: PartyType,
    individual?: IndividualData,
    organization?: OrganizationData,
    fallback?: string
  ): string {
    if (type === PartyType.INDIVIDUAL && individual) {
      const parts = [
        individual.firstName,
        individual.middleName,
        individual.lastName,
        individual.secondLastName
      ].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(' ');
      }
    }

    if (type === PartyType.ORGANIZATION && organization) {
      return organization.tradeName || organization.legalName || fallback || 'Unknown';
    }

    return fallback || 'Unknown';
  }

  /**
   * Build field sources tracking
   */
  private buildFieldSources(parties: Party[]): GoldenRecordFieldSource[] {
    const fieldSources: GoldenRecordFieldSource[] = [];
    const fieldsTracked = new Set<string>();

    // Sort parties by priority
    const sortedParties = [...parties].sort(
      (a, b) => SOURCE_PRIORITY[b.sourceSystem] - SOURCE_PRIORITY[a.sourceSystem]
    );

    for (const party of sortedParties) {
      // Track individual fields
      if (party.individual) {
        for (const [key, value] of Object.entries(party.individual)) {
          const fieldPath = `individual.${key}`;
          if (value !== undefined && value !== null && !fieldsTracked.has(fieldPath)) {
            fieldSources.push({
              fieldPath,
              value,
              sourcePartyId: party.id,
              sourceSystem: party.sourceSystem,
              confidence: SOURCE_PRIORITY[party.sourceSystem] / 100,
              lastUpdated: party.updatedAt
            });
            fieldsTracked.add(fieldPath);
          }
        }
      }

      // Track organization fields
      if (party.organization) {
        for (const [key, value] of Object.entries(party.organization)) {
          const fieldPath = `organization.${key}`;
          if (value !== undefined && value !== null && !fieldsTracked.has(fieldPath)) {
            fieldSources.push({
              fieldPath,
              value,
              sourcePartyId: party.id,
              sourceSystem: party.sourceSystem,
              confidence: SOURCE_PRIORITY[party.sourceSystem] / 100,
              lastUpdated: party.updatedAt
            });
            fieldsTracked.add(fieldPath);
          }
        }
      }
    }

    return fieldSources;
  }

  /**
   * Detect conflicts between source parties
   */
  private detectConflicts(parties: Party[], goldenRecordId: string): GoldenRecordConflict[] {
    const detectedConflicts: GoldenRecordConflict[] = [];

    if (parties.length < 2) {
      return detectedConflicts;
    }

    // Fields to check for conflicts
    const individualFields = ['firstName', 'lastName', 'birthDate', 'gender'];
    const organizationFields = ['legalName', 'tradeName'];

    // Check individual field conflicts
    for (const field of individualFields) {
      const values = parties
        .filter(p => p.individual && (p.individual as unknown as Record<string, unknown>)[field] !== undefined)
        .map(p => ({
          value: (p.individual as unknown as Record<string, unknown>)[field],
          sourcePartyId: p.id,
          sourceSystem: p.sourceSystem,
          updatedAt: p.updatedAt
        }));

      if (values.length > 1) {
        const uniqueValues = new Set(values.map(v => JSON.stringify(v.value)));
        if (uniqueValues.size > 1) {
          detectedConflicts.push({
            id: uuidv4(),
            goldenRecordId,
            fieldPath: `individual.${field}`,
            values
          });
        }
      }
    }

    // Check organization field conflicts
    for (const field of organizationFields) {
      const values = parties
        .filter(p => p.organization && (p.organization as unknown as Record<string, unknown>)[field] !== undefined)
        .map(p => ({
          value: (p.organization as unknown as Record<string, unknown>)[field],
          sourcePartyId: p.id,
          sourceSystem: p.sourceSystem,
          updatedAt: p.updatedAt
        }));

      if (values.length > 1) {
        const uniqueValues = new Set(values.map(v => JSON.stringify(v.value)));
        if (uniqueValues.size > 1) {
          detectedConflicts.push({
            id: uuidv4(),
            goldenRecordId,
            fieldPath: `organization.${field}`,
            values
          });
        }
      }
    }

    return detectedConflicts;
  }

  /**
   * Calculate quality scores for golden record
   */
  private calculateQualityScores(
    consolidated: ReturnType<typeof this.consolidateData>,
    fieldSources: GoldenRecordFieldSource[]
  ): { overall: number; completeness: number; accuracy: number; consistency: number } {
    // Completeness: percentage of expected fields filled
    let filledFields = 0;
    let totalFields = 0;

    for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
      totalFields += weight;
      const value = _.get(consolidated, field);
      if (value !== undefined && value !== null &&
          (typeof value !== 'object' || (Array.isArray(value) && value.length > 0))) {
        filledFields += weight;
      }
    }

    const completeness = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    // Accuracy: average confidence of field sources
    const accuracy = fieldSources.length > 0
      ? Math.round((fieldSources.reduce((sum, fs) => sum + fs.confidence, 0) / fieldSources.length) * 100)
      : 50;

    // Consistency: fewer conflicts = higher score
    const consistency = 100; // Will be adjusted based on conflicts

    // Overall weighted score
    const overall = Math.round(completeness * 0.4 + accuracy * 0.35 + consistency * 0.25);

    return { overall, completeness, accuracy, consistency };
  }

  /**
   * Calculate completeness score
   */
  private calculateCompletenessScore(
    party: Party,
    goldenRecord: GoldenRecord | null
  ): DataQualityMetrics['completeness'] {
    const requiredFields = party.type === PartyType.INDIVIDUAL
      ? ['individual.firstName', 'individual.lastName', 'identifiers', 'contacts', 'addresses']
      : ['organization.legalName', 'identifiers', 'contacts', 'addresses'];

    const missingFields: string[] = [];
    let filled = 0;

    for (const field of requiredFields) {
      const value = _.get(goldenRecord || party, field);
      if (value !== undefined && value !== null &&
          (typeof value !== 'object' || (Array.isArray(value) && value.length > 0))) {
        filled++;
      } else {
        missingFields.push(field);
      }
    }

    return {
      score: Math.round((filled / requiredFields.length) * 100),
      missingFields,
      requiredFieldsFilled: filled,
      totalRequiredFields: requiredFields.length
    };
  }

  /**
   * Calculate accuracy score
   */
  private calculateAccuracyScore(
    party: Party,
    goldenRecord: GoldenRecord | null
  ): DataQualityMetrics['accuracy'] {
    const verifiedFields: string[] = [];
    const unverifiedFields: string[] = [];

    // Check identifiers
    for (const id of party.identifiers) {
      if (id.isVerified) {
        verifiedFields.push(`identifier.${id.type}`);
      } else {
        unverifiedFields.push(`identifier.${id.type}`);
      }
    }

    // Check addresses
    for (const addr of party.addresses) {
      if (addr.isVerified) {
        verifiedFields.push(`address.${addr.type}`);
      } else {
        unverifiedFields.push(`address.${addr.type}`);
      }
    }

    // Check contacts
    for (const contact of party.contacts) {
      if (contact.isVerified) {
        verifiedFields.push(`contact.${contact.type}`);
      } else {
        unverifiedFields.push(`contact.${contact.type}`);
      }
    }

    const total = verifiedFields.length + unverifiedFields.length;
    const score = total > 0 ? Math.round((verifiedFields.length / total) * 100) : 50;

    return { score, verifiedFields, unverifiedFields };
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(
    party: Party,
    goldenRecord: GoldenRecord | null
  ): DataQualityMetrics['consistency'] {
    const inconsistencies: { field: string; issue: string }[] = [];

    // Check conflicts in golden record
    if (goldenRecord && goldenRecord.unresolvedConflicts.length > 0) {
      for (const conflict of goldenRecord.unresolvedConflicts) {
        inconsistencies.push({
          field: conflict.fieldPath,
          issue: `Conflicting values from ${conflict.values.length} sources`
        });
      }
    }

    const score = Math.max(0, 100 - inconsistencies.length * 15);

    return { score, inconsistencies };
  }

  /**
   * Calculate timeliness score
   */
  private calculateTimelinessScore(
    party: Party,
    goldenRecord: GoldenRecord | null
  ): DataQualityMetrics['timeliness'] {
    const staleFields: string[] = [];
    const now = new Date();
    const staleThreshold = 365 * 24 * 60 * 60 * 1000; // 1 year

    const lastUpdated = goldenRecord?.lastRefreshedAt || party.updatedAt;
    const timeSinceUpdate = now.getTime() - lastUpdated.getTime();

    if (timeSinceUpdate > staleThreshold) {
      staleFields.push('lastUpdate');
    }

    const score = staleFields.length === 0 ? 100 : Math.max(0, 100 - staleFields.length * 20);

    return { score, lastUpdated, staleFields };
  }

  /**
   * Calculate uniqueness score
   */
  private calculateUniquenessScore(party: Party): DataQualityMetrics['uniqueness'] {
    // Placeholder - would integrate with deduplication service
    return {
      score: 100,
      potentialDuplicates: 0
    };
  }
}

// Export singleton instance
export const goldenRecordService = new GoldenRecordService();

// Export store access for other services
export const getGoldenRecordsStore = (): Map<string, GoldenRecord> => goldenRecords;

export default GoldenRecordService;
