import { ClaimService } from '../services/claim.service';
import { ClaimStateMachine } from '../workflow/claim-state-machine';
import { OCRService } from '../ocr/ocr.service';
import { DamageAssessmentService } from '../ocr/damage-assessment.service';
import { CreateClaimDto, FilterClaimDto, ApproveClaimDto, RejectClaimDto } from '../dto/claim.dto';
import { ClaimState, ClaimType, ClaimPriority } from '../enums/claim-state.enum';

describe('ClaimService', () => {
  let service: ClaimService;
  let stateMachine: ClaimStateMachine;
  let ocrService: OCRService;
  let damageAssessment: DamageAssessmentService;

  beforeEach(() => {
    stateMachine = new ClaimStateMachine();
    ocrService = new OCRService();
    damageAssessment = new DamageAssessmentService();
    service = new ClaimService(stateMachine, ocrService, damageAssessment);
  });

  describe('create', () => {
    it('should create a new claim', async () => {
      const dto: CreateClaimDto = {
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        title: 'Test Claim',
        description: 'Test description',
        incidentDate: new Date('2026-01-15'),
        estimatedAmount: 1500,
      };

      const claim = await service.create(dto);

      expect(claim).toBeDefined();
      expect(claim.id).toBeDefined();
      expect(claim.claimNumber).toBeDefined();
      expect(claim.state).toBe(ClaimState.DRAFT);
      expect(claim.type).toBe(ClaimType.AUTO_ACCIDENT);
      expect(claim.estimatedAmount).toBe(1500);
    });

    it('should set requiresApproval for claims over €1000', async () => {
      const dto: CreateClaimDto = {
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        title: 'High Value Claim',
        description: 'Test',
        incidentDate: new Date(),
        estimatedAmount: 5000,
      };

      const claim = await service.create(dto);

      expect(claim.requiresApproval).toBe(true);
    });

    it('should run fraud detection on creation', async () => {
      const dto: CreateClaimDto = {
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        title: 'Test',
        description: 'Test',
        incidentDate: new Date(),
        estimatedAmount: 1000,
      };

      const claim = await service.create(dto);

      expect(claim.fraudRiskLevel).toBeDefined();
      expect(claim.fraudScore).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      // Crear varios claims
      for (let i = 0; i < 5; i++) {
        await service.create({
          policyId: 'pol_123',
          customerId: 'cust_123',
          type: ClaimType.AUTO_ACCIDENT,
          title: `Claim ${i}`,
          description: 'Test',
          incidentDate: new Date(),
          estimatedAmount: 1000,
        });
      }

      const result = await service.findAll({ page: 1, limit: 3 });

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(2);
    });

    it('should filter by state', async () => {
      const claim1 = await service.create({
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        title: 'Claim 1',
        description: 'Test',
        incidentDate: new Date(),
        estimatedAmount: 1000,
      });

      await service.submit(claim1.id);

      const result = await service.findAll({ state: ClaimState.SUBMITTED });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].state).toBe(ClaimState.SUBMITTED);
    });

    it('should filter by type', async () => {
      await service.create({
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        title: 'Auto',
        description: 'Test',
        incidentDate: new Date(),
        estimatedAmount: 1000,
      });

      await service.create({
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.HEALTH,
        title: 'Health',
        description: 'Test',
        incidentDate: new Date(),
        estimatedAmount: 500,
      });

      const result = await service.findAll({ type: ClaimType.HEALTH });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe(ClaimType.HEALTH);
    });
  });

  describe('findOne', () => {
    it('should return a claim by id', async () => {
      const created = await service.create({
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        title: 'Test',
        description: 'Test',
        incidentDate: new Date(),
        estimatedAmount: 1000,
      });

      const found = await service.findOne(created.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
    });

    it('should throw error if claim not found', async () => {
      await expect(service.findOne('nonexistent')).rejects.toThrow('not found');
    });
  });

  describe('submit', () => {
    it('should transition claim to SUBMITTED', async () => {
      const claim = await service.create({
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        title: 'Test',
        description: 'Test',
        incidentDate: new Date(),
        estimatedAmount: 1000,
      });

      const submitted = await service.submit(claim.id);

      expect(submitted.state).toBe(ClaimState.SUBMITTED);
      expect(submitted.submittedDate).toBeDefined();
      expect(submitted.adjusterId).toBeDefined();
    });
  });

  describe('approve', () => {
    it('should approve a claim', async () => {
      const claim = await service.create({
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        title: 'Test',
        description: 'Test',
        incidentDate: new Date(),
        estimatedAmount: 1000,
      });

      await service.submit(claim.id);
      await service.review(claim.id, { reviewNotes: 'Looks good' });

      const dto: ApproveClaimDto = {
        approvedAmount: 900,
        approvalNotes: 'Approved with adjustment',
      };

      const approved = await service.approve(claim.id, dto);

      expect(approved.state).toBe(ClaimState.APPROVED);
      expect(approved.approvedAmount).toBe(900);
      expect(approved.approvedDate).toBeDefined();
    });
  });

  describe('reject', () => {
    it('should reject a claim', async () => {
      const claim = await service.create({
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        title: 'Test',
        description: 'Test',
        incidentDate: new Date(),
        estimatedAmount: 1000,
      });

      await service.submit(claim.id);

      const dto: RejectClaimDto = {
        reason: 'Policy exclusion',
        reasonCode: 'POLICY_EXCLUSION',
      };

      const rejected = await service.reject(claim.id, dto);

      expect(rejected.state).toBe(ClaimState.REJECTED);
      expect(rejected.rejectedDate).toBeDefined();
    });
  });

  describe('getStatistics', () => {
    it('should return claim statistics', async () => {
      // Crear varios claims en diferentes estados
      const claim1 = await service.create({
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        title: 'Test 1',
        description: 'Test',
        incidentDate: new Date(),
        estimatedAmount: 1000,
      });

      const claim2 = await service.create({
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.HEALTH,
        title: 'Test 2',
        description: 'Test',
        incidentDate: new Date(),
        estimatedAmount: 2000,
      });

      await service.submit(claim1.id);

      const stats = await service.getStatistics();

      expect(stats.totalClaims).toBe(2);
      expect(stats.claimsByState).toBeDefined();
      expect(stats.claimsByType).toBeDefined();
    });
  });

  describe('detectFraud', () => {
    it('should detect high fraud risk for high amounts', async () => {
      const claim = await service.create({
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        title: 'Test',
        description: 'Test',
        incidentDate: new Date(),
        estimatedAmount: 60000,
      });

      const analysis = await service.detectFraud(claim);

      expect(analysis.score).toBeGreaterThan(0);
      expect(analysis.riskLevel).toBeDefined();
    });

    it('should flag claims without documentation', async () => {
      const claim = await service.create({
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        title: 'Test',
        description: 'Test',
        incidentDate: new Date(),
        estimatedAmount: 1000,
      });

      const analysis = await service.detectFraud(claim);

      expect(analysis.flags.length).toBeGreaterThan(0);
    });
  });

  describe('getHighValueClaims', () => {
    it('should return claims above threshold', async () => {
      await service.create({
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        title: 'Low',
        description: 'Test',
        incidentDate: new Date(),
        estimatedAmount: 500,
      });

      await service.create({
        policyId: 'pol_123',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        title: 'High',
        description: 'Test',
        incidentDate: new Date(),
        estimatedAmount: 15000,
      });

      const highValue = await service.getHighValueClaims(10000);

      expect(highValue).toHaveLength(1);
      expect(highValue[0].estimatedAmount).toBeGreaterThanOrEqual(10000);
    });
  });
});
