/**
 * WebSocket client for PBX Gateway integration
 */

import {
  WebSocketMessage,
  CallEvent,
  TranscriptionEvent,
  SentimentEvent,
  AISuggestionEvent,
} from '@/types/pbx';

type MessageHandler = (message: WebSocketMessage) => void;
type EventHandler = (event: any) => void;

export class PBXWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private agentId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Set<MessageHandler> = new Set();
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isManuallyDisconnected = false;

  constructor(agentId: string, url?: string) {
    this.agentId = agentId;
    this.url = url || process.env.NEXT_PUBLIC_PBX_WS_URL || 'ws://localhost:3001/pbx';
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;
      this.isManuallyDisconnected = false;

      try {
        const wsUrl = `${this.url}?agentId=${this.agentId}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[PBX WebSocket] Connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.authenticate();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[PBX WebSocket] Error parsing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[PBX WebSocket] Error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('[PBX WebSocket] Disconnected', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();

          if (!this.isManuallyDisconnected && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isManuallyDisconnected = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
  }

  private reconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `[PBX WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[PBX WebSocket] Reconnection failed:', error);
      });
    }, delay);
  }

  private authenticate(): void {
    this.send({
      type: 'auth',
      payload: {
        agentId: this.agentId,
        timestamp: new Date(),
      },
      timestamp: new Date(),
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.send({
        type: 'ping',
        payload: {},
        timestamp: new Date(),
      });
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[PBX WebSocket] Cannot send message, not connected');
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    // Notify all message handlers
    this.messageHandlers.forEach((handler) => handler(message));

    // Notify event-specific handlers
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message.payload));
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  on(eventType: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(eventType);
        }
      }
    };
  }

  off(eventType: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Call-specific methods
  answerCall(callId: string): void {
    this.send({
      type: 'call.answer',
      payload: { callId },
      timestamp: new Date(),
    });
  }

  hangupCall(callId: string): void {
    this.send({
      type: 'call.hangup',
      payload: { callId },
      timestamp: new Date(),
    });
  }

  holdCall(callId: string, hold: boolean): void {
    this.send({
      type: 'call.hold',
      payload: { callId, hold },
      timestamp: new Date(),
    });
  }

  muteCall(callId: string, mute: boolean): void {
    this.send({
      type: 'call.mute',
      payload: { callId, mute },
      timestamp: new Date(),
    });
  }

  transferCall(callId: string, targetNumber: string): void {
    this.send({
      type: 'call.transfer',
      payload: { callId, targetNumber },
      timestamp: new Date(),
    });
  }

  makeCall(phoneNumber: string, clientId?: string): void {
    this.send({
      type: 'call.make',
      payload: { phoneNumber, clientId },
      timestamp: new Date(),
    });
  }

  sendDTMF(callId: string, digit: string): void {
    this.send({
      type: 'call.dtmf',
      payload: { callId, digit },
      timestamp: new Date(),
    });
  }

  toggleRecording(callId: string, recording: boolean): void {
    this.send({
      type: 'call.recording',
      payload: { callId, recording },
      timestamp: new Date(),
    });
  }

  updateAgentStatus(status: string): void {
    this.send({
      type: 'agent.status',
      payload: { status },
      timestamp: new Date(),
    });
  }
}

// Singleton instance
let pbxClient: PBXWebSocketClient | null = null;

export function getPBXClient(agentId?: string): PBXWebSocketClient {
  if (!pbxClient && agentId) {
    pbxClient = new PBXWebSocketClient(agentId);
  }
  if (!pbxClient) {
    throw new Error('PBX client not initialized. Provide agentId on first call.');
  }
  return pbxClient;
}

export function resetPBXClient(): void {
  if (pbxClient) {
    pbxClient.disconnect();
    pbxClient = null;
  }
}
