/**
 * Validation utilities using Zod
 */

import { z } from 'zod';
import { REGEX_PATTERNS } from './constants';

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Spanish ID validations
  nif: z.string().regex(REGEX_PATTERNS.NIF, 'Invalid NIF format'),
  nie: z.string().regex(REGEX_PATTERNS.NIE, 'Invalid NIE format'),
  cif: z.string().regex(REGEX_PATTERNS.CIF, 'Invalid CIF format'),

  // Contact validations
  email: z.string().email('Invalid email address'),
  phoneES: z.string().regex(REGEX_PATTERNS.PHONE_ES, 'Invalid Spanish phone number'),

  // Financial validations
  iban: z.string().regex(REGEX_PATTERNS.IBAN, 'Invalid IBAN format'),

  // Address validations
  postalCodeES: z.string().regex(REGEX_PATTERNS.POSTAL_CODE_ES, 'Invalid Spanish postal code'),

  // Vehicle validations
  licensePlateES: z.string().regex(REGEX_PATTERNS.LICENSE_PLATE_ES, 'Invalid Spanish license plate'),

  // Generic validations
  uuid: z.string().uuid('Invalid UUID format'),
  url: z.string().url('Invalid URL format'),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonNegativeNumber: z.number().nonnegative('Must be a non-negative number'),
  dateString: z.string().datetime('Invalid date format'),

  // Pagination
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
};

/**
 * Spanish ID validator (NIF/NIE/CIF)
 */
export const validateSpanishId = (id: string): { valid: boolean; type: 'NIF' | 'NIE' | 'CIF' | null } => {
  const cleanId = id.toUpperCase().replace(/\s/g, '');

  if (REGEX_PATTERNS.NIF.test(cleanId)) {
    return { valid: validateNIF(cleanId), type: 'NIF' };
  }

  if (REGEX_PATTERNS.NIE.test(cleanId)) {
    return { valid: validateNIE(cleanId), type: 'NIE' };
  }

  if (REGEX_PATTERNS.CIF.test(cleanId)) {
    return { valid: validateCIF(cleanId), type: 'CIF' };
  }

  return { valid: false, type: null };
};

function validateNIF(nif: string): boolean {
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const number = parseInt(nif.substring(0, 8), 10);
  const letter = nif.charAt(8);
  return letters.charAt(number % 23) === letter;
}

function validateNIE(nie: string): boolean {
  const niePrefix: { [key: string]: string } = { X: '0', Y: '1', Z: '2' };
  const prefix = niePrefix[nie.charAt(0)];
  const numberPart = prefix + nie.substring(1, 8);
  const letter = nie.charAt(8);
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  return letters.charAt(parseInt(numberPart, 10) % 23) === letter;
}

function validateCIF(cif: string): boolean {
  const match = cif.match(/^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/);
  if (!match) return false;

  const type = match[1];
  const numbers = match[2];
  const control = match[3];

  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    const digit = parseInt(numbers[i], 10);
    if (i % 2 === 0) {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += digit;
    }
  }

  const lastDigit = sum % 10;
  const expectedDigit = lastDigit === 0 ? 0 : 10 - lastDigit;
  const expectedLetter = 'JABCDEFGHI'[expectedDigit];

  if (['N', 'P', 'Q', 'R', 'S', 'W'].includes(type)) {
    return control === expectedLetter;
  }

  return control === expectedDigit.toString() || control === expectedLetter;
}

/**
 * IBAN validator
 */
export const validateIBAN = (iban: string): boolean => {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();

  if (!/^ES\d{22}$/.test(cleanIban)) {
    return false;
  }

  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
  const numericIban = rearranged.replace(/[A-Z]/g, (char) =>
    (char.charCodeAt(0) - 55).toString()
  );

  let remainder = '';
  for (const digit of numericIban) {
    remainder = (parseInt(remainder + digit, 10) % 97).toString();
  }

  return parseInt(remainder, 10) === 1;
};

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: commonSchemas.page,
  limit: commonSchemas.limit,
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  { message: 'Start date must be before or equal to end date' }
);

export type DateRange = z.infer<typeof dateRangeSchema>;

/**
 * File upload schema
 */
export const fileUploadSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string(),
  size: z.number().positive(),
  buffer: z.instanceof(Buffer),
});

export type FileUpload = z.infer<typeof fileUploadSchema>;

/**
 * Search schema
 */
export const searchSchema = z.object({
  query: z.string().min(1),
  filters: z.record(z.unknown()).optional(),
  page: commonSchemas.page,
  limit: commonSchemas.limit,
});

export type SearchParams = z.infer<typeof searchSchema>;

/**
 * Utility to create enum validator
 */
export const createEnumValidator = <T extends readonly string[]>(values: T) => {
  return z.enum(values as [string, ...string[]]);
};

/**
 * Utility to validate and parse
 */
export const validateAndParse = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

export const validateAndParseSafe = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};
