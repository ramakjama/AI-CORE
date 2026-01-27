/**
 * Treasury Service
 * Servicio de tesorería con soporte para SEPA y conciliación bancaria
 */

import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import {
  BankAccount,
  BankTransaction,
  Reconciliation,
  ReconciliationLine,
  ReconciliationStatus,
  SEPABatch,
  SEPAPayment,
  Payment,
  CashFlowReport,
  CashFlowSection,
  CashFlowForecast,
  CashFlowProjection,
  AccountingResult,
} from '../types';

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

interface ReconcileMovementInput {
  bankTransactionId: string;
  journalLineId?: string;
  paymentId?: string;
}

interface CreatePaymentBatchInput {
  payments: Array<{
    creditorName: string;
    creditorIBAN: string;
    creditorBIC?: string;
    amount: number;
    remittanceInfo: string;
    invoiceIds?: string[];
  }>;
  requestedExecutionDate: Date;
}

interface ImportBankStatementInput {
  format: 'N43' | 'CAMT053' | 'CSV';
  content: string;
}

// ============================================================================
// ALMACENAMIENTO EN MEMORIA
// ============================================================================

const bankAccounts: Map<string, BankAccount> = new Map();
const bankTransactions: Map<string, BankTransaction> = new Map();
const reconciliations: Map<string, Reconciliation> = new Map();
const sepaBatches: Map<string, SEPABatch> = new Map();
const payments: Map<string, Payment> = new Map();

// Inicializar cuenta bancaria de ejemplo
const defaultBankAccount: BankAccount = {
  id: uuidv4(),
  name: 'Cuenta Principal',
  iban: 'ES9121000418450200051332',
  bic: 'CAIXESBBXXX',
  bankName: 'CaixaBank',
  holderName: 'Mi Empresa S.L.',
  accountCode: '5720001',
  currentBalance: 50000,
  availableBalance: 48000,
  lastSyncedAt: new Date(),
  currency: 'EUR',
  isDefault: true,
  isActive: true,
  sepaCreditorId: 'ES12345ZZZ12345678A',
  createdAt: new Date(),
  updatedAt: new Date(),
};
bankAccounts.set(defaultBankAccount.id, defaultBankAccount);

// ============================================================================
// SERVICIO DE TESORERÍA
// ============================================================================

export class TreasuryService {
  /**
   * Obtiene el saldo de una cuenta bancaria
   */
  async getBankBalance(
    accountId: string
  ): Promise<AccountingResult<{ currentBalance: number; availableBalance: number }>> {
    try {
      const account = bankAccounts.get(accountId);
      if (!account) {
        return {
          success: false,
          error: `Cuenta bancaria ${accountId} no encontrada`,
        };
      }

      return {
        success: true,
        data: {
          currentBalance: account.currentBalance,
          availableBalance: account.availableBalance || account.currentBalance,
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
   * Concilia movimientos bancarios
   */
  async reconcileBank(
    accountId: string,
    movements: ReconcileMovementInput[]
  ): Promise<AccountingResult<Reconciliation>> {
    try {
      const account = bankAccounts.get(accountId);
      if (!account) {
        return {
          success: false,
          error: `Cuenta bancaria ${accountId} no encontrada`,
        };
      }

      const reconciliationId = uuidv4();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const reconciliationLines: ReconciliationLine[] = [];
      let totalBankAmount = new Decimal(0);
      let totalAccountingAmount = new Decimal(0);

      for (const movement of movements) {
        const transaction = bankTransactions.get(movement.bankTransactionId);
        if (!transaction) {
          return {
            success: false,
            error: `Transacción bancaria ${movement.bankTransactionId} no encontrada`,
          };
        }

        if (transaction.bankAccountId !== accountId) {
          return {
            success: false,
            error: `La transacción ${movement.bankTransactionId} no pertenece a la cuenta ${accountId}`,
          };
        }

        const line: ReconciliationLine = {
          id: uuidv4(),
          reconciliationId,
          bankTransactionId: movement.bankTransactionId,
          journalLineId: movement.journalLineId,
          paymentId: movement.paymentId,
          status: movement.journalLineId || movement.paymentId
            ? ReconciliationStatus.MATCHED
            : ReconciliationStatus.PENDING,
          matchType: movement.journalLineId || movement.paymentId ? 'MANUAL' : undefined,
          bankAmount: transaction.amount,
        };

        // Si hay contrapartida contable, obtener el importe
        if (movement.paymentId) {
          const payment = payments.get(movement.paymentId);
          if (payment) {
            line.accountingAmount = payment.amount;
            line.difference = new Decimal(transaction.amount)
              .minus(payment.amount)
              .toNumber();
          }
        }

        reconciliationLines.push(line);
        totalBankAmount = totalBankAmount.plus(transaction.amount);

        if (line.accountingAmount !== undefined) {
          totalAccountingAmount = totalAccountingAmount.plus(line.accountingAmount);
        }

        // Actualizar estado de la transacción
        transaction.reconciliationStatus = line.status;
        transaction.reconciliationId = reconciliationId;
        if (movement.paymentId) {
          transaction.matchedPaymentId = movement.paymentId;
        }
        bankTransactions.set(movement.bankTransactionId, transaction);
      }

      const reconciliation: Reconciliation = {
        id: reconciliationId,
        bankAccountId: accountId,
        periodStart: startOfMonth,
        periodEnd: now,
        openingBalance: account.currentBalance - totalBankAmount.toNumber(),
        closingBalance: account.currentBalance,
        statementBalance: account.currentBalance,
        transactions: reconciliationLines,
        difference: totalBankAmount.minus(totalAccountingAmount).toNumber(),
        status: reconciliationLines.every(l => l.status === ReconciliationStatus.MATCHED)
          ? 'COMPLETED'
          : 'IN_PROGRESS',
        createdAt: now,
        updatedAt: now,
      };

      if (reconciliation.status === 'COMPLETED') {
        reconciliation.completedAt = now;
        reconciliation.completedBy = 'system';
      }

      reconciliations.set(reconciliationId, reconciliation);

      return {
        success: true,
        data: reconciliation,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al conciliar: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Crea un lote de pagos SEPA
   */
  async createPaymentBatch(
    input: CreatePaymentBatchInput
  ): Promise<AccountingResult<SEPABatch>> {
    try {
      if (!input.payments || input.payments.length === 0) {
        return {
          success: false,
          error: 'El lote debe contener al menos un pago',
        };
      }

      // Obtener cuenta bancaria por defecto
      const defaultAccount = Array.from(bankAccounts.values()).find(a => a.isDefault);
      if (!defaultAccount) {
        return {
          success: false,
          error: 'No hay cuenta bancaria configurada como predeterminada',
        };
      }

      const batchId = uuidv4();
      const messageId = `MSG-${Date.now()}-${uuidv4().substring(0, 8)}`;

      let controlSum = new Decimal(0);
      const sepaPayments: SEPAPayment[] = [];

      for (const paymentInput of input.payments) {
        // Validar IBAN
        if (!this.validateIBAN(paymentInput.creditorIBAN)) {
          return {
            success: false,
            error: `IBAN inválido: ${paymentInput.creditorIBAN}`,
          };
        }

        if (paymentInput.amount <= 0) {
          return {
            success: false,
            error: 'El importe del pago debe ser positivo',
          };
        }

        const sepaPayment: SEPAPayment = {
          id: uuidv4(),
          batchId,
          endToEndId: `E2E-${Date.now()}-${uuidv4().substring(0, 8)}`,
          creditorName: paymentInput.creditorName,
          creditorIBAN: paymentInput.creditorIBAN.replace(/\s/g, ''),
          creditorBIC: paymentInput.creditorBIC,
          amount: paymentInput.amount,
          currency: 'EUR',
          remittanceInfo: paymentInput.remittanceInfo.substring(0, 140), // Máximo SEPA
          requestedExecutionDate: input.requestedExecutionDate,
          status: 'PENDING',
          invoiceIds: paymentInput.invoiceIds,
        };

        sepaPayments.push(sepaPayment);
        controlSum = controlSum.plus(paymentInput.amount);
      }

      const sepaBatch: SEPABatch = {
        id: batchId,
        type: 'CREDIT_TRANSFER',
        messageId,
        creationDateTime: new Date(),
        initiatorName: defaultAccount.holderName,
        bankAccountId: defaultAccount.id,
        payments: sepaPayments,
        numberOfTransactions: sepaPayments.length,
        controlSum: controlSum.toNumber(),
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      sepaBatches.set(batchId, sepaBatch);

      return {
        success: true,
        data: sepaBatch,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al crear lote de pagos: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Ejecuta una transferencia SEPA (genera el XML)
   */
  async executeSEPATransfer(batchId: string): Promise<AccountingResult<SEPABatch>> {
    try {
      const batch = sepaBatches.get(batchId);
      if (!batch) {
        return {
          success: false,
          error: `Lote ${batchId} no encontrado`,
        };
      }

      if (batch.status !== 'DRAFT' && batch.status !== 'VALIDATED') {
        return {
          success: false,
          error: `El lote está en estado ${batch.status} y no puede ser ejecutado`,
        };
      }

      const account = bankAccounts.get(batch.bankAccountId);
      if (!account) {
        return {
          success: false,
          error: 'Cuenta bancaria no encontrada',
        };
      }

      // Verificar saldo suficiente
      if (account.currentBalance < batch.controlSum) {
        return {
          success: false,
          error: `Saldo insuficiente. Disponible: ${account.currentBalance}, Requerido: ${batch.controlSum}`,
        };
      }

      // Generar XML SEPA
      const xml = this.generateSEPAXml(batch, account);

      batch.xmlFile = xml;
      batch.status = 'GENERATED';
      batch.generatedAt = new Date();
      batch.updatedAt = new Date();

      // Actualizar estado de los pagos
      for (const payment of batch.payments) {
        payment.status = 'INCLUDED';
      }

      sepaBatches.set(batchId, batch);

      return {
        success: true,
        data: batch,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al ejecutar transferencia SEPA: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Genera XML SEPA Credit Transfer (pain.001.001.03)
   */
  private generateSEPAXml(batch: SEPABatch, account: BankAccount): string {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const formatDateTime = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, '');
    const formatAmount = (amount: number) => amount.toFixed(2);

    const paymentInfos = batch.payments.map((payment, index) => `
    <PmtInf>
      <PmtInfId>${batch.messageId}-${index + 1}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>${formatAmount(payment.amount)}</CtrlSum>
      <PmtTpInf>
        <InstrPrty>NORM</InstrPrty>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${formatDate(payment.requestedExecutionDate)}</ReqdExctnDt>
      <Dbtr>
        <Nm>${this.escapeXml(account.holderName)}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${account.iban}</IBAN>
        </Id>
        <Ccy>EUR</Ccy>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>${account.bic || 'NOTPROVIDED'}</BIC>
        </FinInstnId>
      </DbtrAgt>
      <ChrgBr>SLEV</ChrgBr>
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${payment.endToEndId}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${formatAmount(payment.amount)}</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            ${payment.creditorBIC ? `<BIC>${payment.creditorBIC}</BIC>` : '<Othr><Id>NOTPROVIDED</Id></Othr>'}
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>${this.escapeXml(payment.creditorName)}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${payment.creditorIBAN}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${this.escapeXml(payment.remittanceInfo)}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>
    </PmtInf>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${batch.messageId}</MsgId>
      <CreDtTm>${formatDateTime(batch.creationDateTime)}</CreDtTm>
      <NbOfTxs>${batch.numberOfTransactions}</NbOfTxs>
      <CtrlSum>${formatAmount(batch.controlSum)}</CtrlSum>
      <InitgPty>
        <Nm>${this.escapeXml(batch.initiatorName)}</Nm>
      </InitgPty>
    </GrpHdr>${paymentInfos}
  </CstmrCdtTrfInitn>
</Document>`;
  }

  /**
   * Obtiene el flujo de caja para un período
   */
  async getCashFlow(
    startDate: Date,
    endDate: Date
  ): Promise<AccountingResult<CashFlowReport>> {
    try {
      let totalInflows = new Decimal(0);
      let totalOutflows = new Decimal(0);

      const inflowItems: Array<{ description: string; amount: number; category?: string }> = [];
      const outflowItems: Array<{ description: string; amount: number; category?: string }> = [];

      // Analizar transacciones bancarias
      for (const transaction of bankTransactions.values()) {
        if (transaction.transactionDate < startDate || transaction.transactionDate > endDate) {
          continue;
        }

        if (transaction.type === 'CREDIT') {
          totalInflows = totalInflows.plus(Math.abs(transaction.amount));
          inflowItems.push({
            description: transaction.description,
            amount: Math.abs(transaction.amount),
            category: transaction.category,
          });
        } else {
          totalOutflows = totalOutflows.plus(Math.abs(transaction.amount));
          outflowItems.push({
            description: transaction.description,
            amount: Math.abs(transaction.amount),
            category: transaction.category,
          });
        }
      }

      // Calcular saldo inicial (simplificado)
      let openingCash = new Decimal(0);
      for (const account of bankAccounts.values()) {
        openingCash = openingCash.plus(account.currentBalance);
      }
      // Restar movimientos del período para obtener saldo inicial
      openingCash = openingCash.minus(totalInflows).plus(totalOutflows);

      const closingCash = openingCash.plus(totalInflows).minus(totalOutflows);

      const operatingCashFlow: CashFlowSection = {
        name: 'Flujos de efectivo de las actividades de explotación',
        items: [
          ...inflowItems.map(i => ({ ...i, amount: i.amount })),
          ...outflowItems.map(i => ({ ...i, amount: -i.amount })),
        ],
        total: totalInflows.minus(totalOutflows).toNumber(),
      };

      const investingCashFlow: CashFlowSection = {
        name: 'Flujos de efectivo de las actividades de inversión',
        items: [],
        total: 0,
      };

      const financingCashFlow: CashFlowSection = {
        name: 'Flujos de efectivo de las actividades de financiación',
        items: [],
        total: 0,
      };

      return {
        success: true,
        data: {
          startDate,
          endDate,
          operatingCashFlow,
          investingCashFlow,
          financingCashFlow,
          netCashFlow: totalInflows.minus(totalOutflows).toNumber(),
          openingCash: openingCash.toNumber(),
          closingCash: closingCash.toNumber(),
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al obtener flujo de caja: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Genera previsión de tesorería
   */
  async forecastCashFlow(days: number): Promise<AccountingResult<CashFlowForecast>> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      // Obtener saldo actual
      let currentBalance = new Decimal(0);
      for (const account of bankAccounts.values()) {
        if (account.isActive) {
          currentBalance = currentBalance.plus(account.currentBalance);
        }
      }

      const projections: CashFlowProjection[] = [];
      let runningBalance = currentBalance;
      let minimumBalance = currentBalance;
      let maximumBalance = currentBalance;

      // Generar proyección diaria
      for (let i = 0; i < days; i++) {
        const projectionDate = new Date(startDate);
        projectionDate.setDate(projectionDate.getDate() + i);

        // Simular entradas y salidas basadas en patrones
        // En un sistema real, esto vendría de facturas pendientes, pagos programados, etc.
        const dayOfWeek = projectionDate.getDay();
        const dayOfMonth = projectionDate.getDate();

        let inflows = new Decimal(0);
        let outflows = new Decimal(0);

        // Simular cobros (más frecuentes a fin de mes)
        if (dayOfMonth >= 25 || dayOfMonth <= 5) {
          inflows = inflows.plus(Math.random() * 5000);
        }

        // Simular pagos (nóminas el día 28, proveedores días 10 y 25)
        if (dayOfMonth === 28) {
          outflows = outflows.plus(15000); // Nóminas
        }
        if (dayOfMonth === 10 || dayOfMonth === 25) {
          outflows = outflows.plus(8000); // Proveedores
        }

        // Gastos recurrentes diarios (excepto fines de semana)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          outflows = outflows.plus(200 + Math.random() * 300);
        }

        const netFlow = inflows.minus(outflows);
        runningBalance = runningBalance.plus(netFlow);

        if (runningBalance.lt(minimumBalance)) {
          minimumBalance = runningBalance;
        }
        if (runningBalance.gt(maximumBalance)) {
          maximumBalance = runningBalance;
        }

        projections.push({
          date: projectionDate,
          inflows: inflows.toNumber(),
          outflows: outflows.toNumber(),
          netFlow: netFlow.toNumber(),
          balance: runningBalance.toNumber(),
        });
      }

      return {
        success: true,
        data: {
          startDate,
          endDate,
          initialBalance: currentBalance.toNumber(),
          projections,
          finalBalance: runningBalance.toNumber(),
          minimumBalance: minimumBalance.toNumber(),
          maximumBalance: maximumBalance.toNumber(),
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al generar previsión: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Importa extracto bancario
   */
  async importBankStatement(
    accountId: string,
    input: ImportBankStatementInput
  ): Promise<AccountingResult<BankTransaction[]>> {
    try {
      const account = bankAccounts.get(accountId);
      if (!account) {
        return {
          success: false,
          error: `Cuenta bancaria ${accountId} no encontrada`,
        };
      }

      const importedTransactions: BankTransaction[] = [];
      const importBatchId = uuidv4();

      // Parsear según formato
      switch (input.format) {
        case 'N43':
          // Parsear formato Norma 43 (cuaderno 43 de la AEB)
          const n43Transactions = this.parseN43(input.content, accountId, importBatchId);
          importedTransactions.push(...n43Transactions);
          break;

        case 'CAMT053':
          // Parsear formato ISO 20022 camt.053
          const camtTransactions = this.parseCAMT053(input.content, accountId, importBatchId);
          importedTransactions.push(...camtTransactions);
          break;

        case 'CSV':
          // Parsear CSV genérico
          const csvTransactions = this.parseCSV(input.content, accountId, importBatchId);
          importedTransactions.push(...csvTransactions);
          break;

        default:
          return {
            success: false,
            error: `Formato ${input.format} no soportado`,
          };
      }

      // Guardar transacciones
      for (const transaction of importedTransactions) {
        bankTransactions.set(transaction.id, transaction);
      }

      // Actualizar fecha de sincronización
      account.lastSyncedAt = new Date();
      bankAccounts.set(accountId, account);

      return {
        success: true,
        data: importedTransactions,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al importar extracto: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Parsea formato Norma 43
   */
  private parseN43(content: string, accountId: string, batchId: string): BankTransaction[] {
    const transactions: BankTransaction[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.length < 2) continue;

      const recordType = line.substring(0, 2);

      // Registro de movimiento (tipo 22 y 23)
      if (recordType === '22' || recordType === '23') {
        const dateStr = line.substring(10, 16); // AAMMDD
        const amount = parseInt(line.substring(27, 41)) / 100;
        const sign = line.substring(27, 28);

        const year = 2000 + parseInt(dateStr.substring(0, 2));
        const month = parseInt(dateStr.substring(2, 4)) - 1;
        const day = parseInt(dateStr.substring(4, 6));

        const transaction: BankTransaction = {
          id: uuidv4(),
          bankAccountId: accountId,
          transactionId: line.substring(41, 51),
          transactionDate: new Date(year, month, day),
          valueDate: new Date(year, month, day),
          amount: sign === '1' ? -amount : amount, // 1 = debe, 2 = haber
          currency: 'EUR',
          description: line.substring(52, 92).trim(),
          type: sign === '1' ? 'DEBIT' : 'CREDIT',
          reconciliationStatus: ReconciliationStatus.PENDING,
          source: 'IMPORT',
          importBatchId: batchId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        transactions.push(transaction);
      }
    }

    return transactions;
  }

  /**
   * Parsea formato CAMT.053
   */
  private parseCAMT053(content: string, accountId: string, batchId: string): BankTransaction[] {
    // Implementación simplificada - en producción usar xml2js
    const transactions: BankTransaction[] = [];

    // Extraer entradas con regex básico
    const entryRegex = /<Ntry>([\s\S]*?)<\/Ntry>/g;
    let match;

    while ((match = entryRegex.exec(content)) !== null) {
      const entry = match[1];

      const amtMatch = /<Amt[^>]*>([^<]+)<\/Amt>/.exec(entry);
      const cdtDbtMatch = /<CdtDbtInd>([^<]+)<\/CdtDbtInd>/.exec(entry);
      const bookgDtMatch = /<BookgDt><Dt>([^<]+)<\/Dt><\/BookgDt>/.exec(entry);
      const valDtMatch = /<ValDt><Dt>([^<]+)<\/ValDt><\/ValDt>/.exec(entry);
      const addlInfMatch = /<AddtlNtryInf>([^<]+)<\/AddtlNtryInf>/.exec(entry);

      if (amtMatch && cdtDbtMatch && bookgDtMatch) {
        const amount = parseFloat(amtMatch[1]);
        const isCredit = cdtDbtMatch[1] === 'CRDT';
        const bookingDate = new Date(bookgDtMatch[1]);
        const valueDate = valDtMatch ? new Date(valDtMatch[1]) : bookingDate;
        const description = addlInfMatch ? addlInfMatch[1] : '';

        const transaction: BankTransaction = {
          id: uuidv4(),
          bankAccountId: accountId,
          transactionId: `CAMT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          transactionDate: bookingDate,
          valueDate,
          bookingDate,
          amount: isCredit ? amount : -amount,
          currency: 'EUR',
          description,
          type: isCredit ? 'CREDIT' : 'DEBIT',
          reconciliationStatus: ReconciliationStatus.PENDING,
          source: 'IMPORT',
          importBatchId: batchId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        transactions.push(transaction);
      }
    }

    return transactions;
  }

  /**
   * Parsea formato CSV
   */
  private parseCSV(content: string, accountId: string, batchId: string): BankTransaction[] {
    const transactions: BankTransaction[] = [];
    const lines = content.split('\n');

    // Saltar cabecera
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = line.split(';');
      if (fields.length < 4) continue;

      // Formato esperado: fecha;concepto;importe;saldo
      const dateStr = fields[0];
      const description = fields[1];
      const amount = parseFloat(fields[2].replace(',', '.'));

      const dateParts = dateStr.split('/');
      const date = new Date(
        parseInt(dateParts[2]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[0])
      );

      const transaction: BankTransaction = {
        id: uuidv4(),
        bankAccountId: accountId,
        transactionId: `CSV-${Date.now()}-${i}`,
        transactionDate: date,
        valueDate: date,
        amount,
        currency: 'EUR',
        description,
        type: amount >= 0 ? 'CREDIT' : 'DEBIT',
        reconciliationStatus: ReconciliationStatus.PENDING,
        source: 'IMPORT',
        importBatchId: batchId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      transactions.push(transaction);
    }

    return transactions;
  }

  /**
   * Valida un IBAN
   */
  private validateIBAN(iban: string): boolean {
    const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

    if (cleanIBAN.length < 15 || cleanIBAN.length > 34) {
      return false;
    }

    // Mover los 4 primeros caracteres al final
    const rearranged = cleanIBAN.substring(4) + cleanIBAN.substring(0, 4);

    // Convertir letras a números (A=10, B=11, etc.)
    let numericString = '';
    for (const char of rearranged) {
      if (char >= 'A' && char <= 'Z') {
        numericString += (char.charCodeAt(0) - 55).toString();
      } else {
        numericString += char;
      }
    }

    // Calcular módulo 97
    let remainder = 0;
    for (let i = 0; i < numericString.length; i += 7) {
      const block = remainder.toString() + numericString.substring(i, i + 7);
      remainder = parseInt(block) % 97;
    }

    return remainder === 1;
  }

  /**
   * Escapa caracteres XML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Obtiene todas las cuentas bancarias
   */
  async getBankAccounts(): Promise<AccountingResult<BankAccount[]>> {
    return {
      success: true,
      data: Array.from(bankAccounts.values()),
    };
  }

  /**
   * Obtiene transacciones bancarias
   */
  async getBankTransactions(
    accountId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AccountingResult<BankTransaction[]>> {
    let transactions = Array.from(bankTransactions.values()).filter(
      t => t.bankAccountId === accountId
    );

    if (startDate) {
      transactions = transactions.filter(t => t.transactionDate >= startDate);
    }
    if (endDate) {
      transactions = transactions.filter(t => t.transactionDate <= endDate);
    }

    transactions.sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());

    return {
      success: true,
      data: transactions,
    };
  }

  /**
   * Obtiene un lote SEPA por ID
   */
  async getSEPABatch(batchId: string): Promise<AccountingResult<SEPABatch>> {
    const batch = sepaBatches.get(batchId);
    if (!batch) {
      return {
        success: false,
        error: `Lote ${batchId} no encontrado`,
      };
    }
    return {
      success: true,
      data: batch,
    };
  }
}

// Exportar instancia singleton
export const treasuryService = new TreasuryService();
