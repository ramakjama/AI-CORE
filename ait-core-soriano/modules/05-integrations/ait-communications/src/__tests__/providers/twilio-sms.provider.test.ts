/**
 * @fileoverview Twilio SMS Provider Tests
 */

import { TwilioSmsProvider } from '../../providers/sms/twilio/twilio-sms.provider';
import { ISmsMessage } from '../../interfaces/communication-provider.interface';

describe('TwilioSmsProvider', () => {
  let provider: TwilioSmsProvider;

  beforeAll(() => {
    provider = new TwilioSmsProvider(
      'test_account_sid',
      'test_auth_token',
      '+34123456789'
    );
  });

  describe('validateMessage', () => {
    it('should validate a correct SMS message', async () => {
      const message: ISmsMessage = {
        to: '+34987654321',
        content: 'Test SMS',
        channel: 'SMS'
      };

      const isValid = await provider.validateMessage(message);
      expect(isValid).toBe(true);
    });

    it('should throw error for missing recipient', async () => {
      const message: ISmsMessage = {
        to: '',
        content: 'Test SMS',
        channel: 'SMS'
      };

      await expect(provider.validateMessage(message)).rejects.toThrow(
        'Recipient is required'
      );
    });

    it('should throw error for empty content', async () => {
      const message: ISmsMessage = {
        to: '+34987654321',
        content: '',
        channel: 'SMS'
      };

      await expect(provider.validateMessage(message)).rejects.toThrow(
        'Content cannot be empty'
      );
    });

    it('should throw error for invalid phone format', async () => {
      const message: ISmsMessage = {
        to: '123456',
        content: 'Test SMS',
        channel: 'SMS'
      };

      await expect(provider.validateMessage(message)).rejects.toThrow(
        'Invalid phone number format'
      );
    });
  });

  describe('getSegmentsCount', () => {
    it('should calculate single segment for short message', () => {
      const content = 'This is a short message';
      const segments = provider.getSegmentsCount(content);
      expect(segments).toBe(1);
    });

    it('should calculate multiple segments for long message', () => {
      const content = 'a'.repeat(200);
      const segments = provider.getSegmentsCount(content);
      expect(segments).toBeGreaterThan(1);
    });

    it('should handle Unicode characters correctly', () => {
      const content = 'Mensaje con emojis 😀🎉';
      const segments = provider.getSegmentsCount(content);
      expect(segments).toBeGreaterThanOrEqual(1);
    });
  });

  describe('channel', () => {
    it('should have SMS channel', () => {
      expect(provider.channel).toBe('SMS');
    });

    it('should have correct name', () => {
      expect(provider.name).toBe('Twilio SMS');
    });
  });
});
