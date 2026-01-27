import { Injectable } from '@nestjs/common';

@Injectable()
export class ClaimsService {
  private claims = [
    {
      id: '1',
      claimNumber: 'CLM-2024-001',
      policyId: '1',
      clientId: '1',
      type: 'AUTO_ACCIDENT',
      status: 'UNDER_REVIEW',
      amount: 5000,
      description: 'Traffic accident on highway',
      reportedAt: new Date('2024-01-20'),
      estimatedResolution: new Date('2024-02-05'),
    },
  ];

  async findAll(filters?: any) {
    let result = [...this.claims];
    
    if (filters?.clientId) {
      result = result.filter(c => c.clientId === filters.clientId);
    }
    
    if (filters?.status) {
      result = result.filter(c => c.status === filters.status);
    }
    
    return result;
  }

  async findOne(id: string) {
    return this.claims.find(claim => claim.id === id);
  }

  async create(claimData: any) {
    const newClaim = {
      id: Date.now().toString(),
      claimNumber: `CLM-${new Date().getFullYear()}-${String(this.claims.length + 1).padStart(3, '0')}`,
      ...claimData,
      status: 'SUBMITTED',
      reportedAt: new Date(),
    };
    this.claims.push(newClaim);
    return newClaim;
  }

  async update(id: string, claimData: any) {
    const index = this.claims.findIndex(c => c.id === id);
    if (index !== -1) {
      this.claims[index] = { ...this.claims[index], ...claimData };
      return this.claims[index];
    }
    return null;
  }

  async getStats() {
    return {
      total: this.claims.length,
      byStatus: {
        submitted: this.claims.filter(c => c.status === 'SUBMITTED').length,
        underReview: this.claims.filter(c => c.status === 'UNDER_REVIEW').length,
        approved: this.claims.filter(c => c.status === 'APPROVED').length,
        rejected: this.claims.filter(c => c.status === 'REJECTED').length,
      },
      totalAmount: this.claims.reduce((sum, c) => sum + c.amount, 0),
    };
  }
}
