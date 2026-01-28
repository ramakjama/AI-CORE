// ============================================================================
// USE DISCOUNT HOOK - React Hooks for Discount Management
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { gamificationAPI } from '@/lib/api/gamification';
import type {
  Discount,
  WalletBalance,
  DiscountCalculation,
  DiscountValidation,
} from '@/types/gamification';
import {
  calculateDiscountBreakdown,
  calculateMaxSoris,
  validateDiscount,
} from '@/lib/discount-utils';

// ============================================================================
// TYPES
// ============================================================================

export interface UseAvailableDiscountResult {
  // Wallets
  clientWallet?: WalletBalance;
  agencyWallet?: WalletBalance;
  occidentWallet?: WalletBalance;

  // Conversion
  conversionRate: number;

  // Max Soris
  maxSoris: number;
  maxDiscount: number; // En EUR

  // State
  loading: boolean;
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
}

export interface UseApplyDiscountResult {
  // State
  applying: boolean;
  error: string | null;
  success: boolean;
  appliedDiscount?: Discount;

  // Actions
  applyDiscount: (params: {
    receiptId?: string;
    policyId?: string;
    clientId: string;
    amount: number;
    sorisToUse: number;
    breakdown: {
      fromClient: number;
      fromAgency: number;
      fromOccident: number;
    };
  }) => Promise<Discount | null>;

  reset: () => void;
}

export interface UseDiscountCalculatorResult {
  // Input
  sorisToUse: number;
  setSorisToUse: (amount: number) => void;

  // Calculation
  calculation?: DiscountCalculation;
  validation: DiscountValidation;

  // Max values
  maxSoris: number;
  maxDiscount: number;

  // Helpers
  setPercentage: (percentage: number) => void;
  canApply: boolean;
}

// ============================================================================
// HOOK: useAvailableDiscount
// Loads wallet balances and calculates max available discount
// ============================================================================

export function useAvailableDiscount(
  clientId: string,
  receiptAmount: number
): UseAvailableDiscountResult {
  const [state, setState] = useState<{
    clientWallet?: WalletBalance;
    agencyWallet?: WalletBalance;
    occidentWallet?: WalletBalance;
    conversionRate: number;
    loading: boolean;
    error: string | null;
  }>({
    conversionRate: 0.1, // Default
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [rateResponse, walletsResponse] = await Promise.all([
        gamificationAPI.getConversionRate(),
        gamificationAPI.getAllWallets(clientId),
      ]);

      setState({
        conversionRate: rateResponse.sorisToEur,
        clientWallet: {
          type: 'CLIENT',
          balance: walletsResponse.client.balance,
          balanceEur: walletsResponse.client.balanceEur,
          walletId: walletsResponse.client.wallet.id,
          ownerName: walletsResponse.client.wallet.ownerName,
        },
        agencyWallet: {
          type: 'AGENCY',
          balance: walletsResponse.agency.balance,
          balanceEur: walletsResponse.agency.balanceEur,
          walletId: walletsResponse.agency.wallet.id,
          ownerName: walletsResponse.agency.wallet.ownerName,
        },
        occidentWallet: {
          type: 'OCCIDENT',
          balance: walletsResponse.occident.balance,
          balanceEur: walletsResponse.occident.balanceEur,
          walletId: walletsResponse.occident.wallet.id,
          ownerName: walletsResponse.occident.wallet.ownerName,
        },
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al cargar datos';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate max Soris and discount
  const maxSoris =
    state.clientWallet && state.agencyWallet && state.occidentWallet
      ? calculateMaxSoris(
          receiptAmount,
          state.clientWallet.balance,
          state.agencyWallet.balance,
          state.occidentWallet.balance,
          state.conversionRate
        )
      : 0;

  const maxDiscount = maxSoris * state.conversionRate;

  return {
    ...state,
    maxSoris,
    maxDiscount,
    refetch: fetchData,
  };
}

// ============================================================================
// HOOK: useApplyDiscount
// Handles discount application
// ============================================================================

export function useApplyDiscount(
  onSuccess?: (discount: Discount) => void,
  onError?: (error: string) => void
): UseApplyDiscountResult {
  const [state, setState] = useState<{
    applying: boolean;
    error: string | null;
    success: boolean;
    appliedDiscount?: Discount;
  }>({
    applying: false,
    error: null,
    success: false,
  });

  const applyDiscount = useCallback(
    async (params: {
      receiptId?: string;
      policyId?: string;
      clientId: string;
      amount: number;
      sorisToUse: number;
      breakdown: {
        fromClient: number;
        fromAgency: number;
        fromOccident: number;
      };
    }): Promise<Discount | null> => {
      setState({ applying: true, error: null, success: false });

      try {
        const response = await gamificationAPI.applyDiscount({
          receiptId: params.receiptId,
          policyId: params.policyId,
          clientId: params.clientId,
          amount: params.amount,
          sorisToUse: params.sorisToUse,
          breakdown: params.breakdown,
        });

        setState({
          applying: false,
          error: null,
          success: true,
          appliedDiscount: response.discount,
        });

        onSuccess?.(response.discount);
        return response.discount;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error al aplicar descuento';
        setState({
          applying: false,
          error: errorMessage,
          success: false,
        });
        onError?.(errorMessage);
        return null;
      }
    },
    [onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({
      applying: false,
      error: null,
      success: false,
      appliedDiscount: undefined,
    });
  }, []);

  return {
    ...state,
    applyDiscount,
    reset,
  };
}

// ============================================================================
// HOOK: useDiscountCalculator
// Manages discount calculation and validation
// ============================================================================

export function useDiscountCalculator(
  receiptAmount: number,
  clientBalance: number,
  agencyBalance: number,
  occidentBalance: number,
  conversionRate: number
): UseDiscountCalculatorResult {
  const [sorisToUse, setSorisToUse] = useState(0);

  // Calculate max Soris
  const maxSoris = calculateMaxSoris(
    receiptAmount,
    clientBalance,
    agencyBalance,
    occidentBalance,
    conversionRate
  );

  const maxDiscount = maxSoris * conversionRate;

  // Calculate discount breakdown
  const calculation =
    sorisToUse > 0
      ? {
          ...calculateDiscountBreakdown(
            sorisToUse,
            clientBalance,
            agencyBalance,
            occidentBalance,
            conversionRate
          ),
          finalAmount:
            receiptAmount -
            calculateDiscountBreakdown(
              sorisToUse,
              clientBalance,
              agencyBalance,
              occidentBalance,
              conversionRate
            ).discountAmount,
        }
      : undefined;

  // Validate
  const validation = validateDiscount(
    sorisToUse,
    receiptAmount,
    clientBalance,
    agencyBalance,
    occidentBalance,
    conversionRate
  );

  // Set percentage helper
  const setPercentage = useCallback(
    (percentage: number) => {
      const amount = Math.floor((percentage / 100) * maxSoris);
      setSorisToUse(amount);
    },
    [maxSoris]
  );

  return {
    sorisToUse,
    setSorisToUse,
    calculation,
    validation,
    maxSoris,
    maxDiscount,
    setPercentage,
    canApply: validation.isValid && sorisToUse > 0,
  };
}

// ============================================================================
// HOOK: useDiscount (Combined)
// All-in-one hook for discount management
// ============================================================================

export function useDiscount(
  clientId: string,
  receiptId: string | undefined,
  receiptAmount: number,
  onDiscountApplied?: (discount: Discount) => void,
  onError?: (error: string) => void
) {
  // Load available discount
  const availableDiscount = useAvailableDiscount(clientId, receiptAmount);

  // Calculator
  const calculator = useDiscountCalculator(
    receiptAmount,
    availableDiscount.clientWallet?.balance || 0,
    availableDiscount.agencyWallet?.balance || 0,
    availableDiscount.occidentWallet?.balance || 0,
    availableDiscount.conversionRate
  );

  // Apply discount
  const applyResult = useApplyDiscount(onDiscountApplied, onError);

  // Apply discount handler
  const handleApplyDiscount = useCallback(async () => {
    if (!calculator.calculation || !calculator.canApply) return null;

    return await applyResult.applyDiscount({
      receiptId,
      clientId,
      amount: receiptAmount,
      sorisToUse: calculator.sorisToUse,
      breakdown: calculator.calculation.breakdown,
    });
  }, [
    calculator.calculation,
    calculator.canApply,
    calculator.sorisToUse,
    applyResult,
    receiptId,
    clientId,
    receiptAmount,
  ]);

  return {
    // Wallets
    clientWallet: availableDiscount.clientWallet,
    agencyWallet: availableDiscount.agencyWallet,
    occidentWallet: availableDiscount.occidentWallet,
    conversionRate: availableDiscount.conversionRate,

    // Max values
    maxSoris: availableDiscount.maxSoris,
    maxDiscount: availableDiscount.maxDiscount,

    // Calculator
    sorisToUse: calculator.sorisToUse,
    setSorisToUse: calculator.setSorisToUse,
    setPercentage: calculator.setPercentage,
    calculation: calculator.calculation,
    validation: calculator.validation,
    canApply: calculator.canApply,

    // Apply
    applying: applyResult.applying,
    applyDiscount: handleApplyDiscount,
    appliedDiscount: applyResult.appliedDiscount,
    success: applyResult.success,

    // State
    loading: availableDiscount.loading,
    error: availableDiscount.error || applyResult.error,

    // Actions
    refetch: availableDiscount.refetch,
    reset: applyResult.reset,
  };
}

// Default export
export default useDiscount;
