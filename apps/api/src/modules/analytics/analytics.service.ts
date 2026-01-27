import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  async getOverview() {
    return {
      clients: {
        total: 1250,
        new: 45,
        active: 1180,
        churn: 2.5,
      },
      policies: {
        total: 3200,
        active: 2950,
        expiring: 120,
        avgPremium: 850,
      },
      claims: {
        total: 180,
        pending: 45,
        approved: 120,
        avgAmount: 3500,
      },
      revenue: {
        total: 2720000,
        monthly: 226000,
        growth: 15.2,
      },
    };
  }

  async getSalesMetrics(period: string) {
    return {
      period,
      newPolicies: [
        { month: 'Jan', count: 45, revenue: 38250 },
        { month: 'Feb', count: 52, revenue: 44200 },
        { month: 'Mar', count: 48, revenue: 40800 },
      ],
      renewals: [
        { month: 'Jan', count: 120, revenue: 102000 },
        { month: 'Feb', count: 135, revenue: 114750 },
        { month: 'Mar', count: 128, revenue: 108800 },
      ],
      conversionRate: 68.5,
      avgDealSize: 850,
    };
  }

  async getAgentPerformance() {
    return [
      {
        agentId: '1',
        name: 'John Doe',
        policies: 45,
        revenue: 38250,
        commission: 3825,
        satisfaction: 4.8,
      },
      {
        agentId: '2',
        name: 'Jane Smith',
        policies: 52,
        revenue: 44200,
        commission: 4420,
        satisfaction: 4.9,
      },
    ];
  }

  async getCustomerInsights() {
    return {
      segments: {
        premium: { count: 320, revenue: 816000, avgValue: 2550 },
        standard: { count: 680, revenue: 1156000, avgValue: 1700 },
        basic: { count: 250, revenue: 212500, avgValue: 850 },
      },
      retention: {
        rate: 92.5,
        churnRate: 7.5,
        avgLifetime: 4.2,
      },
      satisfaction: {
        nps: 72,
        csat: 4.6,
        responseRate: 85,
      },
    };
  }

  async getPredictions() {
    return {
      nextMonth: {
        revenue: 245000,
        newPolicies: 55,
        renewals: 140,
        churn: 8,
      },
      trends: {
        revenue: 'up',
        policies: 'up',
        claims: 'stable',
        satisfaction: 'up',
      },
      recommendations: [
        'Focus on premium segment - highest growth potential',
        'Improve renewal process - 15% at risk',
        'Launch retention campaign for basic segment',
      ],
    };
  }
}
