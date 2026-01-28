/**
 * @fileoverview SMS Controller
 * @module @ait-core/communications/controllers
 * @description REST API endpoints for SMS operations
 */

import { Request, Response } from 'express';
import { CommunicationOrchestrator } from '../services/communication-orchestrator.service';
import { ISmsMessage } from '../interfaces/communication-provider.interface';
import { Logger } from '../utils/logger';

export class SmsController {
  private orchestrator: CommunicationOrchestrator;
  private logger: Logger;

  constructor(orchestrator: CommunicationOrchestrator) {
    this.orchestrator = orchestrator;
    this.logger = new Logger('SmsController');
  }

  /**
   * Send single SMS
   */
  async sendSms(req: Request, res: Response): Promise<void> {
    try {
      const { to, content, shortenLinks, maxSegments, ...options } = req.body;

      const message: ISmsMessage = {
        to,
        content,
        channel: 'SMS',
        shortenLinks,
        maxSegments,
        ...options
      };

      const result = await this.orchestrator.sendMessage(message);

      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      this.logger.error('Failed to send SMS', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Send SMS with template
   */
  async sendTemplateSms(req: Request, res: Response): Promise<void> {
    try {
      const { to, templateId, data, ...options } = req.body;

      const message: ISmsMessage = {
        to,
        content: '',
        channel: 'SMS',
        templateId,
        templateData: data,
        ...options
      };

      const result = await this.orchestrator.sendMessage(message);

      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      this.logger.error('Failed to send template SMS', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Send OTP code
   */
  async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { to, code, expiresIn = 5 } = req.body;

      const message: ISmsMessage = {
        to,
        content: `Your verification code is: ${code}. Valid for ${expiresIn} minutes.`,
        channel: 'SMS',
        priority: 'HIGH'
      };

      const result = await this.orchestrator.sendMessage(message);

      res.status(result.success ? 200 : 500).json(result);
    } catch (error: any) {
      this.logger.error('Failed to send OTP SMS', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Validate phone number
   */
  async validatePhone(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber } = req.body;

      // Validate phone number
      // const isValid = await smsProvider.validatePhoneNumber(phoneNumber);

      res.json({
        phoneNumber,
        valid: true // Placeholder
      });
    } catch (error: any) {
      this.logger.error('Failed to validate phone number', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle Twilio webhook
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;

      this.logger.info('Received Twilio webhook', {
        MessageSid,
        MessageStatus,
        ErrorCode
      });

      // Update message status
      // await trackingService.updateStatus(MessageSid, MessageStatus);

      res.status(200).send('OK');
    } catch (error) {
      this.logger.error('Failed to handle Twilio webhook', error);
      res.status(500).send('Error');
    }
  }
}
