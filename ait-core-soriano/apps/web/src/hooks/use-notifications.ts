// Notifications Hook
import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notification-store';
import { useWebSocketStore } from '@/store/websocket-store';
import { useAuthStore } from '@/store/auth-store';
import { Notification } from '@/types';
import toast from 'react-hot-toast';

export function useNotifications() {
  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();

  const { isConnected, subscribe } = useWebSocketStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !isConnected) return;

    // Subscribe to notification events
    const unsubscribe = subscribe('notification', (data: Notification) => {
      addNotification(data);

      // Show toast notification
      const message = data.title ? `${data.title}: ${data.message}` : data.message;

      switch (data.type) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
          toast.error(message);
          break;
        case 'warning':
          toast(message, { icon: '⚠️' });
          break;
        case 'info':
        default:
          toast(message, { icon: 'ℹ️' });
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, isConnected, subscribe, addNotification]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };
}
