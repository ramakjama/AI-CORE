/**
 * Y.js Collaboration Server Example
 *
 * Simple Hocuspocus server for collaborative editing
 *
 * Installation:
 *   npm install @hocuspocus/server
 *
 * Usage:
 *   node collaboration-server.js
 */

import { Server } from '@hocuspocus/server';
import { Logger } from '@hocuspocus/extension-logger';
import { Database } from '@hocuspocus/extension-database';

const server = Server.configure({
  port: 1234,

  // Logging
  extensions: [
    new Logger(),
  ],

  /**
   * Called when a client connects
   */
  async onConnect(data) {
    const { documentName, socketId, context } = data;
    console.log(`✅ Client ${socketId} connected to document: ${documentName}`);

    // Add custom connection logic here
    // Example: Log to analytics, update user status, etc.

    return true; // Allow connection
  },

  /**
   * Called when a client disconnects
   */
  async onDisconnect(data) {
    const { documentName, socketId } = data;
    console.log(`❌ Client ${socketId} disconnected from document: ${documentName}`);

    // Add custom disconnection logic here
  },

  /**
   * Called when a document is loaded
   */
  async onLoadDocument(data) {
    const { documentName } = data;
    console.log(`📄 Loading document: ${documentName}`);

    // Load document from database
    // Example: return await db.getDocument(documentName);

    return null; // Return null for new documents
  },

  /**
   * Called before a document is stored
   */
  async onStoreDocument(data) {
    const { documentName, document } = data;
    console.log(`💾 Storing document: ${documentName}`);

    // Save document to database
    // Example: await db.saveDocument(documentName, document);
  },

  /**
   * Called when a document changes
   */
  async onChange(data) {
    const { documentName, document } = data;
    console.log(`📝 Document changed: ${documentName}`);

    // Handle document changes
    // Example: trigger webhooks, update search index, etc.
  },

  /**
   * Authentication callback
   */
  async onAuthenticate(data) {
    const { token, documentName } = data;

    // Add your authentication logic here
    // Example: Verify JWT token, check permissions, etc.

    // For development, allow all connections
    if (process.env.NODE_ENV === 'development') {
      return {
        user: {
          id: 'dev-user',
          name: 'Developer',
        },
      };
    }

    // Example JWT verification
    // const user = await verifyToken(token);
    // if (!user) {
    //   throw new Error('Invalid token');
    // }
    // return { user };

    return { user: { id: 'anonymous', name: 'Anonymous' } };
  },

  /**
   * Request handler
   */
  async onRequest(data) {
    const { request, response } = data;

    // Handle HTTP requests
    // Example: Health check endpoint
    if (request.url === '/health') {
      response.writeHead(200);
      response.end('OK');
      return;
    }
  },
});

// Start the server
server.listen((event) => {
  console.log('');
  console.log('🚀 Y.js Collaboration Server Started!');
  console.log('');
  console.log(`📡 Port: ${event.port}`);
  console.log(`🌐 Address: ws://localhost:${event.port}`);
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.destroy();
  process.exit(0);
});

/**
 * Advanced Configuration Examples
 */

/*
// Example: Add Redis for scaling
import { Redis } from '@hocuspocus/extension-redis';

extensions: [
  new Redis({
    host: 'localhost',
    port: 6379,
  }),
]

// Example: Add database persistence
import { SQLite } from '@hocuspocus/extension-sqlite';

extensions: [
  new SQLite({
    database: 'collaboration.db',
  }),
]

// Example: Add webhook notifications
import { Webhook } from '@hocuspocus/extension-webhook';

extensions: [
  new Webhook({
    url: 'https://your-app.com/webhooks/document-changed',
    events: ['connect', 'disconnect', 'change'],
  }),
]

// Example: Rate limiting
import { RateLimiter } from '@hocuspocus/extension-throttle';

extensions: [
  new RateLimiter({
    throttle: 100, // messages per second
    ban: 60,       // ban duration in seconds
  }),
]
*/

/**
 * Environment Variables
 *
 * PORT - Server port (default: 1234)
 * NODE_ENV - Environment (development/production)
 * JWT_SECRET - Secret for JWT verification
 * DATABASE_URL - Database connection string
 * REDIS_URL - Redis connection string
 */

/**
 * Docker Deployment
 *
 * FROM node:18-alpine
 * WORKDIR /app
 * COPY package*.json ./
 * RUN npm install
 * COPY . .
 * EXPOSE 1234
 * CMD ["node", "collaboration-server.js"]
 */
