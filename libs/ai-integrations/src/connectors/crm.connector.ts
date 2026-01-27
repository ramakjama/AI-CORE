/**
 * CRM Connector
 * Conectores para Salesforce, HubSpot, Microsoft Dynamics, Zoho, Pipedrive
 */

import axios, { AxiosInstance } from 'axios';
import {
  Connector,
  ConnectorConfig,
  IntegrationCredentials,
  IntegrationType,
  AuthType,
  OperationResult,
  PaginatedResult
} from '../types';

// ============================================
// INTERFACES COMUNES CRM
// ============================================

/**
 * Contacto CRM
 */
export interface CRMContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  company?: string;
  jobTitle?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  ownerId?: string;
  tags?: string[];
}

/**
 * Empresa/Cuenta CRM
 */
export interface CRMAccount {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  annualRevenue?: number;
  employees?: number;
  description?: string;
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  ownerId?: string;
}

/**
 * Oportunidad/Deal CRM
 */
export interface CRMDeal {
  id: string;
  name: string;
  amount: number;
  currency?: string;
  stage: string;
  probability?: number;
  closeDate?: Date;
  accountId?: string;
  contactId?: string;
  ownerId?: string;
  description?: string;
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Actividad CRM
 */
export interface CRMActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  dueDate?: Date;
  completedDate?: Date;
  status: 'open' | 'completed' | 'cancelled';
  contactId?: string;
  accountId?: string;
  dealId?: string;
  ownerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lead CRM
 */
export interface CRMLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  status: string;
  rating?: string;
  convertedContactId?: string;
  convertedAccountId?: string;
  convertedDealId?: string;
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  ownerId?: string;
}

/**
 * Filtros de busqueda CRM
 */
export interface CRMSearchFilters {
  query?: string;
  ownerId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// CONECTOR BASE CRM
// ============================================

/**
 * Conector base para CRM
 */
abstract class BaseCRMConnector implements Connector {
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

  // Metodos abstractos comunes
  abstract getContacts(filters?: CRMSearchFilters): Promise<OperationResult<PaginatedResult<CRMContact>>>;
  abstract getContact(id: string): Promise<OperationResult<CRMContact>>;
  abstract createContact(contact: Partial<CRMContact>): Promise<OperationResult<CRMContact>>;
  abstract updateContact(id: string, contact: Partial<CRMContact>): Promise<OperationResult<CRMContact>>;
  abstract deleteContact(id: string): Promise<OperationResult<void>>;

  abstract getAccounts(filters?: CRMSearchFilters): Promise<OperationResult<PaginatedResult<CRMAccount>>>;
  abstract getAccount(id: string): Promise<OperationResult<CRMAccount>>;
  abstract createAccount(account: Partial<CRMAccount>): Promise<OperationResult<CRMAccount>>;
  abstract updateAccount(id: string, account: Partial<CRMAccount>): Promise<OperationResult<CRMAccount>>;

  abstract getDeals(filters?: CRMSearchFilters): Promise<OperationResult<PaginatedResult<CRMDeal>>>;
  abstract getDeal(id: string): Promise<OperationResult<CRMDeal>>;
  abstract createDeal(deal: Partial<CRMDeal>): Promise<OperationResult<CRMDeal>>;
  abstract updateDeal(id: string, deal: Partial<CRMDeal>): Promise<OperationResult<CRMDeal>>;
}

// ============================================
// SALESFORCE CONNECTOR
// ============================================

/**
 * Conector Salesforce
 */
export class SalesforceConnector extends BaseCRMConnector {
  private instanceUrl: string = '';
  private apiVersion: string = 'v59.0';

  constructor() {
    super({
      type: IntegrationType.CRM_SALESFORCE,
      name: 'Salesforce CRM Connector',
      version: '59.0',
      endpoints: [
        { name: 'getContacts', path: '/services/data/{version}/sobjects/Contact', method: 'GET', description: 'Get contacts' },
        { name: 'getContact', path: '/services/data/{version}/sobjects/Contact/{id}', method: 'GET', description: 'Get contact by ID' },
        { name: 'createContact', path: '/services/data/{version}/sobjects/Contact', method: 'POST', description: 'Create contact' },
        { name: 'updateContact', path: '/services/data/{version}/sobjects/Contact/{id}', method: 'PATCH', description: 'Update contact' },
        { name: 'deleteContact', path: '/services/data/{version}/sobjects/Contact/{id}', method: 'DELETE', description: 'Delete contact' },
        { name: 'query', path: '/services/data/{version}/query', method: 'GET', description: 'Execute SOQL query' },
        { name: 'search', path: '/services/data/{version}/search', method: 'GET', description: 'Execute SOSL search' }
      ],
      authentication: [AuthType.OAUTH2],
      rateLimits: { requests: 100000, period: 86400 },
      features: ['contacts', 'accounts', 'opportunities', 'leads', 'activities', 'reports'],
      documentation: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/'
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;
    this.instanceUrl = credentials.customParams?.instanceUrl as string || '';

    this.client = axios.create({
      baseURL: this.instanceUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.accessToken}`
      }
    });

    // Interceptor para manejar refresh token
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401 && credentials.refreshToken) {
          const newToken = await this.refreshAccessToken();
          if (newToken && this.client) {
            this.client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            error.config.headers['Authorization'] = `Bearer ${newToken}`;
            return this.client.request(error.config);
          }
        }
        throw error;
      }
    );
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.get(`/services/data/${this.apiVersion}/limits`);
      return true;
    } catch {
      return false;
    }
  }

  async getContacts(filters?: CRMSearchFilters): Promise<OperationResult<PaginatedResult<CRMContact>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const soql = this.buildSOQL('Contact', [
        'Id', 'FirstName', 'LastName', 'Email', 'Phone', 'MobilePhone',
        'Account.Name', 'Title', 'MailingStreet', 'MailingCity', 'MailingState',
        'MailingPostalCode', 'MailingCountry', 'CreatedDate', 'LastModifiedDate', 'OwnerId'
      ], filters);

      const response = await this.client.get(`/services/data/${this.apiVersion}/query`, {
        params: { q: soql }
      });

      const contacts = response.data.records.map(this.mapSalesforceToContact);

      return {
        success: true,
        data: {
          items: contacts,
          total: response.data.totalSize,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil(response.data.totalSize / (filters?.pageSize || 100)),
          hasNext: !response.data.done,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SF_CONTACTS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get contacts'
        }
      };
    }
  }

  async getContact(id: string): Promise<OperationResult<CRMContact>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/services/data/${this.apiVersion}/sobjects/Contact/${id}`);
      return { success: true, data: this.mapSalesforceToContact(response.data) };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SF_CONTACT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get contact'
        }
      };
    }
  }

  async createContact(contact: Partial<CRMContact>): Promise<OperationResult<CRMContact>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const sfContact = this.mapContactToSalesforce(contact);
      const response = await this.client.post(`/services/data/${this.apiVersion}/sobjects/Contact`, sfContact);

      const created = await this.getContact(response.data.id);
      return created;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SF_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create contact'
        }
      };
    }
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<OperationResult<CRMContact>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const sfContact = this.mapContactToSalesforce(contact);
      await this.client.patch(`/services/data/${this.apiVersion}/sobjects/Contact/${id}`, sfContact);

      return this.getContact(id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SF_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update contact'
        }
      };
    }
  }

  async deleteContact(id: string): Promise<OperationResult<void>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      await this.client.delete(`/services/data/${this.apiVersion}/sobjects/Contact/${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SF_DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete contact'
        }
      };
    }
  }

  async getAccounts(filters?: CRMSearchFilters): Promise<OperationResult<PaginatedResult<CRMAccount>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const soql = this.buildSOQL('Account', [
        'Id', 'Name', 'Website', 'Industry', 'Phone', 'BillingStreet', 'BillingCity',
        'BillingState', 'BillingPostalCode', 'BillingCountry', 'AnnualRevenue',
        'NumberOfEmployees', 'Description', 'CreatedDate', 'LastModifiedDate', 'OwnerId'
      ], filters);

      const response = await this.client.get(`/services/data/${this.apiVersion}/query`, {
        params: { q: soql }
      });

      const accounts = response.data.records.map(this.mapSalesforceToAccount);

      return {
        success: true,
        data: {
          items: accounts,
          total: response.data.totalSize,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil(response.data.totalSize / (filters?.pageSize || 100)),
          hasNext: !response.data.done,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SF_ACCOUNTS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get accounts'
        }
      };
    }
  }

  async getAccount(id: string): Promise<OperationResult<CRMAccount>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/services/data/${this.apiVersion}/sobjects/Account/${id}`);
      return { success: true, data: this.mapSalesforceToAccount(response.data) };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SF_ACCOUNT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get account'
        }
      };
    }
  }

  async createAccount(account: Partial<CRMAccount>): Promise<OperationResult<CRMAccount>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const sfAccount = {
        Name: account.name,
        Website: account.website,
        Industry: account.industry,
        Phone: account.phone,
        BillingStreet: account.address?.street,
        BillingCity: account.address?.city,
        BillingState: account.address?.state,
        BillingPostalCode: account.address?.postalCode,
        BillingCountry: account.address?.country,
        AnnualRevenue: account.annualRevenue,
        NumberOfEmployees: account.employees,
        Description: account.description
      };

      const response = await this.client.post(`/services/data/${this.apiVersion}/sobjects/Account`, sfAccount);
      return this.getAccount(response.data.id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SF_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create account'
        }
      };
    }
  }

  async updateAccount(id: string, account: Partial<CRMAccount>): Promise<OperationResult<CRMAccount>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const sfAccount = {
        Name: account.name,
        Website: account.website,
        Industry: account.industry,
        Phone: account.phone,
        Description: account.description
      };

      await this.client.patch(`/services/data/${this.apiVersion}/sobjects/Account/${id}`, sfAccount);
      return this.getAccount(id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SF_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update account'
        }
      };
    }
  }

  async getDeals(filters?: CRMSearchFilters): Promise<OperationResult<PaginatedResult<CRMDeal>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const soql = this.buildSOQL('Opportunity', [
        'Id', 'Name', 'Amount', 'CurrencyIsoCode', 'StageName', 'Probability',
        'CloseDate', 'AccountId', 'ContactId', 'OwnerId', 'Description',
        'CreatedDate', 'LastModifiedDate'
      ], filters);

      const response = await this.client.get(`/services/data/${this.apiVersion}/query`, {
        params: { q: soql }
      });

      const deals = response.data.records.map((r: Record<string, unknown>) => ({
        id: r.Id as string,
        name: r.Name as string,
        amount: r.Amount as number || 0,
        currency: r.CurrencyIsoCode as string,
        stage: r.StageName as string,
        probability: r.Probability as number,
        closeDate: r.CloseDate ? new Date(r.CloseDate as string) : undefined,
        accountId: r.AccountId as string,
        contactId: r.ContactId as string,
        ownerId: r.OwnerId as string,
        description: r.Description as string,
        createdAt: new Date(r.CreatedDate as string),
        updatedAt: new Date(r.LastModifiedDate as string)
      }));

      return {
        success: true,
        data: {
          items: deals,
          total: response.data.totalSize,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil(response.data.totalSize / (filters?.pageSize || 100)),
          hasNext: !response.data.done,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SF_DEALS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get deals'
        }
      };
    }
  }

  async getDeal(id: string): Promise<OperationResult<CRMDeal>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/services/data/${this.apiVersion}/sobjects/Opportunity/${id}`);
      const r = response.data;
      return {
        success: true,
        data: {
          id: r.Id,
          name: r.Name,
          amount: r.Amount || 0,
          currency: r.CurrencyIsoCode,
          stage: r.StageName,
          probability: r.Probability,
          closeDate: r.CloseDate ? new Date(r.CloseDate) : undefined,
          accountId: r.AccountId,
          contactId: r.ContactId,
          ownerId: r.OwnerId,
          description: r.Description,
          createdAt: new Date(r.CreatedDate),
          updatedAt: new Date(r.LastModifiedDate)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SF_DEAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get deal'
        }
      };
    }
  }

  async createDeal(deal: Partial<CRMDeal>): Promise<OperationResult<CRMDeal>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const sfOpp = {
        Name: deal.name,
        Amount: deal.amount,
        StageName: deal.stage,
        Probability: deal.probability,
        CloseDate: deal.closeDate?.toISOString().split('T')[0],
        AccountId: deal.accountId,
        Description: deal.description
      };

      const response = await this.client.post(`/services/data/${this.apiVersion}/sobjects/Opportunity`, sfOpp);
      return this.getDeal(response.data.id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SF_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create deal'
        }
      };
    }
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<OperationResult<CRMDeal>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const sfOpp = {
        Name: deal.name,
        Amount: deal.amount,
        StageName: deal.stage,
        Probability: deal.probability,
        CloseDate: deal.closeDate?.toISOString().split('T')[0],
        Description: deal.description
      };

      await this.client.patch(`/services/data/${this.apiVersion}/sobjects/Opportunity/${id}`, sfOpp);
      return this.getDeal(id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SF_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update deal'
        }
      };
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const response = await axios.post('https://login.salesforce.com/services/oauth2/token', null, {
        params: {
          grant_type: 'refresh_token',
          client_id: this.credentials?.clientId,
          client_secret: this.credentials?.clientSecret,
          refresh_token: this.credentials?.refreshToken
        }
      });
      return response.data.access_token;
    } catch {
      return null;
    }
  }

  private buildSOQL(object: string, fields: string[], filters?: CRMSearchFilters): string {
    let soql = `SELECT ${fields.join(', ')} FROM ${object}`;
    const conditions: string[] = [];

    if (filters?.query) {
      conditions.push(`Name LIKE '%${filters.query}%'`);
    }
    if (filters?.ownerId) {
      conditions.push(`OwnerId = '${filters.ownerId}'`);
    }
    if (filters?.createdAfter) {
      conditions.push(`CreatedDate >= ${filters.createdAfter.toISOString()}`);
    }
    if (filters?.createdBefore) {
      conditions.push(`CreatedDate <= ${filters.createdBefore.toISOString()}`);
    }

    if (conditions.length > 0) {
      soql += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (filters?.sortBy) {
      soql += ` ORDER BY ${filters.sortBy} ${filters.sortOrder?.toUpperCase() || 'ASC'}`;
    }

    const limit = filters?.pageSize || 100;
    const offset = ((filters?.page || 1) - 1) * limit;
    soql += ` LIMIT ${limit} OFFSET ${offset}`;

    return soql;
  }

  private mapSalesforceToContact(sf: Record<string, unknown>): CRMContact {
    return {
      id: sf.Id as string,
      firstName: sf.FirstName as string || '',
      lastName: sf.LastName as string || '',
      email: sf.Email as string || '',
      phone: sf.Phone as string,
      mobile: sf.MobilePhone as string,
      company: (sf.Account as Record<string, unknown>)?.Name as string,
      jobTitle: sf.Title as string,
      address: {
        street: sf.MailingStreet as string,
        city: sf.MailingCity as string,
        state: sf.MailingState as string,
        postalCode: sf.MailingPostalCode as string,
        country: sf.MailingCountry as string
      },
      createdAt: new Date(sf.CreatedDate as string),
      updatedAt: new Date(sf.LastModifiedDate as string),
      ownerId: sf.OwnerId as string
    };
  }

  private mapSalesforceToAccount(sf: Record<string, unknown>): CRMAccount {
    return {
      id: sf.Id as string,
      name: sf.Name as string || '',
      website: sf.Website as string,
      industry: sf.Industry as string,
      phone: sf.Phone as string,
      address: {
        street: sf.BillingStreet as string,
        city: sf.BillingCity as string,
        state: sf.BillingState as string,
        postalCode: sf.BillingPostalCode as string,
        country: sf.BillingCountry as string
      },
      annualRevenue: sf.AnnualRevenue as number,
      employees: sf.NumberOfEmployees as number,
      description: sf.Description as string,
      createdAt: new Date(sf.CreatedDate as string),
      updatedAt: new Date(sf.LastModifiedDate as string),
      ownerId: sf.OwnerId as string
    };
  }

  private mapContactToSalesforce(contact: Partial<CRMContact>): Record<string, unknown> {
    return {
      FirstName: contact.firstName,
      LastName: contact.lastName,
      Email: contact.email,
      Phone: contact.phone,
      MobilePhone: contact.mobile,
      Title: contact.jobTitle,
      MailingStreet: contact.address?.street,
      MailingCity: contact.address?.city,
      MailingState: contact.address?.state,
      MailingPostalCode: contact.address?.postalCode,
      MailingCountry: contact.address?.country
    };
  }
}

// ============================================
// HUBSPOT CONNECTOR
// ============================================

/**
 * Conector HubSpot
 */
export class HubSpotConnector extends BaseCRMConnector {
  constructor() {
    super({
      type: IntegrationType.CRM_HUBSPOT,
      name: 'HubSpot CRM Connector',
      version: '3',
      endpoints: [
        { name: 'getContacts', path: '/crm/v3/objects/contacts', method: 'GET', description: 'Get contacts' },
        { name: 'getContact', path: '/crm/v3/objects/contacts/{id}', method: 'GET', description: 'Get contact' },
        { name: 'createContact', path: '/crm/v3/objects/contacts', method: 'POST', description: 'Create contact' },
        { name: 'updateContact', path: '/crm/v3/objects/contacts/{id}', method: 'PATCH', description: 'Update contact' },
        { name: 'deleteContact', path: '/crm/v3/objects/contacts/{id}', method: 'DELETE', description: 'Delete contact' },
        { name: 'getCompanies', path: '/crm/v3/objects/companies', method: 'GET', description: 'Get companies' },
        { name: 'getDeals', path: '/crm/v3/objects/deals', method: 'GET', description: 'Get deals' },
        { name: 'search', path: '/crm/v3/objects/{objectType}/search', method: 'POST', description: 'Search objects' }
      ],
      authentication: [AuthType.API_KEY, AuthType.OAUTH2],
      rateLimits: { requests: 100, period: 10 },
      features: ['contacts', 'companies', 'deals', 'tickets', 'activities', 'pipelines'],
      documentation: 'https://developers.hubspot.com/docs/api/overview'
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (credentials.authType === AuthType.API_KEY) {
      headers['Authorization'] = `Bearer ${credentials.apiKey}`;
    } else if (credentials.accessToken) {
      headers['Authorization'] = `Bearer ${credentials.accessToken}`;
    }

    this.client = axios.create({
      baseURL: 'https://api.hubapi.com',
      timeout: 30000,
      headers
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.get('/crm/v3/objects/contacts', { params: { limit: 1 } });
      return true;
    } catch {
      return false;
    }
  }

  async getContacts(filters?: CRMSearchFilters): Promise<OperationResult<PaginatedResult<CRMContact>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const properties = ['firstname', 'lastname', 'email', 'phone', 'mobilephone', 'company', 'jobtitle',
        'address', 'city', 'state', 'zip', 'country', 'createdate', 'lastmodifieddate', 'hubspot_owner_id'];

      const response = await this.client.get('/crm/v3/objects/contacts', {
        params: {
          limit: filters?.pageSize || 100,
          after: filters?.page && filters.page > 1 ? ((filters.page - 1) * (filters.pageSize || 100)).toString() : undefined,
          properties: properties.join(',')
        }
      });

      const contacts = response.data.results.map(this.mapHubSpotToContact);

      return {
        success: true,
        data: {
          items: contacts,
          total: response.data.total || contacts.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data.total || contacts.length) / (filters?.pageSize || 100)),
          hasNext: !!response.data.paging?.next,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HS_CONTACTS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get contacts'
        }
      };
    }
  }

  async getContact(id: string): Promise<OperationResult<CRMContact>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const properties = ['firstname', 'lastname', 'email', 'phone', 'mobilephone', 'company', 'jobtitle',
        'address', 'city', 'state', 'zip', 'country', 'createdate', 'lastmodifieddate', 'hubspot_owner_id'];

      const response = await this.client.get(`/crm/v3/objects/contacts/${id}`, {
        params: { properties: properties.join(',') }
      });

      return { success: true, data: this.mapHubSpotToContact(response.data) };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HS_CONTACT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get contact'
        }
      };
    }
  }

  async createContact(contact: Partial<CRMContact>): Promise<OperationResult<CRMContact>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const properties = {
        firstname: contact.firstName,
        lastname: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        mobilephone: contact.mobile,
        company: contact.company,
        jobtitle: contact.jobTitle,
        address: contact.address?.street,
        city: contact.address?.city,
        state: contact.address?.state,
        zip: contact.address?.postalCode,
        country: contact.address?.country
      };

      const response = await this.client.post('/crm/v3/objects/contacts', { properties });
      return this.getContact(response.data.id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HS_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create contact'
        }
      };
    }
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<OperationResult<CRMContact>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const properties: Record<string, unknown> = {};
      if (contact.firstName) properties.firstname = contact.firstName;
      if (contact.lastName) properties.lastname = contact.lastName;
      if (contact.email) properties.email = contact.email;
      if (contact.phone) properties.phone = contact.phone;
      if (contact.mobile) properties.mobilephone = contact.mobile;
      if (contact.company) properties.company = contact.company;
      if (contact.jobTitle) properties.jobtitle = contact.jobTitle;

      await this.client.patch(`/crm/v3/objects/contacts/${id}`, { properties });
      return this.getContact(id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HS_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update contact'
        }
      };
    }
  }

  async deleteContact(id: string): Promise<OperationResult<void>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      await this.client.delete(`/crm/v3/objects/contacts/${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HS_DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete contact'
        }
      };
    }
  }

  async getAccounts(filters?: CRMSearchFilters): Promise<OperationResult<PaginatedResult<CRMAccount>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const properties = ['name', 'website', 'industry', 'phone', 'address', 'city', 'state', 'zip',
        'country', 'annualrevenue', 'numberofemployees', 'description', 'createdate', 'lastmodifieddate', 'hubspot_owner_id'];

      const response = await this.client.get('/crm/v3/objects/companies', {
        params: {
          limit: filters?.pageSize || 100,
          properties: properties.join(',')
        }
      });

      const accounts = response.data.results.map(this.mapHubSpotToAccount);

      return {
        success: true,
        data: {
          items: accounts,
          total: response.data.total || accounts.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data.total || accounts.length) / (filters?.pageSize || 100)),
          hasNext: !!response.data.paging?.next,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HS_ACCOUNTS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get accounts'
        }
      };
    }
  }

  async getAccount(id: string): Promise<OperationResult<CRMAccount>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/crm/v3/objects/companies/${id}`);
      return { success: true, data: this.mapHubSpotToAccount(response.data) };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HS_ACCOUNT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get account'
        }
      };
    }
  }

  async createAccount(account: Partial<CRMAccount>): Promise<OperationResult<CRMAccount>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const properties = {
        name: account.name,
        website: account.website,
        industry: account.industry,
        phone: account.phone,
        annualrevenue: account.annualRevenue,
        numberofemployees: account.employees,
        description: account.description
      };

      const response = await this.client.post('/crm/v3/objects/companies', { properties });
      return this.getAccount(response.data.id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HS_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create account'
        }
      };
    }
  }

  async updateAccount(id: string, account: Partial<CRMAccount>): Promise<OperationResult<CRMAccount>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const properties: Record<string, unknown> = {};
      if (account.name) properties.name = account.name;
      if (account.website) properties.website = account.website;
      if (account.industry) properties.industry = account.industry;
      if (account.phone) properties.phone = account.phone;
      if (account.description) properties.description = account.description;

      await this.client.patch(`/crm/v3/objects/companies/${id}`, { properties });
      return this.getAccount(id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HS_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update account'
        }
      };
    }
  }

  async getDeals(filters?: CRMSearchFilters): Promise<OperationResult<PaginatedResult<CRMDeal>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const properties = ['dealname', 'amount', 'dealstage', 'closedate', 'hubspot_owner_id', 'description',
        'createdate', 'lastmodifieddate'];

      const response = await this.client.get('/crm/v3/objects/deals', {
        params: {
          limit: filters?.pageSize || 100,
          properties: properties.join(',')
        }
      });

      const deals = response.data.results.map((r: Record<string, unknown>) => {
        const props = r.properties as Record<string, unknown>;
        return {
          id: r.id as string,
          name: props.dealname as string || '',
          amount: parseFloat(props.amount as string) || 0,
          stage: props.dealstage as string || '',
          closeDate: props.closedate ? new Date(props.closedate as string) : undefined,
          ownerId: props.hubspot_owner_id as string,
          description: props.description as string,
          createdAt: new Date(props.createdate as string),
          updatedAt: new Date(props.lastmodifieddate as string)
        };
      });

      return {
        success: true,
        data: {
          items: deals,
          total: response.data.total || deals.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data.total || deals.length) / (filters?.pageSize || 100)),
          hasNext: !!response.data.paging?.next,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HS_DEALS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get deals'
        }
      };
    }
  }

  async getDeal(id: string): Promise<OperationResult<CRMDeal>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/crm/v3/objects/deals/${id}`);
      const props = response.data.properties;
      return {
        success: true,
        data: {
          id: response.data.id,
          name: props.dealname || '',
          amount: parseFloat(props.amount) || 0,
          stage: props.dealstage || '',
          closeDate: props.closedate ? new Date(props.closedate) : undefined,
          ownerId: props.hubspot_owner_id,
          description: props.description,
          createdAt: new Date(props.createdate),
          updatedAt: new Date(props.lastmodifieddate)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HS_DEAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get deal'
        }
      };
    }
  }

  async createDeal(deal: Partial<CRMDeal>): Promise<OperationResult<CRMDeal>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const properties = {
        dealname: deal.name,
        amount: deal.amount?.toString(),
        dealstage: deal.stage,
        closedate: deal.closeDate?.toISOString(),
        description: deal.description
      };

      const response = await this.client.post('/crm/v3/objects/deals', { properties });
      return this.getDeal(response.data.id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HS_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create deal'
        }
      };
    }
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<OperationResult<CRMDeal>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const properties: Record<string, unknown> = {};
      if (deal.name) properties.dealname = deal.name;
      if (deal.amount !== undefined) properties.amount = deal.amount.toString();
      if (deal.stage) properties.dealstage = deal.stage;
      if (deal.closeDate) properties.closedate = deal.closeDate.toISOString();

      await this.client.patch(`/crm/v3/objects/deals/${id}`, { properties });
      return this.getDeal(id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HS_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update deal'
        }
      };
    }
  }

  private mapHubSpotToContact(hs: Record<string, unknown>): CRMContact {
    const props = hs.properties as Record<string, unknown>;
    return {
      id: hs.id as string,
      firstName: props.firstname as string || '',
      lastName: props.lastname as string || '',
      email: props.email as string || '',
      phone: props.phone as string,
      mobile: props.mobilephone as string,
      company: props.company as string,
      jobTitle: props.jobtitle as string,
      address: {
        street: props.address as string,
        city: props.city as string,
        state: props.state as string,
        postalCode: props.zip as string,
        country: props.country as string
      },
      createdAt: new Date(props.createdate as string),
      updatedAt: new Date(props.lastmodifieddate as string),
      ownerId: props.hubspot_owner_id as string
    };
  }

  private mapHubSpotToAccount(hs: Record<string, unknown>): CRMAccount {
    const props = hs.properties as Record<string, unknown>;
    return {
      id: hs.id as string,
      name: props.name as string || '',
      website: props.website as string,
      industry: props.industry as string,
      phone: props.phone as string,
      address: {
        street: props.address as string,
        city: props.city as string,
        state: props.state as string,
        postalCode: props.zip as string,
        country: props.country as string
      },
      annualRevenue: props.annualrevenue ? parseFloat(props.annualrevenue as string) : undefined,
      employees: props.numberofemployees ? parseInt(props.numberofemployees as string) : undefined,
      description: props.description as string,
      createdAt: new Date(props.createdate as string),
      updatedAt: new Date(props.lastmodifieddate as string),
      ownerId: props.hubspot_owner_id as string
    };
  }
}

// ============================================
// ZOHO CRM CONNECTOR
// ============================================

/**
 * Conector Zoho CRM
 */
export class ZohoCRMConnector extends BaseCRMConnector {
  constructor() {
    super({
      type: IntegrationType.CRM_ZOHO,
      name: 'Zoho CRM Connector',
      version: '2',
      endpoints: [
        { name: 'getContacts', path: '/crm/v2/Contacts', method: 'GET', description: 'Get contacts' },
        { name: 'getAccounts', path: '/crm/v2/Accounts', method: 'GET', description: 'Get accounts' },
        { name: 'getDeals', path: '/crm/v2/Deals', method: 'GET', description: 'Get deals' },
        { name: 'search', path: '/crm/v2/{module}/search', method: 'GET', description: 'Search records' }
      ],
      authentication: [AuthType.OAUTH2],
      rateLimits: { requests: 100, period: 60 },
      features: ['contacts', 'accounts', 'deals', 'leads', 'activities'],
      documentation: 'https://www.zoho.com/crm/developer/docs/api/v2/'
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;

    this.client = axios.create({
      baseURL: 'https://www.zohoapis.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Zoho-oauthtoken ${credentials.accessToken}`
      }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.get('/crm/v2/Contacts', { params: { per_page: 1 } });
      return true;
    } catch {
      return false;
    }
  }

  async getContacts(filters?: CRMSearchFilters): Promise<OperationResult<PaginatedResult<CRMContact>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.get('/crm/v2/Contacts', {
        params: {
          per_page: filters?.pageSize || 100,
          page: filters?.page || 1
        }
      });

      const contacts = (response.data.data || []).map((z: Record<string, unknown>) => ({
        id: z.id as string,
        firstName: z.First_Name as string || '',
        lastName: z.Last_Name as string || '',
        email: z.Email as string || '',
        phone: z.Phone as string,
        mobile: z.Mobile as string,
        company: (z.Account_Name as Record<string, unknown>)?.name as string,
        jobTitle: z.Title as string,
        createdAt: new Date(z.Created_Time as string),
        updatedAt: new Date(z.Modified_Time as string),
        ownerId: (z.Owner as Record<string, unknown>)?.id as string
      }));

      return {
        success: true,
        data: {
          items: contacts,
          total: response.data.info?.count || contacts.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data.info?.count || contacts.length) / (filters?.pageSize || 100)),
          hasNext: response.data.info?.more_records || false,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ZOHO_CONTACTS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get contacts'
        }
      };
    }
  }

  async getContact(id: string): Promise<OperationResult<CRMContact>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/crm/v2/Contacts/${id}`);
      const z = response.data.data[0];
      return {
        success: true,
        data: {
          id: z.id,
          firstName: z.First_Name || '',
          lastName: z.Last_Name || '',
          email: z.Email || '',
          phone: z.Phone,
          mobile: z.Mobile,
          company: z.Account_Name?.name,
          jobTitle: z.Title,
          createdAt: new Date(z.Created_Time),
          updatedAt: new Date(z.Modified_Time),
          ownerId: z.Owner?.id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ZOHO_CONTACT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get contact'
        }
      };
    }
  }

  async createContact(contact: Partial<CRMContact>): Promise<OperationResult<CRMContact>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const data = {
        First_Name: contact.firstName,
        Last_Name: contact.lastName,
        Email: contact.email,
        Phone: contact.phone,
        Mobile: contact.mobile,
        Title: contact.jobTitle
      };

      const response = await this.client.post('/crm/v2/Contacts', { data: [data] });
      return this.getContact(response.data.data[0].details.id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ZOHO_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create contact'
        }
      };
    }
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<OperationResult<CRMContact>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const data: Record<string, unknown> = { id };
      if (contact.firstName) data.First_Name = contact.firstName;
      if (contact.lastName) data.Last_Name = contact.lastName;
      if (contact.email) data.Email = contact.email;
      if (contact.phone) data.Phone = contact.phone;

      await this.client.put('/crm/v2/Contacts', { data: [data] });
      return this.getContact(id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ZOHO_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update contact'
        }
      };
    }
  }

  async deleteContact(id: string): Promise<OperationResult<void>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      await this.client.delete(`/crm/v2/Contacts/${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ZOHO_DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete contact'
        }
      };
    }
  }

  async getAccounts(filters?: CRMSearchFilters): Promise<OperationResult<PaginatedResult<CRMAccount>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.get('/crm/v2/Accounts', {
        params: { per_page: filters?.pageSize || 100, page: filters?.page || 1 }
      });

      const accounts = (response.data.data || []).map((z: Record<string, unknown>) => ({
        id: z.id as string,
        name: z.Account_Name as string || '',
        website: z.Website as string,
        industry: z.Industry as string,
        phone: z.Phone as string,
        annualRevenue: z.Annual_Revenue as number,
        employees: z.Employees as number,
        description: z.Description as string,
        createdAt: new Date(z.Created_Time as string),
        updatedAt: new Date(z.Modified_Time as string),
        ownerId: (z.Owner as Record<string, unknown>)?.id as string
      }));

      return {
        success: true,
        data: {
          items: accounts,
          total: response.data.info?.count || accounts.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data.info?.count || accounts.length) / (filters?.pageSize || 100)),
          hasNext: response.data.info?.more_records || false,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ZOHO_ACCOUNTS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get accounts'
        }
      };
    }
  }

  async getAccount(id: string): Promise<OperationResult<CRMAccount>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/crm/v2/Accounts/${id}`);
      const z = response.data.data[0];
      return {
        success: true,
        data: {
          id: z.id,
          name: z.Account_Name || '',
          website: z.Website,
          industry: z.Industry,
          phone: z.Phone,
          annualRevenue: z.Annual_Revenue,
          employees: z.Employees,
          description: z.Description,
          createdAt: new Date(z.Created_Time),
          updatedAt: new Date(z.Modified_Time),
          ownerId: z.Owner?.id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ZOHO_ACCOUNT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get account'
        }
      };
    }
  }

  async createAccount(account: Partial<CRMAccount>): Promise<OperationResult<CRMAccount>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const data = {
        Account_Name: account.name,
        Website: account.website,
        Industry: account.industry,
        Phone: account.phone,
        Description: account.description
      };

      const response = await this.client.post('/crm/v2/Accounts', { data: [data] });
      return this.getAccount(response.data.data[0].details.id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ZOHO_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create account'
        }
      };
    }
  }

  async updateAccount(id: string, account: Partial<CRMAccount>): Promise<OperationResult<CRMAccount>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const data: Record<string, unknown> = { id };
      if (account.name) data.Account_Name = account.name;
      if (account.website) data.Website = account.website;
      if (account.industry) data.Industry = account.industry;

      await this.client.put('/crm/v2/Accounts', { data: [data] });
      return this.getAccount(id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ZOHO_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update account'
        }
      };
    }
  }

  async getDeals(filters?: CRMSearchFilters): Promise<OperationResult<PaginatedResult<CRMDeal>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.get('/crm/v2/Deals', {
        params: { per_page: filters?.pageSize || 100, page: filters?.page || 1 }
      });

      const deals = (response.data.data || []).map((z: Record<string, unknown>) => ({
        id: z.id as string,
        name: z.Deal_Name as string || '',
        amount: z.Amount as number || 0,
        stage: z.Stage as string || '',
        probability: z.Probability as number,
        closeDate: z.Closing_Date ? new Date(z.Closing_Date as string) : undefined,
        accountId: (z.Account_Name as Record<string, unknown>)?.id as string,
        contactId: (z.Contact_Name as Record<string, unknown>)?.id as string,
        ownerId: (z.Owner as Record<string, unknown>)?.id as string,
        description: z.Description as string,
        createdAt: new Date(z.Created_Time as string),
        updatedAt: new Date(z.Modified_Time as string)
      }));

      return {
        success: true,
        data: {
          items: deals,
          total: response.data.info?.count || deals.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data.info?.count || deals.length) / (filters?.pageSize || 100)),
          hasNext: response.data.info?.more_records || false,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ZOHO_DEALS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get deals'
        }
      };
    }
  }

  async getDeal(id: string): Promise<OperationResult<CRMDeal>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/crm/v2/Deals/${id}`);
      const z = response.data.data[0];
      return {
        success: true,
        data: {
          id: z.id,
          name: z.Deal_Name || '',
          amount: z.Amount || 0,
          stage: z.Stage || '',
          probability: z.Probability,
          closeDate: z.Closing_Date ? new Date(z.Closing_Date) : undefined,
          accountId: z.Account_Name?.id,
          contactId: z.Contact_Name?.id,
          ownerId: z.Owner?.id,
          description: z.Description,
          createdAt: new Date(z.Created_Time),
          updatedAt: new Date(z.Modified_Time)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ZOHO_DEAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get deal'
        }
      };
    }
  }

  async createDeal(deal: Partial<CRMDeal>): Promise<OperationResult<CRMDeal>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const data = {
        Deal_Name: deal.name,
        Amount: deal.amount,
        Stage: deal.stage,
        Closing_Date: deal.closeDate?.toISOString().split('T')[0],
        Description: deal.description
      };

      const response = await this.client.post('/crm/v2/Deals', { data: [data] });
      return this.getDeal(response.data.data[0].details.id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ZOHO_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create deal'
        }
      };
    }
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<OperationResult<CRMDeal>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const data: Record<string, unknown> = { id };
      if (deal.name) data.Deal_Name = deal.name;
      if (deal.amount !== undefined) data.Amount = deal.amount;
      if (deal.stage) data.Stage = deal.stage;

      await this.client.put('/crm/v2/Deals', { data: [data] });
      return this.getDeal(id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ZOHO_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update deal'
        }
      };
    }
  }
}

// ============================================
// PIPEDRIVE CONNECTOR
// ============================================

/**
 * Conector Pipedrive
 */
export class PipedriveConnector extends BaseCRMConnector {
  constructor() {
    super({
      type: IntegrationType.CRM_PIPEDRIVE,
      name: 'Pipedrive CRM Connector',
      version: '1',
      endpoints: [
        { name: 'getPersons', path: '/v1/persons', method: 'GET', description: 'Get persons' },
        { name: 'getOrganizations', path: '/v1/organizations', method: 'GET', description: 'Get organizations' },
        { name: 'getDeals', path: '/v1/deals', method: 'GET', description: 'Get deals' },
        { name: 'search', path: '/v1/itemSearch', method: 'GET', description: 'Search items' }
      ],
      authentication: [AuthType.API_KEY, AuthType.OAUTH2],
      rateLimits: { requests: 100, period: 10 },
      features: ['persons', 'organizations', 'deals', 'activities', 'pipelines'],
      documentation: 'https://developers.pipedrive.com/docs/api/v1'
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;

    this.client = axios.create({
      baseURL: 'https://api.pipedrive.com',
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
      params: { api_token: credentials.apiKey }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.get('/v1/users/me');
      return true;
    } catch {
      return false;
    }
  }

  async getContacts(filters?: CRMSearchFilters): Promise<OperationResult<PaginatedResult<CRMContact>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.get('/v1/persons', {
        params: {
          limit: filters?.pageSize || 100,
          start: ((filters?.page || 1) - 1) * (filters?.pageSize || 100)
        }
      });

      const contacts = (response.data.data || []).map((p: Record<string, unknown>) => ({
        id: String(p.id),
        firstName: (p.first_name as string) || (p.name as string)?.split(' ')[0] || '',
        lastName: (p.last_name as string) || (p.name as string)?.split(' ').slice(1).join(' ') || '',
        email: ((p.email as Array<Record<string, unknown>>)?.[0]?.value as string) || '',
        phone: ((p.phone as Array<Record<string, unknown>>)?.[0]?.value as string),
        company: (p.org_name as string),
        createdAt: new Date(p.add_time as string),
        updatedAt: new Date(p.update_time as string),
        ownerId: String(p.owner_id)
      }));

      return {
        success: true,
        data: {
          items: contacts,
          total: response.data.additional_data?.pagination?.total_count || contacts.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data.additional_data?.pagination?.total_count || contacts.length) / (filters?.pageSize || 100)),
          hasNext: response.data.additional_data?.pagination?.more_items_in_collection || false,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PD_CONTACTS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get contacts'
        }
      };
    }
  }

  async getContact(id: string): Promise<OperationResult<CRMContact>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/v1/persons/${id}`);
      const p = response.data.data;
      return {
        success: true,
        data: {
          id: String(p.id),
          firstName: p.first_name || p.name?.split(' ')[0] || '',
          lastName: p.last_name || p.name?.split(' ').slice(1).join(' ') || '',
          email: p.email?.[0]?.value || '',
          phone: p.phone?.[0]?.value,
          company: p.org_name,
          createdAt: new Date(p.add_time),
          updatedAt: new Date(p.update_time),
          ownerId: String(p.owner_id)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PD_CONTACT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get contact'
        }
      };
    }
  }

  async createContact(contact: Partial<CRMContact>): Promise<OperationResult<CRMContact>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const data = {
        name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
        email: contact.email ? [{ value: contact.email, primary: true }] : undefined,
        phone: contact.phone ? [{ value: contact.phone, primary: true }] : undefined
      };

      const response = await this.client.post('/v1/persons', data);
      return this.getContact(String(response.data.data.id));
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PD_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create contact'
        }
      };
    }
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<OperationResult<CRMContact>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const data: Record<string, unknown> = {};
      if (contact.firstName || contact.lastName) {
        data.name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      }
      if (contact.email) data.email = [{ value: contact.email, primary: true }];
      if (contact.phone) data.phone = [{ value: contact.phone, primary: true }];

      await this.client.put(`/v1/persons/${id}`, data);
      return this.getContact(id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PD_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update contact'
        }
      };
    }
  }

  async deleteContact(id: string): Promise<OperationResult<void>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      await this.client.delete(`/v1/persons/${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PD_DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete contact'
        }
      };
    }
  }

  async getAccounts(filters?: CRMSearchFilters): Promise<OperationResult<PaginatedResult<CRMAccount>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.get('/v1/organizations', {
        params: {
          limit: filters?.pageSize || 100,
          start: ((filters?.page || 1) - 1) * (filters?.pageSize || 100)
        }
      });

      const accounts = (response.data.data || []).map((o: Record<string, unknown>) => ({
        id: String(o.id),
        name: o.name as string || '',
        address: { street: o.address as string },
        createdAt: new Date(o.add_time as string),
        updatedAt: new Date(o.update_time as string),
        ownerId: String(o.owner_id)
      }));

      return {
        success: true,
        data: {
          items: accounts,
          total: response.data.additional_data?.pagination?.total_count || accounts.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data.additional_data?.pagination?.total_count || accounts.length) / (filters?.pageSize || 100)),
          hasNext: response.data.additional_data?.pagination?.more_items_in_collection || false,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PD_ACCOUNTS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get accounts'
        }
      };
    }
  }

  async getAccount(id: string): Promise<OperationResult<CRMAccount>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/v1/organizations/${id}`);
      const o = response.data.data;
      return {
        success: true,
        data: {
          id: String(o.id),
          name: o.name || '',
          address: { street: o.address },
          createdAt: new Date(o.add_time),
          updatedAt: new Date(o.update_time),
          ownerId: String(o.owner_id)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PD_ACCOUNT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get account'
        }
      };
    }
  }

  async createAccount(account: Partial<CRMAccount>): Promise<OperationResult<CRMAccount>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.post('/v1/organizations', { name: account.name, address: account.address?.street });
      return this.getAccount(String(response.data.data.id));
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PD_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create account'
        }
      };
    }
  }

  async updateAccount(id: string, account: Partial<CRMAccount>): Promise<OperationResult<CRMAccount>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      await this.client.put(`/v1/organizations/${id}`, { name: account.name });
      return this.getAccount(id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PD_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update account'
        }
      };
    }
  }

  async getDeals(filters?: CRMSearchFilters): Promise<OperationResult<PaginatedResult<CRMDeal>>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const response = await this.client.get('/v1/deals', {
        params: {
          limit: filters?.pageSize || 100,
          start: ((filters?.page || 1) - 1) * (filters?.pageSize || 100)
        }
      });

      const deals = (response.data.data || []).map((d: Record<string, unknown>) => ({
        id: String(d.id),
        name: d.title as string || '',
        amount: d.value as number || 0,
        currency: d.currency as string,
        stage: d.stage_id ? String(d.stage_id) : '',
        probability: d.probability as number,
        closeDate: d.expected_close_date ? new Date(d.expected_close_date as string) : undefined,
        accountId: d.org_id ? String(d.org_id) : undefined,
        contactId: d.person_id ? String(d.person_id) : undefined,
        ownerId: String(d.user_id),
        createdAt: new Date(d.add_time as string),
        updatedAt: new Date(d.update_time as string)
      }));

      return {
        success: true,
        data: {
          items: deals,
          total: response.data.additional_data?.pagination?.total_count || deals.length,
          page: filters?.page || 1,
          pageSize: filters?.pageSize || 100,
          totalPages: Math.ceil((response.data.additional_data?.pagination?.total_count || deals.length) / (filters?.pageSize || 100)),
          hasNext: response.data.additional_data?.pagination?.more_items_in_collection || false,
          hasPrevious: (filters?.page || 1) > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PD_DEALS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get deals'
        }
      };
    }
  }

  async getDeal(id: string): Promise<OperationResult<CRMDeal>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/v1/deals/${id}`);
      const d = response.data.data;
      return {
        success: true,
        data: {
          id: String(d.id),
          name: d.title || '',
          amount: d.value || 0,
          currency: d.currency,
          stage: d.stage_id ? String(d.stage_id) : '',
          probability: d.probability,
          closeDate: d.expected_close_date ? new Date(d.expected_close_date) : undefined,
          accountId: d.org_id ? String(d.org_id) : undefined,
          contactId: d.person_id ? String(d.person_id) : undefined,
          ownerId: String(d.user_id),
          createdAt: new Date(d.add_time),
          updatedAt: new Date(d.update_time)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PD_DEAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get deal'
        }
      };
    }
  }

  async createDeal(deal: Partial<CRMDeal>): Promise<OperationResult<CRMDeal>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const data = {
        title: deal.name,
        value: deal.amount,
        currency: deal.currency || 'EUR',
        stage_id: deal.stage ? parseInt(deal.stage) : undefined,
        expected_close_date: deal.closeDate?.toISOString().split('T')[0]
      };

      const response = await this.client.post('/v1/deals', data);
      return this.getDeal(String(response.data.data.id));
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PD_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create deal'
        }
      };
    }
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<OperationResult<CRMDeal>> {
    try {
      if (!this.client) throw new Error('Not initialized');

      const data: Record<string, unknown> = {};
      if (deal.name) data.title = deal.name;
      if (deal.amount !== undefined) data.value = deal.amount;
      if (deal.stage) data.stage_id = parseInt(deal.stage);

      await this.client.put(`/v1/deals/${id}`, data);
      return this.getDeal(id);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PD_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update deal'
        }
      };
    }
  }
}

// ============================================
// FACTORY
// ============================================

/**
 * Factory para crear conectores CRM
 */
export function createCRMConnector(type: IntegrationType): BaseCRMConnector {
  switch (type) {
    case IntegrationType.CRM_SALESFORCE:
      return new SalesforceConnector();
    case IntegrationType.CRM_HUBSPOT:
      return new HubSpotConnector();
    case IntegrationType.CRM_ZOHO:
      return new ZohoCRMConnector();
    case IntegrationType.CRM_PIPEDRIVE:
      return new PipedriveConnector();
    default:
      throw new Error(`Unsupported CRM connector type: ${type}`);
  }
}

export {
  BaseCRMConnector,
  SalesforceConnector,
  HubSpotConnector,
  ZohoCRMConnector,
  PipedriveConnector
};
