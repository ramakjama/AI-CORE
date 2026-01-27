/**
 * Push Notification Provider
 * Firebase Cloud Messaging (FCM) implementation
 */

import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

import { BaseProvider, ProviderConfig, ProviderResponse, DeliveryStatus, WebhookPayload } from './base.provider';
import { Channel, ChannelStatus } from '../types/channel.types';
import { SendMessageRequest, SendMessageResponse, MessageStatus } from '../types/message.types';

export interface PushProviderConfig extends ProviderConfig {
  projectId: string;
  privateKey?: string;
  clientEmail?: string;
  serviceAccountPath?: string;
  databaseUrl?: string;
}

export interface PushProvider {
  send(request: SendMessageRequest): Promise<ProviderResponse<SendMessageResponse>>;
  sendToTopic(request: PushTopicRequest): Promise<ProviderResponse<SendMessageResponse>>;
  sendToCondition(request: PushConditionRequest): Promise<ProviderResponse<SendMessageResponse>>;
  sendMulticast(request: PushMulticastRequest): Promise<ProviderResponse<PushMulticastResponse>>;
  subscribeToTopic(tokens: string[], topic: string): Promise<ProviderResponse<TopicSubscriptionResponse>>;
  unsubscribeFromTopic(tokens: string[], topic: string): Promise<ProviderResponse<TopicSubscriptionResponse>>;
}

export interface PushNotification {
  title: string;
  body: string;
  imageUrl?: string;
  icon?: string;
  clickAction?: string;
  tag?: string;
  color?: string;
  sound?: string;
  badge?: number;
}

export interface PushData {
  [key: string]: string;
}

export interface PushTopicRequest extends SendMessageRequest {
  topic: string;
  notification?: PushNotification;
  data?: PushData;
}

export interface PushConditionRequest extends SendMessageRequest {
  condition: string;
  notification?: PushNotification;
  data?: PushData;
}

export interface PushMulticastRequest extends SendMessageRequest {
  tokens: string[];
  notification?: PushNotification;
  data?: PushData;
}

export interface PushMulticastResponse {
  successCount: number;
  failureCount: number;
  responses: Array<{
    token: string;
    success: boolean;
    messageId?: string;
    error?: {
      code: string;
      message: string;
    };
  }>;
}

export interface TopicSubscriptionResponse {
  successCount: number;
  failureCount: number;
  errors: Array<{
    index: number;
    error: {
      code: string;
      message: string;
    };
  }>;
}

/**
 * Firebase Cloud Messaging Provider Implementation
 */
export class FirebasePushProvider extends BaseProvider implements PushProvider {
  private messaging: admin.messaging.Messaging | null = null;
  private pushConfig: PushProviderConfig;
  private app: admin.app.App | null = null;

  constructor(config: PushProviderConfig) {
    super(Channel.PUSH, config);
    this.pushConfig = config;
  }

  /**
   * Initialize Firebase Admin SDK
   */
  async initialize(): Promise<void> {
    if (!this.pushConfig.projectId) {
      throw new Error('Firebase Project ID is required');
    }

    try {
      let credential: admin.credential.Credential;

      if (this.pushConfig.serviceAccountPath) {
        // Use service account file
        const serviceAccount = require(this.pushConfig.serviceAccountPath);
        credential = admin.credential.cert(serviceAccount);
      } else if (this.pushConfig.privateKey && this.pushConfig.clientEmail) {
        // Use inline credentials
        credential = admin.credential.cert({
          projectId: this.pushConfig.projectId,
          privateKey: this.pushConfig.privateKey.replace(/\\n/g, '\n'),
          clientEmail: this.pushConfig.clientEmail
        });
      } else {
        // Use application default credentials
        credential = admin.credential.applicationDefault();
      }

      // Check if app already exists
      try {
        this.app = admin.app('ai-comms-push');
      } catch {
        this.app = admin.initializeApp({
          credential,
          projectId: this.pushConfig.projectId,
          databaseURL: this.pushConfig.databaseUrl
        }, 'ai-comms-push');
      }

      this.messaging = this.app.messaging();
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Firebase: ${error}`);
    }
  }

  /**
   * Send push notification to a single device
   */
  async send(request: SendMessageRequest): Promise<ProviderResponse<SendMessageResponse>> {
    if (!this.initialized || !this.messaging) {
      await this.initialize();
    }

    const deviceToken = request.recipient.deviceToken;
    if (!deviceToken) {
      return {
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Device token is required',
          retryable: false
        }
      };
    }

    try {
      const message: admin.messaging.Message = {
        token: deviceToken,
        notification: {
          title: request.content?.subject || '',
          body: request.content?.body || '',
          imageUrl: request.content?.mediaUrl
        },
        data: this.buildData(request),
        android: this.buildAndroidConfig(request),
        apns: this.buildApnsConfig(request),
        webpush: this.buildWebpushConfig(request)
      };

      const response = await this.withRetry(() => this.messaging!.send(message));

      return {
        success: true,
        data: {
          messageId: uuidv4(),
          externalId: response,
          status: MessageStatus.SENT,
          channel: Channel.PUSH
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Send push notification to a topic
   */
  async sendToTopic(request: PushTopicRequest): Promise<ProviderResponse<SendMessageResponse>> {
    if (!this.initialized || !this.messaging) {
      await this.initialize();
    }

    try {
      const message: admin.messaging.Message = {
        topic: request.topic,
        notification: request.notification ? {
          title: request.notification.title,
          body: request.notification.body,
          imageUrl: request.notification.imageUrl
        } : undefined,
        data: request.data,
        android: this.buildAndroidConfig(request),
        apns: this.buildApnsConfig(request),
        webpush: this.buildWebpushConfig(request)
      };

      const response = await this.withRetry(() => this.messaging!.send(message));

      return {
        success: true,
        data: {
          messageId: uuidv4(),
          externalId: response,
          status: MessageStatus.SENT,
          channel: Channel.PUSH,
          metadata: {
            topic: request.topic
          }
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Send push notification to a condition
   */
  async sendToCondition(request: PushConditionRequest): Promise<ProviderResponse<SendMessageResponse>> {
    if (!this.initialized || !this.messaging) {
      await this.initialize();
    }

    try {
      const message: admin.messaging.Message = {
        condition: request.condition,
        notification: request.notification ? {
          title: request.notification.title,
          body: request.notification.body,
          imageUrl: request.notification.imageUrl
        } : undefined,
        data: request.data,
        android: this.buildAndroidConfig(request),
        apns: this.buildApnsConfig(request),
        webpush: this.buildWebpushConfig(request)
      };

      const response = await this.withRetry(() => this.messaging!.send(message));

      return {
        success: true,
        data: {
          messageId: uuidv4(),
          externalId: response,
          status: MessageStatus.SENT,
          channel: Channel.PUSH,
          metadata: {
            condition: request.condition
          }
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendMulticast(request: PushMulticastRequest): Promise<ProviderResponse<PushMulticastResponse>> {
    if (!this.initialized || !this.messaging) {
      await this.initialize();
    }

    if (!request.tokens?.length) {
      return {
        success: false,
        error: {
          code: 'MISSING_TOKENS',
          message: 'At least one device token is required',
          retryable: false
        }
      };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: request.tokens,
        notification: request.notification ? {
          title: request.notification.title,
          body: request.notification.body,
          imageUrl: request.notification.imageUrl
        } : undefined,
        data: request.data,
        android: this.buildAndroidConfig(request),
        apns: this.buildApnsConfig(request),
        webpush: this.buildWebpushConfig(request)
      };

      const response = await this.withRetry(() => this.messaging!.sendEachForMulticast(message));

      const responses = response.responses.map((res, idx) => ({
        token: request.tokens[idx],
        success: res.success,
        messageId: res.messageId,
        error: res.error ? {
          code: res.error.code,
          message: res.error.message
        } : undefined
      }));

      return {
        success: response.failureCount === 0,
        data: {
          successCount: response.successCount,
          failureCount: response.failureCount,
          responses
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Subscribe devices to a topic
   */
  async subscribeToTopic(
    tokens: string[],
    topic: string
  ): Promise<ProviderResponse<TopicSubscriptionResponse>> {
    if (!this.initialized || !this.messaging) {
      await this.initialize();
    }

    try {
      const response = await this.messaging!.subscribeToTopic(tokens, topic);

      return {
        success: response.failureCount === 0,
        data: {
          successCount: response.successCount,
          failureCount: response.failureCount,
          errors: response.errors.map(err => ({
            index: err.index,
            error: {
              code: err.error.code,
              message: err.error.message
            }
          }))
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Unsubscribe devices from a topic
   */
  async unsubscribeFromTopic(
    tokens: string[],
    topic: string
  ): Promise<ProviderResponse<TopicSubscriptionResponse>> {
    if (!this.initialized || !this.messaging) {
      await this.initialize();
    }

    try {
      const response = await this.messaging!.unsubscribeFromTopic(tokens, topic);

      return {
        success: response.failureCount === 0,
        data: {
          successCount: response.successCount,
          failureCount: response.failureCount,
          errors: response.errors.map(err => ({
            index: err.index,
            error: {
              code: err.error.code,
              message: err.error.message
            }
          }))
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get message status (FCM doesn't provide direct status check)
   */
  async getStatus(messageId: string): Promise<ProviderResponse<DeliveryStatus>> {
    // FCM doesn't provide a direct API for checking message status
    // Status is typically tracked via client-side callbacks
    return {
      success: true,
      data: {
        messageId,
        externalId: messageId,
        status: MessageStatus.SENT,
        timestamp: new Date()
      }
    };
  }

  /**
   * Cancel a message (not supported by FCM)
   */
  async cancel(messageId: string): Promise<ProviderResponse<boolean>> {
    return {
      success: false,
      error: {
        code: 'NOT_SUPPORTED',
        message: 'FCM does not support message cancellation',
        retryable: false
      }
    };
  }

  /**
   * Validate webhook (FCM doesn't use webhooks)
   */
  validateWebhook(payload: unknown, signature: string): boolean {
    // FCM doesn't use webhooks for delivery status
    return false;
  }

  /**
   * Parse webhook (FCM doesn't use webhooks)
   */
  parseWebhook(payload: unknown): WebhookPayload {
    return {
      provider: 'firebase',
      event: 'unknown',
      timestamp: new Date(),
      data: payload as Record<string, unknown>
    };
  }

  /**
   * Health check for Firebase
   */
  async healthCheck(): Promise<ChannelStatus> {
    const startTime = Date.now();

    try {
      if (!this.initialized || !this.messaging) {
        await this.initialize();
      }

      // Simple health check - verify app is initialized
      const isHealthy = this.app !== null && this.messaging !== null;

      return {
        channel: Channel.PUSH,
        isAvailable: isHealthy,
        lastChecked: new Date(),
        latencyMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        channel: Channel.PUSH,
        isAvailable: false,
        lastChecked: new Date(),
        latencyMs: Date.now() - startTime,
        errorRate: 100
      };
    }
  }

  /**
   * Build data payload from request
   */
  private buildData(request: SendMessageRequest): PushData | undefined {
    if (!request.metadata) return undefined;

    const data: PushData = {};
    for (const [key, value] of Object.entries(request.metadata)) {
      data[key] = String(value);
    }

    if (request.campaignId) {
      data.campaignId = request.campaignId;
    }

    return Object.keys(data).length > 0 ? data : undefined;
  }

  /**
   * Build Android-specific config
   */
  private buildAndroidConfig(request: SendMessageRequest): admin.messaging.AndroidConfig {
    return {
      priority: request.priority && request.priority >= 3 ? 'high' : 'normal',
      ttl: 86400000, // 24 hours
      notification: {
        sound: 'default',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        channelId: request.metadata?.channelId as string || 'default'
      }
    };
  }

  /**
   * Build APNS (iOS) config
   */
  private buildApnsConfig(request: SendMessageRequest): admin.messaging.ApnsConfig {
    return {
      payload: {
        aps: {
          sound: 'default',
          badge: request.metadata?.badge as number || 1,
          'content-available': 1
        }
      },
      headers: {
        'apns-priority': request.priority && request.priority >= 3 ? '10' : '5',
        'apns-expiration': String(Math.floor(Date.now() / 1000) + 86400) // 24 hours
      }
    };
  }

  /**
   * Build Web Push config
   */
  private buildWebpushConfig(request: SendMessageRequest): admin.messaging.WebpushConfig {
    return {
      notification: {
        icon: request.metadata?.icon as string || '/icon.png',
        badge: request.metadata?.badge as string || '/badge.png',
        requireInteraction: true
      },
      fcmOptions: {
        link: request.metadata?.link as string
      }
    };
  }

  /**
   * Handle Firebase errors
   */
  private handleError(error: unknown): ProviderResponse {
    const fcmError = error as {
      code?: string;
      message?: string;
      errorInfo?: {
        code: string;
        message: string;
      };
    };

    const errorCode = fcmError.errorInfo?.code || fcmError.code || 'FCM_ERROR';
    const errorMessage = fcmError.errorInfo?.message || fcmError.message || 'Unknown FCM error';

    // Determine if error is retryable
    const retryableCodes = [
      'messaging/server-unavailable',
      'messaging/internal-error',
      'messaging/unknown-error'
    ];

    const isRetryable = retryableCodes.some(code =>
      errorCode.includes(code) || (fcmError.code || '').includes(code)
    );

    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        retryable: isRetryable
      },
      rawResponse: error
    };
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    if (this.app) {
      await this.app.delete();
      this.app = null;
      this.messaging = null;
      this.initialized = false;
    }
  }
}

/**
 * Factory function for creating Push provider
 */
export function createPushProvider(config: PushProviderConfig): PushProvider {
  return new FirebasePushProvider(config);
}
