// ============================================================================
// Enhanced Collaboration Types
// ============================================================================

import { User } from './index';

export type PresenceStatus = 'online' | 'idle' | 'offline';

export interface CursorPosition {
  x: number;
  y: number;
  line?: number;
  column?: number;
}

export interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
  content?: string;
}

export interface UserPresence {
  userId: string;
  user?: User;
  status: PresenceStatus;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  lastSeen: Date;
  lastActivity: Date;
  color: string;
}

export interface PresenceUpdate {
  userId: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  timestamp: number;
}

export interface CollaborationState {
  activeUsers: Map<string, UserPresence>;
  localUserId: string;
  documentId?: string;
}

export interface PresenceBroadcast {
  type: 'cursor' | 'selection' | 'status' | 'join' | 'leave';
  userId: string;
  data: Partial<UserPresence>;
  timestamp: number;
}
