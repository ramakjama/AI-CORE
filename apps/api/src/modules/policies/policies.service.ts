import { Injectable } from '@nestjs/common';

@Injectable()
export class PoliciesService {
  private policies = [
    {
      id: '1',
      policyNumber: 'POL-2024-001',
      clientId: '1',
      type: 'AUTO',
      status: 'ACTIVE',
      premium: 1200,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      insurer: 'Mapfre',
      coverage: 'Comprehensive',
    },
    {
      id: '2',
      policyNumber: 'POL-2024-002',
      clientId: '1',
      type: 'HOME',
      status: 'ACTIVE',
      premium: 800,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2025-01-14'),
      insurer: 'AXA',
      coverage: 'Full Coverage',
    },
  ];

  async findAll(filters?: any) {
    let result = [...this.policies];
    
    if (filters?.clientId) {
      result = result.filter(p => p.clientId === filters.clientId);
    }
    
    if (filters?.status) {
      result = result.filter(p => p.status === filters.status);
    }
    
    if (filters?.type) {
      result = result.filter(p => p.type === filters.type);
    }
    
    return result;
  }

  async findOne(id: string) {
    return this.policies.find(policy => policy.id === id);
  }

  async create(policyData: any) {
    const newPolicy = {
      id: Date.now().toString(),
      policyNumber: `POL-${new Date().getFullYear()}-${String(this.policies.length + 1).padStart(3, '0')}`,
      ...policyData,
      status: 'ACTIVE',
    };
    this.policies.push(newPolicy);
    return newPolicy;
  }

  async update(id: string, policyData: any) {
    const index = this.policies.findIndex(p => p.id === id);
    if (index !== -1) {
      this.policies[index] = { ...this.policies[index], ...policyData };
      return this.policies[index];
    }
    return null;
  }

  async remove(id: string) {
    const index = this.policies.findIndex(p => p.id === id);
    if (index !== -1) {
      const policy = this.policies[index];
      this.policies.splice(index, 1);
      return policy;
    }
    return null;
  }

  async getStats() {
    return {
      total: this.policies.length,
      active: this.policies.filter(p => p.status === 'ACTIVE').length,
      byType: {
        auto: this.policies.filter(p => p.type === 'AUTO').length,
        home: this.policies.filter(p => p.type === 'HOME').length,
        life: this.policies.filter(p => p.type === 'LIFE').length,
        health: this.policies.filter(p => p.type === 'HEALTH').length,
      },
      totalPremium: this.policies.reduce((sum, p) => sum + p.premium, 0),
    };
  }
}
