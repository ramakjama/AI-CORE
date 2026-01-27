/**
 * Voice Service
 *
 * Handles all voice communications via Twilio
 * Features: Calls, IVR, recording, transcription, conferencing
 */

import { Twilio } from 'twilio';
import { VoiceResponse } from 'twilio/lib/twiml/VoiceResponse';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'eventemitter3';

import {
  VoiceCall,
  VoiceRecording,
  VoiceTranscription,
  IVRConfig,
  IVRMenuOption,
  ScreenPopData,
  CallStatus,
  CallDirection,
  MessageStatus,
  ChannelType,
  CommunicationEvent,
  WebhookResult,
  Contact
} from '../types';

/**
 * Voice service configuration
 */
export interface VoiceServiceConfig {
  tenantId: string;
  accountSid: string;
  authToken: string;
  defaultFrom?: string;
  statusCallbackUrl?: string;
  recordingsEnabled?: boolean;
  transcriptionEnabled?: boolean;
  twimlAppSid?: string;
}

/**
 * Twilio voice webhook payload
 */
export interface TwilioVoiceWebhook {
  CallSid: string;
  AccountSid: string;
  From: string;
  To: string;
  CallStatus: string;
  ApiVersion: string;
  Direction: string;
  ForwardedFrom?: string;
  CallerName?: string;
  ParentCallSid?: string;
  CallDuration?: string;
  RecordingUrl?: string;
  RecordingSid?: string;
  RecordingDuration?: string;
  Digits?: string;
  SpeechResult?: string;
  Confidence?: string;
  TranscriptionSid?: string;
  TranscriptionText?: string;
  TranscriptionStatus?: string;
  TranscriptionUrl?: string;
}

/**
 * Call initiation options
 */
export interface InitiateCallOptions {
  from?: string;
  statusCallback?: string;
  statusCallbackMethod?: 'POST' | 'GET';
  statusCallbackEvent?: string[];
  machineDetection?: 'Enable' | 'DetectMessageEnd';
  machineDetectionTimeout?: number;
  timeout?: number;
  record?: boolean;
  recordingStatusCallback?: string;
  trim?: 'trim-silence' | 'do-not-trim';
}

/**
 * Voice Service Class
 */
export class VoiceService extends EventEmitter {
  private config: VoiceServiceConfig;
  private client: Twilio;
  private activeCalls: Map<string, VoiceCall> = new Map();
  private ivrConfigs: Map<string, IVRConfig> = new Map();
  private recordings: Map<string, VoiceRecording> = new Map();
  private transcriptions: Map<string, VoiceTranscription> = new Map();
  private contactLookup: (phone: string) => Promise<Contact | null>;

  constructor(
    config: VoiceServiceConfig,
    contactLookup?: (phone: string) => Promise<Contact | null>
  ) {
    super();
    this.config = config;
    this.client = new Twilio(config.accountSid, config.authToken);
    this.contactLookup = contactLookup || (async () => null);
  }

  /**
   * Initiate an outbound call
   */
  async initiateCall(
    to: string,
    callbackUrl: string,
    options?: InitiateCallOptions
  ): Promise<{
    success: boolean;
    callSid?: string;
    error?: { code: string; message: string };
  }> {
    try {
      const from = options?.from || this.config.defaultFrom;

      if (!from) {
        return {
          success: false,
          error: {
            code: 'NO_FROM_NUMBER',
            message: 'No from number specified'
          }
        };
      }

      const callOptions: any = {
        to,
        from,
        url: callbackUrl,
        statusCallback: options?.statusCallback || this.config.statusCallbackUrl,
        statusCallbackMethod: options?.statusCallbackMethod || 'POST',
        statusCallbackEvent: options?.statusCallbackEvent || ['initiated', 'ringing', 'answered', 'completed']
      };

      // Machine detection
      if (options?.machineDetection) {
        callOptions.machineDetection = options.machineDetection;
        callOptions.machineDetectionTimeout = options.machineDetectionTimeout || 30;
      }

      // Timeout
      if (options?.timeout) {
        callOptions.timeout = options.timeout;
      }

      // Recording
      if (options?.record || this.config.recordingsEnabled) {
        callOptions.record = true;
        callOptions.recordingStatusCallback = options?.recordingStatusCallback;
        callOptions.trim = options?.trim || 'trim-silence';
      }

      const call = await this.client.calls.create(callOptions);

      // Store call
      const voiceCall: VoiceCall = {
        id: uuidv4(),
        tenantId: this.config.tenantId,
        channel: ChannelType.VOICE,
        status: MessageStatus.SENT,
        direction: CallDirection.OUTBOUND,
        from,
        to,
        callSid: call.sid,
        accountSid: call.accountSid,
        callStatus: CallStatus.INITIATED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.activeCalls.set(call.sid, voiceCall);

      this.emitEvent('call.initiated', call.sid, {
        to,
        from
      });

      return {
        success: true,
        callSid: call.sid
      };
    } catch (error) {
      const err = error as Error & { code?: number };
      return {
        success: false,
        error: {
          code: err.code?.toString() || 'CALL_FAILED',
          message: err.message
        }
      };
    }
  }

  /**
   * Handle incoming call webhook
   */
  async handleIncoming(
    callSid: string,
    from: string,
    to: string,
    options?: {
      callerName?: string;
      forwardedFrom?: string;
    }
  ): Promise<WebhookResult> {
    try {
      // Store call
      const voiceCall: VoiceCall = {
        id: uuidv4(),
        tenantId: this.config.tenantId,
        channel: ChannelType.VOICE,
        status: MessageStatus.DELIVERED,
        direction: CallDirection.INBOUND,
        from,
        to,
        callSid,
        callStatus: CallStatus.RINGING,
        callerName: options?.callerName,
        forwardedFrom: options?.forwardedFrom,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.activeCalls.set(callSid, voiceCall);

      const event: CommunicationEvent = {
        id: uuidv4(),
        tenantId: this.config.tenantId,
        type: 'call.ringing',
        channel: ChannelType.VOICE,
        timestamp: new Date(),
        data: {
          callSid,
          contact: {
            phone: from,
            name: options?.callerName
          }
        }
      };

      this.emit('call.incoming', event);
      this.emit('event', event);

      return {
        processed: true,
        messageId: voiceCall.id,
        event
      };
    } catch (error) {
      const err = error as Error;
      return {
        processed: false,
        error: {
          code: 'INCOMING_CALL_ERROR',
          message: err.message
        }
      };
    }
  }

  /**
   * Generate IVR TwiML
   */
  generateIVR(config: IVRConfig): string {
    // Store config for later reference
    this.ivrConfigs.set(config.id, config);

    const response = new VoiceResponse();

    // Welcome message
    if (config.welcomeAudioUrl) {
      response.play(config.welcomeAudioUrl);
    } else if (config.welcomeMessage) {
      response.say({
        voice: config.voice || 'alice',
        language: config.language || 'en-US'
      }, config.welcomeMessage);
    }

    // Build menu
    const gather = response.gather({
      numDigits: 1,
      timeout: config.timeout || 5,
      action: `/voice/ivr/${config.id}/handle`,
      method: 'POST'
    });

    // Menu options announcement
    for (const option of config.options) {
      gather.say({
        voice: config.voice || 'alice',
        language: config.language || 'en-US'
      }, `Press ${option.digit} for ${option.description}.`);
    }

    // No input fallback
    if (config.timeoutMessage) {
      response.say({
        voice: config.voice || 'alice',
        language: config.language || 'en-US'
      }, config.timeoutMessage);
    }
    response.redirect(`/voice/ivr/${config.id}`);

    return response.toString();
  }

  /**
   * Handle IVR input
   */
  handleIVRInput(
    configId: string,
    digits: string,
    callSid: string
  ): string {
    const config = this.ivrConfigs.get(configId);

    if (!config) {
      const response = new VoiceResponse();
      response.say('System error. Please try again later.');
      response.hangup();
      return response.toString();
    }

    const option = config.options.find(o => o.digit === digits);
    const response = new VoiceResponse();

    if (!option) {
      if (config.invalidInputMessage) {
        response.say({
          voice: config.voice || 'alice',
          language: config.language || 'en-US'
        }, config.invalidInputMessage);
      }
      response.redirect(`/voice/ivr/${configId}`);
      return response.toString();
    }

    // Update call with IVR path
    const call = this.activeCalls.get(callSid);
    if (call) {
      if (!call.ivrPath) call.ivrPath = [];
      call.ivrPath.push(digits);
    }

    // Execute action
    return this.executeIVRAction(response, option, config);
  }

  /**
   * Execute IVR action
   */
  private executeIVRAction(
    response: VoiceResponse,
    option: IVRMenuOption,
    config: IVRConfig
  ): string {
    const actionData = option.actionData || {};

    switch (option.action) {
      case 'play':
        if (actionData.audioUrl) {
          response.play(actionData.audioUrl);
        }
        break;

      case 'say':
        if (actionData.message) {
          response.say({
            voice: actionData.voice || config.voice || 'alice',
            language: actionData.language || config.language || 'en-US'
          }, actionData.message);
        }
        break;

      case 'dial':
        if (actionData.destination) {
          const dial = response.dial({
            callerId: config.name
          });
          dial.number(actionData.destination);
        }
        break;

      case 'enqueue':
        if (actionData.queueName) {
          response.enqueue(actionData.queueName);
        }
        break;

      case 'record':
        response.record({
          action: '/voice/recording/complete',
          transcribe: this.config.transcriptionEnabled,
          transcribeCallback: '/voice/transcription/complete',
          maxLength: 120,
          playBeep: true
        });
        break;

      case 'redirect':
        if (actionData.redirectUrl) {
          response.redirect(actionData.redirectUrl);
        }
        break;

      case 'hangup':
        response.hangup();
        break;

      case 'gather':
        if (option.subMenu) {
          const subConfig: IVRConfig = {
            ...config,
            id: `${config.id}_sub`,
            options: option.subMenu
          };
          return this.generateIVR(subConfig);
        }
        break;
    }

    return response.toString();
  }

  /**
   * Play message or TTS to active call
   */
  async playMessage(
    callSid: string,
    content: string | { audioUrl: string },
    options?: {
      voice?: string;
      language?: string;
      loop?: number;
    }
  ): Promise<boolean> {
    try {
      const response = new VoiceResponse();

      if (typeof content === 'string') {
        response.say({
          voice: options?.voice || 'alice',
          language: options?.language || 'en-US',
          loop: options?.loop || 1
        }, content);
      } else {
        response.play({
          loop: options?.loop || 1
        }, content.audioUrl);
      }

      await this.client.calls(callSid).update({
        twiml: response.toString()
      });

      return true;
    } catch (error) {
      console.error('Error playing message:', error);
      return false;
    }
  }

  /**
   * Transfer call to another number or SIP
   */
  async transfer(
    callSid: string,
    to: string,
    options?: {
      callerId?: string;
      timeout?: number;
      record?: boolean;
      whisper?: string;
    }
  ): Promise<boolean> {
    try {
      const response = new VoiceResponse();
      const dial = response.dial({
        callerId: options?.callerId || this.config.defaultFrom,
        timeout: options?.timeout || 30,
        record: options?.record ? 'record-from-answer' : undefined,
        action: `/voice/transfer/${callSid}/complete`
      });

      // Add whisper if specified
      if (options?.whisper) {
        dial.number({
          url: `/voice/whisper?message=${encodeURIComponent(options.whisper)}`
        }, to);
      } else {
        if (to.startsWith('sip:')) {
          dial.sip(to);
        } else {
          dial.number(to);
        }
      }

      await this.client.calls(callSid).update({
        twiml: response.toString()
      });

      // Update call
      const call = this.activeCalls.get(callSid);
      if (call) {
        call.updatedAt = new Date();
      }

      return true;
    } catch (error) {
      console.error('Error transferring call:', error);
      return false;
    }
  }

  /**
   * Start recording a call
   */
  async record(
    callSid: string,
    options?: {
      playBeep?: boolean;
      trim?: 'trim-silence' | 'do-not-trim';
      transcribe?: boolean;
    }
  ): Promise<{ success: boolean; recordingSid?: string }> {
    try {
      const recording = await this.client.calls(callSid).recordings.create({
        recordingStatusCallback: `${this.config.statusCallbackUrl}/recording`,
        recordingStatusCallbackMethod: 'POST',
        trim: options?.trim || 'trim-silence'
      });

      // Store recording reference
      const voiceRecording: VoiceRecording = {
        id: uuidv4(),
        callSid,
        recordingSid: recording.sid,
        url: '',
        duration: 0,
        status: 'processing',
        createdAt: new Date()
      };

      this.recordings.set(recording.sid, voiceRecording);

      // Update call
      const call = this.activeCalls.get(callSid);
      if (call) {
        if (!call.recordings) call.recordings = [];
        call.recordings.push(voiceRecording);
      }

      return {
        success: true,
        recordingSid: recording.sid
      };
    } catch (error) {
      console.error('Error starting recording:', error);
      return { success: false };
    }
  }

  /**
   * Stop recording a call
   */
  async stopRecording(callSid: string, recordingSid?: string): Promise<boolean> {
    try {
      if (recordingSid) {
        await this.client.calls(callSid).recordings(recordingSid).update({
          status: 'stopped'
        });
      } else {
        // Stop all recordings for the call
        const recordings = await this.client.calls(callSid).recordings.list();
        for (const recording of recordings) {
          if (recording.status === 'in-progress') {
            await this.client.calls(callSid).recordings(recording.sid).update({
              status: 'stopped'
            });
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error stopping recording:', error);
      return false;
    }
  }

  /**
   * Get transcription for a recording
   */
  async getTranscription(recordingSid: string): Promise<VoiceTranscription | null> {
    // Check cache first
    if (this.transcriptions.has(recordingSid)) {
      return this.transcriptions.get(recordingSid) || null;
    }

    try {
      const transcriptions = await this.client.recordings(recordingSid).transcriptions.list();

      if (transcriptions.length === 0) {
        return null;
      }

      const transcription = transcriptions[0];
      const voiceTranscription: VoiceTranscription = {
        id: uuidv4(),
        recordingSid,
        transcriptionSid: transcription.sid,
        text: transcription.transcriptionText || '',
        status: transcription.status as any,
        createdAt: new Date(transcription.dateCreated)
      };

      this.transcriptions.set(recordingSid, voiceTranscription);

      return voiceTranscription;
    } catch (error) {
      console.error('Error getting transcription:', error);
      return null;
    }
  }

  /**
   * Create a conference call
   */
  async conference(
    callSids: string[],
    conferenceName?: string
  ): Promise<{ success: boolean; conferenceSid?: string }> {
    try {
      const name = conferenceName || `conf_${uuidv4().substring(0, 8)}`;

      for (const callSid of callSids) {
        const response = new VoiceResponse();
        const dial = response.dial();
        dial.conference({
          startConferenceOnEnter: true,
          endConferenceOnExit: false,
          statusCallback: `${this.config.statusCallbackUrl}/conference`,
          statusCallbackEvent: ['start', 'end', 'join', 'leave']
        }, name);

        await this.client.calls(callSid).update({
          twiml: response.toString()
        });

        // Update call with conference info
        const call = this.activeCalls.get(callSid);
        if (call) {
          call.conferenceInfo = {
            conferenceSid: '',
            conferenceName: name
          };
        }
      }

      return {
        success: true,
        conferenceSid: name
      };
    } catch (error) {
      console.error('Error creating conference:', error);
      return { success: false };
    }
  }

  /**
   * Add participant to conference
   */
  async addToConference(
    conferenceName: string,
    to: string,
    options?: {
      from?: string;
      muted?: boolean;
      hold?: boolean;
      coaching?: boolean;
    }
  ): Promise<boolean> {
    try {
      const conferences = await this.client.conferences.list({
        friendlyName: conferenceName,
        status: 'in-progress'
      });

      if (conferences.length === 0) {
        return false;
      }

      await this.client.conferences(conferences[0].sid).participants.create({
        to,
        from: options?.from || this.config.defaultFrom || '',
        muted: options?.muted,
        hold: options?.hold,
        coaching: options?.coaching
      });

      return true;
    } catch (error) {
      console.error('Error adding to conference:', error);
      return false;
    }
  }

  /**
   * Get screen pop data for incoming call
   */
  async screenPop(callSid: string): Promise<ScreenPopData | null> {
    const call = this.activeCalls.get(callSid);

    if (!call) {
      return null;
    }

    // Look up contact
    const contact = await this.contactLookup(call.from);

    const screenPopData: ScreenPopData = {
      callSid,
      from: call.from,
      to: call.to,
      direction: call.direction,
      contact: contact || undefined
    };

    // In a real implementation, you would also fetch:
    // - Recent conversations from database
    // - Open tickets from ticketing system
    // - Customer data from CRM

    return screenPopData;
  }

  /**
   * Handle status callback webhook
   */
  async handleStatusCallback(payload: TwilioVoiceWebhook): Promise<WebhookResult> {
    try {
      const call = this.activeCalls.get(payload.CallSid);

      if (call) {
        call.callStatus = this.mapTwilioStatus(payload.CallStatus);
        call.updatedAt = new Date();

        if (payload.CallDuration) {
          call.duration = parseInt(payload.CallDuration);
        }

        if (payload.CallStatus === 'completed' || payload.CallStatus === 'failed') {
          call.endTime = new Date();
        }
      }

      let eventType: CommunicationEvent['type'];
      switch (payload.CallStatus) {
        case 'ringing':
          eventType = 'call.ringing';
          break;
        case 'in-progress':
          eventType = 'call.answered';
          break;
        case 'completed':
          eventType = 'call.completed';
          break;
        case 'busy':
        case 'no-answer':
        case 'failed':
        case 'canceled':
          eventType = 'call.failed';
          break;
        default:
          eventType = 'call.initiated';
      }

      const event: CommunicationEvent = {
        id: uuidv4(),
        tenantId: this.config.tenantId,
        type: eventType,
        channel: ChannelType.VOICE,
        timestamp: new Date(),
        data: {
          callSid: payload.CallSid,
          metadata: {
            status: payload.CallStatus,
            duration: payload.CallDuration,
            from: payload.From,
            to: payload.To
          }
        }
      };

      this.emit(eventType, event);
      this.emit('event', event);

      return {
        processed: true,
        messageId: call?.id,
        event
      };
    } catch (error) {
      const err = error as Error;
      return {
        processed: false,
        error: {
          code: 'STATUS_CALLBACK_ERROR',
          message: err.message
        }
      };
    }
  }

  /**
   * Handle recording status callback
   */
  async handleRecordingCallback(payload: TwilioVoiceWebhook): Promise<WebhookResult> {
    try {
      if (payload.RecordingSid) {
        const recording = this.recordings.get(payload.RecordingSid);

        if (recording) {
          recording.url = payload.RecordingUrl || '';
          recording.duration = payload.RecordingDuration
            ? parseInt(payload.RecordingDuration)
            : 0;
          recording.status = 'completed';
        }
      }

      return {
        processed: true,
        messageId: payload.RecordingSid
      };
    } catch (error) {
      const err = error as Error;
      return {
        processed: false,
        error: {
          code: 'RECORDING_CALLBACK_ERROR',
          message: err.message
        }
      };
    }
  }

  /**
   * Handle transcription callback
   */
  async handleTranscriptionCallback(payload: TwilioVoiceWebhook): Promise<WebhookResult> {
    try {
      if (payload.TranscriptionSid && payload.RecordingSid) {
        const transcription: VoiceTranscription = {
          id: uuidv4(),
          recordingSid: payload.RecordingSid,
          transcriptionSid: payload.TranscriptionSid,
          text: payload.TranscriptionText || '',
          confidence: payload.Confidence ? parseFloat(payload.Confidence) : undefined,
          status: (payload.TranscriptionStatus as any) || 'completed',
          createdAt: new Date()
        };

        this.transcriptions.set(payload.RecordingSid, transcription);
      }

      return {
        processed: true,
        messageId: payload.TranscriptionSid
      };
    } catch (error) {
      const err = error as Error;
      return {
        processed: false,
        error: {
          code: 'TRANSCRIPTION_CALLBACK_ERROR',
          message: err.message
        }
      };
    }
  }

  /**
   * Hangup a call
   */
  async hangup(callSid: string): Promise<boolean> {
    try {
      await this.client.calls(callSid).update({
        status: 'completed'
      });

      const call = this.activeCalls.get(callSid);
      if (call) {
        call.callStatus = CallStatus.COMPLETED;
        call.endTime = new Date();
        call.updatedAt = new Date();
      }

      return true;
    } catch (error) {
      console.error('Error hanging up call:', error);
      return false;
    }
  }

  /**
   * Mute/unmute a call
   */
  async mute(callSid: string, muted: boolean = true): Promise<boolean> {
    try {
      // Muting is done through the participant in a conference
      // For a direct call, you would need to use different approach
      console.warn('Mute operation requires conference participant context');
      return false;
    } catch (error) {
      console.error('Error muting call:', error);
      return false;
    }
  }

  /**
   * Hold a call
   */
  async hold(callSid: string, holdMusicUrl?: string): Promise<boolean> {
    try {
      const response = new VoiceResponse();

      if (holdMusicUrl) {
        response.play({ loop: 0 }, holdMusicUrl);
      } else {
        response.say({
          voice: 'alice',
          loop: 0
        }, 'Please hold, your call is important to us.');
        response.pause({ length: 30 });
      }

      await this.client.calls(callSid).update({
        twiml: response.toString()
      });

      return true;
    } catch (error) {
      console.error('Error holding call:', error);
      return false;
    }
  }

  /**
   * Get active call by SID
   */
  getCall(callSid: string): VoiceCall | null {
    return this.activeCalls.get(callSid) || null;
  }

  /**
   * Get all active calls
   */
  getActiveCalls(): VoiceCall[] {
    return Array.from(this.activeCalls.values()).filter(
      c => c.callStatus === CallStatus.IN_PROGRESS || c.callStatus === CallStatus.RINGING
    );
  }

  /**
   * Map Twilio status to CallStatus
   */
  private mapTwilioStatus(status: string): CallStatus {
    switch (status) {
      case 'queued':
      case 'initiated':
        return CallStatus.INITIATED;
      case 'ringing':
        return CallStatus.RINGING;
      case 'in-progress':
        return CallStatus.IN_PROGRESS;
      case 'completed':
        return CallStatus.COMPLETED;
      case 'busy':
        return CallStatus.BUSY;
      case 'no-answer':
        return CallStatus.NO_ANSWER;
      case 'failed':
        return CallStatus.FAILED;
      case 'canceled':
        return CallStatus.CANCELED;
      default:
        return CallStatus.INITIATED;
    }
  }

  /**
   * Emit communication event
   */
  private emitEvent(
    type: CommunicationEvent['type'],
    callSid: string,
    data: Record<string, unknown>
  ): void {
    const event: CommunicationEvent = {
      id: uuidv4(),
      tenantId: this.config.tenantId,
      type,
      channel: ChannelType.VOICE,
      timestamp: new Date(),
      data: {
        callSid,
        ...data
      }
    };

    this.emit(type, event);
    this.emit('event', event);
  }

  /**
   * Register IVR configuration
   */
  registerIVR(config: IVRConfig): void {
    this.ivrConfigs.set(config.id, config);
  }

  /**
   * Set contact lookup function
   */
  setContactLookup(fn: (phone: string) => Promise<Contact | null>): void {
    this.contactLookup = fn;
  }
}

export default VoiceService;
