/**
 * @fileoverview Link Shortener Tests
 */

import { LinkShortener } from '../../providers/sms/twilio/link-shortener';

describe('LinkShortener', () => {
  let shortener: LinkShortener;

  beforeAll(() => {
    shortener = new LinkShortener();
  });

  describe('shortenLinks', () => {
    it('should shorten URLs in content', async () => {
      const content = 'Check this link: https://example.com/very-long-url';
      const shortened = await shortener.shortenLinks(content);

      expect(shortened).toContain('/s/');
      expect(shortened.length).toBeLessThan(content.length);
    });

    it('should handle multiple URLs', async () => {
      const content =
        'Link 1: https://example.com/url1 and Link 2: https://example.com/url2';
      const shortened = await shortener.shortenLinks(content);

      const matches = shortened.match(/\/s\/[a-z0-9]+/g);
      expect(matches).toHaveLength(2);
    });

    it('should return original content if no URLs', async () => {
      const content = 'No URLs here';
      const shortened = await shortener.shortenLinks(content);

      expect(shortened).toBe(content);
    });
  });
});
