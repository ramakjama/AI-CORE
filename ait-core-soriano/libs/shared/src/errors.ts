/**
 * Custom error classes for AIT-CORE
 */

import { ERROR_CODES, HTTP_STATUS } from './constants';

export interface ErrorDetails {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
  stack?: string;
}

/**
 * Base error class for all AIT-CORE errors
 */
export class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string = ERROR_CODES.INTERNAL_ERROR,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, details);
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication required', details?: unknown) {
    super(message, ERROR_CODES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED, details);
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends BaseError {
  constructor(message: string = 'Access denied', details?: unknown) {
    super(message, ERROR_CODES.FORBIDDEN, HTTP_STATUS.FORBIDDEN, details);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends BaseError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, ERROR_CODES.CONFLICT, HTTP_STATUS.CONFLICT, details);
  }
}

/**
 * Policy-specific errors
 */
export class PolicyNotFoundError extends NotFoundError {
  constructor(policyId: string) {
    super('Policy', policyId);
    this.code = ERROR_CODES.POLICY_NOT_FOUND;
  }
}

export class PolicyConflictError extends ConflictError {
  constructor(message: string = 'Policy already exists') {
    super(message);
    this.code = ERROR_CODES.POLICY_ALREADY_EXISTS;
  }
}

export class PolicyModificationError extends BaseError {
  constructor(message: string = 'Policy cannot be modified in current state') {
    super(message, ERROR_CODES.POLICY_CANNOT_BE_MODIFIED, HTTP_STATUS.BAD_REQUEST);
  }
}

/**
 * Claim-specific errors
 */
export class ClaimNotFoundError extends NotFoundError {
  constructor(claimId: string) {
    super('Claim', claimId);
    this.code = ERROR_CODES.CLAIM_NOT_FOUND;
  }
}

/**
 * Customer-specific errors
 */
export class CustomerNotFoundError extends NotFoundError {
  constructor(customerId: string) {
    super('Customer', customerId);
    this.code = ERROR_CODES.CUSTOMER_NOT_FOUND;
  }
}

/**
 * Payment error
 */
export class PaymentError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, ERROR_CODES.PAYMENT_FAILED, HTTP_STATUS.BAD_REQUEST, details);
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends BaseError {
  constructor(service: string, message: string, details?: unknown) {
    super(
      `External service error (${service}): ${message}`,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      HTTP_STATUS.BAD_GATEWAY,
      details
    );
  }
}

/**
 * Kafka error
 */
export class KafkaError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, ERROR_CODES.KAFKA_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR, details);
  }
}

/**
 * Database error
 */
export class DatabaseError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, ERROR_CODES.DATABASE_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR, details);
  }
}

/**
 * Error handler utility
 */
export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

export function formatError(error: unknown): ErrorDetails {
  if (isBaseError(error)) {
    return error.toJSON();
  }

  if (error instanceof Error) {
    return {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: error.message,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  return {
    code: ERROR_CODES.INTERNAL_ERROR,
    message: 'An unexpected error occurred',
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  };
}
