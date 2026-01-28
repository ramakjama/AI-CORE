/**
 * WebSocket Server - Real-time event distribution
 *
 * Provides real-time communication for:
 * - Call events (incoming, active, completed)
 * - Agent status updates
 * - Customer interactions
 * - Notifications
 * - Analytics updates
 */

import { Server } from 'socket.io';
import { createServer } from 'http';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import { EventBus, Event, User } from '@ait-core/shared';

dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const config = {
  port: process.env.WS_PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',')
  }
};

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// ============================================================================
// REDIS & EVENT BUS
// ============================================================================

const redis = new Redis(config.redis);
const eventBus = new EventBus({
  redis,
  consumerGroup: 'websocket-server',
  consumerId: `ws-${process.pid}`
});

// ============================================================================
// HTTP SERVER & SOCKET.IO
// ============================================================================

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origins,
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// ============================================================================
// SOCKET AUTHENTICATION MIDDLEWARE
// ============================================================================

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT
    const decoded = jwt.verify(token, config.jwtSecret) as any;

    // Get user from cache
    const cacheKey = `user:${decoded.userId}`;
    const userData = await redis.get(cacheKey);

    if (!userData) {
      return next(new Error('User not found'));
    }

    const user: User = JSON.parse(userData);

    // Attach user to socket
    (socket as any).user = user;

    logger.info(`User authenticated: ${user.email} (${user.role})`);

    next();
  } catch (err: any) {
    logger.error('Socket authentication error:', err);
    next(new Error('Authentication failed'));
  }
});

// ============================================================================
// CONNECTION HANDLING
// ============================================================================

io.on('connection', (socket) => {
  const user: User = (socket as any).user;

  logger.info(`Client connected: ${socket.id} (${user.email})`);

  // Join user-specific rooms
  socket.join(`user:${user.id}`);

  if (user.role === 'agent' && user.agentId) {
    socket.join(`agent:${user.agentId}`);
    socket.join('agents'); // All agents room
  }

  if (user.role === 'supervisor' || user.role === 'admin') {
    socket.join('supervisors');
  }

  if (user.customerId) {
    socket.join(`customer:${user.customerId}`);
  }

  // Send welcome message
  socket.emit('connected', {
    message: 'Connected to AIT-CORE WebSocket server',
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    },
    timestamp: Date.now()
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CALL EVENTS
  // ──────────────────────────────────────────────────────────────────────────

  socket.on('call:join', (data: { callSid: string }) => {
    socket.join(`call:${data.callSid}`);
    logger.debug(`Socket ${socket.id} joined call ${data.callSid}`);

    socket.emit('call:joined', {
      callSid: data.callSid,
      timestamp: Date.now()
    });
  });

  socket.on('call:leave', (data: { callSid: string }) => {
    socket.leave(`call:${data.callSid}`);
    logger.debug(`Socket ${socket.id} left call ${data.callSid}`);
  });

  socket.on('call:update-status', async (data: {
    callSid: string;
    status: string;
  }) => {
    // Broadcast to all participants of the call
    io.to(`call:${data.callSid}`).emit('call:status-updated', {
      callSid: data.callSid,
      status: data.status,
      timestamp: Date.now()
    });

    // Also broadcast to supervisors
    io.to('supervisors').emit('call:status-updated', {
      callSid: data.callSid,
      agentId: user.agentId,
      status: data.status,
      timestamp: Date.now()
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // AGENT STATUS
  // ──────────────────────────────────────────────────────────────────────────

  socket.on('agent:status-change', async (data: {
    status: 'available' | 'busy' | 'in_call' | 'wrap_up' | 'break' | 'offline';
  }) => {
    if (!user.agentId) {
      socket.emit('error', { message: 'User is not an agent' });
      return;
    }

    // Update in Redis
    await redis.hset(`agent:${user.agentId}:status`, {
      status: data.status,
      updatedAt: Date.now(),
      socketId: socket.id
    });

    // Broadcast to supervisors
    io.to('supervisors').emit('agent:status-changed', {
      agentId: user.agentId,
      agentName: user.name,
      status: data.status,
      timestamp: Date.now()
    });

    logger.info(`Agent ${user.agentId} status: ${data.status}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TRANSCRIPTION (Real-time during call)
  // ──────────────────────────────────────────────────────────────────────────

  socket.on('transcription', (data: {
    callSid: string;
    text: string;
    speaker: 'agent' | 'customer';
  }) => {
    // Broadcast to call participants
    io.to(`call:${data.callSid}`).emit('transcription', {
      ...data,
      timestamp: Date.now()
    });

    // Send to supervisors if they're monitoring
    io.to('supervisors').emit('transcription', {
      ...data,
      agentId: user.agentId,
      timestamp: Date.now()
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ──────────────────────────────────────────────────────────────────────────

  socket.on('notification:read', async (data: { notificationId: string }) => {
    // Mark as read in database (through API)
    socket.emit('notification:marked-read', {
      notificationId: data.notificationId,
      timestamp: Date.now()
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TYPING INDICATORS (for chat)
  // ──────────────────────────────────────────────────────────────────────────

  socket.on('typing:start', (data: { conversationId: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit('typing:started', {
      userId: user.id,
      userName: user.name,
      timestamp: Date.now()
    });
  });

  socket.on('typing:stop', (data: { conversationId: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit('typing:stopped', {
      userId: user.id,
      timestamp: Date.now()
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DISCONNECT
  // ──────────────────────────────────────────────────────────────────────────

  socket.on('disconnect', async () => {
    logger.info(`Client disconnected: ${socket.id} (${user.email})`);

    // If agent, update status
    if (user.agentId) {
      await redis.hset(`agent:${user.agentId}:status`, {
        status: 'offline',
        updatedAt: Date.now()
      });

      io.to('supervisors').emit('agent:status-changed', {
        agentId: user.agentId,
        agentName: user.name,
        status: 'offline',
        timestamp: Date.now()
      });
    }
  });

  // Error handling
  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.id}:`, error);
  });
});

// ============================================================================
// EVENT BUS INTEGRATION
// ============================================================================

// Subscribe to all events and broadcast to appropriate rooms
eventBus.on('*', (event: Event) => {
  logger.debug(`Event received: ${event.type}`, event.data);

  switch (event.type) {
    // ──────────────────────────────────────────────────────────────────────
    // CALL EVENTS
    // ──────────────────────────────────────────────────────────────────────

    case 'call.initiated':
      if (event.data.agentId) {
        io.to(`agent:${event.data.agentId}`).emit('call:incoming', {
          callSid: event.data.callSid,
          from: event.data.from,
          customerId: event.data.customerId,
          timestamp: event.timestamp
        });
      }

      io.to('supervisors').emit('call:new', {
        callSid: event.data.callSid,
        agentId: event.data.agentId,
        customerId: event.data.customerId,
        direction: event.data.direction,
        timestamp: event.timestamp
      });
      break;

    case 'call.answered':
      io.to(`call:${event.data.callSid}`).emit('call:answered', {
        callSid: event.data.callSid,
        timestamp: event.timestamp
      });

      io.to('supervisors').emit('call:answered', {
        callSid: event.data.callSid,
        agentId: event.data.agentId,
        timestamp: event.timestamp
      });
      break;

    case 'call.completed':
      io.to(`call:${event.data.callSid}`).emit('call:completed', {
        callSid: event.data.callSid,
        duration: event.data.duration,
        outcome: event.data.outcome,
        timestamp: event.timestamp
      });

      io.to('supervisors').emit('call:completed', {
        callSid: event.data.callSid,
        agentId: event.data.agentId,
        duration: event.data.duration,
        outcome: event.data.outcome,
        timestamp: event.timestamp
      });
      break;

    // ──────────────────────────────────────────────────────────────────────
    // CUSTOMER EVENTS
    // ──────────────────────────────────────────────────────────────────────

    case 'customer.updated':
      if (event.data.customerId) {
        io.to(`customer:${event.data.customerId}`).emit('customer:updated', {
          customerId: event.data.customerId,
          changes: event.data.changes,
          timestamp: event.timestamp
        });
      }
      break;

    // ──────────────────────────────────────────────────────────────────────
    // POLICY EVENTS
    // ──────────────────────────────────────────────────────────────────────

    case 'policy.created':
      if (event.data.customerId) {
        io.to(`customer:${event.data.customerId}`).emit('policy:created', {
          policyId: event.data.policyId,
          type: event.data.type,
          premium: event.data.premium,
          timestamp: event.timestamp
        });
      }

      io.to('supervisors').emit('policy:created', {
        policyId: event.data.policyId,
        customerId: event.data.customerId,
        type: event.data.type,
        premium: event.data.premium,
        createdBy: event.data.createdBy,
        timestamp: event.timestamp
      });
      break;

    // ──────────────────────────────────────────────────────────────────────
    // QUOTE EVENTS
    // ──────────────────────────────────────────────────────────────────────

    case 'quote.created':
      if (event.data.callSid) {
        io.to(`call:${event.data.callSid}`).emit('quote:created', {
          quoteId: event.data.quoteId,
          type: event.data.type,
          premium: event.data.premium,
          timestamp: event.timestamp
        });
      }
      break;

    // ──────────────────────────────────────────────────────────────────────
    // TASK EVENTS
    // ──────────────────────────────────────────────────────────────────────

    case 'task.created':
    case 'task.assigned':
      if (event.data.assignedTo) {
        io.to(`agent:${event.data.assignedTo}`).emit('task:new', {
          taskId: event.data.taskId,
          type: event.data.type,
          priority: event.data.priority,
          dueDate: event.data.dueDate,
          timestamp: event.timestamp
        });
      }
      break;

    // ──────────────────────────────────────────────────────────────────────
    // SYSTEM ALERTS
    // ──────────────────────────────────────────────────────────────────────

    case 'system.alert':
      io.to('supervisors').emit('system:alert', {
        level: event.data.level,
        message: event.data.message,
        timestamp: event.timestamp
      });
      break;
  }
});

// Start consuming events
eventBus.startConsuming('*');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Send notification to specific user
 */
export function sendNotificationToUser(userId: string, notification: any) {
  io.to(`user:${userId}`).emit('notification', {
    ...notification,
    timestamp: Date.now()
  });
}

/**
 * Send message to all agents
 */
export function broadcastToAgents(event: string, data: any) {
  io.to('agents').emit(event, {
    ...data,
    timestamp: Date.now()
  });
}

/**
 * Send message to all supervisors
 */
export function broadcastToSupervisors(event: string, data: any) {
  io.to('supervisors').emit(event, {
    ...data,
    timestamp: Date.now()
  });
}

/**
 * Get connected sockets count
 */
export async function getConnectedCount(): Promise<{
  total: number;
  agents: number;
  supervisors: number;
}> {
  const sockets = await io.fetchSockets();
  const agents = await io.in('agents').fetchSockets();
  const supervisors = await io.in('supervisors').fetchSockets();

  return {
    total: sockets.length,
    agents: agents.length,
    supervisors: supervisors.length
  };
}

// ============================================================================
// START SERVER
// ============================================================================

httpServer.listen(config.port, () => {
  logger.info(`🔌 WebSocket server running on port ${config.port}`);
  logger.info(`CORS origins: ${config.cors.origins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing connections');

  io.close(() => {
    logger.info('All socket connections closed');
  });

  eventBus.stopConsuming();
  await redis.quit();

  process.exit(0);
});

export default io;
