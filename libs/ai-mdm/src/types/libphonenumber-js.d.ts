/**
 * Type declarations for libphonenumber-js
 * These are minimal declarations for the functions used in this project
 */

declare module 'libphonenumber-js' {
  export type CountryCode = string;

  export class ParseError extends Error {
    constructor(message?: string);
  }

  export interface PhoneNumber {
    country?: CountryCode;
    countryCallingCode: string;
    nationalNumber: string;
    isValid(): boolean;
    getType(): string | undefined;
    format(format: 'E.164' | 'INTERNATIONAL' | 'NATIONAL' | 'RFC3966'): string;
    formatNational(): string;
    formatInternational(): string;
  }

  export function parsePhoneNumber(
    text: string,
    defaultCountry?: CountryCode
  ): PhoneNumber | undefined;

  export function isValidPhoneNumber(
    text: string,
    defaultCountry?: CountryCode
  ): boolean;

  export function getCountryCallingCode(country: CountryCode): string;
}
