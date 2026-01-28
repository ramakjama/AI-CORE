import { io, Socket } from 'socket.io-client';
import { useNotificationsStore, Notification, NotificationType } from '@/store/notifications.store';

export interface NotificationEvent {
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

class NotificationManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    // Get the WebSocket URL from environment or use default
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002';

    try {
      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        autoConnect: false,
      });

      this.setupListeners();
    } catch (error) {
      console.error('Failed to initialize notification socket:', error);
    }
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Notification WebSocket connected');
      this.reconnectAttempts = 0;
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Notification WebSocket disconnected:', reason);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
      this.isConnecting = false;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Listen for notification events
    this.socket.on('notification', (data: NotificationEvent) => {
      this.handleNotification(data);
    });

    // Listen for specific notification types
    this.socket.on('notification:info', (data: Omit<NotificationEvent, 'type'>) => {
      this.handleNotification({ ...data, type: 'info' });
    });

    this.socket.on('notification:success', (data: Omit<NotificationEvent, 'type'>) => {
      this.handleNotification({ ...data, type: 'success' });
    });

    this.socket.on('notification:warning', (data: Omit<NotificationEvent, 'type'>) => {
      this.handleNotification({ ...data, type: 'warning' });
    });

    this.socket.on('notification:error', (data: Omit<NotificationEvent, 'type'>) => {
      this.handleNotification({ ...data, type: 'error' });
    });
  }

  private handleNotification(data: NotificationEvent) {
    const { addNotification } = useNotificationsStore.getState();

    addNotification({
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      metadata: data.metadata,
    });

    // Play notification sound if enabled
    this.playNotificationSound();

    // Request browser notification permission if not granted
    this.showBrowserNotification(data);
  }

  private playNotificationSound() {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors (e.g., user hasn't interacted with page yet)
      });
    } catch (error) {
      // Ignore audio errors
    }
  }

  private async showBrowserNotification(data: NotificationEvent) {
    if (!('Notification' in window)) return;

    try {
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/icons/notification-icon.png',
          badge: '/icons/badge-icon.png',
          tag: 'ait-notification',
          requireInteraction: data.type === 'error' || data.type === 'warning',
        });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(data.title, {
            body: data.message,
            icon: '/icons/notification-icon.png',
          });
        }
      }
    } catch (error) {
      // Ignore notification errors
    }
  }

  connect() {
    if (this.socket && !this.socket.connected && !this.isConnecting) {
      this.isConnecting = true;
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
  }

  emit(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  // Public method to manually add a notification
  addNotification(notification: Omit<NotificationEvent, 'type'> & { type?: NotificationType }) {
    this.handleNotification({
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      actionLabel: notification.actionLabel,
      metadata: notification.metadata,
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
export const notificationManager = new NotificationManager();

// Auto-connect when the module is imported
if (typeof window !== 'undefined') {
  notificationManager.connect();
}
