/**
 * AIT-CONNECTOR - Communication Connectors
 * Connectors for communication platforms (Twilio, SendGrid, Slack, Teams, WhatsApp, etc.)
 */

import { BaseConnector } from '../base-connector';
import { ConnectorType, ConnectorConfig, ConnectorCredentials, Logger } from '../../types';
import axios, { AxiosInstance } from 'axios';

/**
 * Twilio Connector (SMS, Voice, WhatsApp)
 */
export class TwilioConnector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Twilio', ConnectorType.COMMUNICATION, 'twilio', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    const accountSid = this.credentials?.custom?.accountSid;
    this.client = axios.create({
      baseURL: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`,
      timeout: this.config.timeout,
      auth: {
        username: accountSid || '',
        password: this.credentials?.apiKey || ''
      }
    });
  }

  protected async onConnect(): Promise<void> {
    // No explicit connection needed for Twilio
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('.json');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'sendSMS':
        return this.sendSMS(params);
      case 'makeCall':
        return this.makeCall(params);
      case 'sendWhatsApp':
        return this.sendWhatsApp(params);
      case 'getMessages':
        return this.getMessages(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async sendSMS(params: { to: string; from: string; body: string }): Promise<any> {
    const response = await this.client!.post('/Messages.json', new URLSearchParams(params));
    return response.data;
  }

  private async makeCall(params: { to: string; from: string; url: string }): Promise<any> {
    const response = await this.client!.post('/Calls.json', new URLSearchParams(params));
    return response.data;
  }

  private async sendWhatsApp(params: { to: string; from: string; body: string }): Promise<any> {
    const whatsappParams = {
      To: `whatsapp:${params.to}`,
      From: `whatsapp:${params.from}`,
      Body: params.body
    };
    const response = await this.client!.post('/Messages.json', new URLSearchParams(whatsappParams));
    return response.data;
  }

  private async getMessages(params: any): Promise<any> {
    const response = await this.client!.get('/Messages.json', { params });
    return response.data;
  }
}

/**
 * SendGrid Connector (Email)
 */
export class SendGridConnector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'SendGrid', ConnectorType.COMMUNICATION, 'sendgrid', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    this.client = axios.create({
      baseURL: 'https://api.sendgrid.com/v3',
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials?.apiKey}`
      }
    });
  }

  protected async onConnect(): Promise<void> {
    // No explicit connection needed
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('/scopes');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'sendEmail':
        return this.sendEmail(params);
      case 'sendBulkEmail':
        return this.sendBulkEmail(params);
      case 'getEmailStats':
        return this.getEmailStats(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async sendEmail(params: any): Promise<any> {
    const response = await this.client!.post('/mail/send', {
      personalizations: [{ to: params.to, subject: params.subject }],
      from: params.from,
      content: [{ type: 'text/html', value: params.html || params.text }]
    });
    return response.data;
  }

  private async sendBulkEmail(params: any): Promise<any> {
    const response = await this.client!.post('/mail/send', params);
    return response.data;
  }

  private async getEmailStats(params: any): Promise<any> {
    const response = await this.client!.get('/stats', { params });
    return response.data;
  }
}

/**
 * Slack Connector
 */
export class SlackConnector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Slack', ConnectorType.COMMUNICATION, 'slack', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    this.client = axios.create({
      baseURL: 'https://slack.com/api',
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials?.token}`
      }
    });
  }

  protected async onConnect(): Promise<void> {
    // No explicit connection needed
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      const response = await this.client.post('/auth.test');
      return response.data.ok;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'postMessage':
        return this.postMessage(params);
      case 'getChannels':
        return this.getChannels(params);
      case 'getUsers':
        return this.getUsers(params);
      case 'uploadFile':
        return this.uploadFile(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async postMessage(params: { channel: string; text: string; blocks?: any[] }): Promise<any> {
    const response = await this.client!.post('/chat.postMessage', params);
    return response.data;
  }

  private async getChannels(params: any): Promise<any> {
    const response = await this.client!.get('/conversations.list', { params });
    return response.data;
  }

  private async getUsers(params: any): Promise<any> {
    const response = await this.client!.get('/users.list', { params });
    return response.data;
  }

  private async uploadFile(params: any): Promise<any> {
    const response = await this.client!.post('/files.upload', params);
    return response.data;
  }
}

/**
 * Microsoft Teams Connector
 */
export class TeamsConnector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Microsoft Teams', ConnectorType.COMMUNICATION, 'teams', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    this.client = axios.create({
      baseURL: 'https://graph.microsoft.com/v1.0',
      timeout: this.config.timeout
    });
  }

  protected async onConnect(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    // OAuth2 authentication
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${this.credentials?.custom?.tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: this.credentials?.clientId || '',
        client_secret: this.credentials?.clientSecret || '',
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      })
    );

    this.client.defaults.headers.common['Authorization'] = `Bearer ${tokenResponse.data.access_token}`;
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('/me');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'sendMessage':
        return this.sendMessage(params);
      case 'getTeams':
        return this.getTeams(params);
      case 'getChannels':
        return this.getChannels(params);
      case 'createChannel':
        return this.createChannel(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async sendMessage(params: { teamId: string; channelId: string; message: any }): Promise<any> {
    const response = await this.client!.post(
      `/teams/${params.teamId}/channels/${params.channelId}/messages`,
      params.message
    );
    return response.data;
  }

  private async getTeams(params: any): Promise<any> {
    const response = await this.client!.get('/me/joinedTeams');
    return response.data;
  }

  private async getChannels(params: { teamId: string }): Promise<any> {
    const response = await this.client!.get(`/teams/${params.teamId}/channels`);
    return response.data;
  }

  private async createChannel(params: { teamId: string; channel: any }): Promise<any> {
    const response = await this.client!.post(`/teams/${params.teamId}/channels`, params.channel);
    return response.data;
  }
}

/**
 * Discord Connector
 */
export class DiscordConnector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Discord', ConnectorType.COMMUNICATION, 'discord', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    this.client = axios.create({
      baseURL: 'https://discord.com/api/v10',
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${this.credentials?.token}`
      }
    });
  }

  protected async onConnect(): Promise<void> {
    // No explicit connection needed
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('/users/@me');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'sendMessage':
        return this.sendMessage(params);
      case 'getGuilds':
        return this.getGuilds(params);
      case 'getChannels':
        return this.getChannels(params);
      case 'createChannel':
        return this.createChannel(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async sendMessage(params: { channelId: string; content: string; embeds?: any[] }): Promise<any> {
    const response = await this.client!.post(`/channels/${params.channelId}/messages`, {
      content: params.content,
      embeds: params.embeds
    });
    return response.data;
  }

  private async getGuilds(params: any): Promise<any> {
    const response = await this.client!.get('/users/@me/guilds');
    return response.data;
  }

  private async getChannels(params: { guildId: string }): Promise<any> {
    const response = await this.client!.get(`/guilds/${params.guildId}/channels`);
    return response.data;
  }

  private async createChannel(params: { guildId: string; channel: any }): Promise<any> {
    const response = await this.client!.post(`/guilds/${params.guildId}/channels`, params.channel);
    return response.data;
  }
}
