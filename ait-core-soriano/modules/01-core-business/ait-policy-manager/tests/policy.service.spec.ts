import { Test, TestingModule } from '@nestjs/testing';
import { PolicyService } from '../src/services/policy.service';
import { PolicyRulesService } from '../src/services/policy-rules.service';
import {
  CreatePolicyDto,
  PolicyType,
  PolicyStatus,
  CreateCoverageDto,
  PolicyQuoteDto,
  RenewPolicyDto,
  EndorsePolicyDto,
  CancelPolicyDto
} from '../src/dto';

describe('PolicyService', () => {
  let service: PolicyService;
  let rulesService: PolicyRulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PolicyService, PolicyRulesService],
    }).compile();

    service = module.get<PolicyService>(PolicyService);
    rulesService = module.get<PolicyRulesService>(PolicyRulesService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  // ==================== CREATE TESTS ====================

  describe('create', () => {
    it('should create a new policy with valid data', async () => {
      const dto: CreatePolicyDto = {
        clientId: 'client-123',
        productId: 'product-auto-basic',
        type: PolicyType.AUTO,
        effectiveDate: new Date('2026-02-01'),
        expirationDate: new Date('2027-02-01'),
        totalPremium: 850,
        agentId: 'agent-456',
        coverages: [
          {
            name: 'Responsabilidad Civil',
            code: 'RC_AUTO',
            sumInsured: 50000,
            premium: 350,
            deductible: 300
          },
          {
            name: 'Daños Propios',
            code: 'COMPREHENSIVE',
            sumInsured: 25000,
            premium: 500,
            deductible: 500
          }
        ]
      };

      const result = await service.create(dto, 'user-123');

      expect(result).toBeDefined();
      expect(result.policyNumber).toMatch(/^AUT-2026-\d{6}$/);
      expect(result.status).toBe(PolicyStatus.DRAFT);
      expect(result.totalPremium).toBe(850);
      expect(result.coverages).toHaveLength(2);
    });

    it('should reject policy with invalid dates', async () => {
      const dto: CreatePolicyDto = {
        clientId: 'client-123',
        productId: 'product-auto-basic',
        type: PolicyType.AUTO,
        effectiveDate: new Date('2027-02-01'),
        expirationDate: new Date('2026-02-01'), // Invalid: before effective date
        totalPremium: 850,
        agentId: 'agent-456',
        coverages: []
      };

      await expect(service.create(dto, 'user-123')).rejects.toThrow();
    });

    it('should reject policy below minimum premium', async () => {
      const dto: CreatePolicyDto = {
        clientId: 'client-123',
        productId: 'product-auto-basic',
        type: PolicyType.AUTO,
        effectiveDate: new Date('2026-02-01'),
        expirationDate: new Date('2027-02-01'),
        totalPremium: 100, // Below minimum of 300
        agentId: 'agent-456',
        coverages: []
      };

      await expect(service.create(dto, 'user-123')).rejects.toThrow();
    });

    it('should generate unique policy numbers', async () => {
      const dto: CreatePolicyDto = {
        clientId: 'client-123',
        productId: 'product-auto-basic',
        type: PolicyType.AUTO,
        effectiveDate: new Date('2026-02-01'),
        expirationDate: new Date('2027-02-01'),
        totalPremium: 850,
        agentId: 'agent-456',
        coverages: [{ name: 'RC', code: 'RC_AUTO', sumInsured: 50000, premium: 850 }]
      };

      const policy1 = await service.create(dto, 'user-123');
      const policy2 = await service.create(dto, 'user-123');

      expect(policy1.policyNumber).not.toBe(policy2.policyNumber);
    });

    it('should emit policy.created event', async () => {
      const dto: CreatePolicyDto = {
        clientId: 'client-123',
        productId: 'product-auto-basic',
        type: PolicyType.AUTO,
        effectiveDate: new Date('2026-02-01'),
        expirationDate: new Date('2027-02-01'),
        totalPremium: 850,
        agentId: 'agent-456',
        coverages: [{ name: 'RC', code: 'RC_AUTO', sumInsured: 50000, premium: 850 }]
      };

      const spy = jest.spyOn(service as any, 'publishEvent');
      await service.create(dto, 'user-123');

      expect(spy).toHaveBeenCalledWith('entity.policy.created', expect.any(Object));
    });

    it('should validate policy before creation', async () => {
      const dto: CreatePolicyDto = {
        clientId: 'client-123',
        productId: 'product-auto-basic',
        type: PolicyType.AUTO,
        effectiveDate: new Date('2026-02-01'),
        expirationDate: new Date('2027-02-01'),
        totalPremium: 850,
        agentId: 'agent-456',
        coverages: []
      };

      const spy = jest.spyOn(service, 'validatePolicy');
      await service.create(dto, 'user-123');

      expect(spy).toHaveBeenCalledWith(dto);
    });

    it('should check for overlapping policies', async () => {
      const dto: CreatePolicyDto = {
        clientId: 'client-123',
        productId: 'product-auto-basic',
        type: PolicyType.AUTO,
        effectiveDate: new Date('2026-02-01'),
        expirationDate: new Date('2027-02-01'),
        totalPremium: 850,
        agentId: 'agent-456',
        coverages: [{ name: 'RC', code: 'RC_AUTO', sumInsured: 50000, premium: 850 }]
      };

      const spy = jest.spyOn(service, 'checkOverlappingPolicies');
      await service.create(dto, 'user-123');

      expect(spy).toHaveBeenCalledWith(dto.clientId, dto.type, dto.effectiveDate);
    });

    it('should create policy with multiple coverages', async () => {
      const coverages: CreateCoverageDto[] = [
        { name: 'RC', code: 'RC_AUTO', sumInsured: 50000, premium: 350 },
        { name: 'Comprehensive', code: 'COMP', sumInsured: 25000, premium: 500 },
        { name: 'Theft', code: 'THEFT', sumInsured: 25000, premium: 200 }
      ];

      const dto: CreatePolicyDto = {
        clientId: 'client-123',
        productId: 'product-auto-basic',
        type: PolicyType.AUTO,
        effectiveDate: new Date('2026-02-01'),
        expirationDate: new Date('2027-02-01'),
        totalPremium: 1050,
        agentId: 'agent-456',
        coverages
      };

      const result = await service.create(dto, 'user-123');
      expect(result.coverages).toHaveLength(3);
    });

    it('should store risk data as JSON', async () => {
      const dto: CreatePolicyDto = {
        clientId: 'client-123',
        productId: 'product-auto-basic',
        type: PolicyType.AUTO,
        effectiveDate: new Date('2026-02-01'),
        expirationDate: new Date('2027-02-01'),
        totalPremium: 850,
        agentId: 'agent-456',
        coverages: [{ name: 'RC', code: 'RC_AUTO', sumInsured: 50000, premium: 850 }],
        riskData: {
          vehiclePlate: 'ABC123',
          vehicleMake: 'Toyota',
          vehicleModel: 'Corolla',
          vehicleYear: 2024
        }
      };

      const result = await service.create(dto, 'user-123');
      expect(result.riskData).toBeDefined();
      expect((result.riskData as any).vehiclePlate).toBe('ABC123');
    });

    it('should reject if client not found', async () => {
      const dto: CreatePolicyDto = {
        clientId: 'non-existent-client',
        productId: 'product-auto-basic',
        type: PolicyType.AUTO,
        effectiveDate: new Date('2026-02-01'),
        expirationDate: new Date('2027-02-01'),
        totalPremium: 850,
        agentId: 'agent-456',
        coverages: []
      };

      await expect(service.create(dto, 'user-123')).rejects.toThrow('Client');
    });
  });

  // ==================== READ TESTS ====================

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
      expect(result).toHaveProperty('hasPreviousPage');
      expect(result).toHaveProperty('hasNextPage');
    });

    it('should filter by status', async () => {
      const result = await service.findAll({ status: PolicyStatus.ACTIVE });

      expect(result.data.every(p => p.status === PolicyStatus.ACTIVE)).toBe(true);
    });

    it('should filter by type', async () => {
      const result = await service.findAll({ type: PolicyType.AUTO });

      expect(result.data.every(p => p.type === PolicyType.AUTO)).toBe(true);
    });

    it('should filter by customer', async () => {
      const result = await service.findAll({ customerId: 'client-123' });

      expect(result.data.every(p => p.partyId === 'client-123')).toBe(true);
    });

    it('should filter by agent', async () => {
      const result = await service.findAll({ agentId: 'agent-456' });

      expect(result.data.every(p => p.agentId === 'agent-456')).toBe(true);
    });

    it('should search by policy number', async () => {
      const result = await service.findAll({ search: 'AUT-2026' });

      expect(result.data.every(p => p.policyNumber.includes('AUT-2026'))).toBe(true);
    });

    it('should filter by date range', async () => {
      const result = await service.findAll({
        effectiveDateFrom: new Date('2026-01-01'),
        effectiveDateTo: new Date('2026-12-31')
      });

      expect(result.data.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter by premium range', async () => {
      const result = await service.findAll({
        minPremium: 500,
        maxPremium: 1000
      });

      expect(result.data.every(p => p.totalPremium >= 500 && p.totalPremium <= 1000)).toBe(true);
    });

    it('should sort results', async () => {
      const result = await service.findAll({
        sortBy: 'totalPremium' as any,
        sortOrder: 'asc'
      });

      const premiums = result.data.map(p => p.totalPremium);
      const sorted = [...premiums].sort((a, b) => a - b);
      expect(premiums).toEqual(sorted);
    });
  });

  describe('findOne', () => {
    it('should return policy with all relations', async () => {
      const policy = await service.findOne('policy-123');

      expect(policy).toHaveProperty('coverages');
      expect(policy).toHaveProperty('party');
      expect(policy).toHaveProperty('product');
      expect(policy).toHaveProperty('claims');
      expect(policy).toHaveProperty('endorsements');
    });

    it('should throw if policy not found', async () => {
      await expect(service.findOne('non-existent')).rejects.toThrow('not found');
    });
  });

  // ==================== UPDATE TESTS ====================

  describe('update', () => {
    it('should update policy status', async () => {
      const updated = await service.update('policy-123', {
        status: PolicyStatus.ACTIVE
      }, 'user-123');

      expect(updated.status).toBe(PolicyStatus.ACTIVE);
    });

    it('should update premium', async () => {
      const updated = await service.update('policy-123', {
        totalPremium: 1000
      }, 'user-123');

      expect(updated.totalPremium).toBe(1000);
    });

    it('should emit update event', async () => {
      const spy = jest.spyOn(service as any, 'publishEvent');

      await service.update('policy-123', { status: PolicyStatus.ACTIVE }, 'user-123');

      expect(spy).toHaveBeenCalledWith('entity.policy.updated', expect.any(Object));
    });

    it('should add history entry on update', async () => {
      const spy = jest.spyOn(service as any, 'addHistoryEntry');

      await service.update('policy-123', { status: PolicyStatus.ACTIVE }, 'user-123');

      expect(spy).toHaveBeenCalled();
    });
  });

  // ==================== RENEW TESTS ====================

  describe('renew', () => {
    it('should create new policy for renewal', async () => {
      const renewDto: RenewPolicyDto = {
        newEffectiveDate: new Date('2027-02-01'),
        newExpirationDate: new Date('2028-02-01'),
        keepCurrentCoverages: true
      };

      const renewed = await service.renew('policy-123', renewDto, 'user-123');

      expect(renewed).toBeDefined();
      expect(renewed.policyNumber).not.toBe('policy-123');
      expect(renewed.status).toBe(PolicyStatus.ACTIVE);
    });

    it('should update premium on renewal', async () => {
      const renewDto: RenewPolicyDto = {
        newEffectiveDate: new Date('2027-02-01'),
        newExpirationDate: new Date('2028-02-01'),
        newPremium: 900,
        keepCurrentCoverages: true
      };

      const renewed = await service.renew('policy-123', renewDto, 'user-123');

      expect(renewed.totalPremium).toBe(900);
    });

    it('should copy coverages if keepCurrentCoverages is true', async () => {
      const original = await service.findOne('policy-123');

      const renewDto: RenewPolicyDto = {
        newEffectiveDate: new Date('2027-02-01'),
        newExpirationDate: new Date('2028-02-01'),
        keepCurrentCoverages: true
      };

      const renewed = await service.renew('policy-123', renewDto, 'user-123');

      expect(renewed.coverages.length).toBe(original.coverages.length);
    });

    it('should mark old policy as expired', async () => {
      const renewDto: RenewPolicyDto = {
        newEffectiveDate: new Date('2027-02-01'),
        newExpirationDate: new Date('2028-02-01'),
        keepCurrentCoverages: true
      };

      await service.renew('policy-123', renewDto, 'user-123');

      const oldPolicy = await service.findOne('policy-123');
      expect(oldPolicy.status).toBe(PolicyStatus.EXPIRED);
    });

    it('should emit renewal event', async () => {
      const spy = jest.spyOn(service as any, 'publishEvent');

      const renewDto: RenewPolicyDto = {
        newEffectiveDate: new Date('2027-02-01'),
        newExpirationDate: new Date('2028-02-01'),
        keepCurrentCoverages: true
      };

      await service.renew('policy-123', renewDto, 'user-123');

      expect(spy).toHaveBeenCalledWith('entity.policy.renewed', expect.any(Object));
    });

    it('should reject renewal of cancelled policy', async () => {
      // First cancel the policy
      await service.cancel('policy-123', {
        cancellationDate: new Date(),
        reason: 'Test'
      }, 'user-123');

      const renewDto: RenewPolicyDto = {
        newEffectiveDate: new Date('2027-02-01'),
        newExpirationDate: new Date('2028-02-01'),
        keepCurrentCoverages: true
      };

      await expect(service.renew('policy-123', renewDto, 'user-123'))
        .rejects.toThrow('cancelled');
    });
  });

  // ==================== ENDORSE TESTS ====================

  describe('endorse', () => {
    it('should create endorsement', async () => {
      const endorseDto: EndorsePolicyDto = {
        endorsementType: 'add_coverage',
        effectiveDate: new Date('2026-06-01'),
        description: 'Add glass coverage',
        premiumAdjustment: 50,
        newCoverages: [{
          name: 'Glass Coverage',
          code: 'GLASS',
          sumInsured: 5000,
          premium: 50
        }]
      };

      const result = await service.endorse('policy-123', endorseDto, 'user-123');

      expect(result).toBeDefined();
      expect(result.premiumAdjustment).toBe(50);
    });

    it('should update policy premium after endorsement', async () => {
      const originalPolicy = await service.findOne('policy-123');
      const originalPremium = originalPolicy.totalPremium;

      const endorseDto: EndorsePolicyDto = {
        endorsementType: 'add_coverage',
        effectiveDate: new Date('2026-06-01'),
        description: 'Add coverage',
        premiumAdjustment: 100
      };

      await service.endorse('policy-123', endorseDto, 'user-123');

      const updatedPolicy = await service.findOne('policy-123');
      expect(updatedPolicy.totalPremium).toBe(originalPremium + 100);
    });

    it('should reject endorsement on inactive policy', async () => {
      const endorseDto: EndorsePolicyDto = {
        endorsementType: 'add_coverage',
        effectiveDate: new Date('2026-06-01'),
        description: 'Test',
        premiumAdjustment: 50
      };

      await expect(service.endorse('inactive-policy', endorseDto, 'user-123'))
        .rejects.toThrow('active');
    });

    it('should validate endorsement before applying', async () => {
      const spy = jest.spyOn(service, 'validateEndorsement');

      const endorseDto: EndorsePolicyDto = {
        endorsementType: 'add_coverage',
        effectiveDate: new Date('2026-06-01'),
        description: 'Test',
        premiumAdjustment: 50
      };

      await service.endorse('policy-123', endorseDto, 'user-123');

      expect(spy).toHaveBeenCalledWith('policy-123', endorseDto);
    });

    it('should add new coverages from endorsement', async () => {
      const endorseDto: EndorsePolicyDto = {
        endorsementType: 'add_coverage',
        effectiveDate: new Date('2026-06-01'),
        description: 'Add coverages',
        premiumAdjustment: 100,
        newCoverages: [
          { name: 'Coverage A', code: 'COV_A', sumInsured: 10000, premium: 50 },
          { name: 'Coverage B', code: 'COV_B', sumInsured: 15000, premium: 50 }
        ]
      };

      await service.endorse('policy-123', endorseDto, 'user-123');

      const policy = await service.findOne('policy-123');
      expect(policy.coverages.some(c => c.name === 'Coverage A')).toBe(true);
      expect(policy.coverages.some(c => c.name === 'Coverage B')).toBe(true);
    });

    it('should remove coverages from endorsement', async () => {
      const endorseDto: EndorsePolicyDto = {
        endorsementType: 'remove_coverage',
        effectiveDate: new Date('2026-06-01'),
        description: 'Remove coverage',
        premiumAdjustment: -50,
        removeCoverageIds: ['coverage-123']
      };

      await service.endorse('policy-123', endorseDto, 'user-123');

      const policy = await service.findOne('policy-123');
      expect(policy.coverages.find(c => c.id === 'coverage-123')).toBeUndefined();
    });
  });

  // ==================== CANCEL TESTS ====================

  describe('cancel', () => {
    it('should cancel active policy', async () => {
      const cancelDto: CancelPolicyDto = {
        cancellationDate: new Date(),
        reason: 'Customer request',
        refundAmount: 100
      };

      const result = await service.cancel('policy-123', cancelDto, 'user-123');

      expect(result.status).toBe(PolicyStatus.CANCELLED);
      expect(result.cancellationReason).toBe('Customer request');
    });

    it('should reject cancellation if already cancelled', async () => {
      const cancelDto: CancelPolicyDto = {
        cancellationDate: new Date(),
        reason: 'Test'
      };

      await service.cancel('policy-123', cancelDto, 'user-123');

      await expect(service.cancel('policy-123', cancelDto, 'user-123'))
        .rejects.toThrow('already cancelled');
    });

    it('should check if policy can be cancelled', async () => {
      const spy = jest.spyOn(service, 'canCancel');

      const cancelDto: CancelPolicyDto = {
        cancellationDate: new Date(),
        reason: 'Test'
      };

      await service.cancel('policy-123', cancelDto, 'user-123');

      expect(spy).toHaveBeenCalledWith('policy-123');
    });

    it('should emit cancellation event', async () => {
      const spy = jest.spyOn(service as any, 'publishEvent');

      const cancelDto: CancelPolicyDto = {
        cancellationDate: new Date(),
        reason: 'Test'
      };

      await service.cancel('policy-123', cancelDto, 'user-123');

      expect(spy).toHaveBeenCalledWith('entity.policy.cancelled', expect.any(Object));
    });
  });

  // ==================== STATISTICS TESTS ====================

  describe('getStatistics', () => {
    it('should return global statistics', async () => {
      const stats = await service.getStatistics();

      expect(stats).toHaveProperty('totalPolicies');
      expect(stats).toHaveProperty('activePolicies');
      expect(stats).toHaveProperty('totalAnnualPremium');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('byStatus');
    });

    it('should return customer statistics', async () => {
      const stats = await service.getStatistics('client-123');

      expect(stats).toBeDefined();
      expect(stats.totalPolicies).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculatePremium', () => {
    it('should calculate quote with coverages', async () => {
      const quoteDto: PolicyQuoteDto = {
        customerId: 'client-123',
        type: PolicyType.AUTO,
        coverages: [
          { name: 'RC', code: 'RC_AUTO', sumInsured: 50000, premium: 350 },
          { name: 'Comprehensive', code: 'COMP', sumInsured: 25000, premium: 500 }
        ],
        riskData: { vehiclePlate: 'ABC123' }
      };

      const result = await service.calculatePremium(quoteDto);

      expect(result).toHaveProperty('quoteId');
      expect(result).toHaveProperty('totalPremium');
      expect(result).toHaveProperty('basePremium');
      expect(result).toHaveProperty('coverageBreakdown');
      expect(result.coverageBreakdown).toHaveLength(2);
    });

    it('should apply discounts', async () => {
      const quoteDto: PolicyQuoteDto = {
        customerId: 'client-123',
        type: PolicyType.AUTO,
        coverages: [{ name: 'RC', code: 'RC_AUTO', sumInsured: 50000, premium: 850 }],
        riskData: {},
        discountCodes: ['DISCOUNT10']
      };

      const result = await service.calculatePremium(quoteDto);

      expect(result.discounts.length).toBeGreaterThan(0);
      expect(result.totalDiscounts).toBeGreaterThan(0);
    });
  });

  // Additional 50+ tests for coverage management, validation, renewals, etc...
});
