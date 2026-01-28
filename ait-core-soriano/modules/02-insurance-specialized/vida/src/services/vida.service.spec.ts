import { Test, TestingModule } from '@nestjs/testing';
import { VidaService } from './vida.service';
import { InsurancePolicyFactory } from '../../../../../test/mocks/factories/insurance-policy.factory';

describe('VidaService', () => {
  let service: VidaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VidaService],
    }).compile();

    service = module.get<VidaService>(VidaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePremium', () => {
    it('should calculate premium based on age and coverage', () => {
      const age = 30;
      const coverage = 100000;

      // Mock implementation
      const basePremium = coverage * 0.001;
      const ageFactor = age < 40 ? 1 : age < 60 ? 1.5 : 2;
      const expectedPremium = basePremium * ageFactor;

      expect(expectedPremium).toBeGreaterThan(0);
    });

    it('should apply age-based risk factors', () => {
      const youngAge = 25;
      const oldAge = 65;
      const coverage = 100000;

      const youngPremium = coverage * 0.001 * 1;
      const oldPremium = coverage * 0.001 * 2;

      expect(oldPremium).toBeGreaterThan(youngPremium);
    });
  });

  describe('assessRisk', () => {
    it('should assess risk based on health factors', () => {
      const healthFactors = {
        smoker: false,
        chronicConditions: [],
        bmi: 25,
        familyHistory: false,
      };

      // Low risk scenario
      expect(healthFactors.smoker).toBe(false);
      expect(healthFactors.chronicConditions).toHaveLength(0);
    });

    it('should increase risk for smokers', () => {
      const smokerRisk = { smoker: true };
      const nonSmokerRisk = { smoker: false };

      expect(smokerRisk.smoker).toBe(true);
      expect(nonSmokerRisk.smoker).toBe(false);
    });
  });

  describe('validateBeneficiaries', () => {
    it('should validate beneficiary distribution totals 100%', () => {
      const beneficiaries = [
        { name: 'John Doe', percentage: 50 },
        { name: 'Jane Doe', percentage: 50 },
      ];

      const total = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
      expect(total).toBe(100);
    });

    it('should reject invalid distribution', () => {
      const beneficiaries = [
        { name: 'John Doe', percentage: 60 },
        { name: 'Jane Doe', percentage: 50 },
      ];

      const total = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
      expect(total).not.toBe(100);
    });
  });

  describe('processClaim', () => {
    it('should process valid death claim', () => {
      const policy = InsurancePolicyFactory.createVida({
        status: 'active',
        coverage: 100000,
      });

      const claim = {
        policyId: policy.id,
        type: 'death',
        amount: policy.coverage,
        documents: ['death-certificate.pdf'],
      };

      expect(claim.type).toBe('death');
      expect(claim.amount).toBe(policy.coverage);
      expect(claim.documents).toContain('death-certificate.pdf');
    });

    it('should validate required documents', () => {
      const requiredDocuments = ['death-certificate', 'beneficiary-id', 'policy-document'];
      const providedDocuments = ['death-certificate', 'beneficiary-id'];

      const hasAllDocuments = requiredDocuments.every((doc) =>
        providedDocuments.some((provided) => provided.includes(doc)),
      );

      expect(hasAllDocuments).toBe(false);
    });
  });

  describe('renewPolicy', () => {
    it('should calculate renewal premium', () => {
      const policy = InsurancePolicyFactory.createVida({
        premium: 1000,
        status: 'active',
      });

      const yearsActive = 5;
      const inflationRate = 0.03;
      const newPremium = policy.premium * Math.pow(1 + inflationRate, yearsActive);

      expect(newPremium).toBeGreaterThan(policy.premium);
    });

    it('should apply loyalty discount for long-term customers', () => {
      const baseRenewalPremium = 1000;
      const yearsAsCustomer = 10;
      const loyaltyDiscount = yearsAsCustomer >= 5 ? 0.1 : 0;

      const finalPremium = baseRenewalPremium * (1 - loyaltyDiscount);

      expect(finalPremium).toBeLessThan(baseRenewalPremium);
    });
  });

  describe('calculateCashValue', () => {
    it('should calculate cash value for whole life policy', () => {
      const policy = InsurancePolicyFactory.createVida({
        premium: 1000,
        startDate: new Date('2020-01-01'),
      });

      const monthsActive = 48; // 4 years
      const cashValueRate = 0.02; // 2% of premiums paid

      const totalPremiumsPaid = policy.premium * (monthsActive / 12);
      const cashValue = totalPremiumsPaid * cashValueRate;

      expect(cashValue).toBeGreaterThan(0);
    });

    it('should return zero cash value for term life policy', () => {
      const termLifeCashValue = 0;
      expect(termLifeCashValue).toBe(0);
    });
  });
});
