/**
 * CashManagementService
 *
 * Servicio completo de gestión de caja y liquidez:
 * - Posición de caja en tiempo real
 * - Registro de movimientos (inflows/outflows)
 * - Conciliación bancaria automática
 * - Alertas de liquidez
 * - Forecasting de déficits
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import {
  CashPosition,
  CashAccount,
  CashMovement,
  ReconciliationResult,
  BankStatement,
  ImportResult,
  MatchResult,
  Alert,
  Shortage,
  PaginatedResult,
  Discrepancy,
} from '../interfaces/cash.interface';
import {
  RecordInflowDto,
  RecordOutflowDto,
  FilterMovementsDto,
} from '../dto/cash.dto';

@Injectable()
export class CashManagementService {
  private readonly logger = new Logger(CashManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * POSICIÓN DE CAJA
   */

  async getCurrentPosition(): Promise<CashPosition> {
    this.logger.log('💰 Getting current cash position');

    try {
      // TODO: Implementar consulta real a Prisma
      // const accounts = await this.prisma.cashAccount.findMany({
      //   where: { status: 'ACTIVE' }
      // });

      const mockAccounts: CashAccount[] = [
        {
          id: 'acc-001',
          name: 'Cuenta Principal BBVA',
          bankName: 'BBVA',
          iban: 'ES1234567890123456789012',
          balance: 75000.0,
          availableBalance: 72500.0,
          currency: 'EUR',
          accountType: 'CHECKING',
          status: 'ACTIVE',
          lastSync: new Date(),
        },
        {
          id: 'acc-002',
          name: 'Cuenta Santander',
          bankName: 'Santander',
          iban: 'ES9876543210987654321098',
          balance: 50000.5,
          availableBalance: 48450.3,
          currency: 'EUR',
          accountType: 'SAVINGS',
          status: 'ACTIVE',
          lastSync: new Date(),
        },
      ];

      const totalBalance = mockAccounts.reduce((sum, acc) => sum + acc.balance, 0);
      const availableBalance = mockAccounts.reduce(
        (sum, acc) => sum + acc.availableBalance,
        0
      );

      return {
        totalBalance,
        availableBalance,
        reservedBalance: totalBalance - availableBalance,
        blockedBalance: 0,
        accounts: mockAccounts,
        lastUpdate: new Date(),
        currency: 'EUR',
      };
    } catch (error) {
      this.logger.error('Error getting cash position', error);
      throw error;
    }
  }

  async getPositionByDate(date: Date): Promise<CashPosition> {
    this.logger.log(`📅 Getting cash position for ${date.toISOString()}`);

    // TODO: Calcular posición histórica
    // Sumar todos los movimientos hasta esa fecha
    const position = await this.getCurrentPosition();

    return {
      ...position,
      lastUpdate: date,
    };
  }

  async getPositionByAccount(accountId: string): Promise<CashPosition> {
    this.logger.log(`🏦 Getting cash position for account ${accountId}`);

    const currentPosition = await this.getCurrentPosition();
    const account = currentPosition.accounts.find((a) => a.id === accountId);

    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    return {
      totalBalance: account.balance,
      availableBalance: account.availableBalance,
      reservedBalance: account.balance - account.availableBalance,
      blockedBalance: 0,
      accounts: [account],
      lastUpdate: new Date(),
      currency: account.currency,
    };
  }

  /**
   * MOVIMIENTOS
   */

  async recordInflow(dto: RecordInflowDto): Promise<CashMovement> {
    this.logger.log(`📥 Recording inflow: €${dto.amount} - ${dto.category}`);

    try {
      // TODO: Crear en base de datos
      // const movement = await this.prisma.cashMovement.create({
      //   data: {
      //     accountId: dto.accountId,
      //     type: 'INFLOW',
      //     category: dto.category,
      //     amount: dto.amount,
      //     ...dto
      //   }
      // });

      const movement: CashMovement = {
        id: `mov-${Date.now()}`,
        accountId: dto.accountId,
        type: 'INFLOW',
        category: dto.category as any,
        amount: dto.amount,
        currency: 'EUR',
        description: dto.description,
        reference: dto.reference,
        executionDate: dto.executionDate,
        valueDate: dto.executionDate,
        status: 'COMPLETED',
        createdBy: 'system',
        createdAt: new Date(),
        metadata: dto.metadata,
      };

      this.logger.log(`✅ Inflow recorded: ${movement.id}`);
      return movement;
    } catch (error) {
      this.logger.error('Error recording inflow', error);
      throw error;
    }
  }

  async recordOutflow(dto: RecordOutflowDto): Promise<CashMovement> {
    this.logger.log(`📤 Recording outflow: €${dto.amount} - ${dto.category}`);

    try {
      // Verificar saldo disponible
      const position = await this.getPositionByAccount(dto.accountId);

      if (dto.amount > position.availableBalance) {
        throw new BadRequestException(
          `Insufficient balance in account ${dto.accountId}. ` +
            `Required: €${dto.amount}, Available: €${position.availableBalance}`
        );
      }

      // TODO: Crear en base de datos
      const movement: CashMovement = {
        id: `mov-${Date.now()}`,
        accountId: dto.accountId,
        type: 'OUTFLOW',
        category: dto.category as any,
        amount: dto.amount,
        currency: 'EUR',
        description: dto.description,
        reference: dto.reference,
        executionDate: dto.executionDate,
        valueDate: dto.executionDate,
        status: 'PENDING',
        createdBy: 'system',
        createdAt: new Date(),
        metadata: dto.metadata,
      };

      this.logger.log(`✅ Outflow recorded: ${movement.id}`);
      return movement;
    } catch (error) {
      this.logger.error('Error recording outflow', error);
      throw error;
    }
  }

  async getMovements(
    filters: FilterMovementsDto
  ): Promise<PaginatedResult<CashMovement>> {
    this.logger.log('📋 Fetching movements with filters', filters);

    try {
      // TODO: Implementar consulta con Prisma
      // const [movements, total] = await Promise.all([
      //   this.prisma.cashMovement.findMany({
      //     where: buildWhereClause(filters),
      //     skip: (filters.page - 1) * filters.pageSize,
      //     take: filters.pageSize,
      //     orderBy: { executionDate: 'desc' }
      //   }),
      //   this.prisma.cashMovement.count({
      //     where: buildWhereClause(filters)
      //   })
      // ]);

      const movements: CashMovement[] = [];
      const total = 0;

      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: movements,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };
    } catch (error) {
      this.logger.error('Error fetching movements', error);
      throw error;
    }
  }

  /**
   * CONCILIACIÓN BANCARIA
   */

  async reconcile(accountId: string, date: Date): Promise<ReconciliationResult> {
    this.logger.log(`🔄 Reconciling account ${accountId} for ${date.toISOString()}`);

    try {
      // TODO: Obtener movimientos del libro y extractos bancarios
      const movements: CashMovement[] = [];
      const statements: BankStatement[] = [];

      // Calcular balances
      const bookBalance = movements.reduce((sum, m) => {
        return m.type === 'INFLOW' ? sum + m.amount : sum - m.amount;
      }, 0);

      const bankBalance = statements.length > 0 ? statements[0].balance : 0;

      // Intentar emparejar automáticamente
      const matchResults = await this.matchTransactions(movements, statements);
      const matched = matchResults.filter((m) => m.matched).length;
      const unmatched = matchResults.length - matched;

      // Identificar discrepancias
      const discrepancies: Discrepancy[] = [];
      const difference = Math.abs(bookBalance - bankBalance);

      if (difference > 0.01) {
        discrepancies.push({
          id: `disc-${Date.now()}`,
          type: 'AMOUNT_MISMATCH',
          description: 'Book balance does not match bank balance',
          bookAmount: bookBalance,
          bankAmount: bankBalance,
          difference,
        });
      }

      const status =
        difference < 0.01
          ? 'RECONCILED'
          : discrepancies.length > 0
          ? 'DISCREPANCY'
          : 'PENDING';

      return {
        accountId,
        date,
        bookBalance,
        bankBalance,
        difference,
        matched,
        unmatched,
        movements,
        statements,
        discrepancies,
        status,
      };
    } catch (error) {
      this.logger.error('Error reconciling account', error);
      throw error;
    }
  }

  async importBankStatement(file: Express.Multer.File): Promise<ImportResult> {
    this.logger.log(`📄 Importing bank statement: ${file.originalname}`);

    try {
      // TODO: Parsear archivo (CSV, OFX, MT940, etc.)
      // TODO: Validar y normalizar datos
      // TODO: Detectar duplicados
      // TODO: Insertar en base de datos

      const result: ImportResult = {
        accountId: 'acc-001',
        fileName: file.originalname,
        totalStatements: 0,
        imported: 0,
        duplicates: 0,
        errors: 0,
        errorDetails: [],
        importedAt: new Date(),
      };

      this.logger.log(
        `✅ Import completed: ${result.imported}/${result.totalStatements} statements`
      );
      return result;
    } catch (error) {
      this.logger.error('Error importing bank statement', error);
      throw error;
    }
  }

  async matchTransactions(
    movements: CashMovement[],
    statements: BankStatement[]
  ): Promise<MatchResult[]> {
    this.logger.log(
      `🔗 Matching ${movements.length} movements with ${statements.length} statements`
    );

    const results: MatchResult[] = [];

    for (const movement of movements) {
      let bestMatch: MatchResult | null = null;
      let bestConfidence = 0;

      for (const statement of statements) {
        if (statement.matched) continue;

        // Exact match: amount + reference + date
        if (
          Math.abs(Math.abs(movement.amount) - Math.abs(statement.amount)) < 0.01 &&
          movement.reference === statement.reference &&
          this.isSameDay(movement.executionDate, statement.transactionDate)
        ) {
          bestMatch = {
            movementId: movement.id,
            statementId: statement.id,
            confidence: 1.0,
            matchType: 'EXACT',
            matched: true,
          };
          break;
        }

        // Fuzzy match: amount + similar date
        if (Math.abs(Math.abs(movement.amount) - Math.abs(statement.amount)) < 0.01) {
          const daysDiff = Math.abs(
            movement.executionDate.getTime() - statement.transactionDate.getTime()
          ) / (1000 * 60 * 60 * 24);

          if (daysDiff <= 3) {
            const confidence = 0.8 - daysDiff * 0.1;
            if (confidence > bestConfidence) {
              bestConfidence = confidence;
              bestMatch = {
                movementId: movement.id,
                statementId: statement.id,
                confidence,
                matchType: 'FUZZY',
                matched: confidence > 0.6,
              };
            }
          }
        }
      }

      if (bestMatch) {
        results.push(bestMatch);
        if (bestMatch.matched) {
          const statement = statements.find((s) => s.id === bestMatch.statementId);
          if (statement) statement.matched = true;
        }
      } else {
        results.push({
          movementId: movement.id,
          statementId: '',
          confidence: 0,
          matchType: 'MANUAL',
          matched: false,
          reason: 'No matching statement found',
        });
      }
    }

    return results;
  }

  /**
   * ALERTAS
   */

  async checkLowBalance(): Promise<Alert[]> {
    this.logger.log('⚠️ Checking for low balance alerts');

    const alerts: Alert[] = [];
    const position = await this.getCurrentPosition();
    const threshold = 10000; // €10,000 minimum

    for (const account of position.accounts) {
      if (account.availableBalance < threshold) {
        alerts.push({
          id: `alert-${Date.now()}-${account.id}`,
          type: 'LOW_BALANCE',
          severity: account.availableBalance < threshold * 0.5 ? 'CRITICAL' : 'WARNING',
          accountId: account.id,
          message: `Account ${account.name} has low balance: €${account.availableBalance}`,
          amount: account.availableBalance,
          threshold,
          createdAt: new Date(),
          acknowledged: false,
        });
      }
    }

    return alerts;
  }

  async checkOverdraft(): Promise<Alert[]> {
    this.logger.log('⚠️ Checking for overdraft alerts');

    const alerts: Alert[] = [];
    const position = await this.getCurrentPosition();

    for (const account of position.accounts) {
      if (account.availableBalance < 0) {
        alerts.push({
          id: `alert-${Date.now()}-${account.id}`,
          type: 'OVERDRAFT',
          severity: 'CRITICAL',
          accountId: account.id,
          message: `Account ${account.name} is overdrawn: €${account.availableBalance}`,
          amount: account.availableBalance,
          createdAt: new Date(),
          acknowledged: false,
        });
      }
    }

    return alerts;
  }

  async forecastCashShortage(days: number): Promise<Shortage[]> {
    this.logger.log(`📊 Forecasting cash shortage for next ${days} days`);

    const shortages: Shortage[] = [];

    // TODO: Implementar forecasting real
    // Por ahora simulamos algunos escenarios

    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      // Simulación simple
      const projectedBalance = 120000 - i * 2000 + Math.random() * 5000;
      const requiredAmount = 15000;

      if (projectedBalance < requiredAmount) {
        shortages.push({
          date,
          projectedBalance,
          requiredAmount,
          shortage: requiredAmount - projectedBalance,
          probability: 0.7 - i * 0.02,
          recommendations: [
            'Accelerate premium collections',
            'Delay non-critical payments',
            'Consider short-term credit line',
          ],
        });
      }
    }

    return shortages;
  }

  /**
   * HELPERS
   */

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}
