import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Logger, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { WebSocketService } from './websocket.service';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userEmail?: string;
  rooms?: Set<string>;
}

/**
 * WebSocket Gateway
 *
 * Handles WebSocket connections, authentication, and message routing.
 *
 * Connection Flow:
 * 1. Client connects with JWT token in query string
 * 2. Gateway validates token
 * 3. Connection is authenticated and stored
 * 4. Client can join rooms and send/receive messages
 *
 * Events:
 * - connect: New client connection
 * - disconnect: Client disconnection
 * - message: General message
 * - join-room: Join a specific room
 * - leave-room: Leave a room
 * - broadcast: Broadcast to room
 *
 * @gateway WebSocket
 */
@WSGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private rooms: Map<string, Set<string>> = new Map(); // roomId -> Set of clientIds

  constructor(
    private authService: AuthService,
    private websocketService: WebSocketService,
  ) {}

  /**
   * Initialize WebSocket server
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.websocketService.setServer(server);
  }

  /**
   * Handle new client connection
   * Authenticates the client using JWT token from query string
   */
  async handleConnection(client: AuthenticatedWebSocket, request: any) {
    try {
      // Extract token from query string
      const url = new URL(request.url, `ws://localhost`);
      const token = url.searchParams.get('token');

      if (!token) {
        this.logger.warn('Connection rejected: No token provided');
        client.close(4001, 'Authentication required');
        return;
      }

      // Validate token
      const payload = await this.authService.verifyToken(token);
      if (!payload) {
        this.logger.warn('Connection rejected: Invalid token');
        client.close(4001, 'Invalid token');
        return;
      }

      // Store client with user information
      client.userId = payload.sub;
      client.userEmail = payload.email;
      client.rooms = new Set();

      this.clients.set(client.userId, client);

      this.logger.log(
        `Client connected: ${client.userId} (${client.userEmail})`,
      );
      this.logger.log(`Active connections: ${this.clients.size}`);

      // Send welcome message
      this.sendToClient(client, {
        event: 'connected',
        data: {
          message: 'Successfully connected to WebSocket server',
          userId: client.userId,
          timestamp: new Date().toISOString(),
        },
      });

      // Notify about presence
      this.broadcastPresence('user-online', {
        userId: client.userId,
        email: client.userEmail,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.close(4000, 'Connection error');
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: AuthenticatedWebSocket) {
    if (!client.userId) return;

    // Leave all rooms
    if (client.rooms) {
      client.rooms.forEach((roomId) => {
        this.leaveRoom(client, roomId);
      });
    }

    // Remove client from active connections
    this.clients.delete(client.userId);

    this.logger.log(
      `Client disconnected: ${client.userId} (${client.userEmail})`,
    );
    this.logger.log(`Active connections: ${this.clients.size}`);

    // Notify about presence
    this.broadcastPresence('user-offline', {
      userId: client.userId,
      email: client.userEmail,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle incoming messages
   */
  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: AuthenticatedWebSocket,
    @MessageBody() data: any,
  ) {
    this.logger.log(`Message from ${client.userId}:`, data);

    // Echo back to sender
    this.sendToClient(client, {
      event: 'message',
      data: {
        echo: true,
        originalMessage: data,
        timestamp: new Date().toISOString(),
      },
    });

    return { success: true };
  }

  /**
   * Join a room
   */
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedWebSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;

    if (!roomId) {
      return { success: false, error: 'Room ID is required' };
    }

    this.joinRoom(client, roomId);

    return {
      success: true,
      message: `Joined room: ${roomId}`,
      roomId,
    };
  }

  /**
   * Leave a room
   */
  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedWebSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;

    if (!roomId) {
      return { success: false, error: 'Room ID is required' };
    }

    this.leaveRoom(client, roomId);

    return {
      success: true,
      message: `Left room: ${roomId}`,
      roomId,
    };
  }

  /**
   * Broadcast message to a room
   */
  @SubscribeMessage('broadcast')
  handleBroadcast(
    @ConnectedSocket() client: AuthenticatedWebSocket,
    @MessageBody() data: { roomId: string; message: any },
  ) {
    const { roomId, message } = data;

    if (!roomId || !message) {
      return { success: false, error: 'Room ID and message are required' };
    }

    if (!client.rooms?.has(roomId)) {
      return { success: false, error: 'Not a member of this room' };
    }

    this.broadcastToRoom(roomId, {
      event: 'broadcast',
      data: {
        roomId,
        message,
        senderId: client.userId,
        senderEmail: client.userEmail,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: 'Broadcast sent',
      roomId,
    };
  }

  /**
   * Send message to specific client
   */
  private sendToClient(client: AuthenticatedWebSocket, message: any) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcastPresence(event: string, data: any) {
    const message = {
      event,
      data,
    };

    this.clients.forEach((client) => {
      this.sendToClient(client, message);
    });
  }

  /**
   * Join a room
   */
  private joinRoom(client: AuthenticatedWebSocket, roomId: string) {
    // Add client to room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(client.userId!);

    // Add room to client
    if (!client.rooms) {
      client.rooms = new Set();
    }
    client.rooms.add(roomId);

    this.logger.log(`Client ${client.userId} joined room: ${roomId}`);

    // Notify room members
    this.broadcastToRoom(roomId, {
      event: 'user-joined',
      data: {
        roomId,
        userId: client.userId,
        email: client.userEmail,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Leave a room
   */
  private leaveRoom(client: AuthenticatedWebSocket, roomId: string) {
    // Remove client from room
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(client.userId!);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    // Remove room from client
    if (client.rooms) {
      client.rooms.delete(roomId);
    }

    this.logger.log(`Client ${client.userId} left room: ${roomId}`);

    // Notify room members
    this.broadcastToRoom(roomId, {
      event: 'user-left',
      data: {
        roomId,
        userId: client.userId,
        email: client.userEmail,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Broadcast message to all clients in a room
   */
  private broadcastToRoom(roomId: string, message: any) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.forEach((userId) => {
      const client = this.clients.get(userId);
      if (client) {
        this.sendToClient(client, message);
      }
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get rooms count
   */
  getRoomsCount(): number {
    return this.rooms.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.clients.has(userId);
  }
}
