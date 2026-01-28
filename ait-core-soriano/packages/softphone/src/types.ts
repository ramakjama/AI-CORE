/**
 * Softphone Types
 * Type definitions for VoIP softphone system
 */

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  apiKey: string;
  apiSecret: string;
  phoneNumber: string; // Twilio phone number
}

export interface CallOptions {
  to: string;
  from?: string;
  record?: boolean;
  transcribe?: boolean;
  timeout?: number;
}

export interface Call {
  id: string;
  direction: 'inbound' | 'outbound';
  from: string;
  to: string;
  status: CallStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  recordingUrl?: string;
  transcriptionUrl?: string;
}

export type CallStatus =
  | 'connecting'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no-answer'
  | 'canceled';

export interface SoftphoneEvents {
  'call:incoming': (call: Call) => void;
  'call:connecting': (call: Call) => void;
  'call:ringing': (call: Call) => void;
  'call:answered': (call: Call) => void;
  'call:ended': (call: Call) => void;
  'call:failed': (call: Call, error: Error) => void;
  'device:ready': () => void;
  'device:error': (error: Error) => void;
  'device:offline': () => void;
}

export interface SoftphoneDevice {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
  capabilities: {
    audio: boolean;
    video: boolean;
    recording: boolean;
  };
}

export interface CallQuality {
  mos: number; // Mean Opinion Score (1-5)
  jitter: number; // ms
  latency: number; // ms
  packetLoss: number; // percentage
}

export interface IVROptions {
  menu: IVRMenuItem[];
  greeting?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface IVRMenuItem {
  key: string;
  label: string;
  action: 'transfer' | 'voicemail' | 'queue' | 'hangup';
  target?: string;
}

export interface CallQueue {
  id: string;
  name: string;
  maxSize: number;
  currentSize: number;
  averageWaitTime: number;
  calls: QueuedCall[];
}

export interface QueuedCall {
  id: string;
  from: string;
  queuedAt: Date;
  position: number;
  estimatedWaitTime: number;
}
