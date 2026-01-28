/**
 * AIT-CONNECTOR - ERP Connectors
 * Connectors for ERP systems (SAP, Oracle, Microsoft Dynamics, Odoo, etc.)
 */

import { BaseConnector } from '../base-connector';
import { ConnectorType, ConnectorConfig, ConnectorCredentials, Logger } from '../../types';
import axios, { AxiosInstance } from 'axios';

/**
 * SAP ERP Connector
 */
export class SAPConnector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'SAP ERP', ConnectorType.ERP, 'sap', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  protected async onConnect(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    // Authenticate with SAP
    const response = await this.client.post('/auth/login', {
      username: this.credentials?.username,
      password: this.credentials?.password
    });

    // Store session token
    this.client.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
  }

  protected async onDisconnect(): Promise<void> {
    if (this.client) {
      await this.client.post('/auth/logout');
    }
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'getCustomers':
        return this.getCustomers(params);
      case 'getProducts':
        return this.getProducts(params);
      case 'createOrder':
        return this.createOrder(params);
      case 'getInventory':
        return this.getInventory(params);
      case 'createInvoice':
        return this.createInvoice(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async getCustomers(params: any): Promise<any> {
    const response = await this.client!.get('/api/customers', { params });
    return response.data;
  }

  private async getProducts(params: any): Promise<any> {
    const response = await this.client!.get('/api/products', { params });
    return response.data;
  }

  private async createOrder(params: any): Promise<any> {
    const response = await this.client!.post('/api/orders', params);
    return response.data;
  }

  private async getInventory(params: any): Promise<any> {
    const response = await this.client!.get('/api/inventory', { params });
    return response.data;
  }

  private async createInvoice(params: any): Promise<any> {
    const response = await this.client!.post('/api/invoices', params);
    return response.data;
  }
}

/**
 * Oracle ERP Connector
 */
export class OracleERPConnector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Oracle ERP', ConnectorType.ERP, 'oracle', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout
    });
  }

  protected async onConnect(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    const response = await this.client.post('/fscmRestApi/tokenrelay', {
      username: this.credentials?.username,
      password: this.credentials?.password
    });

    this.client.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
  }

  protected async onDisconnect(): Promise<void> {
    // Oracle ERP Cloud doesn't require explicit logout
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('/fscmRestApi/resources/latest/');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'getSuppliers':
        return this.getSuppliers(params);
      case 'getPurchaseOrders':
        return this.getPurchaseOrders(params);
      case 'createSupplier':
        return this.createSupplier(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async getSuppliers(params: any): Promise<any> {
    const response = await this.client!.get('/fscmRestApi/resources/latest/suppliers', { params });
    return response.data;
  }

  private async getPurchaseOrders(params: any): Promise<any> {
    const response = await this.client!.get('/fscmRestApi/resources/latest/purchaseOrders', { params });
    return response.data;
  }

  private async createSupplier(params: any): Promise<any> {
    const response = await this.client!.post('/fscmRestApi/resources/latest/suppliers', params);
    return response.data;
  }
}

/**
 * Microsoft Dynamics 365 Connector
 */
export class Dynamics365Connector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Dynamics 365', ConnectorType.ERP, 'dynamics365', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout
    });
  }

  protected async onConnect(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    // OAuth2 authentication
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${this.credentials?.custom?.tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: this.credentials?.clientId || '',
        client_secret: this.credentials?.clientSecret || '',
        scope: `${this.config.baseUrl}/.default`,
        grant_type: 'client_credentials'
      })
    );

    this.client.defaults.headers.common['Authorization'] = `Bearer ${tokenResponse.data.access_token}`;
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('/api/data/v9.2/');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'getAccounts':
        return this.getAccounts(params);
      case 'getContacts':
        return this.getContacts(params);
      case 'createAccount':
        return this.createAccount(params);
      case 'updateAccount':
        return this.updateAccount(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async getAccounts(params: any): Promise<any> {
    const response = await this.client!.get('/api/data/v9.2/accounts', { params });
    return response.data;
  }

  private async getContacts(params: any): Promise<any> {
    const response = await this.client!.get('/api/data/v9.2/contacts', { params });
    return response.data;
  }

  private async createAccount(params: any): Promise<any> {
    const response = await this.client!.post('/api/data/v9.2/accounts', params);
    return response.data;
  }

  private async updateAccount(params: any): Promise<any> {
    const { id, ...data } = params;
    const response = await this.client!.patch(`/api/data/v9.2/accounts(${id})`, data);
    return response.data;
  }
}

/**
 * Odoo ERP Connector
 */
export class OdooConnector extends BaseConnector {
  private client?: AxiosInstance;
  private uid?: number;
  private database?: string;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Odoo', ConnectorType.ERP, 'odoo', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout
    });
    this.database = this.config.custom?.database || 'odoo';
  }

  protected async onConnect(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    const response = await this.client.post('/web/session/authenticate', {
      jsonrpc: '2.0',
      params: {
        db: this.database,
        login: this.credentials?.username,
        password: this.credentials?.password
      }
    });

    this.uid = response.data.result.uid;
  }

  protected async onDisconnect(): Promise<void> {
    if (this.client) {
      await this.client.post('/web/session/destroy');
    }
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      const response = await this.client.post('/web/session/get_session_info');
      return response.data.result.uid !== false;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'searchRead':
        return this.searchRead(params);
      case 'create':
        return this.create(params);
      case 'write':
        return this.write(params);
      case 'unlink':
        return this.unlink(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async searchRead(params: any): Promise<any> {
    const { model, domain, fields, limit, offset } = params;
    const response = await this.client!.post('/web/dataset/search_read', {
      jsonrpc: '2.0',
      params: {
        model,
        domain: domain || [],
        fields: fields || [],
        limit: limit || 80,
        offset: offset || 0
      }
    });

    return response.data.result;
  }

  private async create(params: any): Promise<any> {
    const { model, values } = params;
    const response = await this.client!.post('/web/dataset/call_kw', {
      jsonrpc: '2.0',
      params: {
        model,
        method: 'create',
        args: [values],
        kwargs: {}
      }
    });

    return response.data.result;
  }

  private async write(params: any): Promise<any> {
    const { model, ids, values } = params;
    const response = await this.client!.post('/web/dataset/call_kw', {
      jsonrpc: '2.0',
      params: {
        model,
        method: 'write',
        args: [ids, values],
        kwargs: {}
      }
    });

    return response.data.result;
  }

  private async unlink(params: any): Promise<any> {
    const { model, ids } = params;
    const response = await this.client!.post('/web/dataset/call_kw', {
      jsonrpc: '2.0',
      params: {
        model,
        method: 'unlink',
        args: [ids],
        kwargs: {}
      }
    });

    return response.data.result;
  }
}
