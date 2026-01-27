/**
 * AI-MDM Fuzzy Matcher
 * Provides fuzzy matching capabilities for party deduplication
 */

import * as stringSimilarity from 'string-similarity';
import {
  Party,
  PartyType,
  MatchScore,
  Address,
  Contact,
  ContactType
} from '../types';

/**
 * Default weights for different match components
 */
const DEFAULT_WEIGHTS = {
  name: 0.30,
  identifier: 0.25,
  address: 0.15,
  phone: 0.10,
  email: 0.10,
  birthDate: 0.10
};

/**
 * Match configuration
 */
export interface MatchConfig {
  weights?: Partial<typeof DEFAULT_WEIGHTS>;
  thresholds?: {
    exact?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
  normalizeStrings?: boolean;
  phonetic?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<MatchConfig> = {
  weights: DEFAULT_WEIGHTS,
  thresholds: {
    exact: 1.0,
    high: 0.90,
    medium: 0.70,
    low: 0.50
  },
  normalizeStrings: true,
  phonetic: false
};

/**
 * Fuzzy Matcher class
 */
export class FuzzyMatcher {
  private config: Required<MatchConfig>;

  constructor(config?: MatchConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      weights: { ...DEFAULT_CONFIG.weights, ...config?.weights },
      thresholds: { ...DEFAULT_CONFIG.thresholds, ...config?.thresholds }
    };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<MatchConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      weights: { ...this.config.weights, ...config.weights },
      thresholds: { ...this.config.thresholds, ...config.thresholds }
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): MatchConfig {
    return { ...this.config };
  }

  /**
   * Match two names (individual or organization)
   */
  matchName(name1: string, name2: string): number {
    if (!name1 || !name2) return 0;

    const normalized1 = this.normalizeString(name1);
    const normalized2 = this.normalizeString(name2);

    // Exact match
    if (normalized1 === normalized2) return 1.0;

    // Calculate similarity using multiple algorithms
    const diceSimilarity = stringSimilarity.compareTwoStrings(normalized1, normalized2);

    // Token-based comparison (for names with different word orders)
    const tokens1 = normalized1.split(/\s+/).sort();
    const tokens2 = normalized2.split(/\s+/).sort();
    const tokenSimilarity = stringSimilarity.compareTwoStrings(
      tokens1.join(' '),
      tokens2.join(' ')
    );

    // Prefix match (for abbreviated names)
    const prefixScore = this.calculatePrefixScore(tokens1, tokens2);

    // Weight the different approaches
    return Math.max(
      diceSimilarity * 0.5 + tokenSimilarity * 0.3 + prefixScore * 0.2,
      diceSimilarity,
      tokenSimilarity
    );
  }

  /**
   * Match individual names with components
   */
  matchIndividualName(
    party1: Party,
    party2: Party
  ): number {
    if (party1.type !== PartyType.INDIVIDUAL || party2.type !== PartyType.INDIVIDUAL) {
      return 0;
    }

    const ind1 = party1.individual;
    const ind2 = party2.individual;

    if (!ind1 || !ind2) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    // First name comparison (required)
    if (ind1.firstName && ind2.firstName) {
      const firstNameScore = this.matchName(ind1.firstName, ind2.firstName);
      totalScore += firstNameScore * 0.4;
      totalWeight += 0.4;
    }

    // Last name comparison (required)
    if (ind1.lastName && ind2.lastName) {
      const lastNameScore = this.matchName(ind1.lastName, ind2.lastName);
      totalScore += lastNameScore * 0.4;
      totalWeight += 0.4;
    }

    // Second last name (Spanish naming)
    if (ind1.secondLastName && ind2.secondLastName) {
      const secondLastNameScore = this.matchName(ind1.secondLastName, ind2.secondLastName);
      totalScore += secondLastNameScore * 0.2;
      totalWeight += 0.2;
    }

    // Middle name
    if (ind1.middleName && ind2.middleName) {
      const middleNameScore = this.matchName(ind1.middleName, ind2.middleName);
      totalScore += middleNameScore * 0.1;
      totalWeight += 0.1;
    }

    // Also check full display name
    const displayNameScore = this.matchName(party1.displayName, party2.displayName);

    return totalWeight > 0
      ? Math.max(totalScore / totalWeight, displayNameScore * 0.8)
      : displayNameScore;
  }

  /**
   * Match organization names
   */
  matchOrganizationName(party1: Party, party2: Party): number {
    if (party1.type !== PartyType.ORGANIZATION || party2.type !== PartyType.ORGANIZATION) {
      return 0;
    }

    const org1 = party1.organization;
    const org2 = party2.organization;

    if (!org1 || !org2) return 0;

    let maxScore = 0;

    // Compare legal names
    if (org1.legalName && org2.legalName) {
      maxScore = Math.max(maxScore, this.matchName(org1.legalName, org2.legalName));
    }

    // Compare trade names
    if (org1.tradeName && org2.tradeName) {
      maxScore = Math.max(maxScore, this.matchName(org1.tradeName, org2.tradeName));
    }

    // Cross-compare legal and trade names
    if (org1.legalName && org2.tradeName) {
      maxScore = Math.max(maxScore, this.matchName(org1.legalName, org2.tradeName) * 0.9);
    }
    if (org1.tradeName && org2.legalName) {
      maxScore = Math.max(maxScore, this.matchName(org1.tradeName, org2.legalName) * 0.9);
    }

    return maxScore;
  }

  /**
   * Match addresses
   */
  matchAddress(addr1: Address, addr2: Address): number {
    if (!addr1 || !addr2) return 0;

    // Exact postal code match is strong indicator
    const postalCodeMatch = this.normalizePostalCode(addr1.postalCode) ===
                           this.normalizePostalCode(addr2.postalCode);

    // City match
    const cityScore = this.matchName(addr1.city, addr2.city);

    // Street match
    const streetScore = this.matchStreet(addr1.streetLine1, addr2.streetLine1);

    // Country match
    const countryMatch = addr1.countryCode === addr2.countryCode ||
                        this.matchName(addr1.country, addr2.country) > 0.8;

    if (!countryMatch) {
      return 0; // Different countries, no match
    }

    // Weighted score
    let score = 0;

    if (postalCodeMatch) {
      score += 0.4;
      score += streetScore * 0.4;
      score += cityScore * 0.2;
    } else {
      score += streetScore * 0.5;
      score += cityScore * 0.5;
    }

    return score;
  }

  /**
   * Match phone numbers
   */
  matchPhone(phone1: string, phone2: string): number {
    if (!phone1 || !phone2) return 0;

    const normalized1 = this.normalizePhone(phone1);
    const normalized2 = this.normalizePhone(phone2);

    // Exact match
    if (normalized1 === normalized2) return 1.0;

    // Match without country code
    const withoutCode1 = this.stripCountryCode(normalized1);
    const withoutCode2 = this.stripCountryCode(normalized2);

    if (withoutCode1 === withoutCode2) return 0.95;

    // Last N digits match (for partial numbers)
    const last9_1 = normalized1.slice(-9);
    const last9_2 = normalized2.slice(-9);

    if (last9_1 === last9_2 && last9_1.length === 9) return 0.90;

    // Similarity for close numbers (typos)
    const similarity = stringSimilarity.compareTwoStrings(normalized1, normalized2);
    return similarity > 0.9 ? similarity * 0.85 : 0;
  }

  /**
   * Match email addresses
   */
  matchEmail(email1: string, email2: string): number {
    if (!email1 || !email2) return 0;

    const normalized1 = this.normalizeEmail(email1);
    const normalized2 = this.normalizeEmail(email2);

    // Exact match
    if (normalized1 === normalized2) return 1.0;

    // Parse email parts
    const parts1 = normalized1.split('@');
    const parts2 = normalized2.split('@');
    const local1 = parts1[0];
    const domain1 = parts1[1];
    const local2 = parts2[0];
    const domain2 = parts2[1];

    if (!local1 || !domain1 || !local2 || !domain2) return 0;

    // Same domain
    const sameDomain = domain1 === domain2;

    // Local part similarity
    const localSimilarity = stringSimilarity.compareTwoStrings(local1, local2);

    if (sameDomain) {
      // Same domain, check local part
      if (localSimilarity > 0.8) {
        return 0.9 + localSimilarity * 0.1;
      }
      // Check if one contains the other (firstname vs firstname.lastname)
      if (local1.includes(local2) || local2.includes(local1)) {
        return 0.85;
      }
    }

    // Different domains but same local part
    if (localSimilarity === 1.0) {
      return 0.7;
    }

    return localSimilarity * 0.5;
  }

  /**
   * Match birth dates
   */
  matchBirthDate(date1: Date | undefined, date2: Date | undefined): number {
    if (!date1 || !date2) return 0;

    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Exact match
    if (d1.getTime() === d2.getTime()) return 1.0;

    // Same year, month, day (ignoring time)
    if (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    ) {
      return 1.0;
    }

    // Check for transposition (day/month swap)
    if (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() + 1 === d2.getDate() &&
      d1.getDate() === d2.getMonth() + 1 &&
      d1.getDate() <= 12 && d2.getDate() <= 12
    ) {
      return 0.85; // Likely day/month transposition
    }

    // Same year and month (day might be wrong)
    if (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth()
    ) {
      const dayDiff = Math.abs(d1.getDate() - d2.getDate());
      if (dayDiff === 1) return 0.9; // Off by one day (typo)
      if (dayDiff <= 3) return 0.7;
      return 0.5;
    }

    // Same year only
    if (d1.getFullYear() === d2.getFullYear()) {
      return 0.3;
    }

    return 0;
  }

  /**
   * Calculate overall match score between two parties
   */
  calculateOverallScore(party1: Party, party2: Party): MatchScore {
    const weights = this.config.weights;

    // Name score
    let nameScore = 0;
    if (party1.type === PartyType.INDIVIDUAL) {
      nameScore = this.matchIndividualName(party1, party2);
    } else if (party1.type === PartyType.ORGANIZATION) {
      nameScore = this.matchOrganizationName(party1, party2);
    }

    // Identifier score (check all combinations)
    let identifierScore = 0;
    for (const id1 of party1.identifiers) {
      for (const id2 of party2.identifiers) {
        if (id1.type === id2.type) {
          const normalizedId1 = this.normalizeIdentifier(id1.value);
          const normalizedId2 = this.normalizeIdentifier(id2.value);
          if (normalizedId1 === normalizedId2) {
            identifierScore = 1.0;
            break;
          }
          const similarity = stringSimilarity.compareTwoStrings(normalizedId1, normalizedId2);
          if (similarity > identifierScore) {
            identifierScore = similarity > 0.95 ? similarity : 0; // IDs should be nearly exact
          }
        }
      }
      if (identifierScore === 1.0) break;
    }

    // Address score (best match among all addresses)
    let addressScore = 0;
    for (const addr1 of party1.addresses) {
      for (const addr2 of party2.addresses) {
        const score = this.matchAddress(addr1, addr2);
        if (score > addressScore) addressScore = score;
      }
    }

    // Phone score
    let phoneScore = 0;
    const phones1 = party1.contacts.filter(c =>
      c.type === ContactType.PHONE || c.type === ContactType.MOBILE
    );
    const phones2 = party2.contacts.filter(c =>
      c.type === ContactType.PHONE || c.type === ContactType.MOBILE
    );
    for (const p1 of phones1) {
      for (const p2 of phones2) {
        const score = this.matchPhone(p1.value, p2.value);
        if (score > phoneScore) phoneScore = score;
      }
    }

    // Email score
    let emailScore = 0;
    const emails1 = party1.contacts.filter(c => c.type === ContactType.EMAIL);
    const emails2 = party2.contacts.filter(c => c.type === ContactType.EMAIL);
    for (const e1 of emails1) {
      for (const e2 of emails2) {
        const score = this.matchEmail(e1.value, e2.value);
        if (score > emailScore) emailScore = score;
      }
    }

    // Birth date score
    let birthDateScore = 0;
    if (party1.type === PartyType.INDIVIDUAL && party2.type === PartyType.INDIVIDUAL) {
      birthDateScore = this.matchBirthDate(
        party1.individual?.birthDate,
        party2.individual?.birthDate
      );
    }

    // Calculate weighted overall score with defaults
    const finalWeights = {
      name: weights.name ?? DEFAULT_WEIGHTS.name,
      identifier: weights.identifier ?? DEFAULT_WEIGHTS.identifier,
      address: weights.address ?? DEFAULT_WEIGHTS.address,
      phone: weights.phone ?? DEFAULT_WEIGHTS.phone,
      email: weights.email ?? DEFAULT_WEIGHTS.email,
      birthDate: weights.birthDate ?? DEFAULT_WEIGHTS.birthDate
    };

    const overall =
      nameScore * finalWeights.name +
      identifierScore * finalWeights.identifier +
      addressScore * finalWeights.address +
      phoneScore * finalWeights.phone +
      emailScore * finalWeights.email +
      birthDateScore * finalWeights.birthDate;

    return {
      overall: Math.round(overall * 100) / 100,
      name: Math.round(nameScore * 100) / 100,
      identifier: Math.round(identifierScore * 100) / 100,
      address: Math.round(addressScore * 100) / 100,
      phone: Math.round(phoneScore * 100) / 100,
      email: Math.round(emailScore * 100) / 100,
      birthDate: Math.round(birthDateScore * 100) / 100,
      weights: finalWeights
    };
  }

  // ============================================================================
  // Private normalization methods
  // ============================================================================

  /**
   * Normalize string for comparison
   */
  private normalizeString(str: string): string {
    if (!this.config.normalizeStrings) return str;

    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize postal code
   */
  private normalizePostalCode(code: string): string {
    return code.replace(/[\s\-]/g, '').toUpperCase();
  }

  /**
   * Normalize phone number
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Strip country code from phone
   */
  private stripCountryCode(phone: string): string {
    // Remove common country codes
    return phone
      .replace(/^\+34/, '')  // Spain
      .replace(/^\+1/, '')   // US/Canada
      .replace(/^\+44/, '')  // UK
      .replace(/^\+33/, '')  // France
      .replace(/^\+49/, '')  // Germany
      .replace(/^00\d{1,3}/, ''); // Generic international prefix
  }

  /**
   * Normalize email
   */
  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Normalize identifier
   */
  private normalizeIdentifier(id: string): string {
    return id.replace(/[\s\-\.]/g, '').toUpperCase();
  }

  /**
   * Match street addresses with common variations
   */
  private matchStreet(street1: string, street2: string): number {
    if (!street1 || !street2) return 0;

    const normalized1 = this.normalizeStreet(street1);
    const normalized2 = this.normalizeStreet(street2);

    if (normalized1 === normalized2) return 1.0;

    return stringSimilarity.compareTwoStrings(normalized1, normalized2);
  }

  /**
   * Normalize street address
   */
  private normalizeStreet(street: string): string {
    return this.normalizeString(street)
      // Spanish street type abbreviations
      .replace(/\bcalle\b/g, 'c')
      .replace(/\bavenida\b/g, 'av')
      .replace(/\bplaza\b/g, 'pl')
      .replace(/\bpaseo\b/g, 'ps')
      .replace(/\bcarretera\b/g, 'ctra')
      .replace(/\bnumero\b/g, '')
      .replace(/\bn\s*[°º]?\s*(\d)/g, '$1')
      // English street type abbreviations
      .replace(/\bstreet\b/g, 'st')
      .replace(/\bavenue\b/g, 'av')
      .replace(/\broad\b/g, 'rd')
      .replace(/\bdrive\b/g, 'dr')
      .replace(/\bboulevard\b/g, 'blvd')
      // Remove ordinal suffixes
      .replace(/(\d+)(st|nd|rd|th)\b/g, '$1');
  }

  /**
   * Calculate prefix match score for tokens
   */
  private calculatePrefixScore(tokens1: string[], tokens2: string[]): number {
    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    let matches = 0;
    const minLen = Math.min(tokens1.length, tokens2.length);

    for (const t1 of tokens1) {
      for (const t2 of tokens2) {
        // Check if one is prefix of other
        if (t1.startsWith(t2) || t2.startsWith(t1)) {
          const prefixLen = Math.min(t1.length, t2.length);
          const maxLen = Math.max(t1.length, t2.length);
          matches += prefixLen / maxLen;
        }
      }
    }

    return matches / minLen;
  }
}

// Export singleton with default config
export const fuzzyMatcher = new FuzzyMatcher();

export default FuzzyMatcher;
