/**
 * API Connectors for external systems
 */

import axios, { AxiosInstance } from 'axios';

export interface ConnectorConfig {
  name: string;
  baseUrl: string;
  authType: 'none' | 'basic' | 'bearer' | 'apikey' | 'oauth2';
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
  };
  headers?: Record<string, string>;
  timeout?: number;
}

export class ApiConnector {
  private client: AxiosInstance;
  private config: ConnectorConfig;

  constructor(config: ConnectorConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: this.buildHeaders(),
    });
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };

    switch (this.config.authType) {
      case 'bearer':
        if (this.config.credentials?.token) {
          headers['Authorization'] = `Bearer ${this.config.credentials.token}`;
        }
        break;
      case 'apikey':
        if (this.config.credentials?.apiKey) {
          headers['X-API-Key'] = this.config.credentials.apiKey;
        }
        break;
      case 'basic':
        if (this.config.credentials?.username && this.config.credentials?.password) {
          const auth = Buffer.from(
            `${this.config.credentials.username}:${this.config.credentials.password}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${auth}`;
        }
        break;
    }

    return headers;
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<T>(path, { params });
    return response.data;
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    const response = await this.client.post<T>(path, data);
    return response.data;
  }

  async put<T>(path: string, data?: unknown): Promise<T> {
    const response = await this.client.put<T>(path, data);
    return response.data;
  }

  async delete<T>(path: string): Promise<T> {
    const response = await this.client.delete<T>(path);
    return response.data;
  }
}

// Pre-configured connectors for common insurance APIs
export const createInsuranceConnector = (config: Partial<ConnectorConfig>): ApiConnector => {
  return new ApiConnector({
    name: 'insurance-api',
    baseUrl: config.baseUrl || 'https://api.insurance.example.com',
    authType: 'bearer',
    ...config,
  });
};

export const createCRMConnector = (config: Partial<ConnectorConfig>): ApiConnector => {
  return new ApiConnector({
    name: 'crm-api',
    baseUrl: config.baseUrl || 'https://api.crm.example.com',
    authType: 'apikey',
    ...config,
  });
};
