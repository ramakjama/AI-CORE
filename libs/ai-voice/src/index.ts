/**
 * AI-CORE Voice Module
 * Centralita Virtual / PBX con Twilio Voice y WebRTC
 */

import { v4 as uuid } from 'uuid';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface VoiceCall {
  id: string;
  sid?: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  status: CallStatus;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  recordingUrl?: string;
  transcription?: string;
  metadata?: Record<string, unknown>;
}

export type CallStatus =
  | 'queued'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'busy'
  | 'failed'
  | 'no-answer'
  | 'canceled';

export interface VoiceConfig {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  webhookBaseUrl: string;
  recordCalls: boolean;
  transcribeRecordings: boolean;
}

export interface IVRNode {
  id: string;
  type: 'say' | 'gather' | 'dial' | 'record' | 'hangup' | 'redirect';
  content?: string;
  voice?: 'alice' | 'man' | 'woman' | 'Polly.Lucia';
  language?: string;
  numDigits?: number;
  timeout?: number;
  nextNodes?: Record<string, string>;
}

export interface IVRFlow {
  id: string;
  name: string;
  description?: string;
  entryNode: string;
  nodes: Record<string, IVRNode>;
}

export interface CallQueue {
  id: string;
  name: string;
  description?: string;
  agents: string[];
  maxWaitTime: number;
  musicOnHold?: string;
  announcePosition: boolean;
  announceWaitTime: boolean;
}

// ============================================================================
// Voice Service
// ============================================================================

export class VoiceService {
  private config: VoiceConfig;
  private activeCalls: Map<string, VoiceCall> = new Map();
  private queues: Map<string, CallQueue> = new Map();
  private ivrFlows: Map<string, IVRFlow> = new Map();

  constructor(config: VoiceConfig) {
    this.config = config;
  }

  /**
   * Iniciar una llamada saliente
   */
  async makeCall(to: string, options?: {
    callerId?: string;
    statusCallback?: string;
    record?: boolean;
  }): Promise<VoiceCall> {
    const call: VoiceCall = {
      id: uuid(),
      from: options?.callerId || this.config.twilioPhoneNumber,
      to,
      direction: 'outbound',
      status: 'queued',
      startedAt: new Date(),
    };

    this.activeCalls.set(call.id, call);

    // En producción, aquí se integraría con Twilio
    console.log(`[VoiceService] Initiating call to ${to}`);

    return call;
  }

  /**
   * Manejar llamada entrante
   */
  async handleIncomingCall(from: string, to: string, callSid: string): Promise<VoiceCall> {
    const call: VoiceCall = {
      id: uuid(),
      sid: callSid,
      from,
      to,
      direction: 'inbound',
      status: 'ringing',
      startedAt: new Date(),
    };

    this.activeCalls.set(call.id, call);
    console.log(`[VoiceService] Incoming call from ${from}`);

    return call;
  }

  /**
   * Transferir llamada
   */
  async transferCall(callId: string, to: string, type: 'warm' | 'cold' = 'cold'): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error(`Call ${callId} not found`);
    }

    console.log(`[VoiceService] Transferring call ${callId} to ${to} (${type} transfer)`);
  }

  /**
   * Terminar llamada
   */
  async hangupCall(callId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      throw new Error(`Call ${callId} not found`);
    }

    call.status = 'completed';
    call.endedAt = new Date();
    call.duration = Math.floor((call.endedAt.getTime() - call.startedAt.getTime()) / 1000);

    console.log(`[VoiceService] Call ${callId} ended. Duration: ${call.duration}s`);
  }

  /**
   * Obtener estado de llamada
   */
  getCall(callId: string): VoiceCall | undefined {
    return this.activeCalls.get(callId);
  }

  /**
   * Listar llamadas activas
   */
  getActiveCalls(): VoiceCall[] {
    return Array.from(this.activeCalls.values()).filter(
      call => !['completed', 'failed', 'canceled'].includes(call.status)
    );
  }

  /**
   * Registrar flujo IVR
   */
  registerIVRFlow(flow: IVRFlow): void {
    this.ivrFlows.set(flow.id, flow);
    console.log(`[VoiceService] IVR flow registered: ${flow.name}`);
  }

  /**
   * Crear cola de llamadas
   */
  createQueue(queue: CallQueue): void {
    this.queues.set(queue.id, queue);
    console.log(`[VoiceService] Queue created: ${queue.name}`);
  }

  /**
   * Añadir agente a cola
   */
  addAgentToQueue(queueId: string, agentId: string): void {
    const queue = this.queues.get(queueId);
    if (queue && !queue.agents.includes(agentId)) {
      queue.agents.push(agentId);
    }
  }

  /**
   * Generar TwiML para IVR
   */
  generateTwiML(flowId: string, nodeId?: string): string {
    const flow = this.ivrFlows.get(flowId);
    if (!flow) {
      return '<Response><Say>Error: IVR flow not found</Say><Hangup/></Response>';
    }

    const node = flow.nodes[nodeId || flow.entryNode];
    if (!node) {
      return '<Response><Say>Error: IVR node not found</Say><Hangup/></Response>';
    }

    // Generar TwiML según el tipo de nodo
    switch (node.type) {
      case 'say':
        return `<Response><Say voice="${node.voice || 'Polly.Lucia'}" language="${node.language || 'es-ES'}">${node.content}</Say></Response>`;
      case 'gather':
        return `<Response><Gather numDigits="${node.numDigits || 1}" timeout="${node.timeout || 5}"><Say>${node.content}</Say></Gather></Response>`;
      case 'hangup':
        return '<Response><Hangup/></Response>';
      default:
        return '<Response><Say>Gracias por llamar</Say><Hangup/></Response>';
    }
  }
}

// ============================================================================
// WebRTC Softphone
// ============================================================================

export interface SoftphoneConfig {
  wsUrl: string;
  iceServers: RTCIceServer[];
}

export class SoftphoneClient {
  private config: SoftphoneConfig;
  private registered: boolean = false;

  constructor(config: SoftphoneConfig) {
    this.config = config;
  }

  getConfig(): SoftphoneConfig {
    return this.config;
  }

  async register(extension: string, _password: string): Promise<boolean> {
    console.log(`[Softphone] Registering extension ${extension}`);
    this.registered = true;
    return true;
  }

  async call(destination: string): Promise<string> {
    if (!this.registered) {
      throw new Error('Softphone not registered');
    }
    const callId = uuid();
    console.log(`[Softphone] Calling ${destination}, call ID: ${callId}`);
    return callId;
  }

  async answer(callId: string): Promise<void> {
    console.log(`[Softphone] Answering call ${callId}`);
  }

  async hangup(callId: string): Promise<void> {
    console.log(`[Softphone] Hanging up call ${callId}`);
  }

  async mute(callId: string, muted: boolean): Promise<void> {
    console.log(`[Softphone] ${muted ? 'Muting' : 'Unmuting'} call ${callId}`);
  }

  async hold(callId: string, held: boolean): Promise<void> {
    console.log(`[Softphone] ${held ? 'Holding' : 'Resuming'} call ${callId}`);
  }
}

// ============================================================================
// Exports
// ============================================================================

export default VoiceService;
