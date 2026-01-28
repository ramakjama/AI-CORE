// ============================================================================
// DISCOUNT CALCULATION UTILITIES
// ============================================================================

import type {
  DiscountCalculation,
  DiscountValidation,
  ValidationError,
} from '@/types/gamification';

// ============================================================================
// FORMAT UTILITIES
// ============================================================================

/**
 * Format number as EUR currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number as Soris (with suffix)
 */
export function formatSoris(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' Soris';
}

/**
 * Format number as compact (1.2K, 5.3K, etc.)
 */
export function formatCompact(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(amount);
}

// ============================================================================
// CALCULATION LOGIC
// ============================================================================

/**
 * Calculate discount breakdown based on wallet balances
 * Order: Cliente → Agencia → Occident
 */
export function calculateDiscountBreakdown(
  sorisToUse: number,
  clientBalance: number,
  agencyBalance: number,
  occidentBalance: number,
  conversionRate: number
): DiscountCalculation {
  let remaining = sorisToUse;
  let fromClient = 0;
  let fromAgency = 0;
  let fromOccident = 0;

  // 1. Primero del cliente
  if (remaining > 0 && clientBalance > 0) {
    fromClient = Math.min(remaining, clientBalance);
    remaining -= fromClient;
  }

  // 2. Luego de la agencia
  if (remaining > 0 && agencyBalance > 0) {
    fromAgency = Math.min(remaining, agencyBalance);
    remaining -= fromAgency;
  }

  // 3. Finalmente de Occident
  if (remaining > 0 && occidentBalance > 0) {
    fromOccident = Math.min(remaining, occidentBalance);
    remaining -= fromOccident;
  }

  const discountAmount = sorisToUse * conversionRate;

  return {
    discountAmount,
    finalAmount: 0, // Will be calculated by caller
    breakdown: {
      fromClient,
      fromAgency,
      fromOccident,
    },
  };
}

/**
 * Calculate maximum Soris that can be used
 */
export function calculateMaxSoris(
  amount: number,
  clientBalance: number,
  agencyBalance: number,
  occidentBalance: number,
  conversionRate: number
): number {
  const totalBalance = clientBalance + agencyBalance + occidentBalance;
  const maxFromAmount = Math.floor(amount / conversionRate);
  return Math.min(totalBalance, maxFromAmount);
}

/**
 * Get percentage of amount
 */
export function getPercentageOfMax(
  percentage: number,
  maxSoris: number
): number {
  return Math.floor((percentage / 100) * maxSoris);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate discount parameters
 */
export function validateDiscount(
  sorisToUse: number,
  amount: number,
  clientBalance: number,
  agencyBalance: number,
  occidentBalance: number,
  conversionRate: number,
  options?: {
    minSoris?: number;
    maxDiscountPercent?: number;
  }
): DiscountValidation {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  const minSoris = options?.minSoris ?? 1;
  const maxDiscountPercent = options?.maxDiscountPercent ?? 100;

  // Validate amount
  if (amount <= 0) {
    errors.push({
      field: 'amount',
      message: 'El importe debe ser mayor que 0',
    });
  }

  // Validate sorisToUse
  if (sorisToUse < minSoris) {
    errors.push({
      field: 'sorisToUse',
      message: `Debes usar al menos ${minSoris} Soris`,
    });
  }

  if (sorisToUse <= 0) {
    errors.push({
      field: 'sorisToUse',
      message: 'Debes seleccionar una cantidad de Soris a usar',
    });
  }

  // Check available balance
  const totalBalance = clientBalance + agencyBalance + occidentBalance;
  if (sorisToUse > totalBalance) {
    errors.push({
      field: 'sorisToUse',
      message: `No hay suficientes Soris disponibles. Máximo: ${formatSoris(totalBalance)}`,
    });
  }

  // Check discount doesn't exceed amount
  const discountAmount = sorisToUse * conversionRate;
  if (discountAmount > amount) {
    errors.push({
      field: 'sorisToUse',
      message: `El descuento (${formatCurrency(discountAmount)}) no puede exceder el importe (${formatCurrency(amount)})`,
    });
  }

  // Check max discount percentage
  const discountPercent = (discountAmount / amount) * 100;
  if (discountPercent > maxDiscountPercent) {
    errors.push({
      field: 'sorisToUse',
      message: `El descuento no puede superar el ${maxDiscountPercent}% del importe`,
    });
  }

  // Warnings
  if (totalBalance === 0) {
    warnings.push('No tienes Soris disponibles. Gana Soris pagando tus pólizas a tiempo.');
  }

  if (sorisToUse > clientBalance) {
    const agencyUsed = Math.min(sorisToUse - clientBalance, agencyBalance);
    const occidentUsed = Math.max(0, sorisToUse - clientBalance - agencyBalance);

    if (agencyUsed > 0) {
      warnings.push(`Se usarán ${formatSoris(agencyUsed)} de la agencia`);
    }
    if (occidentUsed > 0) {
      warnings.push(`Se usarán ${formatSoris(occidentUsed)} de Occident`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get discount percentage
 */
export function getDiscountPercentage(
  discountAmount: number,
  originalAmount: number
): number {
  if (originalAmount === 0) return 0;
  return (discountAmount / originalAmount) * 100;
}

/**
 * Determine which wallet will be primarily used
 */
export function getPrimaryWalletUsed(
  sorisToUse: number,
  clientBalance: number,
  agencyBalance: number,
  occidentBalance: number
): 'client' | 'agency' | 'occident' | 'multiple' {
  if (sorisToUse <= clientBalance) return 'client';
  if (sorisToUse <= clientBalance + agencyBalance) {
    return clientBalance > 0 ? 'multiple' : 'agency';
  }
  if (sorisToUse <= clientBalance + agencyBalance + occidentBalance) {
    return clientBalance + agencyBalance > 0 ? 'multiple' : 'occident';
  }
  return 'multiple';
}

/**
 * Format breakdown as text
 */
export function formatBreakdown(breakdown: {
  fromClient: number;
  fromAgency: number;
  fromOccident: number;
}): string[] {
  const lines: string[] = [];

  if (breakdown.fromClient > 0) {
    lines.push(`${formatSoris(breakdown.fromClient)} de tu wallet`);
  }
  if (breakdown.fromAgency > 0) {
    lines.push(`${formatSoris(breakdown.fromAgency)} de la agencia`);
  }
  if (breakdown.fromOccident > 0) {
    lines.push(`${formatSoris(breakdown.fromOccident)} de Occident`);
  }

  return lines;
}

/**
 * Check if discount can be applied
 */
export function canApplyDiscount(
  sorisToUse: number,
  amount: number,
  clientBalance: number,
  agencyBalance: number,
  occidentBalance: number,
  conversionRate: number
): { canApply: boolean; reason?: string } {
  const validation = validateDiscount(
    sorisToUse,
    amount,
    clientBalance,
    agencyBalance,
    occidentBalance,
    conversionRate
  );

  if (!validation.isValid) {
    return {
      canApply: false,
      reason: validation.errors[0]?.message || 'Error de validación',
    };
  }

  return { canApply: true };
}
