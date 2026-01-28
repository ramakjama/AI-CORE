/**
 * Types and interfaces for PBX Softphone system
 */

export enum CallState {
  IDLE = 'IDLE',
  RINGING = 'RINGING',
  IN_CALL = 'IN_CALL',
  ON_HOLD = 'ON_HOLD',
  ENDED = 'ENDED',
}

export enum CallDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum AgentStatus {
  AVAILABLE = 'AVAILABLE',
  ON_CALL = 'ON_CALL',
  BREAK = 'BREAK',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
}

export enum SpeakerType {
  AGENT = 'AGENT',
  CLIENT = 'CLIENT',
}

export enum SentimentType {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE',
}

export enum SuggestionType {
  SCRIPT = 'SCRIPT',
  RESPONSE = 'RESPONSE',
  OPPORTUNITY = 'OPPORTUNITY',
  PRODUCT = 'PRODUCT',
  ALERT = 'ALERT',
  INFO = 'INFO',
}

export interface CallInfo {
  id: string;
  direction: CallDirection;
  phoneNumber: string;
  startTime: Date;
  duration?: number;
  clientId?: string;
  clientName?: string;
  clientPhoto?: string;
  clientSegment?: string;
  predictedReason?: string;
}

export interface TranscriptionSegment {
  id: string;
  speaker: SpeakerType;
  text: string;
  timestamp: Date;
  confidence?: number;
  keywords?: string[];
}

export interface AISuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ClientContextData {
  clientId: string;
  name: string;
  photo?: string;
  segment: string;
  email?: string;
  phone: string;
  activePolicies: PolicySummary[];
  pendingReceipts: ReceiptSummary[];
  openClaims: ClaimSummary[];
  lastInteraction?: Interaction;
  importantNotes: string[];
  sorisBalance: number;
  aiSummary?: string;
}

export interface PolicySummary {
  id: string;
  type: string;
  number: string;
  status: string;
  insurer: string;
  expiryDate: Date;
  premium: number;
}

export interface ReceiptSummary {
  id: string;
  number: string;
  amount: number;
  dueDate: Date;
  status: string;
}

export interface ClaimSummary {
  id: string;
  type: string;
  status: string;
  openedDate: Date;
  amount?: number;
}

export interface Interaction {
  id: string;
  type: string;
  date: Date;
  summary: string;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface CallEvent {
  type: 'call.incoming' | 'call.answered' | 'call.ended' | 'call.hold' | 'call.muted';
  callId: string;
  data?: any;
}

export interface TranscriptionEvent {
  type: 'transcription.update' | 'transcription.final';
  callId: string;
  segment: TranscriptionSegment;
}

export interface SentimentEvent {
  type: 'sentiment.update';
  callId: string;
  sentiment: SentimentType;
  score: number;
}

export interface AISuggestionEvent {
  type: 'ai.suggestion';
  callId: string;
  suggestion: AISuggestion;
}

export interface DTMFTone {
  key: string;
  frequency: [number, number];
  duration: number;
}

export interface CallStats {
  duration: number;
  holdTime: number;
  talkTime: number;
  sentimentScore: number;
  transcriptionAccuracy: number;
}

export interface SoftphoneConfig {
  agentId: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  defaultMinimized?: boolean;
  enableNotifications?: boolean;
  enableDesktopNotifications?: boolean;
  enableSounds?: boolean;
  autoAnswer?: boolean;
  recordingEnabled?: boolean;
}

export interface CallHistoryItem {
  id: string;
  direction: CallDirection;
  phoneNumber: string;
  clientName?: string;
  startTime: Date;
  duration: number;
  outcome: string;
  recording?: string;
}

export interface QuickDialContact {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  favorite: boolean;
}
