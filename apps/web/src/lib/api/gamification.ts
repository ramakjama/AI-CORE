// ============================================================================
// GAMIFICATION API CLIENT
// ============================================================================

import type {
  GetWalletBalanceResponse,
  GetConversionRateResponse,
  CalculateDiscountRequest,
  CalculateDiscountResponse,
  ApplyDiscountRequest,
  ApplyDiscountResponse,
  Wallet,
  Transaction,
} from '@/types/gamification';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const GAMIFICATION_BASE = `${API_BASE_URL}/api/gamification`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `API Error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

// ============================================================================
// WALLET ENDPOINTS
// ============================================================================

/**
 * Get client wallet balance
 */
export async function getClientWallet(
  clientId: string
): Promise<GetWalletBalanceResponse> {
  return fetchAPI<GetWalletBalanceResponse>(
    `${GAMIFICATION_BASE}/wallets/client/${clientId}`
  );
}

/**
 * Get agency wallet balance
 */
export async function getAgencyWallet(
  agencyId: string
): Promise<GetWalletBalanceResponse> {
  return fetchAPI<GetWalletBalanceResponse>(
    `${GAMIFICATION_BASE}/wallets/agency/${agencyId}`
  );
}

/**
 * Get Occident wallet balance
 */
export async function getOccidentWallet(): Promise<GetWalletBalanceResponse> {
  return fetchAPI<GetWalletBalanceResponse>(
    `${GAMIFICATION_BASE}/wallets/occident`
  );
}

/**
 * Get all wallets (client, agency, occident)
 */
export async function getAllWallets(
  clientId: string,
  agencyId: string = 'default'
): Promise<{
  client: GetWalletBalanceResponse;
  agency: GetWalletBalanceResponse;
  occident: GetWalletBalanceResponse;
}> {
  const [client, agency, occident] = await Promise.all([
    getClientWallet(clientId),
    getAgencyWallet(agencyId),
    getOccidentWallet(),
  ]);

  return { client, agency, occident };
}

// ============================================================================
// CONVERSION RATE ENDPOINTS
// ============================================================================

/**
 * Get current conversion rate (Soris to EUR)
 */
export async function getConversionRate(): Promise<GetConversionRateResponse> {
  return fetchAPI<GetConversionRateResponse>(
    `${GAMIFICATION_BASE}/conversion-rate`
  );
}

// ============================================================================
// DISCOUNT ENDPOINTS
// ============================================================================

/**
 * Calculate discount (dry-run, no DB changes)
 */
export async function calculateDiscount(
  request: CalculateDiscountRequest
): Promise<CalculateDiscountResponse> {
  return fetchAPI<CalculateDiscountResponse>(
    `${GAMIFICATION_BASE}/discounts/calculate`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}

/**
 * Apply discount (commits to database)
 */
export async function applyDiscount(
  request: ApplyDiscountRequest
): Promise<ApplyDiscountResponse> {
  return fetchAPI<ApplyDiscountResponse>(
    `${GAMIFICATION_BASE}/discounts/apply`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}

/**
 * Get discount by ID
 */
export async function getDiscount(discountId: string): Promise<ApplyDiscountResponse> {
  return fetchAPI<ApplyDiscountResponse>(
    `${GAMIFICATION_BASE}/discounts/${discountId}`
  );
}

/**
 * Cancel discount (reverses transactions)
 */
export async function cancelDiscount(
  discountId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return fetchAPI<{ success: boolean; message: string }>(
    `${GAMIFICATION_BASE}/discounts/${discountId}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }
  );
}

/**
 * Get discounts for a client
 */
export async function getClientDiscounts(
  clientId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }
): Promise<{ discounts: ApplyDiscountResponse[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());
  if (options?.status) params.set('status', options.status);

  return fetchAPI<{ discounts: ApplyDiscountResponse[]; total: number }>(
    `${GAMIFICATION_BASE}/discounts/client/${clientId}?${params.toString()}`
  );
}

// ============================================================================
// TRANSACTION ENDPOINTS
// ============================================================================

/**
 * Get transactions for a wallet
 */
export async function getWalletTransactions(
  walletId: string,
  options?: {
    limit?: number;
    offset?: number;
    type?: string;
  }
): Promise<{ transactions: Transaction[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());
  if (options?.type) params.set('type', options.type);

  return fetchAPI<{ transactions: Transaction[]; total: number }>(
    `${GAMIFICATION_BASE}/transactions/wallet/${walletId}?${params.toString()}`
  );
}

/**
 * Get transaction by ID
 */
export async function getTransaction(transactionId: string): Promise<Transaction> {
  return fetchAPI<Transaction>(
    `${GAMIFICATION_BASE}/transactions/${transactionId}`
  );
}

// ============================================================================
// REWARDS ENDPOINTS (for future use)
// ============================================================================

/**
 * Award Soris to client (for commissions, etc.)
 */
export async function awardSoris(
  clientId: string,
  amount: number,
  description: string,
  metadata?: Record<string, any>
): Promise<Transaction> {
  return fetchAPI<Transaction>(
    `${GAMIFICATION_BASE}/rewards/award`,
    {
      method: 'POST',
      body: JSON.stringify({
        clientId,
        amount,
        description,
        metadata,
      }),
    }
  );
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const gamificationAPI = {
  // Wallets
  getClientWallet,
  getAgencyWallet,
  getOccidentWallet,
  getAllWallets,

  // Conversion Rate
  getConversionRate,

  // Discounts
  calculateDiscount,
  applyDiscount,
  getDiscount,
  cancelDiscount,
  getClientDiscounts,

  // Transactions
  getWalletTransactions,
  getTransaction,

  // Rewards
  awardSoris,
};

export default gamificationAPI;
