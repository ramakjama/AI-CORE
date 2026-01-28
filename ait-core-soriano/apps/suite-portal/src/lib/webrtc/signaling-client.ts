/**
 * WebSocket Signaling Client
 * Handles signaling for WebRTC connections
 */

import { io, Socket } from 'socket.io-client';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'user-joined' | 'user-left' | 'call-request' | 'call-accepted' | 'call-declined';
  from?: string;
  to?: string;
  room?: string;
  data?: any;
  userId?: string;
  userName?: string;
}

export interface SignalingClientEvents {
  onConnect: () => void;
  onDisconnect: () => void;
  onMessage: (message: SignalingMessage) => void;
  onUserJoined: (userId: string, userName: string) => void;
  onUserLeft: (userId: string) => void;
  onCallRequest: (from: string, fromName: string) => void;
  onCallAccepted: (from: string) => void;
  onCallDeclined: (from: string) => void;
  onError: (error: Error) => void;
}

export class SignalingClient {
  private socket: Socket | null = null;
  private events: SignalingClientEvents;
  private currentRoom: string | null = null;
  private userId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(events: SignalingClientEvents) {
    this.events = events;
  }

  /**
   * Connect to signaling server
   */
  connect(url: string = 'ws://localhost:1234', userId: string, userName: string): void {
    try {
      this.userId = userId;

      this.socket = io(url, {
        path: '/signaling',
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000,
        query: {
          userId,
          userName,
        },
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('Error connecting to signaling server:', error);
      this.events.onError(error as Error);
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
      this.reconnectAttempts = 0;
      this.events.onConnect();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from signaling server:', reason);
      this.events.onDisconnect();
    });

    this.socket.on('reconnect_attempt', (attempt: number) => {
      console.log(`Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
      this.reconnectAttempts = attempt;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to signaling server');
      this.events.onError(new Error('Failed to reconnect to signaling server'));
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
      this.events.onError(error);
    });

    // Signaling messages
    this.socket.on('signal', (message: SignalingMessage) => {
      this.events.onMessage(message);
    });

    // Room events
    this.socket.on('user-joined', (data: { userId: string; userName: string }) => {
      console.log('User joined:', data);
      this.events.onUserJoined(data.userId, data.userName);
    });

    this.socket.on('user-left', (data: { userId: string }) => {
      console.log('User left:', data);
      this.events.onUserLeft(data.userId);
    });

    // Call events
    this.socket.on('call-request', (data: { from: string; fromName: string }) => {
      console.log('Call request from:', data);
      this.events.onCallRequest(data.from, data.fromName);
    });

    this.socket.on('call-accepted', (data: { from: string }) => {
      console.log('Call accepted by:', data);
      this.events.onCallAccepted(data.from);
    });

    this.socket.on('call-declined', (data: { from: string }) => {
      console.log('Call declined by:', data);
      this.events.onCallDeclined(data.from);
    });
  }

  /**
   * Join a room
   */
  joinRoom(roomId: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected');
      return;
    }

    this.currentRoom = roomId;
    this.socket.emit('join-room', { room: roomId });
    console.log('Joining room:', roomId);
  }

  /**
   * Leave current room
   */
  leaveRoom(): void {
    if (!this.socket || !this.socket.connected || !this.currentRoom) {
      return;
    }

    this.socket.emit('leave-room', { room: this.currentRoom });
    console.log('Leaving room:', this.currentRoom);
    this.currentRoom = null;
  }

  /**
   * Send signaling message
   */
  sendSignal(message: SignalingMessage): void {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected');
      return;
    }

    const fullMessage: SignalingMessage = {
      ...message,
      from: this.userId || undefined,
      room: this.currentRoom || undefined,
    };

    this.socket.emit('signal', fullMessage);
    console.log('Sending signal:', fullMessage.type);
  }

  /**
   * Request a call to another user
   */
  requestCall(toUserId: string, userName: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('call-request', {
      to: toUserId,
      from: this.userId,
      fromName: userName,
    });
    console.log('Call request sent to:', toUserId);
  }

  /**
   * Accept incoming call
   */
  acceptCall(fromUserId: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('call-accepted', {
      to: fromUserId,
      from: this.userId,
    });
    console.log('Call accepted from:', fromUserId);
  }

  /**
   * Decline incoming call
   */
  declineCall(fromUserId: string): void {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('call-declined', {
      to: fromUserId,
      from: this.userId,
    });
    console.log('Call declined from:', fromUserId);
  }

  /**
   * Send offer
   */
  sendOffer(to: string, offer: any): void {
    this.sendSignal({
      type: 'offer',
      to,
      data: offer,
    });
  }

  /**
   * Send answer
   */
  sendAnswer(to: string, answer: any): void {
    this.sendSignal({
      type: 'answer',
      to,
      data: answer,
    });
  }

  /**
   * Send ICE candidate
   */
  sendIceCandidate(to: string, candidate: any): void {
    this.sendSignal({
      type: 'ice-candidate',
      to,
      data: candidate,
    });
  }

  /**
   * Get current room
   */
  getCurrentRoom(): string | null {
    return this.currentRoom;
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  /**
   * Disconnect from signaling server
   */
  disconnect(): void {
    if (this.socket) {
      this.leaveRoom();
      this.socket.disconnect();
      this.socket = null;
      this.currentRoom = null;
      console.log('Disconnected from signaling server');
    }
  }
}
