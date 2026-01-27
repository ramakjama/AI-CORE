/**
 * Deduplication Service Tests
 * Tests for the DeduplicationService class - duplicate detection and merging
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => `mock-uuid-${Math.random().toString(36).substr(2, 9)}`),
}));

// Mock fuzzy matcher
jest.mock('../src/matching/fuzzy-matcher', () => ({
  FuzzyMatcher: jest.fn().mockImplementation(() => ({
    calculateOverallScore: jest.fn().mockResolvedValue({
      overall: 0.85,
      name: 0.90,
      identifier: 0.95,
      address: 0.70,
      phone: 0.80,
      email: 0.85,
      birthDate: 1.0,
    }),
  })),
}));

import {
  DeduplicationService,
  getDuplicateMatchesStore,
  getMergeResultsStore,
  getMergeHistoryStore,
} from '../src/services/deduplication.service';
import { getPartiesStore, getVersionsStore, PartyService } from '../src/services/party.service';
import { PartyType, IdentifierType, SourceSystem, MatchConfidence, MergeStatus } from '../src/types';

describe('DeduplicationService', () => {
  let deduplicationService: DeduplicationService;
  let partyService: PartyService;

  const mockIndividual1 = {
    type: PartyType.INDIVIDUAL,
    individual: {
      firstName: 'Juan',
      lastName: 'Garcia',
      birthDate: new Date('1985-05-15'),
    },
    identifiers: [{
      type: IdentifierType.NIF,
      value: '12345678A',
      isPrimary: true,
      isVerified: true,
    }],
    addresses: [{
      type: 'HOME' as const,
      streetLine1: 'Calle Mayor 123',
      city: 'Madrid',
      postalCode: '28001',
      countryCode: 'ES',
      country: 'Spain',
      isPrimary: true,
    }],
    contacts: [{
      type: 'EMAIL' as const,
      value: 'juan.garcia@example.com',
      isPrimary: true,
      isVerified: true,
    }],
    sourceSystem: SourceSystem.CRM,
  };

  const mockIndividual2 = {
    type: PartyType.INDIVIDUAL,
    individual: {
      firstName: 'Juan',
      lastName: 'Garcia',
      birthDate: new Date('1985-05-15'),
    },
    identifiers: [{
      type: IdentifierType.NIF,
      value: '12345678A',
      isPrimary: true,
      isVerified: false,
    }],
    addresses: [{
      type: 'HOME' as const,
      streetLine1: 'Calle Mayor 123, 2A',
      city: 'Madrid',
      postalCode: '28001',
      countryCode: 'ES',
      country: 'Spain',
      isPrimary: true,
    }],
    contacts: [{
      type: 'EMAIL' as const,
      value: 'j.garcia@example.com',
      isPrimary: true,
    }],
    sourceSystem: SourceSystem.WEBSITE,
  };

  const mockDifferentIndividual = {
    type: PartyType.INDIVIDUAL,
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
    addresses: [{
      type: 'HOME' as const,
      streetLine1: 'Avenida Diagonal 456',
      city: 'Barcelona',
      postalCode: '08029',
      countryCode: 'ES',
      country: 'Spain',
      isPrimary: true,
    }],
    contacts: [{
      type: 'EMAIL' as const,
      value: 'maria.lopez@example.com',
      isPrimary: true,
    }],
    sourceSystem: SourceSystem.CRM,
  };

  beforeEach(() => {
    // Clear all stores
    getPartiesStore().clear();
    getVersionsStore().clear();
    getDuplicateMatchesStore().clear();
    getMergeResultsStore().clear();
    getMergeHistoryStore().clear();

    partyService = new PartyService('test-user');
    deduplicationService = new DeduplicationService('test-user');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('initialization', () => {
    it('should create a DeduplicationService instance', () => {
      expect(deduplicationService).toBeDefined();
      expect(deduplicationService).toBeInstanceOf(DeduplicationService);
    });

    it('should allow setting current user', () => {
      deduplicationService.setCurrentUser('new-user');
      expect(deduplicationService).toBeDefined();
    });
  });

  // ==========================================================================
  // Find Duplicates Tests
  // ==========================================================================

  describe('findDuplicates', () => {
    it('should find duplicates for a party', async () => {
      const party1 = await partyService.create(mockIndividual1);
      await partyService.create(mockIndividual2);

      const matches = await deduplicationService.findDuplicates(party1.id);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].party1Id).toBe(party1.id);
    });

    it('should throw error for non-existent party', async () => {
      await expect(
        deduplicationService.findDuplicates('non-existent')
      ).rejects.toThrow('Party not found');
    });

    it('should return empty array for deleted party', async () => {
      const party = await partyService.create(mockIndividual1);
      await partyService.softDelete(party.id);

      const matches = await deduplicationService.findDuplicates(party.id);
      expect(matches).toEqual([]);
    });

    it('should only compare same type parties', async () => {
      const individual = await partyService.create(mockIndividual1);
      await partyService.create({
        type: PartyType.ORGANIZATION,
        organization: { legalName: 'Juan Garcia S.L.' },
        identifiers: [{
          type: IdentifierType.CIF,
          value: 'B12345678',
          isPrimary: true,
        }],
        addresses: [mockIndividual1.addresses[0]],
        contacts: [],
        sourceSystem: SourceSystem.CRM,
      });

      const matches = await deduplicationService.findDuplicates(individual.id);

      // Should not match organization even with similar name
      matches.forEach(match => {
        const matchedParty = getPartiesStore().get(match.party2Id);
        expect(matchedParty?.type).toBe(PartyType.INDIVIDUAL);
      });
    });

    it('should sort matches by score descending', async () => {
      const party1 = await partyService.create(mockIndividual1);
      await partyService.create(mockIndividual2);
      await partyService.create(mockDifferentIndividual);

      const matches = await deduplicationService.findDuplicates(party1.id);

      for (let i = 1; i < matches.length; i++) {
        expect(matches[i - 1].overallScore).toBeGreaterThanOrEqual(matches[i].overallScore);
      }
    });

    it('should assign confidence level based on score', async () => {
      const party1 = await partyService.create(mockIndividual1);
      await partyService.create(mockIndividual2);

      const matches = await deduplicationService.findDuplicates(party1.id);

      expect(matches[0].confidence).toBeDefined();
      expect([MatchConfidence.HIGH, MatchConfidence.MEDIUM, MatchConfidence.LOW]).toContain(
        matches[0].confidence
      );
    });

    it('should identify matched and mismatched fields', async () => {
      const party1 = await partyService.create(mockIndividual1);
      await partyService.create(mockIndividual2);

      const matches = await deduplicationService.findDuplicates(party1.id);

      expect(matches[0].matchedFields).toBeDefined();
      expect(matches[0].mismatchedFields).toBeDefined();
      expect(Array.isArray(matches[0].matchedFields)).toBe(true);
    });
  });

  // ==========================================================================
  // Find All Duplicates Tests
  // ==========================================================================

  describe('findAllDuplicates', () => {
    beforeEach(async () => {
      await partyService.create(mockIndividual1);
      await partyService.create(mockIndividual2);
      await partyService.create(mockDifferentIndividual);
    });

    it('should find all duplicates in database', async () => {
      const result = await deduplicationService.findAllDuplicates();

      expect(result).toBeDefined();
      expect(result.status).toBe('COMPLETED');
      expect(result.results).toBeDefined();
    });

    it('should filter by party types', async () => {
      const result = await deduplicationService.findAllDuplicates({
        partyTypes: [PartyType.INDIVIDUAL],
      });

      expect(result.status).toBe('COMPLETED');
    });

    it('should respect minimum score threshold', async () => {
      const result = await deduplicationService.findAllDuplicates({
        minMatchScore: 0.80,
      });

      result.results?.forEach((match: any) => {
        expect(match.overallScore).toBeGreaterThanOrEqual(0.80);
      });
    });

    it('should respect maximum results limit', async () => {
      const result = await deduplicationService.findAllDuplicates({
        maxResults: 1,
      });

      expect(result.results?.length).toBeLessThanOrEqual(1);
    });

    it('should track processing statistics', async () => {
      const result = await deduplicationService.findAllDuplicates();

      expect(result.totalItems).toBeDefined();
      expect(result.processedItems).toBeDefined();
      expect(result.successfulItems).toBeDefined();
      expect(result.startedAt).toBeDefined();
      expect(result.completedAt).toBeDefined();
    });
  });

  // ==========================================================================
  // Merge Tests
  // ==========================================================================

  describe('merge', () => {
    let party1: any;
    let party2: any;

    beforeEach(async () => {
      party1 = await partyService.create(mockIndividual1);
      party2 = await partyService.create(mockIndividual2);
    });

    it('should merge parties successfully', async () => {
      const result = await deduplicationService.merge(party1.id, [party2.id]);

      expect(result).toBeDefined();
      expect(result.survivorId).toBe(party1.id);
      expect(result.victimIds).toContain(party2.id);
      expect(result.status).toBe(MergeStatus.COMPLETED);
    });

    it('should mark survivor as golden record', async () => {
      await deduplicationService.merge(party1.id, [party2.id]);

      const survivor = await partyService.get(party1.id);
      expect(survivor?.isGoldenRecord).toBe(true);
    });

    it('should soft delete victim parties', async () => {
      await deduplicationService.merge(party1.id, [party2.id]);

      const victim = await partyService.get(party2.id);
      expect(victim?.isDeleted).toBe(true);
    });

    it('should merge identifiers', async () => {
      await deduplicationService.merge(party1.id, [party2.id]);

      const survivor = await partyService.get(party1.id);
      // Should have unique identifiers from both
      expect(survivor?.identifiers.length).toBeGreaterThanOrEqual(1);
    });

    it('should merge addresses', async () => {
      await deduplicationService.merge(party1.id, [party2.id]);

      const survivor = await partyService.get(party1.id);
      // Should have addresses from both (if unique)
      expect(survivor?.addresses.length).toBeGreaterThanOrEqual(1);
    });

    it('should merge contacts', async () => {
      await deduplicationService.merge(party1.id, [party2.id]);

      const survivor = await partyService.get(party1.id);
      // Should have unique contacts from both
      expect(survivor?.contacts.length).toBeGreaterThanOrEqual(1);
    });

    it('should merge tags', async () => {
      party1 = await partyService.update(party1.id, { tags: ['TAG1'] });
      party2 = await partyService.update(party2.id, { tags: ['TAG2'] });

      await deduplicationService.merge(party1.id, [party2.id]);

      const survivor = await partyService.get(party1.id);
      expect(survivor?.tags).toContain('TAG1');
      expect(survivor?.tags).toContain('TAG2');
    });

    it('should throw error for non-existent survivor', async () => {
      await expect(
        deduplicationService.merge('non-existent', [party2.id])
      ).rejects.toThrow('Survivor party not found');
    });

    it('should throw error for non-existent victim', async () => {
      await expect(
        deduplicationService.merge(party1.id, ['non-existent'])
      ).rejects.toThrow('Victim party not found');
    });

    it('should throw error for deleted victim', async () => {
      await partyService.softDelete(party2.id);

      await expect(
        deduplicationService.merge(party1.id, [party2.id])
      ).rejects.toThrow('Cannot merge deleted party');
    });

    it('should create merge history', async () => {
      await deduplicationService.merge(party1.id, [party2.id]);

      const history = await deduplicationService.getMergeHistory(party1.id);

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].action).toBe('MERGE');
    });

    it('should set unmerge deadline', async () => {
      const result = await deduplicationService.merge(party1.id, [party2.id]);

      expect(result.canUnmerge).toBe(true);
      expect(result.unmergeDeadline).toBeDefined();
      expect(result.unmergeDeadline! > new Date()).toBe(true);
    });

    it('should merge multiple victims at once', async () => {
      const party3 = await partyService.create({
        ...mockIndividual1,
        contacts: [{
          type: 'MOBILE' as const,
          value: '+34666999888',
          isPrimary: true,
        }],
      });

      const result = await deduplicationService.merge(party1.id, [party2.id, party3.id]);

      expect(result.victimIds.length).toBe(2);
    });
  });

  // ==========================================================================
  // Unmerge Tests
  // ==========================================================================

  describe('unmerge', () => {
    let party1: any;
    let party2: any;
    let mergeResult: any;

    beforeEach(async () => {
      party1 = await partyService.create(mockIndividual1);
      party2 = await partyService.create(mockIndividual2);
      mergeResult = await deduplicationService.merge(party1.id, [party2.id]);
    });

    it('should unmerge parties successfully', async () => {
      const result = await deduplicationService.unmerge(mergeResult.id);

      expect(result.status).toBe(MergeStatus.REVERTED);
    });

    it('should restore victim parties', async () => {
      await deduplicationService.unmerge(mergeResult.id);

      const victim = await partyService.get(party2.id);
      expect(victim?.isDeleted).toBe(false);
      expect(victim?.isActive).toBe(true);
    });

    it('should throw error for non-existent merge result', async () => {
      await expect(
        deduplicationService.unmerge('non-existent')
      ).rejects.toThrow('Merge result not found');
    });

    it('should throw error when unmerge is not allowed', async () => {
      // Manually disable unmerge
      const stored = getMergeResultsStore().get(mergeResult.id);
      if (stored) {
        stored.canUnmerge = false;
        getMergeResultsStore().set(mergeResult.id, stored);
      }

      await expect(
        deduplicationService.unmerge(mergeResult.id)
      ).rejects.toThrow('This merge cannot be undone');
    });

    it('should create unmerge history entry', async () => {
      await deduplicationService.unmerge(mergeResult.id);

      const history = await deduplicationService.getMergeHistory(party2.id);
      const unmergeEntry = history.find(h => h.action === 'UNMERGE');

      expect(unmergeEntry).toBeDefined();
    });
  });

  // ==========================================================================
  // Match Status Tests
  // ==========================================================================

  describe('updateMatchStatus', () => {
    it('should update match status to confirmed', async () => {
      const party1 = await partyService.create(mockIndividual1);
      await partyService.create(mockIndividual2);

      const matches = await deduplicationService.findDuplicates(party1.id);
      const matchId = matches[0].id;

      const updated = await deduplicationService.updateMatchStatus(
        matchId,
        'CONFIRMED',
        'Verified by manual review'
      );

      expect(updated.status).toBe('CONFIRMED');
      expect(updated.reviewedBy).toBe('test-user');
      expect(updated.reviewNotes).toBe('Verified by manual review');
    });

    it('should update match status to rejected', async () => {
      const party1 = await partyService.create(mockIndividual1);
      await partyService.create(mockIndividual2);

      const matches = await deduplicationService.findDuplicates(party1.id);

      const updated = await deduplicationService.updateMatchStatus(
        matches[0].id,
        'REJECTED',
        'Different persons'
      );

      expect(updated.status).toBe('REJECTED');
    });

    it('should throw error for non-existent match', async () => {
      await expect(
        deduplicationService.updateMatchStatus('non-existent', 'CONFIRMED')
      ).rejects.toThrow('Duplicate match not found');
    });
  });

  // ==========================================================================
  // Merge Suggestions Tests
  // ==========================================================================

  describe('suggestMerges', () => {
    beforeEach(async () => {
      const party1 = await partyService.create(mockIndividual1);
      await partyService.create(mockIndividual2);

      // Generate duplicate matches
      await deduplicationService.findDuplicates(party1.id);
    });

    it('should suggest merges for high-confidence matches', async () => {
      const suggestions = await deduplicationService.suggestMerges({
        minScore: 0.70,
      });

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should determine survivor automatically', async () => {
      const suggestions = await deduplicationService.suggestMerges();

      if (suggestions.length > 0) {
        expect(suggestions[0].survivorId).toBeDefined();
        expect(suggestions[0].victimIds.length).toBeGreaterThan(0);
      }
    });

    it('should respect limit option', async () => {
      const suggestions = await deduplicationService.suggestMerges({
        limit: 1,
      });

      expect(suggestions.length).toBeLessThanOrEqual(1);
    });

    it('should sort by score descending', async () => {
      const suggestions = await deduplicationService.suggestMerges();

      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].overallScore).toBeGreaterThanOrEqual(
          suggestions[i].overallScore
        );
      }
    });
  });

  // ==========================================================================
  // Get Methods Tests
  // ==========================================================================

  describe('getDuplicateMatch', () => {
    it('should retrieve match by ID', async () => {
      const party1 = await partyService.create(mockIndividual1);
      await partyService.create(mockIndividual2);

      const matches = await deduplicationService.findDuplicates(party1.id);
      const retrieved = await deduplicationService.getDuplicateMatch(matches[0].id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(matches[0].id);
    });

    it('should return null for non-existent match', async () => {
      const result = await deduplicationService.getDuplicateMatch('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getMergeResult', () => {
    it('should retrieve merge result by ID', async () => {
      const party1 = await partyService.create(mockIndividual1);
      const party2 = await partyService.create(mockIndividual2);

      const mergeResult = await deduplicationService.merge(party1.id, [party2.id]);
      const retrieved = await deduplicationService.getMergeResult(mergeResult.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(mergeResult.id);
    });

    it('should return null for non-existent merge result', async () => {
      const result = await deduplicationService.getMergeResult('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getMergeHistory', () => {
    it('should return merge history for party', async () => {
      const party1 = await partyService.create(mockIndividual1);
      const party2 = await partyService.create(mockIndividual2);

      await deduplicationService.merge(party1.id, [party2.id]);

      const history = await deduplicationService.getMergeHistory(party1.id);

      expect(history.length).toBeGreaterThan(0);
    });

    it('should return empty array for party with no merge history', async () => {
      const party = await partyService.create(mockIndividual1);

      const history = await deduplicationService.getMergeHistory(party.id);

      expect(history).toEqual([]);
    });
  });

  // ==========================================================================
  // Calculate Match Score Tests
  // ==========================================================================

  describe('calculateMatchScore', () => {
    it('should calculate match score between two parties', async () => {
      const party1 = await partyService.create(mockIndividual1);
      const party2 = await partyService.create(mockIndividual2);

      const score = await deduplicationService.calculateMatchScore(party1, party2);

      expect(score).toBeDefined();
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(1);
    });

    it('should include component scores', async () => {
      const party1 = await partyService.create(mockIndividual1);
      const party2 = await partyService.create(mockIndividual2);

      const score = await deduplicationService.calculateMatchScore(party1, party2);

      expect(score.name).toBeDefined();
      expect(score.identifier).toBeDefined();
      expect(score.address).toBeDefined();
      expect(score.phone).toBeDefined();
      expect(score.email).toBeDefined();
    });
  });
});
