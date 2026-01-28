import { contextBridge, ipcRenderer } from 'electron';

// ============================================
// NOVA BROWSER - PRELOAD SCRIPT
// Secure bridge between main and renderer
// ============================================

// Type definitions for the API
interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  visitCount: number;
  lastVisit: string;
}

interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  folderId?: string;
}

interface Download {
  id: string;
  url: string;
  fileName: string;
  savePath?: string;
  totalBytes?: number;
  status: string;
  completedAt?: string;
}

interface SecurityStats {
  threatsBlocked: number;
  trackersBlocked: number;
  adsBlocked: number;
  malwareBlocked: number;
  phishingBlocked: number;
  isAdBlockEnabled: boolean;
  isTrackingProtectionEnabled: boolean;
  httpsOnlyMode: boolean;
  protectionLevel: string;
  lastScan: string | null;
}

interface ThreatRecord {
  id: string;
  type: string;
  url: string;
  severity: string;
  blockedAt: Date;
}

// Expose secure API to renderer
contextBridge.exposeInMainWorld('nova', {
  // ==========================================
  // WINDOW CONTROLS
  // ==========================================
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
    onFullscreenChange: (callback: (isFullscreen: boolean) => void) => {
      ipcRenderer.on('fullscreen-change', (_, isFullscreen) => callback(isFullscreen));
    },
  },

  // ==========================================
  // BROWSER NAVIGATION
  // ==========================================
  browser: {
    navigate: (url: string) => ipcRenderer.invoke('browser:navigate', url),
  },

  // ==========================================
  // HISTORY
  // ==========================================
  history: {
    getAll: (limit?: number): Promise<HistoryEntry[]> =>
      ipcRenderer.invoke('history:getAll', limit),
    add: (entry: { url: string; title: string; favicon?: string }): Promise<HistoryEntry> =>
      ipcRenderer.invoke('history:add', entry),
    search: (query: string): Promise<HistoryEntry[]> =>
      ipcRenderer.invoke('history:search', query),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke('history:delete', id),
    clear: (): Promise<void> =>
      ipcRenderer.invoke('history:clear'),
  },

  // ==========================================
  // BOOKMARKS
  // ==========================================
  bookmarks: {
    getAll: (): Promise<Bookmark[]> =>
      ipcRenderer.invoke('bookmarks:getAll'),
    add: (bookmark: { url: string; title: string; favicon?: string; folderId?: string }): Promise<Bookmark> =>
      ipcRenderer.invoke('bookmarks:add', bookmark),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke('bookmarks:delete', id),
    update: (id: string, data: Partial<{ title: string; url: string; folderId: string }>): Promise<boolean> =>
      ipcRenderer.invoke('bookmarks:update', id, data),
    createFolder: (name: string, parentId?: string): Promise<any> =>
      ipcRenderer.invoke('bookmarks:createFolder', name, parentId),
  },

  // ==========================================
  // DOWNLOADS
  // ==========================================
  downloads: {
    getAll: (): Promise<Download[]> =>
      ipcRenderer.invoke('downloads:getAll'),
    openFile: (path: string): Promise<string> =>
      ipcRenderer.invoke('downloads:openFile', path),
    showInFolder: (path: string): Promise<void> =>
      ipcRenderer.invoke('downloads:showInFolder', path),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke('downloads:delete', id),
    onStarted: (callback: (download: any) => void) => {
      ipcRenderer.on('download-started', (_, download) => callback(download));
    },
    onProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('download-progress', (_, progress) => callback(progress));
    },
    onCompleted: (callback: (result: any) => void) => {
      ipcRenderer.on('download-completed', (_, result) => callback(result));
    },
    onFailed: (callback: (error: any) => void) => {
      ipcRenderer.on('download-failed', (_, error) => callback(error));
    },
  },

  // ==========================================
  // SECURITY (AI-Defender)
  // ==========================================
  security: {
    getStats: (): Promise<SecurityStats> =>
      ipcRenderer.invoke('security:getStats'),
    toggleAdBlock: (): Promise<boolean> =>
      ipcRenderer.invoke('security:toggleAdBlock'),
    toggleTrackingProtection: (): Promise<boolean> =>
      ipcRenderer.invoke('security:toggleTrackingProtection'),
    toggleHttpsOnly: (): Promise<boolean> =>
      ipcRenderer.invoke('security:toggleHttpsOnly'),
    setProtectionLevel: (level: 'standard' | 'strict' | 'paranoid'): Promise<void> =>
      ipcRenderer.invoke('security:setProtectionLevel', level),
    runScan: (): Promise<{ clean: boolean; issues: string[]; recommendations: string[] }> =>
      ipcRenderer.invoke('security:runScan'),
    getRecentThreats: (): Promise<ThreatRecord[]> =>
      ipcRenderer.invoke('security:getRecentThreats'),
  },

  // ==========================================
  // SYSTEM
  // ==========================================
  system: {
    getVersion: (): Promise<string> =>
      ipcRenderer.invoke('system:getVersion'),
    getPlatform: (): Promise<string> =>
      ipcRenderer.invoke('system:getPlatform'),
    openExternal: (url: string): Promise<void> =>
      ipcRenderer.invoke('system:openExternal', url),
  },

  // Platform info (sync)
  platform: process.platform,
});

// TypeScript declaration for the exposed API
declare global {
  interface Window {
    nova: {
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<boolean>;
        close: () => Promise<void>;
        isMaximized: () => Promise<boolean>;
        toggleFullscreen: () => Promise<boolean>;
        onFullscreenChange: (callback: (isFullscreen: boolean) => void) => void;
      };
      browser: {
        navigate: (url: string) => Promise<{ success: boolean; url?: string; error?: string }>;
      };
      history: {
        getAll: (limit?: number) => Promise<HistoryEntry[]>;
        add: (entry: { url: string; title: string; favicon?: string }) => Promise<HistoryEntry>;
        search: (query: string) => Promise<HistoryEntry[]>;
        delete: (id: string) => Promise<boolean>;
        clear: () => Promise<void>;
      };
      bookmarks: {
        getAll: () => Promise<Bookmark[]>;
        add: (bookmark: { url: string; title: string; favicon?: string; folderId?: string }) => Promise<Bookmark>;
        delete: (id: string) => Promise<boolean>;
        update: (id: string, data: Partial<{ title: string; url: string; folderId: string }>) => Promise<boolean>;
        createFolder: (name: string, parentId?: string) => Promise<any>;
      };
      downloads: {
        getAll: () => Promise<Download[]>;
        openFile: (path: string) => Promise<string>;
        showInFolder: (path: string) => Promise<void>;
        delete: (id: string) => Promise<boolean>;
        onStarted: (callback: (download: any) => void) => void;
        onProgress: (callback: (progress: any) => void) => void;
        onCompleted: (callback: (result: any) => void) => void;
        onFailed: (callback: (error: any) => void) => void;
      };
      security: {
        getStats: () => Promise<SecurityStats>;
        toggleAdBlock: () => Promise<boolean>;
        toggleTrackingProtection: () => Promise<boolean>;
        toggleHttpsOnly: () => Promise<boolean>;
        setProtectionLevel: (level: 'standard' | 'strict' | 'paranoid') => Promise<void>;
        runScan: () => Promise<{ clean: boolean; issues: string[]; recommendations: string[] }>;
        getRecentThreats: () => Promise<ThreatRecord[]>;
      };
      system: {
        getVersion: () => Promise<string>;
        getPlatform: () => Promise<string>;
        openExternal: (url: string) => Promise<void>;
      };
      platform: string;
    };
  }
}

export {};
