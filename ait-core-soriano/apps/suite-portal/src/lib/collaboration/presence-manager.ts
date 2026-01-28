// ============================================================================
// Presence Manager - Real-time User Presence System
// ============================================================================

import {
  UserPresence,
  PresenceStatus,
  CursorPosition,
  SelectionRange,
  PresenceBroadcast,
} from '@/types/collaboration';

// User color palette for collaboration
const USER_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
];

export class PresenceManager {
  private activeUsers: Map<string, UserPresence> = new Map();
  private localUserId: string;
  private documentId?: string;
  private lastBroadcast: number = 0;
  private broadcastThrottle: number = 100; // 100ms throttle
  private idleTimeout: number = 10000; // 10 seconds
  private offlineTimeout: number = 30000; // 30 seconds
  private idleCheckInterval?: NodeJS.Timeout;
  private listeners: Set<(users: Map<string, UserPresence>) => void> = new Set();
  private broadcastCallback?: (broadcast: PresenceBroadcast) => void;

  constructor(userId: string, documentId?: string) {
    this.localUserId = userId;
    this.documentId = documentId;
    this.startIdleCheck();
  }

  // Initialize with a broadcast callback for WebSocket/realtime sync
  setBroadcastCallback(callback: (broadcast: PresenceBroadcast) => void) {
    this.broadcastCallback = callback;
  }

  // Subscribe to presence updates
  subscribe(callback: (users: Map<string, UserPresence>) => void) {
    this.listeners.add(callback);
    // Immediately notify with current state
    callback(new Map(this.activeUsers));
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach((callback) => {
      callback(new Map(this.activeUsers));
    });
  }

  // Get a unique color for a user
  private getUserColor(userId: string): string {
    const existingUser = this.activeUsers.get(userId);
    if (existingUser) return existingUser.color;

    // Use hash of userId to consistently assign colors
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % USER_COLORS.length;
    return USER_COLORS[index];
  }

  // Add or update a user's presence
  addUser(userId: string, user?: any): UserPresence {
    const now = new Date();
    const existingUser = this.activeUsers.get(userId);

    const presence: UserPresence = {
      userId,
      user,
      status: 'online',
      lastSeen: now,
      lastActivity: now,
      color: existingUser?.color || this.getUserColor(userId),
      cursor: existingUser?.cursor,
      selection: existingUser?.selection,
    };

    this.activeUsers.set(userId, presence);
    this.notifyListeners();

    // Broadcast join event
    this.broadcast({
      type: 'join',
      userId,
      data: presence,
      timestamp: Date.now(),
    });

    return presence;
  }

  // Remove a user
  removeUser(userId: string) {
    const user = this.activeUsers.get(userId);
    if (user) {
      this.activeUsers.delete(userId);
      this.notifyListeners();

      // Broadcast leave event
      this.broadcast({
        type: 'leave',
        userId,
        data: {},
        timestamp: Date.now(),
      });
    }
  }

  // Update cursor position with throttling
  updateCursor(userId: string, cursor: CursorPosition) {
    const user = this.activeUsers.get(userId);
    if (!user) return;

    const now = Date.now();
    const shouldBroadcast = now - this.lastBroadcast >= this.broadcastThrottle;

    user.cursor = cursor;
    user.lastActivity = new Date();
    user.status = 'online';
    this.activeUsers.set(userId, user);

    if (shouldBroadcast) {
      this.lastBroadcast = now;
      this.notifyListeners();

      // Broadcast cursor update
      if (userId === this.localUserId) {
        this.broadcast({
          type: 'cursor',
          userId,
          data: { cursor },
          timestamp: now,
        });
      }
    }
  }

  // Update selection with throttling
  updateSelection(userId: string, selection?: SelectionRange) {
    const user = this.activeUsers.get(userId);
    if (!user) return;

    const now = Date.now();
    const shouldBroadcast = now - this.lastBroadcast >= this.broadcastThrottle;

    user.selection = selection;
    user.lastActivity = new Date();
    user.status = 'online';
    this.activeUsers.set(userId, user);

    if (shouldBroadcast) {
      this.lastBroadcast = now;
      this.notifyListeners();

      // Broadcast selection update
      if (userId === this.localUserId) {
        this.broadcast({
          type: 'selection',
          userId,
          data: { selection },
          timestamp: now,
        });
      }
    }
  }

  // Update user status
  updateStatus(userId: string, status: PresenceStatus) {
    const user = this.activeUsers.get(userId);
    if (!user) return;

    user.status = status;
    user.lastSeen = new Date();
    this.activeUsers.set(userId, user);
    this.notifyListeners();

    // Broadcast status update
    if (userId === this.localUserId) {
      this.broadcast({
        type: 'status',
        userId,
        data: { status },
        timestamp: Date.now(),
      });
    }
  }

  // Process incoming presence broadcast from other users
  processRemoteUpdate(broadcast: PresenceBroadcast) {
    const { userId, type, data, timestamp } = broadcast;

    // Ignore our own broadcasts
    if (userId === this.localUserId) return;

    let user = this.activeUsers.get(userId);
    if (!user && type === 'join') {
      user = this.addUser(userId, data.user);
      return;
    }

    if (!user) return;

    const now = new Date();

    switch (type) {
      case 'cursor':
        if (data.cursor) {
          user.cursor = data.cursor;
          user.lastActivity = now;
          user.status = 'online';
        }
        break;

      case 'selection':
        user.selection = data.selection;
        user.lastActivity = now;
        user.status = 'online';
        break;

      case 'status':
        if (data.status) {
          user.status = data.status;
          user.lastSeen = now;
        }
        break;

      case 'leave':
        this.removeUser(userId);
        return;

      default:
        break;
    }

    this.activeUsers.set(userId, user);
    this.notifyListeners();
  }

  // Broadcast presence update
  private broadcast(broadcast: PresenceBroadcast) {
    if (this.broadcastCallback) {
      this.broadcastCallback(broadcast);
    }
  }

  // Check for idle and offline users
  private startIdleCheck() {
    this.idleCheckInterval = setInterval(() => {
      const now = Date.now();
      let hasChanges = false;

      this.activeUsers.forEach((user, userId) => {
        const timeSinceActivity = now - user.lastActivity.getTime();
        const timeSinceSeen = now - user.lastSeen.getTime();

        if (timeSinceSeen > this.offlineTimeout && user.status !== 'offline') {
          user.status = 'offline';
          hasChanges = true;
        } else if (
          timeSinceActivity > this.idleTimeout &&
          user.status === 'online'
        ) {
          user.status = 'idle';
          hasChanges = true;
        }

        this.activeUsers.set(userId, user);
      });

      if (hasChanges) {
        this.notifyListeners();
      }
    }, 1000); // Check every second
  }

  // Get all active users
  getActiveUsers(): UserPresence[] {
    return Array.from(this.activeUsers.values());
  }

  // Get online users only
  getOnlineUsers(): UserPresence[] {
    return this.getActiveUsers().filter((user) => user.status === 'online');
  }

  // Get user by ID
  getUser(userId: string): UserPresence | undefined {
    return this.activeUsers.get(userId);
  }

  // Clear all presence data
  clear() {
    this.activeUsers.clear();
    this.notifyListeners();
  }

  // Cleanup
  destroy() {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
    }
    this.listeners.clear();
    this.activeUsers.clear();
  }
}

// Singleton instance for global access
let globalPresenceManager: PresenceManager | null = null;

export function getPresenceManager(
  userId?: string,
  documentId?: string
): PresenceManager {
  if (!globalPresenceManager && userId) {
    globalPresenceManager = new PresenceManager(userId, documentId);
  }
  return globalPresenceManager!;
}

export function resetPresenceManager() {
  if (globalPresenceManager) {
    globalPresenceManager.destroy();
    globalPresenceManager = null;
  }
}
