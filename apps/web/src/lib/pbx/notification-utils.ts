/**
 * Notification utilities for desktop and toast notifications
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

export class NotificationManager {
  private permission: NotificationPermission = 'default';
  private notifications: Map<string, Notification> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission !== 'denied') {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    }

    return false;
  }

  async showNotification(options: NotificationOptions): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return;
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/phone.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction,
      });

      if (options.tag) {
        // Close previous notification with same tag
        const existing = this.notifications.get(options.tag);
        if (existing) {
          existing.close();
        }
        this.notifications.set(options.tag, notification);
      }

      if (options.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick?.();
          notification.close();
        };
      }

      notification.onclose = () => {
        if (options.tag) {
          this.notifications.delete(options.tag);
        }
      };
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  closeNotification(tag: string): void {
    const notification = this.notifications.get(tag);
    if (notification) {
      notification.close();
      this.notifications.delete(tag);
    }
  }

  closeAllNotifications(): void {
    this.notifications.forEach((notification) => notification.close());
    this.notifications.clear();
  }

  // Specific notification helpers
  async showIncomingCallNotification(
    callerName: string,
    callerNumber: string,
    onAnswer?: () => void
  ): Promise<void> {
    await this.showNotification({
      title: 'Incoming Call',
      body: `${callerName || 'Unknown'} (${callerNumber})`,
      tag: 'incoming-call',
      requireInteraction: true,
      onClick: onAnswer,
    });
  }

  async showMissedCallNotification(callerName: string, callerNumber: string): Promise<void> {
    await this.showNotification({
      title: 'Missed Call',
      body: `${callerName || 'Unknown'} (${callerNumber})`,
      tag: 'missed-call',
    });
  }

  async showCallEndedNotification(duration: string): Promise<void> {
    await this.showNotification({
      title: 'Call Ended',
      body: `Duration: ${duration}`,
      tag: 'call-ended',
    });
  }
}

// Toast notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// This will be used with your toast system (e.g., react-hot-toast, sonner, etc.)
export function showToast(options: ToastOptions): void {
  // Placeholder for toast integration
  // You would integrate with your actual toast library here
  console.log('[Toast]', options.type, options.message);
}

// Singleton instance
let notificationManager: NotificationManager | null = null;

export function getNotificationManager(): NotificationManager {
  if (!notificationManager) {
    notificationManager = new NotificationManager();
  }
  return notificationManager;
}

export function resetNotificationManager(): void {
  if (notificationManager) {
    notificationManager.closeAllNotifications();
    notificationManager = null;
  }
}
