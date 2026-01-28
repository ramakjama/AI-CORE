import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

/**
 * User information for awareness protocol
 */
export interface AwarenessUser {
  id: string;
  name: string;
  color: string;
  cursor?: {
    anchor: number;
    head: number;
  };
}

/**
 * Connection status states
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Y.js Provider configuration
 */
export interface YjsProviderConfig {
  documentId: string;
  user: {
    id: string;
    name: string;
    color?: string;
  };
  serverUrl?: string;
  roomName?: string;
  onStatusChange?: (status: ConnectionStatus) => void;
  onAwarenessUpdate?: (states: Map<number, any>) => void;
  onError?: (error: Error) => void;
}

/**
 * Generate a random color for user
 */
const generateUserColor = (): string => {
  const colors = [
    '#EF4444', // red
    '#F59E0B', // orange
    '#10B981', // green
    '#3B82F6', // blue
    '#6366F1', // indigo
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Y.js Collaborative Editing Provider
 *
 * Handles Y.js document setup, WebSocket connection, awareness protocol,
 * and real-time synchronization
 */
export class YjsProvider {
  private doc: Y.Doc;
  private provider: WebrtcProvider | null = null;
  private awareness: any;
  private status: ConnectionStatus = 'disconnected';
  private config: YjsProviderConfig;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private undoManager: Y.UndoManager | null = null;

  constructor(config: YjsProviderConfig) {
    this.config = {
      ...config,
      serverUrl: config.serverUrl || 'ws://localhost:1234',
      roomName: config.roomName || `document-${config.documentId}`,
      user: {
        ...config.user,
        color: config.user.color || generateUserColor(),
      },
    };

    // Initialize Y.Doc
    this.doc = new Y.Doc();

    // Set up undo manager
    const yText = this.doc.getText('content');
    this.undoManager = new Y.UndoManager(yText);

    // Initialize connection
    this.connect();
  }

  /**
   * Connect to the collaboration server
   */
  private connect(): void {
    try {
      this.setStatus('connecting');

      // Create WebRTC provider
      this.provider = new WebrtcProvider(this.config.roomName!, this.doc, {
        signaling: [this.config.serverUrl!],
        password: null,
        awareness: undefined,
        maxConns: 20,
        filterBcConns: true,
        peerOpts: {},
      });

      // Get awareness instance
      this.awareness = this.provider.awareness;

      // Set local awareness state
      this.awareness.setLocalState({
        user: {
          id: this.config.user.id,
          name: this.config.user.name,
          color: this.config.user.color,
        },
      });

      // Set up event listeners
      this.setupEventListeners();

      // Connection successful
      this.reconnectAttempts = 0;
      this.setStatus('connected');
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Set up provider event listeners
   */
  private setupEventListeners(): void {
    if (!this.provider) return;

    // Connection status changes
    this.provider.on('status', (event: any) => {
      if (event.connected) {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
      } else {
        this.setStatus('disconnected');
        this.scheduleReconnect();
      }
    });

    // Awareness updates
    if (this.awareness) {
      this.awareness.on('change', () => {
        if (this.config.onAwarenessUpdate) {
          this.config.onAwarenessUpdate(this.awareness.getStates());
        }
      });
    }

    // Sync status
    this.provider.on('synced', () => {
      console.log('[YjsProvider] Document synced');
    });
  }

  /**
   * Schedule automatic reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus('error');
      this.config.onError?.(
        new Error('Maximum reconnection attempts reached')
      );
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(
      `[YjsProvider] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Set connection status and notify
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.config.onStatusChange?.(status);
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('[YjsProvider] Error:', error);
    this.setStatus('error');
    this.config.onError?.(error);
  }

  /**
   * Get the Y.Doc instance
   */
  getDoc(): Y.Doc {
    return this.doc;
  }

  /**
   * Get the provider instance
   */
  getProvider(): WebrtcProvider | null {
    return this.provider;
  }

  /**
   * Get the awareness instance
   */
  getAwareness(): any {
    return this.awareness;
  }

  /**
   * Get the undo manager
   */
  getUndoManager(): Y.UndoManager | null {
    return this.undoManager;
  }

  /**
   * Get text binding for editor
   */
  getText(name: string = 'content'): Y.Text {
    return this.doc.getText(name);
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Get all active users from awareness
   */
  getActiveUsers(): AwarenessUser[] {
    if (!this.awareness) return [];

    const users: AwarenessUser[] = [];
    const states = this.awareness.getStates();

    states.forEach((state: any, clientId: number) => {
      if (state.user && clientId !== this.awareness.clientID) {
        users.push({
          id: state.user.id,
          name: state.user.name,
          color: state.user.color,
          cursor: state.cursor,
        });
      }
    });

    return users;
  }

  /**
   * Update local user information
   */
  updateUser(updates: Partial<AwarenessUser>): void {
    if (!this.awareness) return;

    const currentState = this.awareness.getLocalState();
    this.awareness.setLocalState({
      ...currentState,
      user: {
        ...currentState?.user,
        ...updates,
      },
    });
  }

  /**
   * Update cursor position
   */
  updateCursor(cursor: { anchor: number; head: number } | null): void {
    if (!this.awareness) return;

    const currentState = this.awareness.getLocalState();
    this.awareness.setLocalState({
      ...currentState,
      cursor,
    });
  }

  /**
   * Undo last change
   */
  undo(): void {
    this.undoManager?.undo();
  }

  /**
   * Redo last undone change
   */
  redo(): void {
    this.undoManager?.redo();
  }

  /**
   * Check if can undo
   */
  canUndo(): boolean {
    return this.undoManager ? this.undoManager.undoStack.length > 0 : false;
  }

  /**
   * Check if can redo
   */
  canRedo(): boolean {
    return this.undoManager ? this.undoManager.redoStack.length > 0 : false;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }

    if (this.awareness) {
      this.awareness.destroy();
      this.awareness = null;
    }

    this.setStatus('disconnected');
  }

  /**
   * Destroy the provider and clean up resources
   */
  destroy(): void {
    this.disconnect();
    this.doc.destroy();
    this.undoManager?.destroy();
    this.undoManager = null;
  }
}

/**
 * Create a new Y.js provider instance
 */
export const createYjsProvider = (config: YjsProviderConfig): YjsProvider => {
  return new YjsProvider(config);
};

/**
 * Export Y.js types for convenience
 */
export { Y };
