// ============================================================================
// usePresence Hook - React Hook for Presence Management
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserPresence,
  CursorPosition,
  SelectionRange,
  PresenceBroadcast,
} from '@/types/collaboration';
import { getPresenceManager } from '@/lib/collaboration/presence-manager';

export interface UsePresenceOptions {
  userId: string;
  documentId?: string;
  userName?: string;
  userAvatar?: string;
  enabled?: boolean;
  onBroadcast?: (broadcast: PresenceBroadcast) => void;
}

export interface UsePresenceReturn {
  activeUsers: UserPresence[];
  onlineUsers: UserPresence[];
  updateCursor: (cursor: CursorPosition) => void;
  updateSelection: (selection?: SelectionRange) => void;
  addRemoteUser: (userId: string, user?: any) => void;
  removeRemoteUser: (userId: string) => void;
  processRemoteUpdate: (broadcast: PresenceBroadcast) => void;
  presenceManager: ReturnType<typeof getPresenceManager>;
}

export function usePresence(options: UsePresenceOptions): UsePresenceReturn {
  const {
    userId,
    documentId,
    userName,
    userAvatar,
    enabled = true,
    onBroadcast,
  } = options;

  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const presenceManagerRef = useRef<ReturnType<typeof getPresenceManager> | null>(
    null
  );
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize presence manager
  useEffect(() => {
    if (!enabled || !userId) return;

    const manager = getPresenceManager(userId, documentId);
    presenceManagerRef.current = manager;

    // Set up broadcast callback
    if (onBroadcast) {
      manager.setBroadcastCallback(onBroadcast);
    }

    // Add local user
    manager.addUser(userId, {
      id: userId,
      name: userName || 'Anonymous',
      avatar: userAvatar,
    });

    // Subscribe to presence updates
    const unsubscribe = manager.subscribe((users) => {
      setActiveUsers(Array.from(users.values()));
    });

    return () => {
      unsubscribe();
    };
  }, [userId, documentId, userName, userAvatar, enabled, onBroadcast]);

  // Update cursor position (throttled)
  const updateCursor = useCallback(
    (cursor: CursorPosition) => {
      if (!presenceManagerRef.current || !enabled) return;

      presenceManagerRef.current.updateCursor(userId, cursor);
    },
    [userId, enabled]
  );

  // Update selection (throttled)
  const updateSelection = useCallback(
    (selection?: SelectionRange) => {
      if (!presenceManagerRef.current || !enabled) return;

      presenceManagerRef.current.updateSelection(userId, selection);
    },
    [userId, enabled]
  );

  // Add remote user
  const addRemoteUser = useCallback(
    (remoteUserId: string, user?: any) => {
      if (!presenceManagerRef.current || !enabled) return;
      presenceManagerRef.current.addUser(remoteUserId, user);
    },
    [enabled]
  );

  // Remove remote user
  const removeRemoteUser = useCallback(
    (remoteUserId: string) => {
      if (!presenceManagerRef.current || !enabled) return;
      presenceManagerRef.current.removeUser(remoteUserId);
    },
    [enabled]
  );

  // Process remote updates
  const processRemoteUpdate = useCallback(
    (broadcast: PresenceBroadcast) => {
      if (!presenceManagerRef.current || !enabled) return;
      presenceManagerRef.current.processRemoteUpdate(broadcast);
    },
    [enabled]
  );

  // Get online users only
  const onlineUsers = activeUsers.filter((user) => user.status === 'online');

  return {
    activeUsers,
    onlineUsers,
    updateCursor,
    updateSelection,
    addRemoteUser,
    removeRemoteUser,
    processRemoteUpdate,
    presenceManager: presenceManagerRef.current!,
  };
}

// Hook for tracking mouse position and converting to cursor position
export function useMouseTracking(
  containerRef: React.RefObject<HTMLElement>,
  enabled: boolean = true
) {
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(
    null
  );

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setCursorPosition({ x, y });
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [containerRef, enabled]);

  return cursorPosition;
}

// Hook for tracking text selection
export function useSelectionTracking(
  editorRef: React.RefObject<HTMLElement>,
  enabled: boolean = true
) {
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(
    null
  );

  useEffect(() => {
    if (!enabled || !editorRef.current) return;

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setSelectionRange(null);
        return;
      }

      const range = selection.getRangeAt(0);
      if (!editorRef.current?.contains(range.commonAncestorContainer)) {
        setSelectionRange(null);
        return;
      }

      // Get bounding rectangles for start and end
      const rects = range.getClientRects();
      if (rects.length === 0) {
        setSelectionRange(null);
        return;
      }

      const containerRect = editorRef.current.getBoundingClientRect();
      const startRect = rects[0];
      const endRect = rects[rects.length - 1];

      setSelectionRange({
        start: {
          x: startRect.left - containerRect.left,
          y: startRect.top - containerRect.top,
        },
        end: {
          x: endRect.right - containerRect.left,
          y: endRect.bottom - containerRect.top,
        },
        content: selection.toString(),
      });
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [editorRef, enabled]);

  return selectionRange;
}
