/**
 * AI Insurance Types
 * Tipos completos para la gestión de seguros en España
 */

// ============================================================================
// ENUMS - Estados y tipos
// ============================================================================

/**
 * Estado de la póliza
 */
export enum PolicyStatus {
  DRAFT = 'DRAFT',                    // Borrador
  PENDING_APPROVAL = 'PENDING_APPROVAL', // Pendiente de aprobación
  ACTIVE = 'ACTIVE',                  // En vigor
  SUSPENDED = 'SUSPENDED',            // Suspendida (impago)
  CANCELLED = 'CANCELLED',            // Anulada
  EXPIRED = 'EXPIRED',                // Vencida
  RENEWED = 'RENEWED'                 // Renovada
}

/**
 * Tipo de póliza
 */
export enum PolicyType {
  INDIVIDUAL = 'INDIVIDUAL',          // Individual
  COLLECTIVE = 'COLLECTIVE',          // Colectiva
  FLEET = 'FLEET',                    // Flota (autos)
  GROUP = 'GROUP',                    // Grupo
  MASTER = 'MASTER'                   // Póliza madre
}

/**
 * Tipo de cobertura
 */
export enum CoverageType {
  // Coberturas generales
  BASIC = 'BASIC',                    // Básica
  COMPREHENSIVE = 'COMPREHENSIVE',     // Todo riesgo
  THIRD_PARTY = 'THIRD_PARTY',        // Responsabilidad civil

  // Auto
  RC_OBLIGATORIO = 'RC_OBLIGATORIO',  // RC Obligatorio
  RC_VOLUNTARIO = 'RC_VOLUNTARIO',    // RC Voluntario
  DEFENSA_JURIDICA = 'DEFENSA_JURIDICA', // Defensa jurídica
  ROBO = 'ROBO',                      // Robo
  INCENDIO = 'INCENDIO',              // Incendio
  LUNAS = 'LUNAS',                    // Lunas
  DANOS_PROPIOS = 'DANOS_PROPIOS',    // Daños propios
  ASISTENCIA_VIAJE = 'ASISTENCIA_VIAJE', // Asistencia en viaje

  // Hogar
  CONTINENTE = 'CONTINENTE',          // Continente
  CONTENIDO = 'CONTENIDO',            // Contenido
  RC_FAMILIAR = 'RC_FAMILIAR',        // RC Familiar
  AGUA = 'AGUA',                      // Daños por agua
  ROTURA_CRISTALES = 'ROTURA_CRISTALES', // Rotura de cristales

  // Vida
  FALLECIMIENTO = 'FALLECIMIENTO',    // Fallecimiento
  IPA = 'IPA',                        // Invalidez Permanente Absoluta
  IPT = 'IPT',                        // Invalidez Permanente Total
  ENFERMEDADES_GRAVES = 'ENFERMEDADES_GRAVES', // Enfermedades graves

  // Salud
  HOSPITALIZACION = 'HOSPITALIZACION', // Hospitalización
  AMBULATORIO = 'AMBULATORIO',        // Ambulatorio
  DENTAL = 'DENTAL',                  // Dental
  OPTICA = 'OPTICA'                   // Óptica
}

/**
 * Ramo de seguro
 */
export enum InsuranceBranch {
  AUTO = 'AUTO',                      // Automóviles
  HOGAR = 'HOGAR',                    // Hogar
  VIDA = 'VIDA',                      // Vida
  SALUD = 'SALUD',                    // Salud
  DECESOS = 'DECESOS',                // Decesos
  ACCIDENTES = 'ACCIDENTES',          // Accidentes
  RC_GENERAL = 'RC_GENERAL',          // RC General
  COMERCIO = 'COMERCIO',              // Comercio
  PYME = 'PYME',                      // PYME
  COMUNIDADES = 'COMUNIDADES',        // Comunidades
  TRANSPORTE = 'TRANSPORTE',          // Transporte
  CREDITO = 'CREDITO',                // Crédito
  CAUCION = 'CAUCION'                 // Caución
}

/**
 * Estado del recibo
 */
export enum ReceiptStatus {
  PENDING = 'PENDING',                // Pendiente de cobro
  PAID = 'PAID',                      // Cobrado
  UNPAID = 'UNPAID',                  // Impagado (devuelto)
  CANCELLED = 'CANCELLED',            // Anulado
  REFUNDED = 'REFUNDED',              // Reembolsado
  PARTIAL = 'PARTIAL',                // Pago parcial
  IN_COLLECTION = 'IN_COLLECTION'     // En gestión de cobro
}

/**
 * Método de pago
 */
export enum PaymentMethod {
  DIRECT_DEBIT = 'DIRECT_DEBIT',      // Domiciliación bancaria
  BANK_TRANSFER = 'BANK_TRANSFER',    // Transferencia bancaria
  CREDIT_CARD = 'CREDIT_CARD',        // Tarjeta de crédito
  DEBIT_CARD = 'DEBIT_CARD',          // Tarjeta de débito
  CASH = 'CASH',                      // Efectivo
  CHECK = 'CHECK',                    // Cheque
  BIZUM = 'BIZUM',                    // Bizum
  FINANCING = 'FINANCING'             // Financiación externa
}

/**
 * Frecuencia de pago
 */
export enum PaymentFrequency {
  ANNUAL = 'ANNUAL',                  // Anual (sin recargo)
  BIANNUAL = 'BIANNUAL',              // Semestral
  QUARTERLY = 'QUARTERLY',            // Trimestral
  MONTHLY = 'MONTHLY',                // Mensual
  SINGLE = 'SINGLE'                   // Pago único
}

/**
 * Estado del siniestro
 */
export enum ClaimStatus {
  REPORTED = 'REPORTED',              // Comunicado
  UNDER_REVIEW = 'UNDER_REVIEW',      // En estudio
  PENDING_DOCS = 'PENDING_DOCS',      // Pendiente documentación
  ASSIGNED = 'ASSIGNED',              // Asignado a perito
  IN_PROGRESS = 'IN_PROGRESS',        // En tramitación
  APPROVED = 'APPROVED',              // Aprobado
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED', // Aprobado parcialmente
  REJECTED = 'REJECTED',              // Rechazado
  CLOSED = 'CLOSED',                  // Cerrado
  REOPENED = 'REOPENED',              // Reabierto
  IN_LITIGATION = 'IN_LITIGATION',    // En litigio
  FRAUD_SUSPECTED = 'FRAUD_SUSPECTED' // Sospecha de fraude
}

/**
 * Tipo de siniestro
 */
export enum ClaimType {
  // Auto
  COLLISION = 'COLLISION',            // Colisión
  THEFT = 'THEFT',                    // Robo
  VANDALISM = 'VANDALISM',            // Vandalismo
  FIRE = 'FIRE',                      // Incendio
  NATURAL_DISASTER = 'NATURAL_DISASTER', // Catástrofe natural
  GLASS_BREAKAGE = 'GLASS_BREAKAGE',  // Rotura de lunas
  ROADSIDE_ASSISTANCE = 'ROADSIDE_ASSISTANCE', // Asistencia en carretera

  // Hogar
  WATER_DAMAGE = 'WATER_DAMAGE',      // Daños por agua
  ELECTRICAL = 'ELECTRICAL',          // Daños eléctricos
  BURGLARY = 'BURGLARY',              // Robo en vivienda
  LIABILITY = 'LIABILITY',            // Responsabilidad civil

  // Vida/Salud
  DEATH = 'DEATH',                    // Fallecimiento
  DISABILITY = 'DISABILITY',          // Invalidez
  HOSPITALIZATION = 'HOSPITALIZATION', // Hospitalización
  MEDICAL = 'MEDICAL',                // Gastos médicos

  // General
  OTHER = 'OTHER'                     // Otros
}

/**
 * Tipo de reserva
 */
export enum ReserveType {
  INITIAL = 'INITIAL',                // Reserva inicial
  ADJUSTED = 'ADJUSTED',              // Reserva ajustada
  FINAL = 'FINAL',                    // Reserva final
  RECOVERY = 'RECOVERY',              // Recobro esperado
  LITIGATION = 'LITIGATION'           // Reserva por litigio
}

/**
 * Tipo de suplemento
 */
export enum EndorsementType {
  MODIFICATION = 'MODIFICATION',       // Modificación de datos
  COVERAGE_INCREASE = 'COVERAGE_INCREASE', // Aumento de cobertura
  COVERAGE_DECREASE = 'COVERAGE_DECREASE', // Disminución de cobertura
  ADD_COVERAGE = 'ADD_COVERAGE',       // Alta de cobertura
  REMOVE_COVERAGE = 'REMOVE_COVERAGE', // Baja de cobertura
  RISK_CHANGE = 'RISK_CHANGE',         // Cambio de riesgo
  BENEFICIARY_CHANGE = 'BENEFICIARY_CHANGE', // Cambio de beneficiario
  HOLDER_CHANGE = 'HOLDER_CHANGE',     // Cambio de tomador
  CANCELLATION = 'CANCELLATION',       // Anulación
  REINSTATEMENT = 'REINSTATEMENT',     // Rehabilitación
  RENEWAL = 'RENEWAL'                  // Renovación
}

/**
 * Estado de liquidación de comisiones
 */
export enum SettlementStatus {
  DRAFT = 'DRAFT',                    // Borrador
  PENDING = 'PENDING',                // Pendiente de pago
  APPROVED = 'APPROVED',              // Aprobada
  PAID = 'PAID',                      // Pagada
  PARTIALLY_PAID = 'PARTIALLY_PAID',  // Pago parcial
  CANCELLED = 'CANCELLED'             // Anulada
}

/**
 * Tipo de operación para comisiones
 */
export enum OperationType {
  NEW_BUSINESS = 'NEW_BUSINESS',      // Nueva producción
  RENEWAL = 'RENEWAL',                // Renovación (cartera)
  ENDORSEMENT = 'ENDORSEMENT',        // Suplemento
  CANCELLATION = 'CANCELLATION',      // Anulación (extorno)
  REINSTATEMENT = 'REINSTATEMENT'     // Rehabilitación
}

// ============================================================================
// INTERFACES - Pólizas
// ============================================================================

/**
 * Datos del riesgo asegurado
 */
export interface RiskData {
  /** Tipo de riesgo */
  type: string;
  /** Datos específicos del riesgo */
  details: Record<string, unknown>;
  /** Ubicación del riesgo */
  location?: Address;
  /** Datos del vehículo (auto) */
  vehicle?: VehicleData;
  /** Datos del inmueble (hogar) */
  property?: PropertyData;
  /** Datos personales (vida/salud) */
  insuredPerson?: InsuredPersonData;
}

export interface Address {
  street: string;
  number?: string;
  floor?: string;
  door?: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
}

export interface VehicleData {
  plate: string;
  brand: string;
  model: string;
  version?: string;
  year: number;
  vin?: string;
  enginePower: number;        // CV
  fuelType: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'GAS';
  usage: 'PRIVATE' | 'PROFESSIONAL' | 'COMMERCIAL';
  parkingType: 'GARAGE' | 'STREET' | 'PARKING_LOT';
  annualKm?: number;
  vehicleValue?: number;
}

export interface PropertyData {
  propertyType: 'FLAT' | 'HOUSE' | 'CHALET' | 'STUDIO' | 'DUPLEX';
  constructionYear: number;
  surfaceM2: number;
  rooms: number;
  bathrooms: number;
  hasGarage: boolean;
  hasAlarm: boolean;
  hasArmoredDoor: boolean;
  continenteValue: number;
  contenidoValue: number;
}

export interface InsuredPersonData {
  firstName: string;
  lastName: string;
  documentType: 'DNI' | 'NIE' | 'PASSPORT';
  documentNumber: string;
  birthDate: Date;
  gender: 'M' | 'F';
  smoker?: boolean;
  profession?: string;
  riskProfession?: boolean;
  preexistingConditions?: string[];
}

/**
 * Cobertura de la póliza
 */
export interface Coverage {
  /** ID único */
  id: string;
  /** ID de la póliza */
  policyId: string;
  /** Tipo de cobertura */
  type: CoverageType;
  /** Nombre de la cobertura */
  name: string;
  /** Descripción */
  description?: string;
  /** Capital asegurado */
  sumInsured: number;
  /** Franquicia (deducible) */
  deductible?: number;
  /** Tipo de franquicia */
  deductibleType?: 'FIXED' | 'PERCENTAGE' | 'DAYS';
  /** Límite por siniestro */
  limitPerClaim?: number;
  /** Límite anual */
  annualLimit?: number;
  /** Prima neta de la cobertura */
  netPremium: number;
  /** ¿Es obligatoria? */
  mandatory: boolean;
  /** ¿Está activa? */
  active: boolean;
  /** Fecha de inicio */
  effectiveDate: Date;
  /** Fecha de fin */
  expirationDate?: Date;
}

/**
 * Desglose de prima
 */
export interface Premium {
  /** ID único */
  id: string;
  /** ID de la póliza */
  policyId: string;
  /** ID de la versión de póliza */
  policyVersionId?: string;
  /** Prima neta (sin impuestos) */
  netPremium: number;
  /** Recargo por fraccionamiento */
  installmentSurcharge: number;
  /** IPS - Impuesto sobre Primas de Seguro (habitualmente 6%) */
  ips: number;
  /** Tasa IPS aplicada */
  ipsRate: number;
  /** Recargo Consorcio de Compensación de Seguros */
  consortiumSurcharge: number;
  /** Tasa Consorcio */
  consortiumRate: number;
  /** Otros recargos */
  otherSurcharges: number;
  /** Descuentos */
  discounts: number;
  /** Prima total */
  totalPremium: number;
  /** Moneda */
  currency: string;
  /** Fecha de cálculo */
  calculatedAt: Date;
  /** Desglose por cobertura */
  coverageBreakdown?: CoveragePremium[];
}

export interface CoveragePremium {
  coverageId: string;
  coverageType: CoverageType;
  netPremium: number;
  ips: number;
  consortiumSurcharge: number;
  totalPremium: number;
}

/**
 * Póliza de seguro
 */
export interface Policy {
  /** ID único */
  id: string;
  /** Número de póliza */
  policyNumber: string;
  /** ID del tomador (party) */
  partyId: string;
  /** ID del asegurado (si es diferente) */
  insuredPartyId?: string;
  /** Código de producto */
  productCode: string;
  /** Nombre del producto */
  productName: string;
  /** Ramo */
  branch: InsuranceBranch;
  /** Tipo de póliza */
  type: PolicyType;
  /** Estado */
  status: PolicyStatus;
  /** Versión actual */
  currentVersion: number;
  /** Fecha de efecto */
  effectiveDate: Date;
  /** Fecha de vencimiento */
  expirationDate: Date;
  /** ¿Renovación automática? */
  autoRenewal: boolean;
  /** Datos del riesgo */
  riskData: RiskData;
  /** Coberturas */
  coverages: Coverage[];
  /** Prima actual */
  premium: Premium;
  /** Método de pago */
  paymentMethod: PaymentMethod;
  /** Frecuencia de pago */
  paymentFrequency: PaymentFrequency;
  /** IBAN para domiciliación */
  iban?: string;
  /** ID del mediador */
  agentId?: string;
  /** Código de oficina */
  officeCode?: string;
  /** Notas */
  notes?: string;
  /** Fecha de creación */
  createdAt: Date;
  /** Fecha de actualización */
  updatedAt: Date;
}

/**
 * Versión de póliza (para histórico)
 */
export interface PolicyVersion {
  id: string;
  policyId: string;
  version: number;
  effectiveDate: Date;
  endorsementId?: string;
  endorsementType?: EndorsementType;
  riskData: RiskData;
  coverages: Coverage[];
  premium: Premium;
  changeDescription: string;
  createdAt: Date;
  createdBy: string;
}

// ============================================================================
// INTERFACES - Recibos
// ============================================================================

/**
 * Recibo de prima
 */
export interface Receipt {
  /** ID único */
  id: string;
  /** Número de recibo */
  receiptNumber: string;
  /** ID de la póliza */
  policyId: string;
  /** Número de póliza */
  policyNumber: string;
  /** ID del suplemento (si aplica) */
  endorsementId?: string;
  /** Estado */
  status: ReceiptStatus;
  /** Tipo de recibo */
  receiptType: 'INITIAL' | 'RENEWAL' | 'ENDORSEMENT' | 'REFUND';
  /** Número de fracción (1 de 4, etc.) */
  installmentNumber: number;
  /** Total de fracciones */
  totalInstallments: number;
  /** Prima neta */
  netAmount: number;
  /** Impuestos */
  taxes: number;
  /** Recargos */
  surcharges: number;
  /** Importe total */
  totalAmount: number;
  /** Moneda */
  currency: string;
  /** Fecha de emisión */
  issueDate: Date;
  /** Fecha de vencimiento */
  dueDate: Date;
  /** Fecha de cobro */
  paidDate?: Date;
  /** Método de pago */
  paymentMethod: PaymentMethod;
  /** Referencia de pago */
  paymentReference?: string;
  /** IBAN */
  iban?: string;
  /** Intentos de cobro */
  collectionAttempts: number;
  /** Último intento de cobro */
  lastCollectionAttempt?: Date;
  /** Motivo de devolución */
  returnReason?: string;
  /** Notas adicionales */
  notes?: string;
  /** Fecha de creación */
  createdAt: Date;
  /** Fecha de actualización */
  updatedAt: Date;
}

/**
 * Plan de pago
 */
export interface PaymentPlan {
  id: string;
  policyId: string;
  totalAmount: number;
  installments: number;
  frequency: PaymentFrequency;
  surchargeRate: number;
  surchargeAmount: number;
  receipts: Receipt[];
  createdAt: Date;
}

/**
 * Movimiento bancario para conciliación
 */
export interface BankMovement {
  id: string;
  movementDate: Date;
  valueDate: Date;
  amount: number;
  concept: string;
  reference?: string;
  iban: string;
  matched: boolean;
  matchedReceiptId?: string;
}

// ============================================================================
// INTERFACES - Siniestros
// ============================================================================

/**
 * Siniestro
 */
export interface Claim {
  /** ID único */
  id: string;
  /** Número de siniestro */
  claimNumber: string;
  /** ID de la póliza */
  policyId: string;
  /** Número de póliza */
  policyNumber: string;
  /** Cobertura afectada */
  coverageId: string;
  /** Tipo de siniestro */
  type: ClaimType;
  /** Estado */
  status: ClaimStatus;
  /** Fecha del siniestro */
  incidentDate: Date;
  /** Fecha de comunicación */
  reportedDate: Date;
  /** Descripción del siniestro */
  description: string;
  /** Lugar del siniestro */
  location?: Address;
  /** Circunstancias */
  circumstances?: string;
  /** ID del perito asignado */
  adjusterId?: string;
  /** Nombre del perito */
  adjusterName?: string;
  /** Reserva actual */
  currentReserve: number;
  /** Total pagado */
  totalPaid: number;
  /** Recobros */
  recoveries: number;
  /** Franquicia aplicada */
  deductibleApplied: number;
  /** ¿Hay terceros implicados? */
  hasThirdParties: boolean;
  /** Datos de terceros */
  thirdParties?: ThirdPartyData[];
  /** Documentos adjuntos */
  documents?: ClaimDocument[];
  /** Resolución final */
  resolution?: string;
  /** Fecha de cierre */
  closedDate?: Date;
  /** Fecha de creación */
  createdAt: Date;
  /** Fecha de actualización */
  updatedAt: Date;
}

export interface ThirdPartyData {
  name: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  vehiclePlate?: string;
  description?: string;
}

export interface ClaimDocument {
  id: string;
  claimId: string;
  type: 'PHOTOS' | 'POLICE_REPORT' | 'MEDICAL_REPORT' | 'INVOICE' | 'EXPERT_REPORT' | 'OTHER';
  name: string;
  url: string;
  uploadedAt: Date;
}

/**
 * Reserva del siniestro
 */
export interface ClaimReserve {
  id: string;
  claimId: string;
  type: ReserveType;
  amount: number;
  previousAmount: number;
  reason: string;
  createdAt: Date;
  createdBy: string;
}

/**
 * Pago de siniestro
 */
export interface ClaimPayment {
  id: string;
  claimId: string;
  paymentNumber: string;
  beneficiary: string;
  beneficiaryType: 'INSURED' | 'THIRD_PARTY' | 'PROVIDER' | 'OTHER';
  concept: string;
  amount: number;
  taxes?: number;
  retentions?: number;
  netAmount: number;
  paymentMethod: PaymentMethod;
  iban?: string;
  paymentDate: Date;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
}

/**
 * Datos del incidente para apertura de siniestro
 */
export interface IncidentData {
  type: ClaimType;
  incidentDate: Date;
  description: string;
  location?: Address;
  circumstances?: string;
  hasThirdParties?: boolean;
  thirdParties?: ThirdPartyData[];
  estimatedAmount?: number;
  policeReportNumber?: string;
}

// ============================================================================
// INTERFACES - Suplementos
// ============================================================================

/**
 * Suplemento de póliza
 */
export interface Endorsement {
  id: string;
  endorsementNumber: string;
  policyId: string;
  policyNumber: string;
  type: EndorsementType;
  description: string;
  effectiveDate: Date;
  previousPolicyVersion: number;
  newPolicyVersion: number;
  changes: EndorsementChanges;
  premiumDifference: number;
  receipts: Receipt[];
  status: 'PENDING' | 'APPROVED' | 'APPLIED' | 'CANCELLED';
  requestedBy: string;
  approvedBy?: string;
  createdAt: Date;
  appliedAt?: Date;
}

export interface EndorsementChanges {
  riskDataChanges?: Partial<RiskData>;
  coverageChanges?: CoverageChange[];
  beneficiaryChanges?: BeneficiaryChange[];
  otherChanges?: Record<string, unknown>;
}

export interface CoverageChange {
  action: 'ADD' | 'REMOVE' | 'MODIFY';
  coverageType: CoverageType;
  previousValues?: Partial<Coverage>;
  newValues?: Partial<Coverage>;
}

export interface BeneficiaryChange {
  action: 'ADD' | 'REMOVE' | 'MODIFY';
  previousBeneficiary?: string;
  newBeneficiary?: string;
  percentage?: number;
}

// ============================================================================
// INTERFACES - Comisiones
// ============================================================================

/**
 * Comisión
 */
export interface Commission {
  id: string;
  policyId: string;
  policyNumber: string;
  receiptId: string;
  receiptNumber: string;
  agentId: string;
  agentName: string;
  branch: InsuranceBranch;
  operationType: OperationType;
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
  withholdingTax: number;
  withholdingRate: number;
  netAmount: number;
  currency: string;
  status: 'PENDING' | 'CALCULATED' | 'SETTLED' | 'PAID' | 'ADJUSTED';
  settlementId?: string;
  calculatedAt: Date;
  createdAt: Date;
}

/**
 * Regla de comisión
 */
export interface CommissionRule {
  id: string;
  name: string;
  description?: string;
  branch: InsuranceBranch;
  productCode?: string;
  operationType: OperationType;
  agentType?: 'AGENT' | 'BROKER' | 'BANCASSURANCE' | 'DIRECT';
  commissionRate: number;
  minAmount?: number;
  maxAmount?: number;
  validFrom: Date;
  validTo?: Date;
  conditions?: CommissionCondition[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommissionCondition {
  field: string;
  operator: 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'IN' | 'CONTAINS';
  value: unknown;
}

/**
 * Liquidación de comisiones
 */
export interface Settlement {
  id: string;
  settlementNumber: string;
  agentId: string;
  agentName: string;
  agentDocument: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  totalCommissions: number;
  totalAdjustments: number;
  totalWithholdings: number;
  netAmount: number;
  currency: string;
  status: SettlementStatus;
  commissions: Commission[];
  iban?: string;
  paymentDate?: Date;
  paymentReference?: string;
  invoiceNumber?: string;
  createdAt: Date;
  approvedAt?: Date;
  paidAt?: Date;
}

/**
 * Extracto de comisiones
 */
export interface CommissionStatement {
  agentId: string;
  agentName: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  summary: CommissionSummary;
  detailByBranch: BranchCommissionDetail[];
  detailByOperation: OperationCommissionDetail[];
  commissions: Commission[];
}

export interface CommissionSummary {
  newBusinessCommissions: number;
  renewalCommissions: number;
  endorsementCommissions: number;
  cancellationCommissions: number;
  totalGross: number;
  totalWithholdings: number;
  totalNet: number;
}

export interface BranchCommissionDetail {
  branch: InsuranceBranch;
  policies: number;
  premiumVolume: number;
  commissionAmount: number;
  averageRate: number;
}

export interface OperationCommissionDetail {
  operationType: OperationType;
  transactions: number;
  premiumVolume: number;
  commissionAmount: number;
}

// ============================================================================
// CONSTANTES - Tasas España
// ============================================================================

/**
 * Tasas de impuestos y recargos en España
 */
export const SPAIN_TAX_RATES = {
  /** IPS - Impuesto sobre Primas de Seguro (general) */
  IPS_GENERAL: 0.06,
  /** IPS reducido (ciertos ramos) */
  IPS_REDUCED: 0.03,
  /** Ramos exentos de IPS */
  IPS_EXEMPT: 0,

  /** Recargo Consorcio Auto */
  CONSORTIUM_AUTO: 0.0055,
  /** Recargo Consorcio Hogar/Incendio */
  CONSORTIUM_FIRE: 0.0009,
  /** Recargo Consorcio Otros */
  CONSORTIUM_OTHER: 0.0005,

  /** Retención IRPF comisiones */
  WITHHOLDING_COMMISSION: 0.15,

  /** Recargo por fraccionamiento semestral */
  INSTALLMENT_BIANNUAL: 0.02,
  /** Recargo por fraccionamiento trimestral */
  INSTALLMENT_QUARTERLY: 0.03,
  /** Recargo por fraccionamiento mensual */
  INSTALLMENT_MONTHLY: 0.05,
} as const;

/**
 * Comisiones estándar por ramo (porcentaje)
 */
export const STANDARD_COMMISSION_RATES = {
  [InsuranceBranch.AUTO]: {
    [OperationType.NEW_BUSINESS]: 0.15,
    [OperationType.RENEWAL]: 0.12,
    [OperationType.ENDORSEMENT]: 0.10,
  },
  [InsuranceBranch.HOGAR]: {
    [OperationType.NEW_BUSINESS]: 0.25,
    [OperationType.RENEWAL]: 0.20,
    [OperationType.ENDORSEMENT]: 0.15,
  },
  [InsuranceBranch.VIDA]: {
    [OperationType.NEW_BUSINESS]: 0.30,
    [OperationType.RENEWAL]: 0.05,
    [OperationType.ENDORSEMENT]: 0.05,
  },
  [InsuranceBranch.SALUD]: {
    [OperationType.NEW_BUSINESS]: 0.15,
    [OperationType.RENEWAL]: 0.10,
    [OperationType.ENDORSEMENT]: 0.08,
  },
  [InsuranceBranch.DECESOS]: {
    [OperationType.NEW_BUSINESS]: 0.35,
    [OperationType.RENEWAL]: 0.10,
    [OperationType.ENDORSEMENT]: 0.05,
  },
  [InsuranceBranch.COMERCIO]: {
    [OperationType.NEW_BUSINESS]: 0.20,
    [OperationType.RENEWAL]: 0.15,
    [OperationType.ENDORSEMENT]: 0.12,
  },
  [InsuranceBranch.PYME]: {
    [OperationType.NEW_BUSINESS]: 0.20,
    [OperationType.RENEWAL]: 0.15,
    [OperationType.ENDORSEMENT]: 0.12,
  },
} as const;

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

export type PolicyCreateInput = Omit<Policy, 'id' | 'policyNumber' | 'status' | 'currentVersion' | 'premium' | 'createdAt' | 'updatedAt'>;
export type PolicyUpdateInput = Partial<Omit<Policy, 'id' | 'policyNumber' | 'createdAt'>>;

export type ClaimCreateInput = Omit<Claim, 'id' | 'claimNumber' | 'status' | 'currentReserve' | 'totalPaid' | 'recoveries' | 'deductibleApplied' | 'createdAt' | 'updatedAt'>;
export type ClaimUpdateInput = Partial<Omit<Claim, 'id' | 'claimNumber' | 'policyId' | 'createdAt'>>;

export type CommissionRuleCreateInput = Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>;
