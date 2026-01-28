/**
 * Cash Management Interfaces
 */

export interface CashPosition {
  totalBalance: number;
  availableBalance: number;
  reservedBalance: number;
  blockedBalance: number;
  accounts: CashAccount[];
  lastUpdate: Date;
  currency: string;
}

export interface CashAccount {
  id: string;
  name: string;
  bankName: string;
  iban: string;
  balance: number;
  availableBalance: number;
  currency: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'CREDIT';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  lastSync: Date;
}

export interface CashMovement {
  id: string;
  accountId: string;
  type: 'INFLOW' | 'OUTFLOW';
  category: MovementCategory;
  amount: number;
  currency: string;
  description: string;
  reference: string;
  executionDate: Date;
  valueDate: Date;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  createdBy: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export type MovementCategory =
  | 'PREMIUM_COLLECTION'
  | 'COMMISSION'
  | 'CLAIM_PAYMENT'
  | 'SUPPLIER_PAYMENT'
  | 'SALARY'
  | 'TAX'
  | 'LOAN'
  | 'INVESTMENT'
  | 'BANK_FEE'
  | 'OTHER';

export interface ReconciliationResult {
  accountId: string;
  date: Date;
  bookBalance: number;
  bankBalance: number;
  difference: number;
  matched: number;
  unmatched: number;
  movements: CashMovement[];
  statements: BankStatement[];
  discrepancies: Discrepancy[];
  status: 'RECONCILED' | 'PENDING' | 'DISCREPANCY';
}

export interface BankStatement {
  id: string;
  accountId: string;
  transactionDate: Date;
  valueDate: Date;
  amount: number;
  description: string;
  reference: string;
  balance: number;
  matched: boolean;
  matchedMovementId?: string;
}

export interface Discrepancy {
  id: string;
  type: 'MISSING_BOOK' | 'MISSING_BANK' | 'AMOUNT_MISMATCH' | 'DATE_MISMATCH';
  description: string;
  bookAmount?: number;
  bankAmount?: number;
  difference?: number;
  reference?: string;
}

export interface ImportResult {
  accountId: string;
  fileName: string;
  totalStatements: number;
  imported: number;
  duplicates: number;
  errors: number;
  errorDetails: string[];
  importedAt: Date;
}

export interface MatchResult {
  movementId: string;
  statementId: string;
  confidence: number;
  matchType: 'EXACT' | 'FUZZY' | 'MANUAL';
  matched: boolean;
  reason?: string;
}

export interface Alert {
  id: string;
  type: 'LOW_BALANCE' | 'OVERDRAFT' | 'CASH_SHORTAGE' | 'UNUSUAL_MOVEMENT';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  accountId?: string;
  message: string;
  amount?: number;
  threshold?: number;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface Shortage {
  date: Date;
  projectedBalance: number;
  requiredAmount: number;
  shortage: number;
  probability: number;
  recommendations: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
