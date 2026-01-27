import { Injectable } from '@nestjs/common';

@Injectable()
export class FinanceService {
  async getDashboard() {
    return {
      revenue: {
        total: 125000,
        monthly: 45000,
        growth: 12.5,
      },
      expenses: {
        total: 85000,
        monthly: 28000,
        growth: 8.2,
      },
      profit: {
        total: 40000,
        monthly: 17000,
        margin: 32,
      },
      commissions: {
        pending: 15000,
        paid: 35000,
        total: 50000,
      },
    };
  }

  async getInvoices(filters?: any) {
    return [
      {
        id: '1',
        number: 'INV-2024-001',
        clientId: '1',
        amount: 1200,
        status: 'PAID',
        dueDate: new Date('2024-01-31'),
        paidAt: new Date('2024-01-25'),
      },
      {
        id: '2',
        number: 'INV-2024-002',
        clientId: '2',
        amount: 800,
        status: 'PENDING',
        dueDate: new Date('2024-02-15'),
      },
    ];
  }

  async getCommissions(filters?: any) {
    return [
      {
        id: '1',
        agentId: '1',
        policyId: '1',
        amount: 120,
        percentage: 10,
        status: 'PAID',
        paidAt: new Date('2024-01-31'),
      },
      {
        id: '2',
        agentId: '2',
        policyId: '2',
        amount: 80,
        percentage: 10,
        status: 'PENDING',
      },
    ];
  }

  async getCashFlow(period: string) {
    return {
      period,
      income: [
        { month: 'Jan', amount: 45000 },
        { month: 'Feb', amount: 52000 },
        { month: 'Mar', amount: 48000 },
      ],
      expenses: [
        { month: 'Jan', amount: 28000 },
        { month: 'Feb', amount: 31000 },
        { month: 'Mar', amount: 29000 },
      ],
    };
  }
}
