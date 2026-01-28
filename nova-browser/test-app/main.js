const { app, BrowserWindow } = require('electron');

console.log('Electron app starting...');
console.log('App:', typeof app);

app.whenReady().then(() => {
  console.log('App is ready!');
  const win = new BrowserWindow({ width: 800, height: 600 });
  win.loadURL('https://google.com');
});

app.on('window-all-closed', () => {
  app.quit();
});
