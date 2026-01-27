/**
 * AI-MDM Household Service
 * Manages household groupings and family relationships
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Household,
  HouseholdMember,
  Party,
  PartyType,
  RelationshipType
} from '../types';
import { getPartiesStore } from './party.service';

// In-memory store
const households: Map<string, Household> = new Map();
const membershipIndex: Map<string, string> = new Map(); // partyId -> householdId

/**
 * Household Service
 */
export class HouseholdService {
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
   * Create a new household
   */
  async create(
    name: string,
    members: { partyId: string; relationship: RelationshipType }[]
  ): Promise<Household> {
    const now = new Date();
    const householdId = uuidv4();
    const parties = getPartiesStore();

    // Validate and build members
    const householdMembers: HouseholdMember[] = [];
    let headOfHouseholdId: string | undefined;

    for (let i = 0; i < members.length; i++) {
      const memberInput = members[i];
      if (!memberInput) continue;
      const { partyId, relationship } = memberInput;

      const party = parties.get(partyId);
      if (!party) {
        throw new Error(`Party not found: ${partyId}`);
      }

      if (party.isDeleted) {
        throw new Error(`Cannot add deleted party to household: ${partyId}`);
      }

      // Check if party is already in another household
      const existingHouseholdId = membershipIndex.get(partyId);
      if (existingHouseholdId && existingHouseholdId !== householdId) {
        throw new Error(`Party ${partyId} is already in household ${existingHouseholdId}`);
      }

      // First member or head of household relationship
      const isHead = i === 0 || this.isHeadRelationship(relationship);

      const member: HouseholdMember = {
        id: uuidv4(),
        householdId,
        partyId,
        relationship,
        displayName: party.displayName,
        partyType: party.type,
        isHeadOfHousehold: isHead && !headOfHouseholdId,
        isPrimaryContact: i === 0,
        joinedAt: now,
        createdAt: now,
        updatedAt: now
      };

      if (member.isHeadOfHousehold) {
        headOfHouseholdId = partyId;
      }

      householdMembers.push(member);
      membershipIndex.set(partyId, householdId);
    }

    // Find primary address from head of household
    let primaryAddressId: string | undefined;
    if (headOfHouseholdId) {
      const headParty = parties.get(headOfHouseholdId);
      const primaryAddress = headParty?.addresses.find(a => a.isPrimary);
      primaryAddressId = primaryAddress?.id;
    }

    const household: Household = {
      id: householdId,
      name,
      members: householdMembers,
      headOfHouseholdId,
      primaryAddressId,
      totalMembers: householdMembers.length,
      tags: [],
      customAttributes: {},
      isActive: true,
      createdAt: now,
      createdBy: this.currentUser,
      updatedAt: now,
      updatedBy: this.currentUser
    };

    households.set(householdId, household);

    return household;
  }

  /**
   * Add a member to an existing household
   */
  async addMember(
    householdId: string,
    partyId: string,
    relationship: RelationshipType
  ): Promise<Household> {
    const household = households.get(householdId);
    if (!household) {
      throw new Error(`Household not found: ${householdId}`);
    }

    if (!household.isActive) {
      throw new Error(`Cannot add member to inactive household: ${householdId}`);
    }

    const parties = getPartiesStore();
    const party = parties.get(partyId);

    if (!party) {
      throw new Error(`Party not found: ${partyId}`);
    }

    if (party.isDeleted) {
      throw new Error(`Cannot add deleted party to household: ${partyId}`);
    }

    // Check if already a member
    const existingMember = household.members.find(m => m.partyId === partyId && !m.leftAt);
    if (existingMember) {
      throw new Error(`Party ${partyId} is already a member of household ${householdId}`);
    }

    // Check if party is in another household
    const existingHouseholdId = membershipIndex.get(partyId);
    if (existingHouseholdId && existingHouseholdId !== householdId) {
      throw new Error(`Party ${partyId} is already in household ${existingHouseholdId}`);
    }

    const now = new Date();

    const member: HouseholdMember = {
      id: uuidv4(),
      householdId,
      partyId,
      relationship,
      displayName: party.displayName,
      partyType: party.type,
      isHeadOfHousehold: false,
      isPrimaryContact: false,
      joinedAt: now,
      createdAt: now,
      updatedAt: now
    };

    household.members.push(member);
    household.totalMembers = household.members.filter(m => !m.leftAt).length;
    household.updatedAt = now;
    household.updatedBy = this.currentUser;

    membershipIndex.set(partyId, householdId);
    households.set(householdId, household);

    return household;
  }

  /**
   * Remove a member from a household
   */
  async removeMember(householdId: string, partyId: string): Promise<Household> {
    const household = households.get(householdId);
    if (!household) {
      throw new Error(`Household not found: ${householdId}`);
    }

    const memberIndex = household.members.findIndex(
      m => m.partyId === partyId && !m.leftAt
    );

    if (memberIndex === -1) {
      throw new Error(`Party ${partyId} is not a member of household ${householdId}`);
    }

    const now = new Date();
    const member = household.members[memberIndex];
    if (!member) {
      throw new Error(`Member at index ${memberIndex} not found`);
    }

    // Mark as left (soft remove)
    member.leftAt = now;
    member.updatedAt = now;

    // Update membership index
    membershipIndex.delete(partyId);

    // Update household
    household.totalMembers = household.members.filter(m => !m.leftAt).length;
    household.updatedAt = now;
    household.updatedBy = this.currentUser;

    // If head of household left, assign new head
    if (member.isHeadOfHousehold) {
      member.isHeadOfHousehold = false;
      const newHead = household.members.find(m => !m.leftAt);
      if (newHead) {
        newHead.isHeadOfHousehold = true;
        household.headOfHouseholdId = newHead.partyId;
      } else {
        household.headOfHouseholdId = undefined;
      }
    }

    // If primary contact left, assign new primary
    if (member.isPrimaryContact) {
      member.isPrimaryContact = false;
      const newPrimary = household.members.find(m => !m.leftAt);
      if (newPrimary) {
        newPrimary.isPrimaryContact = true;
      }
    }

    households.set(householdId, household);

    // Deactivate household if no members remain
    if (household.totalMembers === 0) {
      household.isActive = false;
    }

    return household;
  }

  /**
   * Get a household by ID
   */
  async getHousehold(householdId: string): Promise<Household | null> {
    return households.get(householdId) || null;
  }

  /**
   * Get household by member party ID
   */
  async getHouseholdByMember(partyId: string): Promise<Household | null> {
    const householdId = membershipIndex.get(partyId);
    if (!householdId) {
      return null;
    }
    return households.get(householdId) || null;
  }

  /**
   * Set head of household
   */
  async setHeadOfHousehold(householdId: string, partyId: string): Promise<Household> {
    const household = households.get(householdId);
    if (!household) {
      throw new Error(`Household not found: ${householdId}`);
    }

    const member = household.members.find(m => m.partyId === partyId && !m.leftAt);
    if (!member) {
      throw new Error(`Party ${partyId} is not a member of household ${householdId}`);
    }

    const now = new Date();

    // Remove current head
    const currentHead = household.members.find(m => m.isHeadOfHousehold);
    if (currentHead) {
      currentHead.isHeadOfHousehold = false;
      currentHead.updatedAt = now;
    }

    // Set new head
    member.isHeadOfHousehold = true;
    member.updatedAt = now;
    household.headOfHouseholdId = partyId;
    household.updatedAt = now;
    household.updatedBy = this.currentUser;

    // Update primary address from new head
    const parties = getPartiesStore();
    const headParty = parties.get(partyId);
    const primaryAddress = headParty?.addresses.find(a => a.isPrimary);
    if (primaryAddress) {
      household.primaryAddressId = primaryAddress.id;
    }

    households.set(householdId, household);

    return household;
  }

  /**
   * Calculate total household value (sum of all policies/premiums)
   */
  async calculateHouseholdValue(householdId: string): Promise<{
    totalPolicies: number;
    totalPremium: number;
    householdValue: number;
    memberValues: {
      partyId: string;
      displayName: string;
      policies: number;
      premium: number;
    }[];
  }> {
    const household = households.get(householdId);
    if (!household) {
      throw new Error(`Household not found: ${householdId}`);
    }

    const parties = getPartiesStore();
    const memberValues: {
      partyId: string;
      displayName: string;
      policies: number;
      premium: number;
    }[] = [];

    let totalPolicies = 0;
    let totalPremium = 0;

    for (const member of household.members) {
      if (member.leftAt) continue;

      const party = parties.get(member.partyId);
      if (!party) continue;

      // In a real implementation, this would query the policy database
      // For now, we use placeholder values from customAttributes
      const policies = (party.customAttributes?.['policyCount'] as number) || 0;
      const premium = (party.customAttributes?.['annualPremium'] as number) || 0;

      memberValues.push({
        partyId: member.partyId,
        displayName: member.displayName,
        policies,
        premium
      });

      totalPolicies += policies;
      totalPremium += premium;
    }

    // Household value = total premium + estimated lifetime value multiplier
    const householdValue = totalPremium * 10; // Simple 10x multiplier

    // Update household with calculated values
    household.totalPolicies = totalPolicies;
    household.totalPremium = totalPremium;
    household.householdValue = householdValue;
    household.updatedAt = new Date();
    households.set(householdId, household);

    return {
      totalPolicies,
      totalPremium,
      householdValue,
      memberValues
    };
  }

  /**
   * Get all households
   */
  async getAllHouseholds(options?: {
    includeInactive?: boolean;
  }): Promise<Household[]> {
    const results: Household[] = [];
    for (const household of households.values()) {
      if (!options?.includeInactive && !household.isActive) continue;
      results.push(household);
    }
    return results;
  }

  /**
   * Update household details
   */
  async updateHousehold(
    householdId: string,
    updates: {
      name?: string;
      primaryAddressId?: string;
      tags?: string[];
      customAttributes?: Record<string, unknown>;
    }
  ): Promise<Household> {
    const household = households.get(householdId);
    if (!household) {
      throw new Error(`Household not found: ${householdId}`);
    }

    const now = new Date();

    if (updates.name !== undefined) {
      household.name = updates.name;
    }
    if (updates.primaryAddressId !== undefined) {
      household.primaryAddressId = updates.primaryAddressId;
    }
    if (updates.tags !== undefined) {
      household.tags = updates.tags;
    }
    if (updates.customAttributes !== undefined) {
      household.customAttributes = {
        ...household.customAttributes,
        ...updates.customAttributes
      };
    }

    household.updatedAt = now;
    household.updatedBy = this.currentUser;

    households.set(householdId, household);

    return household;
  }

  /**
   * Update member relationship
   */
  async updateMember(
    householdId: string,
    partyId: string,
    updates: {
      relationship?: RelationshipType;
      isPrimaryContact?: boolean;
      incomeContribution?: number;
    }
  ): Promise<HouseholdMember> {
    const household = households.get(householdId);
    if (!household) {
      throw new Error(`Household not found: ${householdId}`);
    }

    const member = household.members.find(m => m.partyId === partyId && !m.leftAt);
    if (!member) {
      throw new Error(`Party ${partyId} is not a member of household ${householdId}`);
    }

    const now = new Date();

    if (updates.relationship !== undefined) {
      member.relationship = updates.relationship;
    }
    if (updates.isPrimaryContact !== undefined) {
      // Remove primary from others if setting to true
      if (updates.isPrimaryContact) {
        for (const m of household.members) {
          if (m.isPrimaryContact && m.partyId !== partyId) {
            m.isPrimaryContact = false;
            m.updatedAt = now;
          }
        }
      }
      member.isPrimaryContact = updates.isPrimaryContact;
    }
    if (updates.incomeContribution !== undefined) {
      member.incomeContribution = updates.incomeContribution;
    }

    member.updatedAt = now;
    household.updatedAt = now;
    household.updatedBy = this.currentUser;

    households.set(householdId, household);

    return member;
  }

  /**
   * Dissolve a household
   */
  async dissolveHousehold(householdId: string): Promise<Household> {
    const household = households.get(householdId);
    if (!household) {
      throw new Error(`Household not found: ${householdId}`);
    }

    const now = new Date();

    // Mark all members as left
    for (const member of household.members) {
      if (!member.leftAt) {
        member.leftAt = now;
        member.updatedAt = now;
        membershipIndex.delete(member.partyId);
      }
    }

    household.isActive = false;
    household.totalMembers = 0;
    household.headOfHouseholdId = undefined;
    household.updatedAt = now;
    household.updatedBy = this.currentUser;

    households.set(householdId, household);

    return household;
  }

  /**
   * Search households
   */
  async searchHouseholds(query: {
    name?: string;
    memberName?: string;
    minMembers?: number;
    maxMembers?: number;
    minValue?: number;
    tags?: string[];
  }): Promise<Household[]> {
    const results: Household[] = [];

    for (const household of households.values()) {
      if (!household.isActive) continue;

      // Name filter
      if (query.name && !household.name.toLowerCase().includes(query.name.toLowerCase())) {
        continue;
      }

      // Member name filter
      if (query.memberName) {
        const hasMatchingMember = household.members.some(m =>
          !m.leftAt && m.displayName.toLowerCase().includes(query.memberName!.toLowerCase())
        );
        if (!hasMatchingMember) continue;
      }

      // Member count filters
      if (query.minMembers !== undefined && household.totalMembers < query.minMembers) {
        continue;
      }
      if (query.maxMembers !== undefined && household.totalMembers > query.maxMembers) {
        continue;
      }

      // Value filter
      if (query.minValue !== undefined && (household.householdValue || 0) < query.minValue) {
        continue;
      }

      // Tags filter
      if (query.tags && query.tags.length > 0) {
        const hasTags = query.tags.every(tag => household.tags.includes(tag));
        if (!hasTags) continue;
      }

      results.push(household);
    }

    return results;
  }

  /**
   * Get member history (all members including those who left)
   */
  async getMemberHistory(householdId: string): Promise<HouseholdMember[]> {
    const household = households.get(householdId);
    if (!household) {
      throw new Error(`Household not found: ${householdId}`);
    }

    return [...household.members];
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  /**
   * Check if relationship type indicates head of household
   */
  private isHeadRelationship(relationship: RelationshipType): boolean {
    return [
      RelationshipType.OWNER,
      RelationshipType.POLICYHOLDER
    ].includes(relationship);
  }
}

// Export singleton instance
export const householdService = new HouseholdService();

// Export store access
export const getHouseholdsStore = (): Map<string, Household> => households;
export const getMembershipIndex = (): Map<string, string> => membershipIndex;

export default HouseholdService;
