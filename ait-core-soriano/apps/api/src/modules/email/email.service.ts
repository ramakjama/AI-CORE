import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Email Service
 *
 * Handles email sending through SMTP or email service provider.
 * In production, integrate with SendGrid, AWS SES, or similar service.
 *
 * @service EmailService
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Send email
   */
  async send(options: EmailOptions): Promise<void> {
    try {
      // In production, implement actual email sending
      // For now, just log the email details
      this.logger.log(`Email sent to: ${options.to}`);
      this.logger.debug(`Subject: ${options.subject}`);

      // Implementation would use nodemailer, SendGrid, AWS SES, etc.
      // Example with nodemailer:
      // const transporter = nodemailer.createTransport({...});
      // await transporter.sendMail({
      //   from: this.configService.get('SMTP_FROM'),
      //   to: options.to,
      //   subject: options.subject,
      //   text: options.text,
      //   html: options.html,
      // });
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send template-based email
   */
  async sendTemplate(
    templateName: string,
    to: string | string[],
    data: Record<string, any>,
  ): Promise<void> {
    // Load template and replace variables
    const subject = this.getTemplateSubject(templateName);
    const html = this.renderTemplate(templateName, data);

    await this.send({ to, subject, html });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    await this.sendTemplate('password-reset', email, {
      resetToken,
      resetUrl: `${this.configService.get('APP_URL')}/reset-password?token=${resetToken}`,
    });
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string, verificationToken: string): Promise<void> {
    await this.sendTemplate('email-verification', email, {
      verificationToken,
      verificationUrl: `${this.configService.get('APP_URL')}/verify-email?token=${verificationToken}`,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcome(email: string, name: string): Promise<void> {
    await this.sendTemplate('welcome', email, { name });
  }

  private getTemplateSubject(templateName: string): string {
    const subjects: Record<string, string> = {
      'password-reset': 'Reset Your Password',
      'email-verification': 'Verify Your Email',
      'welcome': 'Welcome to AIT-CORE',
      'policy-issued': 'Your Insurance Policy Has Been Issued',
      'claim-submitted': 'Your Claim Has Been Submitted',
      'payment-received': 'Payment Received - Thank You',
    };
    return subjects[templateName] || 'Notification';
  }

  private renderTemplate(templateName: string, data: Record<string, any>): string {
    // In production, use a templating engine like Handlebars, EJS, or Pug
    // For now, return a simple HTML template
    return `
      <html>
        <body>
          <h1>${templateName}</h1>
          <p>${JSON.stringify(data)}</p>
        </body>
      </html>
    `;
  }
}
