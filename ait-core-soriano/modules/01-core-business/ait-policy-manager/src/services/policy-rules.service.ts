import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreatePolicyDto,
  PolicyType,
  PolicyStatus,
  CreateCoverageDto,
  ValidationResultDto,
  ValidationIssue,
  ValidationSeverity,
  EndorsePolicyDto
} from '../dto';

interface RuleResult {
  passed: boolean;
  code: string;
  message: string;
  severity: ValidationSeverity;
  details?: any;
}

@Injectable()
export class PolicyRulesService {
  private readonly logger = new Logger(PolicyRulesService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // ==================== REGLAS DE CREACIÓN ====================

  async canCreatePolicy(dto: CreatePolicyDto): Promise<RuleResult> {
    this.logger.debug(`Validating policy creation for type: ${dto.type}`);

    // Verificar cliente existe y está activo
    const customer = await this.prisma.party.findUnique({
      where: { id: dto.clientId }
    });

    if (!customer) {
      return {
        passed: false,
        code: 'CUSTOMER_NOT_FOUND',
        message: `Customer ${dto.clientId} not found`,
        severity: ValidationSeverity.ERROR
      };
    }

    if ((customer as any).status !== 'active') {
      return {
        passed: false,
        code: 'CUSTOMER_INACTIVE',
        message: 'Customer is not active',
        severity: ValidationSeverity.ERROR
      };
    }

    // Verificar que no tenga deudas pendientes
    const hasPendingDebt = await this.checkPendingDebt(dto.clientId);
    if (hasPendingDebt) {
      return {
        passed: false,
        code: 'PENDING_DEBT',
        message: 'Customer has pending debt payments',
        severity: ValidationSeverity.ERROR
      };
    }

    // Verificar límites de crédito
    const creditCheckPassed = await this.checkCreditLimit(dto.clientId, dto.totalPremium);
    if (!creditCheckPassed) {
      return {
        passed: false,
        code: 'CREDIT_LIMIT_EXCEEDED',
        message: 'Customer credit limit exceeded',
        severity: ValidationSeverity.WARNING
      };
    }

    return {
      passed: true,
      code: 'CAN_CREATE',
      message: 'Policy can be created',
      severity: ValidationSeverity.INFO
    };
  }

  async canRenewPolicy(policy: any): Promise<RuleResult> {
    // No se puede renovar una póliza cancelada
    if (policy.status === PolicyStatus.CANCELLED) {
      return {
        passed: false,
        code: 'CANNOT_RENEW_CANCELLED',
        message: 'Cannot renew cancelled policy',
        severity: ValidationSeverity.ERROR
      };
    }

    // Verificar que esté cerca de expiración (dentro de 60 días)
    const daysUntilExpiration = this.getDaysUntilExpiration(policy.expirationDate);
    if (daysUntilExpiration > 60) {
      return {
        passed: false,
        code: 'TOO_EARLY_TO_RENEW',
        message: 'Policy can only be renewed within 60 days of expiration',
        severity: ValidationSeverity.WARNING,
        details: { daysUntilExpiration }
      };
    }

    // Verificar que no tenga claims pendientes significativos
    const hasPendingClaims = await this.checkPendingClaims(policy.id);
    if (hasPendingClaims) {
      return {
        passed: false,
        code: 'PENDING_CLAIMS',
        message: 'Policy has pending claims that must be resolved before renewal',
        severity: ValidationSeverity.ERROR
      };
    }

    // Verificar ratio de siniestralidad
    const lossRatio = await this.calculateLossRatio(policy.id);
    if (lossRatio > 0.8) {
      return {
        passed: false,
        code: 'HIGH_LOSS_RATIO',
        message: 'Policy has high loss ratio and requires manual review',
        severity: ValidationSeverity.WARNING,
        details: { lossRatio: (lossRatio * 100).toFixed(2) + '%' }
      };
    }

    return {
      passed: true,
      code: 'CAN_RENEW',
      message: 'Policy can be renewed',
      severity: ValidationSeverity.INFO
    };
  }

  async canCancelPolicy(policy: any): Promise<RuleResult> {
    // No se puede cancelar una póliza ya cancelada o expirada
    if (policy.status === PolicyStatus.CANCELLED || policy.status === PolicyStatus.EXPIRED) {
      return {
        passed: false,
        code: 'ALREADY_TERMINATED',
        message: 'Policy is already cancelled or expired',
        severity: ValidationSeverity.ERROR
      };
    }

    // Verificar claims activos
    const activeClaims = await this.prisma.claim.count({
      where: {
        policyId: policy.id,
        status: { in: ['pending', 'in_review', 'approved'] }
      }
    });

    if (activeClaims > 0) {
      return {
        passed: false,
        code: 'ACTIVE_CLAIMS',
        message: `Cannot cancel policy with ${activeClaims} active claims`,
        severity: ValidationSeverity.ERROR,
        details: { activeClaimsCount: activeClaims }
      };
    }

    // Verificar pagos pendientes
    const hasPendingPayments = await this.checkPendingPayments(policy.id);
    if (hasPendingPayments) {
      return {
        passed: false,
        code: 'PENDING_PAYMENTS',
        message: 'Policy has pending payments',
        severity: ValidationSeverity.WARNING
      };
    }

    return {
      passed: true,
      code: 'CAN_CANCEL',
      message: 'Policy can be cancelled',
      severity: ValidationSeverity.INFO
    };
  }

  // ==================== VALIDACIONES DE COBERTURAS ====================

  async validateCoverages(policyType: PolicyType, coverages: CreateCoverageDto[]): Promise<RuleResult> {
    if (!coverages || coverages.length === 0) {
      return {
        passed: false,
        code: 'NO_COVERAGES',
        message: 'At least one coverage is required',
        severity: ValidationSeverity.ERROR
      };
    }

    // Verificar coberturas obligatorias según tipo de póliza
    const mandatoryCoverages = this.getMandatoryCoverages(policyType);
    const coverageCodes = coverages.map(c => c.code);

    const missingMandatory = mandatoryCoverages.filter(mc => !coverageCodes.includes(mc));
    if (missingMandatory.length > 0) {
      return {
        passed: false,
        code: 'MISSING_MANDATORY_COVERAGES',
        message: `Missing mandatory coverages: ${missingMandatory.join(', ')}`,
        severity: ValidationSeverity.ERROR,
        details: { missingCoverages: missingMandatory }
      };
    }

    // Verificar límites de suma asegurada
    for (const coverage of coverages) {
      const limits = this.getCoverageLimits(policyType, coverage.code);
      if (coverage.sumInsured < limits.min) {
        return {
          passed: false,
          code: 'SUM_INSURED_TOO_LOW',
          message: `Coverage ${coverage.name} has sum insured below minimum (${limits.min})`,
          severity: ValidationSeverity.ERROR,
          details: { coverage: coverage.code, min: limits.min, actual: coverage.sumInsured }
        };
      }
      if (coverage.sumInsured > limits.max) {
        return {
          passed: false,
          code: 'SUM_INSURED_TOO_HIGH',
          message: `Coverage ${coverage.name} exceeds maximum sum insured (${limits.max})`,
          severity: ValidationSeverity.WARNING,
          details: { coverage: coverage.code, max: limits.max, actual: coverage.sumInsured }
        };
      }
    }

    return {
      passed: true,
      code: 'COVERAGES_VALID',
      message: 'All coverages are valid',
      severity: ValidationSeverity.INFO
    };
  }

  // ==================== VALIDACIONES DE PRIMA ====================

  async checkMinimumPremium(type: PolicyType, premium: number): Promise<boolean> {
    const minimums: Record<PolicyType, number> = {
      [PolicyType.AUTO]: 300,
      [PolicyType.HOME]: 200,
      [PolicyType.LIFE]: 500,
      [PolicyType.HEALTH]: 400,
      [PolicyType.BUSINESS]: 1000,
      [PolicyType.TRAVEL]: 50,
      [PolicyType.LIABILITY]: 350
    };

    const min = minimums[type] || 100;
    return premium >= min;
  }

  async checkMaximumInsuredAmount(type: PolicyType, amount: number): Promise<boolean> {
    const maximums: Record<PolicyType, number> = {
      [PolicyType.AUTO]: 500000,
      [PolicyType.HOME]: 1000000,
      [PolicyType.LIFE]: 5000000,
      [PolicyType.HEALTH]: 2000000,
      [PolicyType.BUSINESS]: 10000000,
      [PolicyType.TRAVEL]: 100000,
      [PolicyType.LIABILITY]: 3000000
    };

    const max = maximums[type] || 1000000;
    return amount <= max;
  }

  async validatePremiumCalculation(dto: CreatePolicyDto): Promise<RuleResult> {
    // Verificar que la prima total sea consistente con las coberturas
    const totalCoveragePremium = dto.coverages.reduce((sum, cov) => sum + (cov.premium || 0), 0);
    const difference = Math.abs(dto.totalPremium - totalCoveragePremium);
    const tolerance = dto.totalPremium * 0.05; // 5% tolerancia

    if (difference > tolerance) {
      return {
        passed: false,
        code: 'PREMIUM_MISMATCH',
        message: 'Total premium does not match sum of coverage premiums',
        severity: ValidationSeverity.ERROR,
        details: {
          totalPremium: dto.totalPremium,
          coveragesPremium: totalCoveragePremium,
          difference
        }
      };
    }

    // Verificar prima mínima
    const meetsMinimum = await this.checkMinimumPremium(dto.type, dto.totalPremium);
    if (!meetsMinimum) {
      return {
        passed: false,
        code: 'PREMIUM_BELOW_MINIMUM',
        message: `Premium is below minimum for ${dto.type} policies`,
        severity: ValidationSeverity.ERROR
      };
    }

    return {
      passed: true,
      code: 'PREMIUM_VALID',
      message: 'Premium calculation is valid',
      severity: ValidationSeverity.INFO
    };
  }

  // ==================== VALIDACIONES DE FECHAS ====================

  async validatePolicyDates(effectiveDate: Date, expirationDate: Date): Promise<RuleResult> {
    const now = new Date();
    const effective = new Date(effectiveDate);
    const expiration = new Date(expirationDate);

    // La fecha de inicio no puede ser más de 30 días en el pasado
    const daysSinceEffective = this.getDaysBetween(effective, now);
    if (daysSinceEffective > 30) {
      return {
        passed: false,
        code: 'EFFECTIVE_DATE_TOO_OLD',
        message: 'Effective date cannot be more than 30 days in the past',
        severity: ValidationSeverity.ERROR
      };
    }

    // La fecha de vencimiento debe ser al menos 30 días después de la de inicio
    const policyDuration = this.getDaysBetween(effective, expiration);
    if (policyDuration < 30) {
      return {
        passed: false,
        code: 'POLICY_TOO_SHORT',
        message: 'Policy duration must be at least 30 days',
        severity: ValidationSeverity.ERROR,
        details: { durationDays: policyDuration }
      };
    }

    // La fecha de vencimiento no debe ser más de 5 años en el futuro
    if (policyDuration > 365 * 5) {
      return {
        passed: false,
        code: 'POLICY_TOO_LONG',
        message: 'Policy duration cannot exceed 5 years',
        severity: ValidationSeverity.WARNING,
        details: { durationDays: policyDuration }
      };
    }

    return {
      passed: true,
      code: 'DATES_VALID',
      message: 'Policy dates are valid',
      severity: ValidationSeverity.INFO
    };
  }

  // ==================== VALIDACIONES DE RIESGO ====================

  async validateRiskData(type: PolicyType, riskData: any): Promise<RuleResult> {
    if (!riskData) {
      return {
        passed: false,
        code: 'MISSING_RISK_DATA',
        message: 'Risk data is required',
        severity: ValidationSeverity.ERROR
      };
    }

    // Validaciones específicas por tipo
    switch (type) {
      case PolicyType.AUTO:
        return this.validateAutoRiskData(riskData);
      case PolicyType.HOME:
        return this.validateHomeRiskData(riskData);
      case PolicyType.LIFE:
        return this.validateLifeRiskData(riskData);
      case PolicyType.HEALTH:
        return this.validateHealthRiskData(riskData);
      default:
        return {
          passed: true,
          code: 'RISK_DATA_VALID',
          message: 'Risk data is valid',
          severity: ValidationSeverity.INFO
        };
    }
  }

  private validateAutoRiskData(riskData: any): RuleResult {
    const required = ['vehiclePlate', 'vehicleMake', 'vehicleModel', 'vehicleYear', 'driverLicenseNumber'];
    const missing = required.filter(field => !riskData[field]);

    if (missing.length > 0) {
      return {
        passed: false,
        code: 'MISSING_AUTO_RISK_DATA',
        message: `Missing required fields: ${missing.join(', ')}`,
        severity: ValidationSeverity.ERROR,
        details: { missingFields: missing }
      };
    }

    // Validar año del vehículo
    const currentYear = new Date().getFullYear();
    if (riskData.vehicleYear < 1950 || riskData.vehicleYear > currentYear + 1) {
      return {
        passed: false,
        code: 'INVALID_VEHICLE_YEAR',
        message: 'Invalid vehicle year',
        severity: ValidationSeverity.ERROR
      };
    }

    return {
      passed: true,
      code: 'AUTO_RISK_DATA_VALID',
      message: 'Auto risk data is valid',
      severity: ValidationSeverity.INFO
    };
  }

  private validateHomeRiskData(riskData: any): RuleResult {
    const required = ['propertyAddress', 'propertyType', 'constructionYear', 'squareMeters'];
    const missing = required.filter(field => !riskData[field]);

    if (missing.length > 0) {
      return {
        passed: false,
        code: 'MISSING_HOME_RISK_DATA',
        message: `Missing required fields: ${missing.join(', ')}`,
        severity: ValidationSeverity.ERROR,
        details: { missingFields: missing }
      };
    }

    return {
      passed: true,
      code: 'HOME_RISK_DATA_VALID',
      message: 'Home risk data is valid',
      severity: ValidationSeverity.INFO
    };
  }

  private validateLifeRiskData(riskData: any): RuleResult {
    const required = ['insuredAge', 'occupation', 'healthStatus'];
    const missing = required.filter(field => !riskData[field]);

    if (missing.length > 0) {
      return {
        passed: false,
        code: 'MISSING_LIFE_RISK_DATA',
        message: `Missing required fields: ${missing.join(', ')}`,
        severity: ValidationSeverity.ERROR,
        details: { missingFields: missing }
      };
    }

    // Validar edad
    if (riskData.insuredAge < 18 || riskData.insuredAge > 85) {
      return {
        passed: false,
        code: 'AGE_OUT_OF_RANGE',
        message: 'Insured age must be between 18 and 85',
        severity: ValidationSeverity.ERROR
      };
    }

    return {
      passed: true,
      code: 'LIFE_RISK_DATA_VALID',
      message: 'Life risk data is valid',
      severity: ValidationSeverity.INFO
    };
  }

  private validateHealthRiskData(riskData: any): RuleResult {
    const required = ['insuredAge', 'preexistingConditions', 'smoker'];
    const missing = required.filter(field => !riskData[field]);

    if (missing.length > 0) {
      return {
        passed: false,
        code: 'MISSING_HEALTH_RISK_DATA',
        message: `Missing required fields: ${missing.join(', ')}`,
        severity: ValidationSeverity.ERROR,
        details: { missingFields: missing }
      };
    }

    return {
      passed: true,
      code: 'HEALTH_RISK_DATA_VALID',
      message: 'Health risk data is valid',
      severity: ValidationSeverity.INFO
    };
  }

  // ==================== VALIDACIONES DE ENDOSOS ====================

  async validateEndorsement(policy: any, dto: EndorsePolicyDto): Promise<RuleResult> {
    // Verificar que la fecha del endoso esté dentro del periodo de la póliza
    const endorseDate = new Date(dto.effectiveDate);
    const policyStart = new Date(policy.effectiveDate);
    const policyEnd = new Date(policy.expirationDate);

    if (endorseDate < policyStart || endorseDate > policyEnd) {
      return {
        passed: false,
        code: 'ENDORSEMENT_DATE_OUT_OF_RANGE',
        message: 'Endorsement effective date must be within policy period',
        severity: ValidationSeverity.ERROR
      };
    }

    // Verificar que el ajuste de prima no sea excesivo
    const maxAdjustment = policy.totalPremium * 0.5; // Máximo 50% de ajuste
    if (Math.abs(dto.premiumAdjustment) > maxAdjustment) {
      return {
        passed: false,
        code: 'EXCESSIVE_PREMIUM_ADJUSTMENT',
        message: 'Premium adjustment exceeds 50% of current premium',
        severity: ValidationSeverity.WARNING,
        details: { maxAllowed: maxAdjustment, requested: dto.premiumAdjustment }
      };
    }

    return {
      passed: true,
      code: 'ENDORSEMENT_VALID',
      message: 'Endorsement is valid',
      severity: ValidationSeverity.INFO
    };
  }

  // ==================== REGLAS DE UNDERWRITING ====================

  async performUnderwritingCheck(dto: CreatePolicyDto): Promise<RuleResult> {
    // Verificar historial de claims del cliente
    const claimsHistory = await this.getCustomerClaimsHistory(dto.clientId);
    if (claimsHistory.count > 5 && claimsHistory.lastYear > 2) {
      return {
        passed: false,
        code: 'HIGH_CLAIMS_FREQUENCY',
        message: 'Customer has high frequency of claims',
        severity: ValidationSeverity.WARNING,
        details: claimsHistory
      };
    }

    // Verificar blacklist
    const isBlacklisted = await this.checkBlacklist(dto.clientId);
    if (isBlacklisted) {
      return {
        passed: false,
        code: 'CUSTOMER_BLACKLISTED',
        message: 'Customer is in blacklist',
        severity: ValidationSeverity.ERROR
      };
    }

    // Verificar score de riesgo
    const riskScore = await this.calculateRiskScore(dto);
    if (riskScore > 80) {
      return {
        passed: false,
        code: 'HIGH_RISK_SCORE',
        message: 'Risk score exceeds acceptable threshold',
        severity: ValidationSeverity.WARNING,
        details: { riskScore }
      };
    }

    return {
      passed: true,
      code: 'UNDERWRITING_APPROVED',
      message: 'Underwriting check passed',
      severity: ValidationSeverity.INFO,
      details: { riskScore }
    };
  }

  // ==================== HELPERS PRIVADOS ====================

  private async checkPendingDebt(customerId: string): Promise<boolean> {
    // Verificar deudas pendientes
    const pendingInvoices = await this.prisma.invoice.count({
      where: {
        customerId,
        status: 'overdue'
      }
    });
    return pendingInvoices > 0;
  }

  private async checkCreditLimit(customerId: string, amount: number): Promise<boolean> {
    // Verificar límite de crédito
    return true; // Placeholder
  }

  private async checkPendingClaims(policyId: string): Promise<boolean> {
    const count = await this.prisma.claim.count({
      where: {
        policyId,
        status: { in: ['pending', 'in_review'] }
      }
    });
    return count > 0;
  }

  private async checkPendingPayments(policyId: string): Promise<boolean> {
    // Verificar pagos pendientes
    return false; // Placeholder
  }

  private async calculateLossRatio(policyId: string): Promise<number> {
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
      include: { claims: true }
    });

    if (!policy || !policy.claims) return 0;

    const totalClaims = (policy.claims as any[]).reduce((sum, claim) => sum + (claim.amount || 0), 0);
    const totalPremium = policy.totalPremium || 1;

    return totalClaims / totalPremium;
  }

  private async getCustomerClaimsHistory(customerId: string): Promise<any> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const total = await this.prisma.claim.count({
      where: { policy: { partyId: customerId } }
    });

    const lastYear = await this.prisma.claim.count({
      where: {
        policy: { partyId: customerId },
        createdAt: { gte: oneYearAgo }
      }
    });

    return { count: total, lastYear };
  }

  private async checkBlacklist(customerId: string): Promise<boolean> {
    // Verificar blacklist
    return false; // Placeholder
  }

  private async calculateRiskScore(dto: CreatePolicyDto): Promise<number> {
    // Algoritmo de scoring de riesgo
    let score = 0;

    // Factores de riesgo según tipo de póliza
    if (dto.type === PolicyType.AUTO) score += 20;
    if (dto.type === PolicyType.LIFE) score += 10;

    // Factor de prima
    if (dto.totalPremium < 500) score += 15;

    return Math.min(score, 100);
  }

  private getDaysUntilExpiration(expirationDate: Date): number {
    const now = new Date();
    const expiration = new Date(expirationDate);
    return Math.floor((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getDaysBetween(date1: Date, date2: Date): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs(Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
  }

  private getMandatoryCoverages(type: PolicyType): string[] {
    const mandatories: Record<PolicyType, string[]> = {
      [PolicyType.AUTO]: ['RC_AUTO'],
      [PolicyType.HOME]: ['BUILDING_DAMAGE'],
      [PolicyType.LIFE]: ['DEATH_BENEFIT'],
      [PolicyType.HEALTH]: ['HOSPITALIZATION'],
      [PolicyType.BUSINESS]: ['GENERAL_LIABILITY'],
      [PolicyType.TRAVEL]: ['MEDICAL_ASSISTANCE'],
      [PolicyType.LIABILITY]: ['CIVIL_LIABILITY']
    };
    return mandatories[type] || [];
  }

  private getCoverageLimits(type: PolicyType, coverageCode: string): { min: number; max: number } {
    // Límites por defecto
    return {
      min: 1000,
      max: 1000000
    };
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
