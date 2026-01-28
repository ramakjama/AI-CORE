console.log('=== Direct Built-in Module Test ===');

// Try to require electron's internal modules directly
try {
  const browserInit = require('electron/js2c/browser_init');
  console.log('browser_init loaded:', typeof browserInit);
} catch(e) {
  console.log('browser_init error:', e.message);
}

// Try creating a module and using NativeModule
const Module = require('module');
console.log('Module._extensions:', Object.keys(Module._extensions));

// Check if NativeModule is available
console.log('process._linkedBinding:', typeof process._linkedBinding);

// Try to get app directly
try {
  const app = process._linkedBinding?.('electron_browser_app');
  console.log('app binding:', app);
} catch(e) {
  console.log('app binding error:', e.message);
}
