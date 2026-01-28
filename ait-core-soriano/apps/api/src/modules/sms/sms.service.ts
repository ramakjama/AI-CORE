import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsOptions {
  to: string;
  message: string;
}

/**
 * SMS Service
 *
 * Handles SMS sending through Twilio, AWS SNS, or similar service.
 *
 * @service SmsService
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Send SMS
   */
  async send(options: SmsOptions): Promise<void> {
    try {
      // In production, implement actual SMS sending with Twilio or AWS SNS
      this.logger.log(`SMS sent to: ${options.to}`);
      this.logger.debug(`Message: ${options.message}`);

      // Implementation would use Twilio SDK:
      // const twilio = require('twilio');
      // const client = twilio(accountSid, authToken);
      // await client.messages.create({
      //   to: options.to,
      //   from: this.configService.get('TWILIO_PHONE_NUMBER'),
      //   body: options.message,
      // });
    } catch (error) {
      this.logger.error('Failed to send SMS:', error);
      throw error;
    }
  }

  /**
   * Send verification code
   */
  async sendVerificationCode(phone: string, code: string): Promise<void> {
    await this.send({
      to: phone,
      message: `Your verification code is: ${code}. Valid for 10 minutes.`,
    });
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(phone: string, amount: number, dueDate: Date): Promise<void> {
    await this.send({
      to: phone,
      message: `Payment reminder: $${amount} due on ${dueDate.toLocaleDateString()}`,
    });
  }

  /**
   * Send policy renewal reminder
   */
  async sendPolicyRenewalReminder(phone: string, policyNumber: string, renewalDate: Date): Promise<void> {
    await this.send({
      to: phone,
      message: `Your policy ${policyNumber} is due for renewal on ${renewalDate.toLocaleDateString()}`,
    });
  }
}
