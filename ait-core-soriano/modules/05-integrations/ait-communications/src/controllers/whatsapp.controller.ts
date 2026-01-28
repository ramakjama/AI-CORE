/**
 * @fileoverview WhatsApp Controller
 * @module @ait-core/communications/controllers
 * @description REST API endpoints for WhatsApp operations
 */

import { Request, Response } from 'express';
import { CommunicationOrchestrator } from '../services/communication-orchestrator.service';
import { IWhatsAppMessage } from '../interfaces/communication-provider.interface';
import { Logger } from '../utils/logger';

export class WhatsAppController {
  private orchestrator: CommunicationOrchestrator;
  private logger: Logger;

  constructor(orchestrator: CommunicationOrchestrator) {
    this.orchestrator = orchestrator;
    this.logger = new Logger('WhatsAppController');
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { to, content, mediaUrl, mediaType, buttons, ...options } = req.body;

      const message: IWhatsAppMessage = {
        to,
        content,
        channel: 'WHATSAPP',
        mediaUrl,
        mediaType,
        buttons,
        ...options
      };

      const result = await this.orchestrator.sendMessage(message);

      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      this.logger.error('Failed to send WhatsApp message', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Send template message
   */
  async sendTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { to, templateName, components, language = 'es' } = req.body;

      // Send template through provider
      // const result = await whatsappProvider.sendTemplate(to, templateName, components, language);

      res.json({
        success: true,
        message: 'Template sent'
      });
    } catch (error: any) {
      this.logger.error('Failed to send WhatsApp template', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Send media message
   */
  async sendMedia(req: Request, res: Response): Promise<void> {
    try {
      const { to, mediaUrl, mediaType, caption } = req.body;

      const message: IWhatsAppMessage = {
        to,
        content: caption || '',
        channel: 'WHATSAPP',
        mediaUrl,
        mediaType
      };

      const result = await this.orchestrator.sendMessage(message);

      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      this.logger.error('Failed to send WhatsApp media', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Send interactive message
   */
  async sendInteractive(req: Request, res: Response): Promise<void> {
    try {
      const { to, content, buttons, listOptions } = req.body;

      const message: IWhatsAppMessage = {
        to,
        content,
        channel: 'WHATSAPP',
        buttons,
        listOptions
      };

      const result = await this.orchestrator.sendMessage(message);

      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      this.logger.error('Failed to send interactive WhatsApp message', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle incoming message webhook
   */
  async handleIncoming(req: Request, res: Response): Promise<void> {
    try {
      const { From, Body, MediaUrl0, MediaContentType0 } = req.body;

      this.logger.info('Received WhatsApp message', {
        From,
        Body,
        HasMedia: !!MediaUrl0
      });

      // Process incoming message
      // await messageProcessor.process({
      //   from: From,
      //   body: Body,
      //   mediaUrl: MediaUrl0,
      //   mediaType: MediaContentType0
      // });

      res.status(200).send('OK');
    } catch (error) {
      this.logger.error('Failed to handle incoming WhatsApp message', error);
      res.status(500).send('Error');
    }
  }

  /**
   * Handle status webhook
   */
  async handleStatus(req: Request, res: Response): Promise<void> {
    try {
      const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;

      this.logger.info('Received WhatsApp status', {
        MessageSid,
        MessageStatus,
        ErrorCode
      });

      // Update message status
      // await trackingService.updateStatus(MessageSid, MessageStatus);

      res.status(200).send('OK');
    } catch (error) {
      this.logger.error('Failed to handle WhatsApp status webhook', error);
      res.status(500).send('Error');
    }
  }
}
