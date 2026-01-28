/**
 * @fileoverview Link Shortener Service
 * @module @ait-core/communications/providers/sms/twilio
 * @description Shorten URLs in SMS messages to save characters
 */

import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../../../utils/logger';

export class LinkShortener {
  private prisma: PrismaClient;
  private logger: Logger;
  private baseUrl: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.logger = new Logger('LinkShortener');
    this.baseUrl = process.env.APP_URL || 'https://sorianomediadores.com';
  }

  /**
   * Shorten all URLs in content
   */
  async shortenLinks(content: string): Promise<string> {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);

    if (!urls || urls.length === 0) {
      return content;
    }

    let shortenedContent = content;

    for (const url of urls) {
      try {
        const shortUrl = await this.shortenUrl(url);
        shortenedContent = shortenedContent.replace(url, shortUrl);
      } catch (error) {
        this.logger.error(`Failed to shorten URL: ${url}`, error);
      }
    }

    return shortenedContent;
  }

  /**
   * Shorten a single URL
   */
  async shortenUrl(originalUrl: string): Promise<string> {
    try {
      // Check if URL already exists
      const existing = await this.prisma.shortenedUrl.findUnique({
        where: { originalUrl }
      });

      if (existing) {
        return `${this.baseUrl}/s/${existing.shortCode}`;
      }

      // Generate short code
      const shortCode = this.generateShortCode(originalUrl);

      // Store in database
      await this.prisma.shortenedUrl.create({
        data: {
          shortCode,
          originalUrl,
          createdAt: new Date()
        }
      });

      return `${this.baseUrl}/s/${shortCode}`;
    } catch (error) {
      this.logger.error('Failed to shorten URL', error);
      throw error;
    }
  }

  /**
   * Resolve short URL to original
   */
  async resolveUrl(shortCode: string): Promise<string | null> {
    try {
      const url = await this.prisma.shortenedUrl.findUnique({
        where: { shortCode }
      });

      if (!url) {
        return null;
      }

      // Track click
      await this.prisma.shortenedUrl.update({
        where: { shortCode },
        data: {
          clicks: { increment: 1 },
          lastClickedAt: new Date()
        }
      });

      return url.originalUrl;
    } catch (error) {
      this.logger.error('Failed to resolve URL', error);
      return null;
    }
  }

  /**
   * Generate short code
   */
  private generateShortCode(url: string): string {
    const hash = createHash('md5').update(url).digest('hex');
    return hash.substring(0, 7);
  }

  /**
   * Get link statistics
   */
  async getStatistics(shortCode: string): Promise<any> {
    try {
      const url = await this.prisma.shortenedUrl.findUnique({
        where: { shortCode }
      });

      if (!url) {
        return null;
      }

      return {
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        clicks: url.clicks,
        createdAt: url.createdAt,
        lastClickedAt: url.lastClickedAt
      };
    } catch (error) {
      this.logger.error('Failed to get link statistics', error);
      return null;
    }
  }
}
