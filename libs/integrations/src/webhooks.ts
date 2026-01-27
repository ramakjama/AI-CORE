/**
 * Webhook management
 */

import { v4 as uuid } from 'uuid';
import crypto from 'crypto';

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}

export interface WebhookPayload {
  id: string;
  event: string;
  timestamp: string;
  data: unknown;
}

export class WebhookManager {
  private webhooks: Map<string, WebhookConfig> = new Map();

  register(config: Omit<WebhookConfig, 'id'>): WebhookConfig {
    const webhook: WebhookConfig = {
      ...config,
      id: uuid(),
    };
    this.webhooks.set(webhook.id, webhook);
    return webhook;
  }

  unregister(id: string): boolean {
    return this.webhooks.delete(id);
  }

  getWebhooksForEvent(event: string): WebhookConfig[] {
    return Array.from(this.webhooks.values()).filter(
      w => w.active && w.events.includes(event)
    );
  }

  async dispatch(event: string, data: unknown): Promise<void> {
    const webhooks = this.getWebhooksForEvent(event);
    const payload: WebhookPayload = {
      id: uuid(),
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    await Promise.allSettled(
      webhooks.map(webhook => this.send(webhook, payload))
    );
  }

  private async send(webhook: WebhookConfig, payload: WebhookPayload): Promise<void> {
    const body = JSON.stringify(payload);
    const _signature = webhook.secret
      ? crypto.createHmac('sha256', webhook.secret).update(body).digest('hex')
      : undefined;

    console.log(`[Webhook] Sending ${payload.event} to ${webhook.url}${_signature ? ' (signed)' : ''}`);

    // In production, use axios to send the webhook
  }

  generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}

export const webhookManager = new WebhookManager();
