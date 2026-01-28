// UI Store - Zustand
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  isMobile: boolean;
  activeModal: string | null;
  modalData: any;
  breadcrumbs: Breadcrumb[];
  pageTitle: string;
  isPageLoading: boolean;
}

interface Breadcrumb {
  label: string;
  href?: string;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  setIsMobile: (isMobile: boolean) => void;
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
  setPageTitle: (title: string) => void;
  setPageLoading: (loading: boolean) => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: 'system',
  language: 'es',
  isMobile: false,
  activeModal: null,
  modalData: null,
  breadcrumbs: [],
  pageTitle: '',
  isPageLoading: false,
};

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        setSidebarOpen: (open) =>
          set({ sidebarOpen: open }),

        toggleSidebarCollapsed: () =>
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

        setSidebarCollapsed: (collapsed) =>
          set({ sidebarCollapsed: collapsed }),

        setTheme: (theme) => {
          set({ theme });
          if (typeof window !== 'undefined') {
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');

            if (theme === 'system') {
              const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
              root.classList.add(systemTheme);
            } else {
              root.classList.add(theme);
            }
          }
        },

        setLanguage: (language) =>
          set({ language }),

        setIsMobile: (isMobile) =>
          set({ isMobile }),

        openModal: (modalId, data) =>
          set({
            activeModal: modalId,
            modalData: data,
          }),

        closeModal: () =>
          set({
            activeModal: null,
            modalData: null,
          }),

        setBreadcrumbs: (breadcrumbs) =>
          set({ breadcrumbs }),

        setPageTitle: (title) =>
          set({ pageTitle: title }),

        setPageLoading: (loading) =>
          set({ isPageLoading: loading }),
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          language: state.language,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);
