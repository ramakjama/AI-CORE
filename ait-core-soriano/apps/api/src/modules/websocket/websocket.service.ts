import { Injectable, Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';

/**
 * WebSocket Service
 *
 * Service for sending messages through WebSocket connections.
 * Can be injected into any service to send real-time updates.
 *
 * Usage:
 * ```typescript
 * constructor(private websocketService: WebSocketService) {}
 *
 * // Send to specific user
 * await this.websocketService.sendToUser(userId, 'notification', data);
 *
 * // Broadcast to all users
 * await this.websocketService.broadcast('system-update', data);
 * ```
 *
 * @service WebSocketService
 */
@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private server: Server;

  /**
   * Set WebSocket server instance
   */
  setServer(server: Server) {
    this.server = server;
    this.logger.log('WebSocket server instance set');
  }

  /**
   * Send message to specific user
   *
   * @param userId - Target user ID
   * @param event - Event name
   * @param data - Message data
   */
  async sendToUser(userId: string, event: string, data: any): Promise<boolean> {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return false;
    }

    let sent = false;

    this.server.clients.forEach((client: any) => {
      if (client.userId === userId && client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            event,
            data,
            timestamp: new Date().toISOString(),
          }),
        );
        sent = true;
      }
    });

    if (sent) {
      this.logger.log(`Message sent to user ${userId}: ${event}`);
    } else {
      this.logger.warn(`User ${userId} not connected`);
    }

    return sent;
  }

  /**
   * Broadcast message to all connected clients
   *
   * @param event - Event name
   * @param data - Message data
   */
  async broadcast(event: string, data: any): Promise<number> {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return 0;
    }

    const message = JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
    });

    let count = 0;

    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        count++;
      }
    });

    this.logger.log(`Broadcast sent to ${count} clients: ${event}`);
    return count;
  }

  /**
   * Broadcast message to specific room
   *
   * @param roomId - Room ID
   * @param event - Event name
   * @param data - Message data
   */
  async broadcastToRoom(
    roomId: string,
    event: string,
    data: any,
  ): Promise<number> {
    if (!this.server) {
      this.logger.warn('WebSocket server not initialized');
      return 0;
    }

    const message = JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
    });

    let count = 0;

    this.server.clients.forEach((client: any) => {
      if (
        client.rooms?.has(roomId) &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(message);
        count++;
      }
    });

    this.logger.log(
      `Broadcast sent to room ${roomId} (${count} clients): ${event}`,
    );
    return count;
  }

  /**
   * Get connected clients count
   */
  getConnectedCount(): number {
    if (!this.server) return 0;
    return this.server.clients.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    if (!this.server) return false;

    let connected = false;
    this.server.clients.forEach((client: any) => {
      if (client.userId === userId) {
        connected = true;
      }
    });

    return connected;
  }
}
