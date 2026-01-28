/**
 * Policy Utility Functions
 * Helper functions for policy handling and formatting
 */

import { Policy, PolicyStatus, PolicyType, PolicyStats, StatusConfig, PolicyTypeConfig } from '@/types/policies';
import { Shield, Car, Home, Heart } from 'lucide-react';

/**
 * Format date to Spanish locale
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format currency to EUR
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

/**
 * Calculate days until expiration
 */
export const calculateDaysUntilExpiration = (expirationDate: string | Date): number => {
  const today = new Date();
  const expDate = typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if policy is expiring soon (within 30 days)
 */
export const isExpiringSoon = (expirationDate: string | Date, threshold: number = 30): boolean => {
  const days = calculateDaysUntilExpiration(expirationDate);
  return days <= threshold && days > 0;
};

/**
 * Check if policy is expired
 */
export const isExpired = (expirationDate: string | Date): boolean => {
  return calculateDaysUntilExpiration(expirationDate) <= 0;
};

/**
 * Get policy type configuration
 */
export const getPolicyTypeConfig = (type: PolicyType): PolicyTypeConfig => {
  const configs: Record<PolicyType, PolicyTypeConfig> = {
    AUTO: {
      value: 'AUTO',
      label: 'Seguros de Auto',
      icon: Car,
      color: 'text-blue-600',
    },
    HOGAR: {
      value: 'HOGAR',
      label: 'Seguros de Hogar',
      icon: Home,
      color: 'text-amber-600',
    },
    VIDA: {
      value: 'VIDA',
      label: 'Seguros de Vida',
      icon: Heart,
      color: 'text-red-600',
    },
    SALUD: {
      value: 'SALUD',
      label: 'Seguros de Salud',
      icon: Shield,
      color: 'text-green-600',
    },
  };

  return configs[type];
};

/**
 * Get status configuration
 */
export const getStatusConfig = (status: PolicyStatus): StatusConfig => {
  const configs: Record<PolicyStatus, StatusConfig> = {
    ACTIVE: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-800 dark:text-green-200',
      label: 'Activa',
      badge: 'bg-green-200 dark:bg-green-800',
    },
    EXPIRED: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-800 dark:text-red-200',
      label: 'Vencida',
      badge: 'bg-red-200 dark:bg-red-800',
    },
    PENDING: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-800 dark:text-yellow-200',
      label: 'Pendiente',
      badge: 'bg-yellow-200 dark:bg-yellow-800',
    },
    CANCELLED: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      text: 'text-gray-800 dark:text-gray-200',
      label: 'Cancelada',
      badge: 'bg-gray-200 dark:bg-gray-800',
    },
  };

  return configs[status];
};

/**
 * Calculate policy statistics from list
 */
export const calculatePolicyStats = (policies: Policy[]): PolicyStats => {
  const active = policies.filter((p) => p.status === 'ACTIVE').length;
  const expired = policies.filter((p) => p.status === 'EXPIRED').length;
  const pending = policies.filter((p) => p.status === 'PENDING').length;
  const cancelled = policies.filter((p) => p.status === 'CANCELLED').length;
  const expiringSoon = policies.filter((p) => isExpiringSoon(p.expirationDate)).length;

  const totalPremium = policies.reduce((sum, p) => sum + p.premium, 0);
  const averagePremium = policies.length > 0 ? totalPremium / policies.length : 0;

  return {
    total: policies.length,
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
 * Sort policies by various criteria
 */
export const sortPolicies = (
  policies: Policy[],
  sortBy: 'createdAt' | 'expirationDate' | 'premium' = 'expirationDate',
  sortOrder: 'asc' | 'desc' = 'asc'
): Policy[] => {
  const sorted = [...policies];

  sorted.sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'premium':
        aValue = a.premium;
        bValue = b.premium;
        break;
      case 'expirationDate':
        aValue = new Date(a.expirationDate).getTime();
        bValue = new Date(b.expirationDate).getTime();
        break;
      case 'createdAt':
      default:
        aValue = a.id;
        bValue = b.id;
    }

    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return sorted;
};

/**
 * Get status message for policy
 */
export const getStatusMessage = (status: PolicyStatus): string => {
  const messages: Record<PolicyStatus, string> = {
    ACTIVE: 'Tu póliza está activa y en vigor. Disfrutas de todas las coberturas.',
    EXPIRED: 'Tu póliza ha expirado. Contacta al asegurador para renovarla.',
    PENDING: 'Tu póliza está pendiente de activación. Se activará en breve.',
    CANCELLED: 'Tu póliza ha sido cancelada.',
  };

  return messages[status];
};

/**
 * Export policies to CSV format
 */
export const exportPoliciesAsCSV = (policies: Policy[]): string => {
  const headers = ['Número de Póliza', 'Tipo', 'Compañía', 'Prima', 'Estado', 'Inicio', 'Vencimiento'];
  const rows = policies.map((p) => [
    p.policyNumber,
    p.type,
    p.company,
    formatCurrency(p.premium),
    getStatusConfig(p.status).label,
    formatDate(p.startDate),
    formatDate(p.expirationDate),
  ]);

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

  return csvContent;
};

/**
 * Download CSV file
 */
export const downloadCSV = (policies: Policy[], filename: string = 'polizas.csv'): void => {
  const csvContent = exportPoliciesAsCSV(policies);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Validate policy data
 */
export const validatePolicy = (policy: Partial<Policy>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!policy.policyNumber) {
    errors.push('El número de póliza es requerido');
  }

  if (!policy.type) {
    errors.push('El tipo de póliza es requerido');
  }

  if (!policy.company) {
    errors.push('La compañía es requerida');
  }

  if (policy.premium === undefined || policy.premium < 0) {
    errors.push('La prima debe ser un número positivo');
  }

  if (!policy.status) {
    errors.push('El estado es requerido');
  }

  if (!policy.expirationDate) {
    errors.push('La fecha de vencimiento es requerida');
  }

  if (!policy.startDate) {
    errors.push('La fecha de inicio es requerida');
  }

  if (policy.startDate && policy.expirationDate && new Date(policy.startDate) >= new Date(policy.expirationDate)) {
    errors.push('La fecha de inicio debe ser anterior a la fecha de vencimiento');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
