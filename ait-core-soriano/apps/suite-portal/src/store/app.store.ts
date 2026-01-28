import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppType =
  | 'ai-pgc'
  | 'ai-smartmatch'
  | 'ai-encashment'
  | 'ai-optimax'
  | 'ai-defender'
  | 'ai-forecaster'
  | 'ai-doc-manager'
  | 'ai-chatbot'
  | 'ai-voice'
  | 'ai-analytics'
  | 'ai-workflow'
  | 'ai-compliance'
  | 'ai-customer360'
  | 'ai-marketing';

interface AppState {
  currentApp: AppType | null;
  isSidebarOpen: boolean;
  isCommandMenuOpen: boolean;
  isDarkMode: boolean;
  isAIAssistantOpen: boolean;
  isCollaborationBarVisible: boolean;

  setCurrentApp: (app: AppType | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleCommandMenu: () => void;
  setCommandMenuOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  toggleAIAssistant: () => void;
  setAIAssistantOpen: (open: boolean) => void;
  setCollaborationBarVisible: (visible: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentApp: null,
      isSidebarOpen: true,
      isCommandMenuOpen: false,
      isDarkMode: false,
      isAIAssistantOpen: false,
      isCollaborationBarVisible: false,

      setCurrentApp: (app) =>
        set({
          currentApp: app,
        }),

      toggleSidebar: () =>
        set((state) => ({
          isSidebarOpen: !state.isSidebarOpen,
        })),

      setSidebarOpen: (open) =>
        set({
          isSidebarOpen: open,
        }),

      toggleCommandMenu: () =>
        set((state) => ({
          isCommandMenuOpen: !state.isCommandMenuOpen,
        })),

      setCommandMenuOpen: (open) =>
        set({
          isCommandMenuOpen: open,
        }),

      toggleDarkMode: () =>
        set((state) => ({
          isDarkMode: !state.isDarkMode,
        })),

      toggleAIAssistant: () =>
        set((state) => ({
          isAIAssistantOpen: !state.isAIAssistantOpen,
        })),

      setAIAssistantOpen: (open) =>
        set({
          isAIAssistantOpen: open,
        }),

      setCollaborationBarVisible: (visible) =>
        set({
          isCollaborationBarVisible: visible,
        }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        currentApp: state.currentApp,
        isSidebarOpen: state.isSidebarOpen,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);
