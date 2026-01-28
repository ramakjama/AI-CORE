import { useEffect, useState, useRef, useCallback } from 'react';
import { CollaborationManager, createCollaborationManager } from '@/lib/collaboration/collaboration-manager';
import { YjsProvider } from '@/lib/collaboration/yjs-provider';
import { useCollaborationStore, CollaborationUser } from '@/store/collaboration.store';
import * as Y from 'yjs';

/**
 * Configuration for useCollaboration hook
 */
export interface UseCollaborationConfig {
  /** Document ID to collaborate on */
  documentId: string;
  /** User ID */
  userId: string;
  /** User name */
  userName: string;
  /** User color (optional, will be generated if not provided) */
  userColor?: string;
  /** Collaboration server URL (optional) */
  serverUrl?: string;
  /** Whether to auto-connect on mount */
  autoConnect?: boolean;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Connection status type
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Return type for useCollaboration hook
 */
export interface UseCollaborationReturn {
  /** Y.js document instance */
  doc: Y.Doc | null;
  /** Y.js provider instance */
  provider: YjsProvider | null;
  /** Awareness instance for user presence */
  awareness: any;
  /** List of active users */
  activeUsers: CollaborationUser[];
  /** Connection status */
  isConnected: boolean;
  /** Connection status detail */
  status: ConnectionStatus;
  /** Collaboration manager instance */
  manager: CollaborationManager | null;
  /** Manually connect to collaboration session */
  connect: () => Promise<void>;
  /** Manually disconnect from collaboration session */
  disconnect: () => void;
  /** Update user information */
  updateUser: (updates: { name?: string; color?: string }) => void;
  /** Update cursor position */
  updateCursor: (position: { x: number; y: number } | null) => void;
  /** Get Y.Text binding for editor */
  getText: (name?: string) => Y.Text | null;
  /** Whether currently in an active collaboration session */
  isActive: boolean;
}

/**
 * useCollaboration Hook
 *
 * Main hook for managing collaborative editing with Y.js
 *
 * @example
 * ```tsx
 * const {
 *   doc,
 *   provider,
 *   awareness,
 *   activeUsers,
 *   isConnected,
 *   manager
 * } = useCollaboration({
 *   documentId: 'my-doc-123',
 *   userId: 'user-456',
 *   userName: 'John Doe',
 *   userColor: '#3B82F6'
 * });
 * ```
 */
export const useCollaboration = (config: UseCollaborationConfig): UseCollaborationReturn => {
  const {
    documentId,
    userId,
    userName,
    userColor,
    serverUrl,
    autoConnect = true,
    debug = false,
  } = config;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isActive, setIsActive] = useState(false);
  const managerRef = useRef<CollaborationManager | null>(null);
  const { activeUsers, isCollaborating } = useCollaborationStore();

  const log = useCallback(
    (...args: any[]) => {
      if (debug) {
        console.log('[useCollaboration]', ...args);
      }
    },
    [debug]
  );

  /**
   * Connect to collaboration session
   */
  const connect = useCallback(async () => {
    if (managerRef.current?.isActive()) {
      log('Already connected');
      return;
    }

    try {
      log('Connecting...', { documentId, userId, userName });

      // Create new manager if needed
      if (!managerRef.current) {
        managerRef.current = createCollaborationManager(
          {
            documentId,
            userId,
            userName,
            userColor,
            serverUrl,
          },
          {
            onUserJoin: (user) => {
              log('User joined:', user.name);
            },
            onUserLeave: (userId) => {
              log('User left:', userId);
            },
            onUserUpdate: (user) => {
              log('User updated:', user.name);
            },
            onStatusChange: (newStatus) => {
              log('Status changed:', newStatus);
              setStatus(newStatus);
            },
            onError: (error) => {
              console.error('[useCollaboration] Error:', error);
              setStatus('error');
            },
          }
        );
      }

      await managerRef.current.joinSession();
      setIsActive(true);
      log('Connected successfully');
    } catch (error) {
      console.error('[useCollaboration] Failed to connect:', error);
      setStatus('error');
      throw error;
    }
  }, [documentId, userId, userName, userColor, serverUrl, log]);

  /**
   * Disconnect from collaboration session
   */
  const disconnect = useCallback(() => {
    if (!managerRef.current) {
      return;
    }

    log('Disconnecting...');
    managerRef.current.leaveSession();
    setIsActive(false);
    setStatus('disconnected');
    log('Disconnected');
  }, [log]);

  /**
   * Update user information
   */
  const updateUser = useCallback(
    (updates: { name?: string; color?: string }) => {
      if (!managerRef.current) {
        return;
      }

      log('Updating user info:', updates);
      managerRef.current.updateUserInfo(updates);
    },
    [log]
  );

  /**
   * Update cursor position
   */
  const updateCursor = useCallback(
    (position: { x: number; y: number } | null) => {
      if (!managerRef.current) {
        return;
      }

      managerRef.current.updateCursorPosition(
        position ? { anchor: position.x, head: position.y } : null
      );
    },
    []
  );

  /**
   * Get Y.Text binding for editor
   */
  const getText = useCallback(
    (name: string = 'content'): Y.Text | null => {
      const provider = managerRef.current?.getProvider();
      return provider ? provider.getText(name) : null;
    },
    []
  );

  /**
   * Auto-connect on mount if enabled
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (managerRef.current?.isActive()) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect]);

  /**
   * Cleanup manager on documentId change
   */
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
    };
  }, [documentId]);

  // Get provider and doc from manager
  const provider = managerRef.current?.getProvider() || null;
  const doc = provider?.getDoc() || null;
  const awareness = provider?.getAwareness() || null;

  return {
    doc,
    provider,
    awareness,
    activeUsers,
    isConnected: status === 'connected',
    status,
    manager: managerRef.current,
    connect,
    disconnect,
    updateUser,
    updateCursor,
    getText,
    isActive,
  };
};

/**
 * useCollaborationStatus Hook
 *
 * Lightweight hook to access collaboration status without managing the connection
 */
export const useCollaborationStatus = () => {
  const { activeUsers, isCollaborating, documentId } = useCollaborationStore();

  return {
    activeUsers,
    isCollaborating,
    documentId,
    userCount: activeUsers.length,
  };
};

/**
 * useCollaborativeText Hook
 *
 * Hook for binding Y.Text to a text editor
 *
 * @example
 * ```tsx
 * const { text, content, updateContent } = useCollaborativeText({
 *   documentId: 'doc-123',
 *   userId: 'user-456',
 *   userName: 'John Doe'
 * });
 * ```
 */
export interface UseCollaborativeTextConfig extends UseCollaborationConfig {
  /** Name of the Y.Text binding */
  textName?: string;
  /** Initial content */
  initialContent?: string;
}

export const useCollaborativeText = (config: UseCollaborativeTextConfig) => {
  const { textName = 'content', initialContent = '' } = config;
  const collaboration = useCollaboration(config);
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    const yText = collaboration.getText(textName);
    if (!yText) return;

    // Set initial content if text is empty
    if (yText.length === 0 && initialContent) {
      yText.insert(0, initialContent);
    }

    // Update local content when Y.Text changes
    const observer = () => {
      setContent(yText.toString());
    };

    yText.observe(observer);
    setContent(yText.toString());

    return () => {
      yText.unobserve(observer);
    };
  }, [collaboration, textName, initialContent]);

  const updateContent = useCallback(
    (newContent: string) => {
      const yText = collaboration.getText(textName);
      if (!yText) return;

      // Replace entire content
      yText.delete(0, yText.length);
      yText.insert(0, newContent);
    },
    [collaboration, textName]
  );

  return {
    ...collaboration,
    text: collaboration.getText(textName),
    content,
    updateContent,
  };
};

export default useCollaboration;
