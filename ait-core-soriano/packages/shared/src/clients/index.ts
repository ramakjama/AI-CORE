/**
 * API Clients - Export all clients
 */

export { ERPClient } from './erp-client';
export { CommsClient } from './comms-client';
export { QuoteClient } from './quote-client';
export { AuthClient } from './auth-client';
export { DataHubClient } from './datahub-client';

/**
 * Unified Client - Access all services from one place
 */

import { ERPClient } from './erp-client';
import { CommsClient } from './comms-client';
import { QuoteClient } from './quote-client';
import { AuthClient } from './auth-client';
import { DataHubClient } from './datahub-client';

export interface AITCoreConfig {
  services: {
    erp: { baseURL: string; apiKey?: string };
    comms: { baseURL: string; apiKey?: string };
    quotes: { baseURL: string; apiKey?: string };
    auth: { baseURL: string; apiKey?: string };
    datahub: { baseURL: string; apiKey?: string };
  };
  onTokenRequest?: () => Promise<string>;
}

export class AITCoreClient {
  public erp: ERPClient;
  public comms: CommsClient;
  public quotes: QuoteClient;
  public auth: AuthClient;
  public datahub: DataHubClient;

  constructor(config: AITCoreConfig) {
    const tokenProvider = config.onTokenRequest;

    this.erp = new ERPClient({
      ...config.services.erp,
      onTokenRequest: tokenProvider
    });

    this.comms = new CommsClient({
      ...config.services.comms,
      onTokenRequest: tokenProvider
    });

    this.quotes = new QuoteClient({
      ...config.services.quotes,
      onTokenRequest: tokenProvider
    });

    this.auth = new AuthClient({
      ...config.services.auth
    });

    this.datahub = new DataHubClient({
      ...config.services.datahub,
      onTokenRequest: tokenProvider
    });
  }

  /**
   * Helper: Get full customer context for a call
   */
  async getCallContext(callSid: string, customerId?: string): Promise<{
    call: any;
    customer?: any;
    policies?: any[];
    claims?: any[];
    interactions?: any[];
    tasks?: any[];
  }> {
    const call = await this.comms.calls.getDetails(callSid);

    if (!customerId && call.customerId) {
      customerId = call.customerId;
    }

    if (!customerId) {
      return { call };
    }

    const context = await this.erp.customers.getContext(customerId, callSid);

    return {
      call,
      ...context
    };
  }

  /**
   * Helper: Create interaction from call
   */
  async createCallInteraction(callData: {
    callSid: string;
    customerId: string;
    agentId: string;
    duration: number;
    outcome?: string;
    recordingUrl?: string;
  }): Promise<any> {
    return this.erp.interactions.create({
      customerId: callData.customerId,
      agentId: callData.agentId,
      type: 'phone_call',
      direction: 'inbound', // TODO: detect from call
      channel: 'phone',
      duration: callData.duration,
      outcome: callData.outcome,
      recording: callData.recordingUrl,
      callSid: callData.callSid,
      metadata: {
        callSid: callData.callSid
      }
    });
  }
}
