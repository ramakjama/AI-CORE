import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketService } from '../websocket/websocket.service';
import { Notification, NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';

export interface SendNotificationDto {
  userId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  metadata?: any;
}

/**
 * Notifications Service
 *
 * Orchestrates multi-channel notification delivery including email, SMS,
 * push notifications, and in-app notifications.
 *
 * @service NotificationsService
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private websocketService: WebSocketService,
  ) {}

  /**
   * Send notification through specified channel
   */
  async send(dto: SendNotificationDto): Promise<Notification> {
    // Create notification record
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        channel: dto.channel,
        title: dto.title,
        message: dto.message,
        metadata: dto.metadata,
        status: NotificationStatus.PENDING,
      },
    });

    try {
      // Send through appropriate channel
      await this.sendThroughChannel(notification);

      // Update status
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });

      this.logger.log(`Notification sent: ${notification.id} via ${dto.channel}`);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${notification.id}`, error);

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.FAILED },
      });
    }

    return notification;
  }

  /**
   * Send notification through appropriate channel
   */
  private async sendThroughChannel(notification: Notification): Promise<void> {
    switch (notification.channel) {
      case NotificationChannel.EMAIL:
        // Email sending would be implemented here
        this.logger.debug(`Sending email notification: ${notification.id}`);
        break;

      case NotificationChannel.SMS:
        // SMS sending would be implemented here
        this.logger.debug(`Sending SMS notification: ${notification.id}`);
        break;

      case NotificationChannel.PUSH:
        // Push notification sending would be implemented here
        this.logger.debug(`Sending push notification: ${notification.id}`);
        break;

      case NotificationChannel.IN_APP:
        // Send through WebSocket
        if (notification.userId) {
          await this.websocketService.sendToUser(
            notification.userId,
            'notification',
            {
              id: notification.id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              metadata: notification.metadata,
            },
          );
        }
        break;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    } = {},
  ) {
    const { page = 1, limit = 20, unreadOnly = false } = options;

    const where: any = { userId };
    if (unreadOnly) {
      where.readAt = null;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /**
   * Delete notification
   */
  async delete(id: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  /**
   * Bulk send notifications
   */
  async sendBulk(notifications: SendNotificationDto[]): Promise<void> {
    await Promise.all(notifications.map((dto) => this.send(dto)));
    this.logger.log(`Sent ${notifications.length} bulk notifications`);
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultipleUsers(
    userIds: string[],
    notification: Omit<SendNotificationDto, 'userId'>,
  ): Promise<void> {
    const notifications = userIds.map((userId) => ({
      ...notification,
      userId,
    }));

    await this.sendBulk(notifications);
  }

  /**
   * Send broadcast notification to all users
   */
  async broadcast(notification: Omit<SendNotificationDto, 'userId'>): Promise<void> {
    // In production, this would send to all active users
    // For now, we'll just create the notification records
    this.logger.log(`Broadcasting notification: ${notification.title}`);

    // If using IN_APP channel, broadcast through WebSocket
    if (notification.channel === NotificationChannel.IN_APP) {
      await this.websocketService.broadcast('notification', {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata,
      });
    }
  }
}
