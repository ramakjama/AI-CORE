/**
 * Communications Client - Interact with ait-comms-telephony (PBX/Telephony)
 */

import axios, { AxiosInstance } from 'axios';
import { Call, CallContext, APIResponse } from '../types';

export class CommsClient {
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
        console.error('Comms Client Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // ============================================================================
  // TWILIO TOKENS
  // ============================================================================

  async getTwilioToken(agentId: string): Promise<{
    token: string;
    identity: string;
    expiresAt: number;
  }> {
    const response = await this.client.post<APIResponse<any>>('/twilio/token', {
      agentId
    });
    return response.data!;
  }

  // ============================================================================
  // CALLS
  // ============================================================================

  calls = {
    initiate: async (params: {
      to: string;
      from?: string;
      agentId: string;
      customerId?: string;
      taskId?: string;
      metadata?: Record<string, any>;
    }): Promise<Call> => {
      const response = await this.client.post<APIResponse<Call>>('/calls/outbound', params);
      return response.data!;
    },

    getDetails: async (callSid: string): Promise<Call> => {
      const response = await this.client.get<APIResponse<Call>>(`/calls/${callSid}`);
      return response.data!;
    },

    getContext: async (callSid: string): Promise<CallContext> => {
      const response = await this.client.get<APIResponse<CallContext>>(`/calls/${callSid}/context`);
      return response.data!;
    },

    updateContext: async (callSid: string, context: Partial<CallContext>): Promise<void> => {
      await this.client.patch(`/calls/${callSid}/context`, context);
    },

    transfer: async (callSid: string, toAgentId: string): Promise<void> => {
      await this.client.post(`/calls/${callSid}/transfer`, { toAgentId });
    },

    hangup: async (callSid: string): Promise<void> => {
      await this.client.post(`/calls/${callSid}/hangup`);
    },

    getActive: async (agentId?: string): Promise<Call[]> => {
      const response = await this.client.get<APIResponse<Call[]>>('/calls', {
        params: { agentId, status: 'in-progress' }
      });
      return response.data || [];
    },

    getHistory: async (customerId?: string, limit: number = 20): Promise<Call[]> => {
      const response = await this.client.get<APIResponse<Call[]>>('/calls', {
        params: { customerId, limit, sort: '-startedAt' }
      });
      return response.data || [];
    }
  };

  // ============================================================================
  // QUEUE
  // ============================================================================

  queue = {
    getStats: async (): Promise<{
      waiting: number;
      longestWait: number;
      averageWait: number;
    }> => {
      const response = await this.client.get<APIResponse<any>>('/queue/stats');
      return response.data!;
    },

    getWaiting: async (): Promise<Array<{
      callSid: string;
      from: string;
      waitTime: number;
      position: number;
    }>> => {
      const response = await this.client.get<APIResponse<any>>('/queue/waiting');
      return response.data || [];
    }
  };

  // ============================================================================
  // AGENT STATUS
  // ============================================================================

  agents = {
    setStatus: async (agentId: string, status: 'available' | 'busy' | 'break' | 'offline'): Promise<void> => {
      await this.client.post(`/agents/${agentId}/status`, { status });
    },

    getStatus: async (agentId: string): Promise<{
      status: string;
      activeCallSid?: string;
      lastCallAt?: Date;
    }> => {
      const response = await this.client.get<APIResponse<any>>(`/agents/${agentId}/status`);
      return response.data!;
    },

    getAll: async (): Promise<Array<{
      agentId: string;
      status: string;
      activeCallSid?: string;
      callsToday: number;
    }>> => {
      const response = await this.client.get<APIResponse<any>>('/agents');
      return response.data || [];
    }
  };

  // ============================================================================
  // RECORDINGS
  // ============================================================================

  recordings = {
    getByCallSid: async (callSid: string): Promise<{
      url: string;
      duration: number;
      transcription?: string;
    }> => {
      const response = await this.client.get<APIResponse<any>>(`/recordings/${callSid}`);
      return response.data!;
    },

    requestTranscription: async (callSid: string): Promise<{ jobId: string }> => {
      const response = await this.client.post<APIResponse<any>>(`/recordings/${callSid}/transcribe`);
      return response.data!;
    }
  };
}
