/**
 * AI-Finance Module
 * Módulo de contabilidad y finanzas con soporte para:
 * - Plan General Contable (PGC) español
 * - Modelos AEAT (303, 390, 347, 349)
 * - Integración SII (Suministro Inmediato de Información)
 * - Pagos SEPA (transferencias y adeudos)
 * - Factura electrónica (Facturae)
 */

// ============================================================================
// TYPES
// ============================================================================

export {
  // Enums
  AccountType,
  JournalStatus,
  InvoiceStatus,
  PaymentStatus,
  VATType,
  SIIOperationType,
  SIIStatus,
  TaxDeclarationType,
  ReconciliationStatus,

  // Interfaces - Plan General Contable
  ChartOfAccounts,
  Account,
  AccountingPeriod,

  // Interfaces - Asientos Contables
  JournalEntry,
  JournalLine,

  // Interfaces - Facturación
  Invoice,
  InvoiceLine,
  VATBreakdown,
  Address,
  ElectronicInvoice,

  // Interfaces - Pagos
  Payment,
  PaymentMethod,
  PaymentAllocation,

  // Interfaces - Banca
  BankAccount,
  BankTransaction,
  Reconciliation,
  ReconciliationLine,

  // Interfaces - Impuestos y SII
  TaxDeclaration,
  SIIRecord,
  SIIVATDetail,

  // Interfaces - Reporting
  TrialBalance,
  TrialBalanceAccount,
  BalanceSheet,
  BalanceSheetSection,
  BalanceSheetItem,
  IncomeStatement,
  IncomeStatementSection,
  IncomeStatementItem,
  GeneralLedger,
  GeneralLedgerEntry,
  FinancialKPIs,
  CashFlowReport,
  CashFlowSection,
  CashFlowForecast,
  CashFlowProjection,
  CashFlowDetail,
  AgedReport,
  AgedPartner,
  AgedInvoice,

  // Interfaces - SEPA
  SEPABatch,
  SEPAPayment,

  // Interfaces - Exportación
  ExportConfig,
  ExportResult,

  // Type Utilities
  AccountingResult,
  MovementQueryOptions,
  InvoiceQueryOptions,
} from './types';

// ============================================================================
// SERVICES
// ============================================================================

// Accounting Service - Contabilidad
export {
  AccountingService,
  accountingService,
} from './services/accounting.service';

// Invoicing Service - Facturación
export {
  InvoicingService,
  invoicingService,
} from './services/invoicing.service';

// Treasury Service - Tesorería
export {
  TreasuryService,
  treasuryService,
} from './services/treasury.service';

// Tax Service - Impuestos
export {
  TaxService,
  taxService,
} from './services/tax.service';

// ============================================================================
// VERSION INFO
// ============================================================================

export const VERSION = '1.0.0';
export const MODULE_NAME = '@ai-core/ai-finance';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Crea un asiento contable y lo contabiliza
 */
export async function createAndPostJournalEntry(input: {
  periodId: string;
  date: Date;
  description: string;
  reference?: string;
  lines: Array<{
    accountCode: string;
    debit: number;
    credit: number;
    description?: string;
  }>;
}) {
  const { accountingService } = await import('./services/accounting.service');

  const createResult = await accountingService.createJournalEntry(input);
  if (!createResult.success || !createResult.data) {
    return createResult;
  }

  return accountingService.postJournalEntry(createResult.data.id);
}

/**
 * Crea y envía una factura
 */
export async function createAndSendInvoice(input: {
  type: 'ISSUED' | 'RECEIVED';
  partnerId: string;
  partnerName: string;
  partnerVAT: string;
  issueDate: Date;
  dueDate: Date;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatType: import('./types').VATType;
    vatRate: number;
  }>;
}) {
  const { invoicingService } = await import('./services/invoicing.service');

  const createResult = await invoicingService.createInvoice(input);
  if (!createResult.success || !createResult.data) {
    return createResult;
  }

  return invoicingService.sendInvoice(createResult.data.id);
}

/**
 * Genera los modelos fiscales del trimestre
 */
export async function generateQuarterlyTaxReports(period: string) {
  const { taxService } = await import('./services/tax.service');

  const results = {
    model303: await taxService.generateModel303(period),
    // model349 solo si hay operaciones intracomunitarias
    model349: await taxService.generateModel349(period),
  };

  return results;
}

/**
 * Crea y ejecuta un lote de pagos SEPA
 */
export async function createAndExecuteSEPABatch(input: {
  payments: Array<{
    creditorName: string;
    creditorIBAN: string;
    amount: number;
    remittanceInfo: string;
  }>;
  requestedExecutionDate: Date;
}) {
  const { treasuryService } = await import('./services/treasury.service');

  const createResult = await treasuryService.createPaymentBatch(input);
  if (!createResult.success || !createResult.data) {
    return createResult;
  }

  return treasuryService.executeSEPATransfer(createResult.data.id);
}
