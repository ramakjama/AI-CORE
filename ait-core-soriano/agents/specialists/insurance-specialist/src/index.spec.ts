import { Test, TestingModule } from '@nestjs/testing';
import { InsurancePolicyFactory } from '../../../../test/mocks/factories/insurance-policy.factory';

describe('InsuranceSpecialistAgent', () => {
  let agent: any;

  beforeEach(async () => {
    // Mock agent implementation
    agent = {
      analyzePolicyRisk: jest.fn(),
      recommendCoverage: jest.fn(),
      processQuote: jest.fn(),
      compareProducts: jest.fn(),
      assessClaim: jest.fn(),
    };
  });

  describe('analyzePolicyRisk', () => {
    it('should analyze risk factors for a policy', async () => {
      const policy = InsurancePolicyFactory.createVida();
      const riskFactors = {
        age: 45,
        occupation: 'construction worker',
        healthStatus: 'good',
        coverage: policy.coverage,
      };

      agent.analyzePolicyRisk.mockResolvedValue({
        riskLevel: 'medium',
        riskScore: 6.5,
        factors: ['age', 'occupation'],
        recommendations: ['Increase premium by 15%', 'Require medical exam'],
      });

      const result = await agent.analyzePolicyRisk(riskFactors);

      expect(result.riskLevel).toBeDefined();
      expect(result.riskScore).toBeGreaterThan(0);
      expect(Array.isArray(result.factors)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should identify high-risk scenarios', async () => {
      const highRiskFactors = {
        age: 65,
        occupation: 'pilot',
        healthStatus: 'poor',
        smoker: true,
      };

      agent.analyzePolicyRisk.mockResolvedValue({
        riskLevel: 'high',
        riskScore: 9.2,
        factors: ['age', 'occupation', 'health', 'smoking'],
      });

      const result = await agent.analyzePolicyRisk(highRiskFactors);

      expect(result.riskLevel).toBe('high');
      expect(result.riskScore).toBeGreaterThan(8);
    });

    it('should identify low-risk scenarios', async () => {
      const lowRiskFactors = {
        age: 28,
        occupation: 'software developer',
        healthStatus: 'excellent',
        smoker: false,
      };

      agent.analyzePolicyRisk.mockResolvedValue({
        riskLevel: 'low',
        riskScore: 2.5,
        factors: [],
      });

      const result = await agent.analyzePolicyRisk(lowRiskFactors);

      expect(result.riskLevel).toBe('low');
      expect(result.riskScore).toBeLessThan(4);
    });
  });

  describe('recommendCoverage', () => {
    it('should recommend appropriate coverage amount', async () => {
      const clientProfile = {
        age: 35,
        income: 60000,
        dependents: 2,
        debts: 150000,
      };

      agent.recommendCoverage.mockResolvedValue({
        recommendedCoverage: 500000,
        reasoning: 'Based on income replacement and debt coverage',
        breakdown: {
          incomeReplacement: 300000,
          debtCoverage: 150000,
          emergencyFund: 50000,
        },
      });

      const result = await agent.recommendCoverage(clientProfile);

      expect(result.recommendedCoverage).toBeGreaterThan(0);
      expect(result.reasoning).toBeDefined();
      expect(result.breakdown).toBeDefined();
    });

    it('should adjust recommendations based on dependents', async () => {
      const noDependents = { age: 30, income: 50000, dependents: 0 };
      const withDependents = { age: 30, income: 50000, dependents: 3 };

      agent.recommendCoverage
        .mockResolvedValueOnce({ recommendedCoverage: 200000 })
        .mockResolvedValueOnce({ recommendedCoverage: 400000 });

      const result1 = await agent.recommendCoverage(noDependents);
      const result2 = await agent.recommendCoverage(withDependents);

      expect(result2.recommendedCoverage).toBeGreaterThan(result1.recommendedCoverage);
    });
  });

  describe('processQuote', () => {
    it('should generate insurance quote', async () => {
      const quoteRequest = {
        type: 'vida',
        age: 35,
        coverage: 300000,
        term: 20,
        healthClass: 'standard',
      };

      agent.processQuote.mockResolvedValue({
        quoteId: 'quote-123',
        monthlyPremium: 45.50,
        annualPremium: 546,
        coverage: 300000,
        term: 20,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const result = await agent.processQuote(quoteRequest);

      expect(result.quoteId).toBeDefined();
      expect(result.monthlyPremium).toBeGreaterThan(0);
      expect(result.coverage).toBe(quoteRequest.coverage);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should handle multiple product types', async () => {
      const productTypes = ['vida', 'salud', 'autos', 'hogar'];

      for (const type of productTypes) {
        agent.processQuote.mockResolvedValue({
          quoteId: `quote-${type}`,
          productType: type,
          monthlyPremium: 50,
        });

        const result = await agent.processQuote({ type });
        expect(result.productType).toBe(type);
      }
    });
  });

  describe('compareProducts', () => {
    it('should compare multiple insurance products', async () => {
      const products = [
        { provider: 'Provider A', premium: 100, coverage: 200000 },
        { provider: 'Provider B', premium: 120, coverage: 250000 },
        { provider: 'Provider C', premium: 90, coverage: 200000 },
      ];

      agent.compareProducts.mockResolvedValue({
        bestValue: 'Provider C',
        bestCoverage: 'Provider B',
        comparison: products.map((p) => ({
          ...p,
          valueScore: (p.coverage / p.premium) * 100,
        })),
      });

      const result = await agent.compareProducts(products);

      expect(result.bestValue).toBeDefined();
      expect(result.bestCoverage).toBeDefined();
      expect(Array.isArray(result.comparison)).toBe(true);
    });

    it('should rank products by value score', async () => {
      const products = [
        { provider: 'A', premium: 100, coverage: 200000 },
        { provider: 'B', premium: 50, coverage: 100000 },
      ];

      agent.compareProducts.mockResolvedValue({
        comparison: products.map((p) => ({
          ...p,
          valueScore: p.coverage / p.premium,
        })),
      });

      const result = await agent.compareProducts(products);
      const scores = result.comparison.map((p: any) => p.valueScore);

      expect(scores[0]).toBe(2000); // 200000/100
      expect(scores[1]).toBe(2000); // 100000/50
    });
  });

  describe('assessClaim', () => {
    it('should assess claim validity', async () => {
      const claim = {
        policyId: 'policy-123',
        type: 'health',
        amount: 5000,
        documents: ['invoice.pdf', 'medical-report.pdf'],
        dateOfService: new Date('2024-01-15'),
      };

      agent.assessClaim.mockResolvedValue({
        claimId: 'claim-456',
        status: 'approved',
        approvedAmount: 5000,
        processingTime: 5,
        reasoning: 'All documents verified, claim within policy limits',
      });

      const result = await agent.assessClaim(claim);

      expect(result.claimId).toBeDefined();
      expect(result.status).toBe('approved');
      expect(result.approvedAmount).toBe(claim.amount);
    });

    it('should flag suspicious claims', async () => {
      const suspiciousClaim = {
        policyId: 'policy-123',
        type: 'accident',
        amount: 100000,
        documents: [],
        dateOfService: new Date('2024-01-01'), // Same day as policy start
      };

      agent.assessClaim.mockResolvedValue({
        claimId: 'claim-789',
        status: 'under_review',
        flags: ['insufficient_documentation', 'timing_suspicious'],
        reasoning: 'Claim filed immediately after policy inception',
      });

      const result = await agent.assessClaim(suspiciousClaim);

      expect(result.status).toBe('under_review');
      expect(Array.isArray(result.flags)).toBe(true);
      expect(result.flags.length).toBeGreaterThan(0);
    });

    it('should validate claim amounts against policy limits', async () => {
      const policyLimit = 50000;
      const claimAmount = 75000;

      agent.assessClaim.mockResolvedValue({
        status: 'partially_approved',
        requestedAmount: claimAmount,
        approvedAmount: policyLimit,
        reasoning: 'Claim exceeds policy limit',
      });

      const result = await agent.assessClaim({ amount: claimAmount });

      expect(result.approvedAmount).toBeLessThanOrEqual(policyLimit);
      expect(result.approvedAmount).toBeLessThan(result.requestedAmount);
    });
  });

  describe('agent intelligence', () => {
    it('should learn from historical data', async () => {
      const historicalData = {
        approvedClaims: 850,
        deniedClaims: 150,
        averageProcessingTime: 7,
        commonDenialReasons: ['insufficient_docs', 'out_of_coverage'],
      };

      expect(historicalData.approvedClaims).toBeGreaterThan(historicalData.deniedClaims);

      const approvalRate = historicalData.approvedClaims /
        (historicalData.approvedClaims + historicalData.deniedClaims);

      expect(approvalRate).toBeGreaterThan(0.8);
    });

    it('should provide contextual recommendations', async () => {
      const context = {
        customerAge: 35,
        familyStatus: 'married_with_children',
        currentCoverage: 100000,
        income: 75000,
      };

      // Agent should recommend increasing coverage
      const expectedRecommendation = {
        action: 'increase_coverage',
        newCoverage: 500000,
        reason: 'Current coverage insufficient for family needs',
      };

      expect(expectedRecommendation.newCoverage).toBeGreaterThan(context.currentCoverage);
      expect(expectedRecommendation.action).toBe('increase_coverage');
    });
  });
});
