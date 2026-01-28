export enum TranscriptionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ITranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker?: 'agent' | 'client';
  confidence?: number;
}

export interface ITranscription {
  id: string;
  callId: string;
  language: string;
  text: string;
  segments: ITranscriptionSegment[];
  duration: number;
  wordCount: number;
  status: TranscriptionStatus;
  model: string;
  processingTime?: number;
  confidence?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface ITranscriptionOptions {
  language?: string;
  model?: string;
  temperature?: number;
  prompt?: string;
  responseFormat?: string;
  timestampGranularities?: string[];
}
