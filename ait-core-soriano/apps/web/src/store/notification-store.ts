// Notification Store - Zustand
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

interface NotificationActions {
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setNotifications: (notifications: Notification[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        error: null,

        // Actions
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: crypto.randomUUID(),
            read: false,
            createdAt: new Date(),
          };

          set((state) => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }));
        },

        markAsRead: (id) => {
          set((state) => {
            const notification = state.notifications.find((n) => n.id === id);
            if (!notification || notification.read) return state;

            return {
              notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true, readAt: new Date() } : n
              ),
              unreadCount: state.unreadCount - 1,
            };
          });
        },

        markAllAsRead: () => {
          set((state) => ({
            notifications: state.notifications.map((n) => ({
              ...n,
              read: true,
              readAt: n.readAt || new Date(),
            })),
            unreadCount: 0,
          }));
        },

        removeNotification: (id) => {
          set((state) => {
            const notification = state.notifications.find((n) => n.id === id);
            return {
              notifications: state.notifications.filter((n) => n.id !== id),
              unreadCount: notification?.read ? state.unreadCount : state.unreadCount - 1,
            };
          });
        },

        clearAll: () => {
          set({
            notifications: [],
            unreadCount: 0,
          });
        },

        setNotifications: (notifications) => {
          const unreadCount = notifications.filter((n) => !n.read).length;
          set({ notifications, unreadCount });
        },

        setLoading: (loading) => set({ isLoading: loading }),

        setError: (error) => set({ error }),
      }),
      {
        name: 'notification-store',
        partialize: (state) => ({
          notifications: state.notifications,
          unreadCount: state.unreadCount,
        }),
      }
    ),
    { name: 'NotificationStore' }
  )
);
