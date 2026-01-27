import { SendMessageRequest, SendMessageResponse, MessageStatus } from '../types';

interface WhatsAppConfig {
  businessId: string;
  accessToken: string;
  phoneNumberId: string;
  webhookVerifyToken: string;
}

export class WhatsAppProvider {
  private config: WhatsAppConfig;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const url = `${this.baseUrl}/${this.config.phoneNumberId}/messages`;
    
    const payload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: this.normalizePhone(request.to),
      type: 'text',
    };

    if (request.templateId) {
      payload.type = 'template';
      payload.template = {
        name: request.templateId,
        language: { code: 'es' },
        components: this.buildTemplateComponents(request.templateData),
      };
    } else {
      payload.text = { body: request.content };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          messageId: '',
          status: 'FAILED' as MessageStatus,
        };
      }

      return {
        messageId: data.messages?.[0]?.id || '',
        status: 'SENT' as MessageStatus,
        externalId: data.messages?.[0]?.id,
      };
    } catch (error) {
      return {
        messageId: '',
        status: 'FAILED' as MessageStatus,
      };
    }
  }

  async sendInteractiveMessage(to: string, header: string, body: string, buttons: { id: string; title: string }[]): Promise<SendMessageResponse> {
    const url = `${this.baseUrl}/${this.config.phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: this.normalizePhone(to),
      type: 'interactive',
      interactive: {
        type: 'button',
        header: { type: 'text', text: header },
        body: { text: body },
        action: {
          buttons: buttons.map(b => ({
            type: 'reply',
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return {
      messageId: data.messages?.[0]?.id || '',
      status: response.ok ? 'SENT' : 'FAILED',
      externalId: data.messages?.[0]?.id,
    };
  }

  handleWebhook(body: unknown): { type: string; data: unknown } | null {
    const entry = (body as any)?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (value?.messages?.[0]) {
      const msg = value.messages[0];
      return {
        type: 'message',
        data: {
          from: msg.from,
          type: msg.type,
          text: msg.text?.body,
          timestamp: msg.timestamp,
          messageId: msg.id,
        },
      };
    }

    if (value?.statuses?.[0]) {
      const status = value.statuses[0];
      return {
        type: 'status',
        data: {
          messageId: status.id,
          status: status.status,
          timestamp: status.timestamp,
        },
      };
    }

    return null;
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }

  private buildTemplateComponents(data?: Record<string, unknown>): unknown[] {
    if (!data) return [];
    
    const components: unknown[] = [];
    const bodyParams = Object.values(data).map(v => ({ type: 'text', text: String(v) }));
    
    if (bodyParams.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParams,
      });
    }
    
    return components;
  }
}
