/**
 * TypeScript Type Definitions for Notifications System
 *
 * This file contains all type definitions used in the notification system.
 * Import types from here for consistent typing across the application.
 */

/**
 * Notification type enum
 * Determines the visual style and icon of the notification
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Main notification interface
 * Represents a single notification in the system
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string;

  /** Type of notification (affects styling and icon) */
  type: NotificationType;

  /** Notification title (bold, prominent) */
  title: string;

  /** Notification message (detailed description) */
  message: string;

  /** Unix timestamp of when the notification was created */
  timestamp: number;

  /** Whether the notification has been read */
  read: boolean;

  /** Optional URL to navigate to when notification is clicked */
  actionUrl?: string;

  /** Optional label for the action button */
  actionLabel?: string;

  /** Optional metadata for custom use cases */
  metadata?: Record<string, any>;
}

/**
 * Notification event interface
 * Used when creating new notifications or receiving them from WebSocket
 */
export interface NotificationEvent {
  /** Type of notification */
  type: NotificationType;

  /** Notification title */
  title: string;

  /** Notification message */
  message: string;

  /** Optional action URL */
  actionUrl?: string;

  /** Optional action label */
  actionLabel?: string;

  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * Input type for adding a new notification
 * Omits auto-generated fields (id, timestamp, read)
 */
export type AddNotificationInput = Omit<Notification, 'id' | 'timestamp' | 'read'>;

/**
 * Grouped notifications interface
 * Used for organizing notifications by date ranges
 */
export interface GroupedNotifications {
  /** Notifications from today */
  today: Notification[];

  /** Notifications from yesterday */
  yesterday: Notification[];

  /** Notifications from this week (excluding today/yesterday) */
  thisWeek: Notification[];

  /** Notifications older than this week */
  older: Notification[];
}

/**
 * Notification store state interface
 */
export interface NotificationsState {
  /** Array of all notifications */
  notifications: Notification[];

  /** Count of unread notifications */
  unreadCount: number;

  /** Add a new notification */
  addNotification: (notification: AddNotificationInput) => void;

  /** Mark a notification as read */
  markAsRead: (id: string) => void;

  /** Mark all notifications as read */
  markAllAsRead: () => void;

  /** Clear all notifications */
  clearAll: () => void;

  /** Remove a specific notification */
  removeNotification: (id: string) => void;
}

/**
 * Hook return type for useNotifications
 */
export interface UseNotificationsReturn {
  /** Array of all notifications */
  notifications: Notification[];

  /** Count of unread notifications */
  unreadCount: number;

  /** Mark a notification as read */
  markAsRead: (id: string) => void;

  /** Mark all notifications as read */
  markAllAsRead: () => void;

  /** Clear all notifications */
  clearAll: () => void;

  /** Remove a specific notification */
  removeNotification: (id: string) => void;

  /** Add a new notification */
  addNotification: (notification: AddNotificationInput) => void;

  /** WebSocket connection status */
  isConnected: boolean;
}

/**
 * WebSocket event names
 */
export const NOTIFICATION_EVENTS = {
  /** Generic notification event */
  NOTIFICATION: 'notification',

  /** Info notification event */
  NOTIFICATION_INFO: 'notification:info',

  /** Success notification event */
  NOTIFICATION_SUCCESS: 'notification:success',

  /** Warning notification event */
  NOTIFICATION_WARNING: 'notification:warning',

  /** Error notification event */
  NOTIFICATION_ERROR: 'notification:error',
} as const;

/**
 * Notification configuration constants
 */
export const NOTIFICATION_CONFIG = {
  /** Maximum notifications to store in state */
  MAX_STORED: 100,

  /** Maximum notifications to show in center */
  MAX_DISPLAYED: 50,

  /** Maximum toast notifications visible at once */
  MAX_TOASTS: 3,

  /** Auto-dismiss duration in milliseconds */
  AUTO_DISMISS_DURATION: 5000,

  /** WebSocket reconnection attempts */
  MAX_RECONNECT_ATTEMPTS: 5,

  /** WebSocket reconnection delay in milliseconds */
  RECONNECT_DELAY: 1000,
} as const;

/**
 * Notification type configuration
 * Maps notification types to their visual properties
 */
export interface NotificationTypeConfig {
  /** Icon component */
  icon: React.ComponentType<{ className?: string }>;

  /** Background color class */
  bgColor: string;

  /** Border color class */
  borderColor: string;

  /** Icon color class */
  iconColor: string;
}

/**
 * Toast notification props
 */
export interface NotificationToastProps {
  /** The notification to display */
  notification: Notification;

  /** Callback when toast is closed */
  onClose: (id: string) => void;

  /** Index in the toast stack (for positioning) */
  index: number;
}

/**
 * Notification center props
 */
export interface NotificationCenterProps {
  /** Whether the center is open */
  open: boolean;

  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;

  /** Trigger element (usually the bell icon button) */
  children: React.ReactNode;
}

/**
 * Notification manager interface
 */
export interface INotificationManager {
  /** Connect to WebSocket server */
  connect: () => void;

  /** Disconnect from WebSocket server */
  disconnect: () => void;

  /** Emit custom event */
  emit: (event: string, data: any) => void;

  /** Add notification manually */
  addNotification: (notification: AddNotificationInput & { type?: NotificationType }) => void;

  /** Check if connected to WebSocket */
  isConnected: () => boolean;
}

/**
 * Type guard to check if notification is unread
 */
export function isUnreadNotification(notification: Notification): boolean {
  return !notification.read;
}

/**
 * Type guard to check if notification has action
 */
export function hasAction(notification: Notification): notification is Notification & {
  actionUrl: string;
  actionLabel: string;
} {
  return Boolean(notification.actionUrl && notification.actionLabel);
}

/**
 * Helper type for notification filters
 */
export type NotificationFilter = 'all' | 'unread' | NotificationType;

/**
 * Helper type for notification sort order
 */
export type NotificationSortOrder = 'newest' | 'oldest';
