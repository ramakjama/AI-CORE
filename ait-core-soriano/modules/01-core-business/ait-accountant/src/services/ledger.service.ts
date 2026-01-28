/**
 * LedgerService
 * Servicio para consulta de libro mayor y estados financieros
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { PgcEngineIntegrationService } from './pgc-engine-integration.service';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pgcEngine: PgcEngineIntegrationService,
  ) {}

  async getLedger(filters: {
    accountCode?: string;
    fiscalYear?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    this.logger.log('Getting ledger with filters:', filters);

    // TODO: Implementar consulta de libro mayor local
    // Por ahora, delegar a AI-PGC-ENGINE
    return this.pgcEngine.getLedger(filters);
  }

  async getTrialBalance(fiscalYear: string, period?: string) {
    this.logger.log(`Getting trial balance for ${fiscalYear}-${period || 'ALL'}`);

    // TODO: Implementar balance de sumas y saldos local
    return this.pgcEngine.getTrialBalance(fiscalYear, period);
  }

  async getBalanceSheet(fiscalYear: string, period?: string) {
    this.logger.log(`Getting balance sheet for ${fiscalYear}-${period || 'ALL'}`);

    // TODO: Implementar balance de situación local
    return this.pgcEngine.getBalanceSheet(fiscalYear, period);
  }

  async getIncomeStatement(fiscalYear: string, period?: string) {
    this.logger.log(`Getting income statement for ${fiscalYear}-${period || 'ALL'}`);

    // TODO: Implementar cuenta de PyG local
    return this.pgcEngine.getIncomeStatement(fiscalYear, period);
  }

  async getAccountBalance(accountId: string, date?: Date): Promise<number> {
    // TODO: Implement balance calculation from local ledger entries
    return 0;
  }

  async getAccountHistory(accountId: string, startDate?: Date, endDate?: Date) {
    // TODO: Implement account history retrieval from local ledger
    return {
      accountId,
      openingBalance: 0,
      transactions: [],
      closingBalance: 0,
    };
  }
}
