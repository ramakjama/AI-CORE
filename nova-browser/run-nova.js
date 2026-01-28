#!/usr/bin/env node
// Nova Browser Launcher
// Temporarily removes node_modules/electron to allow Electron's built-in module to work

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = __dirname;
const electronPkg = path.join(rootDir, 'node_modules', 'electron');
const electronBackup = path.join(rootDir, 'node_modules', '_electron_temp');
const electronExe = path.join(electronPkg, 'dist', 'electron.exe');

// Check electron exists
if (!fs.existsSync(electronExe)) {
  console.error('Electron not installed. Run: npm install');
  process.exit(1);
}

// Store exe path before moving
const exePath = fs.realpathSync(electronExe);
console.log('Electron path:', exePath);

// Temporarily move the electron package
console.log('Preparing environment...');
try {
  if (fs.existsSync(electronBackup)) {
    fs.rmSync(electronBackup, { recursive: true });
  }
  fs.renameSync(electronPkg, electronBackup);
} catch (e) {
  console.error('Failed to prepare:', e.message);
  process.exit(1);
}

// Function to restore
function restore() {
  try {
    if (fs.existsSync(electronBackup) && !fs.existsSync(electronPkg)) {
      fs.renameSync(electronBackup, electronPkg);
      console.log('Environment restored.');
    }
  } catch (e) {
    console.error('Restore failed:', e.message);
    // Try harder
    try {
      execSync(`mv "${electronBackup}" "${electronPkg}"`, { stdio: 'ignore' });
    } catch {}
  }
}

// Handle cleanup
process.on('exit', restore);
process.on('SIGINT', () => { restore(); process.exit(); });
process.on('SIGTERM', () => { restore(); process.exit(); });
process.on('uncaughtException', (e) => { console.error(e); restore(); process.exit(1); });

// Get the exe from backup location
const backupExe = path.join(electronBackup, 'dist', 'electron.exe');

console.log('Launching Nova Browser...');

// Launch Electron pointing to simple-main.js for testing
const electron = spawn(backupExe, ['simple-main.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  windowsHide: false
});

electron.on('error', (err) => {
  console.error('Launch error:', err);
  restore();
  process.exit(1);
});

electron.on('exit', (code) => {
  console.log('Nova Browser exited:', code);
  restore();
  process.exit(code || 0);
});
