export enum CallStatus {
  RINGING = 'ringing',
  ANSWERED = 'answered',
  ON_HOLD = 'on_hold',
  TRANSFERRING = 'transferring',
  ENDED = 'ended',
  FAILED = 'failed',
  BUSY = 'busy',
  NO_ANSWER = 'no_answer',
}

export enum CallDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  INTERNAL = 'internal',
}

export interface ICall {
  id: string;
  uniqueId: string;
  callId: string;
  from: string;
  to: string;
  direction: CallDirection;
  status: CallStatus;
  startTime: Date;
  answerTime?: Date;
  endTime?: Date;
  duration?: number;
  agentId?: string;
  clientId?: string;
  queueId?: string;
  recordingUrl?: string;
  transcriptionId?: string;
  metadata?: Record<string, any>;
}

export interface ICallEvent {
  event: string;
  callId: string;
  uniqueId: string;
  timestamp: Date;
  data: Record<string, any>;
}

export interface ICallMetrics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  averageWaitTime: number;
  averageCallDuration: number;
  abandonmentRate: number;
}
