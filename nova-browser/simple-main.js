// Simple Electron main process test
// Try different ways to get Electron modules
let electron, app, BrowserWindow;

console.log('=== Nova Browser Startup ===');
console.log('process.versions.electron:', process.versions.electron);
console.log('process.type:', process.type);

// Method 1: Direct electron require (standard way)
try {
  electron = require('electron');
  if (electron && typeof electron !== 'string' && electron.app) {
    app = electron.app;
    BrowserWindow = electron.BrowserWindow;
    console.log('Method 1 worked: require("electron")');
  } else {
    throw new Error('electron.app is undefined or electron is a string');
  }
} catch (e) {
  console.log('Method 1 failed:', e.message);

  // Method 2: Try electron/main
  try {
    const mainModule = require('electron/main');
    app = mainModule.app;
    BrowserWindow = mainModule.BrowserWindow;
    console.log('Method 2 worked: require("electron/main")');
  } catch (e2) {
    console.log('Method 2 failed:', e2.message);

    // Method 3: Try process internal bindings
    try {
      if (process._linkedBinding) {
        console.log('Checking process._linkedBinding...');
        app = process._linkedBinding('electron_browser_app');
        console.log('Method 3 worked: process._linkedBinding');
      } else {
        throw new Error('process._linkedBinding not available');
      }
    } catch (e3) {
      console.log('Method 3 failed:', e3.message);
      console.log('');
      console.log('=== ALL METHODS FAILED ===');
      console.log('This appears to be an Electron bug on Windows.');
      console.log('process.versions:', JSON.stringify(process.versions, null, 2));
      process.exit(1);
    }
  }
}

console.log('app:', app);
console.log('BrowserWindow:', BrowserWindow);

if (!app) {
  console.error('ERROR: app is still undefined after all methods!');
  process.exit(1);
}

let mainWindow;

app.whenReady().then(() => {
  console.log('App ready!');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL('http://localhost:5173');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
