/**
 * DataHub Client - Interact with ait-datahub (Analytics)
 */

import axios, { AxiosInstance } from 'axios';
import { CallMetrics, AgentMetrics, RevenueMetrics, APIResponse } from '../types';

export class DataHubClient {
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
        console.error('DataHub Client Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  async getCallMetrics(period: 'today' | 'week' | 'month'): Promise<CallMetrics> {
    const response = await this.client.get<APIResponse<CallMetrics>>('/analytics/calls', {
      params: { period }
    });
    return response.data!;
  }

  async getAgentMetrics(agentId?: string): Promise<AgentMetrics[]> {
    const response = await this.client.get<APIResponse<AgentMetrics[]>>('/analytics/agents', {
      params: { agentId }
    });
    return response.data || [];
  }

  async getRevenueMetrics(period: 'today' | 'week' | 'month' | 'year'): Promise<RevenueMetrics> {
    const response = await this.client.get<APIResponse<RevenueMetrics>>('/analytics/revenue', {
      params: { period }
    });
    return response.data!;
  }

  async trackEvent(event: string, data: Record<string, any>): Promise<void> {
    await this.client.post('/analytics/events', { event, data, timestamp: Date.now() });
  }
}
