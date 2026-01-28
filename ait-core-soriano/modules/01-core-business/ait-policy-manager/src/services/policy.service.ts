import { Injectable, NotFoundException, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Kafka, Producer } from 'kafkajs';
import {
  CreatePolicyDto,
  UpdatePolicyDto,
  RenewPolicyDto,
  EndorsePolicyDto,
  CancelPolicyDto,
  PolicyStatus,
  PolicyType,
  CreateCoverageDto,
  UpdateCoverageDto,
  PolicyQuoteDto,
  QuoteResultDto,
  PolicySearchDto,
  PaginatedPolicyResult,
  PolicyStatisticsDto,
  CustomerPolicyStatisticsDto,
  PolicyDocumentDto,
  PolicyHistoryDto,
  HistoryEventType,
  ValidationResultDto,
  ValidationIssue,
  ValidationSeverity
} from '../dto';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);
  private readonly prisma: PrismaClient;
  private readonly kafkaProducer: Producer;

  constructor() {
    this.prisma = new PrismaClient();

    const kafka = new Kafka({
      clientId: 'ait-policy-manager',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
    });

    this.kafkaProducer = kafka.producer();
    this.kafkaProducer.connect();
  }

  // ==================== CRUD BÁSICO ====================

  async create(createPolicyDto: CreatePolicyDto, userId: string) {
    this.logger.log(`Creating new policy for client ${createPolicyDto.clientId}`);

    // Validar antes de crear
    const validation = await this.validatePolicy(createPolicyDto);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Policy validation failed',
        errors: validation.issues
      });
    }

    // Verificar solapamientos
    const hasOverlap = await this.checkOverlappingPolicies(
      createPolicyDto.clientId,
      createPolicyDto.type,
      createPolicyDto.effectiveDate
    );
    if (hasOverlap) {
      throw new ConflictException('Customer already has an active policy of this type in the same period');
    }

    try {
      const client = await this.prisma.party.findUnique({
        where: { id: createPolicyDto.clientId }
      });

      if (!client) {
        throw new NotFoundException(`Client ${createPolicyDto.clientId} not found`);
      }

      const product = await this.prisma.product.findUnique({
        where: { id: createPolicyDto.productId }
      });

      if (!product) {
        throw new NotFoundException(`Product ${createPolicyDto.productId} not found`);
      }

      const policyNumber = await this.generatePolicyNumber(createPolicyDto.type);

      const policy = await this.prisma.policy.create({
        data: {
          policyNumber,
          partyId: createPolicyDto.clientId,
          productId: createPolicyDto.productId,
          type: createPolicyDto.type,
          status: PolicyStatus.DRAFT,
          effectiveDate: createPolicyDto.effectiveDate,
          expirationDate: createPolicyDto.expirationDate,
          totalPremium: createPolicyDto.totalPremium,
          agentId: createPolicyDto.agentId,
          notes: createPolicyDto.notes,
          riskData: createPolicyDto.riskData as any,
          coverages: {
            create: createPolicyDto.coverages.map(cov => ({
              name: cov.name,
              sumInsured: cov.sumInsured,
              premium: cov.premium,
              deductible: cov.deductible,
              description: cov.description
            }))
          },
          createdBy: userId,
          updatedBy: userId
        },
        include: {
          coverages: true,
          party: true,
          product: true
        }
      });

      // Registrar en historial
      await this.addHistoryEntry(policy.id, {
        eventType: HistoryEventType.CREATED,
        description: `Policy ${policyNumber} created`,
        newData: policy,
        userId,
        userName: 'System'
      });

      await this.publishEvent('entity.policy.created', {
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        clientId: createPolicyDto.clientId,
        type: createPolicyDto.type,
        totalPremium: createPolicyDto.totalPremium,
        createdBy: userId,
        timestamp: new Date().toISOString()
      });

      this.logger.log(`Policy ${policy.policyNumber} created successfully`);
      return policy;
    } catch (error) {
      this.logger.error(`Error creating policy: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(filters?: PolicySearchDto): Promise<PaginatedResult<any>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.customerId) where.partyId = filters.customerId;
    if (filters?.agentId) where.agentId = filters.agentId;
    if (filters?.insurerId) where.insurerId = filters.insurerId;

    if (filters?.search) {
      where.OR = [
        { policyNumber: { contains: filters.search, mode: 'insensitive' } },
        { party: { name: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    if (filters?.effectiveDateFrom || filters?.effectiveDateTo) {
      where.effectiveDate = {};
      if (filters.effectiveDateFrom) where.effectiveDate.gte = filters.effectiveDateFrom;
      if (filters.effectiveDateTo) where.effectiveDate.lte = filters.effectiveDateTo;
    }

    if (filters?.expirationDateFrom || filters?.expirationDateTo) {
      where.expirationDate = {};
      if (filters.expirationDateFrom) where.expirationDate.gte = filters.expirationDateFrom;
      if (filters.expirationDateTo) where.expirationDate.lte = filters.expirationDateTo;
    }

    if (filters?.minPremium || filters?.maxPremium) {
      where.totalPremium = {};
      if (filters.minPremium) where.totalPremium.gte = filters.minPremium;
      if (filters.maxPremium) where.totalPremium.lte = filters.maxPremium;
    }

    const orderBy: any = {};
    if (filters?.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [policies, total] = await Promise.all([
      this.prisma.policy.findMany({
        where,
        include: {
          coverages: true,
          party: true,
          product: true
        },
        orderBy,
        skip,
        take: limit
      }),
      this.prisma.policy.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: policies,
      total,
      page,
      limit,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages
    };
  }

  async findOne(id: string) {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        coverages: true,
        party: true,
        product: true,
        claims: true,
        endorsements: true
      }
    });

    if (!policy) {
      throw new NotFoundException(`Policy ${id} not found`);
    }

    return policy;
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto, userId: string) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.policy.update({
      where: { id },
      data: {
        status: updatePolicyDto.status,
        totalPremium: updatePolicyDto.totalPremium,
        notes: updatePolicyDto.notes,
        riskData: updatePolicyDto.riskData as any,
        updatedBy: userId,
        updatedAt: new Date()
      },
      include: {
        coverages: true,
        party: true,
        product: true
      }
    });

    await this.addHistoryEntry(id, {
      eventType: HistoryEventType.UPDATED,
      description: 'Policy updated',
      previousData: existing,
      newData: updated,
      userId,
      userName: 'System'
    });

    await this.publishEvent('entity.policy.updated', {
      policyId: id,
      changes: updatePolicyDto,
      updatedBy: userId,
      timestamp: new Date().toISOString()
    });

    return updated;
  }

  // ==================== GESTIÓN AVANZADA ====================

  async cancel(id: string, cancelDto: CancelPolicyDto, userId: string) {
    const policy = await this.findOne(id);

    if (policy.status === PolicyStatus.CANCELLED) {
      throw new BadRequestException('Policy is already cancelled');
    }

    const canCancel = await this.canCancel(id);
    if (!canCancel) {
      throw new BadRequestException('Policy cannot be cancelled due to active claims or pending payments');
    }

    const cancelled = await this.prisma.policy.update({
      where: { id },
      data: {
        status: PolicyStatus.CANCELLED,
        cancellationDate: cancelDto.cancellationDate,
        cancellationReason: cancelDto.reason,
        refundAmount: cancelDto.refundAmount,
        updatedBy: userId,
        updatedAt: new Date()
      },
      include: {
        coverages: true,
        party: true,
        product: true
      }
    });

    await this.addHistoryEntry(id, {
      eventType: HistoryEventType.CANCELLED,
      description: `Policy cancelled: ${cancelDto.reason}`,
      previousData: { status: policy.status },
      newData: { status: PolicyStatus.CANCELLED, cancellationDate: cancelDto.cancellationDate },
      userId,
      userName: 'System'
    });

    await this.publishEvent('entity.policy.cancelled', {
      policyId: id,
      policyNumber: policy.policyNumber,
      reason: cancelDto.reason,
      refundAmount: cancelDto.refundAmount,
      cancelledBy: userId,
      timestamp: new Date().toISOString()
    });

    return cancelled;
  }

  async renew(id: string, renewDto: RenewPolicyDto, userId: string) {
    const policy = await this.findOne(id);

    if (policy.status === PolicyStatus.CANCELLED) {
      throw new BadRequestException('Cannot renew a cancelled policy');
    }

    // Crear nueva póliza para el periodo renovado
    const newPolicyNumber = await this.generatePolicyNumber(policy.type);

    const renewedPolicy = await this.prisma.policy.create({
      data: {
        policyNumber: newPolicyNumber,
        partyId: policy.partyId,
        productId: policy.productId,
        type: policy.type,
        status: PolicyStatus.ACTIVE,
        effectiveDate: renewDto.newEffectiveDate,
        expirationDate: renewDto.newExpirationDate,
        totalPremium: renewDto.newPremium || policy.totalPremium,
        agentId: policy.agentId,
        notes: `Renewed from policy ${policy.policyNumber}`,
        riskData: policy.riskData,
        previousPolicyId: id,
        coverages: renewDto.keepCurrentCoverages ? {
          create: (policy.coverages as any[]).map(cov => ({
            name: cov.name,
            sumInsured: cov.sumInsured,
            premium: cov.premium,
            deductible: cov.deductible,
            description: cov.description
          }))
        } : undefined,
        createdBy: userId,
        updatedBy: userId
      },
      include: {
        coverages: true,
        party: true,
        product: true
      }
    });

    // Marcar la póliza anterior como expirada
    await this.prisma.policy.update({
      where: { id },
      data: {
        status: PolicyStatus.EXPIRED,
        nextPolicyId: renewedPolicy.id
      }
    });

    await this.addHistoryEntry(renewedPolicy.id, {
      eventType: HistoryEventType.RENEWED,
      description: `Renewed from policy ${policy.policyNumber}`,
      newData: renewedPolicy,
      userId,
      userName: 'System'
    });

    await this.publishEvent('entity.policy.renewed', {
      oldPolicyId: id,
      newPolicyId: renewedPolicy.id,
      oldPolicyNumber: policy.policyNumber,
      newPolicyNumber: newPolicyNumber,
      renewedBy: userId,
      timestamp: new Date().toISOString()
    });

    return renewedPolicy;
  }

  async endorse(id: string, endorseDto: EndorsePolicyDto, userId: string) {
    const policy = await this.findOne(id);

    if (policy.status !== PolicyStatus.ACTIVE) {
      throw new BadRequestException('Can only endorse active policies');
    }

    const validation = await this.validateEndorsement(id, endorseDto);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Endorsement validation failed',
        errors: validation.issues
      });
    }

    // Crear endoso
    const endorsement = await this.prisma.endorsement.create({
      data: {
        policyId: id,
        endorsementNumber: await this.generateEndorsementNumber(id),
        type: endorseDto.endorsementType,
        effectiveDate: endorseDto.effectiveDate,
        description: endorseDto.description,
        premiumAdjustment: endorseDto.premiumAdjustment,
        status: 'pending',
        createdBy: userId
      }
    });

    // Actualizar prima de la póliza
    const newPremium = policy.totalPremium + endorseDto.premiumAdjustment;
    await this.prisma.policy.update({
      where: { id },
      data: {
        totalPremium: newPremium,
        updatedBy: userId,
        updatedAt: new Date()
      }
    });

    // Añadir nuevas coberturas si aplica
    if (endorseDto.newCoverages && endorseDto.newCoverages.length > 0) {
      await this.prisma.coverage.createMany({
        data: endorseDto.newCoverages.map(cov => ({
          policyId: id,
          ...cov
        }))
      });
    }

    // Eliminar coberturas si aplica
    if (endorseDto.removeCoverageIds && endorseDto.removeCoverageIds.length > 0) {
      await this.prisma.coverage.deleteMany({
        where: {
          id: { in: endorseDto.removeCoverageIds },
          policyId: id
        }
      });
    }

    await this.addHistoryEntry(id, {
      eventType: HistoryEventType.ENDORSED,
      description: `Endorsement created: ${endorseDto.description}`,
      newData: { endorsementId: endorsement.id, premiumAdjustment: endorseDto.premiumAdjustment },
      userId,
      userName: 'System'
    });

    await this.publishEvent('entity.policy.endorsed', {
      policyId: id,
      endorsementId: endorsement.id,
      premiumAdjustment: endorseDto.premiumAdjustment,
      endorsedBy: userId,
      timestamp: new Date().toISOString()
    });

    return endorsement;
  }

  async suspend(id: string, reason: string, userId: string) {
    const policy = await this.findOne(id);

    if (policy.status !== PolicyStatus.ACTIVE) {
      throw new BadRequestException('Can only suspend active policies');
    }

    const suspended = await this.prisma.policy.update({
      where: { id },
      data: {
        status: PolicyStatus.SUSPENDED,
        suspensionReason: reason,
        suspensionDate: new Date(),
        updatedBy: userId,
        updatedAt: new Date()
      },
      include: {
        coverages: true,
        party: true,
        product: true
      }
    });

    await this.addHistoryEntry(id, {
      eventType: HistoryEventType.SUSPENDED,
      description: `Policy suspended: ${reason}`,
      userId,
      userName: 'System'
    });

    await this.publishEvent('entity.policy.suspended', {
      policyId: id,
      reason,
      suspendedBy: userId,
      timestamp: new Date().toISOString()
    });

    return suspended;
  }

  async reactivate(id: string, userId: string) {
    const policy = await this.findOne(id);

    if (policy.status !== PolicyStatus.SUSPENDED) {
      throw new BadRequestException('Can only reactivate suspended policies');
    }

    const reactivated = await this.prisma.policy.update({
      where: { id },
      data: {
        status: PolicyStatus.ACTIVE,
        suspensionReason: null,
        suspensionDate: null,
        updatedBy: userId,
        updatedAt: new Date()
      },
      include: {
        coverages: true,
        party: true,
        product: true
      }
    });

    await this.addHistoryEntry(id, {
      eventType: HistoryEventType.ACTIVATED,
      description: 'Policy reactivated',
      userId,
      userName: 'System'
    });

    await this.publishEvent('entity.policy.reactivated', {
      policyId: id,
      reactivatedBy: userId,
      timestamp: new Date().toISOString()
    });

    return reactivated;
  }

  async calculatePremium(quote: PolicyQuoteDto): Promise<QuoteResultDto> {
    this.logger.log(`Calculating premium for quote type: ${quote.type}`);

    let basePremium = 0;
    const coverageBreakdown: any[] = [];

    // Calcular prima por cada cobertura
    for (const coverage of quote.coverages) {
      const coveragePremium = coverage.premium || this.estimateCoveragePremium(coverage, quote.riskData);
      basePremium += coveragePremium;

      coverageBreakdown.push({
        coverageCode: coverage.code,
        name: coverage.name,
        premium: coveragePremium,
        sumInsured: coverage.sumInsured
      });
    }

    // Aplicar descuentos
    const discounts: any[] = [];
    let totalDiscounts = 0;
    if (quote.discountCodes && quote.discountCodes.length > 0) {
      for (const code of quote.discountCodes) {
        const discount = await this.calculateDiscount(code, basePremium, quote);
        if (discount > 0) {
          discounts.push({
            code,
            description: `Discount ${code}`,
            amount: discount
          });
          totalDiscounts += discount;
        }
      }
    }

    // Aplicar recargos
    const surcharges = await this.calculateSurcharges(quote);
    const totalSurcharges = surcharges.reduce((sum, s) => sum + s.amount, 0);

    const totalPremium = basePremium - totalDiscounts + totalSurcharges;

    const quoteId = `QT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const validityDays = 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    return {
      quoteId,
      totalPremium,
      basePremium,
      coverageBreakdown,
      discounts,
      totalDiscounts,
      surcharges,
      validityDays,
      expiresAt,
      notes: 'Quote is valid for 30 days'
    };
  }

  async generatePolicyNumber(type?: string): Promise<string> {
    const prefix = type ? type.substring(0, 3).toUpperCase() : 'POL';
    const year = new Date().getFullYear();

    const lastPolicy = await this.prisma.policy.findFirst({
      where: {
        policyNumber: {
          startsWith: `${prefix}-${year}-`
        }
      },
      orderBy: { policyNumber: 'desc' }
    });

    let sequence = 1;
    if (lastPolicy) {
      const parts = lastPolicy.policyNumber.split('-');
      const lastSequence = parseInt(parts[parts.length - 1]);
      sequence = lastSequence + 1;
    }

    const paddedSequence = String(sequence).padStart(6, '0');
    return `${prefix}-${year}-${paddedSequence}`;
  }

  async addCoverage(policyId: string, dto: CreateCoverageDto, userId: string) {
    const policy = await this.findOne(policyId);

    if (policy.status !== PolicyStatus.ACTIVE && policy.status !== PolicyStatus.DRAFT) {
      throw new BadRequestException('Can only add coverage to active or draft policies');
    }

    const coverage = await this.prisma.coverage.create({
      data: {
        policyId,
        ...dto
      }
    });

    // Actualizar prima total
    const newPremium = policy.totalPremium + dto.premium;
    await this.prisma.policy.update({
      where: { id: policyId },
      data: {
        totalPremium: newPremium,
        updatedBy: userId
      }
    });

    await this.addHistoryEntry(policyId, {
      eventType: HistoryEventType.COVERAGE_ADDED,
      description: `Coverage added: ${dto.name}`,
      newData: coverage,
      userId,
      userName: 'System'
    });

    return coverage;
  }

  async removeCoverage(policyId: string, coverageId: string, userId: string) {
    const policy = await this.findOne(policyId);
    const coverage = await this.prisma.coverage.findFirst({
      where: { id: coverageId, policyId }
    });

    if (!coverage) {
      throw new NotFoundException('Coverage not found');
    }

    if ((coverage as any).mandatory) {
      throw new BadRequestException('Cannot remove mandatory coverage');
    }

    await this.prisma.coverage.delete({
      where: { id: coverageId }
    });

    // Actualizar prima total
    const newPremium = policy.totalPremium - (coverage.premium || 0);
    await this.prisma.policy.update({
      where: { id: policyId },
      data: {
        totalPremium: newPremium,
        updatedBy: userId
      }
    });

    await this.addHistoryEntry(policyId, {
      eventType: HistoryEventType.COVERAGE_REMOVED,
      description: `Coverage removed: ${coverage.name}`,
      previousData: coverage,
      userId,
      userName: 'System'
    });
  }

  async updateCoverage(policyId: string, coverageId: string, dto: UpdateCoverageDto, userId: string) {
    const coverage = await this.prisma.coverage.findFirst({
      where: { id: coverageId, policyId }
    });

    if (!coverage) {
      throw new NotFoundException('Coverage not found');
    }

    const updated = await this.prisma.coverage.update({
      where: { id: coverageId },
      data: dto
    });

    // Recalcular prima si cambió
    if (dto.premium !== undefined) {
      const policy = await this.findOne(policyId);
      const premiumDiff = (dto.premium || 0) - (coverage.premium || 0);
      await this.prisma.policy.update({
        where: { id: policyId },
        data: {
          totalPremium: policy.totalPremium + premiumDiff,
          updatedBy: userId
        }
      });
    }

    return updated;
  }

  // ==================== RENOVACIONES AUTOMÁTICAS ====================

  async checkRenewals(): Promise<any[]> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringPolicies = await this.prisma.policy.findMany({
      where: {
        status: PolicyStatus.ACTIVE,
        expirationDate: {
          lte: thirtyDaysFromNow,
          gte: new Date()
        },
        autoRenew: true
      },
      include: {
        party: true,
        product: true,
        coverages: true
      }
    });

    this.logger.log(`Found ${expiringPolicies.length} policies eligible for renewal`);
    return expiringPolicies;
  }

  async processRenewal(policy: any, userId: string = 'system') {
    this.logger.log(`Processing auto-renewal for policy ${policy.policyNumber}`);

    const newEffectiveDate = new Date(policy.expirationDate);
    newEffectiveDate.setDate(newEffectiveDate.getDate() + 1);

    const newExpirationDate = new Date(newEffectiveDate);
    newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1);

    return await this.renew(policy.id, {
      newEffectiveDate,
      newExpirationDate,
      newPremium: policy.totalPremium * 1.05, // 5% increase
      keepCurrentCoverages: true
    }, userId);
  }

  async notifyRenewal(policy: any) {
    await this.publishEvent('entity.policy.renewal-notification', {
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      customerId: policy.partyId,
      customerEmail: policy.party?.email,
      expirationDate: policy.expirationDate,
      timestamp: new Date().toISOString()
    });
  }

  // ==================== ESTADÍSTICAS ====================

  async getStatistics(customerId?: string): Promise<PolicyStatisticsDto> {
    const where: any = customerId ? { partyId: customerId } : {};

    const [
      total,
      active,
      suspended,
      cancelled,
      expired,
      expiring,
      premiumSum,
      byType,
      byStatus
    ] = await Promise.all([
      this.prisma.policy.count({ where }),
      this.prisma.policy.count({ where: { ...where, status: PolicyStatus.ACTIVE } }),
      this.prisma.policy.count({ where: { ...where, status: PolicyStatus.SUSPENDED } }),
      this.prisma.policy.count({ where: { ...where, status: PolicyStatus.CANCELLED } }),
      this.prisma.policy.count({ where: { ...where, status: PolicyStatus.EXPIRED } }),
      this.prisma.policy.count({
        where: {
          ...where,
          status: PolicyStatus.ACTIVE,
          expirationDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      this.prisma.policy.aggregate({
        where,
        _sum: { totalPremium: true }
      }),
      this.prisma.policy.groupBy({
        by: ['type'],
        where,
        _count: true,
        _sum: { totalPremium: true }
      }),
      this.prisma.policy.groupBy({
        by: ['status'],
        where,
        _count: true
      })
    ]);

    const typeStats: any = {};
    byType.forEach((item: any) => {
      typeStats[item.type] = {
        count: item._count,
        totalPremium: item._sum.totalPremium || 0,
        averagePremium: item._count > 0 ? (item._sum.totalPremium || 0) / item._count : 0
      };
    });

    const statusStats: any = {};
    byStatus.forEach((item: any) => {
      statusStats[item.status] = item._count;
    });

    return {
      totalPolicies: total,
      activePolicies: active,
      suspendedPolicies: suspended,
      cancelledPolicies: cancelled,
      expiredPolicies: expired,
      expiringPolicies: expiring,
      totalAnnualPremium: premiumSum._sum.totalPremium || 0,
      averagePremium: total > 0 ? (premiumSum._sum.totalPremium || 0) / total : 0,
      totalSumInsured: 0, // Would need to aggregate coverages
      byType: typeStats,
      byStatus: statusStats,
      topAgents: [], // Would need agent data
      monthlyRenewals: 0,
      monthlyNewPolicies: 0,
      monthlyCancellations: 0,
      renewalRate: 0,
      cancellationRate: cancelled > 0 && total > 0 ? (cancelled / total) * 100 : 0
    };
  }

  async getActivePolicies(customerId: string) {
    return await this.prisma.policy.findMany({
      where: {
        partyId: customerId,
        status: PolicyStatus.ACTIVE
      },
      include: {
        coverages: true,
        product: true
      }
    });
  }

  async getExpiringPolicies(days: number) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return await this.prisma.policy.findMany({
      where: {
        status: PolicyStatus.ACTIVE,
        expirationDate: {
          lte: targetDate,
          gte: new Date()
        }
      },
      include: {
        party: true,
        coverages: true
      }
    });
  }

  async getTotalPremium(customerId: string): Promise<number> {
    const result = await this.prisma.policy.aggregate({
      where: {
        partyId: customerId,
        status: PolicyStatus.ACTIVE
      },
      _sum: {
        totalPremium: true
      }
    });

    return result._sum.totalPremium || 0;
  }

  async getPolicyHistory(policyId: string): Promise<PolicyHistoryDto[]> {
    // Esta implementación requeriría una tabla de historial
    // Por ahora retornamos un placeholder
    return [];
  }

  // ==================== DOCUMENTOS ====================

  async uploadDocument(policyId: string, file: Express.Multer.File, type: string, userId: string): Promise<any> {
    // Integración con ait-document-vault pendiente
    this.logger.log(`Uploading document for policy ${policyId}`);

    await this.addHistoryEntry(policyId, {
      eventType: HistoryEventType.DOCUMENT_ADDED,
      description: `Document uploaded: ${file.originalname}`,
      userId,
      userName: 'System'
    });

    return {
      id: `doc_${Date.now()}`,
      fileName: file.originalname,
      type,
      uploadedAt: new Date()
    };
  }

  async getDocuments(policyId: string): Promise<PolicyDocumentDto[]> {
    // Integración con ait-document-vault pendiente
    return [];
  }

  async deleteDocument(policyId: string, documentId: string, userId: string): Promise<void> {
    // Integración con ait-document-vault pendiente
    this.logger.log(`Deleting document ${documentId} from policy ${policyId}`);
  }

  async generateCertificate(policyId: string): Promise<Buffer> {
    const policy = await this.findOne(policyId);
    // Generación de PDF pendiente
    return Buffer.from(`Policy Certificate for ${policy.policyNumber}`);
  }

  // ==================== VALIDACIONES ====================

  async validatePolicy(dto: CreatePolicyDto): Promise<ValidationResultDto> {
    const issues: ValidationIssue[] = [];

    // Validar fechas
    if (dto.effectiveDate >= dto.expirationDate) {
      issues.push({
        code: 'INVALID_DATES',
        message: 'Expiration date must be after effective date',
        severity: ValidationSeverity.ERROR,
        field: 'expirationDate'
      });
    }

    // Validar prima mínima
    const minPremium = await this.getMinimumPremium(dto.type);
    if (dto.totalPremium < minPremium) {
      issues.push({
        code: 'PREMIUM_TOO_LOW',
        message: `Premium must be at least ${minPremium} for ${dto.type} policies`,
        severity: ValidationSeverity.ERROR,
        field: 'totalPremium',
        currentValue: dto.totalPremium,
        expectedValue: minPremium
      });
    }

    // Validar coberturas
    if (!dto.coverages || dto.coverages.length === 0) {
      issues.push({
        code: 'NO_COVERAGES',
        message: 'At least one coverage is required',
        severity: ValidationSeverity.ERROR,
        field: 'coverages'
      });
    }

    return {
      isValid: issues.filter(i => i.severity === ValidationSeverity.ERROR).length === 0,
      canProceed: issues.filter(i => i.severity === ValidationSeverity.ERROR).length === 0,
      issues,
      errorCount: issues.filter(i => i.severity === ValidationSeverity.ERROR).length,
      warningCount: issues.filter(i => i.severity === ValidationSeverity.WARNING).length
    };
  }

  async checkOverlappingPolicies(customerId: string, type: PolicyType, startDate: Date): Promise<boolean> {
    const overlapping = await this.prisma.policy.findFirst({
      where: {
        partyId: customerId,
        type,
        status: { in: [PolicyStatus.ACTIVE, PolicyStatus.PENDING_APPROVAL] },
        effectiveDate: { lte: startDate },
        expirationDate: { gte: startDate }
      }
    });

    return !!overlapping;
  }

  async validateEndorsement(policyId: string, dto: EndorsePolicyDto): Promise<ValidationResultDto> {
    const issues: ValidationIssue[] = [];
    const policy = await this.findOne(policyId);

    if (dto.effectiveDate < policy.effectiveDate || dto.effectiveDate > policy.expirationDate) {
      issues.push({
        code: 'ENDORSEMENT_DATE_OUT_OF_RANGE',
        message: 'Endorsement effective date must be within policy period',
        severity: ValidationSeverity.ERROR,
        field: 'effectiveDate'
      });
    }

    return {
      isValid: issues.length === 0,
      canProceed: issues.length === 0,
      issues,
      errorCount: issues.length,
      warningCount: 0
    };
  }

  async canCancel(policyId: string): Promise<boolean> {
    // Verificar que no haya claims activos
    const activeClaims = await this.prisma.claim.count({
      where: {
        policyId,
        status: { in: ['pending', 'in_review', 'approved'] }
      }
    });

    return activeClaims === 0;
  }

  // ==================== HELPERS PRIVADOS ====================

  private async addHistoryEntry(policyId: string, data: {
    eventType: HistoryEventType;
    description: string;
    previousData?: any;
    newData?: any;
    userId: string;
    userName: string;
  }) {
    // Implementación de historial
    this.logger.debug(`History entry: ${data.description} for policy ${policyId}`);
  }

  private async publishEvent(topic: string, payload: any) {
    try {
      await this.kafkaProducer.send({
        topic,
        messages: [{
          key: payload.policyId || payload.quoteId,
          value: JSON.stringify(payload)
        }]
      });
    } catch (error) {
      this.logger.error(`Error publishing Kafka event: ${error.message}`);
    }
  }

  private estimateCoveragePremium(coverage: CreateCoverageDto, riskData: any): number {
    // Lógica simple de estimación
    return coverage.sumInsured * 0.01; // 1% de la suma asegurada
  }

  private async calculateDiscount(code: string, basePremium: number, quote: PolicyQuoteDto): Promise<number> {
    // Lógica de descuentos
    return basePremium * 0.1; // 10% descuento ejemplo
  }

  private async calculateSurcharges(quote: PolicyQuoteDto): Promise<any[]> {
    // Lógica de recargos
    return [];
  }

  private async getMinimumPremium(type: PolicyType): Promise<number> {
    const minimums: Record<PolicyType, number> = {
      [PolicyType.AUTO]: 300,
      [PolicyType.HOME]: 200,
      [PolicyType.LIFE]: 500,
      [PolicyType.HEALTH]: 400,
      [PolicyType.BUSINESS]: 1000,
      [PolicyType.TRAVEL]: 50,
      [PolicyType.LIABILITY]: 350
    };
    return minimums[type] || 100;
  }

  private async generateEndorsementNumber(policyId: string): Promise<string> {
    const policy = await this.findOne(policyId);
    const count = await this.prisma.endorsement.count({ where: { policyId } });
    return `${policy.policyNumber}-END-${String(count + 1).padStart(3, '0')}`;
  }

  async onModuleDestroy() {
    await this.kafkaProducer.disconnect();
    await this.prisma.$disconnect();
  }
}
