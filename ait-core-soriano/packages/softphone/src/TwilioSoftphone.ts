/**
 * Twilio Softphone Client
 * VoIP softphone implementation using Twilio Voice SDK
 */

import { Device, Call as TwilioCall } from '@twilio/voice-sdk';
import { EventEmitter } from 'eventemitter3';
import { nanoid } from 'nanoid';
import type {
  TwilioConfig,
  CallOptions,
  Call,
  CallStatus,
  SoftphoneEvents,
  CallQuality,
} from './types';

export class TwilioSoftphone extends EventEmitter<SoftphoneEvents> {
  private device: Device | null = null;
  private currentCall: TwilioCall | null = null;
  private calls: Map<string, Call> = new Map();
  private config: TwilioConfig;
  private accessToken: string = '';

  constructor(config: TwilioConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize the softphone device
   */
  async initialize(accessToken: string): Promise<void> {
    try {
      this.accessToken = accessToken;

      // Create Twilio Device
      this.device = new Device(accessToken, {
        codecPreferences: [Device.Codec.Opus, Device.Codec.PCMU],
        enableRingingState: true,
        closeProtection: true,
      });

      // Setup event listeners
      this.setupDeviceListeners();

      // Register device
      await this.device.register();

      this.emit('device:ready');
    } catch (error) {
      this.emit('device:error', error as Error);
      throw error;
    }
  }

  /**
   * Make an outbound call
   */
  async makeCall(options: CallOptions): Promise<Call> {
    if (!this.device) {
      throw new Error('Device not initialized. Call initialize() first.');
    }

    const callId = nanoid();
    const call: Call = {
      id: callId,
      direction: 'outbound',
      from: options.from || this.config.phoneNumber,
      to: options.to,
      status: 'connecting',
      startTime: new Date(),
    };

    this.calls.set(callId, call);
    this.emit('call:connecting', call);

    try {
      // Connect the call
      this.currentCall = await this.device.connect({
        params: {
          To: options.to,
          From: options.from || this.config.phoneNumber,
          Record: options.record?.toString() || 'false',
          Transcribe: options.transcribe?.toString() || 'false',
          CallTimeout: options.timeout?.toString() || '60',
        },
      });

      // Setup call listeners
      this.setupCallListeners(this.currentCall, call);

      return call;
    } catch (error) {
      call.status = 'failed';
      this.emit('call:failed', call, error as Error);
      throw error;
    }
  }

  /**
   * Answer an incoming call
   */
  async answerCall(): Promise<void> {
    if (!this.currentCall) {
      throw new Error('No incoming call to answer');
    }

    try {
      this.currentCall.accept();
    } catch (error) {
      throw new Error(`Failed to answer call: ${(error as Error).message}`);
    }
  }

  /**
   * Reject an incoming call
   */
  rejectCall(): void {
    if (!this.currentCall) {
      throw new Error('No incoming call to reject');
    }

    this.currentCall.reject();
  }

  /**
   * Hang up the current call
   */
  hangUp(): void {
    if (!this.currentCall) {
      throw new Error('No active call to hang up');
    }

    this.currentCall.disconnect();
  }

  /**
   * Mute/unmute the microphone
   */
  setMuted(muted: boolean): void {
    if (!this.currentCall) {
      throw new Error('No active call');
    }

    this.currentCall.mute(muted);
  }

  /**
   * Send DTMF tones (keypad digits)
   */
  sendDigits(digits: string): void {
    if (!this.currentCall) {
      throw new Error('No active call');
    }

    this.currentCall.sendDigits(digits);
  }

  /**
   * Get current call quality metrics
   */
  getCallQuality(): CallQuality | null {
    if (!this.currentCall) {
      return null;
    }

    // Get stats from Twilio SDK
    const stats = (this.currentCall as any).getStats();

    return {
      mos: stats?.mos || 0,
      jitter: stats?.jitter || 0,
      latency: stats?.rtt || 0,
      packetLoss: stats?.packetsLost || 0,
    };
  }

  /**
   * Get call by ID
   */
  getCall(callId: string): Call | undefined {
    return this.calls.get(callId);
  }

  /**
   * Get all calls
   */
  getAllCalls(): Call[] {
    return Array.from(this.calls.values());
  }

  /**
   * Get current active call
   */
  getCurrentCall(): Call | null {
    if (!this.currentCall) return null;

    const callSid = (this.currentCall as any).parameters?.CallSid;
    return Array.from(this.calls.values()).find((call) => call.id === callSid) || null;
  }

  /**
   * Destroy the softphone instance
   */
  destroy(): void {
    if (this.currentCall) {
      this.currentCall.disconnect();
    }

    if (this.device) {
      this.device.destroy();
    }

    this.calls.clear();
    this.removeAllListeners();
  }

  /**
   * Setup device event listeners
   */
  private setupDeviceListeners(): void {
    if (!this.device) return;

    this.device.on('registered', () => {
      console.log('[Softphone] Device registered');
    });

    this.device.on('unregistered', () => {
      console.log('[Softphone] Device unregistered');
      this.emit('device:offline');
    });

    this.device.on('error', (error) => {
      console.error('[Softphone] Device error:', error);
      this.emit('device:error', error);
    });

    this.device.on('incoming', (twilioCall: TwilioCall) => {
      console.log('[Softphone] Incoming call');

      const call: Call = {
        id: (twilioCall as any).parameters?.CallSid || nanoid(),
        direction: 'inbound',
        from: (twilioCall as any).parameters?.From || 'Unknown',
        to: (twilioCall as any).parameters?.To || this.config.phoneNumber,
        status: 'ringing',
        startTime: new Date(),
      };

      this.currentCall = twilioCall;
      this.calls.set(call.id, call);
      this.setupCallListeners(twilioCall, call);

      this.emit('call:incoming', call);
    });
  }

  /**
   * Setup call event listeners
   */
  private setupCallListeners(twilioCall: TwilioCall, call: Call): void {
    twilioCall.on('accept', () => {
      console.log('[Softphone] Call accepted');
      call.status = 'in-progress';
      this.emit('call:answered', call);
    });

    twilioCall.on('disconnect', () => {
      console.log('[Softphone] Call disconnected');
      call.status = 'completed';
      call.endTime = new Date();
      call.duration = Math.floor((call.endTime.getTime() - call.startTime.getTime()) / 1000);

      this.emit('call:ended', call);
      this.currentCall = null;
    });

    twilioCall.on('reject', () => {
      console.log('[Softphone] Call rejected');
      call.status = 'canceled';
      call.endTime = new Date();

      this.emit('call:ended', call);
      this.currentCall = null;
    });

    twilioCall.on('cancel', () => {
      console.log('[Softphone] Call canceled');
      call.status = 'canceled';
      call.endTime = new Date();

      this.emit('call:ended', call);
      this.currentCall = null;
    });

    twilioCall.on('error', (error) => {
      console.error('[Softphone] Call error:', error);
      call.status = 'failed';
      call.endTime = new Date();

      this.emit('call:failed', call, error);
      this.currentCall = null;
    });

    twilioCall.on('ringing', () => {
      console.log('[Softphone] Call ringing');
      call.status = 'ringing';
      this.emit('call:ringing', call);
    });
  }
}
