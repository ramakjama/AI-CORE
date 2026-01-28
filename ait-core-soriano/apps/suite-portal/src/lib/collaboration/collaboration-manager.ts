import { YjsProvider, createYjsProvider, ConnectionStatus, AwarenessUser } from './yjs-provider';
import { useCollaborationStore, CollaborationUser } from '@/store/collaboration.store';

/**
 * Configuration for collaboration manager
 */
export interface CollaborationConfig {
  documentId: string;
  userId: string;
  userName: string;
  userColor?: string;
  serverUrl?: string;
}

/**
 * Event callbacks for collaboration events
 */
export interface CollaborationEventHandlers {
  onUserJoin?: (user: CollaborationUser) => void;
  onUserLeave?: (userId: string) => void;
  onUserUpdate?: (user: CollaborationUser) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
}

/**
 * Collaboration Manager
 *
 * High-level manager for collaborative editing sessions.
 * Handles session lifecycle, user management, and event coordination.
 */
export class CollaborationManager {
  private provider: YjsProvider | null = null;
  private config: CollaborationConfig;
  private eventHandlers: CollaborationEventHandlers;
  private activeSession: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cursorUpdateDebounce: NodeJS.Timeout | null = null;

  constructor(config: CollaborationConfig, eventHandlers: CollaborationEventHandlers = {}) {
    this.config = config;
    this.eventHandlers = eventHandlers;
  }

  /**
   * Join a collaborative editing session
   */
  async joinSession(): Promise<void> {
    if (this.activeSession) {
      console.warn('[CollaborationManager] Already in an active session');
      return;
    }

    try {
      // Create Y.js provider
      this.provider = createYjsProvider({
        documentId: this.config.documentId,
        user: {
          id: this.config.userId,
          name: this.config.userName,
          color: this.config.userColor,
        },
        serverUrl: this.config.serverUrl,
        onStatusChange: (status) => this.handleStatusChange(status),
        onAwarenessUpdate: (states) => this.handleAwarenessUpdate(states),
        onError: (error) => this.handleError(error),
      });

      this.activeSession = true;

      // Start heartbeat to mark user as active
      this.startHeartbeat();

      // Update store
      const store = useCollaborationStore.getState();
      store.startCollaboration(this.config.documentId);

      console.log('[CollaborationManager] Joined session:', this.config.documentId);
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Leave the current collaborative session
   */
  leaveSession(): void {
    if (!this.activeSession) {
      return;
    }

    // Stop heartbeat
    this.stopHeartbeat();

    // Disconnect provider
    if (this.provider) {
      this.provider.disconnect();
      this.provider = null;
    }

    this.activeSession = false;

    // Update store
    const store = useCollaborationStore.getState();
    store.stopCollaboration();

    console.log('[CollaborationManager] Left session');
  }

  /**
   * Update current user information
   */
  updateUserInfo(updates: { name?: string; color?: string }): void {
    if (!this.provider || !this.activeSession) {
      return;
    }

    this.provider.updateUser(updates);
    console.log('[CollaborationManager] Updated user info:', updates);
  }

  /**
   * Update cursor position (debounced)
   */
  updateCursorPosition(cursor: { anchor: number; head: number } | null): void {
    if (!this.provider || !this.activeSession) {
      return;
    }

    // Debounce cursor updates to avoid flooding
    if (this.cursorUpdateDebounce) {
      clearTimeout(this.cursorUpdateDebounce);
    }

    this.cursorUpdateDebounce = setTimeout(() => {
      this.provider?.updateCursor(cursor);
    }, 50);
  }

  /**
   * Get all active users in the session
   */
  getActiveUsers(): CollaborationUser[] {
    if (!this.provider) {
      return [];
    }

    const awarenessUsers = this.provider.getActiveUsers();
    return awarenessUsers.map(this.mapAwarenessUserToCollaborationUser);
  }

  /**
   * Get the Y.js provider instance
   */
  getProvider(): YjsProvider | null {
    return this.provider;
  }

  /**
   * Check if currently in an active session
   */
  isActive(): boolean {
    return this.activeSession;
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return this.provider?.getStatus() || 'disconnected';
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.provider?.isConnected() || false;
  }

  /**
   * Broadcast a change to all users
   */
  broadcastChange(data: any): void {
    if (!this.provider || !this.activeSession) {
      return;
    }

    // Changes are automatically broadcast through Y.js
    // This method is here for explicit broadcasting if needed
    console.log('[CollaborationManager] Broadcasting change');
  }

  /**
   * Handle user disconnection
   */
  handleDisconnection(): void {
    console.warn('[CollaborationManager] Handling disconnection');
    this.eventHandlers.onStatusChange?.('disconnected');

    // Provider will automatically attempt reconnection
  }

  /**
   * Handle connection status changes
   */
  private handleStatusChange(status: ConnectionStatus): void {
    console.log('[CollaborationManager] Status changed:', status);
    this.eventHandlers.onStatusChange?.(status);
  }

  /**
   * Handle awareness updates (users joining/leaving/updating)
   */
  private handleAwarenessUpdate(states: Map<number, any>): void {
    if (!this.provider) return;

    const currentUsers = this.getActiveUsers();
    const store = useCollaborationStore.getState();
    const previousUsers = store.activeUsers;

    // Find new users (joined)
    currentUsers.forEach((user) => {
      const existingUser = previousUsers.find((u) => u.id === user.id);
      if (!existingUser) {
        this.eventHandlers.onUserJoin?.(user);
        console.log('[CollaborationManager] User joined:', user.name);
      } else if (
        existingUser.cursor?.x !== user.cursor?.x ||
        existingUser.cursor?.y !== user.cursor?.y
      ) {
        this.eventHandlers.onUserUpdate?.(user);
      }
    });

    // Find removed users (left)
    previousUsers.forEach((user) => {
      const stillPresent = currentUsers.find((u) => u.id === user.id);
      if (!stillPresent) {
        this.eventHandlers.onUserLeave?.(user.id);
        console.log('[CollaborationManager] User left:', user.name);
      }
    });

    // Update store with current users
    store.setActiveUsers(currentUsers);
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('[CollaborationManager] Error:', error);
    this.eventHandlers.onError?.(error);
  }

  /**
   * Start heartbeat to keep user marked as active
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.provider && this.activeSession) {
        // Update last seen time
        const currentState = this.provider.getAwareness()?.getLocalState();
        if (currentState) {
          this.provider.getAwareness()?.setLocalState({
            ...currentState,
            lastSeen: Date.now(),
          });
        }
      }
    }, 30000); // Update every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Map awareness user to collaboration user format
   */
  private mapAwarenessUserToCollaborationUser(awarenessUser: AwarenessUser): CollaborationUser {
    return {
      id: awarenessUser.id,
      name: awarenessUser.name,
      email: '', // Not provided by awareness
      color: awarenessUser.color,
      cursor: awarenessUser.cursor
        ? {
            x: awarenessUser.cursor.anchor,
            y: awarenessUser.cursor.head,
          }
        : undefined,
      lastSeen: new Date(),
      isActive: true,
    };
  }

  /**
   * Destroy the manager and clean up resources
   */
  destroy(): void {
    this.leaveSession();

    if (this.cursorUpdateDebounce) {
      clearTimeout(this.cursorUpdateDebounce);
    }

    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
  }
}

/**
 * Create a new collaboration manager instance
 */
export const createCollaborationManager = (
  config: CollaborationConfig,
  eventHandlers?: CollaborationEventHandlers
): CollaborationManager => {
  return new CollaborationManager(config, eventHandlers);
};
