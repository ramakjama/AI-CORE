/**
 * AI-MDM Deduplication Service
 * Finds and manages duplicate party records using fuzzy matching
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Party,
  PartyType,
  DuplicateMatch,
  MatchScore,
  MatchConfidence,
  MergeCandidate,
  MergeResult,
  MergeHistory,
  MergeStatus,
  BatchDeduplicationOptions,
  BatchOperationResult,
  SourceSystem
} from '../types';
import { getPartiesStore, getVersionsStore, PartyService } from './party.service';
import { FuzzyMatcher } from '../matching/fuzzy-matcher';

// In-memory stores
const duplicateMatches: Map<string, DuplicateMatch> = new Map();
const mergeCandidates: Map<string, MergeCandidate> = new Map();
const mergeResults: Map<string, MergeResult> = new Map();
const mergeHistory: Map<string, MergeHistory[]> = new Map();

/**
 * Default match thresholds
 */
const DEFAULT_THRESHOLDS = {
  high: 0.90,
  medium: 0.70,
  low: 0.50
};

/**
 * Deduplication Service
 */
export class DeduplicationService {
  private currentUser: string;
  private fuzzyMatcher: FuzzyMatcher;
  private partyService: PartyService;

  constructor(currentUser: string = 'system') {
    this.currentUser = currentUser;
    this.fuzzyMatcher = new FuzzyMatcher();
    this.partyService = new PartyService(currentUser);
  }

  /**
   * Set current user for audit
   */
  setCurrentUser(userId: string): void {
    this.currentUser = userId;
    this.partyService.setCurrentUser(userId);
  }

  /**
   * Find duplicates for a specific party
   */
  async findDuplicates(partyId: string): Promise<DuplicateMatch[]> {
    const parties = getPartiesStore();
    const targetParty = parties.get(partyId);

    if (!targetParty) {
      throw new Error(`Party not found: ${partyId}`);
    }

    if (targetParty.isDeleted) {
      return [];
    }

    const matches: DuplicateMatch[] = [];

    // Compare with all other parties
    for (const [candidateId, candidateParty] of parties) {
      if (candidateId === partyId || candidateParty.isDeleted) continue;

      // Only compare same type parties
      if (candidateParty.type !== targetParty.type) continue;

      // Calculate match score
      const scores = await this.calculateMatchScore(targetParty, candidateParty);

      // Only include if above minimum threshold
      if (scores.overall >= DEFAULT_THRESHOLDS.low) {
        const match = this.createDuplicateMatch(targetParty, candidateParty, scores);
        matches.push(match);
        duplicateMatches.set(match.id, match);
      }
    }

    // Sort by score descending
    matches.sort((a, b) => b.overallScore - a.overallScore);

    return matches;
  }

  /**
   * Find all duplicates in the database (batch operation)
   */
  async findAllDuplicates(options: BatchDeduplicationOptions = {}): Promise<BatchOperationResult> {
    const {
      partyTypes,
      sourceSystems,
      minMatchScore = DEFAULT_THRESHOLDS.low,
      batchSize = 100,
      maxResults = 1000,
      autoMerge = false,
      autoMergeThreshold = DEFAULT_THRESHOLDS.high
    } = options;

    const operationId = uuidv4();
    const startedAt = new Date();
    const parties = getPartiesStore();

    const result: BatchOperationResult = {
      id: operationId,
      operation: 'findAllDuplicates',
      status: 'RUNNING',
      totalItems: parties.size,
      processedItems: 0,
      successfulItems: 0,
      failedItems: 0,
      results: [],
      errors: [],
      startedAt
    };

    // Get parties to process
    const partiesToProcess: Party[] = [];
    for (const party of parties.values()) {
      if (party.isDeleted) continue;
      if (partyTypes && !partyTypes.includes(party.type)) continue;
      if (sourceSystems && !sourceSystems.includes(party.sourceSystem)) continue;
      partiesToProcess.push(party);
    }

    result.totalItems = partiesToProcess.length;

    // Track already matched pairs to avoid duplicates
    const matchedPairs = new Set<string>();
    const allMatches: DuplicateMatch[] = [];

    // Process in batches
    for (let i = 0; i < partiesToProcess.length && allMatches.length < maxResults; i += batchSize) {
      const batch = partiesToProcess.slice(i, i + batchSize);

      for (const party of batch) {
        try {
          // Compare with remaining parties
          for (let j = i + 1; j < partiesToProcess.length; j++) {
            const candidate = partiesToProcess[j];
            if (!candidate) continue;

            const pairKey = [party.id, candidate.id].sort().join('|');

            if (matchedPairs.has(pairKey)) continue;
            if (party.type !== candidate.type) continue;

            const scores = await this.calculateMatchScore(party, candidate);

            if (scores.overall >= minMatchScore) {
              const match = this.createDuplicateMatch(party, candidate, scores);
              allMatches.push(match);
              duplicateMatches.set(match.id, match);
              matchedPairs.add(pairKey);

              // Auto-merge if enabled and above threshold
              if (autoMerge && scores.overall >= autoMergeThreshold) {
                try {
                  await this.merge(party.id, [candidate.id]);
                  match.status = 'MERGED';
                } catch {
                  // Continue without merging
                }
              }

              if (allMatches.length >= maxResults) break;
            }
          }

          result.processedItems++;
          result.successfulItems++;
        } catch (error) {
          result.processedItems++;
          result.failedItems++;
          result.errors?.push({
            itemId: party.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    result.status = 'COMPLETED';
    result.completedAt = new Date();
    result.duration = result.completedAt.getTime() - startedAt.getTime();
    result.results = allMatches;

    return result;
  }

  /**
   * Calculate match score between two parties
   */
  async calculateMatchScore(party1: Party, party2: Party): Promise<MatchScore> {
    // Use fuzzy matcher for detailed scoring
    return this.fuzzyMatcher.calculateOverallScore(party1, party2);
  }

  /**
   * Merge parties (survivor absorbs victims)
   */
  async merge(survivorId: string, victimIds: string[]): Promise<MergeResult> {
    const parties = getPartiesStore();
    const survivor = parties.get(survivorId);

    if (!survivor) {
      throw new Error(`Survivor party not found: ${survivorId}`);
    }

    const victims: Party[] = [];
    for (const victimId of victimIds) {
      const victim = parties.get(victimId);
      if (!victim) {
        throw new Error(`Victim party not found: ${victimId}`);
      }
      if (victim.isDeleted) {
        throw new Error(`Cannot merge deleted party: ${victimId}`);
      }
      victims.push(victim);
    }

    const now = new Date();
    const mergeResultId = uuidv4();

    // Create snapshots for potential unmerge
    const premergeSnapshots: Map<string, Partial<Party>> = new Map();
    premergeSnapshots.set(survivorId, JSON.parse(JSON.stringify(survivor)));
    for (const victim of victims) {
      premergeSnapshots.set(victim.id, JSON.parse(JSON.stringify(victim)));
    }

    // Merge identifiers (add all unique)
    const mergedIdentifiers = [...survivor.identifiers];
    for (const victim of victims) {
      for (const id of victim.identifiers) {
        const exists = mergedIdentifiers.some(
          existing => existing.type === id.type && existing.value === id.value
        );
        if (!exists) {
          mergedIdentifiers.push({ ...id, partyId: survivorId });
        }
      }
    }

    // Merge addresses (add all unique)
    const mergedAddresses = [...survivor.addresses];
    for (const victim of victims) {
      for (const addr of victim.addresses) {
        const exists = mergedAddresses.some(
          existing =>
            existing.streetLine1 === addr.streetLine1 &&
            existing.postalCode === addr.postalCode &&
            existing.city === addr.city
        );
        if (!exists) {
          mergedAddresses.push({ ...addr, partyId: survivorId });
        }
      }
    }

    // Merge contacts (add all unique)
    const mergedContacts = [...survivor.contacts];
    for (const victim of victims) {
      for (const contact of victim.contacts) {
        const exists = mergedContacts.some(
          existing => existing.type === contact.type && existing.value === contact.value
        );
        if (!exists) {
          mergedContacts.push({ ...contact, partyId: survivorId });
        }
      }
    }

    // Merge tags
    const mergedTags = [...new Set([
      ...survivor.tags,
      ...victims.flatMap(v => v.tags)
    ])];

    // Update survivor with merged data
    const updatedSurvivor = await this.partyService.update(survivorId, {
      identifiers: mergedIdentifiers,
      addresses: mergedAddresses,
      contacts: mergedContacts,
      tags: mergedTags,
      isGoldenRecord: true
    });

    // Mark victims as deleted (soft delete)
    for (const victim of victims) {
      await this.partyService.softDelete(victim.id);
    }

    // Create merge result
    const mergeResult: MergeResult = {
      id: mergeResultId,
      survivorId,
      victimIds,
      goldenRecordId: updatedSurvivor.goldenRecordId || survivorId,
      mergedFields: {
        identifiers: mergedIdentifiers.length,
        addresses: mergedAddresses.length,
        contacts: mergedContacts.length,
        tags: mergedTags.length
      },
      conflictResolutions: {},
      status: MergeStatus.COMPLETED,
      canUnmerge: true,
      unmergeDeadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      mergedAt: now,
      mergedBy: this.currentUser
    };

    // Store merge result
    mergeResults.set(mergeResultId, mergeResult);

    // Create merge history entries
    for (const [partyId, snapshot] of premergeSnapshots) {
      const historyEntry: MergeHistory = {
        id: uuidv4(),
        mergeResultId,
        partyId,
        action: 'MERGE',
        survivorId,
        victimIds,
        premergeSnapshot: snapshot,
        performedAt: now,
        performedBy: this.currentUser
      };

      const history = mergeHistory.get(partyId) || [];
      history.push(historyEntry);
      mergeHistory.set(partyId, history);
    }

    // Update any duplicate matches to MERGED status
    for (const match of duplicateMatches.values()) {
      if (
        (match.party1Id === survivorId && victimIds.includes(match.party2Id)) ||
        (match.party2Id === survivorId && victimIds.includes(match.party1Id)) ||
        (victimIds.includes(match.party1Id) && victimIds.includes(match.party2Id))
      ) {
        match.status = 'MERGED';
        duplicateMatches.set(match.id, match);
      }
    }

    return mergeResult;
  }

  /**
   * Unmerge (revert a merge operation)
   */
  async unmerge(mergeResultId: string): Promise<MergeResult> {
    const result = mergeResults.get(mergeResultId);

    if (!result) {
      throw new Error(`Merge result not found: ${mergeResultId}`);
    }

    if (!result.canUnmerge) {
      throw new Error('This merge cannot be undone');
    }

    if (result.unmergeDeadline && result.unmergeDeadline < new Date()) {
      throw new Error('Unmerge deadline has passed');
    }

    const parties = getPartiesStore();
    const now = new Date();

    // Restore victim parties from snapshots
    const survivorHistory = mergeHistory.get(result.survivorId) || [];
    const relevantHistory = survivorHistory.find(h => h.mergeResultId === mergeResultId);

    if (!relevantHistory) {
      throw new Error('Cannot find merge history for unmerge');
    }

    // Restore survivor to pre-merge state
    const survivorSnapshot = relevantHistory.premergeSnapshot;
    if (survivorSnapshot) {
      const survivor = parties.get(result.survivorId);
      if (survivor) {
        const restoredSurvivor: Party = {
          ...survivor,
          identifiers: survivorSnapshot.identifiers || survivor.identifiers,
          addresses: survivorSnapshot.addresses || survivor.addresses,
          contacts: survivorSnapshot.contacts || survivor.contacts,
          tags: survivorSnapshot.tags || survivor.tags,
          version: survivor.version + 1,
          updatedAt: now,
          updatedBy: this.currentUser
        };
        parties.set(result.survivorId, restoredSurvivor);
      }
    }

    // Restore victim parties
    for (const victimId of result.victimIds) {
      const victimHistoryEntries = mergeHistory.get(victimId) || [];
      const victimHistory = victimHistoryEntries.find(h => h.mergeResultId === mergeResultId);

      if (victimHistory?.premergeSnapshot) {
        const victim = parties.get(victimId);
        if (victim) {
          const restoredVictim: Party = {
            ...victim,
            ...victimHistory.premergeSnapshot,
            id: victimId, // Preserve ID
            isDeleted: false,
            deletedAt: undefined,
            deletedBy: undefined,
            isActive: true,
            version: victim.version + 1,
            updatedAt: now,
            updatedBy: this.currentUser
          } as Party;
          parties.set(victimId, restoredVictim);
        }
      }

      // Add unmerge history
      const historyEntry: MergeHistory = {
        id: uuidv4(),
        mergeResultId,
        partyId: victimId,
        action: 'UNMERGE',
        survivorId: result.survivorId,
        victimIds: result.victimIds,
        premergeSnapshot: victimHistory?.premergeSnapshot || {},
        performedAt: now,
        performedBy: this.currentUser
      };
      const history = mergeHistory.get(victimId) || [];
      history.push(historyEntry);
      mergeHistory.set(victimId, history);
    }

    // Update merge result
    result.status = MergeStatus.REVERTED;
    result.canUnmerge = false;
    result.unmergedAt = now;
    result.unmergedBy = this.currentUser;
    mergeResults.set(mergeResultId, result);

    return result;
  }

  /**
   * Get merge history for a party
   */
  async getMergeHistory(partyId: string): Promise<MergeHistory[]> {
    return mergeHistory.get(partyId) || [];
  }

  /**
   * Suggest automatic merges based on high-confidence matches
   */
  async suggestMerges(options?: {
    minScore?: number;
    limit?: number;
    partyTypes?: PartyType[];
  }): Promise<MergeCandidate[]> {
    const {
      minScore = DEFAULT_THRESHOLDS.high,
      limit = 50,
      partyTypes
    } = options || {};

    const suggestions: MergeCandidate[] = [];

    // Get high-confidence matches
    for (const match of duplicateMatches.values()) {
      if (match.status !== 'PENDING') continue;
      if (match.overallScore < minScore) continue;

      const parties = getPartiesStore();
      const party1 = parties.get(match.party1Id);
      const party2 = parties.get(match.party2Id);

      if (!party1 || !party2) continue;
      if (party1.isDeleted || party2.isDeleted) continue;
      if (partyTypes && !partyTypes.includes(party1.type)) continue;

      // Determine survivor (prefer more complete, higher quality, older record)
      const [survivorId, victimIds] = this.determineSurvivor(party1, party2);

      const candidate: MergeCandidate = {
        id: uuidv4(),
        survivorId,
        victimIds,
        duplicateMatchId: match.id,
        confidence: match.confidence,
        overallScore: match.overallScore,
        previewGoldenRecord: {},
        fieldsToMerge: match.matchedFields,
        conflictingFields: match.mismatchedFields,
        status: MergeStatus.PENDING,
        suggestedAt: new Date(),
        suggestedBy: 'system'
      };

      suggestions.push(candidate);
      mergeCandidates.set(candidate.id, candidate);

      if (suggestions.length >= limit) break;
    }

    // Sort by score descending
    suggestions.sort((a, b) => b.overallScore - a.overallScore);

    return suggestions;
  }

  /**
   * Get a duplicate match by ID
   */
  async getDuplicateMatch(matchId: string): Promise<DuplicateMatch | null> {
    return duplicateMatches.get(matchId) || null;
  }

  /**
   * Update duplicate match status (confirm/reject)
   */
  async updateMatchStatus(
    matchId: string,
    status: 'CONFIRMED' | 'REJECTED',
    notes?: string
  ): Promise<DuplicateMatch> {
    const match = duplicateMatches.get(matchId);

    if (!match) {
      throw new Error(`Duplicate match not found: ${matchId}`);
    }

    match.status = status;
    match.reviewedBy = this.currentUser;
    match.reviewedAt = new Date();
    match.reviewNotes = notes;

    duplicateMatches.set(matchId, match);

    return match;
  }

  /**
   * Get merge result by ID
   */
  async getMergeResult(mergeResultId: string): Promise<MergeResult | null> {
    return mergeResults.get(mergeResultId) || null;
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  /**
   * Create a duplicate match record
   */
  private createDuplicateMatch(
    party1: Party,
    party2: Party,
    scores: MatchScore
  ): DuplicateMatch {
    const confidence = this.scoreToConfidence(scores.overall);

    // Determine matched and mismatched fields
    const matchedFields: string[] = [];
    const mismatchedFields: string[] = [];

    if (scores.name >= DEFAULT_THRESHOLDS.medium) {
      matchedFields.push('name');
    } else if (scores.name > 0) {
      mismatchedFields.push('name');
    }

    if (scores.identifier >= DEFAULT_THRESHOLDS.medium) {
      matchedFields.push('identifier');
    } else if (scores.identifier > 0) {
      mismatchedFields.push('identifier');
    }

    if (scores.address >= DEFAULT_THRESHOLDS.medium) {
      matchedFields.push('address');
    } else if (scores.address > 0) {
      mismatchedFields.push('address');
    }

    if (scores.phone >= DEFAULT_THRESHOLDS.medium) {
      matchedFields.push('phone');
    } else if (scores.phone > 0) {
      mismatchedFields.push('phone');
    }

    if (scores.email >= DEFAULT_THRESHOLDS.medium) {
      matchedFields.push('email');
    } else if (scores.email > 0) {
      mismatchedFields.push('email');
    }

    if (scores.birthDate >= DEFAULT_THRESHOLDS.medium) {
      matchedFields.push('birthDate');
    } else if (scores.birthDate > 0) {
      mismatchedFields.push('birthDate');
    }

    return {
      id: uuidv4(),
      party1Id: party1.id,
      party2Id: party2.id,
      overallScore: scores.overall,
      confidence,
      scores,
      matchedFields,
      mismatchedFields,
      status: 'PENDING',
      detectedAt: new Date(),
      detectedBy: this.currentUser,
      algorithm: 'fuzzy-matcher-v1'
    };
  }

  /**
   * Convert score to confidence level
   */
  private scoreToConfidence(score: number): MatchConfidence {
    if (score >= DEFAULT_THRESHOLDS.high) return MatchConfidence.HIGH;
    if (score >= DEFAULT_THRESHOLDS.medium) return MatchConfidence.MEDIUM;
    if (score >= DEFAULT_THRESHOLDS.low) return MatchConfidence.LOW;
    return MatchConfidence.NONE;
  }

  /**
   * Determine which party should be the survivor
   */
  private determineSurvivor(party1: Party, party2: Party): [string, string[]] {
    // Score each party
    const score1 = this.calculateSurvivorScore(party1);
    const score2 = this.calculateSurvivorScore(party2);

    if (score1 >= score2) {
      return [party1.id, [party2.id]];
    } else {
      return [party2.id, [party1.id]];
    }
  }

  /**
   * Calculate survivor preference score
   */
  private calculateSurvivorScore(party: Party): number {
    let score = 0;

    // Data quality score
    score += (party.dataQualityScore || 0) * 0.3;

    // Completeness score
    score += (party.completenessScore || 0) * 0.2;

    // Source system priority
    const sourcePriority: Record<SourceSystem, number> = {
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
    score += (sourcePriority[party.sourceSystem] || 0) * 0.2;

    // Age (older records preferred)
    const ageInDays = (Date.now() - party.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.min(ageInDays / 365, 1) * 10; // Max 10 points for 1+ years

    // More data points
    score += party.identifiers.length * 2;
    score += party.addresses.length * 2;
    score += party.contacts.length * 2;

    // Verified data
    score += party.identifiers.filter(id => id.isVerified).length * 5;
    score += party.addresses.filter(addr => addr.isVerified).length * 5;
    score += party.contacts.filter(c => c.isVerified).length * 5;

    return score;
  }
}

// Export singleton instance
export const deduplicationService = new DeduplicationService();

// Export store access
export const getDuplicateMatchesStore = (): Map<string, DuplicateMatch> => duplicateMatches;
export const getMergeResultsStore = (): Map<string, MergeResult> => mergeResults;
export const getMergeHistoryStore = (): Map<string, MergeHistory[]> => mergeHistory;

export default DeduplicationService;
