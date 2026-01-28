// Nova Browser - Entry Point
// This wrapper properly initializes Electron's built-in modules

const path = require('path');

// Override electron resolution for the main process
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function(request, parent, isMain, options) {
  // Force 'electron' to be resolved from Electron's built-in
  if (request === 'electron') {
    try {
      // Try to get Electron's internal module
      return originalResolveFilename.call(this, 'electron/common', parent, isMain, options);
    } catch (e) {
      // If that fails, let it continue normally
    }
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

// Now load the actual main process code
require('./dist/main/main.js');
