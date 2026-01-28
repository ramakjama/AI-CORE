import { WebSocketServer } from 'ws';
import http from 'http';
import { setupWSConnection } from 'y-websocket/bin/utils.js';
import * as Y from 'yjs';

// Configuration
const PORT = process.env.WS_PORT || 1234;
const HOST = process.env.WS_HOST || '0.0.0.0';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const CLEANUP_INTERVAL = 300000; // 5 minutes

// Logging utility
const log = {
  info: (msg, ...args) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[${new Date().toISOString()}] [WARN] ${msg}`, ...args),
  debug: (msg, ...args) => {
    if (process.env.DEBUG === 'true') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] ${msg}`, ...args);
    }
  }
};

// Room management - stores Y.Doc instances per room
const rooms = new Map();
const roomConnections = new Map(); // Track connection count per room
const connectionMetadata = new Map(); // Store metadata per connection

// WebRTC signaling channels
const signalingChannels = new Map(); // roomId -> Set of connections for WebRTC signaling

// Get or create a Y.Doc for a room
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    const doc = new Y.Doc();
    rooms.set(roomId, doc);
    roomConnections.set(roomId, new Set());
    signalingChannels.set(roomId, new Set());
    log.info(`Created new room: ${roomId}`);
  }
  return rooms.get(roomId);
}

// Clean up empty rooms
function cleanupEmptyRooms() {
  for (const [roomId, connections] of roomConnections.entries()) {
    if (connections.size === 0) {
      rooms.delete(roomId);
      roomConnections.delete(roomId);
      signalingChannels.delete(roomId);
      log.info(`Cleaned up empty room: ${roomId}`);
    }
  }
}

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      rooms: rooms.size,
      connections: Array.from(roomConnections.values()).reduce((sum, set) => sum + set.size, 0)
    }));
  } else if (req.url === '/stats') {
    const stats = {
      rooms: rooms.size,
      totalConnections: Array.from(roomConnections.values()).reduce((sum, set) => sum + set.size, 0),
      roomDetails: Array.from(roomConnections.entries()).map(([roomId, connections]) => ({
        roomId,
        connections: connections.size
      }))
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats, null, 2));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Create WebSocket server
const wss = new WebSocketServer({
  server,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  }
});

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomId = url.searchParams.get('room') || url.pathname.slice(1);

  if (!roomId) {
    log.warn('Connection rejected: No room specified');
    ws.close(1008, 'Room ID required');
    return;
  }

  // Setup Y.js WebSocket connection
  try {
    const doc = getOrCreateRoom(roomId);
    const connections = roomConnections.get(roomId);
    const signalingChannel = signalingChannels.get(roomId);

    // Store connection metadata
    const connectionId = `${roomId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    connectionMetadata.set(ws, {
      connectionId,
      roomId,
      connectedAt: new Date().toISOString(),
      lastPing: Date.now()
    });

    connections.add(ws);
    signalingChannel.add(ws);

    log.info(`Client connected to room: ${roomId} (${connections.size} total connections, connectionId: ${connectionId})`);

    // Setup Y.js connection with y-websocket utilities
    setupWSConnection(ws, req, {
      docName: roomId,
      gc: true // Enable garbage collection
    });

    // Heartbeat mechanism
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
      const metadata = connectionMetadata.get(ws);
      if (metadata) {
        metadata.lastPing = Date.now();
      }
    });

    // Handle custom messages (awareness, WebRTC signaling, etc.)
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);

        // Handle awareness updates (cursor position, user presence, etc.)
        if (message.type === 'awareness') {
          broadcast(roomId, ws, {
            type: 'awareness',
            clientId: connectionId,
            data: message.data
          });
          log.debug(`Awareness update from ${connectionId} in room ${roomId}`);
        }

        // Handle WebRTC signaling
        else if (message.type === 'webrtc-signal') {
          const { targetId, signal } = message;

          if (targetId) {
            // Send to specific peer
            sendToConnection(roomId, targetId, {
              type: 'webrtc-signal',
              from: connectionId,
              signal
            });
          } else {
            // Broadcast to all peers in room (for offers)
            broadcast(roomId, ws, {
              type: 'webrtc-signal',
              from: connectionId,
              signal
            });
          }
          log.debug(`WebRTC signal from ${connectionId} to ${targetId || 'all'} in room ${roomId}`);
        }

        // Handle peer discovery
        else if (message.type === 'get-peers') {
          const peers = Array.from(connections)
            .filter(conn => conn !== ws)
            .map(conn => {
              const metadata = connectionMetadata.get(conn);
              return metadata ? metadata.connectionId : null;
            })
            .filter(Boolean);

          ws.send(JSON.stringify({
            type: 'peers',
            peers
          }));
          log.debug(`Peer list requested by ${connectionId} in room ${roomId}: ${peers.length} peers`);
        }

        // Handle custom user messages
        else if (message.type === 'custom') {
          broadcast(roomId, ws, {
            type: 'custom',
            from: connectionId,
            data: message.data
          });
        }

      } catch (error) {
        // Not a JSON message, likely Y.js sync message - ignore
        if (error instanceof SyntaxError) {
          log.debug('Received non-JSON message (likely Y.js sync)');
        } else {
          log.error('Error handling message:', error);
        }
      }
    });

    // Handle disconnection
    ws.on('close', (code, reason) => {
      connections.delete(ws);
      signalingChannel.delete(ws);
      const metadata = connectionMetadata.get(ws);
      connectionMetadata.delete(ws);

      if (metadata) {
        log.info(`Client disconnected from room: ${roomId} (${connections.size} remaining, connectionId: ${metadata.connectionId}, code: ${code}, reason: ${reason})`);

        // Notify other clients about disconnection
        broadcast(roomId, ws, {
          type: 'peer-disconnected',
          connectionId: metadata.connectionId
        });
      } else {
        log.info(`Client disconnected from room: ${roomId} (${connections.size} remaining)`);
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      const metadata = connectionMetadata.get(ws);
      log.error(`WebSocket error in room ${roomId}${metadata ? ` (connectionId: ${metadata.connectionId})` : ''}:`, error.message);
    });

    // Send initial peer list
    const peers = Array.from(connections)
      .filter(conn => conn !== ws)
      .map(conn => {
        const metadata = connectionMetadata.get(conn);
        return metadata ? metadata.connectionId : null;
      })
      .filter(Boolean);

    ws.send(JSON.stringify({
      type: 'init',
      connectionId,
      peers
    }));

  } catch (error) {
    log.error(`Error setting up connection for room ${roomId}:`, error);
    ws.close(1011, 'Internal server error');
  }
});

// Broadcast message to all clients in a room except sender
function broadcast(roomId, sender, message) {
  const connections = roomConnections.get(roomId);
  if (!connections) return;

  const messageStr = JSON.stringify(message);
  let sentCount = 0;

  connections.forEach(client => {
    if (client !== sender && client.readyState === 1) { // 1 = OPEN
      try {
        client.send(messageStr);
        sentCount++;
      } catch (error) {
        log.error('Error broadcasting message:', error);
      }
    }
  });

  log.debug(`Broadcasted ${message.type} to ${sentCount} clients in room ${roomId}`);
}

// Send message to specific connection
function sendToConnection(roomId, targetConnectionId, message) {
  const connections = roomConnections.get(roomId);
  if (!connections) return;

  for (const client of connections) {
    const metadata = connectionMetadata.get(client);
    if (metadata && metadata.connectionId === targetConnectionId) {
      if (client.readyState === 1) { // 1 = OPEN
        try {
          client.send(JSON.stringify(message));
          log.debug(`Sent ${message.type} to connection ${targetConnectionId}`);
        } catch (error) {
          log.error('Error sending message to connection:', error);
        }
      }
      break;
    }
  }
}

// Heartbeat interval to detect dead connections
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      const metadata = connectionMetadata.get(ws);
      log.warn(`Terminating inactive connection${metadata ? ` (connectionId: ${metadata.connectionId})` : ''}`);
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

// Cleanup interval for empty rooms
const cleanupInterval = setInterval(() => {
  cleanupEmptyRooms();
}, CLEANUP_INTERVAL);

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully...');
  clearInterval(heartbeatInterval);
  clearInterval(cleanupInterval);

  wss.clients.forEach((ws) => {
    ws.close(1001, 'Server shutting down');
  });

  server.close(() => {
    log.info('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    log.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  log.info('SIGINT received, shutting down gracefully...');
  clearInterval(heartbeatInterval);
  clearInterval(cleanupInterval);

  wss.clients.forEach((ws) => {
    ws.close(1001, 'Server shutting down');
  });

  server.close(() => {
    log.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
server.listen(PORT, HOST, () => {
  log.info(`WebSocket collaboration server running on ws://${HOST}:${PORT}`);
  log.info(`Health check: http://${HOST}:${PORT}/health`);
  log.info(`Stats endpoint: http://${HOST}:${PORT}/stats`);
  log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  log.info(`Debug mode: ${process.env.DEBUG === 'true' ? 'enabled' : 'disabled'}`);
});
