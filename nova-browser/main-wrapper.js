// Nova Browser - Main Process Wrapper
// Provides correct electron module resolution

// Mock the electron import before loading the main bundle
const electronPath = require.resolve('electron');
const electronDir = require('path').dirname(electronPath);

// Check if we're running inside Electron
if (process.versions.electron) {
  // We ARE in Electron - patch require to use Electron's built-in
  const Module = require('module');
  const originalRequire = Module.prototype.require;

  Module.prototype.require = function(id) {
    if (id === 'electron') {
      // Try to get the actual Electron module
      // In Electron's main process, this should work
      try {
        // Force loading from Electron's internal modules
        const binding = process._linkedBinding('electron_common_features');
        // If we get here, we have access to Electron internals
        return process._linkedBinding('electron_browser_app').default;
      } catch (e) {
        // Fallback: return stub that warns
        console.warn('Electron module not available - using stub');
        return {
          app: {
            whenReady: () => Promise.resolve(),
            getPath: () => '.',
            quit: () => process.exit(0),
            on: () => {},
            setAppUserModelId: () => {}
          },
          BrowserWindow: class BrowserWindow {
            constructor() { this.webContents = { send: () => {}, on: () => {} }; }
            loadURL() {}
            loadFile() {}
            show() {}
            close() {}
            minimize() {}
            maximize() {}
            isMaximized() { return false; }
            isFullScreen() { return false; }
            setFullScreen() {}
            on() {}
            once() {}
          },
          ipcMain: { handle: () => {}, on: () => {} },
          session: { defaultSession: { webRequest: { onBeforeRequest: () => {}, onBeforeSendHeaders: () => {} }, on: () => {} } },
          shell: { openExternal: () => {}, openPath: () => {}, showItemInFolder: () => {} }
        };
      }
    }
    return originalRequire.call(this, id);
  };
}

// Now load the actual main process
require('./dist/main/main.js');
