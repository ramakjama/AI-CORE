/**
 * @fileoverview Email Tracking Service
 * @module @ait-core/communications/providers/email/resend
 * @description Track email opens, clicks, bounces, and unsubscribes
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../../../utils/logger';

export class EmailTracker {
  private prisma: PrismaClient;
  private logger: Logger;

  constructor() {
    this.prisma = new PrismaClient();
    this.logger = new Logger('EmailTracker');
  }

  /**
   * Track email open
   */
  async trackOpen(messageId: string): Promise<void> {
    try {
      await this.prisma.communicationLog.update({
        where: { id: messageId },
        data: {
          openedAt: new Date(),
          openCount: { increment: 1 },
          status: 'OPENED'
        }
      });

      await this.prisma.communicationEvent.create({
        data: {
          communicationLogId: messageId,
          event: 'OPENED',
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Failed to track email open', error);
    }
  }

  /**
   * Track email click
   */
  async trackClick(messageId: string, url: string): Promise<void> {
    try {
      await this.prisma.communicationLog.update({
        where: { id: messageId },
        data: {
          clickedAt: new Date(),
          clickCount: { increment: 1 },
          status: 'CLICKED'
        }
      });

      await this.prisma.communicationEvent.create({
        data: {
          communicationLogId: messageId,
          event: 'CLICKED',
          timestamp: new Date(),
          metadata: { url }
        }
      });
    } catch (error) {
      this.logger.error('Failed to track email click', error);
    }
  }

  /**
   * Record bounce
   */
  async recordBounce(email: string, reason: string): Promise<void> {
    try {
      await this.prisma.emailBounce.create({
        data: {
          email,
          reason,
          timestamp: new Date()
        }
      });

      // Mark email as bounced in communication log
      await this.prisma.communicationLog.updateMany({
        where: {
          recipient: email,
          status: { not: 'BOUNCED' }
        },
        data: {
          status: 'BOUNCED',
          bouncedAt: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Failed to record bounce', error);
    }
  }

  /**
   * Record unsubscribe
   */
  async recordUnsubscribe(email: string, reason?: string): Promise<void> {
    try {
      await this.prisma.unsubscribe.upsert({
        where: { email },
        create: {
          email,
          reason,
          timestamp: new Date()
        },
        update: {
          timestamp: new Date(),
          reason
        }
      });

      this.logger.info(`Unsubscribe recorded: ${email}`);
    } catch (error) {
      this.logger.error('Failed to record unsubscribe', error);
    }
  }

  /**
   * Check if email is unsubscribed
   */
  async isUnsubscribed(email: string): Promise<boolean> {
    try {
      const unsubscribe = await this.prisma.unsubscribe.findUnique({
        where: { email }
      });

      return !!unsubscribe;
    } catch (error) {
      this.logger.error('Failed to check unsubscribe status', error);
      return false;
    }
  }

  /**
   * Check if email has bounced
   */
  async hasBounced(email: string): Promise<boolean> {
    try {
      const bounce = await this.prisma.emailBounce.findFirst({
        where: { email },
        orderBy: { timestamp: 'desc' }
      });

      return !!bounce;
    } catch (error) {
      this.logger.error('Failed to check bounce status', error);
      return false;
    }
  }

  /**
   * Get email statistics
   */
  async getStatistics(messageId: string): Promise<any> {
    try {
      const log = await this.prisma.communicationLog.findUnique({
        where: { id: messageId },
        include: {
          events: true
        }
      });

      if (!log) {
        return null;
      }

      return {
        sent: true,
        delivered: log.deliveredAt !== null,
        opened: log.openedAt !== null,
        clicked: log.clickedAt !== null,
        bounced: log.bouncedAt !== null,
        openCount: log.openCount,
        clickCount: log.clickCount,
        events: log.events
      };
    } catch (error) {
      this.logger.error('Failed to get email statistics', error);
      return null;
    }
  }
}
