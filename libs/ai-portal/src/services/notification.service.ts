/**
 * Notification Service
 * Manages multichannel notifications for portal users
 * Supports push, email, SMS, in-app, and WhatsApp notifications
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Notification,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationPreference,
  NotificationChannelPreference,
  QuietHours,
  ScheduledNotification,
  NotificationContent,
  ServiceResult,
  PaginatedResult,
} from '../types';

// Configuration
const MAX_NOTIFICATIONS_PER_DAY = 20;
const NOTIFICATION_RETENTION_DAYS = 90;

// Default notification channels per type
const DEFAULT_CHANNELS: Record<NotificationType, NotificationChannel[]> = {
  policy_renewal: ['email', 'push', 'in_app'],
  policy_expiry: ['email', 'sms', 'push', 'in_app'],
  payment_due: ['email', 'push', 'in_app'],
  payment_received: ['email', 'in_app'],
  payment_failed: ['email', 'sms', 'push', 'in_app'],
  claim_update: ['email', 'push', 'in_app'],
  claim_approved: ['email', 'push', 'in_app'],
  claim_rejected: ['email', 'push', 'in_app'],
  document_available: ['email', 'push', 'in_app'],
  document_required: ['email', 'push', 'in_app'],
  badge_earned: ['push', 'in_app'],
  points_awarded: ['in_app'],
  reward_available: ['push', 'in_app'],
  referral_success: ['email', 'push', 'in_app'],
  security_alert: ['email', 'sms', 'push', 'in_app'],
  account_update: ['email', 'in_app'],
  new_article: ['push', 'in_app'],
  promotion: ['email', 'push', 'in_app'],
  system_maintenance: ['email', 'in_app'],
  custom: ['in_app'],
};

// In-memory storage (replace with database in production)
const notifications: Map<string, Notification> = new Map();
const userNotifications: Map<string, string[]> = new Map();
const notificationPreferences: Map<string, NotificationPreference[]> = new Map();
const scheduledNotifications: Map<string, ScheduledNotification> = new Map();
const dailyNotificationCount: Map<string, Map<string, number>> = new Map(); // userId -> date -> count

/**
 * Notification Service
 */
export class NotificationService {
  /**
   * Send a notification to user
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    content: NotificationContent,
    options?: {
      channels?: NotificationChannel[];
      priority?: NotificationPriority;
      data?: Record<string, unknown>;
    }
  ): Promise<ServiceResult<Notification[]>> {
    try {
      // Check daily limit
      if (!this.checkDailyLimit(userId)) {
        return {
          success: false,
          error: {
            code: 'DAILY_LIMIT_EXCEEDED',
            message: 'Se ha excedido el límite diario de notificaciones',
          },
        };
      }

      // Get user preferences
      const userPrefs = await this.getUserPreferencesForType(userId, type);

      // Determine channels
      let channels = options?.channels || DEFAULT_CHANNELS[type] || ['in_app'];

      // Filter by user preferences if they exist
      if (userPrefs) {
        if (!userPrefs.enabled) {
          return {
            success: true,
            data: [], // User has disabled this notification type
          };
        }
        channels = channels.filter(ch =>
          userPrefs.channels.some(pref => pref.channel === ch && pref.enabled)
        );
      }

      // Check quiet hours
      if (await this.isInQuietHours(userId, type)) {
        const priority = options?.priority || content.priority || 'normal';
        if (priority !== 'urgent') {
          // Schedule for after quiet hours
          const scheduledTime = await this.getNextAvailableTime(userId);
          await this.scheduleNotification(userId, type, content, scheduledTime);
          return {
            success: true,
            data: [],
          };
        }
      }

      const sentNotifications: Notification[] = [];
      const now = new Date();

      for (const channel of channels) {
        const notification: Notification = {
          id: uuidv4(),
          userId,
          type,
          channel,
          title: content.title,
          message: content.message,
          data: { ...content.data, ...options?.data },
          actionUrl: content.actionUrl,
          actionLabel: content.actionLabel,
          priority: options?.priority || content.priority || 'normal',
          status: 'pending',
          createdAt: now,
        };

        // Send through appropriate channel
        const sendResult = await this.sendThroughChannel(notification);

        notification.status = sendResult.success ? 'sent' : 'failed';
        notification.sentAt = sendResult.success ? now : undefined;

        // Store notification
        notifications.set(notification.id, notification);

        // Update user notifications list
        const userNotifIds = userNotifications.get(userId) || [];
        userNotifIds.push(notification.id);
        userNotifications.set(userId, userNotifIds);

        sentNotifications.push(notification);
      }

      // Update daily count
      this.incrementDailyCount(userId);

      return {
        success: true,
        data: sentNotifications,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SEND_ERROR',
          message: 'Error al enviar la notificación',
          details: { error: String(error) },
        },
      };
    }
  }

  /**
   * Get notifications for user
   */
  async getNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      type?: NotificationType;
      channel?: NotificationChannel;
      page?: number;
      pageSize?: number;
    }
  ): Promise<ServiceResult<PaginatedResult<Notification>>> {
    try {
      const userNotifIds = userNotifications.get(userId) || [];
      let userNotifs: Notification[] = [];

      for (const notifId of userNotifIds) {
        const notification = notifications.get(notifId);
        if (notification) {
          userNotifs.push(notification);
        }
      }

      // Apply filters
      if (options?.unreadOnly) {
        userNotifs = userNotifs.filter(n => !n.readAt);
      }

      if (options?.type) {
        userNotifs = userNotifs.filter(n => n.type === options.type);
      }

      if (options?.channel) {
        userNotifs = userNotifs.filter(n => n.channel === options.channel);
      }

      // Sort by date (most recent first)
      userNotifs.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Pagination
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;
      const totalCount = userNotifs.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      const paginatedNotifs = userNotifs.slice(start, end);

      return {
        success: true,
        data: {
          items: paginatedNotifs,
          totalCount,
          page,
          pageSize,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener las notificaciones',
        },
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    userId: string,
    notificationId: string
  ): Promise<ServiceResult<Notification>> {
    try {
      const notification = notifications.get(notificationId);

      if (!notification) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Notificación no encontrada',
          },
        };
      }

      if (notification.userId !== userId) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'No tiene acceso a esta notificación',
          },
        };
      }

      notification.readAt = new Date();
      notification.status = 'read';
      notifications.set(notificationId, notification);

      return {
        success: true,
        data: notification,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Error al marcar como leída',
        },
      };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<ServiceResult<number>> {
    try {
      const userNotifIds = userNotifications.get(userId) || [];
      let count = 0;

      for (const notifId of userNotifIds) {
        const notification = notifications.get(notifId);
        if (notification && !notification.readAt) {
          notification.readAt = new Date();
          notification.status = 'read';
          notifications.set(notifId, notification);
          count++;
        }
      }

      return {
        success: true,
        data: count,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Error al marcar todas como leídas',
        },
      };
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<ServiceResult<number>> {
    try {
      const userNotifIds = userNotifications.get(userId) || [];
      let count = 0;

      for (const notifId of userNotifIds) {
        const notification = notifications.get(notifId);
        if (notification && !notification.readAt) {
          count++;
        }
      }

      return {
        success: true,
        data: count,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COUNT_ERROR',
          message: 'Error al contar notificaciones',
        },
      };
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreference>[]
  ): Promise<ServiceResult<NotificationPreference[]>> {
    try {
      const existingPrefs = notificationPreferences.get(userId) || [];
      const updatedPrefs: NotificationPreference[] = [...existingPrefs];

      for (const pref of preferences) {
        if (!pref.notificationType) continue;

        const existingIndex = updatedPrefs.findIndex(
          p => p.notificationType === pref.notificationType
        );

        if (existingIndex >= 0) {
          // Update existing
          updatedPrefs[existingIndex] = {
            ...updatedPrefs[existingIndex],
            ...pref,
            updatedAt: new Date(),
          };
        } else {
          // Create new
          const newPref: NotificationPreference = {
            id: uuidv4(),
            userId,
            notificationType: pref.notificationType,
            channels: pref.channels || this.getDefaultChannelPreferences(pref.notificationType),
            enabled: pref.enabled ?? true,
            quietHours: pref.quietHours,
            updatedAt: new Date(),
          };
          updatedPrefs.push(newPref);
        }
      }

      notificationPreferences.set(userId, updatedPrefs);

      return {
        success: true,
        data: updatedPrefs,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Error al actualizar las preferencias',
        },
      };
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string): Promise<ServiceResult<NotificationPreference[]>> {
    try {
      let prefs = notificationPreferences.get(userId);

      if (!prefs || prefs.length === 0) {
        // Create default preferences
        prefs = await this.createDefaultPreferences(userId);
      }

      return {
        success: true,
        data: prefs,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener las preferencias',
        },
      };
    }
  }

  /**
   * Schedule a notification
   */
  async scheduleNotification(
    userId: string,
    type: NotificationType,
    content: NotificationContent,
    scheduledAt: Date
  ): Promise<ServiceResult<ScheduledNotification>> {
    try {
      if (scheduledAt <= new Date()) {
        return {
          success: false,
          error: {
            code: 'INVALID_SCHEDULE',
            message: 'La fecha programada debe ser futura',
          },
        };
      }

      const scheduled: ScheduledNotification = {
        id: uuidv4(),
        userId,
        type,
        content,
        scheduledAt,
        status: 'scheduled',
        createdAt: new Date(),
      };

      scheduledNotifications.set(scheduled.id, scheduled);

      return {
        success: true,
        data: scheduled,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SCHEDULE_ERROR',
          message: 'Error al programar la notificación',
        },
      };
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelScheduledNotification(
    userId: string,
    scheduledId: string
  ): Promise<ServiceResult<void>> {
    try {
      const scheduled = scheduledNotifications.get(scheduledId);

      if (!scheduled) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Notificación programada no encontrada',
          },
        };
      }

      if (scheduled.userId !== userId) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'No tiene acceso a esta notificación',
          },
        };
      }

      scheduled.status = 'cancelled';
      scheduledNotifications.set(scheduledId, scheduled);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CANCEL_ERROR',
          message: 'Error al cancelar la notificación',
        },
      };
    }
  }

  /**
   * Get scheduled notifications
   */
  async getScheduledNotifications(
    userId: string
  ): Promise<ServiceResult<ScheduledNotification[]>> {
    try {
      const scheduled: ScheduledNotification[] = [];

      for (const notif of scheduledNotifications.values()) {
        if (notif.userId === userId && notif.status === 'scheduled') {
          scheduled.push(notif);
        }
      }

      // Sort by scheduled date
      scheduled.sort((a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );

      return {
        success: true,
        data: scheduled,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener las notificaciones programadas',
        },
      };
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    userId: string,
    notificationId: string
  ): Promise<ServiceResult<void>> {
    try {
      const notification = notifications.get(notificationId);

      if (!notification) {
        return { success: true }; // Already deleted
      }

      if (notification.userId !== userId) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'No tiene acceso a esta notificación',
          },
        };
      }

      notifications.delete(notificationId);

      // Remove from user list
      const userNotifIds = userNotifications.get(userId) || [];
      const filteredIds = userNotifIds.filter(id => id !== notificationId);
      userNotifications.set(userId, filteredIds);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Error al eliminar la notificación',
        },
      };
    }
  }

  /**
   * Send bulk notification to multiple users
   */
  async sendBulkNotification(
    userIds: string[],
    type: NotificationType,
    content: NotificationContent,
    options?: {
      priority?: NotificationPriority;
    }
  ): Promise<ServiceResult<{ sent: number; failed: number }>> {
    try {
      let sent = 0;
      let failed = 0;

      for (const userId of userIds) {
        const result = await this.sendNotification(userId, type, content, options);
        if (result.success && result.data && result.data.length > 0) {
          sent++;
        } else {
          failed++;
        }
      }

      return {
        success: true,
        data: { sent, failed },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BULK_ERROR',
          message: 'Error al enviar notificaciones masivas',
        },
      };
    }
  }

  /**
   * Process scheduled notifications (called by cron job)
   */
  async processScheduledNotifications(): Promise<ServiceResult<number>> {
    try {
      const now = new Date();
      let processed = 0;

      for (const [id, scheduled] of scheduledNotifications.entries()) {
        if (scheduled.status === 'scheduled' && scheduled.scheduledAt <= now) {
          await this.sendNotification(
            scheduled.userId,
            scheduled.type,
            scheduled.content
          );

          scheduled.status = 'sent';
          scheduledNotifications.set(id, scheduled);
          processed++;
        }
      }

      return {
        success: true,
        data: processed,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROCESS_ERROR',
          message: 'Error al procesar notificaciones programadas',
        },
      };
    }
  }

  /**
   * Clean up old notifications (called by cron job)
   */
  async cleanupOldNotifications(): Promise<ServiceResult<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - NOTIFICATION_RETENTION_DAYS);
      let deleted = 0;

      for (const [id, notification] of notifications.entries()) {
        if (new Date(notification.createdAt) < cutoffDate) {
          notifications.delete(id);
          deleted++;
        }
      }

      // Clean up user notification lists
      for (const [userId, notifIds] of userNotifications.entries()) {
        const validIds = notifIds.filter(id => notifications.has(id));
        userNotifications.set(userId, validIds);
      }

      return {
        success: true,
        data: deleted,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: 'Error al limpiar notificaciones antiguas',
        },
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async sendThroughChannel(
    notification: Notification
  ): Promise<{ success: boolean; error?: string }> {
    // In production, this would integrate with actual notification providers
    // (SendGrid for email, Twilio for SMS, Firebase for push, etc.)

    switch (notification.channel) {
      case 'email':
        return this.sendEmail(notification);
      case 'sms':
        return this.sendSms(notification);
      case 'push':
        return this.sendPush(notification);
      case 'whatsapp':
        return this.sendWhatsApp(notification);
      case 'in_app':
      default:
        // In-app notifications are just stored
        return { success: true };
    }
  }

  private async sendEmail(notification: Notification): Promise<{ success: boolean }> {
    // Mock email sending - integrate with email service in production
    console.log(`[EMAIL] To: ${notification.userId}, Subject: ${notification.title}`);
    return { success: true };
  }

  private async sendSms(notification: Notification): Promise<{ success: boolean }> {
    // Mock SMS sending - integrate with SMS service in production
    console.log(`[SMS] To: ${notification.userId}, Message: ${notification.message}`);
    return { success: true };
  }

  private async sendPush(notification: Notification): Promise<{ success: boolean }> {
    // Mock push notification - integrate with push service in production
    console.log(`[PUSH] To: ${notification.userId}, Title: ${notification.title}`);
    return { success: true };
  }

  private async sendWhatsApp(notification: Notification): Promise<{ success: boolean }> {
    // Mock WhatsApp sending - integrate with WhatsApp Business API in production
    console.log(`[WHATSAPP] To: ${notification.userId}, Message: ${notification.message}`);
    return { success: true };
  }

  private async getUserPreferencesForType(
    userId: string,
    type: NotificationType
  ): Promise<NotificationPreference | undefined> {
    const prefs = notificationPreferences.get(userId) || [];
    return prefs.find(p => p.notificationType === type);
  }

  private async isInQuietHours(userId: string, type: NotificationType): Promise<boolean> {
    const pref = await this.getUserPreferencesForType(userId, type);
    if (!pref?.quietHours?.enabled) return false;

    const now = new Date();
    // Convert to user's timezone and check time
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: pref.quietHours.timezone,
    });

    const start = pref.quietHours.startTime;
    const end = pref.quietHours.endTime;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }

    return currentTime >= start && currentTime < end;
  }

  private async getNextAvailableTime(userId: string): Promise<Date> {
    // Return next time after quiet hours end
    const prefs = notificationPreferences.get(userId) || [];
    let latestEndTime = '08:00'; // Default

    for (const pref of prefs) {
      if (pref.quietHours?.enabled && pref.quietHours.endTime > latestEndTime) {
        latestEndTime = pref.quietHours.endTime;
      }
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [hours, minutes] = latestEndTime.split(':').map(Number);
    tomorrow.setHours(hours, minutes, 0, 0);

    return tomorrow;
  }

  private checkDailyLimit(userId: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    const userCounts = dailyNotificationCount.get(userId) || new Map();
    const todayCount = userCounts.get(today) || 0;

    return todayCount < MAX_NOTIFICATIONS_PER_DAY;
  }

  private incrementDailyCount(userId: string): void {
    const today = new Date().toISOString().split('T')[0];
    const userCounts = dailyNotificationCount.get(userId) || new Map();
    const currentCount = userCounts.get(today) || 0;
    userCounts.set(today, currentCount + 1);
    dailyNotificationCount.set(userId, userCounts);
  }

  private getDefaultChannelPreferences(
    type: NotificationType
  ): NotificationChannelPreference[] {
    const channels = DEFAULT_CHANNELS[type] || ['in_app'];
    return channels.map(channel => ({
      channel,
      enabled: true,
    }));
  }

  private async createDefaultPreferences(
    userId: string
  ): Promise<NotificationPreference[]> {
    const allTypes: NotificationType[] = [
      'policy_renewal',
      'policy_expiry',
      'payment_due',
      'payment_received',
      'payment_failed',
      'claim_update',
      'claim_approved',
      'claim_rejected',
      'document_available',
      'document_required',
      'badge_earned',
      'points_awarded',
      'reward_available',
      'referral_success',
      'security_alert',
      'account_update',
      'new_article',
      'promotion',
      'system_maintenance',
    ];

    const prefs: NotificationPreference[] = allTypes.map(type => ({
      id: uuidv4(),
      userId,
      notificationType: type,
      channels: this.getDefaultChannelPreferences(type),
      enabled: true,
      updatedAt: new Date(),
    }));

    notificationPreferences.set(userId, prefs);

    return prefs;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
