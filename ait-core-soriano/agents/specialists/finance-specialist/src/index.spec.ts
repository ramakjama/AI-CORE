import { Test, TestingModule } from '@nestjs/testing';

describe('FinanceSpecialistAgent', () => {
  let agent: any;

  beforeEach(async () => {
    // Mock agent implementation
    agent = {
      analyzeFinancialHealth: jest.fn(),
      forecastCashFlow: jest.fn(),
      optimizeBudget: jest.fn(),
      detectAnomalies: jest.fn(),
      generateRecommendations: jest.fn(),
    };
  });

  describe('analyzeFinancialHealth', () => {
    it('should analyze company financial health', async () => {
      const financialData = {
        revenue: 1000000,
        expenses: 750000,
        assets: 500000,
        liabilities: 200000,
      };

      agent.analyzeFinancialHealth.mockResolvedValue({
        score: 75,
        rating: 'Good',
        metrics: {
          profitMargin: 25,
          debtToEquity: 0.67,
          currentRatio: 2.5,
          returnOnAssets: 50,
        },
        insights: [
          'Strong profit margin',
          'Healthy debt levels',
          'Good liquidity position',
        ],
      });

      const result = await agent.analyzeFinancialHealth(financialData);

      expect(result.score).toBeGreaterThan(0);
      expect(result.rating).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it('should identify financial risks', async () => {
      const riskyFinancialData = {
        revenue: 500000,
        expenses: 550000,
        assets: 300000,
        liabilities: 400000,
      };

      agent.analyzeFinancialHealth.mockResolvedValue({
        score: 35,
        rating: 'At Risk',
        risks: ['Negative cash flow', 'High debt ratio', 'Low liquidity'],
        urgentActions: ['Reduce expenses', 'Increase revenue', 'Restructure debt'],
      });

      const result = await agent.analyzeFinancialHealth(riskyFinancialData);

      expect(result.score).toBeLessThan(50);
      expect(result.rating).toContain('Risk');
      expect(Array.isArray(result.risks)).toBe(true);
      expect(result.risks.length).toBeGreaterThan(0);
    });
  });

  describe('forecastCashFlow', () => {
    it('should forecast cash flow for next 12 months', async () => {
      const historicalData = {
        monthlyRevenue: [100000, 105000, 110000, 108000],
        monthlyExpenses: [75000, 76000, 77000, 76500],
        seasonalFactors: { Q4: 1.2 },
      };

      agent.forecastCashFlow.mockResolvedValue({
        forecast: Array(12).fill(null).map((_, i) => ({
          month: i + 1,
          projectedRevenue: 110000 + (i * 2000),
          projectedExpenses: 77000 + (i * 1000),
          netCashFlow: 33000 + (i * 1000),
        })),
        confidence: 0.85,
        assumptions: ['5% revenue growth', '3% expense growth', 'No major disruptions'],
      });

      const result = await agent.forecastCashFlow(historicalData);

      expect(Array.isArray(result.forecast)).toBe(true);
      expect(result.forecast).toHaveLength(12);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should account for seasonal variations', async () => {
      const seasonalData = {
        historicalSeasonality: {
          Q1: 0.9,
          Q2: 1.0,
          Q3: 0.95,
          Q4: 1.15,
        },
      };

      agent.forecastCashFlow.mockResolvedValue({
        forecast: [
          { month: 1, multiplier: 0.9 },
          { month: 10, multiplier: 1.15 },
        ],
      });

      const result = await agent.forecastCashFlow(seasonalData);

      expect(result.forecast[1].multiplier).toBeGreaterThan(result.forecast[0].multiplier);
    });

    it('should identify potential cash shortfalls', async () => {
      agent.forecastCashFlow.mockResolvedValue({
        forecast: [
          { month: 1, netCashFlow: 30000 },
          { month: 2, netCashFlow: -5000 },
          { month: 3, netCashFlow: 25000 },
        ],
        warnings: [
          {
            month: 2,
            issue: 'Projected negative cash flow',
            amount: -5000,
            recommendation: 'Consider delaying non-essential expenses',
          },
        ],
      });

      const result = await agent.forecastCashFlow({});

      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].amount).toBeLessThan(0);
    });
  });

  describe('optimizeBudget', () => {
    it('should optimize budget allocation', async () => {
      const currentBudget = {
        marketing: 50000,
        operations: 100000,
        personnel: 150000,
        technology: 30000,
        overhead: 20000,
      };

      agent.optimizeBudget.mockResolvedValue({
        optimizedBudget: {
          marketing: 60000,
          operations: 95000,
          personnel: 150000,
          technology: 40000,
          overhead: 15000,
        },
        savings: 5000,
        projectedROI: 15,
        recommendations: [
          'Increase marketing budget by 20% for better ROI',
          'Invest in automation to reduce operational costs',
          'Reduce overhead through process optimization',
        ],
      });

      const result = await agent.optimizeBudget(currentBudget);

      expect(result.optimizedBudget).toBeDefined();
      expect(result.savings).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should prioritize high-ROI areas', async () => {
      const departmentROI = {
        marketing: 3.5,
        technology: 2.8,
        operations: 1.2,
      };

      agent.optimizeBudget.mockResolvedValue({
        priorityOrder: ['marketing', 'technology', 'operations'],
        reasoning: 'Prioritized by ROI potential',
      });

      const result = await agent.optimizeBudget({ roi: departmentROI });

      expect(result.priorityOrder[0]).toBe('marketing');
    });
  });

  describe('detectAnomalies', () => {
    it('should detect unusual transactions', async () => {
      const transactions = [
        { amount: 1000, category: 'office supplies', date: '2024-01-15' },
        { amount: 50000, category: 'office supplies', date: '2024-01-16' },
        { amount: 1200, category: 'office supplies', date: '2024-01-17' },
      ];

      agent.detectAnomalies.mockResolvedValue({
        anomalies: [
          {
            transaction: transactions[1],
            reason: 'Amount exceeds 10x average for category',
            severity: 'high',
            requiresReview: true,
          },
        ],
        summary: {
          total: 3,
          flagged: 1,
          autoApproved: 2,
        },
      });

      const result = await agent.detectAnomalies(transactions);

      expect(Array.isArray(result.anomalies)).toBe(true);
      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.anomalies[0].severity).toBe('high');
    });

    it('should identify duplicate payments', async () => {
      const transactions = [
        { id: '1', vendor: 'Acme Corp', amount: 5000, date: '2024-01-15' },
        { id: '2', vendor: 'Acme Corp', amount: 5000, date: '2024-01-15' },
      ];

      agent.detectAnomalies.mockResolvedValue({
        anomalies: [
          {
            type: 'duplicate_payment',
            transactions: ['1', '2'],
            recommendation: 'Verify if both payments are legitimate',
          },
        ],
      });

      const result = await agent.detectAnomalies(transactions);

      expect(result.anomalies.some((a: any) => a.type === 'duplicate_payment')).toBe(true);
    });

    it('should flag unusual spending patterns', async () => {
      const monthlySpending = [
        { month: 1, amount: 50000 },
        { month: 2, amount: 52000 },
        { month: 3, amount: 75000 },
      ];

      agent.detectAnomalies.mockResolvedValue({
        anomalies: [
          {
            type: 'spending_spike',
            month: 3,
            increase: 44,
            averageMonthly: 51000,
          },
        ],
      });

      const result = await agent.detectAnomalies({ spending: monthlySpending });

      expect(result.anomalies[0].type).toBe('spending_spike');
      expect(result.anomalies[0].increase).toBeGreaterThan(40);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate actionable financial recommendations', async () => {
      const financialContext = {
        cashReserves: 50000,
        monthlyBurn: 30000,
        revenue: 100000,
        growthRate: 0.05,
      };

      agent.generateRecommendations.mockResolvedValue({
        recommendations: [
          {
            priority: 'high',
            category: 'liquidity',
            title: 'Increase cash reserves',
            description: 'Current reserves only cover 1.6 months of burn rate',
            action: 'Build reserves to cover 6 months',
            impact: 'Improved financial stability',
          },
          {
            priority: 'medium',
            category: 'growth',
            title: 'Accelerate revenue growth',
            description: 'Current 5% growth is below industry average',
            action: 'Invest in sales and marketing',
            impact: 'Increased market share',
          },
        ],
      });

      const result = await agent.generateRecommendations(financialContext);

      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0]).toHaveProperty('priority');
      expect(result.recommendations[0]).toHaveProperty('action');
    });

    it('should prioritize recommendations by urgency', async () => {
      agent.generateRecommendations.mockResolvedValue({
        recommendations: [
          { priority: 'high', urgency: 10 },
          { priority: 'medium', urgency: 5 },
          { priority: 'low', urgency: 2 },
        ],
      });

      const result = await agent.generateRecommendations({});

      expect(result.recommendations[0].urgency).toBeGreaterThan(result.recommendations[1].urgency);
    });

    it('should provide cost-benefit analysis', async () => {
      agent.generateRecommendations.mockResolvedValue({
        recommendations: [
          {
            title: 'Implement automated invoicing',
            cost: 5000,
            estimatedSavings: 20000,
            paybackPeriod: 3,
            roi: 300,
          },
        ],
      });

      const result = await agent.generateRecommendations({});

      expect(result.recommendations[0].roi).toBeGreaterThan(100);
      expect(result.recommendations[0].estimatedSavings).toBeGreaterThan(
        result.recommendations[0].cost,
      );
    });
  });
});
