/**
 * AI-MDM Party Service
 * Manages Party entities (individuals and organizations) with versioning
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Party,
  PartyType,
  PartyVersion,
  PartyIdentifier,
  PartySearchQuery,
  PartySearchResult,
  IdentifierType,
  SourceSystem,
  CreatePartyInput,
  UpdatePartyInput,
  DataQualityMetrics,
  Address,
  Contact
} from '../types';

// In-memory stores (would be replaced with actual database)
const parties: Map<string, Party> = new Map();
const partyVersions: Map<string, PartyVersion[]> = new Map();

/**
 * Required fields for data quality calculation
 */
const REQUIRED_FIELDS: Record<PartyType, string[]> = {
  [PartyType.INDIVIDUAL]: [
    'individual.firstName',
    'individual.lastName',
    'identifiers',
    'contacts',
    'addresses'
  ],
  [PartyType.ORGANIZATION]: [
    'organization.legalName',
    'identifiers',
    'contacts',
    'addresses'
  ],
  [PartyType.HOUSEHOLD]: [
    'displayName'
  ]
};

/**
 * Party Service class
 */
export class PartyService {
  private currentUser: string;

  constructor(currentUser: string = 'system') {
    this.currentUser = currentUser;
  }

  /**
   * Set the current user for audit purposes
   */
  setCurrentUser(userId: string): void {
    this.currentUser = userId;
  }

  /**
   * Create a new party
   */
  async create(partyData: CreatePartyInput): Promise<Party> {
    const now = new Date();
    const partyId = uuidv4();

    // Build display name
    const displayName = this.buildDisplayName(partyData);

    // Prepare identifiers with IDs
    const identifiers: PartyIdentifier[] = (partyData.identifiers || []).map(id => ({
      ...id,
      id: id.id || uuidv4(),
      partyId,
      createdAt: now,
      updatedAt: now
    }));

    // Prepare addresses with IDs
    const addresses: Address[] = (partyData.addresses || []).map(addr => ({
      ...addr,
      id: addr.id || uuidv4(),
      partyId,
      createdAt: now,
      updatedAt: now
    }));

    // Prepare contacts with IDs
    const contacts: Contact[] = (partyData.contacts || []).map(contact => ({
      ...contact,
      id: contact.id || uuidv4(),
      partyId,
      createdAt: now,
      updatedAt: now
    }));

    // Create party object
    const party: Party = {
      id: partyId,
      type: partyData.type,
      displayName,
      individual: partyData.individual,
      organization: partyData.organization,
      identifiers,
      addresses,
      contacts,
      goldenRecordId: partyData.goldenRecordId,
      isGoldenRecord: partyData.isGoldenRecord || false,
      sourceSystem: partyData.sourceSystem,
      externalId: partyData.externalId,
      tags: partyData.tags || [],
      customAttributes: partyData.customAttributes || {},
      isActive: partyData.isActive !== undefined ? partyData.isActive : true,
      isDeleted: false,
      version: 1,
      createdAt: now,
      createdBy: partyData.createdBy || this.currentUser,
      updatedAt: now,
      updatedBy: this.currentUser
    };

    // Calculate data quality score
    const qualityMetrics = this.calculateDataQuality(party);
    party.dataQualityScore = qualityMetrics.overallScore;
    party.completenessScore = qualityMetrics.completeness.score;

    // Store party
    parties.set(partyId, party);

    // Create initial version
    await this.createVersion(party, 'CREATE');

    return party;
  }

  /**
   * Update an existing party
   */
  async update(partyId: string, changes: Partial<Party>): Promise<Party> {
    const existingParty = await this.get(partyId);
    if (!existingParty) {
      throw new Error(`Party not found: ${partyId}`);
    }

    if (existingParty.isDeleted) {
      throw new Error(`Cannot update deleted party: ${partyId}`);
    }

    const now = new Date();
    const previousValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};
    const changedFields: string[] = [];

    // Track changes (excluding system fields)
    const systemFields = ['id', 'createdAt', 'createdBy', 'version', 'updatedAt', 'updatedBy'];
    for (const [key, value] of Object.entries(changes)) {
      if (!systemFields.includes(key)) {
        const existingValue = (existingParty as unknown as Record<string, unknown>)[key];
        if (JSON.stringify(existingValue) !== JSON.stringify(value)) {
          previousValues[key] = existingValue;
          newValues[key] = value;
          changedFields.push(key);
        }
      }
    }

    if (changedFields.length === 0) {
      return existingParty; // No changes
    }

    // Build updated party
    const updatedParty: Party = {
      ...existingParty,
      ...changes,
      id: partyId, // Preserve ID
      version: existingParty.version + 1,
      updatedAt: now,
      updatedBy: this.currentUser,
      createdAt: existingParty.createdAt,
      createdBy: existingParty.createdBy
    };

    // Rebuild display name if relevant fields changed
    if (changedFields.includes('individual') || changedFields.includes('organization')) {
      updatedParty.displayName = this.buildDisplayName(updatedParty);
    }

    // Recalculate data quality
    const qualityMetrics = this.calculateDataQuality(updatedParty);
    updatedParty.dataQualityScore = qualityMetrics.overallScore;
    updatedParty.completenessScore = qualityMetrics.completeness.score;

    // Store updated party
    parties.set(partyId, updatedParty);

    // Create version record
    await this.createVersion(updatedParty, 'UPDATE', changedFields, previousValues, newValues);

    return updatedParty;
  }

  /**
   * Get a party by ID
   */
  async get(partyId: string): Promise<Party | null> {
    return parties.get(partyId) || null;
  }

  /**
   * Get a party by identifier (NIF, NIE, CIF, etc.)
   */
  async getByIdentifier(type: IdentifierType, value: string): Promise<Party | null> {
    const normalizedValue = this.normalizeIdentifier(type, value);

    for (const party of parties.values()) {
      if (party.isDeleted) continue;

      const identifier = party.identifiers.find(
        id => id.type === type && this.normalizeIdentifier(type, id.value) === normalizedValue
      );

      if (identifier) {
        return party;
      }
    }

    return null;
  }

  /**
   * Search parties with advanced filters
   */
  async search(query: PartySearchQuery): Promise<PartySearchResult> {
    const {
      q,
      type,
      identifierType,
      identifierValue,
      name,
      email,
      phone,
      postalCode,
      city,
      country,
      tags,
      minDataQualityScore,
      isActive = true,
      isDeleted = false,
      page = 1,
      pageSize = 20,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = query;

    let results: Party[] = [];

    // Filter parties
    for (const party of parties.values()) {
      // Basic status filters
      if (party.isDeleted !== isDeleted) continue;
      if (isActive !== undefined && party.isActive !== isActive) continue;
      if (type && party.type !== type) continue;

      // Identifier filter
      if (identifierType || identifierValue) {
        const hasMatchingIdentifier = party.identifiers.some(id => {
          if (identifierType && id.type !== identifierType) return false;
          if (identifierValue && !id.value.toLowerCase().includes(identifierValue.toLowerCase())) return false;
          return true;
        });
        if (!hasMatchingIdentifier) continue;
      }

      // Name filter (searches displayName and component names)
      if (name) {
        const nameLower = name.toLowerCase();
        const matchesName = party.displayName.toLowerCase().includes(nameLower) ||
          party.individual?.firstName?.toLowerCase().includes(nameLower) ||
          party.individual?.lastName?.toLowerCase().includes(nameLower) ||
          party.individual?.secondLastName?.toLowerCase().includes(nameLower) ||
          party.organization?.legalName?.toLowerCase().includes(nameLower) ||
          party.organization?.tradeName?.toLowerCase().includes(nameLower);
        if (!matchesName) continue;
      }

      // Email filter
      if (email) {
        const hasMatchingEmail = party.contacts.some(
          c => c.type === 'EMAIL' && c.value.toLowerCase().includes(email.toLowerCase())
        );
        if (!hasMatchingEmail) continue;
      }

      // Phone filter (normalizes both sides)
      if (phone) {
        const normalizedPhone = this.normalizePhone(phone);
        const hasMatchingPhone = party.contacts.some(
          c => ['PHONE', 'MOBILE'].includes(c.type) &&
            this.normalizePhone(c.value).includes(normalizedPhone)
        );
        if (!hasMatchingPhone) continue;
      }

      // Address filters
      if (postalCode || city || country) {
        const hasMatchingAddress = party.addresses.some(addr => {
          if (postalCode && !addr.postalCode.includes(postalCode)) return false;
          if (city && !addr.city.toLowerCase().includes(city.toLowerCase())) return false;
          if (country && addr.countryCode !== country.toUpperCase() &&
              !addr.country.toLowerCase().includes(country.toLowerCase())) return false;
          return true;
        });
        if (!hasMatchingAddress) continue;
      }

      // Tags filter (all tags must be present)
      if (tags && tags.length > 0) {
        const hasTags = tags.every(tag => party.tags.includes(tag));
        if (!hasTags) continue;
      }

      // Data quality filter
      if (minDataQualityScore !== undefined && (party.dataQualityScore || 0) < minDataQualityScore) {
        continue;
      }

      // Full text search across multiple fields
      if (q) {
        const qLower = q.toLowerCase();
        const matchesQuery =
          party.displayName.toLowerCase().includes(qLower) ||
          party.individual?.firstName?.toLowerCase().includes(qLower) ||
          party.individual?.lastName?.toLowerCase().includes(qLower) ||
          party.individual?.secondLastName?.toLowerCase().includes(qLower) ||
          party.organization?.legalName?.toLowerCase().includes(qLower) ||
          party.organization?.tradeName?.toLowerCase().includes(qLower) ||
          party.identifiers.some(id => id.value.toLowerCase().includes(qLower)) ||
          party.contacts.some(c => c.value.toLowerCase().includes(qLower)) ||
          party.addresses.some(a =>
            a.streetLine1.toLowerCase().includes(qLower) ||
            a.city.toLowerCase().includes(qLower)
          );
        if (!matchesQuery) continue;
      }

      results.push(party);
    }

    // Sort results
    results.sort((a, b) => {
      const aValue = (a as unknown as Record<string, unknown>)[sortBy];
      const bValue = (b as unknown as Record<string, unknown>)[sortBy];

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === undefined) return sortOrder === 'asc' ? 1 : -1;

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    // Paginate results
    const total = results.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const items = results.slice(startIndex, startIndex + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  /**
   * Get version history for a party
   */
  async getVersionHistory(partyId: string): Promise<PartyVersion[]> {
    return partyVersions.get(partyId) || [];
  }

  /**
   * Restore a party to a specific version
   */
  async restoreVersion(partyId: string, versionId: string): Promise<Party> {
    const versions = await this.getVersionHistory(partyId);
    const targetVersion = versions.find(v => v.id === versionId);

    if (!targetVersion) {
      throw new Error(`Version not found: ${versionId}`);
    }

    const party = await this.get(partyId);
    if (!party) {
      throw new Error(`Party not found: ${partyId}`);
    }

    // Restore party data from version snapshot
    const restoredData = { ...targetVersion.data };

    // Remove system fields that shouldn't be restored
    delete restoredData.id;
    delete restoredData.createdAt;
    delete restoredData.createdBy;
    delete restoredData.version;

    const updatedParty = await this.update(partyId, restoredData);

    return updatedParty;
  }

  /**
   * Soft delete a party (mark as deleted, preserves data)
   */
  async softDelete(partyId: string): Promise<Party> {
    const party = await this.get(partyId);
    if (!party) {
      throw new Error(`Party not found: ${partyId}`);
    }

    if (party.isDeleted) {
      throw new Error(`Party already deleted: ${partyId}`);
    }

    const now = new Date();
    const deletedParty: Party = {
      ...party,
      isDeleted: true,
      isActive: false,
      deletedAt: now,
      deletedBy: this.currentUser,
      version: party.version + 1,
      updatedAt: now,
      updatedBy: this.currentUser
    };

    parties.set(partyId, deletedParty);

    // Create version record
    await this.createVersion(deletedParty, 'DELETE');

    return deletedParty;
  }

  /**
   * Hard delete a party (permanent removal from store)
   */
  async hardDelete(partyId: string): Promise<boolean> {
    const party = await this.get(partyId);
    if (!party) {
      return false;
    }

    // Remove party and all version history
    parties.delete(partyId);
    partyVersions.delete(partyId);

    return true;
  }

  /**
   * Restore a soft-deleted party
   */
  async restore(partyId: string): Promise<Party> {
    const party = await this.get(partyId);
    if (!party) {
      throw new Error(`Party not found: ${partyId}`);
    }

    if (!party.isDeleted) {
      throw new Error(`Party is not deleted: ${partyId}`);
    }

    const now = new Date();
    const restoredParty: Party = {
      ...party,
      isDeleted: false,
      isActive: true,
      deletedAt: undefined,
      deletedBy: undefined,
      version: party.version + 1,
      updatedAt: now,
      updatedBy: this.currentUser
    };

    parties.set(partyId, restoredParty);

    return restoredParty;
  }

  /**
   * Calculate data quality metrics for a party
   */
  calculateDataQuality(party: Party): DataQualityMetrics {
    const completeness = this.calculateCompletenessMetrics(party);
    const accuracy = this.calculateAccuracyMetrics(party);
    const consistency = this.calculateConsistencyMetrics(party);
    const timeliness = this.calculateTimelinessMetrics(party);
    const uniqueness = this.calculateUniquenessMetrics(party);

    // Weighted overall score
    const weights = {
      completeness: 0.25,
      accuracy: 0.25,
      consistency: 0.20,
      timeliness: 0.15,
      uniqueness: 0.15
    };

    const overallScore = Math.round(
      completeness.score * weights.completeness +
      accuracy.score * weights.accuracy +
      consistency.score * weights.consistency +
      timeliness.score * weights.timeliness +
      uniqueness.score * weights.uniqueness
    );

    return {
      partyId: party.id,
      overallScore,
      completeness,
      accuracy,
      consistency,
      timeliness,
      uniqueness
    };
  }

  /**
   * Get all parties (for batch operations)
   */
  async getAll(options?: { includeDeleted?: boolean }): Promise<Party[]> {
    const allParties: Party[] = [];
    for (const party of parties.values()) {
      if (!options?.includeDeleted && party.isDeleted) continue;
      allParties.push(party);
    }
    return allParties;
  }

  /**
   * Bulk create parties
   */
  async bulkCreate(partiesData: CreatePartyInput[]): Promise<Party[]> {
    const created: Party[] = [];
    for (const data of partiesData) {
      const party = await this.create(data);
      created.push(party);
    }
    return created;
  }

  /**
   * Check if a party exists
   */
  async exists(partyId: string): Promise<boolean> {
    const party = parties.get(partyId);
    return party !== undefined && !party.isDeleted;
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  /**
   * Build display name from party data
   */
  private buildDisplayName(party: Partial<Party>): string {
    if (party.type === PartyType.INDIVIDUAL && party.individual) {
      const parts = [
        party.individual.firstName,
        party.individual.middleName,
        party.individual.lastName,
        party.individual.secondLastName
      ].filter(Boolean);
      return parts.join(' ') || party.displayName || 'Unknown';
    }

    if (party.type === PartyType.ORGANIZATION && party.organization) {
      return party.organization.tradeName || party.organization.legalName || party.displayName || 'Unknown';
    }

    return party.displayName || 'Unknown';
  }

  /**
   * Create a version record for audit trail
   */
  private async createVersion(
    party: Party,
    changeType: PartyVersion['changeType'],
    changedFields: string[] = [],
    previousValues: Record<string, unknown> = {},
    newValues: Record<string, unknown> = {}
  ): Promise<PartyVersion> {
    const version: PartyVersion = {
      id: uuidv4(),
      partyId: party.id,
      version: party.version,
      data: JSON.parse(JSON.stringify(party)), // Deep clone
      changeType,
      changedFields,
      previousValues,
      newValues,
      createdAt: new Date(),
      createdBy: this.currentUser,
      sourceSystem: party.sourceSystem
    };

    const versions = partyVersions.get(party.id) || [];
    versions.push(version);
    partyVersions.set(party.id, versions);

    return version;
  }

  /**
   * Normalize identifier value for comparison
   */
  private normalizeIdentifier(type: IdentifierType, value: string): string {
    // Remove spaces, dashes, and convert to uppercase
    let normalized = value.replace(/[\s\-\.]/g, '').toUpperCase();

    // Type-specific normalization
    switch (type) {
      case IdentifierType.NIF:
      case IdentifierType.CIF:
        // Spanish NIF/CIF: Ensure 8 digits + letter format
        normalized = normalized.replace(/^([A-Z]?)0+(\d+)([A-Z]?)$/, '$1$2$3');
        break;
      case IdentifierType.NIE:
        // Spanish NIE: X/Y/Z + 7 digits + letter
        normalized = normalized.replace(/^([XYZ])0+(\d+)([A-Z])$/, '$1$2$3');
        break;
      case IdentifierType.PASSPORT:
        // Passports vary by country, just normalize spacing
        break;
    }

    return normalized;
  }

  /**
   * Normalize phone number for comparison
   */
  private normalizePhone(phone: string): string {
    // Remove all non-digit characters except leading +
    const hasPlus = phone.startsWith('+');
    const digits = phone.replace(/\D/g, '');
    return hasPlus ? '+' + digits : digits;
  }

  /**
   * Calculate completeness metrics
   */
  private calculateCompletenessMetrics(party: Party): DataQualityMetrics['completeness'] {
    const requiredFields = REQUIRED_FIELDS[party.type] || [];
    const missingFields: string[] = [];
    let filledCount = 0;

    for (const field of requiredFields) {
      const value = this.getNestedValue(party as unknown as Record<string, unknown>, field);
      const isFilled = value !== undefined && value !== null && value !== '' &&
        (!Array.isArray(value) || value.length > 0);

      if (isFilled) {
        filledCount++;
      } else {
        missingFields.push(field);
      }
    }

    const score = requiredFields.length > 0
      ? Math.round((filledCount / requiredFields.length) * 100)
      : 100;

    return {
      score,
      missingFields,
      requiredFieldsFilled: filledCount,
      totalRequiredFields: requiredFields.length
    };
  }

  /**
   * Calculate accuracy metrics (verification status)
   */
  private calculateAccuracyMetrics(party: Party): DataQualityMetrics['accuracy'] {
    const verifiedFields: string[] = [];
    const unverifiedFields: string[] = [];

    // Check identifiers verification
    for (const id of party.identifiers) {
      const fieldName = `identifier.${id.type}.${id.id}`;
      if (id.isVerified) {
        verifiedFields.push(fieldName);
      } else {
        unverifiedFields.push(fieldName);
      }
    }

    // Check addresses verification
    for (const addr of party.addresses) {
      const fieldName = `address.${addr.type}.${addr.id}`;
      if (addr.isVerified) {
        verifiedFields.push(fieldName);
      } else {
        unverifiedFields.push(fieldName);
      }
    }

    // Check contacts verification
    for (const contact of party.contacts) {
      const fieldName = `contact.${contact.type}.${contact.id}`;
      if (contact.isVerified) {
        verifiedFields.push(fieldName);
      } else {
        unverifiedFields.push(fieldName);
      }
    }

    const totalFields = verifiedFields.length + unverifiedFields.length;
    const score = totalFields > 0
      ? Math.round((verifiedFields.length / totalFields) * 100)
      : 50; // Default score if no verifiable fields

    return {
      score,
      verifiedFields,
      unverifiedFields
    };
  }

  /**
   * Calculate consistency metrics (data integrity)
   */
  private calculateConsistencyMetrics(party: Party): DataQualityMetrics['consistency'] {
    const inconsistencies: { field: string; issue: string }[] = [];

    // Check for multiple primary identifiers
    const primaryIdentifiers = party.identifiers.filter(id => id.isPrimary);
    if (primaryIdentifiers.length > 1) {
      inconsistencies.push({
        field: 'identifiers',
        issue: 'Multiple primary identifiers defined'
      });
    }
    if (primaryIdentifiers.length === 0 && party.identifiers.length > 0) {
      inconsistencies.push({
        field: 'identifiers',
        issue: 'No primary identifier defined'
      });
    }

    // Check for multiple primary addresses
    const primaryAddresses = party.addresses.filter(addr => addr.isPrimary);
    if (primaryAddresses.length > 1) {
      inconsistencies.push({
        field: 'addresses',
        issue: 'Multiple primary addresses defined'
      });
    }

    // Check for multiple primary contacts per type
    const contactTypes = [...new Set(party.contacts.map(c => c.type))];
    for (const type of contactTypes) {
      const primaryOfType = party.contacts.filter(c => c.type === type && c.isPrimary);
      if (primaryOfType.length > 1) {
        inconsistencies.push({
          field: `contacts.${type}`,
          issue: `Multiple primary ${type} contacts defined`
        });
      }
    }

    // Check individual-specific consistency
    if (party.type === PartyType.INDIVIDUAL && party.individual) {
      const { birthDate, deathDate } = party.individual;

      if (birthDate && deathDate && deathDate < birthDate) {
        inconsistencies.push({
          field: 'individual.deathDate',
          issue: 'Death date is before birth date'
        });
      }

      // Check age consistency
      if (birthDate) {
        const age = this.calculateAge(birthDate);
        if (age < 0) {
          inconsistencies.push({
            field: 'individual.birthDate',
            issue: 'Birth date is in the future'
          });
        }
        if (age > 150) {
          inconsistencies.push({
            field: 'individual.birthDate',
            issue: 'Age exceeds reasonable maximum (150 years)'
          });
        }
      }
    }

    // Check organization-specific consistency
    if (party.type === PartyType.ORGANIZATION && party.organization) {
      const { incorporationDate, dissolutionDate } = party.organization;

      if (incorporationDate && dissolutionDate && dissolutionDate < incorporationDate) {
        inconsistencies.push({
          field: 'organization.dissolutionDate',
          issue: 'Dissolution date is before incorporation date'
        });
      }
    }

    // Calculate score (100 if no inconsistencies, minus 15 for each)
    const score = Math.max(0, 100 - inconsistencies.length * 15);

    return {
      score,
      inconsistencies
    };
  }

  /**
   * Calculate timeliness metrics (data freshness)
   */
  private calculateTimelinessMetrics(party: Party): DataQualityMetrics['timeliness'] {
    const staleFields: string[] = [];
    const now = new Date();
    const staleThresholdMs = 365 * 24 * 60 * 60 * 1000; // 1 year

    // Check last update age
    const timeSinceUpdate = now.getTime() - party.updatedAt.getTime();
    if (timeSinceUpdate > staleThresholdMs) {
      staleFields.push('party.updatedAt');
    }

    // Check for expired identifiers
    for (const id of party.identifiers) {
      if (id.expiryDate && id.expiryDate < now) {
        staleFields.push(`identifier.${id.type}.expired`);
      }
    }

    // Check for outdated addresses (using validTo)
    for (const addr of party.addresses) {
      if (addr.validTo && addr.validTo < now) {
        staleFields.push(`address.${addr.type}.expired`);
      }
    }

    // Check for outdated contacts
    for (const contact of party.contacts) {
      if (contact.validTo && contact.validTo < now) {
        staleFields.push(`contact.${contact.type}.expired`);
      }
    }

    // Calculate score
    const score = staleFields.length === 0 ? 100 : Math.max(0, 100 - staleFields.length * 20);

    return {
      score,
      lastUpdated: party.updatedAt,
      staleFields
    };
  }

  /**
   * Calculate uniqueness metrics (duplicate likelihood)
   */
  private calculateUniquenessMetrics(party: Party): DataQualityMetrics['uniqueness'] {
    // This is a placeholder - actual implementation would check for duplicates
    // using the DeduplicationService
    return {
      score: 100,
      potentialDuplicates: 0
    };
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      return (current as Record<string, unknown>)[key];
    }, obj as unknown);
  }

  /**
   * Calculate age from birth date
   */
  private calculateAge(birthDate: Date): number {
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}

// Export singleton instance
export const partyService = new PartyService();

// Export store access for other services (internal use)
export const getPartiesStore = (): Map<string, Party> => parties;
export const getVersionsStore = (): Map<string, PartyVersion[]> => partyVersions;

export default PartyService;
