import { randomUUID, randomString } from '../../utils/test-helpers';

export interface InsurancePolicyFactoryOptions {
  id?: string;
  policyNumber?: string;
  type?: string;
  status?: 'active' | 'pending' | 'cancelled' | 'expired';
  premium?: number;
  coverage?: number;
  startDate?: Date;
  endDate?: Date;
  clientId?: string;
}

export class InsurancePolicyFactory {
  static create(options: InsurancePolicyFactoryOptions = {}): any {
    const startDate = options.startDate || new Date();
    const endDate = options.endDate || new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

    return {
      id: options.id || randomUUID(),
      policyNumber: options.policyNumber || `POL-${randomString(8).toUpperCase()}`,
      type: options.type || 'vida',
      status: options.status || 'active',
      premium: options.premium || Math.floor(Math.random() * 1000) + 100,
      coverage: options.coverage || Math.floor(Math.random() * 100000) + 10000,
      startDate,
      endDate,
      clientId: options.clientId || randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static createMany(count: number, options: InsurancePolicyFactoryOptions = {}): any[] {
    return Array.from({ length: count }, () => this.create(options));
  }

  static createVida(options: InsurancePolicyFactoryOptions = {}): any {
    return this.create({ ...options, type: 'vida' });
  }

  static createSalud(options: InsurancePolicyFactoryOptions = {}): any {
    return this.create({ ...options, type: 'salud' });
  }

  static createAutos(options: InsurancePolicyFactoryOptions = {}): any {
    return this.create({ ...options, type: 'autos' });
  }

  static createHogar(options: InsurancePolicyFactoryOptions = {}): any {
    return this.create({ ...options, type: 'hogar' });
  }

  static createActive(options: InsurancePolicyFactoryOptions = {}): any {
    return this.create({ ...options, status: 'active' });
  }

  static createPending(options: InsurancePolicyFactoryOptions = {}): any {
    return this.create({ ...options, status: 'pending' });
  }

  static createCancelled(options: InsurancePolicyFactoryOptions = {}): any {
    return this.create({ ...options, status: 'cancelled' });
  }

  static createExpired(options: InsurancePolicyFactoryOptions = {}): any {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 30); // 30 days ago

    return this.create({
      ...options,
      status: 'expired',
      endDate,
    });
  }
}
