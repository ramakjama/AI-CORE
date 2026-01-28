/**
 * @fileoverview Delivery Tracking Service
 * @module @ait-core/communications/services
 * @description Track message delivery, analytics, and performance
 */

import { PrismaClient } from '@prisma/client';
import {
  IMessage,
  IDeliveryResult,
  IAnalyticsData
} from '../interfaces/communication-provider.interface';
import { CommunicationChannel, DeliveryStatus } from '../interfaces/message.types';
import { Logger } from '../utils/logger';

export class DeliveryTrackingService {
  private prisma: PrismaClient;
  private logger: Logger;

  constructor() {
    this.prisma = new PrismaClient();
    this.logger = new Logger('DeliveryTrackingService');
  }

  /**
   * Track message delivery
   */
  async trackDelivery(
    message: IMessage,
    result: IDeliveryResult
  ): Promise<void> {
    try {
      await this.prisma.communicationLog.create({
        data: {
          id: result.messageId,
          channel: message.channel,
          recipient: Array.isArray(message.to) ? message.to.join(',') : message.to,
          subject: message.subject,
          content: message.content,
          status: result.status,
          providerId: result.providerId,
          metadata: result.metadata as any,
          templateId: message.templateId,
          priority: message.priority || 'NORMAL',
          sentAt: result.success ? new Date() : null,
          deliveredAt: result.status === 'DELIVERED' ? new Date() : null,
          failedAt: !result.success ? new Date() : null,
          error: result.error
        }
      });

      // Create event
      await this.prisma.communicationEvent.create({
        data: {
          communicationLogId: result.messageId,
          event: result.status,
          timestamp: result.timestamp,
          metadata: result.metadata as any
        }
      });

      this.logger.info(
        `Tracked delivery: ${result.messageId} - ${result.status}`
      );
    } catch (error) {
      this.logger.error('Failed to track delivery', error);
    }
  }

  /**
   * Update delivery status
   */
  async updateStatus(
    messageId: string,
    status: DeliveryStatus,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const updates: any = { status };

      switch (status) {
        case 'DELIVERED':
          updates.deliveredAt = new Date();
          break;
        case 'OPENED':
          updates.openedAt = new Date();
          updates.openCount = { increment: 1 };
          break;
        case 'CLICKED':
          updates.clickedAt = new Date();
          updates.clickCount = { increment: 1 };
          break;
        case 'BOUNCED':
          updates.bouncedAt = new Date();
          break;
        case 'FAILED':
          updates.failedAt = new Date();
          break;
      }

      await this.prisma.communicationLog.update({
        where: { id: messageId },
        data: updates
      });

      // Create event
      await this.prisma.communicationEvent.create({
        data: {
          communicationLogId: messageId,
          event: status,
          timestamp: new Date(),
          metadata: metadata as any
        }
      });

      this.logger.info(`Status updated: ${messageId} - ${status}`);
    } catch (error) {
      this.logger.error('Failed to update status', error);
    }
  }

  /**
   * Get message history
   */
  async getMessageHistory(messageId: string): Promise<any> {
    try {
      const log = await this.prisma.communicationLog.findUnique({
        where: { id: messageId },
        include: {
          events: {
            orderBy: { timestamp: 'asc' }
          }
        }
      });

      return log;
    } catch (error) {
      this.logger.error('Failed to get message history', error);
      return null;
    }
  }

  /**
   * Get analytics for channel
   */
  async getChannelAnalytics(
    channel: CommunicationChannel,
    startDate: Date,
    endDate: Date
  ): Promise<IAnalyticsData> {
    try {
      const logs = await this.prisma.communicationLog.findMany({
        where: {
          channel,
          sentAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const analytics: IAnalyticsData = {
        sent: 0,
        delivered: 0,
        failed: 0,
        bounced: 0,
        opened: 0,
        clicked: 0,
        unsubscribed: 0
      };

      for (const log of logs) {
        analytics.sent++;

        if (log.deliveredAt) analytics.delivered++;
        if (log.failedAt) analytics.failed++;
        if (log.bouncedAt) analytics.bounced++;
        if (log.openedAt) analytics.opened++;
        if (log.clickedAt) analytics.clicked++;
      }

      return analytics;
    } catch (error) {
      this.logger.error('Failed to get channel analytics', error);
      throw error;
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string): Promise<IAnalyticsData> {
    try {
      const logs = await this.prisma.communicationLog.findMany({
        where: {
          metadata: {
            path: ['campaignId'],
            equals: campaignId
          }
        }
      });

      const analytics: IAnalyticsData = {
        sent: logs.length,
        delivered: logs.filter(l => l.deliveredAt).length,
        failed: logs.filter(l => l.failedAt).length,
        bounced: logs.filter(l => l.bouncedAt).length,
        opened: logs.filter(l => l.openedAt).length,
        clicked: logs.filter(l => l.clickedAt).length,
        unsubscribed: 0
      };

      return analytics;
    } catch (error) {
      this.logger.error('Failed to get campaign analytics', error);
      throw error;
    }
  }

  /**
   * Get delivery rate
   */
  async getDeliveryRate(
    channel: CommunicationChannel,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const analytics = await this.getChannelAnalytics(channel, startDate, endDate);

      if (analytics.sent === 0) {
        return 0;
      }

      return (analytics.delivered / analytics.sent) * 100;
    } catch (error) {
      this.logger.error('Failed to get delivery rate', error);
      return 0;
    }
  }

  /**
   * Get open rate (email only)
   */
  async getOpenRate(startDate: Date, endDate: Date): Promise<number> {
    try {
      const analytics = await this.getChannelAnalytics('EMAIL', startDate, endDate);

      if (analytics.delivered === 0) {
        return 0;
      }

      return ((analytics.opened || 0) / analytics.delivered) * 100;
    } catch (error) {
      this.logger.error('Failed to get open rate', error);
      return 0;
    }
  }

  /**
   * Get click rate (email only)
   */
  async getClickRate(startDate: Date, endDate: Date): Promise<number> {
    try {
      const analytics = await this.getChannelAnalytics('EMAIL', startDate, endDate);

      if (analytics.delivered === 0) {
        return 0;
      }

      return ((analytics.clicked || 0) / analytics.delivered) * 100;
    } catch (error) {
      this.logger.error('Failed to get click rate', error);
      return 0;
    }
  }

  /**
   * Get top performing templates
   */
  async getTopTemplates(limit: number = 10): Promise<any[]> {
    try {
      const templates = await this.prisma.communicationLog.groupBy({
        by: ['templateId'],
        where: {
          templateId: { not: null }
        },
        _count: {
          id: true
        },
        _sum: {
          openCount: true,
          clickCount: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: limit
      });

      return templates;
    } catch (error) {
      this.logger.error('Failed to get top templates', error);
      return [];
    }
  }

  /**
   * Get failed messages
   */
  async getFailedMessages(
    channel?: CommunicationChannel,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const where: any = {
        status: 'FAILED'
      };

      if (channel) {
        where.channel = channel;
      }

      const failed = await this.prisma.communicationLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: limit
      });

      return failed;
    } catch (error) {
      this.logger.error('Failed to get failed messages', error);
      return [];
    }
  }

  /**
   * Clean old logs
   */
  async cleanOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.communicationLog.deleteMany({
        where: {
          sentAt: {
            lt: cutoffDate
          }
        }
      });

      this.logger.info(`Cleaned ${result.count} old logs`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to clean old logs', error);
      return 0;
    }
  }
}
