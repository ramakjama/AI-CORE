/**
 * Banking Connector
 * Conectores para Open Banking, PSD2 y SEPA
 */

import axios, { AxiosInstance } from 'axios';
import {
  Connector,
  ConnectorConfig,
  IntegrationCredentials,
  IntegrationType,
  AuthType,
  OperationResult
} from '../types';

/**
 * Cuenta bancaria
 */
export interface BankAccount {
  iban: string;
  bic?: string;
  currency: string;
  accountType: 'current' | 'savings' | 'credit' | 'loan';
  name?: string;
  ownerName: string;
  balance: {
    amount: number;
    currency: string;
    date: Date;
  };
  status: 'active' | 'blocked' | 'closed';
}

/**
 * Transacción bancaria
 */
export interface BankTransaction {
  transactionId: string;
  accountId: string;
  bookingDate: Date;
  valueDate: Date;
  amount: number;
  currency: string;
  creditorName?: string;
  creditorIban?: string;
  debtorName?: string;
  debtorIban?: string;
  remittanceInfo?: string;
  transactionType: string;
  status: 'booked' | 'pending';
}

/**
 * Pago SEPA
 */
export interface SEPAPayment {
  paymentId?: string;
  debtorIban: string;
  debtorName: string;
  creditorIban: string;
  creditorName: string;
  amount: number;
  currency: string;
  remittanceInfo?: string;
  requestedExecutionDate?: Date;
  endToEndId?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'executed';
}

/**
 * Adeudo directo SEPA
 */
export interface SEPADirectDebit {
  mandateId: string;
  creditorId: string;
  creditorName: string;
  debtorIban: string;
  debtorName: string;
  amount: number;
  currency: string;
  collectionDate: Date;
  remittanceInfo?: string;
  sequenceType: 'FRST' | 'RCUR' | 'OOFF' | 'FNAL';
  status?: 'pending' | 'collected' | 'returned' | 'rejected';
}

/**
 * Consentimiento PSD2
 */
export interface PSD2Consent {
  consentId: string;
  validUntil: Date;
  frequencyPerDay: number;
  accounts: string[];
  access: {
    accounts?: boolean;
    balances?: boolean;
    transactions?: boolean;
  };
  status: 'received' | 'valid' | 'expired' | 'revoked';
}

/**
 * Conector base para banca
 */
abstract class BaseBankingConnector implements Connector {
  config: ConnectorConfig;
  protected client: AxiosInstance | null = null;
  protected credentials: IntegrationCredentials | null = null;

  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  abstract initialize(credentials: IntegrationCredentials): Promise<void>;
  abstract testConnection(): Promise<boolean>;

  async execute<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    if (!this.client) {
      throw new Error('Connector not initialized');
    }

    const endpointConfig = this.config.endpoints.find(e => e.name === endpoint);
    if (!endpointConfig) {
      throw new Error(`Endpoint ${endpoint} not found`);
    }

    const response = await this.client.request<T>({
      method: endpointConfig.method,
      url: endpointConfig.path,
      params: endpointConfig.method === 'GET' ? params : undefined,
      data: endpointConfig.method !== 'GET' ? params : undefined
    });

    return response.data;
  }

  async disconnect(): Promise<void> {
    this.client = null;
    this.credentials = null;
  }
}

/**
 * Conector Open Banking (PSD2)
 */
export class OpenBankingConnector extends BaseBankingConnector {
  private consentId: string | null = null;

  constructor() {
    super({
      type: IntegrationType.BANKING_OPEN_BANKING,
      name: 'Open Banking PSD2 Connector',
      version: '3.1.0',
      endpoints: [
        {
          name: 'getAccounts',
          path: '/accounts',
          method: 'GET',
          description: 'Obtener cuentas autorizadas'
        },
        {
          name: 'getAccount',
          path: '/accounts/{accountId}',
          method: 'GET',
          description: 'Detalle de cuenta'
        },
        {
          name: 'getBalances',
          path: '/accounts/{accountId}/balances',
          method: 'GET',
          description: 'Obtener saldos'
        },
        {
          name: 'getTransactions',
          path: '/accounts/{accountId}/transactions',
          method: 'GET',
          description: 'Obtener movimientos'
        },
        {
          name: 'createConsent',
          path: '/consents',
          method: 'POST',
          description: 'Crear consentimiento'
        },
        {
          name: 'getConsent',
          path: '/consents/{consentId}',
          method: 'GET',
          description: 'Estado de consentimiento'
        },
        {
          name: 'initiatePayment',
          path: '/payments/sepa-credit-transfers',
          method: 'POST',
          description: 'Iniciar pago SEPA'
        }
      ],
      authentication: [AuthType.OAUTH2, AuthType.CERTIFICATE],
      rateLimits: {
        requests: 4,
        period: 1 // PSD2 limita a 4 requests por segundo
      },
      features: ['accounts', 'balances', 'transactions', 'payments'],
      documentation: 'https://openbankinguk.github.io/read-write-api-site3/'
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;

    this.client = axios.create({
      baseURL: credentials.customParams?.apiUrl as string || 'https://api.openbanking.example.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.accessToken || ''}`,
        'X-Request-ID': this.generateRequestId()
      }
    });

    // Interceptor para agregar headers PSD2
    this.client.interceptors.request.use((config) => {
      config.headers['X-Request-ID'] = this.generateRequestId();
      if (this.consentId) {
        config.headers['Consent-ID'] = this.consentId;
      }
      return config;
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Crear consentimiento PSD2
   */
  async createConsent(access: {
    accounts?: boolean;
    balances?: boolean;
    transactions?: boolean;
  }, validUntil: Date): Promise<OperationResult<PSD2Consent>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.post<PSD2Consent>('/consents', {
        access: {
          accounts: access.accounts ? 'allAccounts' : undefined,
          balances: access.balances ? 'allAccounts' : undefined,
          transactions: access.transactions ? 'allAccounts' : undefined
        },
        validUntil: validUntil.toISOString(),
        frequencyPerDay: 4,
        recurringIndicator: true
      });

      this.consentId = response.data.consentId;

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONSENT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create consent'
        }
      };
    }
  }

  /**
   * Obtener cuentas
   */
  async getAccounts(): Promise<OperationResult<BankAccount[]>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.get<{ accounts: BankAccount[] }>('/accounts');
      return { success: true, data: response.data.accounts };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch accounts'
        }
      };
    }
  }

  /**
   * Obtener saldo de cuenta
   */
  async getBalance(accountId: string): Promise<OperationResult<{
    amount: number;
    currency: string;
    date: Date;
  }>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.get(`/accounts/${accountId}/balances`);
      const balance = response.data.balances[0];

      return {
        success: true,
        data: {
          amount: balance.amount.amount,
          currency: balance.amount.currency,
          date: new Date(balance.referenceDate)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch balance'
        }
      };
    }
  }

  /**
   * Obtener transacciones
   */
  async getTransactions(
    accountId: string,
    dateFrom: Date,
    dateTo?: Date
  ): Promise<OperationResult<BankTransaction[]>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.get(`/accounts/${accountId}/transactions`, {
        params: {
          dateFrom: dateFrom.toISOString().split('T')[0],
          dateTo: dateTo?.toISOString().split('T')[0]
        }
      });

      const transactions = response.data.transactions.booked.map((t: Record<string, unknown>) => ({
        transactionId: t.transactionId,
        accountId,
        bookingDate: new Date(t.bookingDate as string),
        valueDate: new Date(t.valueDate as string),
        amount: parseFloat((t.transactionAmount as Record<string, unknown>).amount as string),
        currency: (t.transactionAmount as Record<string, unknown>).currency,
        creditorName: t.creditorName,
        creditorIban: (t.creditorAccount as Record<string, unknown>)?.iban,
        debtorName: t.debtorName,
        debtorIban: (t.debtorAccount as Record<string, unknown>)?.iban,
        remittanceInfo: t.remittanceInformationUnstructured,
        transactionType: t.bankTransactionCode,
        status: 'booked'
      }));

      return { success: true, data: transactions };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch transactions'
        }
      };
    }
  }

  /**
   * Iniciar pago SEPA
   */
  async initiatePayment(payment: SEPAPayment): Promise<OperationResult<{
    paymentId: string;
    status: string;
    authorisationUrl?: string;
  }>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.post('/payments/sepa-credit-transfers', {
        debtorAccount: {
          iban: payment.debtorIban
        },
        debtorName: payment.debtorName,
        instructedAmount: {
          amount: payment.amount.toFixed(2),
          currency: payment.currency
        },
        creditorAccount: {
          iban: payment.creditorIban
        },
        creditorName: payment.creditorName,
        remittanceInformationUnstructured: payment.remittanceInfo,
        requestedExecutionDate: payment.requestedExecutionDate?.toISOString().split('T')[0]
      });

      return {
        success: true,
        data: {
          paymentId: response.data.paymentId,
          status: response.data.transactionStatus,
          authorisationUrl: response.data._links?.scaRedirect?.href
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PAYMENT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to initiate payment'
        }
      };
    }
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * Conector SEPA
 */
export class SEPAConnector extends BaseBankingConnector {
  constructor() {
    super({
      type: IntegrationType.BANKING_SEPA,
      name: 'SEPA Payments Connector',
      version: '1.0.0',
      endpoints: [
        {
          name: 'createCreditTransfer',
          path: '/sepa/credit-transfers',
          method: 'POST',
          description: 'Crear transferencia SEPA'
        },
        {
          name: 'createDirectDebit',
          path: '/sepa/direct-debits',
          method: 'POST',
          description: 'Crear adeudo directo'
        },
        {
          name: 'createBatch',
          path: '/sepa/batches',
          method: 'POST',
          description: 'Crear lote de operaciones'
        },
        {
          name: 'getPaymentStatus',
          path: '/sepa/payments/{paymentId}',
          method: 'GET',
          description: 'Estado de pago'
        }
      ],
      authentication: [AuthType.CERTIFICATE, AuthType.API_KEY],
      features: ['credit-transfers', 'direct-debits', 'batch-payments', 'status-tracking']
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;

    this.client = axios.create({
      baseURL: credentials.customParams?.apiUrl as string || 'https://api.sepa-processor.example.com',
      timeout: 60000,
      headers: {
        'Content-Type': 'application/xml',
        'X-API-Key': credentials.apiKey || ''
      }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Crear transferencia SEPA
   */
  async createCreditTransfer(payment: SEPAPayment): Promise<OperationResult<{
    paymentId: string;
    status: string;
  }>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const xml = this.buildSEPACreditTransferXML(payment);
      const response = await this.client.post('/sepa/credit-transfers', xml);

      return {
        success: true,
        data: {
          paymentId: response.data.paymentId,
          status: response.data.status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRANSFER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create transfer'
        }
      };
    }
  }

  /**
   * Crear adeudo directo SEPA
   */
  async createDirectDebit(directDebit: SEPADirectDebit): Promise<OperationResult<{
    paymentId: string;
    status: string;
  }>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const xml = this.buildSEPADirectDebitXML(directDebit);
      const response = await this.client.post('/sepa/direct-debits', xml);

      return {
        success: true,
        data: {
          paymentId: response.data.paymentId,
          status: response.data.status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DIRECT_DEBIT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create direct debit'
        }
      };
    }
  }

  /**
   * Crear lote de pagos SEPA
   */
  async createBatch(payments: SEPAPayment[]): Promise<OperationResult<{
    batchId: string;
    count: number;
    totalAmount: number;
    status: string;
  }>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const xml = this.buildSEPABatchXML(payments);
      const response = await this.client.post('/sepa/batches', xml);

      return {
        success: true,
        data: {
          batchId: response.data.batchId,
          count: payments.length,
          totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
          status: response.data.status
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BATCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create batch'
        }
      };
    }
  }

  /**
   * Obtener estado de pago
   */
  async getPaymentStatus(paymentId: string): Promise<OperationResult<{
    paymentId: string;
    status: string;
    reasonCode?: string;
    reasonDescription?: string;
  }>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.get(`/sepa/payments/${paymentId}`);

      return {
        success: true,
        data: {
          paymentId: response.data.paymentId,
          status: response.data.status,
          reasonCode: response.data.reasonCode,
          reasonDescription: response.data.reasonDescription
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STATUS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get payment status'
        }
      };
    }
  }

  private buildSEPACreditTransferXML(payment: SEPAPayment): string {
    const date = payment.requestedExecutionDate || new Date();
    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${Date.now()}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>${payment.amount.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>${payment.debtorName}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${Date.now()}-1</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>${payment.amount.toFixed(2)}</CtrlSum>
      <ReqdExctnDt>${date.toISOString().split('T')[0]}</ReqdExctnDt>
      <Dbtr>
        <Nm>${payment.debtorName}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${payment.debtorIban}</IBAN>
        </Id>
      </DbtrAcct>
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${payment.endToEndId || Date.now()}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="${payment.currency}">${payment.amount.toFixed(2)}</InstdAmt>
        </Amt>
        <Cdtr>
          <Nm>${payment.creditorName}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${payment.creditorIban}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${payment.remittanceInfo || ''}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
  }

  private buildSEPADirectDebitXML(directDebit: SEPADirectDebit): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${Date.now()}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>${directDebit.amount.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>${directDebit.creditorName}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${Date.now()}-1</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>${directDebit.amount.toFixed(2)}</CtrlSum>
      <ReqdColltnDt>${directDebit.collectionDate.toISOString().split('T')[0]}</ReqdColltnDt>
      <Cdtr>
        <Nm>${directDebit.creditorName}</Nm>
      </Cdtr>
      <CdtrSchmeId>
        <Id>
          <PrvtId>
            <Othr>
              <Id>${directDebit.creditorId}</Id>
              <SchmeNm>
                <Prtry>SEPA</Prtry>
              </SchmeNm>
            </Othr>
          </PrvtId>
        </Id>
      </CdtrSchmeId>
      <DrctDbtTxInf>
        <PmtId>
          <EndToEndId>${Date.now()}</EndToEndId>
        </PmtId>
        <InstdAmt Ccy="${directDebit.currency}">${directDebit.amount.toFixed(2)}</InstdAmt>
        <DrctDbtTx>
          <MndtRltdInf>
            <MndtId>${directDebit.mandateId}</MndtId>
            <DtOfSgntr>${new Date().toISOString().split('T')[0]}</DtOfSgntr>
          </MndtRltdInf>
        </DrctDbtTx>
        <DbtrAgt>
          <FinInstnId>
            <BIC>NOTPROVIDED</BIC>
          </FinInstnId>
        </DbtrAgt>
        <Dbtr>
          <Nm>${directDebit.debtorName}</Nm>
        </Dbtr>
        <DbtrAcct>
          <Id>
            <IBAN>${directDebit.debtorIban}</IBAN>
          </Id>
        </DbtrAcct>
        <RmtInf>
          <Ustrd>${directDebit.remittanceInfo || ''}</Ustrd>
        </RmtInf>
      </DrctDbtTxInf>
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>`;
  }

  private buildSEPABatchXML(payments: SEPAPayment[]): string {
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const txInfos = payments.map((payment, index) => `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${payment.endToEndId || `${Date.now()}-${index}`}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="${payment.currency}">${payment.amount.toFixed(2)}</InstdAmt>
        </Amt>
        <Cdtr>
          <Nm>${payment.creditorName}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${payment.creditorIban}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${payment.remittanceInfo || ''}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${Date.now()}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>${payments.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>${payments[0]?.debtorName || 'Batch Initiator'}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${Date.now()}-batch</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${payments.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <ReqdExctnDt>${new Date().toISOString().split('T')[0]}</ReqdExctnDt>
      <Dbtr>
        <Nm>${payments[0]?.debtorName || 'Debtor'}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${payments[0]?.debtorIban || ''}</IBAN>
        </Id>
      </DbtrAcct>${txInfos}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
  }
}

/**
 * Factory para crear conectores bancarios
 */
export function createBankingConnector(type: IntegrationType): BaseBankingConnector {
  switch (type) {
    case IntegrationType.BANKING_OPEN_BANKING:
    case IntegrationType.BANKING_PSD2:
      return new OpenBankingConnector();
    case IntegrationType.BANKING_SEPA:
      return new SEPAConnector();
    default:
      throw new Error(`Unsupported banking connector type: ${type}`);
  }
}

export {
  BaseBankingConnector,
  OpenBankingConnector,
  SEPAConnector
};
