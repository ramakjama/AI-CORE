/**
 * Quote Client - Interact with ait-qb (Quote Engine)
 */

import axios, { AxiosInstance } from 'axios';
import { Quote, VehicleData, PropertyData, LifeData, APIResponse } from '../types';

export class QuoteClient {
  private client: AxiosInstance;

  constructor(config: {
    baseURL: string;
    apiKey?: string;
    onTokenRequest?: () => Promise<string>;
  }) {
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: config.apiKey ? { 'X-API-Key': config.apiKey } : {}
    });

    if (config.onTokenRequest) {
      this.client.interceptors.request.use(async (config) => {
        const token = await config.onTokenRequest!();
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      });
    }

    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('Quote Client Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  async calculateAuto(params: {
    customerId: string;
    callSid?: string;
    vehicleData: VehicleData;
  }): Promise<Quote> {
    const response = await this.client.post<APIResponse<Quote>>('/quotes/auto', params);
    return response.data!;
  }

  async calculateHome(params: {
    customerId: string;
    callSid?: string;
    propertyData: PropertyData;
  }): Promise<Quote> {
    const response = await this.client.post<APIResponse<Quote>>('/quotes/home', params);
    return response.data!;
  }

  async calculateLife(params: {
    customerId: string;
    callSid?: string;
    lifeData: LifeData;
  }): Promise<Quote> {
    const response = await this.client.post<APIResponse<Quote>>('/quotes/life', params);
    return response.data!;
  }

  async scrapeCompetitors(quoteId: string): Promise<{
    competitors: Array<{ carrier: string; price: number }>;
  }> {
    const response = await this.client.post<APIResponse<any>>(`/quotes/${quoteId}/scrape`);
    return response.data!;
  }

  async getById(id: string): Promise<Quote> {
    const response = await this.client.get<APIResponse<Quote>>(`/quotes/${id}`);
    return response.data!;
  }
}
