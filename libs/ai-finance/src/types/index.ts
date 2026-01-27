/**
 * AI-Finance Types
 * Tipos para contabilidad y finanzas con soporte PGC español
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Tipos de cuenta según PGC español
 */
export enum AccountType {
  // Grupo 1 - Financiación básica
  EQUITY = 'EQUITY',                           // Capital
  RESERVES = 'RESERVES',                       // Reservas
  LONG_TERM_DEBT = 'LONG_TERM_DEBT',          // Deudas a largo plazo

  // Grupo 2 - Activo no corriente
  FIXED_ASSET = 'FIXED_ASSET',                // Inmovilizado
  INTANGIBLE = 'INTANGIBLE',                  // Inmovilizado intangible
  FINANCIAL_ASSET = 'FINANCIAL_ASSET',        // Inversiones financieras

  // Grupo 3 - Existencias
  INVENTORY = 'INVENTORY',                    // Existencias

  // Grupo 4 - Acreedores y deudores
  RECEIVABLE = 'RECEIVABLE',                  // Deudores
  PAYABLE = 'PAYABLE',                        // Acreedores
  TAX_RECEIVABLE = 'TAX_RECEIVABLE',          // Hacienda Pública deudora
  TAX_PAYABLE = 'TAX_PAYABLE',                // Hacienda Pública acreedora

  // Grupo 5 - Cuentas financieras
  BANK = 'BANK',                              // Bancos
  CASH = 'CASH',                              // Caja
  SHORT_TERM_INVESTMENT = 'SHORT_TERM_INVESTMENT', // Inversiones financieras c/p

  // Grupo 6 - Compras y gastos
  EXPENSE = 'EXPENSE',                        // Gastos
  PURCHASE = 'PURCHASE',                      // Compras

  // Grupo 7 - Ventas e ingresos
  REVENUE = 'REVENUE',                        // Ingresos
  SALES = 'SALES',                            // Ventas

  // Grupos especiales
  DEPRECIATION = 'DEPRECIATION',              // Amortizaciones
  PROVISION = 'PROVISION',                    // Provisiones
}

/**
 * Estado del asiento contable
 */
export enum JournalStatus {
  DRAFT = 'DRAFT',           // Borrador
  PENDING = 'PENDING',       // Pendiente de revisión
  POSTED = 'POSTED',         // Contabilizado
  REVERSED = 'REVERSED',     // Anulado/Extornado
}

/**
 * Estado de la factura
 */
export enum InvoiceStatus {
  DRAFT = 'DRAFT',           // Borrador
  VALIDATED = 'VALIDATED',   // Validada
  SENT = 'SENT',             // Enviada
  PARTIAL = 'PARTIAL',       // Parcialmente cobrada
  PAID = 'PAID',             // Cobrada/Pagada
  OVERDUE = 'OVERDUE',       // Vencida
  CANCELLED = 'CANCELLED',   // Anulada
}

/**
 * Estado del pago
 */
export enum PaymentStatus {
  PENDING = 'PENDING',       // Pendiente
  PROCESSING = 'PROCESSING', // En proceso
  COMPLETED = 'COMPLETED',   // Completado
  FAILED = 'FAILED',         // Fallido
  CANCELLED = 'CANCELLED',   // Cancelado
  REFUNDED = 'REFUNDED',     // Reembolsado
}

/**
 * Tipo de IVA según normativa española
 */
export enum VATType {
  GENERAL = 'GENERAL',                 // 21%
  REDUCED = 'REDUCED',                 // 10%
  SUPER_REDUCED = 'SUPER_REDUCED',     // 4%
  EXEMPT = 'EXEMPT',                   // Exento
  NOT_SUBJECT = 'NOT_SUBJECT',         // No sujeto
  INTRA_EU = 'INTRA_EU',               // Intracomunitario
  REVERSE_CHARGE = 'REVERSE_CHARGE',   // Inversión del sujeto pasivo
}

/**
 * Tipo de operación SII
 */
export enum SIIOperationType {
  EMITIDA = 'F1',           // Factura emitida
  RECIBIDA = 'F2',          // Factura recibida
  RECTIFICATIVA = 'R1',     // Factura rectificativa
  SIMPLIFICADA = 'F3',      // Factura simplificada
}

/**
 * Estado del registro SII
 */
export enum SIIStatus {
  PENDING = 'PENDING',           // Pendiente de envío
  SENT = 'SENT',                 // Enviado
  ACCEPTED = 'ACCEPTED',         // Aceptado
  ACCEPTED_ERRORS = 'ACCEPTED_ERRORS', // Aceptado con errores
  REJECTED = 'REJECTED',         // Rechazado
}

/**
 * Tipo de declaración fiscal
 */
export enum TaxDeclarationType {
  MODEL_303 = 'MODEL_303',   // IVA trimestral
  MODEL_390 = 'MODEL_390',   // IVA resumen anual
  MODEL_347 = 'MODEL_347',   // Operaciones con terceros
  MODEL_349 = 'MODEL_349',   // Operaciones intracomunitarias
  MODEL_111 = 'MODEL_111',   // Retenciones IRPF
  MODEL_115 = 'MODEL_115',   // Retenciones alquileres
  MODEL_200 = 'MODEL_200',   // Impuesto de sociedades
}

/**
 * Estado de conciliación bancaria
 */
export enum ReconciliationStatus {
  PENDING = 'PENDING',       // Pendiente
  MATCHED = 'MATCHED',       // Conciliado
  PARTIAL = 'PARTIAL',       // Parcialmente conciliado
  UNMATCHED = 'UNMATCHED',   // Sin conciliar
}

// ============================================================================
// INTERFACES - Plan General Contable
// ============================================================================

/**
 * Plan de cuentas
 */
export interface ChartOfAccounts {
  id: string;
  code: string;                    // Ej: 'PGC2007'
  name: string;
  description?: string;
  country: string;                 // 'ES' para España
  version: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  accounts: Account[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cuenta contable
 */
export interface Account {
  id: string;
  code: string;                    // Código PGC: 430, 4300001, etc.
  name: string;
  description?: string;
  type: AccountType;
  parentCode?: string;             // Cuenta padre
  level: number;                   // Nivel en la jerarquía (1-8)
  isGroup: boolean;                // Si es cuenta de grupo
  allowMovements: boolean;         // Si permite apuntes
  currency: string;                // EUR por defecto

  // Configuración contable
  debitNature: boolean;            // Naturaleza deudora
  creditNature: boolean;           // Naturaleza acreedora

  // Control
  isActive: boolean;
  isReconcilable: boolean;         // Si requiere conciliación
  costCenter?: string;             // Centro de coste asociado

  // Saldos (calculados)
  balance?: number;
  debitBalance?: number;
  creditBalance?: number;

  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Período contable / Ejercicio
 */
export interface AccountingPeriod {
  id: string;
  code: string;                    // Ej: '2024', '2024-Q1'
  name: string;
  fiscalYear: number;
  startDate: Date;
  endDate: Date;

  // Estado
  isClosed: boolean;
  isLocked: boolean;               // Bloqueado para modificaciones
  closedAt?: Date;
  closedBy?: string;

  // Fechas especiales
  cutoffDate?: Date;               // Fecha de corte

  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// INTERFACES - Asientos Contables
// ============================================================================

/**
 * Asiento contable (Journal Entry)
 */
export interface JournalEntry {
  id: string;
  number: string;                  // Número de asiento
  periodId: string;                // Período contable
  date: Date;                      // Fecha del asiento

  // Descripción
  description: string;
  reference?: string;              // Referencia externa
  documentType?: string;           // Tipo de documento origen
  documentNumber?: string;         // Número de documento

  // Líneas
  lines: JournalLine[];

  // Totales
  totalDebit: number;
  totalCredit: number;

  // Estado
  status: JournalStatus;
  postedAt?: Date;
  postedBy?: string;

  // Reversión
  isReversal: boolean;
  reversalOf?: string;             // ID del asiento original
  reversedBy?: string;             // ID del asiento de reversión
  reversalReason?: string;

  // Auditoría
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  metadata?: Record<string, unknown>;
}

/**
 * Línea de asiento contable
 */
export interface JournalLine {
  id: string;
  entryId: string;
  lineNumber: number;

  // Cuenta
  accountCode: string;
  accountName?: string;

  // Importes
  debit: number;
  credit: number;

  // Descripción
  description?: string;

  // Analítica
  costCenter?: string;
  project?: string;
  department?: string;

  // Tercero
  partnerId?: string;              // Cliente/Proveedor
  partnerName?: string;

  // Conciliación
  isReconciled: boolean;
  reconciliationId?: string;

  // Documento relacionado
  invoiceId?: string;
  paymentId?: string;

  metadata?: Record<string, unknown>;
}

// ============================================================================
// INTERFACES - Facturación
// ============================================================================

/**
 * Factura
 */
export interface Invoice {
  id: string;
  number: string;                  // Número de factura
  series?: string;                 // Serie de factura

  // Tipo
  type: 'ISSUED' | 'RECEIVED';     // Emitida o recibida
  isRectificative: boolean;        // Factura rectificativa
  rectifiedInvoiceId?: string;     // Factura rectificada

  // Fechas
  issueDate: Date;
  operationDate?: Date;            // Fecha de operación
  dueDate: Date;

  // Tercero
  partnerId: string;
  partnerName: string;
  partnerVAT: string;              // NIF/CIF
  partnerAddress?: Address;

  // Líneas
  lines: InvoiceLine[];

  // Importes
  subtotal: number;                // Base imponible total
  totalTax: number;                // Total impuestos
  totalWithholding: number;        // Total retenciones
  total: number;                   // Total factura
  currency: string;
  exchangeRate?: number;

  // Desglose IVA
  vatBreakdown: VATBreakdown[];

  // Pagos
  payments: Payment[];
  paidAmount: number;
  pendingAmount: number;

  // Estado
  status: InvoiceStatus;

  // Contabilidad
  journalEntryId?: string;
  accountingDate?: Date;

  // SII (Suministro Inmediato de Información)
  siiRecord?: SIIRecord;

  // Factura electrónica
  electronicInvoice?: ElectronicInvoice;

  // Notas
  notes?: string;
  internalNotes?: string;

  // Auditoría
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  metadata?: Record<string, unknown>;
}

/**
 * Línea de factura
 */
export interface InvoiceLine {
  id: string;
  invoiceId: string;
  lineNumber: number;

  // Producto/Servicio
  productId?: string;
  productCode?: string;
  description: string;

  // Cantidades
  quantity: number;
  unitPrice: number;
  discount: number;                // Porcentaje de descuento
  discountAmount: number;

  // Importes
  subtotal: number;                // Base imponible línea

  // Impuestos
  vatType: VATType;
  vatRate: number;                 // Tipo de IVA (21, 10, 4, 0)
  vatAmount: number;

  // Retención
  withholdingRate?: number;        // Tipo de retención IRPF
  withholdingAmount?: number;

  // Recargo de equivalencia
  surchargeRate?: number;
  surchargeAmount?: number;

  // Contabilidad
  accountCode?: string;            // Cuenta de ingreso/gasto
  costCenter?: string;

  total: number;

  metadata?: Record<string, unknown>;
}

/**
 * Desglose de IVA
 */
export interface VATBreakdown {
  vatType: VATType;
  vatRate: number;
  baseAmount: number;              // Base imponible
  vatAmount: number;               // Cuota de IVA
  surchargeRate?: number;          // Recargo equivalencia
  surchargeAmount?: number;
}

/**
 * Dirección
 */
export interface Address {
  street: string;
  city: string;
  postalCode: string;
  province?: string;
  country: string;                 // Código ISO
}

/**
 * Factura electrónica (Facturae)
 */
export interface ElectronicInvoice {
  id: string;
  invoiceId: string;
  format: 'FACTURAE' | 'UBL';      // Formato
  version: string;                 // Ej: '3.2.2'
  xmlContent?: string;
  pdfContent?: string;
  signature?: string;
  signedAt?: Date;
  sentAt?: Date;
  deliveryMethod?: string;
  status: 'PENDING' | 'GENERATED' | 'SIGNED' | 'SENT' | 'DELIVERED' | 'REJECTED';
  errorMessage?: string;
}

// ============================================================================
// INTERFACES - Pagos
// ============================================================================

/**
 * Pago
 */
export interface Payment {
  id: string;
  number: string;

  // Tipo
  type: 'INCOMING' | 'OUTGOING';   // Cobro o pago
  method: PaymentMethod;

  // Fechas
  date: Date;
  valueDate?: Date;                // Fecha valor

  // Tercero
  partnerId: string;
  partnerName: string;

  // Importes
  amount: number;
  currency: string;
  exchangeRate?: number;

  // Cuenta bancaria
  bankAccountId?: string;

  // Facturas
  invoiceAllocations: PaymentAllocation[];

  // Estado
  status: PaymentStatus;

  // SEPA
  sepaTransferId?: string;
  sepaBatchId?: string;

  // Contabilidad
  journalEntryId?: string;

  // Referencias
  reference?: string;
  bankReference?: string;

  notes?: string;

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  metadata?: Record<string, unknown>;
}

/**
 * Método de pago
 */
export type PaymentMethod =
  | 'CASH'                         // Efectivo
  | 'BANK_TRANSFER'                // Transferencia
  | 'SEPA_TRANSFER'                // Transferencia SEPA
  | 'SEPA_DIRECT_DEBIT'            // Adeudo directo SEPA
  | 'CHECK'                        // Cheque
  | 'CARD'                         // Tarjeta
  | 'CONFIRMING'                   // Confirming
  | 'PROMISSORY_NOTE'              // Pagaré
  | 'BILL_OF_EXCHANGE';            // Letra de cambio

/**
 * Asignación de pago a factura
 */
export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  allocatedAt: Date;
}

// ============================================================================
// INTERFACES - Banca
// ============================================================================

/**
 * Cuenta bancaria
 */
export interface BankAccount {
  id: string;

  // Identificación
  name: string;
  iban: string;
  bic?: string;                    // Código SWIFT/BIC

  // Entidad
  bankName: string;
  bankCode?: string;

  // Titular
  holderName: string;
  holderVAT?: string;

  // Contabilidad
  accountCode: string;             // Cuenta contable asociada (572xxxx)

  // Saldos
  currentBalance: number;
  availableBalance?: number;
  lastSyncedAt?: Date;

  // Configuración
  currency: string;
  isDefault: boolean;
  isActive: boolean;

  // SEPA
  sepaCreditorId?: string;         // Identificador de acreedor SEPA

  // Conexión bancaria
  bankConnectionId?: string;

  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Movimiento bancario
 */
export interface BankTransaction {
  id: string;
  bankAccountId: string;

  // Identificación
  transactionId: string;           // ID del banco
  reference?: string;

  // Fechas
  transactionDate: Date;
  valueDate: Date;
  bookingDate?: Date;

  // Importes
  amount: number;
  balance?: number;                // Saldo tras movimiento
  currency: string;

  // Descripción
  description: string;
  concept?: string;

  // Contraparte
  counterpartyName?: string;
  counterpartyIBAN?: string;

  // Tipo
  type: 'CREDIT' | 'DEBIT';
  category?: string;

  // Conciliación
  reconciliationStatus: ReconciliationStatus;
  reconciliationId?: string;
  matchedPaymentId?: string;
  matchedInvoiceId?: string;

  // Contabilidad
  journalEntryId?: string;

  // Origen
  source: 'IMPORT' | 'MANUAL' | 'API';
  importBatchId?: string;

  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Conciliación bancaria
 */
export interface Reconciliation {
  id: string;
  bankAccountId: string;

  // Período
  periodStart: Date;
  periodEnd: Date;

  // Saldos
  openingBalance: number;
  closingBalance: number;
  statementBalance: number;

  // Movimientos
  transactions: ReconciliationLine[];

  // Diferencias
  difference: number;

  // Estado
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: Date;
  completedBy?: string;

  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Línea de conciliación
 */
export interface ReconciliationLine {
  id: string;
  reconciliationId: string;
  bankTransactionId: string;

  // Contrapartida contable
  journalLineId?: string;
  paymentId?: string;

  // Estado
  status: ReconciliationStatus;
  matchType?: 'AUTOMATIC' | 'MANUAL' | 'RULE';

  // Diferencias
  bankAmount: number;
  accountingAmount?: number;
  difference?: number;

  notes?: string;
}

// ============================================================================
// INTERFACES - Impuestos y SII
// ============================================================================

/**
 * Declaración fiscal
 */
export interface TaxDeclaration {
  id: string;

  // Tipo
  type: TaxDeclarationType;

  // Período
  fiscalYear: number;
  period: string;                  // '1T', '2T', '3T', '4T' o '00' (anual)

  // Importes principales
  data: Record<string, number>;    // Casillas del modelo

  // Resultado
  result: number;                  // A ingresar (+) o a devolver (-)

  // Estado
  status: 'DRAFT' | 'CALCULATED' | 'VALIDATED' | 'SUBMITTED' | 'PAID';

  // Presentación
  submissionDate?: Date;
  submissionReference?: string;

  // Pago
  paymentDate?: Date;
  paymentReference?: string;

  // Archivos
  xmlFile?: string;
  pdfFile?: string;

  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Registro SII (Suministro Inmediato de Información)
 */
export interface SIIRecord {
  id: string;
  invoiceId: string;

  // Tipo de registro
  bookType: 'EMITIDAS' | 'RECIBIDAS';
  operationType: SIIOperationType;

  // Identificación de factura
  invoiceNumber: string;
  invoiceDate: Date;

  // NIF contraparte
  counterpartyVAT: string;
  counterpartyName: string;
  counterpartyCountry: string;

  // Importes
  totalAmount: number;
  taxableBase: number;
  taxAmount: number;

  // Desglose
  vatBreakdown: SIIVATDetail[];

  // Clave de régimen especial
  specialSchemeKey?: string;

  // Estado
  status: SIIStatus;

  // Envío
  sentAt?: Date;
  responseCode?: string;
  responseMessage?: string;
  csv?: string;                    // Código Seguro de Verificación

  // Reintentos
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;

  // XML
  requestXml?: string;
  responseXml?: string;

  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Detalle IVA para SII
 */
export interface SIIVATDetail {
  vatType: string;                 // Tipo impositivo
  vatRate: number;
  taxableBase: number;
  taxAmount: number;
  surchargeRate?: number;
  surchargeAmount?: number;
}

// ============================================================================
// INTERFACES - Reporting
// ============================================================================

/**
 * Balance de sumas y saldos
 */
export interface TrialBalance {
  periodId: string;
  asOfDate: Date;
  accounts: TrialBalanceAccount[];
  totalDebit: number;
  totalCredit: number;
  generatedAt: Date;
}

/**
 * Cuenta en balance de sumas y saldos
 */
export interface TrialBalanceAccount {
  accountCode: string;
  accountName: string;
  level: number;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

/**
 * Balance de situación
 */
export interface BalanceSheet {
  asOfDate: Date;
  periodId: string;

  // Activo
  assets: BalanceSheetSection;

  // Pasivo
  liabilities: BalanceSheetSection;

  // Patrimonio neto
  equity: BalanceSheetSection;

  // Totales
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;

  generatedAt: Date;
}

/**
 * Sección del balance
 */
export interface BalanceSheetSection {
  name: string;
  items: BalanceSheetItem[];
  total: number;
}

/**
 * Partida del balance
 */
export interface BalanceSheetItem {
  code: string;
  name: string;
  currentPeriod: number;
  previousPeriod?: number;
  children?: BalanceSheetItem[];
}

/**
 * Cuenta de pérdidas y ganancias
 */
export interface IncomeStatement {
  periodId: string;
  startDate: Date;
  endDate: Date;

  // Ingresos
  revenue: IncomeStatementSection;

  // Gastos
  expenses: IncomeStatementSection;

  // Resultados
  grossProfit: number;
  operatingProfit: number;
  profitBeforeTax: number;
  netProfit: number;

  generatedAt: Date;
}

/**
 * Sección de PyG
 */
export interface IncomeStatementSection {
  name: string;
  items: IncomeStatementItem[];
  total: number;
}

/**
 * Partida de PyG
 */
export interface IncomeStatementItem {
  code: string;
  name: string;
  currentPeriod: number;
  previousPeriod?: number;
  percentage?: number;             // % sobre ventas
}

/**
 * Libro mayor
 */
export interface GeneralLedger {
  accountCode: string;
  accountName: string;
  periodId: string;
  startDate: Date;
  endDate: Date;
  openingBalance: number;
  entries: GeneralLedgerEntry[];
  closingBalance: number;
}

/**
 * Entrada del libro mayor
 */
export interface GeneralLedgerEntry {
  date: Date;
  entryNumber: string;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
  partnerId?: string;
  partnerName?: string;
}

/**
 * KPIs financieros
 */
export interface FinancialKPIs {
  periodId: string;
  asOfDate: Date;

  // Liquidez
  currentRatio: number;            // Ratio de liquidez
  quickRatio: number;              // Prueba ácida
  cashRatio: number;               // Ratio de tesorería

  // Solvencia
  debtRatio: number;               // Ratio de endeudamiento
  equityRatio: number;             // Ratio de autonomía

  // Rentabilidad
  grossMargin: number;             // Margen bruto
  operatingMargin: number;         // Margen operativo
  netMargin: number;               // Margen neto
  roa: number;                     // Return on Assets
  roe: number;                     // Return on Equity

  // Actividad
  inventoryTurnover?: number;      // Rotación de inventario
  receivablesTurnover?: number;    // Rotación de cuentas a cobrar
  payablesTurnover?: number;       // Rotación de cuentas a pagar

  // Otros
  workingCapital: number;          // Fondo de maniobra
  ebitda: number;
}

/**
 * Informe de flujo de caja
 */
export interface CashFlowReport {
  startDate: Date;
  endDate: Date;

  // Flujo de operaciones
  operatingCashFlow: CashFlowSection;

  // Flujo de inversiones
  investingCashFlow: CashFlowSection;

  // Flujo de financiación
  financingCashFlow: CashFlowSection;

  // Totales
  netCashFlow: number;
  openingCash: number;
  closingCash: number;

  generatedAt: Date;
}

/**
 * Sección de flujo de caja
 */
export interface CashFlowSection {
  name: string;
  items: CashFlowItem[];
  total: number;
}

/**
 * Partida de flujo de caja
 */
export interface CashFlowItem {
  description: string;
  amount: number;
  category?: string;
}

/**
 * Previsión de tesorería
 */
export interface CashFlowForecast {
  startDate: Date;
  endDate: Date;
  initialBalance: number;

  projections: CashFlowProjection[];

  finalBalance: number;
  minimumBalance: number;
  maximumBalance: number;

  generatedAt: Date;
}

/**
 * Proyección diaria de tesorería
 */
export interface CashFlowProjection {
  date: Date;
  inflows: number;
  outflows: number;
  netFlow: number;
  balance: number;

  // Detalle
  inflowDetails?: CashFlowDetail[];
  outflowDetails?: CashFlowDetail[];
}

/**
 * Detalle de movimiento proyectado
 */
export interface CashFlowDetail {
  description: string;
  amount: number;
  source: 'INVOICE' | 'PAYMENT' | 'RECURRING' | 'MANUAL';
  reference?: string;
  probability?: number;            // Probabilidad de ocurrencia
}

/**
 * Informe de antigüedad de saldos
 */
export interface AgedReport {
  type: 'RECEIVABLES' | 'PAYABLES';
  asOfDate: Date;

  partners: AgedPartner[];

  // Totales por tramo
  current: number;                 // No vencido
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days91to120: number;
  over120days: number;

  total: number;

  generatedAt: Date;
}

/**
 * Cliente/Proveedor en informe de antigüedad
 */
export interface AgedPartner {
  partnerId: string;
  partnerName: string;
  partnerVAT?: string;

  // Importes por tramo
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days91to120: number;
  over120days: number;

  total: number;

  // Detalle de facturas
  invoices?: AgedInvoice[];
}

/**
 * Factura en informe de antigüedad
 */
export interface AgedInvoice {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  daysOverdue: number;
  originalAmount: number;
  pendingAmount: number;
}

// ============================================================================
// INTERFACES - SEPA
// ============================================================================

/**
 * Lote de pagos SEPA
 */
export interface SEPABatch {
  id: string;

  // Tipo
  type: 'CREDIT_TRANSFER' | 'DIRECT_DEBIT';

  // Identificación
  messageId: string;
  creationDateTime: Date;

  // Ordenante
  initiatorName: string;
  initiatorId?: string;
  bankAccountId: string;

  // Pagos
  payments: SEPAPayment[];
  numberOfTransactions: number;
  controlSum: number;

  // Estado
  status: 'DRAFT' | 'VALIDATED' | 'GENERATED' | 'SENT' | 'PROCESSED' | 'REJECTED';

  // Archivo
  xmlFile?: string;
  generatedAt?: Date;
  sentAt?: Date;

  // Respuesta
  responseFile?: string;
  processedAt?: Date;

  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Pago SEPA individual
 */
export interface SEPAPayment {
  id: string;
  batchId: string;

  // Identificación
  endToEndId: string;
  instructionId?: string;

  // Beneficiario
  creditorName: string;
  creditorIBAN: string;
  creditorBIC?: string;
  creditorAddress?: Address;

  // Importe
  amount: number;
  currency: string;

  // Concepto
  remittanceInfo: string;

  // Fecha
  requestedExecutionDate: Date;

  // Estado
  status: 'PENDING' | 'INCLUDED' | 'EXECUTED' | 'REJECTED';
  rejectionReason?: string;

  // Referencias
  paymentId?: string;
  invoiceIds?: string[];

  metadata?: Record<string, unknown>;
}

// ============================================================================
// INTERFACES - Reporting Exportación
// ============================================================================

/**
 * Configuración de exportación
 */
export interface ExportConfig {
  format: 'EXCEL' | 'PDF' | 'CSV' | 'XML';
  template?: string;
  includeCharts?: boolean;
  language?: string;
  dateFormat?: string;
  numberFormat?: string;
}

/**
 * Resultado de exportación
 */
export interface ExportResult {
  id: string;
  reportType: string;
  format: string;
  fileName: string;
  fileSize: number;
  filePath?: string;
  fileContent?: Buffer;
  generatedAt: Date;
  expiresAt?: Date;
}

// ============================================================================
// TYPE UTILITIES
// ============================================================================

/**
 * Resultado de operación contable
 */
export interface AccountingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
  journalEntryId?: string;
}

/**
 * Opciones de consulta de movimientos
 */
export interface MovementQueryOptions {
  accountCode?: string;
  startDate?: Date;
  endDate?: Date;
  periodId?: string;
  partnerId?: string;
  status?: JournalStatus;
  includeReversed?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'date' | 'number' | 'amount';
  orderDirection?: 'ASC' | 'DESC';
}

/**
 * Opciones de consulta de facturas
 */
export interface InvoiceQueryOptions {
  type?: 'ISSUED' | 'RECEIVED';
  status?: InvoiceStatus | InvoiceStatus[];
  partnerId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  includeLines?: boolean;
  includePayments?: boolean;
  limit?: number;
  offset?: number;
}
