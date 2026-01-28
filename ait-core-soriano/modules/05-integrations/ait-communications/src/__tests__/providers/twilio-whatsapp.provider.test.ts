/**
 * @fileoverview Twilio WhatsApp Provider Tests
 */

import { TwilioWhatsAppProvider } from '../../providers/whatsapp/twilio/twilio-whatsapp.provider';
import { IWhatsAppMessage } from '../../interfaces/communication-provider.interface';

describe('TwilioWhatsAppProvider', () => {
  let provider: TwilioWhatsAppProvider;

  beforeAll(() => {
    provider = new TwilioWhatsAppProvider(
      'test_account_sid',
      'test_auth_token',
      'whatsapp:+34123456789'
    );
  });

  describe('validateMessage', () => {
    it('should validate a correct WhatsApp message', async () => {
      const message: IWhatsAppMessage = {
        to: '+34987654321',
        content: 'Test WhatsApp message',
        channel: 'WHATSAPP'
      };

      const isValid = await provider.validateMessage(message);
      expect(isValid).toBe(true);
    });

    it('should validate message with media', async () => {
      const message: IWhatsAppMessage = {
        to: '+34987654321',
        content: 'Check this image',
        channel: 'WHATSAPP',
        mediaUrl: 'https://example.com/image.jpg',
        mediaType: 'image'
      };

      const isValid = await provider.validateMessage(message);
      expect(isValid).toBe(true);
    });

    it('should throw error for missing content and media', async () => {
      const message: IWhatsAppMessage = {
        to: '+34987654321',
        content: '',
        channel: 'WHATSAPP'
      };

      await expect(provider.validateMessage(message)).rejects.toThrow(
        'Content or media is required'
      );
    });

    it('should throw error for media without type', async () => {
      const message: IWhatsAppMessage = {
        to: '+34987654321',
        content: '',
        channel: 'WHATSAPP',
        mediaUrl: 'https://example.com/file.pdf'
      };

      await expect(provider.validateMessage(message)).rejects.toThrow(
        'Media type is required when sending media'
      );
    });

    it('should validate message with buttons', async () => {
      const message: IWhatsAppMessage = {
        to: '+34987654321',
        content: 'Choose an option',
        channel: 'WHATSAPP',
        buttons: [
          { type: 'reply', title: 'Yes', payload: 'yes' },
          { type: 'reply', title: 'No', payload: 'no' }
        ]
      };

      const isValid = await provider.validateMessage(message);
      expect(isValid).toBe(true);
    });
  });

  describe('channel', () => {
    it('should have WHATSAPP channel', () => {
      expect(provider.channel).toBe('WHATSAPP');
    });

    it('should have correct name', () => {
      expect(provider.name).toBe('Twilio WhatsApp');
    });
  });
});
