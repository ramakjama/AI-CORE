import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) =>
        set((state) => {
          const newNotification: Notification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            read: false,
          };

          // Keep only last 100 notifications
          const notifications = [newNotification, ...state.notifications].slice(0, 100);
          const unreadCount = notifications.filter((n) => !n.read).length;

          return {
            notifications,
            unreadCount,
          };
        }),

      markAsRead: (id) =>
        set((state) => {
          const notifications = state.notifications.map((notification) =>
            notification.id === id
              ? { ...notification, read: true }
              : notification
          );
          const unreadCount = notifications.filter((n) => !n.read).length;

          return {
            notifications,
            unreadCount,
          };
        }),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
          })),
          unreadCount: 0,
        })),

      clearAll: () =>
        set({
          notifications: [],
          unreadCount: 0,
        }),

      removeNotification: (id) =>
        set((state) => {
          const notifications = state.notifications.filter((n) => n.id !== id);
          const unreadCount = notifications.filter((n) => !n.read).length;

          return {
            notifications,
            unreadCount,
          };
        }),
    }),
    {
      name: 'notifications-storage',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 100),
      }),
      onRehydrateStorage: () => (state) => {
        // Recalculate unread count after rehydration
        if (state) {
          state.unreadCount = state.notifications.filter((n) => !n.read).length;
        }
      },
    }
  )
);
