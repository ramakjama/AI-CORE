import { z } from 'zod';

/**
 * Common validators for Spanish market and international standards
 */
export const validators = {
  // Email validation
  email: z.string().email('Invalid email format'),

  // Phone validation (international format)
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),

  // UUID validation
  uuid: z.string().uuid('Invalid UUID'),

  // CUID validation (Collision-resistant Unique Identifier)
  cuid: z.string().cuid('Invalid CUID'),

  // URL validation
  url: z.string().url('Invalid URL'),

  // Strong password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),

  // Spanish NIF/NIE validation
  nif: z.string().regex(/^[0-9XYZ][0-9]{7}[A-Z]$/, 'Invalid Spanish NIF/NIE'),

  // Spanish CIF validation (companies)
  cif: z.string().regex(/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/, 'Invalid Spanish CIF'),

  // Spanish IBAN validation
  iban: z.string().regex(/^ES\d{22}$/, 'Invalid Spanish IBAN'),

  // Spanish postal code validation
  postalCode: z.string().regex(/^\d{5}$/, 'Invalid postal code'),

  // License plate validation (Spanish format)
  licensePlate: z.string().regex(/^[0-9]{4}[A-Z]{3}$/, 'Invalid Spanish license plate'),

  // VIN (Vehicle Identification Number)
  vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN'),

  // Currency code (ISO 4217)
  currency: z.string().length(3, 'Invalid currency code'),

  // Country code (ISO 3166-1 alpha-2)
  countryCode: z.string().length(2, 'Invalid country code'),

  // Percentage (0-100)
  percentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),

  // Positive number
  positiveNumber: z.number().positive('Must be a positive number'),

  // Non-negative number
  nonNegativeNumber: z.number().nonnegative('Must be a non-negative number'),

  // Date in the past
  pastDate: z.date().max(new Date(), 'Date must be in the past'),

  // Date in the future
  futureDate: z.date().min(new Date(), 'Date must be in the future'),
};

/**
 * Common transformers for data normalization
 */
export const transformers = {
  // Convert to lowercase
  toLowerCase: z.string().transform(s => s.toLowerCase()),

  // Convert to uppercase
  toUpperCase: z.string().transform(s => s.toUpperCase()),

  // Trim whitespace
  trim: z.string().transform(s => s.trim()),

  // Parse to number
  toNumber: z.string().transform(s => parseFloat(s)),

  // Parse to integer
  toInteger: z.string().transform(s => parseInt(s, 10)),

  // Parse to date
  toDate: z.string().transform(s => new Date(s)),

  // Parse to boolean
  toBoolean: z.string().transform(s => s === 'true' || s === '1'),

  // Normalize whitespace (multiple spaces to single)
  normalizeWhitespace: z.string().transform(s => s.replace(/\s+/g, ' ').trim()),

  // Remove special characters
  removeSpecialChars: z.string().transform(s => s.replace(/[^a-zA-Z0-9\s]/g, '')),
};

/**
 * Pagination schema for API requests
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type Pagination = z.infer<typeof paginationSchema>;

/**
 * Date range filter schema
 */
export const dateRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
}).refine(data => data.to >= data.from, {
  message: 'End date must be after or equal to start date',
  path: ['to'],
});

export type DateRange = z.infer<typeof dateRangeSchema>;

/**
 * Search filter schema
 */
export const searchSchema = z.object({
  query: z.string().min(1).max(200),
  fields: z.array(z.string()).optional(),
  exactMatch: z.boolean().default(false),
});

export type SearchFilter = z.infer<typeof searchSchema>;

/**
 * Create a standard API response wrapper
 */
export function createResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema,
    meta: z.object({
      timestamp: z.string().datetime(),
      correlationId: z.string().optional(),
      version: z.string().optional(),
    }).optional(),
  });
}

/**
 * Create a paginated response wrapper
 */
export function createPaginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    success: z.boolean(),
    data: z.array(itemSchema),
    meta: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
      hasMore: z.boolean(),
    }),
  });
}

/**
 * Create an error response schema
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({
      field: z.string(),
      message: z.string(),
      code: z.string().optional(),
    })).optional(),
  }),
  meta: z.object({
    timestamp: z.string().datetime(),
    correlationId: z.string().optional(),
  }).optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * Address schema (Spanish format)
 */
export const addressSchema = z.object({
  street: z.string().min(1).max(200),
  number: z.string().max(20).optional(),
  floor: z.string().max(20).optional(),
  door: z.string().max(20).optional(),
  postalCode: validators.postalCode,
  city: z.string().min(1).max(100),
  province: z.string().min(1).max(100),
  country: validators.countryCode.default('ES'),
});

export type Address = z.infer<typeof addressSchema>;

/**
 * Money amount schema (amount + currency)
 */
export const moneySchema = z.object({
  amount: validators.positiveNumber,
  currency: validators.currency.default('EUR'),
});

export type Money = z.infer<typeof moneySchema>;

/**
 * File upload schema
 */
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.string(),
  size: z.number().positive().max(10 * 1024 * 1024, 'File size must not exceed 10MB'),
  url: validators.url.optional(),
  buffer: z.instanceof(Buffer).optional(),
});

export type FileUpload = z.infer<typeof fileUploadSchema>;

/**
 * Coordinate schema (latitude, longitude)
 */
export const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type Coordinate = z.infer<typeof coordinateSchema>;

/**
 * Time range schema (HH:mm format)
 */
export const timeRangeSchema = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
});

export type TimeRange = z.infer<typeof timeRangeSchema>;

/**
 * Helper to create an enum schema with custom error message
 */
export function createEnumSchema<T extends [string, ...string[]]>(
  values: T,
  errorMessage?: string
) {
  return z.enum(values, {
    errorMap: () => ({
      message: errorMessage || `Must be one of: ${values.join(', ')}`
    }),
  });
}

/**
 * Helper to make all fields optional
 */
export function makeOptional<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.partial();
}

/**
 * Helper to make specific fields required
 */
export function makeRequired<T extends z.ZodRawShape, K extends keyof T>(
  schema: z.ZodObject<T>,
  keys: K[]
) {
  return schema.required(
    Object.fromEntries(keys.map(key => [key, true])) as Record<K, true>
  );
}
