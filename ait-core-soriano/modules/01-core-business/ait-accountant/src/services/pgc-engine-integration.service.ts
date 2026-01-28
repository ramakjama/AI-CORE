import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * PGC Engine Integration Service
 *
 * This service handles all communication with AI-PGC-ENGINE
 * for account classification, validation, and reporting.
 */
@Injectable()
export class PgcEngineIntegrationService {
  private readonly logger = new Logger(PgcEngineIntegrationService.name);
  private readonly pgcEngineUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Get PGC Engine URL from environment or use default
    this.pgcEngineUrl =
      this.configService.get<string>('PGC_ENGINE_URL') ||
      'http://ai-pgc-engine:3001';

    this.logger.log(`PGC Engine URL: ${this.pgcEngineUrl}`);
  }

  /**
   * Classify a transaction using AI
   *
   * @param description Transaction description
   * @param amount Transaction amount
   * @param date Transaction date
   * @returns Classified accounts with confidence scores
   */
  async classifyTransaction(
    description: string,
    amount: number,
    date: string,
  ): Promise<{
    debitAccount: string;
    creditAccount: string;
    confidence: number;
    reasoning?: string;
  }> {
    try {
      this.logger.debug(
        `Classifying transaction: "${description}" for ${amount}`,
      );

      const response = await firstValueFrom(
        this.httpService.post(`${this.pgcEngineUrl}/api/v1/pgc-engine/classify`, {
          description,
          amount,
          date,
        }),
      );

      this.logger.debug(`Classification result: ${JSON.stringify(response.data)}`);

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to classify transaction: ${error.message}`,
        error.stack,
      );
      throw new Error(`AI classification failed: ${error.message}`);
    }
  }

  /**
   * Get account by code from PGC
   *
   * @param accountCode Account code (e.g., "570", "430")
   * @returns Account details
   */
  async getAccount(accountCode: string): Promise<{
    code: string;
    name: string;
    type: string;
    group: string;
    level: number;
    isDebit: boolean;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.pgcEngineUrl}/api/v1/pgc-engine/accounts/${accountCode}`,
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get account ${accountCode}: ${error.message}`,
      );
      throw new Error(`Failed to get account: ${error.message}`);
    }
  }

  /**
   * Search accounts by keyword
   *
   * @param search Search keyword
   * @param type Optional account type filter
   * @returns Array of matching accounts
   */
  async searchAccounts(
    search: string,
    type?: string,
  ): Promise<
    Array<{
      code: string;
      name: string;
      type: string;
    }>
  > {
    try {
      const params: any = { search };
      if (type) {
        params.type = type;
      }

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.pgcEngineUrl}/api/v1/pgc-engine/accounts`,
          { params },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to search accounts: ${error.message}`);
      throw new Error(`Account search failed: ${error.message}`);
    }
  }

  /**
   * Validate accounting entry with PGC Engine
   *
   * @param entry Entry to validate
   * @returns Validation result with compliance rules
   */
  async validateEntry(entry: {
    description: string;
    lines: Array<{
      accountCode: string;
      debit?: number;
      credit?: number;
    }>;
  }): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    rules: Array<{
      rule: string;
      passed: boolean;
      message?: string;
    }>;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.pgcEngineUrl}/api/v1/pgc-engine/validate`,
          entry,
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to validate entry: ${error.message}`);
      throw new Error(`Entry validation failed: ${error.message}`);
    }
  }

  /**
   * Create accounting entry in PGC Engine
   *
   * @param entry Entry data
   * @returns Created entry with ID
   */
  async createEntry(entry: {
    description: string;
    entryDate: string;
    lines: Array<{
      accountCode: string;
      debit?: number;
      credit?: number;
      description?: string;
    }>;
  }): Promise<{
    id: string;
    entryNumber: string;
    totalDebit: number;
    totalCredit: number;
    status: string;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.pgcEngineUrl}/api/v1/pgc-engine/entries`,
          entry,
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create entry: ${error.message}`);
      throw new Error(`Entry creation failed: ${error.message}`);
    }
  }

  /**
   * Post entry to ledger (mayorizar)
   *
   * @param entryId Entry ID
   * @returns Posted entry
   */
  async postEntry(entryId: string): Promise<{
    id: string;
    status: string;
    postDate: string;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.pgcEngineUrl}/api/v1/pgc-engine/entries/${entryId}/post`,
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to post entry: ${error.message}`);
      throw new Error(`Entry posting failed: ${error.message}`);
    }
  }

  /**
   * Get ledger from PGC Engine
   *
   * @param accountCode Optional account filter
   * @param year Fiscal year
   * @param period Fiscal period
   * @returns Ledger entries
   */
  async getLedger(
    accountCode?: string,
    year?: string,
    period?: string,
  ): Promise<any> {
    try {
      const params: any = {};
      if (accountCode) params.accountCode = accountCode;
      if (year) params.year = year;
      if (period) params.period = period;

      const response = await firstValueFrom(
        this.httpService.get(`${this.pgcEngineUrl}/api/v1/pgc-engine/ledger`, {
          params,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get ledger: ${error.message}`);
      throw new Error(`Ledger retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get balance sheet from PGC Engine
   *
   * @param year Fiscal year
   * @param period Fiscal period
   * @returns Balance sheet
   */
  async getBalanceSheet(year: string, period: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.pgcEngineUrl}/api/v1/pgc-engine/reports/balance`,
          {
            params: { year, period },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get balance sheet: ${error.message}`);
      throw new Error(`Balance sheet retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get income statement (P&L) from PGC Engine
   *
   * @param year Fiscal year
   * @param period Fiscal period
   * @returns Income statement
   */
  async getIncomeStatement(year: string, period: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.pgcEngineUrl}/api/v1/pgc-engine/reports/income`,
          {
            params: { year, period },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get income statement: ${error.message}`);
      throw new Error(`Income statement retrieval failed: ${error.message}`);
    }
  }

  /**
   * Check PGC Engine health
   *
   * @returns Health status
   */
  async checkHealth(): Promise<{ status: string; message?: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.pgcEngineUrl}/health`, {
          timeout: 5000,
        }),
      );

      return {
        status: 'healthy',
        message: response.data?.status || 'ok',
      };
    } catch (error) {
      this.logger.warn(`PGC Engine health check failed: ${error.message}`);
      return {
        status: 'unhealthy',
        message: error.message,
      };
    }
  }
}
