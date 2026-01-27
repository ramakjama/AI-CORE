import { Injectable } from '@nestjs/common';

@Injectable()
export class LeadsService {
  private leads = [
    { id: '1', name: 'Pedro Martínez', email: 'pedro@example.com', phone: '+34600111222', source: 'WEB', status: 'NEW', score: 85 },
    { id: '2', name: 'Ana López', email: 'ana@example.com', phone: '+34600333444', source: 'REFERRAL', status: 'CONTACTED', score: 92 },
    { id: '3', name: 'Carlos Ruiz', email: 'carlos@example.com', phone: '+34600555666', source: 'CAMPAIGN', status: 'QUALIFIED', score: 78 },
  ];

  async findAll() {
    return this.leads;
  }

  async findOne(id: string) {
    return this.leads.find(lead => lead.id === id);
  }

  async create(data: any) {
    const newLead = { id: Date.now().toString(), ...data, status: 'NEW', score: Math.floor(Math.random() * 40) + 60 };
    this.leads.push(newLead);
    return newLead;
  }

  async update(id: string, data: any) {
    const index = this.leads.findIndex(lead => lead.id === id);
    if (index !== -1) {
      this.leads[index] = { ...this.leads[index], ...data };
      return this.leads[index];
    }
    return null;
  }

  async qualify(id: string) {
    const lead = this.leads.find(l => l.id === id);
    if (lead) {
      lead.status = 'QUALIFIED';
      lead.score = Math.min(lead.score + 10, 100);
      return lead;
    }
    return null;
  }

  async convert(id: string) {
    const lead = this.leads.find(l => l.id === id);
    if (lead) {
      lead.status = 'CONVERTED';
      return { ...lead, clientId: Date.now().toString() };
    }
    return null;
  }
}
