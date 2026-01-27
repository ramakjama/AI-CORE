import { Injectable } from '@nestjs/common';

@Injectable()
export class ClientsService {
  private clients = [
    {
      id: '1',
      firstName: 'María',
      lastName: 'García',
      email: 'maria.garcia@example.com',
      phone: '+34 600 123 456',
      status: 'ACTIVE',
      segment: 'PREMIUM',
      totalPolicies: 3,
      totalPremium: 2500,
      createdAt: new Date('2023-01-15'),
    },
    {
      id: '2',
      firstName: 'Juan',
      lastName: 'Martínez',
      email: 'juan.martinez@example.com',
      phone: '+34 600 234 567',
      status: 'ACTIVE',
      segment: 'STANDARD',
      totalPolicies: 1,
      totalPremium: 800,
      createdAt: new Date('2023-03-20'),
    },
  ];

  async findAll(filters?: any) {
    let result = [...this.clients];
    
    if (filters?.status) {
      result = result.filter(c => c.status === filters.status);
    }
    
    if (filters?.segment) {
      result = result.filter(c => c.segment === filters.segment);
    }
    
    return result;
  }

  async findOne(id: string) {
    return this.clients.find(client => client.id === id);
  }

  async create(clientData: any) {
    const newClient = {
      id: Date.now().toString(),
      ...clientData,
      totalPolicies: 0,
      totalPremium: 0,
      createdAt: new Date(),
    };
    this.clients.push(newClient);
    return newClient;
  }

  async update(id: string, clientData: any) {
    const index = this.clients.findIndex(c => c.id === id);
    if (index !== -1) {
      this.clients[index] = { ...this.clients[index], ...clientData };
      return this.clients[index];
    }
    return null;
  }

  async remove(id: string) {
    const index = this.clients.findIndex(c => c.id === id);
    if (index !== -1) {
      const client = this.clients[index];
      this.clients.splice(index, 1);
      return client;
    }
    return null;
  }

  async getStats() {
    return {
      total: this.clients.length,
      active: this.clients.filter(c => c.status === 'ACTIVE').length,
      bySegment: {
        premium: this.clients.filter(c => c.segment === 'PREMIUM').length,
        standard: this.clients.filter(c => c.segment === 'STANDARD').length,
        basic: this.clients.filter(c => c.segment === 'BASIC').length,
      },
      totalPremium: this.clients.reduce((sum, c) => sum + c.totalPremium, 0),
    };
  }
}
