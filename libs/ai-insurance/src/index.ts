/**
 * AI Insurance Module
 * Módulo de gestión integral de seguros
 *
 * Este módulo proporciona funcionalidades completas para:
 * - Gestión de pólizas y suplementos
 * - Generación y cobro de recibos
 * - Tramitación de siniestros
 * - Liquidación de comisiones a mediadores
 *
 * Implementa lógica de negocio específica para el mercado español:
 * - IPS (Impuesto sobre Primas de Seguro)
 * - Recargo del Consorcio de Compensación de Seguros
 * - Fraccionamiento con/sin recargo
 * - Comisiones por ramo y tipo de operación
 * - Retenciones IRPF a mediadores
 */

// ============================================================================
// Types - Exportación de tipos
// ============================================================================

export {
  // Enums - Estados
  PolicyStatus,
  PolicyType,
  CoverageType,
  InsuranceBranch,
  ReceiptStatus,
  PaymentMethod,
  PaymentFrequency,
  ClaimStatus,
  ClaimType,
  ReserveType,
  EndorsementType,
  SettlementStatus,
  OperationType,

  // Interfaces - Pólizas
  RiskData,
  Address,
  VehicleData,
  PropertyData,
  InsuredPersonData,
  Coverage,
  Premium,
  CoveragePremium,
  Policy,
  PolicyVersion,

  // Interfaces - Recibos
  Receipt,
  PaymentPlan,
  BankMovement,

  // Interfaces - Siniestros
  Claim,
  ClaimReserve,
  ClaimPayment,
  ClaimDocument,
  ThirdPartyData,
  IncidentData,

  // Interfaces - Suplementos
  Endorsement,
  EndorsementChanges,
  CoverageChange,
  BeneficiaryChange,

  // Interfaces - Comisiones
  Commission,
  CommissionRule,
  CommissionCondition,
  Settlement,
  CommissionStatement,
  CommissionSummary,
  BranchCommissionDetail,
  OperationCommissionDetail,

  // Constantes
  SPAIN_TAX_RATES,
  STANDARD_COMMISSION_RATES,

  // Tipos auxiliares
  PolicyCreateInput,
  PolicyUpdateInput,
  ClaimCreateInput,
  ClaimUpdateInput,
  CommissionRuleCreateInput,
} from './types';

// ============================================================================
// Services - Exportación de servicios
// ============================================================================

export { PolicyService, policyService } from './services/policy.service';
export { ReceiptService, receiptService } from './services/receipt.service';
export { ClaimService, claimService } from './services/claim.service';
export { CommissionService, commissionService } from './services/commission.service';

// ============================================================================
// Facade - API simplificada
// ============================================================================

import { policyService } from './services/policy.service';
import { receiptService } from './services/receipt.service';
import { claimService } from './services/claim.service';
import { commissionService } from './services/commission.service';

/**
 * AI Insurance Facade
 * Punto de entrada unificado para todas las operaciones de seguros
 */
export const AIInsurance = {
  // Pólizas
  policy: {
    create: policyService.createPolicy.bind(policyService),
    renew: policyService.renewPolicy.bind(policyService),
    cancel: policyService.cancelPolicy.bind(policyService),
    suspend: policyService.suspendPolicy.bind(policyService),
    reinstate: policyService.reinstatePolicy.bind(policyService),
    createEndorsement: policyService.createEndorsement.bind(policyService),
    calculatePremium: policyService.calculatePremium.bind(policyService),
    getByNumber: policyService.getPolicyByNumber.bind(policyService),
    getById: policyService.getPolicyById.bind(policyService),
    getActive: policyService.getActivePolicies.bind(policyService),
    getByParty: policyService.getPoliciesByParty.bind(policyService),
    getVersions: policyService.getPolicyVersions.bind(policyService),
    getEndorsements: policyService.getPolicyEndorsements.bind(policyService),
  },

  // Recibos
  receipt: {
    generate: receiptService.generateReceipts.bind(receiptService),
    generateForEndorsement: receiptService.generateEndorsementReceipts.bind(receiptService),
    processPayment: receiptService.processPayment.bind(receiptService),
    markAsUnpaid: receiptService.markAsUnpaid.bind(receiptService),
    cancel: receiptService.cancelReceipt.bind(receiptService),
    createPaymentPlan: receiptService.createPaymentPlan.bind(receiptService),
    reconcileWithBank: receiptService.reconcileWithBank.bind(receiptService),
    sendReminder: receiptService.sendPaymentReminder.bind(receiptService),
    getByPolicy: receiptService.getReceiptsByPolicy.bind(receiptService),
    getPending: receiptService.getPendingReceiptsByPolicy.bind(receiptService),
    getOverdue: receiptService.getOverdueReceipts.bind(receiptService),
    getByStatus: receiptService.getReceiptsByStatus.bind(receiptService),
    getById: receiptService.getReceiptById.bind(receiptService),
    getByNumber: receiptService.getReceiptByNumber.bind(receiptService),
    getCollectionReport: receiptService.getCollectionReport.bind(receiptService),
    generateSEPARemittance: receiptService.generateSEPARemittance.bind(receiptService),
  },

  // Siniestros
  claim: {
    open: claimService.openClaim.bind(claimService),
    assignAdjuster: claimService.assignAdjuster.bind(claimService),
    updateReserve: claimService.updateReserve.bind(claimService),
    processPayment: claimService.processPayment.bind(claimService),
    approvePayment: claimService.approvePayment.bind(claimService),
    markPaymentAsPaid: claimService.markPaymentAsPaid.bind(claimService),
    registerRecovery: claimService.registerRecovery.bind(claimService),
    close: claimService.closeClaim.bind(claimService),
    reopen: claimService.reopenClaim.bind(claimService),
    checkCoverage: claimService.checkCoverage.bind(claimService),
    calculateDeductible: claimService.calculateDeductible.bind(claimService),
    flagAsFraud: claimService.flagAsFraud.bind(claimService),
    sendToLitigation: claimService.sendToLitigation.bind(claimService),
    requestDocumentation: claimService.requestDocumentation.bind(claimService),
    getById: claimService.getClaimById.bind(claimService),
    getByNumber: claimService.getClaimByNumber.bind(claimService),
    getByPolicy: claimService.getClaimsByPolicy.bind(claimService),
    getByStatus: claimService.getClaimsByStatus.bind(claimService),
    getByAdjuster: claimService.getClaimsByAdjuster.bind(claimService),
    getReserveHistory: claimService.getReserveHistory.bind(claimService),
    getPayments: claimService.getClaimPayments.bind(claimService),
    getStatistics: claimService.getClaimStatistics.bind(claimService),
  },

  // Comisiones
  commission: {
    calculate: commissionService.calculateCommission.bind(commissionService),
    applyRules: commissionService.applyCommissionRules.bind(commissionService),
    generateSettlement: commissionService.generateSettlement.bind(commissionService),
    getStatement: commissionService.getCommissionStatement.bind(commissionService),
    adjust: commissionService.adjustCommission.bind(commissionService),
    approveSettlement: commissionService.approveSettlement.bind(commissionService),
    markSettlementAsPaid: commissionService.markSettlementAsPaid.bind(commissionService),
    cancelSettlement: commissionService.cancelSettlement.bind(commissionService),
    createRule: commissionService.createCommissionRule.bind(commissionService),
    updateRule: commissionService.updateCommissionRule.bind(commissionService),
    deactivateRule: commissionService.deactivateCommissionRule.bind(commissionService),
    getByAgent: commissionService.getCommissionsByAgent.bind(commissionService),
    getByPolicy: commissionService.getCommissionsByPolicy.bind(commissionService),
    getSettlementsByAgent: commissionService.getSettlementsByAgent.bind(commissionService),
    getSettlementById: commissionService.getSettlementById.bind(commissionService),
    getActiveRules: commissionService.getActiveCommissionRules.bind(commissionService),
    getReport: commissionService.getCommissionsReport.bind(commissionService),
  },
};

// Export default
export default AIInsurance;
