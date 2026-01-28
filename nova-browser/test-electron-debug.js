// Debug Electron module resolution
console.log('=== Electron Debug ===');
console.log('process.versions.electron:', process.versions.electron);
console.log('process.type:', process.type);

const electron = require('electron');
console.log('typeof electron:', typeof electron);
console.log('electron:', electron);
console.log('electron keys:', Object.keys(electron || {}));

if (electron && electron.app) {
  console.log('electron.app exists!');
  electron.app.whenReady().then(() => {
    console.log('App is ready!');
    electron.app.quit();
  });
} else {
  console.log('electron.app is undefined');
  console.log('Full electron object:', JSON.stringify(electron, null, 2));
  process.exit(1);
}
