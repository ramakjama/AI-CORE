/**
 * Error Handler Utilities
 * Robust error handling for AI expert operations
 */

export class ExpertError extends Error {
  constructor(
    message: string,
    public code: string,
    public expertName?: string,
    public details?: any,
    public isRetryable: boolean = false,
  ) {
    super(message);
    this.name = 'ExpertError';
    Object.setPrototypeOf(this, ExpertError.prototype);
  }
}

export class RateLimitError extends ExpertError {
  constructor(expertName: string, retryAfter?: number) {
    super(
      `Rate limit exceeded for expert: ${expertName}`,
      'RATE_LIMIT_EXCEEDED',
      expertName,
      { retryAfter },
      true,
    );
    this.name = 'RateLimitError';
  }
}

export class APIError extends ExpertError {
  constructor(message: string, statusCode?: number, expertName?: string) {
    super(
      message,
      'API_ERROR',
      expertName,
      { statusCode },
      statusCode ? statusCode >= 500 : false,
    );
    this.name = 'APIError';
  }
}

export class TimeoutError extends ExpertError {
  constructor(expertName: string, timeout: number) {
    super(
      `Request timeout after ${timeout}ms for expert: ${expertName}`,
      'TIMEOUT',
      expertName,
      { timeout },
      true,
    );
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends ExpertError {
  constructor(message: string, expertName?: string, details?: any) {
    super(message, 'VALIDATION_ERROR', expertName, details, false);
    this.name = 'ValidationError';
  }
}

export class CacheError extends ExpertError {
  constructor(message: string, details?: any) {
    super(message, 'CACHE_ERROR', undefined, details, false);
    this.name = 'CacheError';
  }
}

/**
 * Error handler utility functions
 */
export class ErrorHandler {
  /**
   * Handle errors and convert them to ExpertError instances
   */
  static handleError(error: any, expertName?: string): ExpertError {
    if (error instanceof ExpertError) {
      return error;
    }

    if (error.name === 'AbortError') {
      return new TimeoutError(expertName || 'unknown', 0);
    }

    if (error.status === 429 || error.error?.type === 'rate_limit_error') {
      return new RateLimitError(expertName || 'unknown', error.error?.retry_after);
    }

    if (error.status >= 500) {
      return new APIError(
        error.message || 'Internal server error',
        error.status,
        expertName,
      );
    }

    if (error.status >= 400) {
      return new ValidationError(
        error.message || 'Bad request',
        expertName,
        error.error,
      );
    }

    return new ExpertError(
      error.message || 'Unknown error occurred',
      'UNKNOWN_ERROR',
      expertName,
      error,
      false,
    );
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: Error): boolean {
    if (error instanceof ExpertError) {
      return error.isRetryable;
    }
    return false;
  }

  /**
   * Get retry delay based on error and attempt number
   */
  static getRetryDelay(error: Error, attempt: number, baseDelay: number, multiplier: number): number {
    if (error instanceof RateLimitError && error.details?.retryAfter) {
      return error.details.retryAfter * 1000;
    }

    return baseDelay * Math.pow(multiplier, attempt);
  }

  /**
   * Create error response
   */
  static createErrorResponse(error: Error, expertName: string) {
    const expertError = this.handleError(error, expertName);

    return {
      success: false,
      error: {
        code: expertError.code,
        message: expertError.message,
        details: expertError.details,
      },
      metadata: {
        expertName,
        model: 'unknown',
        timestamp: new Date(),
        responseTime: 0,
        cached: false,
      },
    };
  }
}
