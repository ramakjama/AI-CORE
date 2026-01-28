/**
 * AIT-CONNECTOR - Payment Connectors
 * Connectors for payment platforms (Stripe, PayPal, Square, Adyen, etc.)
 */

import { BaseConnector } from '../base-connector';
import { ConnectorType, ConnectorConfig, ConnectorCredentials, Logger } from '../../types';
import axios, { AxiosInstance } from 'axios';

/**
 * Stripe Connector
 */
export class StripeConnector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Stripe', ConnectorType.PAYMENT, 'stripe', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    this.client = axios.create({
      baseURL: 'https://api.stripe.com/v1',
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${this.credentials?.apiKey}`
      }
    });
  }

  protected async onConnect(): Promise<void> {
    // No explicit connection needed
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('/charges?limit=1');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'createPaymentIntent':
        return this.createPaymentIntent(params);
      case 'createCustomer':
        return this.createCustomer(params);
      case 'createSubscription':
        return this.createSubscription(params);
      case 'refund':
        return this.refund(params);
      case 'getPayments':
        return this.getPayments(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async createPaymentIntent(params: any): Promise<any> {
    const response = await this.client!.post('/payment_intents', new URLSearchParams(params));
    return response.data;
  }

  private async createCustomer(params: any): Promise<any> {
    const response = await this.client!.post('/customers', new URLSearchParams(params));
    return response.data;
  }

  private async createSubscription(params: any): Promise<any> {
    const response = await this.client!.post('/subscriptions', new URLSearchParams(params));
    return response.data;
  }

  private async refund(params: { charge: string; amount?: number }): Promise<any> {
    const response = await this.client!.post('/refunds', new URLSearchParams(params));
    return response.data;
  }

  private async getPayments(params: any): Promise<any> {
    const response = await this.client!.get('/charges', { params });
    return response.data;
  }
}

/**
 * PayPal Connector
 */
export class PayPalConnector extends BaseConnector {
  private client?: AxiosInstance;
  private sandbox: boolean;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'PayPal', ConnectorType.PAYMENT, 'paypal', '1.0.0', config, credentials, logger);
    this.sandbox = config.custom?.sandbox || false;
  }

  protected async onInitialize(): Promise<void> {
    const baseURL = this.sandbox
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    this.client = axios.create({
      baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  protected async onConnect(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    // Get OAuth token
    const response = await this.client.post(
      '/v1/oauth2/token',
      'grant_type=client_credentials',
      {
        auth: {
          username: this.credentials?.clientId || '',
          password: this.credentials?.clientSecret || ''
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    this.client.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('/v1/notifications/webhooks');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'createOrder':
        return this.createOrder(params);
      case 'captureOrder':
        return this.captureOrder(params);
      case 'createInvoice':
        return this.createInvoice(params);
      case 'refund':
        return this.refund(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async createOrder(params: any): Promise<any> {
    const response = await this.client!.post('/v2/checkout/orders', params);
    return response.data;
  }

  private async captureOrder(params: { orderId: string }): Promise<any> {
    const response = await this.client!.post(`/v2/checkout/orders/${params.orderId}/capture`);
    return response.data;
  }

  private async createInvoice(params: any): Promise<any> {
    const response = await this.client!.post('/v2/invoicing/invoices', params);
    return response.data;
  }

  private async refund(params: { captureId: string; amount: any }): Promise<any> {
    const response = await this.client!.post(`/v2/payments/captures/${params.captureId}/refund`, {
      amount: params.amount
    });
    return response.data;
  }
}

/**
 * Square Connector
 */
export class SquareConnector extends BaseConnector {
  private client?: AxiosInstance;
  private sandbox: boolean;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Square', ConnectorType.PAYMENT, 'square', '1.0.0', config, credentials, logger);
    this.sandbox = config.custom?.sandbox || false;
  }

  protected async onInitialize(): Promise<void> {
    const baseURL = this.sandbox
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

    this.client = axios.create({
      baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Square-Version': '2023-10-18',
        'Authorization': `Bearer ${this.credentials?.apiKey}`
      }
    });
  }

  protected async onConnect(): Promise<void> {
    // No explicit connection needed
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('/v2/locations');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'createPayment':
        return this.createPayment(params);
      case 'createCustomer':
        return this.createCustomer(params);
      case 'createOrder':
        return this.createOrder(params);
      case 'refund':
        return this.refund(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async createPayment(params: any): Promise<any> {
    const response = await this.client!.post('/v2/payments', params);
    return response.data;
  }

  private async createCustomer(params: any): Promise<any> {
    const response = await this.client!.post('/v2/customers', params);
    return response.data;
  }

  private async createOrder(params: any): Promise<any> {
    const response = await this.client!.post('/v2/orders', params);
    return response.data;
  }

  private async refund(params: any): Promise<any> {
    const response = await this.client!.post('/v2/refunds', params);
    return response.data;
  }
}

/**
 * Adyen Connector
 */
export class AdyenConnector extends BaseConnector {
  private client?: AxiosInstance;
  private sandbox: boolean;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Adyen', ConnectorType.PAYMENT, 'adyen', '1.0.0', config, credentials, logger);
    this.sandbox = config.custom?.sandbox || false;
  }

  protected async onInitialize(): Promise<void> {
    const env = this.sandbox ? 'test' : 'live';
    this.client = axios.create({
      baseURL: `https://checkout-${env}.adyen.com/v70`,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.credentials?.apiKey
      }
    });
  }

  protected async onConnect(): Promise<void> {
    // No explicit connection needed
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.post('/paymentMethods', {
        merchantAccount: this.credentials?.custom?.merchantAccount
      });
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'createPayment':
        return this.createPayment(params);
      case 'getPaymentMethods':
        return this.getPaymentMethods(params);
      case 'refund':
        return this.refund(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async createPayment(params: any): Promise<any> {
    const response = await this.client!.post('/payments', {
      ...params,
      merchantAccount: this.credentials?.custom?.merchantAccount
    });
    return response.data;
  }

  private async getPaymentMethods(params: any): Promise<any> {
    const response = await this.client!.post('/paymentMethods', {
      ...params,
      merchantAccount: this.credentials?.custom?.merchantAccount
    });
    return response.data;
  }

  private async refund(params: any): Promise<any> {
    const response = await this.client!.post('/refunds', {
      ...params,
      merchantAccount: this.credentials?.custom?.merchantAccount
    });
    return response.data;
  }
}

/**
 * Braintree Connector
 */
export class BraintreeConnector extends BaseConnector {
  private client?: AxiosInstance;
  private sandbox: boolean;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Braintree', ConnectorType.PAYMENT, 'braintree', '1.0.0', config, credentials, logger);
    this.sandbox = config.custom?.sandbox || false;
  }

  protected async onInitialize(): Promise<void> {
    const baseURL = this.sandbox
      ? 'https://api.sandbox.braintreegateway.com'
      : 'https://api.braintreegateway.com';

    const merchantId = this.credentials?.custom?.merchantId;
    const publicKey = this.credentials?.custom?.publicKey;
    const privateKey = this.credentials?.apiKey;

    this.client = axios.create({
      baseURL: `${baseURL}/merchants/${merchantId}`,
      timeout: this.config.timeout,
      auth: {
        username: publicKey || '',
        password: privateKey || ''
      },
      headers: {
        'Content-Type': 'application/xml'
      }
    });
  }

  protected async onConnect(): Promise<void> {
    // No explicit connection needed
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('/transactions');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'createTransaction':
        return this.createTransaction(params);
      case 'refund':
        return this.refund(params);
      case 'createCustomer':
        return this.createCustomer(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async createTransaction(params: any): Promise<any> {
    const response = await this.client!.post('/transactions', params);
    return response.data;
  }

  private async refund(params: { transactionId: string; amount?: number }): Promise<any> {
    const response = await this.client!.post(`/transactions/${params.transactionId}/refund`, {
      amount: params.amount
    });
    return response.data;
  }

  private async createCustomer(params: any): Promise<any> {
    const response = await this.client!.post('/customers', params);
    return response.data;
  }
}
