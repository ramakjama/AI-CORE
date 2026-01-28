// ============================================================================
// GAMIFICATION TYPES - Sistema SORIS
// ============================================================================

export enum WalletType {
  CLIENT = 'CLIENT',
  AGENCY = 'AGENCY',
  OCCIDENT = 'OCCIDENT',
}

export enum TransactionType {
  CREDIT = 'CREDIT',         // Ingreso de Soris
  DEBIT = 'DEBIT',           // Gasto de Soris
  TRANSFER = 'TRANSFER',     // Transferencia entre wallets
  REWARD = 'REWARD',         // Recompensa
  DISCOUNT = 'DISCOUNT',     // Descuento aplicado
  REFUND = 'REFUND',         // Devolución
  ADJUSTMENT = 'ADJUSTMENT', // Ajuste manual
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REVERSED = 'REVERSED',
}

export enum DiscountStatus {
  PENDING = 'PENDING',
  APPLIED = 'APPLIED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface Wallet {
  id: string;
  type: WalletType;
  ownerId: string; // clientId, agencyId, or 'OCCIDENT'
  ownerName: string;
  balance: number; // Soris disponibles
  totalEarned: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number; // En Soris
  amountEur?: number; // Equivalente en EUR
  status: TransactionStatus;
  description: string;

  // Referencias
  referenceType?: string; // 'RECEIPT', 'POLICY', 'DISCOUNT'
  referenceId?: string;

  // Metadata
  metadata?: Record<string, any>;

  createdAt: Date;
  createdBy?: string;
  completedAt?: Date;
}

export interface Discount {
  id: string;

  // Referencia
  receiptId?: string;
  policyId?: string;

  // Cliente
  clientId: string;
  clientName: string;

  // Monto
  originalAmount: number; // EUR
  discountAmount: number; // EUR
  finalAmount: number; // EUR

  // Soris utilizados
  totalSorisUsed: number;

  // Breakdown de wallets
  sorisFromClient: number;
  sorisFromAgency: number;
  sorisFromOccident: number;

  // Tasa de conversión utilizada
  conversionRate: number; // 1 Soris = X EUR

  // Estado
  status: DiscountStatus;

  // Transacciones asociadas
  transactionIds: string[];

  // Metadata
  appliedAt: Date;
  appliedBy?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface ConversionRate {
  id: string;
  sorisToEur: number; // 1 Soris = X EUR
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdAt: Date;
}

// ============================================================================
// API DTOs
// ============================================================================

export interface GetWalletBalanceResponse {
  wallet: Wallet;
  balance: number;
  balanceEur: number;
  conversionRate: number;
}

export interface GetConversionRateResponse {
  sorisToEur: number;
  effectiveFrom: string;
  isActive: boolean;
}

export interface CalculateDiscountRequest {
  amount: number; // Monto total en EUR
  sorisToUse: number;
  clientWalletBalance: number;
  agencyWalletBalance: number;
  occidentWalletBalance: number;
  conversionRate: number;
}

export interface CalculateDiscountResponse {
  isValid: boolean;
  errorMessage?: string;
  discountAmount: number; // EUR
  finalAmount: number; // EUR
  breakdown: {
    fromClient: number;
    fromAgency: number;
    fromOccident: number;
  };
}

export interface ApplyDiscountRequest {
  receiptId?: string;
  policyId?: string;
  clientId: string;
  amount: number; // Monto original en EUR
  sorisToUse: number;
  breakdown: {
    fromClient: number;
    fromAgency: number;
    fromOccident: number;
  };
}

export interface ApplyDiscountResponse {
  discount: Discount;
  transactions: Transaction[];
  updatedWallets: {
    client?: Wallet;
    agency?: Wallet;
    occident?: Wallet;
  };
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface DiscountWidgetProps {
  receiptId?: string;
  policyId?: string;
  clientId: string;
  amount: number; // Monto total a pagar (en EUR)
  onDiscountApplied?: (discount: Discount) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

// ============================================================================
// INTERNAL STATE TYPES
// ============================================================================

export interface DiscountCalculation {
  discountAmount: number;
  finalAmount: number;
  breakdown: {
    fromClient: number;
    fromAgency: number;
    fromOccident: number;
  };
}

export interface WalletBalance {
  type: WalletType;
  balance: number;
  balanceEur: number;
  walletId: string;
  ownerName: string;
}

export interface DiscountWidgetState {
  // Wallets
  clientWallet?: WalletBalance;
  agencyWallet?: WalletBalance;
  occidentWallet?: WalletBalance;

  // Conversion rate
  conversionRate: number;

  // User input
  sorisToUse: number;

  // Calculation
  calculation?: DiscountCalculation;

  // UI state
  loading: boolean;
  applying: boolean;
  error: string | null;
  success: boolean;
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface DiscountValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}
