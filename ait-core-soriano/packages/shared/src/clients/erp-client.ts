/**
 * ERP Client - Interact with ait-core-soriano (CRM/ERP)
 */

import axios, { AxiosInstance } from 'axios';
import {
  Customer,
  Policy,
  Interaction,
  Task,
  Quote,
  Claim,
  APIResponse
} from '../types';

export class ERPClient {
  private client: AxiosInstance;

  constructor(config: {
    baseURL: string;
    apiKey?: string;
    onTokenRequest?: () => Promise<string>;
  }) {
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: config.apiKey ? {
        'X-API-Key': config.apiKey
      } : {}
    });

    // Add auth interceptor
    if (config.onTokenRequest) {
      this.client.interceptors.request.use(async (config) => {
        const token = await config.onTokenRequest!();
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      });
    }

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('ERP Client Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // ============================================================================
  // CUSTOMERS
  // ============================================================================

  customers = {
    findByPhone: async (phone: string): Promise<Customer | null> => {
      const response = await this.client.get<APIResponse<Customer>>(`/customers`, {
        params: { phone }
      });
      return response.data || null;
    },

    findById: async (id: string): Promise<Customer> => {
      const response = await this.client.get<APIResponse<Customer>>(`/customers/${id}`);
      return response.data!;
    },

    search: async (query: string): Promise<Customer[]> => {
      const response = await this.client.get<APIResponse<Customer[]>>(`/customers/search`, {
        params: { q: query }
      });
      return response.data || [];
    },

    create: async (data: Partial<Customer>): Promise<Customer> => {
      const response = await this.client.post<APIResponse<Customer>>('/customers', data);
      return response.data!;
    },

    update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
      const response = await this.client.patch<APIResponse<Customer>>(`/customers/${id}`, data);
      return response.data!;
    },

    getContext: async (customerId: string, callSid?: string): Promise<{
      customer: Customer;
      policies: Policy[];
      recentInteractions: Interaction[];
      pendingTasks: Task[];
      activeClaims: Claim[];
    }> => {
      const response = await this.client.get<APIResponse<any>>(`/customers/${customerId}/context`, {
        params: { callSid }
      });
      return response.data!;
    }
  };

  // ============================================================================
  // POLICIES
  // ============================================================================

  policies = {
    getActive: async (customerId: string): Promise<Policy[]> => {
      const response = await this.client.get<APIResponse<Policy[]>>('/policies', {
        params: { customerId, status: 'active' }
      });
      return response.data || [];
    },

    getById: async (id: string): Promise<Policy> => {
      const response = await this.client.get<APIResponse<Policy>>(`/policies/${id}`);
      return response.data!;
    },

    getByNumber: async (policyNumber: string): Promise<Policy> => {
      const response = await this.client.get<APIResponse<Policy>>(`/policies/number/${policyNumber}`);
      return response.data!;
    },

    create: async (data: Partial<Policy>): Promise<Policy> => {
      const response = await this.client.post<APIResponse<Policy>>('/policies', data);
      return response.data!;
    },

    update: async (id: string, data: Partial<Policy>): Promise<Policy> => {
      const response = await this.client.patch<APIResponse<Policy>>(`/policies/${id}`, data);
      return response.data!;
    },

    renew: async (id: string, data: { startDate: Date; premium: number }): Promise<Policy> => {
      const response = await this.client.post<APIResponse<Policy>>(`/policies/${id}/renew`, data);
      return response.data!;
    },

    cancel: async (id: string, reason: string): Promise<Policy> => {
      const response = await this.client.post<APIResponse<Policy>>(`/policies/${id}/cancel`, { reason });
      return response.data!;
    }
  };

  // ============================================================================
  // INTERACTIONS
  // ============================================================================

  interactions = {
    create: async (data: Partial<Interaction>): Promise<Interaction> => {
      const response = await this.client.post<APIResponse<Interaction>>('/interactions', data);
      return response.data!;
    },

    getRecent: async (customerId: string, limit: number = 10): Promise<Interaction[]> => {
      const response = await this.client.get<APIResponse<Interaction[]>>('/interactions', {
        params: { customerId, limit, sort: '-createdAt' }
      });
      return response.data || [];
    },

    update: async (id: string, data: Partial<Interaction>): Promise<Interaction> => {
      const response = await this.client.patch<APIResponse<Interaction>>(`/interactions/${id}`, data);
      return response.data!;
    },

    getByCallSid: async (callSid: string): Promise<Interaction | null> => {
      const response = await this.client.get<APIResponse<Interaction>>('/interactions', {
        params: { callSid }
      });
      return response.data || null;
    }
  };

  // ============================================================================
  // TASKS
  // ============================================================================

  tasks = {
    create: async (data: Partial<Task>): Promise<Task> => {
      const response = await this.client.post<APIResponse<Task>>('/tasks', data);
      return response.data!;
    },

    getPending: async (customerId?: string, agentId?: string): Promise<Task[]> => {
      const response = await this.client.get<APIResponse<Task[]>>('/tasks', {
        params: {
          customerId,
          assignedTo: agentId,
          status: 'pending',
          sort: 'priority,-dueDate'
        }
      });
      return response.data || [];
    },

    getById: async (id: string): Promise<Task> => {
      const response = await this.client.get<APIResponse<Task>>(`/tasks/${id}`);
      return response.data!;
    },

    update: async (id: string, data: Partial<Task>): Promise<Task> => {
      const response = await this.client.patch<APIResponse<Task>>(`/tasks/${id}`, data);
      return response.data!;
    },

    complete: async (id: string, notes?: string): Promise<Task> => {
      const response = await this.client.post<APIResponse<Task>>(`/tasks/${id}/complete`, { notes });
      return response.data!;
    }
  };

  // ============================================================================
  // QUOTES
  // ============================================================================

  quotes = {
    create: async (data: Partial<Quote>): Promise<Quote> => {
      const response = await this.client.post<APIResponse<Quote>>('/quotes', data);
      return response.data!;
    },

    getById: async (id: string): Promise<Quote> => {
      const response = await this.client.get<APIResponse<Quote>>(`/quotes/${id}`);
      return response.data!;
    },

    accept: async (id: string): Promise<{ quote: Quote; policy: Policy }> => {
      const response = await this.client.post<APIResponse<any>>(`/quotes/${id}/accept`);
      return response.data!;
    },

    reject: async (id: string, reason: string): Promise<Quote> => {
      const response = await this.client.post<APIResponse<Quote>>(`/quotes/${id}/reject`, { reason });
      return response.data!;
    }
  };

  // ============================================================================
  // CLAIMS
  // ============================================================================

  claims = {
    create: async (data: Partial<Claim>): Promise<Claim> => {
      const response = await this.client.post<APIResponse<Claim>>('/claims', data);
      return response.data!;
    },

    getOpen: async (customerId: string): Promise<Claim[]> => {
      const response = await this.client.get<APIResponse<Claim[]>>('/claims', {
        params: { customerId, status: 'open,investigating,approved' }
      });
      return response.data || [];
    },

    getById: async (id: string): Promise<Claim> => {
      const response = await this.client.get<APIResponse<Claim>>(`/claims/${id}`);
      return response.data!;
    },

    update: async (id: string, data: Partial<Claim>): Promise<Claim> => {
      const response = await this.client.patch<APIResponse<Claim>>(`/claims/${id}`, data);
      return response.data!;
    },

    approve: async (id: string, amount: number): Promise<Claim> => {
      const response = await this.client.post<APIResponse<Claim>>(`/claims/${id}/approve`, { amount });
      return response.data!;
    }
  };
}
