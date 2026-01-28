import { randomUUID, randomString } from '../../utils/test-helpers';

export interface AccountingEntryFactoryOptions {
  id?: string;
  description?: string;
  amount?: number;
  type?: 'debit' | 'credit';
  status?: 'pending' | 'approved' | 'rejected';
  accountCode?: string;
  date?: Date;
}

export class AccountingEntryFactory {
  static create(options: AccountingEntryFactoryOptions = {}): any {
    return {
      id: options.id || randomUUID(),
      description: options.description || `Test entry ${randomString(5)}`,
      amount: options.amount || Math.floor(Math.random() * 10000) + 100,
      type: options.type || 'debit',
      status: options.status || 'pending',
      accountCode: options.accountCode || `${Math.floor(Math.random() * 9000) + 1000}`,
      date: options.date || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static createMany(count: number, options: AccountingEntryFactoryOptions = {}): any[] {
    return Array.from({ length: count }, () => this.create(options));
  }

  static createPending(options: AccountingEntryFactoryOptions = {}): any {
    return this.create({ ...options, status: 'pending' });
  }

  static createApproved(options: AccountingEntryFactoryOptions = {}): any {
    return this.create({ ...options, status: 'approved' });
  }

  static createRejected(options: AccountingEntryFactoryOptions = {}): any {
    return this.create({ ...options, status: 'rejected' });
  }

  static createDebit(options: AccountingEntryFactoryOptions = {}): any {
    return this.create({ ...options, type: 'debit' });
  }

  static createCredit(options: AccountingEntryFactoryOptions = {}): any {
    return this.create({ ...options, type: 'credit' });
  }

  static createBalanced(): any[] {
    const amount = Math.floor(Math.random() * 10000) + 100;
    return [
      this.create({ type: 'debit', amount }),
      this.create({ type: 'credit', amount }),
    ];
  }
}
