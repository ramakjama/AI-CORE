/**
 * @fileoverview Resend Email Provider Tests
 */

import { ResendProvider } from '../../providers/email/resend/resend.provider';
import { IEmailMessage } from '../../interfaces/communication-provider.interface';

describe('ResendProvider', () => {
  let provider: ResendProvider;

  beforeAll(() => {
    process.env.RESEND_API_KEY = 'test_api_key';
    process.env.RESEND_FROM_EMAIL = 'test@sorianomediadores.com';
    provider = new ResendProvider(process.env.RESEND_API_KEY);
  });

  describe('validateMessage', () => {
    it('should validate a correct email message', async () => {
      const message: IEmailMessage = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        content: 'Test content',
        channel: 'EMAIL'
      };

      const isValid = await provider.validateMessage(message);
      expect(isValid).toBe(true);
    });

    it('should throw error for missing recipient', async () => {
      const message: IEmailMessage = {
        to: '',
        subject: 'Test Email',
        content: 'Test content',
        channel: 'EMAIL'
      };

      await expect(provider.validateMessage(message)).rejects.toThrow(
        'Recipient is required'
      );
    });

    it('should throw error for missing subject', async () => {
      const message: IEmailMessage = {
        to: 'recipient@example.com',
        subject: '',
        content: 'Test content',
        channel: 'EMAIL'
      };

      await expect(provider.validateMessage(message)).rejects.toThrow(
        'Subject is required'
      );
    });

    it('should throw error for invalid email address', async () => {
      const message: IEmailMessage = {
        to: 'invalid-email',
        subject: 'Test Email',
        content: 'Test content',
        channel: 'EMAIL'
      };

      await expect(provider.validateMessage(message)).rejects.toThrow(
        'Invalid email address'
      );
    });

    it('should accept multiple valid recipients', async () => {
      const message: IEmailMessage = {
        to: ['recipient1@example.com', 'recipient2@example.com'],
        subject: 'Test Email',
        content: 'Test content',
        channel: 'EMAIL'
      };

      const isValid = await provider.validateMessage(message);
      expect(isValid).toBe(true);
    });
  });

  describe('channel', () => {
    it('should have EMAIL channel', () => {
      expect(provider.channel).toBe('EMAIL');
    });

    it('should have correct name', () => {
      expect(provider.name).toBe('Resend');
    });
  });
});
