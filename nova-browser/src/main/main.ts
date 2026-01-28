import { app, BrowserWindow, ipcMain, session, shell } from 'electron';
import * as path from 'path';
import { DatabaseService } from './database/sqlite';
import { HistoryService } from './services/historyService';
import { BookmarksService } from './services/bookmarksService';
import { DownloadService } from './services/downloadService';
import { SecurityEngine } from './services/securityEngine';

// ============================================
// NOVA BROWSER - MAIN PROCESS
// AI Innovation Technologies
// ============================================

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

// Services
let db: DatabaseService;
let historyService: HistoryService;
let bookmarksService: BookmarksService;
let downloadService: DownloadService;
let securityEngine: SecurityEngine;

const isDev = process.env.NODE_ENV !== 'production';

// Security: Disable navigation to file:// and other dangerous protocols
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'nova:'];
const DANGEROUS_PROTOCOLS = ['file:', 'javascript:', 'vbscript:', 'data:'];

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load splash screen HTML
  if (isDev) {
    splashWindow.loadURL('http://localhost:5173/splash.html');
  } else {
    splashWindow.loadFile(path.join(__dirname, '../renderer/splash.html'));
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 900,
    minHeight: 700,
    frame: false,
    transparent: false,
    backgroundColor: '#ffffff',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 15 },
    show: false, // Start hidden, show after splash
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      sandbox: true, // SECURITY: Enable sandbox
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  });

  // SECURITY: Block dangerous protocols in webview
  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    // Strip away preload scripts
    delete webPreferences.preload;

    // Enforce secure settings
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.webSecurity = true;

    // Block dangerous URLs
    const url = params.src || '';
    if (DANGEROUS_PROTOCOLS.some(p => url.toLowerCase().startsWith(p))) {
      event.preventDefault();
    }
  });

  // SECURITY: Validate all navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const parsedUrl = new URL(url);
      if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
        event.preventDefault();
        console.warn(`Blocked navigation to dangerous protocol: ${parsedUrl.protocol}`);
      }
    } catch {
      event.preventDefault();
    }
  });

  // SECURITY: Block new window creation to external sites in main process
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow internal navigation, block external popups
    if (url.startsWith('nova://') || url.startsWith('http://localhost')) {
      return { action: 'allow' };
    }
    // Open external links in default browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Setup download handling
  setupDownloadHandler();

  // Setup security engine for request blocking
  setupSecurityEngine();

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show main window after load, close splash
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow?.show();
      // Start in fullscreen if user preference
      // mainWindow?.setFullScreen(true);
      mainWindow?.maximize();
    }, 2000); // Show splash for 2 seconds
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle fullscreen toggle
  mainWindow.on('enter-full-screen', () => {
    mainWindow?.webContents.send('fullscreen-change', true);
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow?.webContents.send('fullscreen-change', false);
  });
}

function setupSecurityEngine() {
  // Real ad blocker and tracker protection
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['*://*/*'] },
    (details, callback) => {
      const shouldBlock = securityEngine?.shouldBlock(details.url) || false;

      if (shouldBlock) {
        securityEngine?.recordBlockedRequest(details.url, 'ad');
      }

      callback({ cancel: shouldBlock });
    }
  );

  // Block tracking headers
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders };

    // Remove tracking headers
    delete headers['X-Requested-With'];

    // Add Do Not Track
    headers['DNT'] = '1';
    headers['Sec-GPC'] = '1';

    callback({ requestHeaders: headers });
  });

  // Upgrade HTTP to HTTPS when possible
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['http://*/*'] },
    (details, callback) => {
      // Check if HTTPS-only mode is enabled
      if (securityEngine?.isHttpsOnlyEnabled()) {
        const httpsUrl = details.url.replace('http://', 'https://');
        callback({ redirectURL: httpsUrl });
      } else {
        callback({});
      }
    }
  );
}

function setupDownloadHandler() {
  session.defaultSession.on('will-download', (_event, item) => {
    const downloadId = Date.now().toString();
    const fileName = item.getFilename();
    const totalBytes = item.getTotalBytes();

    // Notify renderer about new download
    mainWindow?.webContents.send('download-started', {
      id: downloadId,
      fileName,
      totalBytes,
      url: item.getURL(),
    });

    item.on('updated', (_event, state) => {
      if (state === 'progressing') {
        if (!item.isPaused()) {
          const progress = item.getReceivedBytes() / totalBytes;
          mainWindow?.webContents.send('download-progress', {
            id: downloadId,
            receivedBytes: item.getReceivedBytes(),
            totalBytes,
            progress,
          });
        }
      }
    });

    item.once('done', (_event, state) => {
      if (state === 'completed') {
        downloadService?.addDownload({
          id: downloadId,
          fileName,
          url: item.getURL(),
          savePath: item.getSavePath(),
          totalBytes,
          completedAt: new Date(),
        });

        mainWindow?.webContents.send('download-completed', {
          id: downloadId,
          savePath: item.getSavePath(),
        });
      } else {
        mainWindow?.webContents.send('download-failed', {
          id: downloadId,
          error: state,
        });
      }
    });
  });
}

async function initializeServices() {
  try {
    // Initialize database
    db = new DatabaseService();
    await db.initialize();

    // Initialize services
    historyService = new HistoryService(db);
    bookmarksService = new BookmarksService(db);
    downloadService = new DownloadService(db);
    securityEngine = new SecurityEngine();
    await securityEngine.initialize();

    console.log('Nova Browser services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
}

// ============================================
// IPC HANDLERS SETUP
// ============================================

function setupIpcHandlers() {
  // Window controls
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
    return mainWindow?.isMaximized();
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized());
  ipcMain.handle('window:toggleFullscreen', () => {
    const isFullScreen = mainWindow?.isFullScreen();
    mainWindow?.setFullScreen(!isFullScreen);
    return !isFullScreen;
  });

  // History
  ipcMain.handle('history:getAll', async (_, limit?: number) => {
    return historyService?.getHistory(limit);
  });

  ipcMain.handle('history:add', async (_, entry: { url: string; title: string; favicon?: string }) => {
    return historyService?.addEntry(entry);
  });

  ipcMain.handle('history:search', async (_, query: string) => {
    return historyService?.search(query);
  });

  ipcMain.handle('history:delete', async (_, id: string) => {
    return historyService?.deleteEntry(id);
  });

  ipcMain.handle('history:clear', async () => {
    return historyService?.clearHistory();
  });

  // Bookmarks
  ipcMain.handle('bookmarks:getAll', async () => {
    return bookmarksService?.getAllBookmarks();
  });

  ipcMain.handle('bookmarks:add', async (_, bookmark: { url: string; title: string; favicon?: string; folderId?: string }) => {
    return bookmarksService?.addBookmark(bookmark);
  });

  ipcMain.handle('bookmarks:delete', async (_, id: string) => {
    return bookmarksService?.deleteBookmark(id);
  });

  ipcMain.handle('bookmarks:update', async (_, id: string, data: Partial<{ title: string; url: string; folderId: string }>) => {
    return bookmarksService?.updateBookmark(id, data);
  });

  ipcMain.handle('bookmarks:createFolder', async (_, name: string, parentId?: string) => {
    return bookmarksService?.createFolder(name, parentId);
  });

  // Downloads
  ipcMain.handle('downloads:getAll', async () => {
    return downloadService?.getAllDownloads();
  });

  ipcMain.handle('downloads:openFile', async (_, filePath: string) => {
    return shell.openPath(filePath);
  });

  ipcMain.handle('downloads:showInFolder', async (_, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle('downloads:delete', async (_, id: string) => {
    return downloadService?.deleteDownload(id);
  });

  // Security
  ipcMain.handle('security:getStats', async () => {
    return securityEngine?.getStats();
  });

  ipcMain.handle('security:toggleAdBlock', async () => {
    return securityEngine?.toggleAdBlock();
  });

  ipcMain.handle('security:toggleTrackingProtection', async () => {
    return securityEngine?.toggleTrackingProtection();
  });

  ipcMain.handle('security:toggleHttpsOnly', async () => {
    return securityEngine?.toggleHttpsOnly();
  });

  ipcMain.handle('security:setProtectionLevel', async (_, level: 'standard' | 'strict' | 'paranoid') => {
    return securityEngine?.setProtectionLevel(level);
  });

  ipcMain.handle('security:runScan', async () => {
    return securityEngine?.runSecurityScan();
  });

  ipcMain.handle('security:getRecentThreats', async () => {
    return securityEngine?.getRecentThreats();
  });

  // Browser navigation (handled in webview, but kept for compatibility)
  ipcMain.handle('browser:navigate', async (_, url: string) => {
    // Validate URL
    try {
      const parsedUrl = new URL(url);
      if (DANGEROUS_PROTOCOLS.some(p => parsedUrl.protocol === p)) {
        return { success: false, error: 'Dangerous protocol blocked' };
      }
      return { success: true, url };
    } catch {
      return { success: false, error: 'Invalid URL' };
    }
  });

  // System
  ipcMain.handle('system:getVersion', () => app.getVersion());
  ipcMain.handle('system:getPlatform', () => process.platform);
  ipcMain.handle('system:openExternal', async (_, url: string) => {
    await shell.openExternal(url);
  });
}

// ============================================
// APP LIFECYCLE
// ============================================

app.whenReady().then(async () => {
  // Setup IPC handlers first
  setupIpcHandlers();
  // Initialize services first
  await initializeServices();

  // Create splash screen
  createSplashWindow();

  // Create main window
  createWindow();

  // Set app user model id for windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.nova.browser');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Close database connection
    db?.close();
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// SECURITY: Prevent creating new windows
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    try {
      const parsedUrl = new URL(navigationUrl);
      if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });
});

// Remote module is disabled by default in modern Electron
