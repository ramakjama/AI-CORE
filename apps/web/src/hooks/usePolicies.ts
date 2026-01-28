/**
 * usePolicies Hook
 * Manages fetching and caching of insurance policies
 */

import { useState, useCallback, useEffect } from 'react';
import { Policy, PolicyFilters, PoliciesResponse, PolicyStats } from '@/types/policies';

interface UsePoliciesOptions {
  includeDocuments?: boolean;
  autoFetch?: boolean;
}

interface UsePoliciesReturn {
  policies: Policy[];
  loading: boolean;
  error: string | null;
  stats: PolicyStats | null;
  fetchPolicies: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage policies fetching and state
 */
export const usePolicies = (options: UsePoliciesOptions = {}): UsePoliciesReturn => {
  const { includeDocuments = true, autoFetch = true } = options;

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PolicyStats | null>(null);

  /**
   * Calculate policy statistics
   */
  const calculateStats = (policyList: Policy[]): PolicyStats => {
    const now = new Date();

    const calculateDaysUntilExpiration = (expirationDate: string): number => {
      const expDate = new Date(expirationDate);
      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    const active = policyList.filter((p) => p.status === 'ACTIVE').length;
    const expired = policyList.filter((p) => p.status === 'EXPIRED').length;
    const pending = policyList.filter((p) => p.status === 'PENDING').length;
    const cancelled = policyList.filter((p) => p.status === 'CANCELLED').length;
    const expiringSoon = policyList.filter(
      (p) =>
        p.status === 'ACTIVE' &&
        calculateDaysUntilExpiration(p.expirationDate) <= 30 &&
        calculateDaysUntilExpiration(p.expirationDate) > 0
    ).length;

    const totalPremium = policyList.reduce((sum, p) => sum + p.premium, 0);
    const averagePremium = policyList.length > 0 ? totalPremium / policyList.length : 0;

    return {
      total: policyList.length,
      active,
      expired,
      pending,
      cancelled,
      expiringSoon,
      totalPremium,
      averagePremium,
    };
  };

  /**
   * Fetch policies from API
   */
  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (includeDocuments) {
        params.append('includeDocuments', 'true');
      }

      const response = await fetch(`/api/policies?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch policies: ${response.statusText}`);
      }

      const data: PoliciesResponse | Policy[] = await response.json();
      const policyList = Array.isArray(data) ? data : data.policies || [];

      setPolicies(policyList);
      setStats(calculateStats(policyList));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching policies:', err);
    } finally {
      setLoading(false);
    }
  }, [includeDocuments]);

  /**
   * Refetch policies
   */
  const refetch = useCallback(async () => {
    await fetchPolicies();
  }, [fetchPolicies]);

  /**
   * Auto-fetch on mount if enabled
   */
  useEffect(() => {
    if (autoFetch) {
      fetchPolicies();
    }
  }, [autoFetch, fetchPolicies]);

  return {
    policies,
    loading,
    error,
    stats,
    fetchPolicies,
    refetch,
  };
};

/**
 * Hook to filter policies
 */
export const useFilteredPolicies = (policies: Policy[], filters: PolicyFilters = {}) => {
  const { searchTerm = '', types = [], statuses = [] } = filters;

  return policies.filter((policy) => {
    const matchesSearch =
      policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = types.length === 0 || types.includes(policy.type);
    const matchesStatus = statuses.length === 0 || statuses.includes(policy.status);

    return matchesSearch && matchesType && matchesStatus;
  });
};

/**
 * Hook to calculate days until expiration
 */
export const useDaysUntilExpiration = (expirationDate: string): number => {
  const [days, setDays] = useState(0);

  useEffect(() => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDays(diffDays);
  }, [expirationDate]);

  return days;
};

/**
 * Hook to check if policy is expiring soon
 */
export const useIsExpiringSoon = (expirationDate: string, threshold: number = 30): boolean => {
  const days = useDaysUntilExpiration(expirationDate);
  return days <= threshold && days > 0;
};
