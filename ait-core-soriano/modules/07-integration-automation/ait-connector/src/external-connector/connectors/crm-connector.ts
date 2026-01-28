/**
 * AIT-CONNECTOR - CRM Connectors
 * Connectors for CRM systems (Salesforce, HubSpot, Zoho, Microsoft Dynamics CRM, etc.)
 */

import { BaseConnector } from '../base-connector';
import { ConnectorType, ConnectorConfig, ConnectorCredentials, Logger } from '../../types';
import axios, { AxiosInstance } from 'axios';

/**
 * Salesforce CRM Connector
 */
export class SalesforceConnector extends BaseConnector {
  private client?: AxiosInstance;
  private instanceUrl?: string;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Salesforce', ConnectorType.CRM, 'salesforce', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    this.client = axios.create({
      timeout: this.config.timeout
    });
  }

  protected async onConnect(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    // OAuth2 authentication
    const authUrl = this.config.custom?.sandbox
      ? 'https://test.salesforce.com'
      : 'https://login.salesforce.com';

    const response = await this.client.post(`${authUrl}/services/oauth2/token`, null, {
      params: {
        grant_type: 'password',
        client_id: this.credentials?.clientId,
        client_secret: this.credentials?.clientSecret,
        username: this.credentials?.username,
        password: this.credentials?.password
      }
    });

    this.instanceUrl = response.data.instance_url;
    this.client.defaults.baseURL = this.instanceUrl;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
  }

  protected async onDisconnect(): Promise<void> {
    // Salesforce doesn't require explicit logout for OAuth
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client || !this.instanceUrl) return false;

    try {
      await this.client.get('/services/data/');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'query':
        return this.query(params);
      case 'getAccount':
        return this.getAccount(params);
      case 'createAccount':
        return this.createAccount(params);
      case 'updateAccount':
        return this.updateAccount(params);
      case 'getContact':
        return this.getContact(params);
      case 'createLead':
        return this.createLead(params);
      case 'createOpportunity':
        return this.createOpportunity(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async query(params: { soql: string }): Promise<any> {
    const response = await this.client!.get(`/services/data/v57.0/query`, {
      params: { q: params.soql }
    });
    return response.data;
  }

  private async getAccount(params: { id: string }): Promise<any> {
    const response = await this.client!.get(`/services/data/v57.0/sobjects/Account/${params.id}`);
    return response.data;
  }

  private async createAccount(params: any): Promise<any> {
    const response = await this.client!.post('/services/data/v57.0/sobjects/Account', params);
    return response.data;
  }

  private async updateAccount(params: any): Promise<any> {
    const { id, ...data } = params;
    await this.client!.patch(`/services/data/v57.0/sobjects/Account/${id}`, data);
    return { success: true };
  }

  private async getContact(params: { id: string }): Promise<any> {
    const response = await this.client!.get(`/services/data/v57.0/sobjects/Contact/${params.id}`);
    return response.data;
  }

  private async createLead(params: any): Promise<any> {
    const response = await this.client!.post('/services/data/v57.0/sobjects/Lead', params);
    return response.data;
  }

  private async createOpportunity(params: any): Promise<any> {
    const response = await this.client!.post('/services/data/v57.0/sobjects/Opportunity', params);
    return response.data;
  }
}

/**
 * HubSpot CRM Connector
 */
export class HubSpotConnector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'HubSpot', ConnectorType.CRM, 'hubspot', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    this.client = axios.create({
      baseURL: 'https://api.hubapi.com',
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  protected async onConnect(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    // API Key authentication
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.credentials?.apiKey}`;
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('/oauth/v1/access-tokens/');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'getContacts':
        return this.getContacts(params);
      case 'createContact':
        return this.createContact(params);
      case 'updateContact':
        return this.updateContact(params);
      case 'getCompanies':
        return this.getCompanies(params);
      case 'createCompany':
        return this.createCompany(params);
      case 'getDeals':
        return this.getDeals(params);
      case 'createDeal':
        return this.createDeal(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async getContacts(params: any): Promise<any> {
    const response = await this.client!.get('/crm/v3/objects/contacts', { params });
    return response.data;
  }

  private async createContact(params: any): Promise<any> {
    const response = await this.client!.post('/crm/v3/objects/contacts', { properties: params });
    return response.data;
  }

  private async updateContact(params: any): Promise<any> {
    const { id, ...properties } = params;
    const response = await this.client!.patch(`/crm/v3/objects/contacts/${id}`, { properties });
    return response.data;
  }

  private async getCompanies(params: any): Promise<any> {
    const response = await this.client!.get('/crm/v3/objects/companies', { params });
    return response.data;
  }

  private async createCompany(params: any): Promise<any> {
    const response = await this.client!.post('/crm/v3/objects/companies', { properties: params });
    return response.data;
  }

  private async getDeals(params: any): Promise<any> {
    const response = await this.client!.get('/crm/v3/objects/deals', { params });
    return response.data;
  }

  private async createDeal(params: any): Promise<any> {
    const response = await this.client!.post('/crm/v3/objects/deals', { properties: params });
    return response.data;
  }
}

/**
 * Zoho CRM Connector
 */
export class ZohoCRMConnector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Zoho CRM', ConnectorType.CRM, 'zoho', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    const domain = this.config.custom?.domain || 'com';
    this.client = axios.create({
      baseURL: `https://www.zohoapis.${domain}`,
      timeout: this.config.timeout
    });
  }

  protected async onConnect(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    // OAuth2 token
    this.client.defaults.headers.common['Authorization'] = `Zoho-oauthtoken ${this.credentials?.token}`;
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('/crm/v3/users?type=CurrentUser');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'getRecords':
        return this.getRecords(params);
      case 'createRecord':
        return this.createRecord(params);
      case 'updateRecord':
        return this.updateRecord(params);
      case 'deleteRecord':
        return this.deleteRecord(params);
      case 'searchRecords':
        return this.searchRecords(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async getRecords(params: { module: string; page?: number; per_page?: number }): Promise<any> {
    const response = await this.client!.get(`/crm/v3/${params.module}`, {
      params: { page: params.page || 1, per_page: params.per_page || 200 }
    });
    return response.data;
  }

  private async createRecord(params: { module: string; data: any }): Promise<any> {
    const response = await this.client!.post(`/crm/v3/${params.module}`, { data: [params.data] });
    return response.data;
  }

  private async updateRecord(params: { module: string; id: string; data: any }): Promise<any> {
    const response = await this.client!.put(`/crm/v3/${params.module}/${params.id}`, { data: [params.data] });
    return response.data;
  }

  private async deleteRecord(params: { module: string; id: string }): Promise<any> {
    const response = await this.client!.delete(`/crm/v3/${params.module}/${params.id}`);
    return response.data;
  }

  private async searchRecords(params: { module: string; criteria: string }): Promise<any> {
    const response = await this.client!.get(`/crm/v3/${params.module}/search`, {
      params: { criteria: params.criteria }
    });
    return response.data;
  }
}

/**
 * Pipedrive CRM Connector
 */
export class PipedriveConnector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Pipedrive', ConnectorType.CRM, 'pipedrive', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    const companyDomain = this.config.custom?.companyDomain || 'api';
    this.client = axios.create({
      baseURL: `https://${companyDomain}.pipedrive.com/v1`,
      timeout: this.config.timeout
    });
  }

  protected async onConnect(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    // API token authentication
    this.client.defaults.params = { api_token: this.credentials?.apiKey };
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('/users/me');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'getDeals':
        return this.getDeals(params);
      case 'createDeal':
        return this.createDeal(params);
      case 'getPersons':
        return this.getPersons(params);
      case 'createPerson':
        return this.createPerson(params);
      case 'getOrganizations':
        return this.getOrganizations(params);
      case 'createOrganization':
        return this.createOrganization(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async getDeals(params: any): Promise<any> {
    const response = await this.client!.get('/deals', { params });
    return response.data;
  }

  private async createDeal(params: any): Promise<any> {
    const response = await this.client!.post('/deals', params);
    return response.data;
  }

  private async getPersons(params: any): Promise<any> {
    const response = await this.client!.get('/persons', { params });
    return response.data;
  }

  private async createPerson(params: any): Promise<any> {
    const response = await this.client!.post('/persons', params);
    return response.data;
  }

  private async getOrganizations(params: any): Promise<any> {
    const response = await this.client!.get('/organizations', { params });
    return response.data;
  }

  private async createOrganization(params: any): Promise<any> {
    const response = await this.client!.post('/organizations', params);
    return response.data;
  }
}
