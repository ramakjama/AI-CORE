/**
 * Insurance Companies Connector
 * Conectores para APIs de compañías de seguros españolas
 */

import axios, { AxiosInstance } from 'axios';
import {
  Connector,
  ConnectorConfig,
  ConnectorEndpoint,
  IntegrationCredentials,
  IntegrationType,
  AuthType,
  OperationResult
} from '../types';

/**
 * Interfaz para póliza de seguro
 */
export interface InsurancePolicy {
  policyNumber: string;
  productCode: string;
  productName: string;
  holderNIF: string;
  holderName: string;
  startDate: Date;
  endDate: Date;
  premium: number;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  coverages: InsuranceCoverage[];
  insuredObjects?: InsuredObject[];
}

/**
 * Interfaz para cobertura
 */
export interface InsuranceCoverage {
  code: string;
  name: string;
  sumInsured: number;
  deductible?: number;
  premium: number;
}

/**
 * Interfaz para objeto asegurado
 */
export interface InsuredObject {
  type: string;
  description: string;
  value?: number;
  details?: Record<string, unknown>;
}

/**
 * Interfaz para siniestro
 */
export interface InsuranceClaim {
  claimNumber: string;
  policyNumber: string;
  dateOfLoss: Date;
  reportDate: Date;
  status: 'open' | 'in_progress' | 'closed' | 'rejected';
  description: string;
  claimAmount?: number;
  paidAmount?: number;
  coverageCode: string;
}

/**
 * Interfaz para recibo
 */
export interface InsuranceReceipt {
  receiptNumber: string;
  policyNumber: string;
  dueDate: Date;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentDate?: Date;
  paymentMethod?: string;
}

/**
 * Configuración base para conectores de seguros
 */
const baseInsuranceConfig: Partial<ConnectorConfig> = {
  version: '1.0.0',
  authentication: [AuthType.API_KEY, AuthType.OAUTH2, AuthType.CERTIFICATE],
  rateLimits: {
    requests: 100,
    period: 60
  },
  retryPolicy: {
    maxRetries: 3,
    retryDelay: 1
  }
};

/**
 * Conector base para compañías de seguros
 */
abstract class BaseInsuranceConnector implements Connector {
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

  // Métodos abstractos para operaciones comunes
  abstract getPolicies(filters?: Record<string, unknown>): Promise<OperationResult<InsurancePolicy[]>>;
  abstract getPolicy(policyNumber: string): Promise<OperationResult<InsurancePolicy>>;
  abstract getClaims(policyNumber?: string): Promise<OperationResult<InsuranceClaim[]>>;
  abstract createClaim(claim: Partial<InsuranceClaim>): Promise<OperationResult<InsuranceClaim>>;
  abstract getReceipts(policyNumber?: string): Promise<OperationResult<InsuranceReceipt[]>>;
}

/**
 * Conector para MAPFRE
 */
export class MapfreConnector extends BaseInsuranceConnector {
  constructor() {
    super({
      ...baseInsuranceConfig as ConnectorConfig,
      type: IntegrationType.INSURANCE_MAPFRE,
      name: 'Mapfre Insurance Connector',
      endpoints: [
        {
          name: 'getPolicies',
          path: '/api/v1/policies',
          method: 'GET',
          description: 'Obtener listado de pólizas'
        },
        {
          name: 'getPolicy',
          path: '/api/v1/policies/{policyNumber}',
          method: 'GET',
          description: 'Obtener detalle de póliza'
        },
        {
          name: 'getClaims',
          path: '/api/v1/claims',
          method: 'GET',
          description: 'Obtener listado de siniestros'
        },
        {
          name: 'createClaim',
          path: '/api/v1/claims',
          method: 'POST',
          description: 'Crear nuevo siniestro'
        },
        {
          name: 'getReceipts',
          path: '/api/v1/receipts',
          method: 'GET',
          description: 'Obtener recibos'
        },
        {
          name: 'quoteCar',
          path: '/api/v1/quotes/car',
          method: 'POST',
          description: 'Cotizar seguro de auto'
        },
        {
          name: 'quoteHome',
          path: '/api/v1/quotes/home',
          method: 'POST',
          description: 'Cotizar seguro de hogar'
        }
      ],
      features: ['policies', 'claims', 'receipts', 'quotes', 'documents'],
      documentation: 'https://developers.mapfre.com'
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;

    this.client = axios.create({
      baseURL: 'https://api.mapfre.es',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': credentials.apiKey || '',
        'X-Client-Id': credentials.clientId || ''
      }
    });

    // Interceptor para manejar tokens OAuth2
    if (credentials.authType === AuthType.OAUTH2) {
      this.client.interceptors.request.use(async (config) => {
        if (credentials.accessToken) {
          config.headers.Authorization = `Bearer ${credentials.accessToken}`;
        }
        return config;
      });
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.get('/api/v1/health');
      return true;
    } catch {
      return false;
    }
  }

  async getPolicies(filters?: Record<string, unknown>): Promise<OperationResult<InsurancePolicy[]>> {
    try {
      const data = await this.execute<{ policies: InsurancePolicy[] }>('getPolicies', filters);
      return { success: true, data: data.policies };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch policies'
        }
      };
    }
  }

  async getPolicy(policyNumber: string): Promise<OperationResult<InsurancePolicy>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get<InsurancePolicy>(`/api/v1/policies/${policyNumber}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch policy'
        }
      };
    }
  }

  async getClaims(policyNumber?: string): Promise<OperationResult<InsuranceClaim[]>> {
    try {
      const params = policyNumber ? { policyNumber } : undefined;
      const data = await this.execute<{ claims: InsuranceClaim[] }>('getClaims', params);
      return { success: true, data: data.claims };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch claims'
        }
      };
    }
  }

  async createClaim(claim: Partial<InsuranceClaim>): Promise<OperationResult<InsuranceClaim>> {
    try {
      const data = await this.execute<InsuranceClaim>('createClaim', claim);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create claim'
        }
      };
    }
  }

  async getReceipts(policyNumber?: string): Promise<OperationResult<InsuranceReceipt[]>> {
    try {
      const params = policyNumber ? { policyNumber } : undefined;
      const data = await this.execute<{ receipts: InsuranceReceipt[] }>('getReceipts', params);
      return { success: true, data: data.receipts };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch receipts'
        }
      };
    }
  }

  /**
   * Cotizar seguro de auto
   */
  async quoteCarInsurance(data: {
    vehiclePlate: string;
    vehicleType: string;
    driverAge: number;
    driverExperience: number;
    postalCode: string;
  }): Promise<OperationResult<{ premium: number; coverages: InsuranceCoverage[] }>> {
    try {
      const result = await this.execute<{ premium: number; coverages: InsuranceCoverage[] }>('quoteCar', data);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'QUOTE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get quote'
        }
      };
    }
  }
}

/**
 * Conector para Allianz
 */
export class AllianzConnector extends BaseInsuranceConnector {
  constructor() {
    super({
      ...baseInsuranceConfig as ConnectorConfig,
      type: IntegrationType.INSURANCE_ALLIANZ,
      name: 'Allianz Insurance Connector',
      endpoints: [
        {
          name: 'getPolicies',
          path: '/insurance/v2/contracts',
          method: 'GET',
          description: 'Obtener contratos de seguro'
        },
        {
          name: 'getPolicy',
          path: '/insurance/v2/contracts/{contractId}',
          method: 'GET',
          description: 'Obtener detalle de contrato'
        },
        {
          name: 'getClaims',
          path: '/insurance/v2/claims',
          method: 'GET',
          description: 'Obtener siniestros'
        },
        {
          name: 'createClaim',
          path: '/insurance/v2/claims',
          method: 'POST',
          description: 'Declarar siniestro'
        },
        {
          name: 'getReceipts',
          path: '/insurance/v2/payments',
          method: 'GET',
          description: 'Obtener pagos'
        }
      ],
      features: ['policies', 'claims', 'payments', 'documents'],
      documentation: 'https://developer.allianz.com'
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;

    this.client = axios.create({
      baseURL: 'https://api.allianz.es',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.accessToken || ''}`,
        'X-Partner-Id': credentials.clientId || ''
      }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.get('/insurance/v2/health');
      return true;
    } catch {
      return false;
    }
  }

  async getPolicies(filters?: Record<string, unknown>): Promise<OperationResult<InsurancePolicy[]>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get('/insurance/v2/contracts', { params: filters });
      const policies = response.data.contracts.map(this.mapAllianzToPolicy);
      return { success: true, data: policies };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch policies'
        }
      };
    }
  }

  async getPolicy(policyNumber: string): Promise<OperationResult<InsurancePolicy>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/insurance/v2/contracts/${policyNumber}`);
      return { success: true, data: this.mapAllianzToPolicy(response.data) };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch policy'
        }
      };
    }
  }

  async getClaims(policyNumber?: string): Promise<OperationResult<InsuranceClaim[]>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const params = policyNumber ? { contractId: policyNumber } : undefined;
      const response = await this.client.get('/insurance/v2/claims', { params });
      return { success: true, data: response.data.claims };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch claims'
        }
      };
    }
  }

  async createClaim(claim: Partial<InsuranceClaim>): Promise<OperationResult<InsuranceClaim>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.post('/insurance/v2/claims', claim);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create claim'
        }
      };
    }
  }

  async getReceipts(policyNumber?: string): Promise<OperationResult<InsuranceReceipt[]>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const params = policyNumber ? { contractId: policyNumber } : undefined;
      const response = await this.client.get('/insurance/v2/payments', { params });
      return { success: true, data: response.data.payments };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch receipts'
        }
      };
    }
  }

  private mapAllianzToPolicy(allianzContract: Record<string, unknown>): InsurancePolicy {
    return {
      policyNumber: String(allianzContract.contractId),
      productCode: String(allianzContract.productCode),
      productName: String(allianzContract.productName),
      holderNIF: String(allianzContract.holderTaxId),
      holderName: String(allianzContract.holderName),
      startDate: new Date(String(allianzContract.effectiveDate)),
      endDate: new Date(String(allianzContract.expiryDate)),
      premium: Number(allianzContract.annualPremium),
      status: String(allianzContract.status) as InsurancePolicy['status'],
      coverages: (allianzContract.coverages as Record<string, unknown>[])?.map(c => ({
        code: String(c.code),
        name: String(c.description),
        sumInsured: Number(c.insuredAmount),
        deductible: c.deductible ? Number(c.deductible) : undefined,
        premium: Number(c.premium)
      })) || []
    };
  }
}

/**
 * Conector para AXA
 */
export class AXAConnector extends BaseInsuranceConnector {
  constructor() {
    super({
      ...baseInsuranceConfig as ConnectorConfig,
      type: IntegrationType.INSURANCE_AXA,
      name: 'AXA Insurance Connector',
      endpoints: [
        {
          name: 'getPolicies',
          path: '/v1/insurance/policies',
          method: 'GET',
          description: 'Listar pólizas'
        },
        {
          name: 'getPolicy',
          path: '/v1/insurance/policies/{policyId}',
          method: 'GET',
          description: 'Detalle de póliza'
        },
        {
          name: 'getClaims',
          path: '/v1/insurance/claims',
          method: 'GET',
          description: 'Listar siniestros'
        },
        {
          name: 'createClaim',
          path: '/v1/insurance/claims',
          method: 'POST',
          description: 'Crear siniestro'
        },
        {
          name: 'getReceipts',
          path: '/v1/insurance/billing',
          method: 'GET',
          description: 'Facturación'
        }
      ],
      features: ['policies', 'claims', 'billing', 'documents', 'telematics'],
      documentation: 'https://developer.axa.es'
    });
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;

    this.client = axios.create({
      baseURL: 'https://api.axa.es',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': credentials.apiKey || '',
        'Authorization': `Bearer ${credentials.accessToken || ''}`
      }
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.get('/v1/health');
      return true;
    } catch {
      return false;
    }
  }

  async getPolicies(filters?: Record<string, unknown>): Promise<OperationResult<InsurancePolicy[]>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get('/v1/insurance/policies', { params: filters });
      return { success: true, data: response.data.policies };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch policies'
        }
      };
    }
  }

  async getPolicy(policyNumber: string): Promise<OperationResult<InsurancePolicy>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/v1/insurance/policies/${policyNumber}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch policy'
        }
      };
    }
  }

  async getClaims(policyNumber?: string): Promise<OperationResult<InsuranceClaim[]>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const params = policyNumber ? { policyId: policyNumber } : undefined;
      const response = await this.client.get('/v1/insurance/claims', { params });
      return { success: true, data: response.data.claims };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch claims'
        }
      };
    }
  }

  async createClaim(claim: Partial<InsuranceClaim>): Promise<OperationResult<InsuranceClaim>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.post('/v1/insurance/claims', claim);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create claim'
        }
      };
    }
  }

  async getReceipts(policyNumber?: string): Promise<OperationResult<InsuranceReceipt[]>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const params = policyNumber ? { policyId: policyNumber } : undefined;
      const response = await this.client.get('/v1/insurance/billing', { params });
      return { success: true, data: response.data.receipts };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch receipts'
        }
      };
    }
  }
}

/**
 * Conector genérico para otras compañías
 */
export class GenericInsuranceConnector extends BaseInsuranceConnector {
  private baseUrl: string;

  constructor(name: string, baseUrl: string, endpoints: ConnectorEndpoint[]) {
    super({
      ...baseInsuranceConfig as ConnectorConfig,
      type: IntegrationType.INSURANCE_GENERIC,
      name,
      endpoints,
      features: ['policies', 'claims', 'receipts']
    });
    this.baseUrl = baseUrl;
  }

  async initialize(credentials: IntegrationCredentials): Promise<void> {
    this.credentials = credentials;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    switch (credentials.authType) {
      case AuthType.API_KEY:
        headers['X-API-Key'] = credentials.apiKey || '';
        break;
      case AuthType.BEARER:
        headers['Authorization'] = `Bearer ${credentials.accessToken || ''}`;
        break;
      case AuthType.BASIC:
        const basicAuth = Buffer.from(
          `${credentials.username}:${credentials.password}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${basicAuth}`;
        break;
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers
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

  async getPolicies(filters?: Record<string, unknown>): Promise<OperationResult<InsurancePolicy[]>> {
    try {
      const data = await this.execute<{ policies: InsurancePolicy[] }>('getPolicies', filters);
      return { success: true, data: data.policies || [] };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch policies'
        }
      };
    }
  }

  async getPolicy(policyNumber: string): Promise<OperationResult<InsurancePolicy>> {
    try {
      if (!this.client) throw new Error('Not initialized');
      const response = await this.client.get(`/policies/${policyNumber}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch policy'
        }
      };
    }
  }

  async getClaims(policyNumber?: string): Promise<OperationResult<InsuranceClaim[]>> {
    try {
      const params = policyNumber ? { policyNumber } : undefined;
      const data = await this.execute<{ claims: InsuranceClaim[] }>('getClaims', params);
      return { success: true, data: data.claims || [] };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch claims'
        }
      };
    }
  }

  async createClaim(claim: Partial<InsuranceClaim>): Promise<OperationResult<InsuranceClaim>> {
    try {
      const data = await this.execute<InsuranceClaim>('createClaim', claim);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create claim'
        }
      };
    }
  }

  async getReceipts(policyNumber?: string): Promise<OperationResult<InsuranceReceipt[]>> {
    try {
      const params = policyNumber ? { policyNumber } : undefined;
      const data = await this.execute<{ receipts: InsuranceReceipt[] }>('getReceipts', params);
      return { success: true, data: data.receipts || [] };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch receipts'
        }
      };
    }
  }
}

/**
 * Factory para crear conectores de seguros
 */
export function createInsuranceConnector(type: IntegrationType): BaseInsuranceConnector {
  switch (type) {
    case IntegrationType.INSURANCE_MAPFRE:
      return new MapfreConnector();
    case IntegrationType.INSURANCE_ALLIANZ:
      return new AllianzConnector();
    case IntegrationType.INSURANCE_AXA:
      return new AXAConnector();
    default:
      throw new Error(`Unsupported insurance connector type: ${type}`);
  }
}

export {
  BaseInsuranceConnector,
  MapfreConnector,
  AllianzConnector,
  AXAConnector,
  GenericInsuranceConnector
};
