import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// NOVA BROWSER - PREMIUM EDITION
// AI Innovation Technologies
// ============================================

export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  workspaceId: string;
  securityScore: number;
  isSecure: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  tabs: string[];
}

export interface HistoryItem {
  url: string;
  title: string;
  visitedAt: Date;
  favicon?: string;
  securityScore: number;
}

export interface SecurityThreat {
  id: string;
  type: 'malware' | 'phishing' | 'tracker' | 'suspicious';
  severity: 'low' | 'medium' | 'high' | 'critical';
  url: string;
  description: string;
  blockedAt: Date;
}

export interface SecurityStats {
  threatsBlocked: number;
  trackersBlocked: number;
  adsBlocked: number;
  malwareBlocked: number;
  phishingBlocked: number;
  scansDone: number;
  lastScan: Date | null;
}

interface BrowserState {
  // Tabs
  tabs: Tab[];
  activeTab: string | null;

  // Workspaces
  workspaces: Workspace[];
  activeWorkspace: string;

  // History & Bookmarks
  history: HistoryItem[];
  bookmarks: { url: string; title: string; favicon?: string }[];

  // Security (AI-Defender Integration)
  securityEnabled: boolean;
  securityStats: SecurityStats;
  recentThreats: SecurityThreat[];
  isScanning: boolean;
  protectionLevel: 'standard' | 'strict' | 'paranoid';

  // Settings
  isAdBlockEnabled: boolean;
  isTrackingProtectionEnabled: boolean;
  isHttpsOnlyMode: boolean;
  theme: 'dark' | 'light' | 'auto';

  // Tab Actions
  addTab: (url?: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<Tab>) => void;

  // Workspace Actions
  addWorkspace: (name: string, icon: string) => void;
  setActiveWorkspace: (id: string) => void;
  deleteWorkspace: (id: string) => void;

  // Security Actions
  toggleSecurity: () => void;
  setProtectionLevel: (level: 'standard' | 'strict' | 'paranoid') => void;
  addThreat: (threat: Omit<SecurityThreat, 'id' | 'blockedAt'>) => void;
  runSecurityScan: () => void;
  incrementBlockedCount: (type: 'tracker' | 'ad' | 'malware' | 'phishing') => void;

  // Settings
  toggleAdBlock: () => void;
  toggleTrackingProtection: () => void;
  toggleHttpsOnly: () => void;
  setTheme: (theme: 'dark' | 'light' | 'auto') => void;

  // History
  addToHistory: (item: Omit<HistoryItem, 'visitedAt'>) => void;
  clearHistory: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useBrowserStore = create<BrowserState>()(
  persist(
    (set, get) => ({
      // Initial State
      tabs: [
        {
          id: 'default-tab',
          url: 'nova://newtab',
          title: 'New Tab',
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
          workspaceId: 'default',
          securityScore: 100,
          isSecure: true,
        },
      ],
      activeTab: 'default-tab',

      workspaces: [
        { id: 'default', name: 'Default', icon: 'layout', tabs: ['default-tab'] },
        { id: 'work', name: 'Work', icon: 'briefcase', tabs: [] },
        { id: 'personal', name: 'Personal', icon: 'user', tabs: [] },
      ],
      activeWorkspace: 'default',

      history: [],
      bookmarks: [],

      // Security State
      securityEnabled: true,
      securityStats: {
        threatsBlocked: 1247,
        trackersBlocked: 8934,
        adsBlocked: 15672,
        malwareBlocked: 23,
        phishingBlocked: 156,
        scansDone: 47,
        lastScan: new Date(),
      },
      recentThreats: [],
      isScanning: false,
      protectionLevel: 'strict',

      // Settings State
      isAdBlockEnabled: true,
      isTrackingProtectionEnabled: true,
      isHttpsOnlyMode: true,
      theme: 'dark',

      // Tab Actions
      addTab: (url = 'nova://newtab') => {
        const id = generateId();
        const { activeWorkspace, workspaces } = get();

        set(state => ({
          tabs: [
            ...state.tabs,
            {
              id,
              url,
              title: url === 'nova://newtab' ? 'New Tab' : 'Loading...',
              isLoading: url !== 'nova://newtab',
              canGoBack: false,
              canGoForward: false,
              workspaceId: activeWorkspace,
              securityScore: 100,
              isSecure: url.startsWith('https://') || url.startsWith('nova://'),
            },
          ],
          activeTab: id,
          workspaces: workspaces.map(w =>
            w.id === activeWorkspace ? { ...w, tabs: [...w.tabs, id] } : w
          ),
        }));
      },

      closeTab: (id: string) => {
        const { tabs, activeTab, workspaces } = get();

        if (tabs.length === 1) {
          const newId = generateId();
          set({
            tabs: [
              {
                id: newId,
                url: 'nova://newtab',
                title: 'New Tab',
                isLoading: false,
                canGoBack: false,
                canGoForward: false,
                workspaceId: get().activeWorkspace,
                securityScore: 100,
                isSecure: true,
              },
            ],
            activeTab: newId,
          });
          return;
        }

        const tabIndex = tabs.findIndex(t => t.id === id);
        const newTabs = tabs.filter(t => t.id !== id);
        let newActiveTab = activeTab;

        if (activeTab === id) {
          newActiveTab = newTabs[Math.min(tabIndex, newTabs.length - 1)]?.id || null;
        }

        set({
          tabs: newTabs,
          activeTab: newActiveTab,
          workspaces: workspaces.map(w => ({
            ...w,
            tabs: w.tabs.filter(t => t !== id),
          })),
        });
      },

      setActiveTab: (id: string) => set({ activeTab: id }),

      updateTab: (id: string, updates: Partial<Tab>) => {
        set(state => ({
          tabs: state.tabs.map(tab => (tab.id === id ? { ...tab, ...updates } : tab)),
        }));
      },

      // Workspace Actions
      addWorkspace: (name: string, icon: string) => {
        const id = generateId();
        set(state => ({
          workspaces: [...state.workspaces, { id, name, icon, tabs: [] }],
        }));
      },

      setActiveWorkspace: (id: string) => set({ activeWorkspace: id }),

      deleteWorkspace: (id: string) => {
        const { workspaces } = get();
        if (workspaces.length === 1) return;

        set(state => ({
          workspaces: state.workspaces.filter(w => w.id !== id),
          activeWorkspace:
            state.activeWorkspace === id ? state.workspaces[0].id : state.activeWorkspace,
        }));
      },

      // Security Actions
      toggleSecurity: () => set(state => ({ securityEnabled: !state.securityEnabled })),

      setProtectionLevel: (level) => set({ protectionLevel: level }),

      addThreat: (threat) => {
        const newThreat: SecurityThreat = {
          ...threat,
          id: generateId(),
          blockedAt: new Date(),
        };
        set(state => ({
          recentThreats: [newThreat, ...state.recentThreats].slice(0, 50),
          securityStats: {
            ...state.securityStats,
            threatsBlocked: state.securityStats.threatsBlocked + 1,
          },
        }));
      },

      runSecurityScan: () => {
        set({ isScanning: true });
        setTimeout(() => {
          set(state => ({
            isScanning: false,
            securityStats: {
              ...state.securityStats,
              scansDone: state.securityStats.scansDone + 1,
              lastScan: new Date(),
            },
          }));
        }, 3000);
      },

      incrementBlockedCount: (type) => {
        set(state => ({
          securityStats: {
            ...state.securityStats,
            trackersBlocked: type === 'tracker' ? state.securityStats.trackersBlocked + 1 : state.securityStats.trackersBlocked,
            adsBlocked: type === 'ad' ? state.securityStats.adsBlocked + 1 : state.securityStats.adsBlocked,
            malwareBlocked: type === 'malware' ? state.securityStats.malwareBlocked + 1 : state.securityStats.malwareBlocked,
            phishingBlocked: type === 'phishing' ? state.securityStats.phishingBlocked + 1 : state.securityStats.phishingBlocked,
          },
        }));
      },

      // Settings Actions
      toggleAdBlock: () => set(state => ({ isAdBlockEnabled: !state.isAdBlockEnabled })),
      toggleTrackingProtection: () => set(state => ({ isTrackingProtectionEnabled: !state.isTrackingProtectionEnabled })),
      toggleHttpsOnly: () => set(state => ({ isHttpsOnlyMode: !state.isHttpsOnlyMode })),
      setTheme: (theme) => set({ theme }),

      // History Actions
      addToHistory: (item) => {
        set(state => ({
          history: [{ ...item, visitedAt: new Date() }, ...state.history].slice(0, 1000),
        }));
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'nova-browser-storage',
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        isAdBlockEnabled: state.isAdBlockEnabled,
        isTrackingProtectionEnabled: state.isTrackingProtectionEnabled,
        isHttpsOnlyMode: state.isHttpsOnlyMode,
        theme: state.theme,
        protectionLevel: state.protectionLevel,
        securityStats: state.securityStats,
      }),
    }
  )
);
