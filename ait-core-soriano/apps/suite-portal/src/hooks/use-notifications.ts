import { useEffect, useCallback } from 'react';
import { useNotificationsStore, Notification, NotificationType } from '@/store/notifications.store';
import { notificationManager } from '@/lib/notifications/notification-manager';

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
  addNotification: (notification: {
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
  }) => void;
  isConnected: boolean;
}

export function useNotifications(): UseNotificationsReturn {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    addNotification: addNotificationToStore,
  } = useNotificationsStore();

  // Connect to WebSocket when hook is used
  useEffect(() => {
    notificationManager.connect();

    return () => {
      // Don't disconnect on unmount as other components might be using it
      // notificationManager.disconnect();
    };
  }, []);

  // Wrapper to add notification through the manager
  const addNotification = useCallback(
    (notification: {
      type: NotificationType;
      title: string;
      message: string;
      actionUrl?: string;
      actionLabel?: string;
      metadata?: Record<string, any>;
    }) => {
      notificationManager.addNotification(notification);
    },
    []
  );

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    addNotification,
    isConnected: notificationManager.isConnected(),
  };
}
