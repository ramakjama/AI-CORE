/**
 * Bank Integration Interfaces
 */

export interface BankConnection {
  id: string;
  bankId: string;
  bankName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING_AUTH';
  accounts: BankAccount[];
  lastSync: Date;
  expiresAt: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface BankAccount {
  id: string;
  connectionId: string;
  accountNumber: string;
  iban: string;
  accountName: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'CREDIT';
  balance: Balance;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  capabilities: AccountCapability[];
}

export interface Balance {
  available: number;
  current: number;
  limit?: number;
  currency: string;
  lastUpdate: Date;
}

export type AccountCapability =
  | 'VIEW_BALANCE'
  | 'VIEW_TRANSACTIONS'
  | 'INITIATE_PAYMENTS'
  | 'STANDING_ORDERS'
  | 'DIRECT_DEBITS';

export interface BankCredentials {
  bankId: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  authorizationCode?: string;
  redirectUri?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  transactionId: string;
  bookingDate: Date;
  valueDate: Date;
  amount: number;
  currency: string;
  creditorName?: string;
  creditorAccount?: string;
  debtorName?: string;
  debtorAccount?: string;
  remittanceInformation: string;
  status: 'BOOKED' | 'PENDING';
  type: 'CREDIT' | 'DEBIT';
  category?: string;
  balance?: number;
}

export interface Payment {
  id: string;
  accountId: string;
  paymentId: string;
  status: PaymentStatus;
  type: 'SEPA_CREDIT' | 'SEPA_INSTANT' | 'DOMESTIC' | 'INTERNATIONAL';
  amount: number;
  currency: string;
  creditorName: string;
  creditorIban: string;
  creditorBic?: string;
  debtorName: string;
  debtorIban: string;
  reference: string;
  endToEndId: string;
  executionDate: Date;
  valueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
  fees?: PaymentFee[];
  metadata?: Record<string, any>;
}

export type PaymentStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface PaymentFee {
  type: 'BANK_FEE' | 'SWIFT_FEE' | 'EXCHANGE_FEE' | 'OTHER';
  amount: number;
  currency: string;
  description: string;
}

export interface PaymentBatch {
  id: string;
  accountId: string;
  batchId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIALLY_FAILED' | 'FAILED';
  totalPayments: number;
  totalAmount: number;
  currency: string;
  payments: Payment[];
  executionDate: Date;
  createdBy: string;
  createdAt: Date;
  processedAt?: Date;
  results?: PaymentBatchResult;
}

export interface PaymentBatchResult {
  successful: number;
  failed: number;
  rejected: number;
  totalProcessed: number;
  failedPayments: FailedPayment[];
  summary: string;
}

export interface FailedPayment {
  paymentId: string;
  reference: string;
  amount: number;
  creditorName: string;
  reason: string;
  errorCode?: string;
}

export interface StandingOrder {
  id: string;
  accountId: string;
  standingOrderId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  creditorName: string;
  creditorIban: string;
  amount: number;
  currency: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: Date;
  endDate?: Date;
  nextExecutionDate: Date;
  reference: string;
  createdAt: Date;
}

export interface DirectDebit {
  id: string;
  accountId: string;
  mandateId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  creditorName: string;
  creditorId: string;
  type: 'CORE' | 'B2B';
  maxAmount?: number;
  createdAt: Date;
  lastExecutionDate?: Date;
  executionHistory: DirectDebitExecution[];
}

export interface DirectDebitExecution {
  id: string;
  executionDate: Date;
  amount: number;
  reference: string;
  status: 'COMPLETED' | 'REVERSED' | 'FAILED';
}

export interface BankIntegrationConfig {
  enabled: boolean;
  provider: 'NORDIGEN' | 'PLAID' | 'YAPILY' | 'TINK' | 'CUSTOM';
  apiUrl: string;
  apiKey: string;
  apiSecret?: string;
  sandbox: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
  supportedBanks: SupportedBank[];
}

export interface SupportedBank {
  id: string;
  name: string;
  bic: string;
  logo?: string;
  countries: string[];
  capabilities: AccountCapability[];
  requiresManualAuth: boolean;
}
