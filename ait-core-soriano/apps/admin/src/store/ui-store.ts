import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/utils/constants';

interface UiState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface UiActions {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

type UiStore = UiState & UiActions;

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      // State
      theme: 'system',
      sidebarOpen: true,
      sidebarCollapsed: false,
      notifications: [],

      // Actions
      setTheme: (theme) =>
        set({
          theme,
        }),

      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),

      setSidebarOpen: (open) =>
        set({
          sidebarOpen: open,
        }),

      toggleSidebarCollapsed: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      setSidebarCollapsed: (collapsed) =>
        set({
          sidebarCollapsed: collapsed,
        }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: `notif-${Date.now()}-${Math.random()}`,
              timestamp: new Date().toISOString(),
              read: false,
            },
            ...state.notifications,
          ],
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      markNotificationAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllNotificationsAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      clearNotifications: () =>
        set({
          notifications: [],
        }),
    }),
    {
      name: STORAGE_KEYS.USER_PREFERENCES,
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
