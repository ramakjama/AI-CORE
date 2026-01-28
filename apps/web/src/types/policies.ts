/**
 * Policy Types and Interfaces
 * Defines the structure for insurance policies across the application
 */

/**
 * Policy status enumeration
 */
export type PolicyStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED';

/**
 * Policy type enumeration
 * AUTO: Vehicle insurance
 * HOGAR: Home/Property insurance
 * VIDA: Life insurance
 * SALUD: Health insurance
 */
export type PolicyType = 'AUTO' | 'HOGAR' | 'VIDA' | 'SALUD';

/**
 * Document associated with a policy
 */
export interface PolicyDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt?: string;
}

/**
 * Core insurance policy data
 */
export interface Policy {
  id: string;
  policyNumber: string;
  type: PolicyType;
  company: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  premium: number;
  status: PolicyStatus;
  expirationDate: string;
  startDate: string;
  description?: string;
  documents?: PolicyDocument[];
  coverage?: string;
  insuranceAmount?: number;
  deductible?: number;
  policyHolder?: string;
  beneficiary?: string;
}

/**
 * API response for policies list
 */
export interface PoliciesResponse {
  policies: Policy[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Filter options for policies
 */
export interface PolicyFilters {
  searchTerm?: string;
  types?: PolicyType[];
  statuses?: PolicyStatus[];
  sortBy?: 'createdAt' | 'expirationDate' | 'premium';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Policy statistics
 */
export interface PolicyStats {
  total: number;
  active: number;
  expired: number;
  pending: number;
  cancelled: number;
  expiringSoon: number;
  totalPremium: number;
  averagePremium: number;
}

/**
 * Policy creation/update payload
 */
export interface CreatePolicyPayload {
  policyNumber: string;
  type: PolicyType;
  company: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  premium: number;
  status: PolicyStatus;
  expirationDate: string;
  startDate: string;
  description?: string;
  coverage?: string;
  insuranceAmount?: number;
  deductible?: number;
  policyHolder?: string;
  beneficiary?: string;
}

/**
 * Configuration for policy types
 */
export interface PolicyTypeConfig {
  value: PolicyType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

/**
 * Configuration for policy statuses
 */
export interface StatusConfig {
  bg: string;
  text: string;
  label: string;
  badge: string;
  icon?: React.ComponentType<{ className?: string }>;
}
