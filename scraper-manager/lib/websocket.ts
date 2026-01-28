import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { EventBus } from './redis';

let io: SocketIOServer | null = null;
const eventBus = new EventBus();

export function initializeWebSocket(server: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  io.on('connection', (socket: Socket) => {
    console.log('✅ Client connected:', socket.id);

    // Subscribe to scraper logs
    socket.on('subscribe:logs', async (scraperId: string) => {
      const channel = `scraper:${scraperId}:logs`;
      await eventBus.subscribe(channel, (message) => {
        socket.emit('log', message);
      });

      console.log(`Client ${socket.id} subscribed to ${channel}`);
    });

    // Subscribe to scraper status
    socket.on('subscribe:status', async (scraperId: string) => {
      const channel = `scraper:${scraperId}:status`;
      await eventBus.subscribe(channel, (message) => {
        socket.emit('status', message);
      });

      console.log(`Client ${socket.id} subscribed to ${channel}`);
    });

    // Subscribe to execution progress
    socket.on('subscribe:progress', async (executionId: string) => {
      const channel = `execution:${executionId}:progress`;
      await eventBus.subscribe(channel, (message) => {
        socket.emit('progress', message);
      });

      console.log(`Client ${socket.id} subscribed to ${channel}`);
    });

    // Unsubscribe
    socket.on('unsubscribe', async (channel: string) => {
      await eventBus.unsubscribe(channel);
      console.log(`Client ${socket.id} unsubscribed from ${channel}`);
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Emit helpers
export class WebSocketEmitter {
  static async emitLog(scraperId: string, log: any): Promise<void> {
    const channel = `scraper:${scraperId}:logs`;
    await eventBus.publish(channel, log);
  }

  static async emitStatus(scraperId: string, status: any): Promise<void> {
    const channel = `scraper:${scraperId}:status`;
    await eventBus.publish(channel, status);
  }

  static async emitProgress(executionId: string, progress: any): Promise<void> {
    const channel = `execution:${executionId}:progress`;
    await eventBus.publish(channel, progress);
  }

  static async emitMetric(scraperId: string, metric: any): Promise<void> {
    const channel = `scraper:${scraperId}:metrics`;
    await eventBus.publish(channel, metric);
  }
}

export default { initializeWebSocket, getIO };
