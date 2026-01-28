console.log('Testing electron import...');

try {
  const electron = require('electron');
  console.log('Electron module loaded:', typeof electron);
  console.log('Electron keys:', Object.keys(electron));
  console.log('App:', typeof electron.app);
  console.log('BrowserWindow:', typeof electron.BrowserWindow);

  if (electron.app) {
    electron.app.whenReady().then(() => {
      console.log('App is ready!');
      electron.app.quit();
    });
  } else {
    console.log('ERROR: electron.app is undefined');
    process.exit(1);
  }
} catch (error) {
  console.error('Error loading electron:', error);
  process.exit(1);
}
