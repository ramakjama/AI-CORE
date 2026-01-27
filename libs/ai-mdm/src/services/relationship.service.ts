/**
 * AI-MDM Relationship Service
 * Manages relationships between parties and provides graph traversal
 */

import { v4 as uuidv4 } from 'uuid';
import {
  PartyRelationship,
  RelationshipType,
  RelationshipGraphNode,
  RelationshipPath,
  Party,
  SourceSystem
} from '../types';
import { getPartiesStore } from './party.service';

// In-memory stores
const relationships: Map<string, PartyRelationship> = new Map();
const relationshipsByParty: Map<string, Set<string>> = new Map(); // partyId -> Set of relationshipIds

/**
 * Inverse relationship mapping
 */
const INVERSE_RELATIONSHIPS: Partial<Record<RelationshipType, RelationshipType>> = {
  [RelationshipType.PARENT]: RelationshipType.CHILD,
  [RelationshipType.CHILD]: RelationshipType.PARENT,
  [RelationshipType.SPOUSE]: RelationshipType.SPOUSE,
  [RelationshipType.SIBLING]: RelationshipType.SIBLING,
  [RelationshipType.GRANDPARENT]: RelationshipType.GRANDCHILD,
  [RelationshipType.GRANDCHILD]: RelationshipType.GRANDPARENT,
  [RelationshipType.UNCLE_AUNT]: RelationshipType.NEPHEW_NIECE,
  [RelationshipType.NEPHEW_NIECE]: RelationshipType.UNCLE_AUNT,
  [RelationshipType.COUSIN]: RelationshipType.COUSIN,
  [RelationshipType.EMPLOYEE]: RelationshipType.EMPLOYER,
  [RelationshipType.EMPLOYER]: RelationshipType.EMPLOYEE,
  [RelationshipType.OWNER]: RelationshipType.OWNER, // Bidirectional
  [RelationshipType.PARTNER]: RelationshipType.PARTNER,
  [RelationshipType.GUARDIAN]: RelationshipType.GUARDIAN,
  [RelationshipType.BENEFICIARY]: RelationshipType.POLICYHOLDER,
  [RelationshipType.POLICYHOLDER]: RelationshipType.BENEFICIARY
};

/**
 * Relationship Service
 */
export class RelationshipService {
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
   * Create a relationship between two parties
   */
  async create(
    partyId1: string,
    partyId2: string,
    type: RelationshipType,
    options?: {
      description?: string;
      startDate?: Date;
      endDate?: Date;
      roleData?: Record<string, unknown>;
      sourceSystem?: SourceSystem;
      createInverse?: boolean;
    }
  ): Promise<PartyRelationship> {
    const parties = getPartiesStore();

    // Validate parties exist
    const party1 = parties.get(partyId1);
    const party2 = parties.get(partyId2);

    if (!party1) {
      throw new Error(`Party not found: ${partyId1}`);
    }
    if (!party2) {
      throw new Error(`Party not found: ${partyId2}`);
    }

    if (party1.isDeleted || party2.isDeleted) {
      throw new Error('Cannot create relationship with deleted party');
    }

    // Check for existing relationship
    const existingRelationship = await this.findExistingRelationship(partyId1, partyId2, type);
    if (existingRelationship) {
      throw new Error(`Relationship already exists: ${existingRelationship.id}`);
    }

    const now = new Date();
    const inverseType = INVERSE_RELATIONSHIPS[type];

    const relationship: PartyRelationship = {
      id: uuidv4(),
      fromPartyId: partyId1,
      toPartyId: partyId2,
      type,
      inverseType,
      description: options?.description,
      startDate: options?.startDate,
      endDate: options?.endDate,
      roleData: options?.roleData,
      isActive: true,
      isVerified: false,
      sourceSystem: options?.sourceSystem || SourceSystem.MANUAL_ENTRY,
      createdAt: now,
      createdBy: this.currentUser,
      updatedAt: now,
      updatedBy: this.currentUser
    };

    // Store relationship
    relationships.set(relationship.id, relationship);

    // Update party indexes
    this.addToPartyIndex(partyId1, relationship.id);
    this.addToPartyIndex(partyId2, relationship.id);

    // Create inverse relationship if requested and type has an inverse
    if (options?.createInverse !== false && inverseType && inverseType !== type) {
      const inverseRelationship: PartyRelationship = {
        ...relationship,
        id: uuidv4(),
        fromPartyId: partyId2,
        toPartyId: partyId1,
        type: inverseType,
        inverseType: type
      };

      relationships.set(inverseRelationship.id, inverseRelationship);
      this.addToPartyIndex(partyId1, inverseRelationship.id);
      this.addToPartyIndex(partyId2, inverseRelationship.id);
    }

    return relationship;
  }

  /**
   * Get a relationship by ID
   */
  async get(relationshipId: string): Promise<PartyRelationship | null> {
    return relationships.get(relationshipId) || null;
  }

  /**
   * Get all relationships for a party
   */
  async getRelationships(
    partyId: string,
    type?: RelationshipType
  ): Promise<PartyRelationship[]> {
    const relationshipIds = relationshipsByParty.get(partyId);
    if (!relationshipIds) {
      return [];
    }

    const results: PartyRelationship[] = [];

    for (const id of relationshipIds) {
      const rel = relationships.get(id);
      if (rel && rel.isActive) {
        // Filter by type if specified
        if (type && rel.type !== type) continue;

        // Only include relationships where this party is involved
        if (rel.fromPartyId === partyId || rel.toPartyId === partyId) {
          results.push(rel);
        }
      }
    }

    return results;
  }

  /**
   * Update a relationship
   */
  async updateRelationship(
    relationshipId: string,
    changes: {
      type?: RelationshipType;
      description?: string;
      startDate?: Date;
      endDate?: Date;
      roleData?: Record<string, unknown>;
      isVerified?: boolean;
    }
  ): Promise<PartyRelationship> {
    const relationship = relationships.get(relationshipId);
    if (!relationship) {
      throw new Error(`Relationship not found: ${relationshipId}`);
    }

    const now = new Date();

    if (changes.type !== undefined) {
      relationship.type = changes.type;
      relationship.inverseType = INVERSE_RELATIONSHIPS[changes.type];
    }
    if (changes.description !== undefined) {
      relationship.description = changes.description;
    }
    if (changes.startDate !== undefined) {
      relationship.startDate = changes.startDate;
    }
    if (changes.endDate !== undefined) {
      relationship.endDate = changes.endDate;
    }
    if (changes.roleData !== undefined) {
      relationship.roleData = { ...relationship.roleData, ...changes.roleData };
    }
    if (changes.isVerified !== undefined) {
      relationship.isVerified = changes.isVerified;
    }

    relationship.updatedAt = now;
    relationship.updatedBy = this.currentUser;

    relationships.set(relationshipId, relationship);

    return relationship;
  }

  /**
   * Delete a relationship
   */
  async delete(relationshipId: string): Promise<boolean> {
    const relationship = relationships.get(relationshipId);
    if (!relationship) {
      return false;
    }

    // Mark as inactive (soft delete)
    relationship.isActive = false;
    relationship.endDate = new Date();
    relationship.updatedAt = new Date();
    relationship.updatedBy = this.currentUser;

    relationships.set(relationshipId, relationship);

    return true;
  }

  /**
   * Hard delete a relationship
   */
  async hardDelete(relationshipId: string): Promise<boolean> {
    const relationship = relationships.get(relationshipId);
    if (!relationship) {
      return false;
    }

    // Remove from party indexes
    this.removeFromPartyIndex(relationship.fromPartyId, relationshipId);
    this.removeFromPartyIndex(relationship.toPartyId, relationshipId);

    // Delete relationship
    relationships.delete(relationshipId);

    return true;
  }

  /**
   * Get relationship graph for a party
   */
  async getRelationshipGraph(
    partyId: string,
    depth: number = 2
  ): Promise<RelationshipGraphNode[]> {
    const parties = getPartiesStore();
    const party = parties.get(partyId);

    if (!party) {
      throw new Error(`Party not found: ${partyId}`);
    }

    const visited = new Set<string>();
    const nodes: RelationshipGraphNode[] = [];

    // BFS traversal
    const queue: { partyId: string; depth: number }[] = [{ partyId, depth: 0 }];

    while (queue.length > 0) {
      const { partyId: currentPartyId, depth: currentDepth } = queue.shift()!;

      if (visited.has(currentPartyId) || currentDepth > depth) {
        continue;
      }

      visited.add(currentPartyId);

      const currentParty = parties.get(currentPartyId);
      if (!currentParty) continue;

      // Get relationships
      const partyRelationships = await this.getRelationships(currentPartyId);
      const relationshipInfo: RelationshipGraphNode['relationships'] = [];

      for (const rel of partyRelationships) {
        const connectedPartyId = rel.fromPartyId === currentPartyId
          ? rel.toPartyId
          : rel.fromPartyId;

        const direction = rel.fromPartyId === currentPartyId ? 'outgoing' : 'incoming';

        relationshipInfo.push({
          relationshipId: rel.id,
          type: rel.type,
          direction,
          connectedPartyId
        });

        // Add connected party to queue for next level
        if (currentDepth < depth && !visited.has(connectedPartyId)) {
          queue.push({ partyId: connectedPartyId, depth: currentDepth + 1 });
        }
      }

      nodes.push({
        partyId: currentPartyId,
        party: currentParty,
        depth: currentDepth,
        relationships: relationshipInfo
      });
    }

    return nodes;
  }

  /**
   * Find connection path between two parties
   */
  async findConnection(
    partyId1: string,
    partyId2: string,
    maxDepth: number = 6
  ): Promise<RelationshipPath | null> {
    const parties = getPartiesStore();

    if (!parties.has(partyId1) || !parties.has(partyId2)) {
      throw new Error('One or both parties not found');
    }

    if (partyId1 === partyId2) {
      return {
        fromPartyId: partyId1,
        toPartyId: partyId2,
        path: [],
        totalDegrees: 0
      };
    }

    // BFS to find shortest path
    const visited = new Set<string>();
    const queue: {
      partyId: string;
      path: { partyId: string; relationship: RelationshipType }[];
    }[] = [{ partyId: partyId1, path: [] }];

    while (queue.length > 0) {
      const { partyId: currentPartyId, path } = queue.shift()!;

      if (path.length >= maxDepth) {
        continue;
      }

      if (visited.has(currentPartyId)) {
        continue;
      }

      visited.add(currentPartyId);

      const partyRelationships = await this.getRelationships(currentPartyId);

      for (const rel of partyRelationships) {
        const connectedPartyId = rel.fromPartyId === currentPartyId
          ? rel.toPartyId
          : rel.fromPartyId;

        if (visited.has(connectedPartyId)) {
          continue;
        }

        const newPath = [
          ...path,
          { partyId: connectedPartyId, relationship: rel.type }
        ];

        if (connectedPartyId === partyId2) {
          return {
            fromPartyId: partyId1,
            toPartyId: partyId2,
            path: newPath,
            totalDegrees: newPath.length
          };
        }

        queue.push({ partyId: connectedPartyId, path: newPath });
      }
    }

    return null; // No connection found
  }

  /**
   * Get all relationships of a specific type
   */
  async getRelationshipsByType(type: RelationshipType): Promise<PartyRelationship[]> {
    const results: PartyRelationship[] = [];

    for (const rel of relationships.values()) {
      if (rel.type === type && rel.isActive) {
        results.push(rel);
      }
    }

    return results;
  }

  /**
   * Get relationship statistics for a party
   */
  async getRelationshipStats(partyId: string): Promise<{
    total: number;
    byType: Record<RelationshipType, number>;
    verified: number;
    unverified: number;
  }> {
    const partyRelationships = await this.getRelationships(partyId);

    const byType: Partial<Record<RelationshipType, number>> = {};
    let verified = 0;
    let unverified = 0;

    for (const rel of partyRelationships) {
      byType[rel.type] = (byType[rel.type] || 0) + 1;
      if (rel.isVerified) {
        verified++;
      } else {
        unverified++;
      }
    }

    return {
      total: partyRelationships.length,
      byType: byType as Record<RelationshipType, number>,
      verified,
      unverified
    };
  }

  /**
   * Verify a relationship
   */
  async verifyRelationship(relationshipId: string): Promise<PartyRelationship> {
    const relationship = relationships.get(relationshipId);
    if (!relationship) {
      throw new Error(`Relationship not found: ${relationshipId}`);
    }

    relationship.isVerified = true;
    relationship.updatedAt = new Date();
    relationship.updatedBy = this.currentUser;

    relationships.set(relationshipId, relationship);

    return relationship;
  }

  /**
   * Get family tree (specialized for family relationships)
   */
  async getFamilyTree(partyId: string): Promise<RelationshipGraphNode[]> {
    const familyTypes: RelationshipType[] = [
      RelationshipType.SPOUSE,
      RelationshipType.CHILD,
      RelationshipType.PARENT,
      RelationshipType.SIBLING,
      RelationshipType.GRANDPARENT,
      RelationshipType.GRANDCHILD,
      RelationshipType.UNCLE_AUNT,
      RelationshipType.NEPHEW_NIECE,
      RelationshipType.COUSIN
    ];

    const graph = await this.getRelationshipGraph(partyId, 4);

    // Filter to only family relationships
    return graph.map(node => ({
      ...node,
      relationships: node.relationships.filter(r =>
        familyTypes.includes(r.type)
      )
    })).filter(node => node.relationships.length > 0 || node.partyId === partyId);
  }

  /**
   * Get business relationships
   */
  async getBusinessRelationships(partyId: string): Promise<PartyRelationship[]> {
    const businessTypes: RelationshipType[] = [
      RelationshipType.EMPLOYEE,
      RelationshipType.EMPLOYER,
      RelationshipType.OWNER,
      RelationshipType.PARTNER,
      RelationshipType.DIRECTOR,
      RelationshipType.SHAREHOLDER,
      RelationshipType.AGENT
    ];

    const allRelationships = await this.getRelationships(partyId);
    return allRelationships.filter(r => businessTypes.includes(r.type));
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  /**
   * Add relationship to party index
   */
  private addToPartyIndex(partyId: string, relationshipId: string): void {
    const existing = relationshipsByParty.get(partyId) || new Set();
    existing.add(relationshipId);
    relationshipsByParty.set(partyId, existing);
  }

  /**
   * Remove relationship from party index
   */
  private removeFromPartyIndex(partyId: string, relationshipId: string): void {
    const existing = relationshipsByParty.get(partyId);
    if (existing) {
      existing.delete(relationshipId);
      if (existing.size === 0) {
        relationshipsByParty.delete(partyId);
      }
    }
  }

  /**
   * Find existing relationship between two parties
   */
  private async findExistingRelationship(
    partyId1: string,
    partyId2: string,
    type: RelationshipType
  ): Promise<PartyRelationship | null> {
    const rels1 = relationshipsByParty.get(partyId1);
    if (!rels1) return null;

    for (const relId of rels1) {
      const rel = relationships.get(relId);
      if (rel && rel.isActive && rel.type === type) {
        if (
          (rel.fromPartyId === partyId1 && rel.toPartyId === partyId2) ||
          (rel.fromPartyId === partyId2 && rel.toPartyId === partyId1)
        ) {
          return rel;
        }
      }
    }

    return null;
  }
}

// Export singleton instance
export const relationshipService = new RelationshipService();

// Export store access
export const getRelationshipsStore = (): Map<string, PartyRelationship> => relationships;
export const getRelationshipsByPartyIndex = (): Map<string, Set<string>> => relationshipsByParty;

export default RelationshipService;
