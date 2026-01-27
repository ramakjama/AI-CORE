/**
 * Phone Formatter
 * E.164 phone number formatting and validation
 */

import {
  parsePhoneNumberFromString,
  parsePhoneNumber,
  isValidPhoneNumber,
  getCountryCallingCode,
  CountryCode,
  PhoneNumber,
  formatIncompletePhoneNumber,
  AsYouType,
  getExampleNumber,
  ParseError
} from 'libphonenumber-js';

export interface PhoneValidationResult {
  isValid: boolean;
  e164?: string;
  national?: string;
  international?: string;
  countryCode?: string;
  countryCallingCode?: string;
  type?: string;
  carrier?: string;
  errors?: string[];
}

export interface PhoneFormatOptions {
  defaultCountry?: CountryCode;
  format?: 'E164' | 'NATIONAL' | 'INTERNATIONAL' | 'RFC3966';
  strict?: boolean;
}

/**
 * Phone Formatter Class
 * Handles phone number formatting, validation, and parsing
 */
export class PhoneFormatter {
  private defaultCountry: CountryCode;

  constructor(defaultCountry: CountryCode = 'ES') {
    this.defaultCountry = defaultCountry;
  }

  /**
   * Parse and validate a phone number
   */
  parse(
    phoneNumber: string,
    options: PhoneFormatOptions = {}
  ): PhoneValidationResult {
    const country = options.defaultCountry || this.defaultCountry;

    try {
      const parsed = parsePhoneNumberFromString(phoneNumber, country);

      if (!parsed) {
        return {
          isValid: false,
          errors: ['Could not parse phone number']
        };
      }

      if (options.strict && !parsed.isValid()) {
        return {
          isValid: false,
          errors: ['Invalid phone number format']
        };
      }

      return {
        isValid: parsed.isValid(),
        e164: parsed.format('E.164'),
        national: parsed.formatNational(),
        international: parsed.formatInternational(),
        countryCode: parsed.country,
        countryCallingCode: parsed.countryCallingCode,
        type: parsed.getType()
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Parse error']
      };
    }
  }

  /**
   * Format phone number to E.164 format
   */
  toE164(phoneNumber: string, country?: CountryCode): string | null {
    try {
      const parsed = parsePhoneNumberFromString(
        phoneNumber,
        country || this.defaultCountry
      );
      return parsed?.format('E.164') || null;
    } catch {
      return null;
    }
  }

  /**
   * Format phone number to national format
   */
  toNational(phoneNumber: string, country?: CountryCode): string | null {
    try {
      const parsed = parsePhoneNumberFromString(
        phoneNumber,
        country || this.defaultCountry
      );
      return parsed?.formatNational() || null;
    } catch {
      return null;
    }
  }

  /**
   * Format phone number to international format
   */
  toInternational(phoneNumber: string, country?: CountryCode): string | null {
    try {
      const parsed = parsePhoneNumberFromString(
        phoneNumber,
        country || this.defaultCountry
      );
      return parsed?.formatInternational() || null;
    } catch {
      return null;
    }
  }

  /**
   * Validate if a phone number is valid
   */
  isValid(phoneNumber: string, country?: CountryCode): boolean {
    try {
      return isValidPhoneNumber(phoneNumber, country || this.defaultCountry);
    } catch {
      return false;
    }
  }

  /**
   * Check if phone number is a mobile number
   */
  isMobile(phoneNumber: string, country?: CountryCode): boolean {
    try {
      const parsed = parsePhoneNumberFromString(
        phoneNumber,
        country || this.defaultCountry
      );
      const type = parsed?.getType();
      return type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE';
    } catch {
      return false;
    }
  }

  /**
   * Check if phone number is a fixed line
   */
  isFixedLine(phoneNumber: string, country?: CountryCode): boolean {
    try {
      const parsed = parsePhoneNumberFromString(
        phoneNumber,
        country || this.defaultCountry
      );
      const type = parsed?.getType();
      return type === 'FIXED_LINE' || type === 'FIXED_LINE_OR_MOBILE';
    } catch {
      return false;
    }
  }

  /**
   * Get the phone number type
   */
  getType(phoneNumber: string, country?: CountryCode): string | null {
    try {
      const parsed = parsePhoneNumberFromString(
        phoneNumber,
        country || this.defaultCountry
      );
      return parsed?.getType() || null;
    } catch {
      return null;
    }
  }

  /**
   * Get country from phone number
   */
  getCountry(phoneNumber: string): CountryCode | null {
    try {
      const parsed = parsePhoneNumberFromString(phoneNumber);
      return parsed?.country || null;
    } catch {
      return null;
    }
  }

  /**
   * Get country calling code
   */
  getCallingCode(country: CountryCode): string | null {
    try {
      return getCountryCallingCode(country);
    } catch {
      return null;
    }
  }

  /**
   * Get example phone number for a country
   */
  getExample(country: CountryCode, type: 'MOBILE' | 'FIXED_LINE' = 'MOBILE'): string | null {
    try {
      // Using libphonenumber-js metadata
      const example = getExampleNumber(country, type as any);
      return example?.format('E.164') || null;
    } catch {
      return null;
    }
  }

  /**
   * Format as you type (for input fields)
   */
  formatAsYouType(input: string, country?: CountryCode): string {
    const formatter = new AsYouType(country || this.defaultCountry);
    return formatter.input(input);
  }

  /**
   * Normalize phone number (remove all non-digit characters except +)
   */
  normalize(phoneNumber: string): string {
    return phoneNumber.replace(/[^\d+]/g, '');
  }

  /**
   * Extract phone numbers from text
   */
  extractFromText(text: string, country?: CountryCode): string[] {
    const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
    const matches = text.match(phoneRegex) || [];

    return matches
      .map(match => this.toE164(match, country))
      .filter((e164): e164 is string => e164 !== null);
  }

  /**
   * Compare two phone numbers (check if they are the same)
   */
  areEqual(phone1: string, phone2: string, country?: CountryCode): boolean {
    const e164_1 = this.toE164(phone1, country);
    const e164_2 = this.toE164(phone2, country);

    if (!e164_1 || !e164_2) return false;
    return e164_1 === e164_2;
  }

  /**
   * Mask phone number for privacy (e.g., +34 *** *** 789)
   */
  mask(
    phoneNumber: string,
    visibleDigits: number = 3,
    maskChar: string = '*',
    country?: CountryCode
  ): string | null {
    const parsed = parsePhoneNumberFromString(
      phoneNumber,
      country || this.defaultCountry
    );

    if (!parsed) return null;

    const national = parsed.nationalNumber;
    const masked = national.slice(0, -visibleDigits).replace(/\d/g, maskChar) +
                   national.slice(-visibleDigits);

    return `+${parsed.countryCallingCode} ${masked}`;
  }

  /**
   * Validate phone number for SMS (must be mobile)
   */
  validateForSms(phoneNumber: string, country?: CountryCode): PhoneValidationResult {
    const result = this.parse(phoneNumber, {
      defaultCountry: country,
      strict: true
    });

    if (!result.isValid) {
      return result;
    }

    const type = this.getType(phoneNumber, country);

    if (type !== 'MOBILE' && type !== 'FIXED_LINE_OR_MOBILE') {
      return {
        ...result,
        isValid: false,
        errors: ['Phone number must be a mobile number for SMS']
      };
    }

    return result;
  }

  /**
   * Validate phone number for WhatsApp
   */
  validateForWhatsApp(phoneNumber: string, country?: CountryCode): PhoneValidationResult {
    // WhatsApp uses E.164 format and typically works with mobile numbers
    return this.validateForSms(phoneNumber, country);
  }

  /**
   * Validate phone number for voice calls
   */
  validateForVoice(phoneNumber: string, country?: CountryCode): PhoneValidationResult {
    return this.parse(phoneNumber, {
      defaultCountry: country,
      strict: true
    });
  }

  /**
   * Batch validate phone numbers
   */
  batchValidate(
    phoneNumbers: string[],
    country?: CountryCode
  ): Map<string, PhoneValidationResult> {
    const results = new Map<string, PhoneValidationResult>();

    for (const phone of phoneNumbers) {
      results.set(phone, this.parse(phone, { defaultCountry: country }));
    }

    return results;
  }

  /**
   * Batch convert to E.164
   */
  batchToE164(
    phoneNumbers: string[],
    country?: CountryCode
  ): Map<string, string | null> {
    const results = new Map<string, string | null>();

    for (const phone of phoneNumbers) {
      results.set(phone, this.toE164(phone, country));
    }

    return results;
  }

  /**
   * Set default country
   */
  setDefaultCountry(country: CountryCode): void {
    this.defaultCountry = country;
  }

  /**
   * Get default country
   */
  getDefaultCountry(): CountryCode {
    return this.defaultCountry;
  }
}

// Default instance with Spanish country code
export const phoneFormatter = new PhoneFormatter('ES');

// Convenience functions
export function toE164(phoneNumber: string, country?: CountryCode): string | null {
  return phoneFormatter.toE164(phoneNumber, country);
}

export function isValidPhone(phoneNumber: string, country?: CountryCode): boolean {
  return phoneFormatter.isValid(phoneNumber, country);
}

export function parsePhone(phoneNumber: string, country?: CountryCode): PhoneValidationResult {
  return phoneFormatter.parse(phoneNumber, { defaultCountry: country });
}
