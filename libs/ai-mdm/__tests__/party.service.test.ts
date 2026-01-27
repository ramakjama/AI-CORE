/**
 * Party Service Tests
 * Tests for the PartyService class - party/customer master data management
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => `mock-uuid-${Math.random().toString(36).substr(2, 9)}`),
}));

import { PartyService, getPartiesStore, getVersionsStore } from '../src/services/party.service';
import { PartyType, IdentifierType, SourceSystem } from '../src/types';

describe('PartyService', () => {
  let partyService: PartyService;

  const mockIndividualData = {
    type: PartyType.INDIVIDUAL,
    individual: {
      firstName: 'Juan',
      lastName: 'Garcia',
      secondLastName: 'Lopez',
      birthDate: new Date('1985-05-15'),
      gender: 'MALE' as const,
    },
    identifiers: [
      {
        type: IdentifierType.NIF,
        value: '12345678A',
        isPrimary: true,
        isVerified: true,
      },
    ],
    addresses: [
      {
        type: 'HOME' as const,
        streetLine1: 'Calle Mayor 123',
        city: 'Madrid',
        province: 'Madrid',
        postalCode: '28001',
        countryCode: 'ES',
        country: 'Spain',
        isPrimary: true,
      },
    ],
    contacts: [
      {
        type: 'EMAIL' as const,
        value: 'juan.garcia@example.com',
        isPrimary: true,
        isVerified: true,
      },
      {
        type: 'MOBILE' as const,
        value: '+34666123456',
        isPrimary: true,
        isVerified: false,
      },
    ],
    sourceSystem: SourceSystem.CRM,
    tags: ['VIP', 'AUTO'],
  };

  const mockOrganizationData = {
    type: PartyType.ORGANIZATION,
    organization: {
      legalName: 'Acme Corporation S.L.',
      tradeName: 'Acme',
      legalForm: 'S.L.',
      incorporationDate: new Date('2010-01-15'),
    },
    identifiers: [
      {
        type: IdentifierType.CIF,
        value: 'B12345678',
        isPrimary: true,
        isVerified: true,
      },
    ],
    addresses: [
      {
        type: 'BUSINESS' as const,
        streetLine1: 'Avenida Diagonal 456',
        city: 'Barcelona',
        province: 'Barcelona',
        postalCode: '08029',
        countryCode: 'ES',
        country: 'Spain',
        isPrimary: true,
      },
    ],
    contacts: [
      {
        type: 'EMAIL' as const,
        value: 'info@acme.com',
        isPrimary: true,
      },
    ],
    sourceSystem: SourceSystem.CORE_INSURANCE,
  };

  beforeEach(() => {
    // Clear stores before each test
    getPartiesStore().clear();
    getVersionsStore().clear();

    partyService = new PartyService('test-user');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('initialization', () => {
    it('should create a PartyService instance', () => {
      expect(partyService).toBeDefined();
      expect(partyService).toBeInstanceOf(PartyService);
    });

    it('should accept custom user in constructor', () => {
      const customService = new PartyService('custom-user');
      expect(customService).toBeDefined();
    });

    it('should allow setting current user', () => {
      partyService.setCurrentUser('new-user');
      expect(partyService).toBeDefined();
    });
  });

  // ==========================================================================
  // Create Party Tests
  // ==========================================================================

  describe('create', () => {
    it('should create an individual party successfully', async () => {
      const party = await partyService.create(mockIndividualData);

      expect(party).toBeDefined();
      expect(party.id).toBeDefined();
      expect(party.type).toBe(PartyType.INDIVIDUAL);
      expect(party.individual).toBeDefined();
      expect(party.individual?.firstName).toBe('Juan');
      expect(party.version).toBe(1);
    });

    it('should create an organization party successfully', async () => {
      const party = await partyService.create(mockOrganizationData);

      expect(party).toBeDefined();
      expect(party.type).toBe(PartyType.ORGANIZATION);
      expect(party.organization).toBeDefined();
      expect(party.organization?.legalName).toBe('Acme Corporation S.L.');
    });

    it('should generate display name for individual', async () => {
      const party = await partyService.create(mockIndividualData);

      expect(party.displayName).toBe('Juan Garcia Lopez');
    });

    it('should generate display name for organization', async () => {
      const party = await partyService.create(mockOrganizationData);

      expect(party.displayName).toBe('Acme');
    });

    it('should set default values', async () => {
      const party = await partyService.create(mockIndividualData);

      expect(party.isActive).toBe(true);
      expect(party.isDeleted).toBe(false);
      expect(party.version).toBe(1);
      expect(party.createdAt).toBeDefined();
      expect(party.updatedAt).toBeDefined();
    });

    it('should assign IDs to nested entities', async () => {
      const party = await partyService.create(mockIndividualData);

      expect(party.identifiers[0].id).toBeDefined();
      expect(party.addresses[0].id).toBeDefined();
      expect(party.contacts[0].id).toBeDefined();
    });

    it('should calculate data quality score', async () => {
      const party = await partyService.create(mockIndividualData);

      expect(party.dataQualityScore).toBeDefined();
      expect(party.dataQualityScore).toBeGreaterThan(0);
      expect(party.completenessScore).toBeDefined();
    });

    it('should create initial version record', async () => {
      const party = await partyService.create(mockIndividualData);
      const versions = await partyService.getVersionHistory(party.id);

      expect(versions.length).toBe(1);
      expect(versions[0].version).toBe(1);
      expect(versions[0].changeType).toBe('CREATE');
    });

    it('should preserve custom attributes', async () => {
      const party = await partyService.create({
        ...mockIndividualData,
        customAttributes: { customerSegment: 'premium', referralSource: 'web' },
      });

      expect(party.customAttributes).toBeDefined();
      expect(party.customAttributes?.customerSegment).toBe('premium');
    });
  });

  // ==========================================================================
  // Get Party Tests
  // ==========================================================================

  describe('get', () => {
    it('should retrieve party by ID', async () => {
      const created = await partyService.create(mockIndividualData);
      const retrieved = await partyService.get(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for non-existent party', async () => {
      const result = await partyService.get('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getByIdentifier', () => {
    it('should retrieve party by NIF', async () => {
      await partyService.create(mockIndividualData);
      const retrieved = await partyService.getByIdentifier(IdentifierType.NIF, '12345678A');

      expect(retrieved).toBeDefined();
      expect(retrieved?.identifiers[0].value).toBe('12345678A');
    });

    it('should normalize identifier for comparison', async () => {
      await partyService.create(mockIndividualData);
      const retrieved = await partyService.getByIdentifier(IdentifierType.NIF, '12345678a'); // lowercase

      expect(retrieved).toBeDefined();
    });

    it('should return null for non-existent identifier', async () => {
      const result = await partyService.getByIdentifier(IdentifierType.NIF, 'NOTEXISTS');
      expect(result).toBeNull();
    });

    it('should not return deleted parties', async () => {
      const party = await partyService.create(mockIndividualData);
      await partyService.softDelete(party.id);

      const result = await partyService.getByIdentifier(IdentifierType.NIF, '12345678A');
      expect(result).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing party', async () => {
      const party = await partyService.create(mockIndividualData);
      const exists = await partyService.exists(party.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent party', async () => {
      const exists = await partyService.exists('non-existent');
      expect(exists).toBe(false);
    });

    it('should return false for deleted party', async () => {
      const party = await partyService.create(mockIndividualData);
      await partyService.softDelete(party.id);

      const exists = await partyService.exists(party.id);
      expect(exists).toBe(false);
    });
  });

  // ==========================================================================
  // Update Party Tests
  // ==========================================================================

  describe('update', () => {
    it('should update party successfully', async () => {
      const party = await partyService.create(mockIndividualData);

      const updated = await partyService.update(party.id, {
        individual: {
          ...party.individual!,
          firstName: 'Pedro',
        },
      });

      expect(updated.individual?.firstName).toBe('Pedro');
      expect(updated.version).toBe(2);
    });

    it('should throw error for non-existent party', async () => {
      await expect(
        partyService.update('non-existent', { tags: ['NEW'] })
      ).rejects.toThrow('Party not found');
    });

    it('should throw error for deleted party', async () => {
      const party = await partyService.create(mockIndividualData);
      await partyService.softDelete(party.id);

      await expect(
        partyService.update(party.id, { tags: ['NEW'] })
      ).rejects.toThrow('Cannot update deleted party');
    });

    it('should create version record on update', async () => {
      const party = await partyService.create(mockIndividualData);
      await partyService.update(party.id, { tags: ['UPDATED'] });

      const versions = await partyService.getVersionHistory(party.id);
      expect(versions.length).toBe(2);
      expect(versions[1].changeType).toBe('UPDATE');
    });

    it('should track changed fields', async () => {
      const party = await partyService.create(mockIndividualData);
      await partyService.update(party.id, {
        tags: ['NEW_TAG'],
        isActive: false,
      });

      const versions = await partyService.getVersionHistory(party.id);
      expect(versions[1].changedFields).toContain('tags');
      expect(versions[1].changedFields).toContain('isActive');
    });

    it('should not create version if no changes', async () => {
      const party = await partyService.create(mockIndividualData);
      await partyService.update(party.id, {}); // No changes

      const versions = await partyService.getVersionHistory(party.id);
      expect(versions.length).toBe(1);
    });

    it('should recalculate data quality on update', async () => {
      const party = await partyService.create(mockIndividualData);
      const originalScore = party.dataQualityScore;

      // Add more data
      const updated = await partyService.update(party.id, {
        contacts: [
          ...party.contacts,
          { type: 'PHONE' as const, value: '+34911234567', isPrimary: false },
        ],
      });

      expect(updated.dataQualityScore).toBeDefined();
    });
  });

  // ==========================================================================
  // Delete Party Tests
  // ==========================================================================

  describe('softDelete', () => {
    it('should soft delete party successfully', async () => {
      const party = await partyService.create(mockIndividualData);
      const deleted = await partyService.softDelete(party.id);

      expect(deleted.isDeleted).toBe(true);
      expect(deleted.isActive).toBe(false);
      expect(deleted.deletedAt).toBeDefined();
      expect(deleted.deletedBy).toBe('test-user');
    });

    it('should throw error for non-existent party', async () => {
      await expect(
        partyService.softDelete('non-existent')
      ).rejects.toThrow('Party not found');
    });

    it('should throw error for already deleted party', async () => {
      const party = await partyService.create(mockIndividualData);
      await partyService.softDelete(party.id);

      await expect(
        partyService.softDelete(party.id)
      ).rejects.toThrow('Party already deleted');
    });

    it('should create DELETE version record', async () => {
      const party = await partyService.create(mockIndividualData);
      await partyService.softDelete(party.id);

      const versions = await partyService.getVersionHistory(party.id);
      expect(versions[1].changeType).toBe('DELETE');
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete party', async () => {
      const party = await partyService.create(mockIndividualData);
      const result = await partyService.hardDelete(party.id);

      expect(result).toBe(true);
      expect(await partyService.get(party.id)).toBeNull();
    });

    it('should return false for non-existent party', async () => {
      const result = await partyService.hardDelete('non-existent');
      expect(result).toBe(false);
    });

    it('should delete version history as well', async () => {
      const party = await partyService.create(mockIndividualData);
      await partyService.hardDelete(party.id);

      const versions = await partyService.getVersionHistory(party.id);
      expect(versions.length).toBe(0);
    });
  });

  describe('restore', () => {
    it('should restore soft-deleted party', async () => {
      const party = await partyService.create(mockIndividualData);
      await partyService.softDelete(party.id);

      const restored = await partyService.restore(party.id);

      expect(restored.isDeleted).toBe(false);
      expect(restored.isActive).toBe(true);
      expect(restored.deletedAt).toBeUndefined();
    });

    it('should throw error for non-deleted party', async () => {
      const party = await partyService.create(mockIndividualData);

      await expect(
        partyService.restore(party.id)
      ).rejects.toThrow('Party is not deleted');
    });
  });

  // ==========================================================================
  // Search Tests
  // ==========================================================================

  describe('search', () => {
    beforeEach(async () => {
      // Create test data
      await partyService.create(mockIndividualData);
      await partyService.create({
        ...mockIndividualData,
        individual: {
          firstName: 'Maria',
          lastName: 'Lopez',
          birthDate: new Date('1990-03-20'),
        },
        identifiers: [{
          type: IdentifierType.NIF,
          value: '87654321B',
          isPrimary: true,
        }],
        contacts: [{
          type: 'EMAIL' as const,
          value: 'maria.lopez@example.com',
          isPrimary: true,
        }],
        tags: ['STANDARD'],
      });
      await partyService.create(mockOrganizationData);
    });

    it('should search by name', async () => {
      const result = await partyService.search({ name: 'Juan' });

      expect(result.total).toBe(1);
      expect(result.items[0].individual?.firstName).toBe('Juan');
    });

    it('should search by partial name', async () => {
      const result = await partyService.search({ name: 'Lopez' });

      expect(result.total).toBe(2); // Juan Garcia Lopez and Maria Lopez
    });

    it('should search by type', async () => {
      const result = await partyService.search({ type: PartyType.ORGANIZATION });

      expect(result.total).toBe(1);
      expect(result.items[0].type).toBe(PartyType.ORGANIZATION);
    });

    it('should search by email', async () => {
      const result = await partyService.search({ email: 'maria.lopez@example.com' });

      expect(result.total).toBe(1);
    });

    it('should search by identifier type and value', async () => {
      const result = await partyService.search({
        identifierType: IdentifierType.CIF,
        identifierValue: 'B12345678',
      });

      expect(result.total).toBe(1);
      expect(result.items[0].type).toBe(PartyType.ORGANIZATION);
    });

    it('should search by tags', async () => {
      const result = await partyService.search({ tags: ['VIP'] });

      expect(result.total).toBe(1);
      expect(result.items[0].tags).toContain('VIP');
    });

    it('should filter by data quality score', async () => {
      const result = await partyService.search({ minDataQualityScore: 80 });

      result.items.forEach(item => {
        expect(item.dataQualityScore).toBeGreaterThanOrEqual(80);
      });
    });

    it('should not return deleted parties by default', async () => {
      const party = await partyService.create(mockIndividualData);
      await partyService.softDelete(party.id);

      const result = await partyService.search({});

      expect(result.items.find(p => p.id === party.id)).toBeUndefined();
    });

    it('should return deleted parties when requested', async () => {
      const party = await partyService.create(mockIndividualData);
      await partyService.softDelete(party.id);

      const result = await partyService.search({ isDeleted: true });

      expect(result.items.find(p => p.id === party.id)).toBeDefined();
    });

    it('should paginate results', async () => {
      const result = await partyService.search({ page: 1, pageSize: 2 });

      expect(result.items.length).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should sort results', async () => {
      const result = await partyService.search({
        sortBy: 'displayName',
        sortOrder: 'asc',
      });

      // Should be sorted alphabetically
      for (let i = 1; i < result.items.length; i++) {
        expect(result.items[i - 1].displayName <= result.items[i].displayName).toBe(true);
      }
    });

    it('should perform full text search', async () => {
      const result = await partyService.search({ q: 'Garcia' });

      expect(result.total).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Version History Tests
  // ==========================================================================

  describe('getVersionHistory', () => {
    it('should return version history', async () => {
      const party = await partyService.create(mockIndividualData);
      await partyService.update(party.id, { tags: ['UPDATED'] });

      const versions = await partyService.getVersionHistory(party.id);

      expect(versions.length).toBe(2);
      expect(versions[0].version).toBe(1);
      expect(versions[1].version).toBe(2);
    });

    it('should return empty array for non-existent party', async () => {
      const versions = await partyService.getVersionHistory('non-existent');
      expect(versions).toEqual([]);
    });
  });

  describe('restoreVersion', () => {
    it('should restore party to previous version', async () => {
      const party = await partyService.create(mockIndividualData);
      const originalTags = [...party.tags];

      await partyService.update(party.id, { tags: ['CHANGED'] });

      const versions = await partyService.getVersionHistory(party.id);
      const restored = await partyService.restoreVersion(party.id, versions[0].id);

      expect(restored.tags).toEqual(originalTags);
    });

    it('should throw error for non-existent version', async () => {
      const party = await partyService.create(mockIndividualData);

      await expect(
        partyService.restoreVersion(party.id, 'non-existent-version')
      ).rejects.toThrow('Version not found');
    });
  });

  // ==========================================================================
  // Data Quality Tests
  // ==========================================================================

  describe('calculateDataQuality', () => {
    it('should calculate completeness score', async () => {
      const party = await partyService.create(mockIndividualData);
      const metrics = partyService.calculateDataQuality(party);

      expect(metrics.completeness).toBeDefined();
      expect(metrics.completeness.score).toBeGreaterThanOrEqual(0);
      expect(metrics.completeness.score).toBeLessThanOrEqual(100);
    });

    it('should calculate accuracy score', async () => {
      const party = await partyService.create(mockIndividualData);
      const metrics = partyService.calculateDataQuality(party);

      expect(metrics.accuracy).toBeDefined();
      expect(metrics.accuracy.verifiedFields.length).toBeGreaterThan(0);
    });

    it('should calculate consistency score', async () => {
      const party = await partyService.create(mockIndividualData);
      const metrics = partyService.calculateDataQuality(party);

      expect(metrics.consistency).toBeDefined();
      expect(metrics.consistency.score).toBeGreaterThanOrEqual(0);
    });

    it('should calculate timeliness score', async () => {
      const party = await partyService.create(mockIndividualData);
      const metrics = partyService.calculateDataQuality(party);

      expect(metrics.timeliness).toBeDefined();
      expect(metrics.timeliness.lastUpdated).toBeDefined();
    });

    it('should calculate overall weighted score', async () => {
      const party = await partyService.create(mockIndividualData);
      const metrics = partyService.calculateDataQuality(party);

      expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(metrics.overallScore).toBeLessThanOrEqual(100);
    });

    it('should detect consistency issues', async () => {
      const party = await partyService.create({
        ...mockIndividualData,
        individual: {
          ...mockIndividualData.individual,
          birthDate: new Date('2050-01-01'), // Future date
        },
      });

      const metrics = partyService.calculateDataQuality(party);

      expect(metrics.consistency.inconsistencies.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Bulk Operations Tests
  // ==========================================================================

  describe('bulkCreate', () => {
    it('should create multiple parties', async () => {
      const partiesData = [mockIndividualData, mockOrganizationData];
      const created = await partyService.bulkCreate(partiesData);

      expect(created.length).toBe(2);
      expect(created[0].type).toBe(PartyType.INDIVIDUAL);
      expect(created[1].type).toBe(PartyType.ORGANIZATION);
    });
  });

  describe('getAll', () => {
    it('should return all parties', async () => {
      await partyService.create(mockIndividualData);
      await partyService.create(mockOrganizationData);

      const all = await partyService.getAll();

      expect(all.length).toBe(2);
    });

    it('should exclude deleted parties by default', async () => {
      const party = await partyService.create(mockIndividualData);
      await partyService.softDelete(party.id);
      await partyService.create(mockOrganizationData);

      const all = await partyService.getAll();

      expect(all.length).toBe(1);
    });

    it('should include deleted parties when requested', async () => {
      const party = await partyService.create(mockIndividualData);
      await partyService.softDelete(party.id);
      await partyService.create(mockOrganizationData);

      const all = await partyService.getAll({ includeDeleted: true });

      expect(all.length).toBe(2);
    });
  });
});
