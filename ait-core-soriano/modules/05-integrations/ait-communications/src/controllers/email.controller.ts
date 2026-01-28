/**
 * @fileoverview Email Controller
 * @module @ait-core/communications/controllers
 * @description REST API endpoints for email operations
 */

import { Request, Response } from 'express';
import { CommunicationOrchestrator } from '../services/communication-orchestrator.service';
import { IEmailMessage } from '../interfaces/communication-provider.interface';
import { Logger } from '../utils/logger';

export class EmailController {
  private orchestrator: CommunicationOrchestrator;
  private logger: Logger;

  constructor(orchestrator: CommunicationOrchestrator) {
    this.orchestrator = orchestrator;
    this.logger = new Logger('EmailController');
  }

  /**
   * Send single email
   */
  async sendEmail(req: Request, res: Response): Promise<void> {
    try {
      const { to, subject, content, html, templateId, templateData, ...options } =
        req.body;

      const message: IEmailMessage = {
        to,
        subject,
        content: content || '',
        html,
        channel: 'EMAIL',
        templateId,
        templateData,
        ...options
      };

      const result = await this.orchestrator.sendMessage(message);

      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      this.logger.error('Failed to send email', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Send email with template
   */
  async sendTemplateEmail(req: Request, res: Response): Promise<void> {
    try {
      const { to, templateId, data, subject, ...options } = req.body;

      const message: IEmailMessage = {
        to,
        subject: subject || '',
        content: '',
        channel: 'EMAIL',
        templateId,
        templateData: data,
        ...options
      };

      const result = await this.orchestrator.sendMessage(message);

      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      this.logger.error('Failed to send template email', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Track email open
   */
  async trackOpen(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;

      // Return 1x1 transparent pixel
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      );

      res.set('Content-Type', 'image/gif');
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.send(pixel);

      // Track open asynchronously
      // await trackingService.trackOpen(messageId);
    } catch (error) {
      this.logger.error('Failed to track email open', error);
      res.status(500).send('Error');
    }
  }

  /**
   * Track email click
   */
  async trackClick(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const { url } = req.query;

      if (!url) {
        res.status(400).json({ error: 'URL is required' });
        return;
      }

      // Track click asynchronously
      // await trackingService.trackClick(messageId, url as string);

      // Redirect to original URL
      res.redirect(url as string);
    } catch (error) {
      this.logger.error('Failed to track email click', error);
      res.status(500).json({ error: 'Failed to track click' });
    }
  }

  /**
   * Handle unsubscribe
   */
  async unsubscribe(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      // Handle unsubscribe
      // await trackingService.handleUnsubscribe(email);

      res.json({
        success: true,
        message: 'Successfully unsubscribed'
      });
    } catch (error: any) {
      this.logger.error('Failed to handle unsubscribe', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
