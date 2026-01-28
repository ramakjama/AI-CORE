export enum RecordingStatus {
  RECORDING = 'recording',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PROCESSING = 'processing',
  UPLOADED = 'uploaded',
}

export interface IRecording {
  id: string;
  callId: string;
  filename: string;
  filepath: string;
  duration: number;
  size: number;
  format: string;
  status: RecordingStatus;
  encryptionKey?: string;
  storageUrl?: string;
  createdAt: Date;
  uploadedAt?: Date;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface IRecordingConfig {
  format: string;
  mixMonitor: boolean;
  beep: boolean;
  maxDuration: number;
  silenceThreshold: number;
  silenceTimeout: number;
}
