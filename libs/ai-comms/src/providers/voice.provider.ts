/**
 * Voice Provider
 * Twilio Voice implementation for voice calls
 */

import { Twilio } from 'twilio';
import { CallInstance } from 'twilio/lib/rest/api/v2010/account/call';
import { v4 as uuidv4 } from 'uuid';
import { VoiceResponse } from 'twilio/lib/twiml/VoiceResponse';

import { BaseProvider, ProviderConfig, ProviderResponse, DeliveryStatus, WebhookPayload } from './base.provider';
import { Channel, ChannelStatus } from '../types/channel.types';
import { SendMessageRequest, SendMessageResponse, MessageStatus } from '../types/message.types';
import { phoneFormatter } from '../utils/phone-formatter';

export interface VoiceProviderConfig extends ProviderConfig {
  accountSid: string;
  authToken: string;
  defaultFromNumber?: string;
  statusCallbackUrl?: string;
  twimlAppSid?: string;
  recordCalls?: boolean;
  machineDetection?: 'Enable' | 'DetectMessageEnd';
  defaultVoice?: string;
  defaultLanguage?: string;
}

export interface VoiceProvider {
  call(request: VoiceCallRequest): Promise<ProviderResponse<SendMessageResponse>>;
  sendVoiceMessage(request: SendMessageRequest): Promise<ProviderResponse<SendMessageResponse>>;
  getStatus(callId: string): Promise<ProviderResponse<VoiceCallStatus>>;
  endCall(callId: string): Promise<ProviderResponse<boolean>>;
  generateTwiML(options: TwiMLOptions): string;
}

export interface VoiceCallRequest extends SendMessageRequest {
  twimlUrl?: string;
  twiml?: string;
  record?: boolean;
  timeout?: number;
  machineDetection?: 'Enable' | 'DetectMessageEnd';
  asyncAmd?: boolean;
  asyncAmdStatusCallback?: string;
  callerId?: string;
  callReason?: string;
}

export interface VoiceCallStatus extends DeliveryStatus {
  callStatus: string;
  duration?: number;
  direction?: string;
  answeredBy?: string;
  startTime?: Date;
  endTime?: Date;
  recordingUrl?: string;
  recordingDuration?: number;
  price?: number;
  priceUnit?: string;
}

export interface TwiMLOptions {
  message?: string;
  voice?: string;
  language?: string;
  gather?: {
    numDigits?: number;
    timeout?: number;
    action?: string;
    method?: 'GET' | 'POST';
    input?: 'dtmf' | 'speech' | 'dtmf speech';
    speechTimeout?: number;
    speechModel?: string;
    hints?: string;
    prompt?: string;
  };
  record?: {
    action?: string;
    method?: 'GET' | 'POST';
    maxLength?: number;
    timeout?: number;
    transcribe?: boolean;
    transcribeCallback?: string;
    playBeep?: boolean;
  };
  dial?: {
    number?: string;
    sipUri?: string;
    timeout?: number;
    callerId?: string;
    record?: boolean;
    action?: string;
  };
  play?: {
    url: string;
    loop?: number;
  };
  redirect?: string;
  hangup?: boolean;
  pause?: number;
}

/**
 * Twilio Voice Provider Implementation
 */
export class TwilioVoiceProvider extends BaseProvider implements VoiceProvider {
  private client: Twilio;
  private voiceConfig: VoiceProviderConfig;

  constructor(config: VoiceProviderConfig) {
    super(Channel.VOICE, config);
    this.voiceConfig = config;
    this.client = new Twilio(config.accountSid, config.authToken);
  }

  /**
   * Initialize Twilio Voice client
   */
  async initialize(): Promise<void> {
    if (!this.voiceConfig.accountSid || !this.voiceConfig.authToken) {
      throw new Error('Twilio Account SID and Auth Token are required');
    }

    try {
      await this.client.api.accounts(this.voiceConfig.accountSid).fetch();
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Twilio Voice: ${error}`);
    }
  }

  /**
   * Make a voice call
   */
  async call(request: VoiceCallRequest): Promise<ProviderResponse<SendMessageResponse>> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const toNumber = phoneFormatter.toE164(request.recipient.phone!);
      if (!toNumber) {
        return {
          success: false,
          error: {
            code: 'INVALID_PHONE',
            message: 'Invalid recipient phone number',
            retryable: false
          }
        };
      }

      const fromNumber = request.sender?.phone ||
                         request.callerId ||
                         this.voiceConfig.defaultFromNumber;

      if (!fromNumber) {
        return {
          success: false,
          error: {
            code: 'MISSING_FROM',
            message: 'From phone number is required',
            retryable: false
          }
        };
      }

      const callOptions: Record<string, unknown> = {
        to: toNumber,
        from: phoneFormatter.toE164(fromNumber)
      };

      // TwiML URL or inline TwiML
      if (request.twimlUrl) {
        callOptions.url = request.twimlUrl;
      } else if (request.twiml) {
        callOptions.twiml = request.twiml;
      } else if (request.content?.body) {
        // Generate TwiML from message content
        callOptions.twiml = this.generateTwiML({
          message: request.content.body,
          voice: this.voiceConfig.defaultVoice,
          language: this.voiceConfig.defaultLanguage
        });
      } else {
        return {
          success: false,
          error: {
            code: 'MISSING_CONTENT',
            message: 'TwiML URL, TwiML content, or message body is required',
            retryable: false
          }
        };
      }

      // Status callback
      if (this.voiceConfig.statusCallbackUrl) {
        callOptions.statusCallback = this.voiceConfig.statusCallbackUrl;
        callOptions.statusCallbackEvent = ['initiated', 'ringing', 'answered', 'completed'];
        callOptions.statusCallbackMethod = 'POST';
      }

      // Recording
      if (request.record ?? this.voiceConfig.recordCalls) {
        callOptions.record = true;
        callOptions.recordingStatusCallback = this.voiceConfig.statusCallbackUrl;
      }

      // Machine detection
      if (request.machineDetection || this.voiceConfig.machineDetection) {
        callOptions.machineDetection = request.machineDetection || this.voiceConfig.machineDetection;
        if (request.asyncAmd) {
          callOptions.asyncAmd = true;
          callOptions.asyncAmdStatusCallback = request.asyncAmdStatusCallback || this.voiceConfig.statusCallbackUrl;
        }
      }

      // Timeout
      if (request.timeout) {
        callOptions.timeout = request.timeout;
      }

      const call: CallInstance = await this.withRetry(() =>
        this.client.calls.create(callOptions as any)
      );

      const messageId = uuidv4();

      return {
        success: true,
        data: {
          messageId,
          externalId: call.sid,
          status: this.mapTwilioCallStatus(call.status),
          channel: Channel.VOICE,
          metadata: {
            direction: call.direction,
            from: call.from,
            to: call.to
          }
        },
        rawResponse: call
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Send a voice message (text-to-speech)
   */
  async sendVoiceMessage(request: SendMessageRequest): Promise<ProviderResponse<SendMessageResponse>> {
    const twiml = this.generateTwiML({
      message: request.content?.body || '',
      voice: this.voiceConfig.defaultVoice,
      language: this.voiceConfig.defaultLanguage
    });

    return this.call({
      ...request,
      twiml
    });
  }

  /**
   * Send a message - alias for voice message
   */
  async send(request: SendMessageRequest): Promise<ProviderResponse<SendMessageResponse>> {
    return this.sendVoiceMessage(request);
  }

  /**
   * Get call status
   */
  async getStatus(callId: string): Promise<ProviderResponse<VoiceCallStatus>> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const call = await this.client.calls(callId).fetch();

      // Get recordings if available
      let recordingUrl: string | undefined;
      let recordingDuration: number | undefined;

      try {
        const recordings = await this.client.calls(callId).recordings.list({ limit: 1 });
        if (recordings.length > 0) {
          recordingUrl = recordings[0].uri;
          recordingDuration = recordings[0].duration ? parseInt(recordings[0].duration) : undefined;
        }
      } catch {
        // Recordings may not be available
      }

      return {
        success: true,
        data: {
          messageId: callId,
          externalId: call.sid,
          status: this.mapTwilioCallStatus(call.status),
          timestamp: call.dateUpdated || new Date(),
          callStatus: call.status,
          duration: call.duration ? parseInt(call.duration) : undefined,
          direction: call.direction,
          answeredBy: call.answeredBy || undefined,
          startTime: call.startTime || undefined,
          endTime: call.endTime || undefined,
          recordingUrl,
          recordingDuration,
          price: call.price ? parseFloat(call.price) : undefined,
          priceUnit: call.priceUnit || undefined
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * End an active call
   */
  async endCall(callId: string): Promise<ProviderResponse<boolean>> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      await this.client.calls(callId).update({ status: 'completed' });
      return {
        success: true,
        data: true
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Cancel a call (if not yet connected)
   */
  async cancel(callId: string): Promise<ProviderResponse<boolean>> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      await this.client.calls(callId).update({ status: 'canceled' });
      return {
        success: true,
        data: true
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generate TwiML from options
   */
  generateTwiML(options: TwiMLOptions): string {
    const response = new VoiceResponse();

    // Pause
    if (options.pause) {
      response.pause({ length: options.pause });
    }

    // Play audio file
    if (options.play) {
      response.play({ loop: options.play.loop }, options.play.url);
    }

    // Gather input
    if (options.gather) {
      const gather = response.gather({
        numDigits: options.gather.numDigits,
        timeout: options.gather.timeout,
        action: options.gather.action,
        method: options.gather.method,
        input: options.gather.input as any,
        speechTimeout: options.gather.speechTimeout ? String(options.gather.speechTimeout) : undefined,
        speechModel: options.gather.speechModel,
        hints: options.gather.hints
      });

      if (options.gather.prompt) {
        gather.say({
          voice: options.voice as any || 'Polly.Lucia',
          language: options.language as any || 'es-ES'
        }, options.gather.prompt);
      }
    }

    // Text-to-speech message
    if (options.message) {
      response.say({
        voice: options.voice as any || 'Polly.Lucia',
        language: options.language as any || 'es-ES'
      }, options.message);
    }

    // Record
    if (options.record) {
      response.record({
        action: options.record.action,
        method: options.record.method,
        maxLength: options.record.maxLength,
        timeout: options.record.timeout,
        transcribe: options.record.transcribe,
        transcribeCallback: options.record.transcribeCallback,
        playBeep: options.record.playBeep
      });
    }

    // Dial
    if (options.dial) {
      const dial = response.dial({
        timeout: options.dial.timeout,
        callerId: options.dial.callerId,
        record: options.dial.record ? 'record-from-answer' as any : undefined,
        action: options.dial.action
      });

      if (options.dial.number) {
        dial.number(options.dial.number);
      } else if (options.dial.sipUri) {
        dial.sip(options.dial.sipUri);
      }
    }

    // Redirect
    if (options.redirect) {
      response.redirect(options.redirect);
    }

    // Hangup
    if (options.hangup) {
      response.hangup();
    }

    return response.toString();
  }

  /**
   * Validate Twilio Voice webhook signature
   */
  validateWebhook(payload: unknown, signature: string): boolean {
    if (!this.voiceConfig.webhookSecret || !this.voiceConfig.statusCallbackUrl) {
      return false;
    }

    const twilio = require('twilio');
    const params = payload as Record<string, string>;

    return twilio.validateRequest(
      this.voiceConfig.authToken,
      signature,
      this.voiceConfig.statusCallbackUrl,
      params
    );
  }

  /**
   * Parse Twilio Voice webhook payload
   */
  parseWebhook(payload: unknown): WebhookPayload {
    const data = payload as Record<string, string>;

    return {
      provider: 'twilio-voice',
      event: data.CallStatus || 'unknown',
      messageId: data.CallSid,
      externalId: data.CallSid,
      timestamp: new Date(),
      data: {
        status: this.mapTwilioCallStatus(data.CallStatus),
        from: data.From,
        to: data.To,
        direction: data.Direction,
        duration: data.CallDuration ? parseInt(data.CallDuration) : undefined,
        answeredBy: data.AnsweredBy,
        machineDetectionDuration: data.MachineDetectionDuration,
        recordingUrl: data.RecordingUrl,
        recordingDuration: data.RecordingDuration ? parseInt(data.RecordingDuration) : undefined,
        digits: data.Digits,
        speechResult: data.SpeechResult,
        confidence: data.Confidence ? parseFloat(data.Confidence) : undefined
      }
    };
  }

  /**
   * Health check for Twilio Voice
   */
  async healthCheck(): Promise<ChannelStatus> {
    const startTime = Date.now();

    try {
      await this.client.api.accounts(this.voiceConfig.accountSid).fetch();

      return {
        channel: Channel.VOICE,
        isAvailable: true,
        lastChecked: new Date(),
        latencyMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        channel: Channel.VOICE,
        isAvailable: false,
        lastChecked: new Date(),
        latencyMs: Date.now() - startTime,
        errorRate: 100
      };
    }
  }

  /**
   * Map Twilio call status to internal status
   */
  private mapTwilioCallStatus(status: string): MessageStatus {
    const statusMap: Record<string, MessageStatus> = {
      queued: MessageStatus.QUEUED,
      ringing: MessageStatus.SENDING,
      'in-progress': MessageStatus.SENT,
      completed: MessageStatus.DELIVERED,
      busy: MessageStatus.FAILED,
      failed: MessageStatus.FAILED,
      'no-answer': MessageStatus.FAILED,
      canceled: MessageStatus.CANCELLED
    };

    return statusMap[status?.toLowerCase()] || MessageStatus.PENDING;
  }

  /**
   * Handle Twilio errors
   */
  private handleError(error: unknown): ProviderResponse {
    const twilioError = error as {
      code?: number;
      message?: string;
      status?: number;
      moreInfo?: string;
    };

    const isRetryable = twilioError.status ? twilioError.status >= 500 : false;

    return {
      success: false,
      error: {
        code: String(twilioError.code || 'TWILIO_VOICE_ERROR'),
        message: twilioError.message || 'Unknown Twilio Voice error',
        retryable: isRetryable,
        details: {
          moreInfo: twilioError.moreInfo
        }
      },
      rawResponse: error
    };
  }
}

/**
 * Factory function for creating Voice provider
 */
export function createVoiceProvider(config: VoiceProviderConfig): VoiceProvider {
  return new TwilioVoiceProvider(config);
}
