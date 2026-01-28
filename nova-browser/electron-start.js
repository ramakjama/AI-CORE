// Nova Browser - Electron Launcher
// Fixes the electron module resolution issue on Windows

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const electronPkg = path.join(__dirname, 'node_modules', 'electron');
const electronBackup = path.join(__dirname, 'node_modules', '.electron-backup');

// Get the electron exe path BEFORE renaming
const electronExe = path.join(electronPkg, 'dist', 'electron.exe');
const electronExeExists = fs.existsSync(electronExe);

if (!electronExeExists) {
  console.error('Electron executable not found at:', electronExe);
  process.exit(1);
}

// Copy electron.exe path for later use
const exePath = electronExe;

// Temporarily rename electron package so it doesn't interfere with require('electron')
console.log('Starting Nova Browser...');
if (fs.existsSync(electronPkg) && !fs.existsSync(electronBackup)) {
  fs.renameSync(electronPkg, electronBackup);
}

// Get the exe from backup location now
const actualExe = path.join(electronBackup, 'dist', 'electron.exe');

// Start Electron
const electron = spawn(actualExe, ['.'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env
});

// Restore on exit
function restore() {
  if (fs.existsSync(electronBackup) && !fs.existsSync(electronPkg)) {
    try {
      fs.renameSync(electronBackup, electronPkg);
      console.log('Restored electron package');
    } catch (e) {
      console.error('Failed to restore electron package:', e);
    }
  }
}

electron.on('exit', (code) => {
  console.log('Nova Browser exited with code:', code);
  restore();
});

electron.on('error', (err) => {
  console.error('Electron error:', err);
  restore();
});

process.on('SIGINT', () => {
  electron.kill();
  restore();
  process.exit();
});
