import { io, Socket } from 'socket.io-client';
import { WS_URL, STORAGE_KEYS } from '@/utils/constants';
import type { WebSocketMessage, WebSocketMessageType } from '@/types';

type MessageHandler = (message: WebSocketMessage) => void;

/**
 * Production-Ready WebSocket Client
 * Handles real-time communication with automatic reconnection
 */
class WebSocketClient {
  private socket: Socket | null = null;
  private handlers: Map<WebSocketMessageType, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    const token = this.getAuthToken();

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
    this.isConnecting = false;
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.info('[WebSocket] Connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('message', (message: WebSocketMessage) => {
      this.handleMessage(message);
    });

    // Specific event handlers
    this.socket.on('agent_status', (data) => {
      this.handleMessage({
        type: 'agent_status',
        payload: data,
        timestamp: new Date().toISOString(),
      });
    });

    this.socket.on('system_metric', (data) => {
      this.handleMessage({
        type: 'system_metric',
        payload: data,
        timestamp: new Date().toISOString(),
      });
    });

    this.socket.on('alert', (data) => {
      this.handleMessage({
        type: 'alert',
        payload: data,
        timestamp: new Date().toISOString(),
      });
    });

    this.socket.on('task_update', (data) => {
      this.handleMessage({
        type: 'task_update',
        payload: data,
        timestamp: new Date().toISOString(),
      });
    });

    this.socket.on('module_update', (data) => {
      this.handleMessage({
        type: 'module_update',
        payload: data,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }
  }

  /**
   * Subscribe to message type
   */
  on(type: WebSocketMessageType, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    this.handlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.off(type, handler);
    };
  }

  /**
   * Unsubscribe from message type
   */
  off(type: WebSocketMessageType, handler: MessageHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(type);
      }
    }
  }

  /**
   * Send message to server
   */
  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[WebSocket] Cannot emit, not connected');
    }
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.handlers.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get authentication token
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Subscribe to agent updates
   */
  subscribeToAgent(agentId: string): void {
    this.emit('subscribe_agent', { agentId });
  }

  /**
   * Unsubscribe from agent updates
   */
  unsubscribeFromAgent(agentId: string): void {
    this.emit('unsubscribe_agent', { agentId });
  }

  /**
   * Subscribe to module updates
   */
  subscribeToModule(moduleId: string): void {
    this.emit('subscribe_module', { moduleId });
  }

  /**
   * Unsubscribe from module updates
   */
  unsubscribeFromModule(moduleId: string): void {
    this.emit('unsubscribe_module', { moduleId });
  }

  /**
   * Subscribe to system metrics
   */
  subscribeToSystemMetrics(): void {
    this.emit('subscribe_system_metrics', {});
  }

  /**
   * Unsubscribe from system metrics
   */
  unsubscribeFromSystemMetrics(): void {
    this.emit('unsubscribe_system_metrics', {});
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();

export default wsClient;
