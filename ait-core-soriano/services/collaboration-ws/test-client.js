#!/usr/bin/env node

/**
 * Collaboration WebSocket Server Test Client
 *
 * Run: node test-client.js [server-url] [room-id]
 * Example: node test-client.js ws://localhost:1234 test-room
 */

import WebSocket from 'ws';

// Configuration
const SERVER_URL = process.argv[2] || 'ws://localhost:1234';
const ROOM_ID = process.argv[3] || 'test-room';
const CLIENT_NAME = process.argv[4] || `Client-${Math.random().toString(36).substr(2, 5)}`;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logData(label, data) {
  console.log(`${colors.dim}${label}:${colors.reset}`);
  console.log(JSON.stringify(data, null, 2));
  console.log('');
}

// Test state
let ws = null;
let connectionId = null;
let peers = [];
let testsPassed = 0;
let testsFailed = 0;

// Test queue
const tests = [
  testConnection,
  testAwarenessUpdate,
  testPeerDiscovery,
  testCustomMessage,
  testWebRTCSignaling,
  testReconnection
];

let currentTest = 0;

// Main function
async function main() {
  console.log('');
  log('═══════════════════════════════════════════════════════', 'bright');
  log('   Collaboration WebSocket Server Test Client', 'bright');
  log('═══════════════════════════════════════════════════════', 'bright');
  console.log('');
  logInfo(`Server: ${SERVER_URL}`);
  logInfo(`Room: ${ROOM_ID}`);
  logInfo(`Client Name: ${CLIENT_NAME}`);
  console.log('');

  // Check if server is reachable
  try {
    const healthUrl = SERVER_URL.replace('ws://', 'http://').replace('wss://', 'https://') + '/health';
    const http = await import('http');

    await new Promise((resolve, reject) => {
      const req = http.get(healthUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            const health = JSON.parse(data);
            logSuccess('Server health check passed');
            logData('Health Status', health);
            resolve();
          } else {
            reject(new Error(`Health check failed: ${res.statusCode}`));
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Health check timeout'));
      });
    });
  } catch (error) {
    logError(`Server health check failed: ${error.message}`);
    logWarning('Continuing with tests anyway...');
    console.log('');
  }

  // Run tests
  runNextTest();
}

function runNextTest() {
  if (currentTest >= tests.length) {
    showResults();
    cleanup();
    return;
  }

  const test = tests[currentTest];
  currentTest++;

  log(`Running test ${currentTest}/${tests.length}: ${test.name}`, 'bright');
  console.log('');

  test().catch(error => {
    logError(`Test failed: ${error.message}`);
    testsFailed++;
    runNextTest();
  });
}

function showResults() {
  console.log('');
  log('═══════════════════════════════════════════════════════', 'bright');
  log('   Test Results', 'bright');
  log('═══════════════════════════════════════════════════════', 'bright');
  console.log('');
  logInfo(`Total Tests: ${tests.length}`);
  logSuccess(`Passed: ${testsPassed}`);
  if (testsFailed > 0) {
    logError(`Failed: ${testsFailed}`);
  }
  console.log('');

  if (testsFailed === 0) {
    logSuccess('All tests passed! 🎉');
  } else {
    logError('Some tests failed');
  }
  console.log('');
}

function cleanup() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
  setTimeout(() => process.exit(testsFailed > 0 ? 1 : 0), 500);
}

// Test 1: Connection
async function testConnection() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, 10000);

    ws = new WebSocket(`${SERVER_URL}?room=${ROOM_ID}`);

    ws.on('open', () => {
      logSuccess('WebSocket connection established');
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);

        if (message.type === 'init') {
          clearTimeout(timeout);
          connectionId = message.connectionId;
          peers = message.peers || [];

          logSuccess('Received initialization message');
          logData('Init Message', message);

          testsPassed++;
          setTimeout(() => {
            runNextTest();
            resolve();
          }, 1000);
        }
      } catch (e) {
        // Binary message (Y.js sync) - ignore
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    ws.on('close', (code, reason) => {
      if (code !== 1000) {
        logWarning(`Connection closed unexpectedly (code: ${code}, reason: ${reason})`);
      }
    });
  });
}

// Test 2: Awareness Update
async function testAwarenessUpdate() {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('Not connected'));
    }

    const awarenessData = {
      type: 'awareness',
      data: {
        user: {
          name: CLIENT_NAME,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16)
        },
        cursor: {
          line: 10,
          column: 5
        }
      }
    };

    logInfo('Sending awareness update');
    logData('Awareness Data', awarenessData);

    ws.send(JSON.stringify(awarenessData));

    logSuccess('Awareness update sent');
    testsPassed++;

    setTimeout(() => {
      runNextTest();
      resolve();
    }, 1000);
  });
}

// Test 3: Peer Discovery
async function testPeerDiscovery() {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('Not connected'));
    }

    const timeout = setTimeout(() => {
      reject(new Error('Peer discovery timeout'));
    }, 5000);

    const messageHandler = (data) => {
      try {
        const message = JSON.parse(data);

        if (message.type === 'peers') {
          clearTimeout(timeout);
          ws.removeListener('message', messageHandler);

          logSuccess('Received peer list');
          logData('Peers', message.peers);

          testsPassed++;
          setTimeout(() => {
            runNextTest();
            resolve();
          }, 1000);
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    };

    ws.on('message', messageHandler);

    logInfo('Requesting peer list');
    ws.send(JSON.stringify({ type: 'get-peers' }));
  });
}

// Test 4: Custom Message
async function testCustomMessage() {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('Not connected'));
    }

    const customMessage = {
      type: 'custom',
      data: {
        action: 'test-action',
        timestamp: Date.now(),
        payload: {
          foo: 'bar',
          nested: {
            value: 123
          }
        }
      }
    };

    logInfo('Sending custom message');
    logData('Custom Message', customMessage);

    ws.send(JSON.stringify(customMessage));

    logSuccess('Custom message sent');
    testsPassed++;

    setTimeout(() => {
      runNextTest();
      resolve();
    }, 1000);
  });
}

// Test 5: WebRTC Signaling
async function testWebRTCSignaling() {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('Not connected'));
    }

    const webrtcSignal = {
      type: 'webrtc-signal',
      signal: {
        type: 'offer',
        sdp: 'v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\n...(mock SDP)'
      }
    };

    logInfo('Sending WebRTC signal');
    logData('WebRTC Signal', webrtcSignal);

    ws.send(JSON.stringify(webrtcSignal));

    logSuccess('WebRTC signal sent');
    testsPassed++;

    setTimeout(() => {
      runNextTest();
      resolve();
    }, 1000);
  });
}

// Test 6: Reconnection
async function testReconnection() {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('Not connected'));
    }

    logInfo('Testing reconnection...');

    ws.close(1000, 'Testing reconnection');

    ws.on('close', () => {
      logSuccess('Connection closed');

      setTimeout(() => {
        logInfo('Reconnecting...');

        const newWs = new WebSocket(`${SERVER_URL}?room=${ROOM_ID}`);

        newWs.on('open', () => {
          logSuccess('Reconnected successfully');
        });

        newWs.on('message', (data) => {
          try {
            const message = JSON.parse(data);

            if (message.type === 'init') {
              logSuccess('Received new initialization message');
              logData('New Connection ID', { connectionId: message.connectionId });

              testsPassed++;
              newWs.close(1000, 'Test complete');

              setTimeout(() => {
                runNextTest();
                resolve();
              }, 1000);
            }
          } catch (e) {
            // Ignore
          }
        });

        newWs.on('error', (error) => {
          reject(error);
        });
      }, 1000);
    });
  });
}

// Run tests
main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
