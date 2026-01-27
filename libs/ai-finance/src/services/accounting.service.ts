/**
 * Accounting Service
 * Servicio de contabilidad con soporte para PGC español
 */

import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import {
  JournalEntry,
  JournalLine,
  JournalStatus,
  AccountingPeriod,
  Account,
  AccountType,
  TrialBalance,
  TrialBalanceAccount,
  BalanceSheet,
  BalanceSheetSection,
  BalanceSheetItem,
  IncomeStatement,
  IncomeStatementSection,
  IncomeStatementItem,
  GeneralLedger,
  GeneralLedgerEntry,
  AccountingResult,
  MovementQueryOptions,
} from '../types';

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

interface CreateJournalEntryInput {
  periodId: string;
  date: Date;
  description: string;
  reference?: string;
  documentType?: string;
  documentNumber?: string;
  lines: CreateJournalLineInput[];
  metadata?: Record<string, unknown>;
}

interface CreateJournalLineInput {
  accountCode: string;
  debit: number;
  credit: number;
  description?: string;
  costCenter?: string;
  project?: string;
  department?: string;
  partnerId?: string;
  partnerName?: string;
  invoiceId?: string;
  paymentId?: string;
}

// ============================================================================
// ALMACENAMIENTO EN MEMORIA (Simula base de datos)
// ============================================================================

const journalEntries: Map<string, JournalEntry> = new Map();
const accounts: Map<string, Account> = new Map();
const periods: Map<string, AccountingPeriod> = new Map();
let entryCounter = 1;

// Inicializar cuentas PGC básicas
function initializePGCAccounts(): void {
  const pgcAccounts: Partial<Account>[] = [
    // Grupo 1 - Financiación básica
    { code: '100', name: 'Capital social', type: AccountType.EQUITY, level: 3, debitNature: false, creditNature: true },
    { code: '112', name: 'Reserva legal', type: AccountType.RESERVES, level: 3, debitNature: false, creditNature: true },
    { code: '113', name: 'Reservas voluntarias', type: AccountType.RESERVES, level: 3, debitNature: false, creditNature: true },
    { code: '129', name: 'Resultado del ejercicio', type: AccountType.EQUITY, level: 3, debitNature: true, creditNature: true },
    { code: '170', name: 'Deudas a largo plazo con entidades de crédito', type: AccountType.LONG_TERM_DEBT, level: 3, debitNature: false, creditNature: true },

    // Grupo 2 - Activo no corriente
    { code: '210', name: 'Terrenos y bienes naturales', type: AccountType.FIXED_ASSET, level: 3, debitNature: true, creditNature: false },
    { code: '211', name: 'Construcciones', type: AccountType.FIXED_ASSET, level: 3, debitNature: true, creditNature: false },
    { code: '213', name: 'Maquinaria', type: AccountType.FIXED_ASSET, level: 3, debitNature: true, creditNature: false },
    { code: '216', name: 'Mobiliario', type: AccountType.FIXED_ASSET, level: 3, debitNature: true, creditNature: false },
    { code: '217', name: 'Equipos para procesos de información', type: AccountType.FIXED_ASSET, level: 3, debitNature: true, creditNature: false },
    { code: '281', name: 'Amortización acumulada del inmovilizado material', type: AccountType.DEPRECIATION, level: 3, debitNature: false, creditNature: true },

    // Grupo 3 - Existencias
    { code: '300', name: 'Mercaderías', type: AccountType.INVENTORY, level: 3, debitNature: true, creditNature: false },
    { code: '310', name: 'Materias primas', type: AccountType.INVENTORY, level: 3, debitNature: true, creditNature: false },

    // Grupo 4 - Acreedores y deudores
    { code: '400', name: 'Proveedores', type: AccountType.PAYABLE, level: 3, debitNature: false, creditNature: true },
    { code: '410', name: 'Acreedores por prestaciones de servicios', type: AccountType.PAYABLE, level: 3, debitNature: false, creditNature: true },
    { code: '430', name: 'Clientes', type: AccountType.RECEIVABLE, level: 3, debitNature: true, creditNature: false },
    { code: '431', name: 'Clientes, efectos comerciales a cobrar', type: AccountType.RECEIVABLE, level: 3, debitNature: true, creditNature: false },
    { code: '440', name: 'Deudores', type: AccountType.RECEIVABLE, level: 3, debitNature: true, creditNature: false },
    { code: '472', name: 'Hacienda Pública, IVA soportado', type: AccountType.TAX_RECEIVABLE, level: 3, debitNature: true, creditNature: false },
    { code: '473', name: 'Hacienda Pública, retenciones y pagos a cuenta', type: AccountType.TAX_RECEIVABLE, level: 3, debitNature: true, creditNature: false },
    { code: '475', name: 'Hacienda Pública, acreedora por conceptos fiscales', type: AccountType.TAX_PAYABLE, level: 3, debitNature: false, creditNature: true },
    { code: '476', name: 'Organismos de la Seguridad Social, acreedores', type: AccountType.PAYABLE, level: 3, debitNature: false, creditNature: true },
    { code: '477', name: 'Hacienda Pública, IVA repercutido', type: AccountType.TAX_PAYABLE, level: 3, debitNature: false, creditNature: true },

    // Grupo 5 - Cuentas financieras
    { code: '520', name: 'Deudas a corto plazo con entidades de crédito', type: AccountType.LONG_TERM_DEBT, level: 3, debitNature: false, creditNature: true },
    { code: '570', name: 'Caja, euros', type: AccountType.CASH, level: 3, debitNature: true, creditNature: false },
    { code: '572', name: 'Bancos e instituciones de crédito c/c vista, euros', type: AccountType.BANK, level: 3, debitNature: true, creditNature: false },

    // Grupo 6 - Compras y gastos
    { code: '600', name: 'Compras de mercaderías', type: AccountType.PURCHASE, level: 3, debitNature: true, creditNature: false },
    { code: '601', name: 'Compras de materias primas', type: AccountType.PURCHASE, level: 3, debitNature: true, creditNature: false },
    { code: '602', name: 'Compras de otros aprovisionamientos', type: AccountType.PURCHASE, level: 3, debitNature: true, creditNature: false },
    { code: '621', name: 'Arrendamientos y cánones', type: AccountType.EXPENSE, level: 3, debitNature: true, creditNature: false },
    { code: '622', name: 'Reparaciones y conservación', type: AccountType.EXPENSE, level: 3, debitNature: true, creditNature: false },
    { code: '623', name: 'Servicios de profesionales independientes', type: AccountType.EXPENSE, level: 3, debitNature: true, creditNature: false },
    { code: '625', name: 'Primas de seguros', type: AccountType.EXPENSE, level: 3, debitNature: true, creditNature: false },
    { code: '626', name: 'Servicios bancarios y similares', type: AccountType.EXPENSE, level: 3, debitNature: true, creditNature: false },
    { code: '627', name: 'Publicidad, propaganda y relaciones públicas', type: AccountType.EXPENSE, level: 3, debitNature: true, creditNature: false },
    { code: '628', name: 'Suministros', type: AccountType.EXPENSE, level: 3, debitNature: true, creditNature: false },
    { code: '629', name: 'Otros servicios', type: AccountType.EXPENSE, level: 3, debitNature: true, creditNature: false },
    { code: '640', name: 'Sueldos y salarios', type: AccountType.EXPENSE, level: 3, debitNature: true, creditNature: false },
    { code: '642', name: 'Seguridad Social a cargo de la empresa', type: AccountType.EXPENSE, level: 3, debitNature: true, creditNature: false },
    { code: '662', name: 'Intereses de deudas', type: AccountType.EXPENSE, level: 3, debitNature: true, creditNature: false },
    { code: '681', name: 'Amortización del inmovilizado material', type: AccountType.EXPENSE, level: 3, debitNature: true, creditNature: false },

    // Grupo 7 - Ventas e ingresos
    { code: '700', name: 'Ventas de mercaderías', type: AccountType.SALES, level: 3, debitNature: false, creditNature: true },
    { code: '701', name: 'Ventas de productos terminados', type: AccountType.SALES, level: 3, debitNature: false, creditNature: true },
    { code: '705', name: 'Prestaciones de servicios', type: AccountType.REVENUE, level: 3, debitNature: false, creditNature: true },
    { code: '759', name: 'Ingresos por servicios diversos', type: AccountType.REVENUE, level: 3, debitNature: false, creditNature: true },
    { code: '762', name: 'Ingresos de créditos', type: AccountType.REVENUE, level: 3, debitNature: false, creditNature: true },
    { code: '769', name: 'Otros ingresos financieros', type: AccountType.REVENUE, level: 3, debitNature: false, creditNature: true },
  ];

  pgcAccounts.forEach(acc => {
    const account: Account = {
      id: uuidv4(),
      code: acc.code!,
      name: acc.name!,
      description: acc.name,
      type: acc.type!,
      level: acc.level!,
      isGroup: false,
      allowMovements: true,
      currency: 'EUR',
      debitNature: acc.debitNature!,
      creditNature: acc.creditNature!,
      isActive: true,
      isReconcilable: ['430', '400', '572'].some(c => acc.code!.startsWith(c)),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    accounts.set(account.code, account);
  });
}

// Inicializar datos
initializePGCAccounts();

// ============================================================================
// SERVICIO DE CONTABILIDAD
// ============================================================================

export class AccountingService {
  /**
   * Crea un nuevo asiento contable
   */
  async createJournalEntry(input: CreateJournalEntryInput): Promise<AccountingResult<JournalEntry>> {
    try {
      // Validar que el asiento cuadre
      const totalDebit = input.lines.reduce((sum, line) =>
        new Decimal(sum).plus(line.debit).toNumber(), 0);
      const totalCredit = input.lines.reduce((sum, line) =>
        new Decimal(sum).plus(line.credit).toNumber(), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return {
          success: false,
          error: `El asiento no cuadra. Debe: ${totalDebit}, Haber: ${totalCredit}, Diferencia: ${Math.abs(totalDebit - totalCredit)}`,
        };
      }

      // Validar líneas
      for (const line of input.lines) {
        if (line.debit < 0 || line.credit < 0) {
          return {
            success: false,
            error: 'Los importes no pueden ser negativos',
          };
        }
        if (line.debit > 0 && line.credit > 0) {
          return {
            success: false,
            error: 'Una línea no puede tener importe en debe y haber simultáneamente',
          };
        }
        if (line.debit === 0 && line.credit === 0) {
          return {
            success: false,
            error: 'Una línea debe tener importe en debe o haber',
          };
        }
        // Validar que la cuenta existe
        if (!accounts.has(line.accountCode)) {
          return {
            success: false,
            error: `La cuenta ${line.accountCode} no existe en el plan contable`,
          };
        }
      }

      const entryId = uuidv4();
      const entryNumber = `AST-${input.date.getFullYear()}-${String(entryCounter++).padStart(6, '0')}`;

      const journalLines: JournalLine[] = input.lines.map((line, index) => ({
        id: uuidv4(),
        entryId,
        lineNumber: index + 1,
        accountCode: line.accountCode,
        accountName: accounts.get(line.accountCode)?.name,
        debit: line.debit,
        credit: line.credit,
        description: line.description,
        costCenter: line.costCenter,
        project: line.project,
        department: line.department,
        partnerId: line.partnerId,
        partnerName: line.partnerName,
        isReconciled: false,
        invoiceId: line.invoiceId,
        paymentId: line.paymentId,
      }));

      const journalEntry: JournalEntry = {
        id: entryId,
        number: entryNumber,
        periodId: input.periodId,
        date: input.date,
        description: input.description,
        reference: input.reference,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        lines: journalLines,
        totalDebit,
        totalCredit,
        status: JournalStatus.DRAFT,
        isReversal: false,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: input.metadata,
      };

      journalEntries.set(entryId, journalEntry);

      return {
        success: true,
        data: journalEntry,
        journalEntryId: entryId,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al crear asiento: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Contabiliza (publica) un asiento
   */
  async postJournalEntry(entryId: string): Promise<AccountingResult<JournalEntry>> {
    try {
      const entry = journalEntries.get(entryId);
      if (!entry) {
        return {
          success: false,
          error: `Asiento ${entryId} no encontrado`,
        };
      }

      if (entry.status !== JournalStatus.DRAFT && entry.status !== JournalStatus.PENDING) {
        return {
          success: false,
          error: `El asiento ya está en estado ${entry.status} y no puede ser contabilizado`,
        };
      }

      // Verificar que el período no esté cerrado
      const period = periods.get(entry.periodId);
      if (period?.isClosed) {
        return {
          success: false,
          error: 'El período contable está cerrado',
        };
      }

      entry.status = JournalStatus.POSTED;
      entry.postedAt = new Date();
      entry.postedBy = 'system';
      entry.updatedAt = new Date();

      journalEntries.set(entryId, entry);

      return {
        success: true,
        data: entry,
        journalEntryId: entryId,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al contabilizar asiento: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Extorna (revierte) un asiento contable
   */
  async reverseEntry(entryId: string, reason: string): Promise<AccountingResult<JournalEntry>> {
    try {
      const originalEntry = journalEntries.get(entryId);
      if (!originalEntry) {
        return {
          success: false,
          error: `Asiento ${entryId} no encontrado`,
        };
      }

      if (originalEntry.status !== JournalStatus.POSTED) {
        return {
          success: false,
          error: 'Solo se pueden extornar asientos contabilizados',
        };
      }

      if (originalEntry.reversedBy) {
        return {
          success: false,
          error: 'Este asiento ya ha sido extornado',
        };
      }

      // Crear asiento de extorno (invirtiendo debe y haber)
      const reversalLines: CreateJournalLineInput[] = originalEntry.lines.map(line => ({
        accountCode: line.accountCode,
        debit: line.credit,  // Invertido
        credit: line.debit,  // Invertido
        description: `Extorno: ${line.description || ''}`,
        costCenter: line.costCenter,
        project: line.project,
        department: line.department,
        partnerId: line.partnerId,
        partnerName: line.partnerName,
      }));

      const reversalResult = await this.createJournalEntry({
        periodId: originalEntry.periodId,
        date: new Date(),
        description: `Extorno de ${originalEntry.number}: ${reason}`,
        reference: originalEntry.number,
        documentType: 'EXTORNO',
        documentNumber: originalEntry.documentNumber,
        lines: reversalLines,
        metadata: {
          originalEntryId: entryId,
          reversalReason: reason,
        },
      });

      if (!reversalResult.success || !reversalResult.data) {
        return reversalResult;
      }

      // Marcar el asiento de extorno
      const reversalEntry = reversalResult.data;
      reversalEntry.isReversal = true;
      reversalEntry.reversalOf = entryId;
      reversalEntry.reversalReason = reason;
      journalEntries.set(reversalEntry.id, reversalEntry);

      // Contabilizar el extorno automáticamente
      await this.postJournalEntry(reversalEntry.id);

      // Actualizar el asiento original
      originalEntry.status = JournalStatus.REVERSED;
      originalEntry.reversedBy = reversalEntry.id;
      originalEntry.updatedAt = new Date();
      journalEntries.set(entryId, originalEntry);

      return {
        success: true,
        data: reversalEntry,
        journalEntryId: reversalEntry.id,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al extornar asiento: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Obtiene el saldo de una cuenta a una fecha determinada
   */
  async getAccountBalance(
    accountCode: string,
    date?: Date
  ): Promise<AccountingResult<{ debit: number; credit: number; balance: number }>> {
    try {
      const account = accounts.get(accountCode);
      if (!account) {
        return {
          success: false,
          error: `Cuenta ${accountCode} no encontrada`,
        };
      }

      const targetDate = date || new Date();
      let totalDebit = new Decimal(0);
      let totalCredit = new Decimal(0);

      // Sumar movimientos de asientos contabilizados
      for (const entry of journalEntries.values()) {
        if (entry.status !== JournalStatus.POSTED) continue;
        if (entry.date > targetDate) continue;

        for (const line of entry.lines) {
          if (line.accountCode === accountCode || line.accountCode.startsWith(accountCode)) {
            totalDebit = totalDebit.plus(line.debit);
            totalCredit = totalCredit.plus(line.credit);
          }
        }
      }

      // Calcular saldo según naturaleza de la cuenta
      let balance: number;
      if (account.debitNature) {
        balance = totalDebit.minus(totalCredit).toNumber();
      } else {
        balance = totalCredit.minus(totalDebit).toNumber();
      }

      return {
        success: true,
        data: {
          debit: totalDebit.toNumber(),
          credit: totalCredit.toNumber(),
          balance,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al obtener saldo: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Genera el balance de sumas y saldos (Trial Balance)
   */
  async getTrialBalance(periodId: string): Promise<AccountingResult<TrialBalance>> {
    try {
      const period = periods.get(periodId);
      const endDate = period?.endDate || new Date();
      const startDate = period?.startDate || new Date(endDate.getFullYear(), 0, 1);

      const trialBalanceAccounts: TrialBalanceAccount[] = [];
      let grandTotalDebit = new Decimal(0);
      let grandTotalCredit = new Decimal(0);

      // Procesar cada cuenta
      for (const account of accounts.values()) {
        let openingDebit = new Decimal(0);
        let openingCredit = new Decimal(0);
        let periodDebit = new Decimal(0);
        let periodCredit = new Decimal(0);

        for (const entry of journalEntries.values()) {
          if (entry.status !== JournalStatus.POSTED) continue;

          for (const line of entry.lines) {
            if (line.accountCode !== account.code) continue;

            if (entry.date < startDate) {
              // Saldo de apertura
              openingDebit = openingDebit.plus(line.debit);
              openingCredit = openingCredit.plus(line.credit);
            } else if (entry.date <= endDate) {
              // Movimientos del período
              periodDebit = periodDebit.plus(line.debit);
              periodCredit = periodCredit.plus(line.credit);
            }
          }
        }

        const closingDebit = openingDebit.plus(periodDebit);
        const closingCredit = openingCredit.plus(periodCredit);

        // Solo incluir cuentas con movimientos
        if (closingDebit.gt(0) || closingCredit.gt(0)) {
          trialBalanceAccounts.push({
            accountCode: account.code,
            accountName: account.name,
            level: account.level,
            openingDebit: openingDebit.toNumber(),
            openingCredit: openingCredit.toNumber(),
            periodDebit: periodDebit.toNumber(),
            periodCredit: periodCredit.toNumber(),
            closingDebit: closingDebit.toNumber(),
            closingCredit: closingCredit.toNumber(),
          });

          grandTotalDebit = grandTotalDebit.plus(closingDebit);
          grandTotalCredit = grandTotalCredit.plus(closingCredit);
        }
      }

      // Ordenar por código de cuenta
      trialBalanceAccounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

      return {
        success: true,
        data: {
          periodId,
          asOfDate: endDate,
          accounts: trialBalanceAccounts,
          totalDebit: grandTotalDebit.toNumber(),
          totalCredit: grandTotalCredit.toNumber(),
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al generar balance de sumas y saldos: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Obtiene el libro mayor de una cuenta
   */
  async getGeneralLedger(
    accountCode: string,
    options?: MovementQueryOptions
  ): Promise<AccountingResult<GeneralLedger>> {
    try {
      const account = accounts.get(accountCode);
      if (!account) {
        return {
          success: false,
          error: `Cuenta ${accountCode} no encontrada`,
        };
      }

      const startDate = options?.startDate || new Date(new Date().getFullYear(), 0, 1);
      const endDate = options?.endDate || new Date();

      // Calcular saldo de apertura
      let openingBalance = new Decimal(0);
      const entries: GeneralLedgerEntry[] = [];

      // Recopilar y ordenar asientos
      const relevantEntries: Array<{ entry: JournalEntry; line: JournalLine }> = [];

      for (const entry of journalEntries.values()) {
        if (entry.status !== JournalStatus.POSTED && entry.status !== JournalStatus.REVERSED) continue;
        if (options?.includeReversed === false && entry.status === JournalStatus.REVERSED) continue;

        for (const line of entry.lines) {
          if (line.accountCode !== accountCode) continue;

          if (entry.date < startDate) {
            // Acumular saldo de apertura
            if (account.debitNature) {
              openingBalance = openingBalance.plus(line.debit).minus(line.credit);
            } else {
              openingBalance = openingBalance.plus(line.credit).minus(line.debit);
            }
          } else if (entry.date <= endDate) {
            relevantEntries.push({ entry, line });
          }
        }
      }

      // Ordenar por fecha y número de asiento
      relevantEntries.sort((a, b) => {
        const dateCompare = a.entry.date.getTime() - b.entry.date.getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.entry.number.localeCompare(b.entry.number);
      });

      // Generar entradas del libro mayor
      let runningBalance = openingBalance;

      for (const { entry, line } of relevantEntries) {
        if (account.debitNature) {
          runningBalance = runningBalance.plus(line.debit).minus(line.credit);
        } else {
          runningBalance = runningBalance.plus(line.credit).minus(line.debit);
        }

        entries.push({
          date: entry.date,
          entryNumber: entry.number,
          description: line.description || entry.description,
          reference: entry.reference,
          debit: line.debit,
          credit: line.credit,
          balance: runningBalance.toNumber(),
          partnerId: line.partnerId,
          partnerName: line.partnerName,
        });
      }

      return {
        success: true,
        data: {
          accountCode,
          accountName: account.name,
          periodId: options?.periodId || '',
          startDate,
          endDate,
          openingBalance: openingBalance.toNumber(),
          entries,
          closingBalance: runningBalance.toNumber(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al obtener libro mayor: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Cierra un período contable
   */
  async closeAccountingPeriod(periodId: string): Promise<AccountingResult<AccountingPeriod>> {
    try {
      let period = periods.get(periodId);

      if (!period) {
        // Crear período si no existe
        period = {
          id: periodId,
          code: periodId,
          name: `Período ${periodId}`,
          fiscalYear: new Date().getFullYear(),
          startDate: new Date(new Date().getFullYear(), 0, 1),
          endDate: new Date(new Date().getFullYear(), 11, 31),
          isClosed: false,
          isLocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      if (period.isClosed) {
        return {
          success: false,
          error: 'El período ya está cerrado',
        };
      }

      // Verificar que no haya asientos en borrador
      for (const entry of journalEntries.values()) {
        if (entry.periodId === periodId && entry.status === JournalStatus.DRAFT) {
          return {
            success: false,
            error: 'Existen asientos en borrador. Debe contabilizarlos o eliminarlos antes de cerrar el período.',
            warnings: [`Asiento ${entry.number} en estado borrador`],
          };
        }
      }

      // Cerrar el período
      period.isClosed = true;
      period.isLocked = true;
      period.closedAt = new Date();
      period.closedBy = 'system';
      period.updatedAt = new Date();

      periods.set(periodId, period);

      return {
        success: true,
        data: period,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al cerrar período: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Genera el balance de situación
   */
  async generateBalanceSheet(date: Date): Promise<AccountingResult<BalanceSheet>> {
    try {
      const assetAccounts: BalanceSheetItem[] = [];
      const liabilityAccounts: BalanceSheetItem[] = [];
      const equityAccounts: BalanceSheetItem[] = [];

      let totalAssets = new Decimal(0);
      let totalLiabilities = new Decimal(0);
      let totalEquity = new Decimal(0);

      for (const account of accounts.values()) {
        const balanceResult = await this.getAccountBalance(account.code, date);
        if (!balanceResult.success || !balanceResult.data) continue;

        const balance = balanceResult.data.balance;
        if (balance === 0) continue;

        const item: BalanceSheetItem = {
          code: account.code,
          name: account.name,
          currentPeriod: Math.abs(balance),
        };

        // Clasificar según tipo de cuenta (grupos PGC)
        const group = parseInt(account.code.charAt(0));

        if (group === 2 || group === 3 || group === 5) {
          // Activo (grupos 2, 3, 5)
          if (account.type === AccountType.DEPRECIATION) {
            item.currentPeriod = -Math.abs(balance);
          }
          assetAccounts.push(item);
          totalAssets = totalAssets.plus(item.currentPeriod);
        } else if (group === 4 && account.type === AccountType.RECEIVABLE) {
          // Activo (cuentas a cobrar del grupo 4)
          assetAccounts.push(item);
          totalAssets = totalAssets.plus(item.currentPeriod);
        } else if (group === 4 && account.type === AccountType.PAYABLE) {
          // Pasivo (cuentas a pagar del grupo 4)
          liabilityAccounts.push(item);
          totalLiabilities = totalLiabilities.plus(item.currentPeriod);
        } else if (group === 1) {
          // Patrimonio neto y pasivo a largo plazo
          if (account.type === AccountType.LONG_TERM_DEBT) {
            liabilityAccounts.push(item);
            totalLiabilities = totalLiabilities.plus(item.currentPeriod);
          } else {
            equityAccounts.push(item);
            totalEquity = totalEquity.plus(item.currentPeriod);
          }
        }
      }

      // Ordenar por código
      assetAccounts.sort((a, b) => a.code.localeCompare(b.code));
      liabilityAccounts.sort((a, b) => a.code.localeCompare(b.code));
      equityAccounts.sort((a, b) => a.code.localeCompare(b.code));

      const assets: BalanceSheetSection = {
        name: 'ACTIVO',
        items: assetAccounts,
        total: totalAssets.toNumber(),
      };

      const liabilities: BalanceSheetSection = {
        name: 'PASIVO',
        items: liabilityAccounts,
        total: totalLiabilities.toNumber(),
      };

      const equity: BalanceSheetSection = {
        name: 'PATRIMONIO NETO',
        items: equityAccounts,
        total: totalEquity.toNumber(),
      };

      return {
        success: true,
        data: {
          asOfDate: date,
          periodId: '',
          assets,
          liabilities,
          equity,
          totalAssets: totalAssets.toNumber(),
          totalLiabilities: totalLiabilities.toNumber(),
          totalEquity: totalEquity.toNumber(),
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al generar balance de situación: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Genera la cuenta de pérdidas y ganancias
   */
  async generateIncomeStatement(periodId: string): Promise<AccountingResult<IncomeStatement>> {
    try {
      const period = periods.get(periodId);
      const startDate = period?.startDate || new Date(new Date().getFullYear(), 0, 1);
      const endDate = period?.endDate || new Date();

      const revenueItems: IncomeStatementItem[] = [];
      const expenseItems: IncomeStatementItem[] = [];

      let totalRevenue = new Decimal(0);
      let totalExpenses = new Decimal(0);

      for (const account of accounts.values()) {
        const group = parseInt(account.code.charAt(0));
        if (group !== 6 && group !== 7) continue;

        // Calcular movimientos del período
        let periodAmount = new Decimal(0);

        for (const entry of journalEntries.values()) {
          if (entry.status !== JournalStatus.POSTED) continue;
          if (entry.date < startDate || entry.date > endDate) continue;

          for (const line of entry.lines) {
            if (line.accountCode !== account.code) continue;

            if (group === 6) {
              // Gastos: naturaleza deudora
              periodAmount = periodAmount.plus(line.debit).minus(line.credit);
            } else {
              // Ingresos: naturaleza acreedora
              periodAmount = periodAmount.plus(line.credit).minus(line.debit);
            }
          }
        }

        if (periodAmount.eq(0)) continue;

        const item: IncomeStatementItem = {
          code: account.code,
          name: account.name,
          currentPeriod: periodAmount.toNumber(),
        };

        if (group === 7) {
          revenueItems.push(item);
          totalRevenue = totalRevenue.plus(periodAmount);
        } else {
          expenseItems.push(item);
          totalExpenses = totalExpenses.plus(periodAmount);
        }
      }

      // Ordenar por código
      revenueItems.sort((a, b) => a.code.localeCompare(b.code));
      expenseItems.sort((a, b) => a.code.localeCompare(b.code));

      // Calcular porcentajes sobre ventas
      if (totalRevenue.gt(0)) {
        for (const item of [...revenueItems, ...expenseItems]) {
          item.percentage = new Decimal(item.currentPeriod)
            .div(totalRevenue)
            .times(100)
            .toDecimalPlaces(2)
            .toNumber();
        }
      }

      const revenue: IncomeStatementSection = {
        name: 'INGRESOS',
        items: revenueItems,
        total: totalRevenue.toNumber(),
      };

      const expenses: IncomeStatementSection = {
        name: 'GASTOS',
        items: expenseItems,
        total: totalExpenses.toNumber(),
      };

      const netProfit = totalRevenue.minus(totalExpenses).toNumber();

      return {
        success: true,
        data: {
          periodId,
          startDate,
          endDate,
          revenue,
          expenses,
          grossProfit: netProfit,
          operatingProfit: netProfit,
          profitBeforeTax: netProfit,
          netProfit,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al generar cuenta de pérdidas y ganancias: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Obtiene la lista de asientos según filtros
   */
  async getJournalEntries(options?: MovementQueryOptions): Promise<AccountingResult<JournalEntry[]>> {
    try {
      let entries = Array.from(journalEntries.values());

      // Aplicar filtros
      if (options?.startDate) {
        entries = entries.filter(e => e.date >= options.startDate!);
      }
      if (options?.endDate) {
        entries = entries.filter(e => e.date <= options.endDate!);
      }
      if (options?.periodId) {
        entries = entries.filter(e => e.periodId === options.periodId);
      }
      if (options?.status) {
        entries = entries.filter(e => e.status === options.status);
      }
      if (options?.includeReversed === false) {
        entries = entries.filter(e => e.status !== JournalStatus.REVERSED);
      }
      if (options?.accountCode) {
        entries = entries.filter(e =>
          e.lines.some(l => l.accountCode.startsWith(options.accountCode!))
        );
      }

      // Ordenar
      const orderBy = options?.orderBy || 'date';
      const direction = options?.orderDirection === 'DESC' ? -1 : 1;

      entries.sort((a, b) => {
        switch (orderBy) {
          case 'number':
            return direction * a.number.localeCompare(b.number);
          case 'amount':
            return direction * (a.totalDebit - b.totalDebit);
          default:
            return direction * (a.date.getTime() - b.date.getTime());
        }
      });

      // Paginación
      if (options?.offset) {
        entries = entries.slice(options.offset);
      }
      if (options?.limit) {
        entries = entries.slice(0, options.limit);
      }

      return {
        success: true,
        data: entries,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al obtener asientos: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Obtiene una cuenta por código
   */
  async getAccount(accountCode: string): Promise<AccountingResult<Account>> {
    const account = accounts.get(accountCode);
    if (!account) {
      return {
        success: false,
        error: `Cuenta ${accountCode} no encontrada`,
      };
    }
    return {
      success: true,
      data: account,
    };
  }

  /**
   * Lista todas las cuentas del plan contable
   */
  async getAccounts(): Promise<AccountingResult<Account[]>> {
    const accountList = Array.from(accounts.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
    return {
      success: true,
      data: accountList,
    };
  }
}

// Exportar instancia singleton
export const accountingService = new AccountingService();
